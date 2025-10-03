import { NextResponse } from 'next/server';
import { adminDb } from '../../../../../lib/firebase-admin';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const playlistId = params.id;

    if (!adminDb) {
      return NextResponse.json({
        success: false,
        error: 'Database not initialized'
      }, { status: 500 });
    }

    console.log(`Fetching playlist: ${playlistId}`);

    // Get the playlist
    const playlistDoc = await adminDb.collection('playlists').doc(playlistId).get();

    if (!playlistDoc.exists) {
      return NextResponse.json({
        success: false,
        error: 'Playlist not found'
      }, { status: 404 });
    }

    const playlistData = playlistDoc.data();
    const testimonyIds = playlistData?.testimonyIds || [];

    // Get all testimonies in the playlist
    const testimonies = [];
    for (const testimonyId of testimonyIds) {
      const testimonyDoc = await adminDb.collection('clips').doc(testimonyId).get();
      if (testimonyDoc.exists) {
        const testimonyData = testimonyDoc.data();
        
        // Get source video info
        let videoInfo = null;
        if (testimonyData?.sourceVideoId) {
          const videoDoc = await adminDb.collection('videos').doc(testimonyData.sourceVideoId).get();
          if (videoDoc.exists) {
            videoInfo = videoDoc.data();
          }
        }

        // Get category name
        let categoryName = 'Unknown';
        if (testimonyData?.categoryId) {
          const categoryDoc = await adminDb.collection('categories').doc(testimonyData.categoryId).get();
          if (categoryDoc.exists) {
            categoryName = categoryDoc.data()?.name || 'Unknown';
          }
        }

        testimonies.push({
          id: testimonyDoc.id,
          title: testimonyData?.title || 'Untitled',
          fullText: testimonyData?.fullText || '',
          summary: testimonyData?.summary || '',
          startTimeSeconds: testimonyData?.startTimeSeconds || 0,
          endTimeSeconds: testimonyData?.endTimeSeconds || 0,
          sourceVideoId: testimonyData?.sourceVideoId || '',
          sourceVideoTitle: videoInfo?.title || 'Unknown Video',
          thumbnailUrl: videoInfo?.thumbnailUrl || `https://img.youtube.com/vi/${testimonyData?.sourceVideoId}/maxresdefault.jpg`,
          category: categoryName
        });
      }
    }

    const playlist = {
      id: playlistDoc.id,
      name: playlistData?.name || 'Untitled Playlist',
      description: playlistData?.description || '',
      createdAt: playlistData?.createdAt || new Date().toISOString(),
      testimonyIds,
      count: testimonies.length,
      testimonies
    };

    return NextResponse.json({
      success: true,
      playlist
    });

  } catch (error) {
    console.error('Error fetching playlist:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const playlistId = params.id;

    if (!adminDb) {
      return NextResponse.json({
        success: false,
        error: 'Database not initialized'
      }, { status: 500 });
    }

    console.log(`Deleting playlist: ${playlistId}`);

    // Check if playlist exists
    const playlistDoc = await adminDb.collection('playlists').doc(playlistId).get();

    if (!playlistDoc.exists) {
      return NextResponse.json({
        success: false,
        error: 'Playlist not found'
      }, { status: 404 });
    }

    // Delete the playlist
    await adminDb.collection('playlists').doc(playlistId).delete();

    console.log(`Deleted playlist: ${playlistId}`);

    return NextResponse.json({
      success: true,
      message: 'Playlist deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting playlist:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}