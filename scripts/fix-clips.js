// Script to fix clips with missing status and serviceDate
const admin = require('firebase-admin');

// Initialize admin
if (admin.apps.length === 0) {
  const serviceAccount = require('../ah-testimony-library-firebase-adminsdk-fbsvc-b2539354b4.json');
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'ah-testimony-library'
  });
}

const db = admin.firestore();

async function fixClips() {
  console.log('\n=== Fixing Clips in Database ===\n');
  
  try {
    // Get ALL clips
    const allClipsSnapshot = await db.collection('clips').get();
    console.log(`Found ${allClipsSnapshot.size} clips to fix`);
    
    const batch = db.batch();
    let fixCount = 0;
    
    allClipsSnapshot.forEach(doc => {
      const clip = doc.data();
      const updates = {};
      
      // Fix missing status
      if (!clip.status) {
        updates.status = 'live';
        console.log(`Setting status to "live" for: ${clip.title}`);
      }
      
      // Fix missing serviceDate (use createdAt as fallback)
      if (!clip.serviceDate) {
        updates.serviceDate = clip.createdAt || admin.firestore.Timestamp.now();
        console.log(`Setting serviceDate for: ${clip.title}`);
      }
      
      // Fix missing publishedAt
      if (!clip.publishedAt) {
        updates.publishedAt = clip.createdAt || admin.firestore.Timestamp.now();
      }
      
      // Fix missing savedCount
      if (clip.savedCount === undefined) {
        updates.savedCount = 0;
      }
      
      // Apply updates if needed
      if (Object.keys(updates).length > 0) {
        batch.update(doc.ref, updates);
        fixCount++;
      }
    });
    
    if (fixCount > 0) {
      await batch.commit();
      console.log(`\n✅ Successfully fixed ${fixCount} clips!`);
    } else {
      console.log('\n✅ No clips needed fixing!');
    }
    
    // Verify the fix
    console.log('\n=== Verification ===');
    const liveClips = await db.collection('clips').where('status', '==', 'live').get();
    console.log(`Clips with "live" status: ${liveClips.size}`);
    
  } catch (error) {
    console.error('Error fixing clips:', error);
  }
  
  process.exit(0);
}

// Ask for confirmation
console.log('⚠️  This will update all clips to have status="live"');
console.log('Press Ctrl+C to cancel, or wait 3 seconds to continue...\n');

setTimeout(fixClips, 3000);