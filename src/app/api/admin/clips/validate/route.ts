import { NextRequest, NextResponse } from 'next/server';
import { adminDb as db } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/requireAdmin';
import { batchValidateClips, ClipTimeData } from '@/lib/clip-validator';

export async function GET(request: NextRequest) {
  try {
    // Verify admin token
    const authHeader = request.headers.get('authorization');
    const admin = await requireAdmin(authHeader || undefined);
    
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const episode = searchParams.get('episode');
    const categoryId = searchParams.get('categoryId');
    const severityFilter = searchParams.get('severity'); // 'high', 'medium', 'low'

    console.log('[Clip Validation] Starting validation check...');

    // Build query
    let query = db!.collection('clips').orderBy('createdAt', 'desc');

    if (episode) {
      query = query.where('episode', '==', episode);
    }

    if (categoryId) {
      query = query.where('categoryId', '==', categoryId);
    }

    const snapshot = await query.get();
    
    // Convert to validation format and filter out manually approved clips
    const allClips: ClipTimeData[] = [];
    const approvedClipIds = new Set<string>();

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const clip = {
        id: doc.id,
        startTimeSeconds: data.startTimeSeconds || 0,
        endTimeSeconds: data.endTimeSeconds || 0,
        episode: data.episode,
        title: data.title
      };

      // Track successfully reprocessed clips and false positives to exclude from validation
      if ((data.reprocessingStatus === 'completed' && data.processedClipUrl && !data.videoProcessingError) ||
          (data.validationStatus === 'approved' && data.manuallyReviewed === true)) {
        approvedClipIds.add(doc.id);
      }

      allClips.push(clip);
    });

    // Filter out manually approved clips from time validation
    const clipsForTimeValidation = allClips.filter(clip => !approvedClipIds.has(clip.id));

    console.log(`[Clip Validation] Validating ${allClips.length} clips (${clipsForTimeValidation.length} for time validation, ${approvedClipIds.size} approved/reprocessed)...`);

    // Run time validation only on non-approved clips
    const timeValidation = batchValidateClips(clipsForTimeValidation);
    
    // Check for video extraction failures
    const videoExtractionIssues = [];
    for (const doc of snapshot.docs) {
      const data = doc.data();

      // Skip clips that have been successfully reprocessed or marked as false positives
      if ((data.reprocessingStatus === 'completed' && data.processedClipUrl && !data.videoProcessingError) ||
          (data.validationStatus === 'approved' && data.manuallyReviewed === true)) {
        continue;
      }

      const hasVideoProcessingError = data.videoProcessingError;
      const hasProcessedClipUrl = data.processedClipUrl && data.processedClipUrl.trim() !== '';

      if (hasVideoProcessingError || !hasProcessedClipUrl) {
        videoExtractionIssues.push({
          id: doc.id,
          title: data.title,
          episode: data.episode,
          startTimeSeconds: data.startTimeSeconds || 0,
          endTimeSeconds: data.endTimeSeconds || 0,
          validation: {
            type: 'video_extraction_failure',
            severity: 'high' as const,
            message: hasVideoProcessingError 
              ? `Video extraction failed: ${data.videoProcessingError}`
              : 'No extracted video file available',
            details: {
              hasProcessedClipUrl,
              hasVideoProcessingError,
              videoProcessingError: data.videoProcessingError || null,
              processedClipUrl: data.processedClipUrl || null
            }
          }
        });
      }
    }
    
    // Combine time validation issues with video extraction issues
    const validation = {
      ...timeValidation,
      flaggedClips: [...timeValidation.flaggedClips, ...videoExtractionIssues],
      summary: {
        ...timeValidation.summary,
        flagged: timeValidation.summary.flagged + videoExtractionIssues.length,
        videoExtractionFailures: videoExtractionIssues.length
      }
    };

    // Filter by severity if requested
    let flaggedClips = validation.flaggedClips;
    if (severityFilter) {
      flaggedClips = flaggedClips.filter(clip => clip.validation.severity === severityFilter);
    }

    // Add additional metadata for admin dashboard
    const enrichedFlaggedClips = await Promise.all(
      flaggedClips.map(async (clip) => {
        const doc = await db!.collection('clips').doc(clip.id).get();
        const fullData = doc.data();
        
        return {
          ...clip,
          categoryId: fullData?.categoryId,
          createdAt: fullData?.createdAt,
          createdBy: fullData?.createdBy,
          sourceVideoId: fullData?.sourceVideoId,
          duration: clip.endTimeSeconds - clip.startTimeSeconds,
          formattedStartTime: formatTime(clip.startTimeSeconds),
          formattedEndTime: formatTime(clip.endTimeSeconds),
          formattedDuration: formatDuration(clip.endTimeSeconds - clip.startTimeSeconds)
        };
      })
    );

    console.log(`[Clip Validation] Found ${validation.summary.flagged} issues`);

    return NextResponse.json({
      success: true,
      validation: {
        ...validation,
        flaggedClips: enrichedFlaggedClips
      },
      filters: {
        episode,
        categoryId,
        severity: severityFilter
      }
    });

  } catch (error: any) {
    console.error('[Clip Validation] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Validation failed' },
      { status: 500 }
    );
  }
}

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
}

function formatDuration(seconds: number): string {
  const absSeconds = Math.abs(seconds);
  const hours = Math.floor(absSeconds / 3600);
  const minutes = Math.floor((absSeconds % 3600) / 60);
  const secs = absSeconds % 60;
  
  let result = '';
  if (hours > 0) result += `${hours}h `;
  if (minutes > 0) result += `${minutes}m `;
  if (secs > 0 || result === '') result += `${secs}s`;
  
  return seconds < 0 ? `-${result.trim()}` : result.trim();
}