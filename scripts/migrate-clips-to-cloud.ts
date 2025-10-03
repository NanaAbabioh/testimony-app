#!/usr/bin/env npx tsx

/**
 * Migration Script: Move Local Video Clips to Firebase Storage
 *
 * This script:
 * 1. Finds all clips with local processedClipUrl paths
 * 2. Uploads the local video files to Firebase Storage
 * 3. Updates the database records with new cloud URLs
 * 4. Optionally cleans up local files after successful migration
 */

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

interface Clip {
  id: string;
  processedClipUrl: string;
  sourceVideoId: string;
  startTimeSeconds: number;
  endTimeSeconds: number;
  [key: string]: any;
}

class ClipMigrator {
  private db: FirebaseFirestore.Firestore;
  private storage: any;
  private bucket: any;

  constructor() {
    this.initializeFirebase();
    this.db = getFirestore();
    this.storage = getStorage();
    this.bucket = this.storage.bucket('ah-testimony-library.firebasestorage.app');
  }

  private initializeFirebase() {
    if (getApps().length === 0) {
      const hasValidCredentials = process.env.FIREBASE_CLIENT_EMAIL &&
                                  process.env.FIREBASE_PRIVATE_KEY &&
                                  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

      if (!hasValidCredentials) {
        throw new Error('Firebase credentials not found in environment variables');
      }

      initializeApp({
        credential: cert({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
          privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
        }),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: 'ah-testimony-library.firebasestorage.app',
      });

      console.log('✅ Firebase Admin initialized for migration');
    }
  }

  /**
   * Get all clips that have local processedClipUrl paths
   */
  async getLocalClips(): Promise<Clip[]> {
    console.log('🔍 Finding clips with local storage paths...');

    const clipsRef = this.db.collection('clips');
    const snapshot = await clipsRef.get();

    const localClips: Clip[] = [];

    snapshot.forEach(doc => {
      const data = doc.data() as Clip;
      data.id = doc.id;

      // Check if processedClipUrl is a local path (starts with /)
      if (data.processedClipUrl &&
          data.processedClipUrl.startsWith('/clips/') &&
          !data.processedClipUrl.startsWith('http')) {
        localClips.push(data);
      }
    });

    console.log(`📊 Found ${localClips.length} clips with local storage paths`);
    return localClips;
  }

  /**
   * Upload a single local file to Firebase Storage
   */
  async uploadFileToFirebase(localPath: string, videoId: string, startTime: number, endTime: number): Promise<string> {
    const fullLocalPath = path.join(process.cwd(), 'public', localPath);

    // Check if local file exists
    if (!fs.existsSync(fullLocalPath)) {
      throw new Error(`Local file not found: ${fullLocalPath}`);
    }

    // Get file stats
    const stats = fs.statSync(fullLocalPath);
    const fileSizeMB = stats.size / 1024 / 1024;

    console.log(`📤 Uploading ${path.basename(localPath)} (${fileSizeMB.toFixed(2)} MB)...`);

    // Create Firebase Storage path
    const timestamp = Math.floor(Date.now() / 1000);
    const fileName = `clips/${videoId}/${timestamp}_${startTime}-${endTime}.mp4`;

    // Upload to Firebase Storage
    const [file] = await this.bucket.upload(fullLocalPath, {
      destination: fileName,
      metadata: {
        contentType: 'video/mp4',
        metadata: {
          videoId: videoId,
          startTime: startTime.toString(),
          endTime: endTime.toString(),
          migratedAt: new Date().toISOString(),
          originalLocalPath: localPath,
        }
      },
      public: true,
      validation: 'crc32c',
    });

    // Return public URL
    const publicUrl = `https://storage.googleapis.com/ah-testimony-library.firebasestorage.app/${fileName}`;
    console.log(`✅ Uploaded successfully: ${publicUrl}`);

    return publicUrl;
  }

  /**
   * Update database record with new cloud URL
   */
  async updateClipRecord(clipId: string, newUrl: string, originalLocalPath: string): Promise<void> {
    const clipRef = this.db.collection('clips').doc(clipId);

    await clipRef.update({
      processedClipUrl: newUrl,
      videoProcessingError: null, // Clear any previous errors
      migratedAt: new Date().toISOString(),
      originalLocalPath: originalLocalPath, // Keep reference to original path
    });

    console.log(`📝 Updated database record for clip ${clipId}`);
  }

