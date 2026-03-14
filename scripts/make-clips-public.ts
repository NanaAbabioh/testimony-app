#!/usr/bin/env npx tsx

/**
 * Make all existing clip files in Firebase Storage publicly accessible
 */

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

// Initialize Firebase Admin
if (getApps().length === 0) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '{}');

  initializeApp({
    credential: cert(serviceAccount),
    storageBucket: 'ah-testimony-library.firebasestorage.app'
  });

  console.log('✅ Firebase Admin initialized');
}

async function makeClipsPublic() {
  try {
    console.log('🔓 Starting to make all clips public...');

    const storage = getStorage();
    const bucket = storage.bucket('ah-testimony-library.firebasestorage.app');

    // List all files in the clips folder
    const [files] = await bucket.getFiles({
      prefix: 'clips/',
    });

    console.log(`📊 Found ${files.length} files in clips folder`);

    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    for (const file of files) {
      try {
        // Skip if it's a folder (ends with /)
        if (file.name.endsWith('/')) {
          skippedCount++;
          continue;
        }

        console.log(`🔓 Making public: ${file.name}`);
        await file.makePublic();
        successCount++;

        // Add small delay to avoid rate limiting
        if (successCount % 50 === 0) {
          console.log(`✅ Progress: ${successCount} files made public...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`❌ Error making ${file.name} public:`, error);
        errorCount++;
      }
    }

    console.log('\n✅ Completed!');
    console.log(`📊 Summary:`);
    console.log(`   - Success: ${successCount} files`);
    console.log(`   - Errors: ${errorCount} files`);
    console.log(`   - Skipped: ${skippedCount} files`);
    console.log(`   - Total: ${files.length} files`);

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

makeClipsPublic()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
