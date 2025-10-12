#!/usr/bin/env node

import admin from 'firebase-admin';
import ytdl from '@distube/ytdl-core';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

// ES module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

// Set FFmpeg path
ffmpeg.setFfmpegPath(ffmpegStatic);

// Initialize Firebase Admin
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
});

const db = admin.firestore();
const storage = admin.storage();

// Configuration
const POLL_INTERVAL = (parseInt(process.env.POLL_INTERVAL_SECONDS) || 30) * 1000; // Convert to ms
const MAX_CONCURRENT_JOBS = parseInt(process.env.MAX_CONCURRENT_JOBS) || 1;

let currentlyProcessing = 0;
let isShuttingDown = false;

console.log('🚀 Local Video Processor Started');
console.log(`📊 Poll interval: ${POLL_INTERVAL / 1000}s`);
console.log(`⚙️  Max concurrent jobs: ${MAX_CONCURRENT_JOBS}`);
console.log(`🗄️  Storage bucket: ${process.env.FIREBASE_STORAGE_BUCKET}`);
console.log('');

/**
 * Extract video ID from YouTube URL
 */
function extractVideoId(url) {
  const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

/**
 * Download video using ytdl-core
 */
async function downloadVideo(youtubeUrl, outputPath) {
  return new Promise((resolve, reject) => {
    const videoId = extractVideoId(youtubeUrl);
    if (!videoId) {
      reject(new Error('Invalid YouTube URL'));
      return;
    }

    console.log(`  📥 Downloading video: ${videoId}`);

    const stream = ytdl(videoId, {
      quality: 'highest',
      filter: (format) => format.hasVideo && format.hasAudio,
    });

    const writeStream = fs.createWriteStream(outputPath);
    let downloadedBytes = 0;

    stream.on('info', (info, format) => {
      const totalMB = (format.contentLength / 1024 / 1024).toFixed(2);
      console.log(`  📊 Size: ${totalMB} MB, Quality: ${format.quality}`);
    });

    stream.on('progress', (chunkLength, downloaded, total) => {
      downloadedBytes = downloaded;
      const percent = ((downloaded / total) * 100).toFixed(1);
      // Only log every 10%
      if (parseInt(percent) % 10 === 0 && parseInt(percent) !== 0) {
        process.stdout.write(`\r  ⏳ Progress: ${percent}%`);
      }
    });

    stream.on('error', (error) => {
      reject(new Error(`Download failed: ${error.message}`));
    });

    writeStream.on('error', (error) => {
      reject(new Error(`Write failed: ${error.message}`));
    });

    writeStream.on('finish', () => {
      const fileSizeMB = (downloadedBytes / 1024 / 1024).toFixed(2);
      console.log(`\n  ✅ Downloaded: ${fileSizeMB} MB`);
      resolve();
    });

    stream.pipe(writeStream);
  });
}

/**
 * Trim video using FFmpeg
 */
async function trimVideo(inputPath, outputPath, startTime, endTime) {
  return new Promise((resolve, reject) => {
    const duration = endTime - startTime;
    console.log(`  ✂️  Trimming: ${startTime}s to ${endTime}s (${duration}s duration)`);

    ffmpeg(inputPath)
      .setStartTime(startTime)
      .setDuration(duration)
      .output(outputPath)
      .videoCodec('libx264')
      .audioCodec('aac')
      .outputOptions(['-preset', 'fast', '-crf', '22', '-movflags', '+faststart'])
      .on('start', (commandLine) => {
        console.log(`  🎬 FFmpeg started`);
      })
      .on('progress', (progress) => {
        if (progress.percent) {
          process.stdout.write(`\r  ⏳ Encoding: ${Math.round(progress.percent)}%`);
        }
      })
      .on('end', () => {
        const stats = fs.statSync(outputPath);
        const fileSizeMB = (stats.size / 1024 / 1024).toFixed(2);
        console.log(`\n  ✅ Trimmed: ${fileSizeMB} MB`);
        resolve();
      })
      .on('error', (error) => {
        reject(new Error(`Trimming failed: ${error.message}`));
      })
      .run();
  });
}

/**
 * Upload to Firebase Storage
 */
async function uploadToStorage(filePath, videoId, startTime, endTime) {
  console.log(`  ☁️  Uploading to Firebase Storage...`);

  const bucket = storage.bucket();
  const timestamp = Math.floor(Date.now() / 1000);
  const fileName = `clips/${videoId}/${timestamp}_${startTime}-${endTime}.mp4`;

  const [file] = await bucket.upload(filePath, {
    destination: fileName,
    metadata: {
      contentType: 'video/mp4',
      metadata: {
        videoId: videoId,
        startTime: startTime.toString(),
        endTime: endTime.toString(),
        processedAt: new Date().toISOString(),
        processedBy: 'local-mac-processor',
      },
    },
    public: true,
  });

  const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
  console.log(`  ✅ Uploaded: ${publicUrl}`);
  return publicUrl;
}

/**
 * Clean up temporary files
 */
async function cleanup(workingDir) {
  try {
    if (fs.existsSync(workingDir)) {
      const files = await fs.promises.readdir(workingDir);
      for (const file of files) {
        await fs.promises.unlink(path.join(workingDir, file));
      }
      await fs.promises.rmdir(workingDir);
      console.log(`  🧹 Cleaned up temp files`);
    }
  } catch (error) {
    console.warn(`  ⚠️  Cleanup warning: ${error.message}`);
  }
}

/**
 * Process a single job
 */
async function processJob(job) {
  const jobId = job.id;
  const jobData = job.data();

  console.log('');
  console.log('═'.repeat(60));
  console.log(`🎬 Processing Job: ${jobId}`);
  console.log(`📝 Title: ${jobData.clipTitle}`);
  console.log(`🔗 URL: ${jobData.youtubeUrl}`);
  console.log(`⏱️  Time: ${jobData.startTimeSeconds}s - ${jobData.endTimeSeconds}s`);
  console.log('═'.repeat(60));

  const videoId = jobData.videoId;
  const tempDir = os.tmpdir();
  const workingDir = path.join(tempDir, `video_${videoId}_${Date.now()}`);
  await fs.promises.mkdir(workingDir, { recursive: true });

  const originalVideoPath = path.join(workingDir, 'original.mp4');
  const clippedVideoPath = path.join(workingDir, 'clipped.mp4');

  try {
    // Update job status to processing
    await db.collection('jobs').doc(jobId).update({
      status: 'processing',
      processingStartedAt: new Date().toISOString(),
      processor: 'local-mac',
    });

    // Step 1: Download video
    await downloadVideo(jobData.youtubeUrl, originalVideoPath);

    // Step 2: Trim video
    await trimVideo(
      originalVideoPath,
      clippedVideoPath,
      jobData.startTimeSeconds,
      jobData.endTimeSeconds
    );

    // Step 3: Upload to Firebase Storage
    const publicUrl = await uploadToStorage(
      clippedVideoPath,
      videoId,
      jobData.startTimeSeconds,
      jobData.endTimeSeconds
    );

    // Step 4: Update clip with processed URL
    await db.collection('clips').doc(jobData.clipId).update({
      processedClipUrl: publicUrl,
      processingStatus: 'completed',
      processedAt: new Date().toISOString(),
      processedBy: 'local-mac-processor',
    });

    // Step 5: Mark job as completed
    await db.collection('jobs').doc(jobId).update({
      status: 'completed',
      completedAt: new Date().toISOString(),
      processedClipUrl: publicUrl,
    });

    console.log('');
    console.log('✅ JOB COMPLETED SUCCESSFULLY');
    console.log('═'.repeat(60));
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ JOB FAILED:', error.message);
    console.error('═'.repeat(60));
    console.error('');

    // Update job as failed
    await db.collection('jobs').doc(jobId).update({
      status: 'failed',
      failedAt: new Date().toISOString(),
      error: error.message,
    });

    // Update clip status
    await db.collection('clips').doc(jobData.clipId).update({
      processingStatus: 'failed',
      videoProcessingError: error.message,
    });

    throw error;
  } finally {
    // Cleanup temp files
    await cleanup(workingDir);
  }
}

/**
 * Poll for pending jobs
 */
async function pollForJobs() {
  if (isShuttingDown) {
    console.log('⏸️  Shutting down, skipping poll...');
    return;
  }

  if (currentlyProcessing >= MAX_CONCURRENT_JOBS) {
    console.log(`⏸️  Already processing ${currentlyProcessing} job(s), waiting...`);
    return;
  }

  try {
    // Get pending jobs ordered by priority (descending) and creation time (ascending)
    const pendingJobs = await db
      .collection('jobs')
      .where('status', '==', 'pending')
      .orderBy('priority', 'desc')
      .orderBy('createdAt', 'asc')
      .limit(MAX_CONCURRENT_JOBS - currentlyProcessing)
      .get();

    if (pendingJobs.empty) {
      const now = new Date().toLocaleTimeString();
      process.stdout.write(`\r⏳ ${now} - Waiting for jobs... (polling every ${POLL_INTERVAL / 1000}s)`);
      return;
    }

    console.log(''); // New line after waiting message
    console.log(`📬 Found ${pendingJobs.size} pending job(s)`);

    for (const job of pendingJobs.docs) {
      currentlyProcessing++;

      // Process job (async, doesn't block polling)
      processJob(job)
        .catch((error) => {
          console.error('Job processing error:', error);
        })
        .finally(() => {
          currentlyProcessing--;
        });
    }
  } catch (error) {
    console.error('Poll error:', error.message);
  }
}

/**
 * Graceful shutdown
 */
function shutdown() {
  if (isShuttingDown) return;

  console.log('');
  console.log('');
  console.log('🛑 Shutting down gracefully...');
  isShuttingDown = true;

  if (currentlyProcessing > 0) {
    console.log(`⏳ Waiting for ${currentlyProcessing} job(s) to complete...`);

    const checkInterval = setInterval(() => {
      if (currentlyProcessing === 0) {
        clearInterval(checkInterval);
        console.log('✅ All jobs completed. Goodbye!');
        process.exit(0);
      }
    }, 1000);

    // Force exit after 5 minutes
    setTimeout(() => {
      console.log('⚠️  Force shutdown after 5 minutes');
      process.exit(1);
    }, 5 * 60 * 1000);
  } else {
    console.log('✅ Goodbye!');
    process.exit(0);
  }
}

// Handle shutdown signals
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Start polling
console.log('👀 Starting to poll for jobs...');
console.log('Press Ctrl+C to stop');
console.log('');

setInterval(pollForJobs, POLL_INTERVAL);
pollForJobs(); // Run immediately on start
