import { NextResponse } from 'next/server';
import { adminDb } from '../../../../../lib/firebase-admin';

export async function GET() {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: 'Database not available' });
    }

    // Get all clips without any filters
    const clipsSnapshot = await adminDb.collection('clips').get();
    
    const clips: any[] = [];
    clipsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      clips.push({
        id: doc.id,
        title: data.title,
        category: data.category,
        categoryId: data.categoryId,
        sourceVideoId: data.sourceVideoId,
        createdAt: data.createdAt,
        hasFullText: !!data.fullText,
        startTime: data.startTimeSeconds,
        endTime: data.endTimeSeconds
      });
    });

    // Get all categories
    const categoriesSnapshot = await adminDb.collection('categories').get();
    const categories = categoriesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({
      success: true,
      totalClips: clips.length,
      clips: clips,
      categories: categories
    });

  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}