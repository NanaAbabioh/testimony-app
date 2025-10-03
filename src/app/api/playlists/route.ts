import { NextResponse } from 'next/server';
import { adminDb } from '../../../../lib/firebase-admin';

export async function GET() {
  try {
    if (!adminDb) {
      return NextResponse.json({
        success: false,
        error: 'Database not initialized'
      }, { status: 500 });
    }

    // Get all playlists (for now we'll use a simple collection)
    const playlistsSnapshot = await adminDb.collection('playlists').get();
    
    const playlists = playlistsSnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      description: doc.data().description || '',
      createdAt: doc.data().createdAt,
      testimonyIds: doc.data().testimonyIds || [],
      count: (doc.data().testimonyIds || []).length
    }));

    return NextResponse.json({
      success: true,
      playlists
    });

  } catch (error) {
    console.error('Error fetching playlists:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, description, testimonyId } = await request.json();

    if (!adminDb) {
      return NextResponse.json({
        success: false,
        error: 'Database not initialized'
      }, { status: 500 });
    }

    if (!name) {
      return NextResponse.json({
        success: false,
        error: 'Playlist name is required'
      }, { status: 400 });
    }

    console.log(`Creating new playlist: ${name}`);

    const playlistData = {
      name,
      description: description || '',
      createdAt: new Date().toISOString(),
      testimonyIds: testimonyId ? [testimonyId] : []
    };

    const docRef = await adminDb.collection('playlists').add(playlistData);

    console.log(`Created playlist ${docRef.id}: ${name}`);

    return NextResponse.json({
      success: true,
      playlist: {
        id: docRef.id,
        ...playlistData,
        count: playlistData.testimonyIds.length
      }
    });

  } catch (error) {
    console.error('Error creating playlist:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}