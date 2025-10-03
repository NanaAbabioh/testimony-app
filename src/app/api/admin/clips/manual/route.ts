export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { adminDb as db } from "../../../../../../lib/firebase-admin";
import { requireAdmin } from "../../../../../../lib/requireAdmin";
import { parseTimeToSeconds } from "../../../../../../lib/parse";
import { processVideoAndUpload } from "../../../../../../lib/video-processor";

interface CreateClipRequest {
  videoUrl?: string;
  videoId?: string;
  title: string;
  categoryId: string;
  startTime: string | number;
  endTime: string | number;
  start?: string | number;
  end?: string | number;
  description?: string;
  transcript?: string;
  transcriptLang?: string;
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req.headers.get("authorization") || undefined);
    
    const body = await req.json() as CreateClipRequest;
    const {
      videoUrl,
      videoId: providedVideoId,
      title,
      categoryId,
      startTime,
      endTime,
      start,
      end,
      description = "",
      transcript = "",
      transcriptLang = "en"
    } = body;

    // Extract video ID from URL if provided, otherwise use provided ID
    let videoId = providedVideoId;
    if (videoUrl && !videoId) {
      const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
        /youtube\.com\/watch\?.*v=([^&\n?#]+)/
      ];

      for (const pattern of patterns) {
        const match = videoUrl.match(pattern);
        if (match) {
          videoId = match[1];
          break;
        }
      }
    }

    if (!videoId?.trim()) {
      return NextResponse.json(
        { error: "videoId is required and cannot be empty" }, 
        { status: 400 }
      );
    }

    if (!title?.trim()) {
      return NextResponse.json(
        { error: "title is required and cannot be empty" }, 
        { status: 400 }
      );
    }

    if (!categoryId?.trim()) {
      return NextResponse.json(
        { error: "categoryId is required and cannot be empty" }, 
        { status: 400 }
      );
    }

    if (title.trim().length > 200) {
      return NextResponse.json(
        { error: "title must be 200 characters or less" }, 
        { status: 400 }
      );
    }

    let startSec: number;
    let endSec: number;

    // Use startTime/endTime if provided, otherwise fall back to start/end
    const startTimeValue = startTime || start;
    const endTimeValue = endTime || end;

    try {
      startSec = parseTimeToSeconds(startTimeValue);
    } catch (error) {
      return NextResponse.json(
        { error: `Invalid start time: ${error instanceof Error ? error.message : "Unknown error"}` },
        { status: 400 }
      );
    }

    try {
      endSec = parseTimeToSeconds(endTimeValue);
    } catch (error) {
      return NextResponse.json(
        { error: `Invalid end time: ${error instanceof Error ? error.message : "Unknown error"}` },
        { status: 400 }
      );
    }

    if (endSec <= startSec) {
      return NextResponse.json(
        { error: "End time must be greater than start time" },
        { status: 400 }
      );
    }

    const duration = endSec - startSec;
    if (duration > 1800) {
      return NextResponse.json(
        { error: "Clip duration cannot exceed 30 minutes" },
        { status: 400 }
      );
    }

    if (duration < 5) {
      return NextResponse.json(
        { error: "Clip duration must be at least 5 seconds" },
        { status: 400 }
      );
    }

    const categoryDoc = await db.collection("categories").doc(categoryId).get();
    if (!categoryDoc.exists) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 400 }
      );
    }

    // Create or update video document in Firestore
    const videoRef = db.collection('videos').doc(videoId);
    const videoDoc = await videoRef.get();

    if (!videoDoc.exists) {
      // Create video document if it doesn't exist
      await videoRef.set({
        id: videoId,
        title: `Video ${videoId}`, // You might want to get the actual title from YouTube API
        url: videoUrl || `https://www.youtube.com/watch?v=${videoId}`,
        thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        createdAt: new Date().toISOString(),
        uploadDate: new Date().toISOString(),
        status: 'live'
      });
    }

    // Process video extraction
    let processedClipUrl = '';
    let videoProcessingError = null;

    try {
      console.log(`🎬 Extracting video clip: ${title} (${startSec}s-${endSec}s)`);
      const youtubeUrlForProcessing = videoUrl || `https://www.youtube.com/watch?v=${videoId}`;
      processedClipUrl = await processVideoAndUpload(
        youtubeUrlForProcessing,
        startSec,
        endSec
      );
      console.log(`✅ Video extracted successfully: ${processedClipUrl}`);
    } catch (extractError) {
      console.warn(`⚠️ Video extraction failed for clip: ${extractError instanceof Error ? extractError.message : 'Unknown error'}`);
      videoProcessingError = extractError instanceof Error ? extractError.message : 'Unknown extraction error';
      // Continue without video extraction - clip will still be saved but will show full YouTube video
    }

    const clipDoc = db.collection("clips").doc();
    const clipData = {
      id: clipDoc.id,
      sourceVideoId: videoId.trim(),
      title: title.trim(),
      categoryId: categoryId.trim(),
      startTimeSeconds: startSec,
      endTimeSeconds: endSec,
      duration,
      fullText: description || transcript.trim(),
      language: transcriptLang.trim() || "English",
      processedClipUrl: processedClipUrl,
      videoProcessingError: videoProcessingError,
      status: "published",
      savedCount: 0,
      createdAt: new Date().toISOString(),
      createdBy: admin.uid,
      source: "manual",
      confidence: 1.0,
    };

    await clipDoc.set(clipData);

    return NextResponse.json({
      success: true,
      id: clipDoc.id,
      clip: {
        id: clipDoc.id,
        title: clipData.title,
        duration: clipData.duration,
        startTimeSeconds: clipData.startTimeSeconds,
        endTimeSeconds: clipData.endTimeSeconds,
        processedClipUrl: clipData.processedClipUrl,
        videoProcessingError: clipData.videoProcessingError
      }
    });

  } catch (error: any) {
    console.error("Error creating manual clip:", error);
    
    if (error.message?.includes("Unauthorized") || error.status === 401) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}