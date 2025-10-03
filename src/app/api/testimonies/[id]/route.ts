import { NextResponse } from 'next/server';
import { adminDb } from '../../../../../lib/firebase-admin';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const testimonyId = params.id;

    if (!adminDb) {
      console.warn('Firebase Admin not initialized');
      return NextResponse.json({
        success: false,
        error: 'Database not initialized'
      });
    }

    console.log(`Fetching testimony with ID: ${testimonyId}`);
    
    // Get the specific testimony by ID
    const clipDoc = await adminDb.collection('clips').doc(testimonyId).get();
    
    if (!clipDoc.exists) {
      console.log(`Testimony not found: ${testimonyId}`);
      return NextResponse.json({
        success: false,
        error: 'Testimony not found'
      });
    }

    const clipData = clipDoc.data();
    console.log(`Found testimony: ${clipData?.title}`);
    
    // Get source video info
    let videoInfo = null;
    if (clipData?.sourceVideoId) {
      const videoDoc = await adminDb.collection('videos').doc(clipData.sourceVideoId).get();
      if (videoDoc.exists) {
        videoInfo = videoDoc.data();
      }
    }

    // Get category name
    let categoryName = 'Unknown';
    if (clipData?.categoryId) {
      const categoryDoc = await adminDb.collection('categories').doc(clipData.categoryId).get();
      if (categoryDoc.exists) {
        categoryName = categoryDoc.data()?.name || 'Unknown';
      }
    }
    
    const testimony = {
      id: clipDoc.id,
      title: clipData?.title || 'Untitled',
      fullText: clipData?.fullText || '',
      summary: clipData?.summary || '',
      startTimeSeconds: clipData?.startTimeSeconds || 0,
      endTimeSeconds: clipData?.endTimeSeconds || 0,
      sourceVideoId: clipData?.sourceVideoId || '',
      sourceVideoTitle: videoInfo?.title || 'Unknown Video',
      thumbnailUrl: videoInfo?.thumbnailUrl || `https://img.youtube.com/vi/${clipData?.sourceVideoId}/maxresdefault.jpg`,
      uploadDate: videoInfo?.uploadDate || clipData?.createdAt || new Date().toISOString(),
      category: categoryName,
      categoryId: clipData?.categoryId || '',
      createdAt: clipData?.createdAt || new Date().toISOString()
    };

    console.log(`Returning testimony: ${testimony.title}`);

    return NextResponse.json({
      success: true,
      testimony: testimony
    });

  } catch (error) {
    console.error('Error fetching testimony:', error);
    return NextResponse.json({
      success: false,
      error: 'Error fetching testimony'
    });
  }
}