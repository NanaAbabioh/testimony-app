import { NextResponse } from 'next/server';
import { adminDb } from '../../../../lib/firebase-admin';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    if (!adminDb) {
      console.warn('Firebase Admin not initialized - returning empty testimonies');
      return NextResponse.json({
        success: true,
        count: 0,
        testimonies: [],
        category: category || 'all',
        message: 'Database not initialized. Process some videos first.'
      });
    }

    console.log(`Fetching testimonies for category: ${category || 'all'}`);
    
    let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> | FirebaseFirestore.CollectionReference<FirebaseFirestore.DocumentData> = adminDb.collection('clips');
    
    if (category && category !== 'all') {
      // Use category name directly for faster querying
      query = query.where('category', '==', category);
      console.log(`Filtering by category: ${category}`);
    }

    // Remove orderBy to avoid index issues and sort client-side instead
    const clipsSnapshot = await query.get();
    console.log(`Found ${clipsSnapshot.size} clips in database`);
    
    const testimonies = [];
    
    for (const doc of clipsSnapshot.docs) {
      const clipData = doc.data();
      console.log(`Processing clip: ${clipData.title} - Category: ${clipData.category}`);
      
      // Get source video info
      let videoInfo = null;
      if (clipData.sourceVideoId) {
        const videoDoc = await adminDb.collection('videos').doc(clipData.sourceVideoId).get();
        if (videoDoc.exists) {
          videoInfo = videoDoc.data();
        }
      }
      
      testimonies.push({
        id: doc.id,
        title: clipData.title,
        fullText: clipData.fullText,
        startTimeSeconds: clipData.startTimeSeconds,
        endTimeSeconds: clipData.endTimeSeconds,
        sourceVideoId: clipData.sourceVideoId,
        sourceVideoTitle: videoInfo?.title || 'Unknown Video',
        thumbnailUrl: videoInfo?.thumbnailUrl || `https://img.youtube.com/vi/${clipData.sourceVideoId}/maxresdefault.jpg`,
        uploadDate: videoInfo?.uploadDate || clipData.createdAt,
        categoryId: clipData.categoryId,
        createdAt: clipData.createdAt
      });
    }

    // Sort testimonies by creation date client-side (newest first)
    testimonies.sort((a, b) => {
      const dateA = new Date(a.createdAt || '1970-01-01');
      const dateB = new Date(b.createdAt || '1970-01-01');
      return dateB.getTime() - dateA.getTime();
    });

    console.log(`Returning ${testimonies.length} testimonies for category: ${category || 'all'}`);

    return NextResponse.json({
      success: true,
      count: testimonies.length,
      testimonies: testimonies,
      category: category || 'all'
    });

  } catch (error) {
    console.error('Error fetching testimonies:', error);
    return NextResponse.json({
      success: true,
      count: 0,
      testimonies: [],
      category: 'all',
      message: 'Error connecting to database. Please check Firebase configuration.'
    });
  }
}