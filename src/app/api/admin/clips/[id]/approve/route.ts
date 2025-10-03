import { NextRequest, NextResponse } from 'next/server';
import { adminDb as db } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/requireAdmin';
import { processVideoAndUpload } from '@/lib/video-processor';

interface ApprovalRequest {
  action: 'approve' | 'release';
  adminComments?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin token
    const authHeader = request.headers.get('authorization');
    const admin = await requireAdmin(authHeader || undefined);

    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clipId = params.id;
    const body: ApprovalRequest = await request.json();

    if (!clipId) {
      return NextResponse.json({ error: 'Clip ID is required' }, { status: 400 });
    }

    console.log(`[Clip Reprocessing] Starting reprocessing for clip ${clipId} by admin ${admin.uid}`);

    // Get the clip document
    const clipRef = db!.collection('clips').doc(clipId);
    const clipDoc = await clipRef.get();

    if (!clipDoc.exists) {
      return NextResponse.json({ error: 'Clip not found' }, { status: 404 });
    }

    const clipData = clipDoc.data();

    // Validate we have the necessary data for reprocessing
    if (!clipData?.sourceVideoId || !clipData?.startTimeSeconds || !clipData?.endTimeSeconds) {
      return NextResponse.json({
        error: 'Missing required clip data for reprocessing (sourceVideoId, startTimeSeconds, endTimeSeconds)'
      }, { status: 400 });
    }

    // Construct YouTube URL from sourceVideoId
    const youtubeUrl = `https://www.youtube.com/watch?v=${clipData.sourceVideoId}`;

    console.log(`[Clip Reprocessing] Reprocessing clip from ${youtubeUrl} (${clipData.startTimeSeconds}s-${clipData.endTimeSeconds}s)`);

    try {
      // Mark clip as being reprocessed
      await clipRef.update({
        reprocessingStatus: 'in_progress',
        reprocessingStartedAt: new Date().toISOString(),
        reprocessingBy: admin.uid,
        videoProcessingError: null // Clear any previous errors
      });

      // Reprocess the video clip
      const processedVideoUrl = await processVideoAndUpload(
        youtubeUrl,
        clipData.startTimeSeconds,
        clipData.endTimeSeconds
      );

      // Update the clip with the new processed video URL and clear validation flags
      const updateData = {
        processedClipUrl: processedVideoUrl,
        videoProcessingError: null,
        reprocessingStatus: 'completed',
        reprocessingCompletedAt: new Date().toISOString(),
        status: 'published',
        lastReprocessedAt: new Date().toISOString(),
        reprocessedBy: admin.uid,
        adminComments: body.adminComments || null
      };

      await clipRef.update(updateData);

      console.log(`[Clip Reprocessing] Successfully reprocessed clip ${clipId}`);

      return NextResponse.json({
        success: true,
        message: 'Clip has been successfully reprocessed and released',
        clip: {
          id: clipId,
          title: clipData?.title,
          processedClipUrl: processedVideoUrl,
          status: 'published',
          reprocessedAt: updateData.lastReprocessedAt,
          reprocessedBy: admin.uid
        }
      });

    } catch (reprocessingError: any) {
      console.error(`[Clip Reprocessing] Failed to reprocess clip ${clipId}:`, reprocessingError);

      // Update clip with reprocessing failure
      await clipRef.update({
        reprocessingStatus: 'failed',
        reprocessingFailedAt: new Date().toISOString(),
        videoProcessingError: reprocessingError.message || 'Reprocessing failed',
        lastReprocessingError: reprocessingError.message || 'Unknown error'
      });

      return NextResponse.json({
        success: false,
        error: 'Reprocessing failed',
        details: reprocessingError.message || 'Unknown error',
        message: 'Clip reprocessing failed. The clip will remain flagged until successfully reprocessed.'
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('[Clip Approval] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to approve clip' },
      { status: 500 }
    );
  }
}