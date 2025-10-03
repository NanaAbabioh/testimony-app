// Script to seed the correct categories into Firestore
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { cert } from 'firebase-admin/app';

// Initialize Firebase Admin
const app = initializeApp({
  credential: cert({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
});

const db = getFirestore(app);

const categories = [
  {
    name: 'Healing & Divine Health',
    description: 'Testimonies about physical healing, divine health, and restoration of the body'
  },
  {
    name: 'Marriage, Family & Fruitfulness',
    description: 'Testimonies about marriage breakthroughs, family restoration, childbearing, and relationship healing'
  },
  {
    name: 'Career & Financial Breakthrough',
    description: 'Testimonies about job promotions, business success, debt cancellation, and financial provision'
  },
  {
    name: 'Academic & Educational Advancement',
    description: 'Testimonies about school admissions, exam success, educational achievements, and academic breakthroughs'
  },
  {
    name: 'Deliverance & Freedom',
    description: 'Testimonies about freedom from addictions, spiritual bondage, and deliverance from negative patterns'
  },
  {
    name: 'Divine Intervention & Protection',
    description: 'Testimonies about miraculous interventions, divine protection, and supernatural favor'
  },
  {
    name: 'Immigration & Travel',
    description: 'Testimonies about visa approvals, travel breakthroughs, relocation, and international opportunities'
  }
];

async function seedCategories() {
  console.log('Starting to seed categories...');
  
  try {
    const batch = db.batch();
    
    for (const category of categories) {
      // Use category name as document ID for consistent reference
      const categoryId = category.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const docRef = db.collection('categories').doc(categoryId);
      
      batch.set(docRef, {
        id: categoryId,
        name: category.name,
        description: category.description,
        createdAt: new Date().toISOString(),
        isActive: true
      });
      
      console.log(`Added category: ${category.name} (ID: ${categoryId})`);
    }
    
    await batch.commit();
    console.log('✅ All categories seeded successfully!');
    
    // Verify the categories were created
    const snapshot = await db.collection('categories').get();
    console.log(`📊 Total categories in database: ${snapshot.size}`);
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log(`  - ${data.name} (${doc.id})`);
    });
    
  } catch (error) {
    console.error('❌ Error seeding categories:', error);
  } finally {
    process.exit(0);
  }
}

// Run the seeding
seedCategories();