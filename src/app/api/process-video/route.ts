import { NextResponse } from 'next/server';
import { getVideoInfo, extractVideoId } from '../../../../lib/youtube-processor';
import { processAudioAndAnalyze, processTestimoniesWithVideos } from '../../../../lib/combined-processor';
import { saveVideo, saveClips, ensureCategory } from '../../../../lib/database';
import { adminDb } from '../../../../lib/firebase-admin';

export async function POST(request: Request) {
  console.log('--- Received a new request ---');
  
  try {
    const body = await request.json();
    const { youtubeUrl } = body;

    if (!youtubeUrl) {
      return NextResponse.json({ error: 'YouTube URL is required' }, { status: 400 });
    }
    console.log(`Step 1: Processing URL: ${youtubeUrl}`);

    // Step 1.5: Check for duplicate video
    console.log('Step 1.5: Checking for duplicate video...');
    const videoId = extractVideoId(youtubeUrl);
    if (!videoId) {
      return NextResponse.json({ error: 'Invalid YouTube URL format' }, { status: 400 });
    }

    // Check if video already exists in database
    if (adminDb) {
      try {
        const existingVideo = await adminDb.collection('videos').doc(videoId).get();
        if (existingVideo.exists) {
          const videoData = existingVideo.data();
          if (videoData) {
            const clipsSnapshot = await adminDb.collection('clips')
              .where('sourceVideoId', '==', videoId)
              .get();
            
            return NextResponse.json({
              error: 'Video already processed',
              message: `This video "${videoData.title}" was already processed on ${new Date(videoData.createdAt).toLocaleDateString()} with ${clipsSnapshot.size} testimonies found.`,
              existingVideo: {
                id: videoId,
                title: videoData.title,
                processedAt: videoData.createdAt,
                testimonyCount: clipsSnapshot.size
              }
            }, { status: 409 }); // 409 Conflict
          }
        }
      } catch (dbError) {
        console.warn('Could not check for duplicate video:', dbError);
        // Continue processing if database check fails
      }
    }

    console.log('Step 2: Getting video information...');
    const videoInfo = await getVideoInfo(youtubeUrl);
    console.log(`Video title: ${videoInfo.title}`);

    // Phase 2: Process audio/transcript and analyze for testimonies
    console.log('Phase 2: Processing audio and analyzing transcript...');
    const testimonies = await processAudioAndAnalyze(youtubeUrl, videoId);
    console.log(`Found ${testimonies.length} testimonies`);

    if (testimonies.length === 0) {
      console.warn('No testimonies found in this video');
      return NextResponse.json({ 
        message: 'No testimonies were detected in this video',
        videoId: videoInfo.videoId,
        videoTitle: videoInfo.title,
        testimoniesFound: 0
      }, { status: 200 });
    }

    // Save video to database
    console.log('Phase 3: Saving video to database...');
    await saveVideo(videoInfo.videoId, videoInfo);

    // Phase 4: Process testimonies and create video clips
    console.log('Phase 4: Creating video clips for each testimony...');
    const testimoniesWithVideos = await processTestimoniesWithVideos(youtubeUrl, testimonies);

    // Process and save clips with video URLs
    console.log('Phase 5: Saving clips to database...');
    const processedClips = [];
    
    for (const testimony of testimoniesWithVideos) {
      const categoryId = await ensureCategory(testimony.category);
      
      const clipData = {
        title: testimony.title,
        category: testimony.category, // Store category name directly for easier querying
        categoryId: categoryId,
        startTimeSeconds: testimony.startTimeSeconds,
        endTimeSeconds: testimony.endTimeSeconds,
        fullText: testimony.fullText,
        processedClipUrl: testimony.processedClipUrl, // NEW: Add the video URL
        videoProcessingError: testimony.videoProcessingError || null, // Track any errors
      };
      
      processedClips.push(clipData);
    }

    if (processedClips.length > 0) {
      await saveClips(videoInfo.videoId, processedClips);
    }

    // Store testimonies for viewing (temporary solution until Firebase is set up)
    if (processedClips.length > 0) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/latest-testimonies`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ testimonies: processedClips })
        });
        console.log('Testimonies stored for viewing');
      } catch (storeError) {
        console.warn('Failed to store testimonies for viewing:', storeError);
      }
    }

    // Calculate video processing statistics
    const videoClipsCreated = processedClips.filter(clip => clip.processedClipUrl).length;
    const videoClipsFailed = processedClips.filter(clip => clip.videoProcessingError).length;

    const result = {
      message: `SUCCESS: Processed ${processedClips.length} testimonies from "${videoInfo.title}"`,
      videoId: videoInfo.videoId,
      videoTitle: videoInfo.title,
      testimoniesFound: processedClips.length,
      videoClipsCreated: videoClipsCreated,
      videoClipsFailed: videoClipsFailed,
      categories: [...new Set(testimoniesWithVideos.map((t: { category: string }) => t.category))],
      testimonies: processedClips, // Include the actual testimonies with video URLs
    };
    
    console.log(`Phase 6: Process complete. Created ${videoClipsCreated} video clips, ${videoClipsFailed} failed.`);
    return NextResponse.json(result, { status: 200 });

  } catch (error: unknown) {
    console.error('--- An unexpected error occurred in the pipeline ---', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'An internal server error occurred.' }, { status: 500 });
  }
}