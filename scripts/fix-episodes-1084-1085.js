// Script to fix incorrect time data in episodes 1084 and 1085
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

async function fixClipsData() {
  console.log('\n=== Fixing Episodes 1084 and 1085 Clips ===\n');
  
  try {
    // Get problematic clips
    const snapshot = await db.collection('clips')
      .where('episode', 'in', ['1084', '1085'])
      .get();
      
    console.log(`Found ${snapshot.size} clips to check from episodes 1084 and 1085`);
    
    const batch = db.batch();
    let fixedCount = 0;
    
    snapshot.forEach(doc => {
      const data = doc.data();
      const duration = data.endTimeSeconds - data.startTimeSeconds;
      
      console.log(`\nChecking ${doc.id} (Episode ${data.episode}):`);
      console.log(`  Current: Start=${data.startTimeSeconds}s, End=${data.endTimeSeconds}s, Duration=${duration}s`);
      
      // Skip the one good clip
      if (doc.id === 'H2jACaCWtV0vTNJbQYUh') {
        console.log(`  ✅ This clip looks good, skipping`);
        return;
      }
      
      // Fix clips with obviously wrong data
      let needsUpdate = false;
      let newData = {};
      
      // For clips with negative duration or extremely long duration (>30 minutes)
      if (duration < 0 || duration > 1800) {
        needsUpdate = true;
        
        // These need manual correction based on typical testimony lengths (2-5 minutes)
        // For now, we'll set reasonable defaults and flag them for review
        
        if (duration < 0) {
          // Swap start and end times if negative
          newData.startTimeSeconds = data.endTimeSeconds;
          newData.endTimeSeconds = data.startTimeSeconds;
          console.log(`  🔧 Swapping negative times: Start=${newData.startTimeSeconds}s, End=${newData.endTimeSeconds}s`);
        } else {
          // For extremely long clips, we need to estimate reasonable times
          // Based on typical testimonies being 2-5 minutes (120-300 seconds)
          // We'll keep the start time if it seems reasonable, otherwise reset
          
          if (data.startTimeSeconds > 10800) { // More than 3 hours seems wrong
            console.log(`  ⚠️ Start time too large (${data.startTimeSeconds}s), needs manual review`);
            // Flag for manual review
            newData.needsReview = true;
            newData.originalStartTime = data.startTimeSeconds;
            newData.originalEndTime = data.endTimeSeconds;
          } else {
            // Keep start time, set reasonable end time
            newData.endTimeSeconds = data.startTimeSeconds + 300; // Add 5 minutes
            console.log(`  🔧 Setting reasonable end time: End=${newData.endTimeSeconds}s (Start+5min)`);
          }
        }
      }
      
      if (needsUpdate) {
        // Add status flag to indicate this clip needs review
        newData.status = 'needs-review';
        newData.fixedAt = admin.firestore.FieldValue.serverTimestamp();
        newData.fixedBy = 'auto-fix-script';
        
        batch.update(doc.ref, newData);
        fixedCount++;
        
        console.log(`  ✅ Queued for update`);
      } else {
        console.log(`  ✅ This clip looks good, no changes needed`);
      }
    });
    
    if (fixedCount > 0) {
      console.log(`\n=== Applying ${fixedCount} fixes ===`);
      await batch.commit();
      console.log(`✅ Successfully updated ${fixedCount} clips`);
      console.log(`\n⚠️ Note: Clips marked with 'needs-review' status require manual time correction`);
    } else {
      console.log('\n✅ No clips needed fixing');
    }
    
  } catch (error) {
    console.error('Error fixing clips:', error);
  }
  
  process.exit(0);
}

fixClipsData();