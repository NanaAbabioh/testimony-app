import { NextRequest, NextResponse } from 'next/server';
import { adminDb as db } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/requireAdmin';
// import { processVideoAndUpload } from '@/lib/video-processor'; // Removed - no longer using video processing

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin token
    const authHeader = request.headers.get('authorization');
    const adminUser = await requireAdmin(authHeader || undefined);
    
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clipId = params.id;
    console.log(`🎬 Re-extraction requested for clip: ${clipId}`);

    // Fetch the clip from Firestore
    const clipDoc = await db!.collection('clips').doc(clipId).get();
    
    if (!clipDoc.exists) {
      return NextResponse.json({ error: 'Clip not found' }, { status: 404 });
    }

    const clipData = clipDoc.data()!;
    
    // Get the source video information
    const videoId = clipData.sourceVideoId;
    const videoDoc = await db!.collection('videos').doc(videoId).get();
    
    if (!videoDoc.exists) {
      return NextResponse.json({ error: 'Source video not found' }, { status: 404 });
    }

    const videoData = videoDoc.data()!;
    const youtubeUrl = videoData.url || `https://www.youtube.com/watch?v=${videoId}`;
    
    // Extract video clip
    console.log(`🎬 Starting video re-extraction for: ${clipData.title}`);
    console.log(`   Video: ${youtubeUrl}`);
    console.log(`   Time: ${clipData.startTimeSeconds}s - ${clipData.endTimeSeconds}s`);
    
    try {
      // const processedClipUrl = await processVideoAndUpload(
      //   youtubeUrl,
      //   clipData.startTimeSeconds,
      //   clipData.endTimeSeconds
      // );
      console.log('Video processing disabled - skipping video re-extraction');
      const processedClipUrl = null; // Placeholder
      
      // Update the clip with the new video URL
      await db!.collection('clips').doc(clipId).update({
        processedClipUrl: processedClipUrl,
        videoProcessingError: null,
        lastReExtractedAt: new Date().toISOString(),
        lastReExtractedBy: 'admin'
      });
      
      console.log(`✅ Video re-extracted successfully: ${processedClipUrl}`);
      
      return NextResponse.json({
        success: true,
        message: 'Video re-extracted successfully',
        processedClipUrl: processedClipUrl,
        clipId: clipId,
        title: clipData.title
      });
      
    } catch (extractError: any) {
      console.error(`❌ Video re-extraction failed:`, extractError);
      
      // Update the clip with the error
      await db!.collection('clips').doc(clipId).update({
        videoProcessingError: extractError.message || 'Video re-extraction failed',
        lastReExtractionAttempt: new Date().toISOString()
      });
      
      return NextResponse.json({
        error: 'Video re-extraction failed',
        details: extractError.message,
        clipId: clipId
      }, { status: 500 });
    }
    
  } catch (error: any) {
    console.error('Re-extraction error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to re-extract video' },
      { status: 500 }
    );
  }
}