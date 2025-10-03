import { NextResponse } from 'next/server';
import { adminDb } from '../../../../lib/firebase-admin';

export async function DELETE() {
  try {
    if (!adminDb) {
      console.warn('Firebase Admin not initialized');
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }

    console.log('Starting database cleanup...');

    // Delete all clips
    const clipsSnapshot = await adminDb.collection('clips').get();
    const clipDeletePromises = clipsSnapshot.docs.map(doc => doc.ref.delete());
    await Promise.all(clipDeletePromises);
    console.log(`Deleted ${clipsSnapshot.size} clips`);

    // Delete all videos
    const videosSnapshot = await adminDb.collection('videos').get();
    const videoDeletePromises = videosSnapshot.docs.map(doc => doc.ref.delete());
    await Promise.all(videoDeletePromises);
    console.log(`Deleted ${videosSnapshot.size} videos`);

    // Delete all categories
    const categoriesSnapshot = await adminDb.collection('categories').get();
    const categoryDeletePromises = categoriesSnapshot.docs.map(doc => doc.ref.delete());
    await Promise.all(categoryDeletePromises);
    console.log(`Deleted ${categoriesSnapshot.size} categories`);

    console.log('Database cleanup completed successfully');

    return NextResponse.json({
      success: true,
      message: 'Database cleared successfully',
      deleted: {
        clips: clipsSnapshot.size,
        videos: videosSnapshot.size,
        categories: categoriesSnapshot.size
      }
    });

  } catch (error) {
    console.error('Error clearing database:', error);
    return NextResponse.json(
      { error: 'Failed to clear database' },
      { status: 500 }
    );
  }
}