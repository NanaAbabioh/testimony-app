import { NextRequest, NextResponse } from 'next/server';
import { adminDb as db } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }
    
    // Get all clips
    const clipsSnapshot = await db.collection('clips').get();
    const clips = [];
    const problemClips = [];
    
    // Get all valid categories
    const categoriesSnapshot = await db.collection('categories').get();
    const validCategoryIds = categoriesSnapshot.docs.map(doc => doc.id);
    const validCategoryNames = categoriesSnapshot.docs.map(doc => doc.data().name);
    
    console.log('Valid category IDs:', validCategoryIds);
    console.log('Valid category names:', validCategoryNames);
    
    clipsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      clips.push({
        id: doc.id,
        categoryId: data.categoryId,
        title: data.title,
        sourceVideoId: data.sourceVideoId
      });
      
      // Check if category ID is valid
      if (!data.categoryId || !validCategoryIds.includes(data.categoryId)) {
        problemClips.push({
          id: doc.id,
          categoryId: data.categoryId || 'MISSING',
          title: data.title
        });
      }
    });
    
    // Try to fix problem clips
    const batch = db.batch();
    let fixCount = 0;
    
    for (const clip of problemClips) {
      // Default to "Healing & Divine Health" category
      const defaultCategoryId = 'healing-divine-health';
      const clipRef = db.collection('clips').doc(clip.id);
      
      batch.update(clipRef, {
        categoryId: defaultCategoryId
      });
      
      fixCount++;
      console.log(`Fixing clip ${clip.id}: ${clip.categoryId} -> ${defaultCategoryId}`);
    }
    
    if (fixCount > 0) {
      await batch.commit();
    }

    return NextResponse.json({
      success: true,
      totalClips: clips.length,
      problemClips: problemClips.length,
      fixed: fixCount,
      validCategories: validCategoryNames,
      details: {
        problemClips: problemClips.slice(0, 5) // Show first 5 problem clips
      }
    });

  } catch (error: any) {
    console.error('Error checking clips:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check clips' },
      { status: 500 }
    );
  }
}