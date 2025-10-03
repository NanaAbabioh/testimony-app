import { NextResponse } from 'next/server';
import { adminDb } from '../../../../../lib/firebase-admin';

export async function POST(request: Request) {
  try {
    const { action, videoIds } = await request.json();

    if (!adminDb) {
      return NextResponse.json({
        success: false,
        error: 'Database not initialized'
      }, { status: 500 });
    }

    if (!action || !videoIds || !Array.isArray(videoIds)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request: action and videoIds array required'
      }, { status: 400 });
    }

    console.log(`Processing bulk action: ${action} for ${videoIds.length} videos`);

    let result = { deleted: { clips: 0, videos: 0 }, processed: 0 };

    switch (action) {
      case 'deleteTestimonies':
        result = await handleDeleteTestimonies(videoIds);
        break;
      
      case 'reprocess':
        result = await handleReprocessVideos(videoIds);
        break;
      
      case 'deleteVideos':
        result = await handleDeleteVideos(videoIds);
        break;
      
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action'
        }, { status: 400 });
    }

    console.log(`Bulk action ${action} completed:`, result);

    return NextResponse.json({
      success: true,
      action,
      deleted: result.deleted,
      processed: result.processed
    });

  } catch (error) {
    console.error('Error in bulk actions:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

async function handleDeleteTestimonies(videoIds: string[]) {
  if (!adminDb) throw new Error('Database not initialized');
  
  const batch = adminDb.batch();
  let deletedClips = 0;

  for (const videoId of videoIds) {
    console.log(`Deleting testimonies for video: ${videoId}`);
    
    // Get all clips for this video
    const clipsQuery = await adminDb.collection('clips')
      .where('sourceVideoId', '==', videoId)
      .get();

    console.log(`Found ${clipsQuery.size} clips for video ${videoId}`);

    // Add delete operations to batch
    clipsQuery.docs.forEach(doc => {
      batch.delete(doc.ref);
      deletedClips++;
    });
  }

  // Execute batch delete
  await batch.commit();
  console.log(`Deleted ${deletedClips} clips total`);

  return { deleted: { clips: deletedClips, videos: 0 }, processed: 0 };
}

async function handleReprocessVideos(videoIds: string[]) {
  if (!adminDb) throw new Error('Database not initialized');
  
  let processedCount = 0;
  let totalDeletedClips = 0;

  for (const videoId of videoIds) {
    try {
      console.log(`🔄 Reprocessing video: ${videoId}`);
      
      // Get video data
      const videoDoc = await adminDb.collection('videos').doc(videoId).get();
      if (!videoDoc.exists) {
        console.warn(`Video ${videoId} not found, skipping`);
        continue;
      }

      const videoData = videoDoc.data();
      const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;

      // STEP 1: Delete existing clips for this video BEFORE reprocessing
      console.log(`🗑️ Deleting existing testimonies for video ${videoId}...`);
      const clipsQuery = await adminDb.collection('clips')
        .where('sourceVideoId', '==', videoId)
        .get();

      const batch = adminDb.batch();
      clipsQuery.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();

      totalDeletedClips += clipsQuery.size;
      console.log(`✅ Deleted ${clipsQuery.size} existing clips for video ${videoId}`);

      // STEP 2: Start reprocessing by calling the process-video API internally
      console.log(`🎯 Starting fresh analysis for video ${videoId}...`);
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/process-video`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ youtubeUrl }),
      });

      if (response.ok) {
        processedCount++;
        console.log(`✅ Successfully reprocessed video ${videoId}`);
      } else {
        const errorData = await response.json();
        console.error(`❌ Failed to reprocess video ${videoId}:`, errorData.error);
      }

    } catch (error) {
      console.error(`❌ Error reprocessing video ${videoId}:`, error);
    }
  }

  console.log(`🎉 Reprocessing complete: ${processedCount} videos processed, ${totalDeletedClips} old testimonies deleted`);
  return { deleted: { clips: totalDeletedClips, videos: 0 }, processed: processedCount };
}

async function handleDeleteVideos(videoIds: string[]) {
  if (!adminDb) throw new Error('Database not initialized');
  
  const batch = adminDb.batch();
  let deletedClips = 0;
  let deletedVideos = 0;

  for (const videoId of videoIds) {
    console.log(`Deleting video and all testimonies: ${videoId}`);
    
    // Get all clips for this video
    const clipsQuery = await adminDb.collection('clips')
      .where('sourceVideoId', '==', videoId)
      .get();

    console.log(`Found ${clipsQuery.size} clips for video ${videoId}`);

    // Add clip delete operations to batch
    clipsQuery.docs.forEach(doc => {
      batch.delete(doc.ref);
      deletedClips++;
    });

    // Add video delete operation to batch
    const videoRef = adminDb.collection('videos').doc(videoId);
    batch.delete(videoRef);
    deletedVideos++;
  }

  // Execute batch delete
  await batch.commit();
  console.log(`Deleted ${deletedVideos} videos and ${deletedClips} clips total`);

  return { deleted: { clips: deletedClips, videos: deletedVideos }, processed: 0 };
}

export async function DELETE(request: Request) {
  try {
    const { action } = await request.json();

    if (!adminDb) {
      return NextResponse.json({
        success: false,
        error: 'Database not initialized'
      }, { status: 500 });
    }

    if (action === 'clear_all') {
      console.log('Starting database clear operation...');
      
      // Get all collections
      const [videosSnapshot, clipsSnapshot, categoriesSnapshot] = await Promise.all([
        adminDb.collection('videos').get(),
        adminDb.collection('clips').get(),
        adminDb.collection('categories').get()
      ]);

      // Use batch operations to delete everything
      const batch = adminDb.batch();
      
      // Delete all videos
      videosSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      // Delete all clips
      clipsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      // Delete all categories
      categoriesSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      
      console.log(`Database cleared: ${videosSnapshot.size} videos, ${clipsSnapshot.size} clips, ${categoriesSnapshot.size} categories deleted`);

      return NextResponse.json({
        success: true,
        message: 'Database cleared successfully',
        deleted: {
          videos: videosSnapshot.size,
          clips: clipsSnapshot.size,
          categories: categoriesSnapshot.size
        }
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action'
    }, { status: 400 });

  } catch (error) {
    console.error('Error in database clear operation:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}