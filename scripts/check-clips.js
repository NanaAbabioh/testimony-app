// Script to check clips in Firebase database
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

async function checkClips() {
  console.log('\n=== Checking All Clips in Database ===\n');
  
  try {
    // Get ALL clips without any filters
    const allClipsSnapshot = await db.collection('clips').get();
    console.log(`Total clips in database: ${allClipsSnapshot.size}`);
    
    if (allClipsSnapshot.size > 0) {
      console.log('\n--- Clip Details ---');
      allClipsSnapshot.forEach(doc => {
        const clip = doc.data();
        console.log(`
ID: ${doc.id}
Title: ${clip.title}
Status: ${clip.status} <-- CHECK THIS
Category ID: ${clip.categoryId}
Service Date: ${clip.serviceDate?.toDate?.() || clip.serviceDate}
Created At: ${clip.createdAt?.toDate?.() || clip.createdAt}
        `);
      });
      
      // Check clips with "live" status
      const liveClipsSnapshot = await db.collection('clips')
        .where('status', '==', 'live')
        .get();
      console.log(`\n=== Clips with "live" status: ${liveClipsSnapshot.size} ===`);
      
      // Check clips with other statuses
      const statuses = ['draft', 'pending', 'published', 'processing'];
      for (const status of statuses) {
        const snapshot = await db.collection('clips')
          .where('status', '==', status)
          .get();
        if (snapshot.size > 0) {
          console.log(`Clips with "${status}" status: ${snapshot.size}`);
        }
      }
    }
    
    // Check categories
    console.log('\n=== Categories in Database ===');
    const categoriesSnapshot = await db.collection('categories').get();
    console.log(`Total categories: ${categoriesSnapshot.size}`);
    categoriesSnapshot.forEach(doc => {
      const category = doc.data();
      console.log(`- ${category.name} (ID: ${doc.id})`);
    });
    
  } catch (error) {
    console.error('Error checking clips:', error);
  }
  
  process.exit(0);
}

checkClips();