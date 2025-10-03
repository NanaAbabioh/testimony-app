import { NextResponse } from 'next/server';
import { adminDb } from '../../../../../lib/firebase-admin';

export async function POST(request: Request) {
  try {
    const { playlistId, testimonyId } = await request.json();

    if (!adminDb) {
      return NextResponse.json({
        success: false,
        error: 'Database not initialized'
      }, { status: 500 });
    }

    if (!playlistId || !testimonyId) {
      return NextResponse.json({
        success: false,
        error: 'Both playlistId and testimonyId are required'
      }, { status: 400 });
    }

    console.log(`Adding testimony ${testimonyId} to playlist ${playlistId}`);

    // Get the playlist
    const playlistRef = adminDb.collection('playlists').doc(playlistId);
    const playlistDoc = await playlistRef.get();

    if (!playlistDoc.exists) {
      return NextResponse.json({
        success: false,
        error: 'Playlist not found'
      }, { status: 404 });
    }

    const playlistData = playlistDoc.data();
    const currentTestimonies = playlistData?.testimonyIds || [];

    // Check if testimony is already in playlist
    if (currentTestimonies.includes(testimonyId)) {
      return NextResponse.json({
        success: false,
        error: 'Testimony already in playlist'
      }, { status: 400 });
    }

    // Add testimony to playlist
    const updatedTestimonies = [...currentTestimonies, testimonyId];

    await playlistRef.update({
      testimonyIds: updatedTestimonies,
      updatedAt: new Date().toISOString()
    });

    console.log(`Added testimony to playlist. New count: ${updatedTestimonies.length}`);

    return NextResponse.json({
      success: true,
      message: 'Testimony added to playlist',
      newCount: updatedTestimonies.length
    });

  } catch (error) {
    console.error('Error adding to playlist:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}