  /**
   * Migrate a single clip
   */
  async migrateClip(clip: Clip): Promise<{ success: boolean; error?: string; newUrl?: string }> {
    try {
      console.log(`\n🎬 Migrating: ${clip.id} (${clip.processedClipUrl})`);

      // Upload file to Firebase Storage
      const newUrl = await this.uploadFileToFirebase(
        clip.processedClipUrl,
        clip.sourceVideoId,
        clip.startTimeSeconds,
        clip.endTimeSeconds
      );

      // Update database record
      await this.updateClipRecord(clip.id, newUrl, clip.processedClipUrl);

      return { success: true, newUrl };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Failed to migrate clip ${clip.id}: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Clean up local file after successful migration
   */
  async cleanupLocalFile(localPath: string): Promise<void> {
    const fullLocalPath = path.join(process.cwd(), 'public', localPath);

    try {
      if (fs.existsSync(fullLocalPath)) {
        fs.unlinkSync(fullLocalPath);
        console.log(`🗑️ Cleaned up local file: ${localPath}`);
      }
    } catch (error) {
      console.warn(`⚠️ Warning: Could not clean up local file ${localPath}: ${error}`);
    }
  }

  /**
   * Run the complete migration
   */
  async runMigration(options: { cleanupAfterMigration?: boolean; batchSize?: number } = {}) {
    const { cleanupAfterMigration = false, batchSize = 5 } = options;

    console.log('🚀 Starting clip migration to Firebase Storage...\n');

    try {
      // Get all local clips
      const localClips = await this.getLocalClips();

      if (localClips.length === 0) {
        console.log('✅ No clips to migrate - all clips are already in cloud storage!');
        return;
      }

      let successCount = 0;
      let errorCount = 0;
      const errors: Array<{ clipId: string; error: string }> = [];

      // Process clips in batches to avoid overwhelming the system
      for (let i = 0; i < localClips.length; i += batchSize) {
        const batch = localClips.slice(i, i + batchSize);

        console.log(`\n📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(localClips.length / batchSize)}...`);

        // Process batch with Promise.allSettled to handle individual failures
        const results = await Promise.allSettled(
          batch.map(clip => this.migrateClip(clip))
        );

        // Process results
        for (let j = 0; j < results.length; j++) {
          const result = results[j];
          const clip = batch[j];

          if (result.status === 'fulfilled' && result.value.success) {
            successCount++;

            // Clean up local file if requested and migration was successful
            if (cleanupAfterMigration) {
              await this.cleanupLocalFile(clip.processedClipUrl);
            }
          } else {
            errorCount++;
            const error = result.status === 'fulfilled'
              ? result.value.error!
              : result.reason?.message || 'Unknown error';
            errors.push({ clipId: clip.id, error });
          }
        }

        // Small delay between batches
        if (i + batchSize < localClips.length) {
          console.log('⏳ Waiting 2 seconds before next batch...');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      // Migration summary
      console.log('\n' + '='.repeat(60));
      console.log('📊 MIGRATION SUMMARY');
      console.log('='.repeat(60));
      console.log(`✅ Successfully migrated: ${successCount} clips`);
      console.log(`❌ Failed migrations: ${errorCount} clips`);
      console.log(`📈 Success rate: ${((successCount / localClips.length) * 100).toFixed(1)}%`);

      if (errors.length > 0) {
        console.log('\n❌ ERRORS:');
        errors.forEach(({ clipId, error }) => {
          console.log(`  • ${clipId}: ${error}`);
        });
      }

      if (successCount > 0) {
        console.log('\n🎉 Migration completed! All migrated clips are now served from Firebase Storage.');
        if (cleanupAfterMigration) {
          console.log('🧹 Local files have been cleaned up.');
        } else {
          console.log('📁 Local files preserved. Run with --cleanup to remove them.');
        }
      }

    } catch (error) {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const cleanupAfterMigration = args.includes('--cleanup');
  const batchSize = parseInt(args.find(arg => arg.startsWith('--batch-size='))?.split('=')[1] || '5');

  console.log('🔧 Migration Options:');
  console.log(`   • Cleanup after migration: ${cleanupAfterMigration ? 'YES' : 'NO'}`);
  console.log(`   • Batch size: ${batchSize}`);
  console.log('');

  const migrator = new ClipMigrator();
  await migrator.runMigration({ cleanupAfterMigration, batchSize });
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { ClipMigrator };