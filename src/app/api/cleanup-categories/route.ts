import { NextRequest, NextResponse } from 'next/server';
import { adminDb as db } from '@/lib/firebase-admin';

const CORRECT_CATEGORIES = [
  'Healing & Divine Health',
  'Marriage, Family & Fruitfulness',
  'Career & Financial Breakthrough',
  'Academic & Educational Advancement',
  'Deliverance & Freedom',
  'Divine Intervention & Protection',
  'Immigration & Travel'
];

export async function GET(request: NextRequest) {
  try {
    console.log('Starting category cleanup...');
    
    if (!db) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }
    
    // First, get all existing categories
    const snapshot = await db.collection('categories').get();
    const existingCategories = [];
    const toDelete = [];
    const toKeep = [];
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      existingCategories.push({
        id: doc.id,
        name: data.name
      });
      
      // Check if this category should be kept
      if (CORRECT_CATEGORIES.includes(data.name)) {
        toKeep.push(data.name);
      } else {
        toDelete.push({
          id: doc.id,
          name: data.name
        });
      }
    });
    
    console.log('Found categories:', existingCategories);
    console.log('Categories to delete:', toDelete);
    console.log('Categories to keep:', toKeep);
    
    // Delete old categories
    const batch = db.batch();
    let deleteCount = 0;
    
    for (const category of toDelete) {
      const docRef = db.collection('categories').doc(category.id);
      batch.delete(docRef);
      deleteCount++;
      console.log(`Deleting: ${category.name} (${category.id})`);
    }
    
    // Add any missing correct categories
    const missingCategories = CORRECT_CATEGORIES.filter(cat => !toKeep.includes(cat));
    let addCount = 0;
    
    for (const categoryName of missingCategories) {
      const categoryId = categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const docRef = db.collection('categories').doc(categoryId);
      
      batch.set(docRef, {
        id: categoryId,
        name: categoryName,
        description: getCategoryDescription(categoryName),
        createdAt: new Date().toISOString(),
        isActive: true
      });
      
      addCount++;
      console.log(`Adding missing: ${categoryName} (${categoryId})`);
    }
    
    // Commit all changes
    await batch.commit();
    
    // Verify final state
    const finalSnapshot = await db.collection('categories').get();
    const finalCategories = [];
    finalSnapshot.docs.forEach(doc => {
      finalCategories.push(doc.data().name);
    });

    return NextResponse.json({
      success: true,
      message: `Cleanup complete! Deleted ${deleteCount} old categories, added ${addCount} missing categories.`,
      deletedCategories: toDelete,
      finalCategories: finalCategories.sort(),
      totalCategories: finalCategories.length
    });

  } catch (error: any) {
    console.error('Error cleaning up categories:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to cleanup categories' },
      { status: 500 }
    );
  }
}

function getCategoryDescription(name: string): string {
  const descriptions: { [key: string]: string } = {
    'Healing & Divine Health': 'Testimonies about physical healing, divine health, and restoration of the body',
    'Marriage, Family & Fruitfulness': 'Testimonies about marriage breakthroughs, family restoration, childbearing, and relationship healing',
    'Career & Financial Breakthrough': 'Testimonies about job promotions, business success, debt cancellation, and financial provision',
    'Academic & Educational Advancement': 'Testimonies about school admissions, exam success, educational achievements, and academic breakthroughs',
    'Deliverance & Freedom': 'Testimonies about freedom from addictions, spiritual bondage, and deliverance from negative patterns',
    'Divine Intervention & Protection': 'Testimonies about miraculous interventions, divine protection, and supernatural favor',
    'Immigration & Travel': 'Testimonies about visa approvals, travel breakthroughs, relocation, and international opportunities'
  };
  
  return descriptions[name] || 'Category for testimonies';
}