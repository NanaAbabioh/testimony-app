import { NextResponse } from 'next/server';
import { adminDb } from '../../../../../lib/firebase-admin';

export async function POST(request: Request) {
  try {
    const { testimonyId, action } = await request.json();

    if (!adminDb) {
      return NextResponse.json({
        success: false,
        error: 'Database not initialized'
      }, { status: 500 });
    }

    if (!testimonyId || !action || !['like', 'unlike'].includes(action)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request: testimonyId and action (like/unlike) required'
      }, { status: 400 });
    }

    console.log(`${action} testimony: ${testimonyId}`);

    // Get current testimony document
    const testimonyRef = adminDb.collection('clips').doc(testimonyId);
    const testimonyDoc = await testimonyRef.get();

    if (!testimonyDoc.exists) {
      return NextResponse.json({
        success: false,
        error: 'Testimony not found'
      }, { status: 404 });
    }

    const currentData = testimonyDoc.data();
    const currentLikes = currentData?.likes || 0;

    // Update like count
    const newLikes = action === 'like' ? currentLikes + 1 : Math.max(0, currentLikes - 1);

    await testimonyRef.update({
      likes: newLikes,
      lastLikedAt: new Date().toISOString()
    });

    console.log(`Updated ${testimonyId} likes: ${currentLikes} -> ${newLikes}`);

    return NextResponse.json({
      success: true,
      action,
      newLikes
    });

  } catch (error) {
    console.error('Error updating like:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}