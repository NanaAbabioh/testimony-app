#!/usr/bin/env npx tsx

/**
 * Test if clip files are publicly accessible
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

async function testClipAccess() {
  try {
    console.log('🔍 Testing clip file accessibility...\n');

    const storage = getStorage();
    const bucket = storage.bucket('ah-testimony-library.firebasestorage.app');

    // Get first 3 clip files
    const [files] = await bucket.getFiles({
      prefix: 'clips/',
      maxResults: 3
    });

    const clipFiles = files.filter(f => !f.name.endsWith('/'));

    if (clipFiles.length === 0) {
      console.log('❌ No clip files found');
      return;
    }

    console.log(`Found ${clipFiles.length} clips to test:\n`);

    for (const file of clipFiles) {
      try {
        // Get file metadata
        const [metadata] = await file.getMetadata();

        // Check if file is public
        const [isPublic] = await file.isPublic();

        // Construct public URL
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${file.name}`;

        console.log(`📹 File: ${file.name}`);
        console.log(`   Size: ${(metadata.size / 1024 / 1024).toFixed(2)} MB`);
        console.log(`   Public: ${isPublic ? '✅ YES' : '❌ NO'}`);
        console.log(`   URL: ${publicUrl}`);

        // Try to access the URL
        console.log(`   Testing URL accessibility...`);
        const response = await fetch(publicUrl, { method: 'HEAD' });

        if (response.ok) {
          console.log(`   Access: ✅ ACCESSIBLE (${response.status})`);
        } else {
          console.log(`   Access: ❌ DENIED (${response.status})`);
        }

        console.log('');

      } catch (error) {
        console.error(`❌ Error testing ${file.name}:`, error);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

testClipAccess()
  .then(() => {
    console.log('✅ Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
