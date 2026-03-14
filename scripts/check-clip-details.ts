#!/usr/bin/env npx tsx

/**
 * Get detailed information about a specific clip from the database
 */

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, query, limit, getDocs } from 'firebase/firestore';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

// Initialize Firebase (client SDK)
if (getApps().length === 0) {
  initializeApp({
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  });

  console.log('✅ Firebase initialized');
}

async function checkClipDetails() {
  try {
    console.log('🔍 Fetching recent clip details from database...\n');

    const db = getFirestore();
    const clipsRef = collection(db, 'clips');
    const q = query(clipsRef, limit(3));

    const querySnapshot = await getDocs(q);

    console.log(`Found ${querySnapshot.size} clips:\n`);

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`📹 Clip ID: ${doc.id}`);
      console.log(`   Title: ${data.titleShort || data.title || 'N/A'}`);
      console.log(`   Video ID: ${data.sourceVideoId || data.videoId || 'N/A'}`);
      console.log(`   Start: ${data.startTimeSeconds || data.startSec || 'N/A'}s`);
      console.log(`   End: ${data.endTimeSeconds || data.endSec || 'N/A'}s`);
      console.log(`   Clip URL: ${data.processedClipUrl || 'N/A'}`);
      console.log(`   Category: ${data.categoryId || 'N/A'}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

checkClipDetails()
  .then(() => {
    console.log('✅ Check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Check failed:', error);
    process.exit(1);
  });
