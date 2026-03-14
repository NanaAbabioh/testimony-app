#!/usr/bin/env npx tsx

/**
 * REVERT Storage URLs back to firebasestorage.app
 *
 * This reverts the incorrect change from appspot.com back to firebasestorage.app
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
    storageBucket: 'ah-testimony-library.firebasestorage.app'
  });

  console.log('✅ Firebase Admin initialized');
}

async function revertStorageUrls() {
  try {
    console.log('🔄 Starting URL revert...');

    const db = getFirestore();

    // Get all clips with processedClipUrl
    const clipsSnapshot = await db.collection('clips').get();

    console.log(`📊 Found ${clipsSnapshot.size} total clips`);

    let revertedCount = 0;
    let skippedCount = 0;

    let batch = db.batch();
    let batchCount = 0;
    const MAX_BATCH_SIZE = 500;

    for (const doc of clipsSnapshot.docs) {
      const data = doc.data();
      const processedClipUrl = data.processedClipUrl;

      if (!processedClipUrl || processedClipUrl.trim() === '') {
        continue;
      }

      // Revert from appspot.com back to firebasestorage.app
      if (processedClipUrl.includes('ah-testimony-library.appspot.com')) {
        const revertedUrl = processedClipUrl.replace(
          'ah-testimony-library.appspot.com',
          'ah-testimony-library.firebasestorage.app'
        );

        console.log(`🔄 Reverting: ${doc.id}`);

        batch.update(doc.ref, { processedClipUrl: revertedUrl });
        revertedCount++;
        batchCount++;

        if (batchCount >= MAX_BATCH_SIZE) {
          await batch.commit();
          console.log(`💾 Committed batch of ${batchCount} reverts`);
          batch = db.batch();
          batchCount = 0;
        }
      } else {
        skippedCount++;
      }
    }

    if (batchCount > 0) {
      await batch.commit();
      console.log(`💾 Committed final batch of ${batchCount} reverts`);
    }

    console.log('\n✅ URL revert complete!');
    console.log(`📊 Summary:`);
    console.log(`   - Reverted: ${revertedCount} clips`);
    console.log(`   - Skipped: ${skippedCount} clips`);
    console.log(`   - Total: ${clipsSnapshot.size} clips`);

  } catch (error) {
    console.error('❌ Error reverting URLs:', error);
    throw error;
  }
}

revertStorageUrls()
  .then(() => {
    console.log('✅ Revert completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Revert failed:', error);
    process.exit(1);
  });
