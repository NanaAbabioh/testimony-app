#!/usr/bin/env npx tsx

/**
 * Fix Firebase Storage URLs in database
 *
 * This script fixes the incorrect bucket name in processedClipUrl fields.
 * Changes: ah-testimony-library.firebasestorage.app -> ah-testimony-library.appspot.com
 */

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

// Initialize Firebase Admin
if (getApps().length === 0) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '{}');

  initializeApp({
    credential: cert(serviceAccount),
    storageBucket: 'ah-testimony-library.appspot.com'
  });

  console.log('✅ Firebase Admin initialized');
}

async function fixStorageUrls() {
  try {
    console.log('🔍 Starting URL fix...');

    const db = getFirestore();

    // Get all clips with processedClipUrl
    const clipsSnapshot = await db.collection('clips').get();

    console.log(`📊 Found ${clipsSnapshot.size} total clips`);

    let updatedCount = 0;
    let skippedCount = 0;
    let emptyCount = 0;

    let batch = db.batch();
    let batchCount = 0;
    const MAX_BATCH_SIZE = 500; // Firestore batch limit

    for (const doc of clipsSnapshot.docs) {
      const data = doc.data();
      const processedClipUrl = data.processedClipUrl;

      // Skip if no processedClipUrl
      if (!processedClipUrl || processedClipUrl.trim() === '') {
        emptyCount++;
        continue;
      }

      // Check if URL has the wrong bucket name
      if (processedClipUrl.includes('ah-testimony-library.firebasestorage.app')) {
        const fixedUrl = processedClipUrl.replace(
          'ah-testimony-library.firebasestorage.app',
          'ah-testimony-library.appspot.com'
        );

        console.log(`✏️  Fixing: ${doc.id}`);
        console.log(`   Old: ${processedClipUrl}`);
        console.log(`   New: ${fixedUrl}`);

        batch.update(doc.ref, { processedClipUrl: fixedUrl });
        updatedCount++;
        batchCount++;

        // Commit batch if we hit the limit
        if (batchCount >= MAX_BATCH_SIZE) {
          await batch.commit();
          console.log(`💾 Committed batch of ${batchCount} updates`);
          batch = db.batch(); // Create new batch after commit
          batchCount = 0;
        }
      } else {
        skippedCount++;
      }
    }

    // Commit any remaining updates
    if (batchCount > 0) {
      await batch.commit();
      console.log(`💾 Committed final batch of ${batchCount} updates`);
    }

    console.log('\n✅ URL fix complete!');
    console.log(`📊 Summary:`);
    console.log(`   - Updated: ${updatedCount} clips`);
    console.log(`   - Skipped (already correct): ${skippedCount} clips`);
    console.log(`   - Empty URLs: ${emptyCount} clips`);
    console.log(`   - Total: ${clipsSnapshot.size} clips`);

  } catch (error) {
    console.error('❌ Error fixing URLs:', error);
    throw error;
  }
}

// Run the script
fixStorageUrls()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
