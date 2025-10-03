import { NextResponse } from 'next/server';
import { adminDb } from '../../../../../lib/firebase-admin';
import { requireAdmin } from '../../../../../lib/requireAdmin';

export async function GET(request: Request) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('authorization');
    await requireAdmin(authHeader);

    if (!adminDb) {
      console.warn('Firebase Admin not initialized');
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'reviewing';
    const limit = parseInt(searchParams.get('limit') || '20');
    const cursor = searchParams.get('cursor');

    console.log(`🔍 Fetching videos with status: ${status}, limit: ${limit}`);

    // Get all videos first
    const videosSnapshot = await adminDb.collection('videos').get();
    console.log(`📊 Found ${videosSnapshot.size} videos in database`);
    
    if (videosSnapshot.size === 0) {
      console.log('⚠️ No videos found in database');
      return NextResponse.json({
        success: true,
        items: [],
        nextCursor: null
      });
    }

    const videos = [];

    for (const doc of videosSnapshot.docs) {
      const videoData = doc.data();
      console.log(`📹 Processing video ${doc.id}:`, videoData);
      
      // Count testimonies for this video
      const clipsSnapshot = await adminDb.collection('clips')
        .where('sourceVideoId', '==', doc.id)
        .get();
      
      // For now, we'll show all videos regardless of status since we don't have status on videos yet
      // In a real implementation, you'd filter by video status here
      videos.push({
        id: doc.id,
        title: videoData.title || 'Unknown Title',
        thumbnailUrl: videoData.thumbnailUrl || '',
        uploadDate: videoData.uploadDate || videoData.createdAt || new Date().toISOString(),
        createdAt: videoData.createdAt || new Date().toISOString(),
        status: videoData.status || status, // Use the requested status or video's actual status
        testimonyCount: clipsSnapshot.size,
        url: `https://www.youtube.com/watch?v=${doc.id}`
      });
    }

    // Sort videos chronologically by upload date (earliest first)
    videos.sort((a, b) => new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime());
    
    console.log(`✅ Returning ${videos.length} videos as 'items'`);
    console.log('Videos:', videos.map(v => ({ id: v.id, title: v.title, count: v.testimonyCount })));

    // Return in the format the frontend expects
    return NextResponse.json({
      success: true,
      items: videos, // Frontend expects 'items' not 'videos'
      nextCursor: null // For now, no pagination
    });

  } catch (error) {
    console.error('Error fetching videos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch videos' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('videoId');

    if (!videoId) {
      return NextResponse.json({ error: 'Video ID required' }, { status: 400 });
    }

    if (!adminDb) {
      console.warn('Firebase Admin not initialized');
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }

    // Delete all clips for this video
    const clipsSnapshot = await adminDb.collection('clips')
      .where('sourceVideoId', '==', videoId)
      .get();
    
    const clipDeletePromises = clipsSnapshot.docs.map(doc => doc.ref.delete());
    await Promise.all(clipDeletePromises);

    // Delete the video document
    await adminDb.collection('videos').doc(videoId).delete();

    return NextResponse.json({
      success: true,
      message: `Video deleted successfully`,
      deleted: {
        video: 1,
        clips: clipsSnapshot.size
      }
    });

  } catch (error) {
    console.error('Error deleting video:', error);
    return NextResponse.json(
      { error: 'Failed to delete video' },
      { status: 500 }
    );
  }
}