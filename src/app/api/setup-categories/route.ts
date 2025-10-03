import { NextRequest, NextResponse } from 'next/server';
import { adminDb as db } from '@/lib/firebase-admin';

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

export async function GET(request: NextRequest) {
  try {
    console.log('Starting to seed categories...');
    
    if (!db) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }
    
    const batch = db.batch();
    const results = [];
    
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
      
      results.push({
        id: categoryId,
        name: category.name
      });
      
      console.log(`Added category: ${category.name} (ID: ${categoryId})`);
    }
    
    await batch.commit();
    console.log('✅ All categories seeded successfully!');

    return NextResponse.json({
      success: true,
      message: `Successfully created ${categories.length} categories`,
      categories: results
    });

  } catch (error: any) {
    console.error('Error seeding categories:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to seed categories' },
      { status: 500 }
    );
  }
}