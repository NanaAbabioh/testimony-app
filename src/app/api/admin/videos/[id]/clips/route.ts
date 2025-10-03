import { NextRequest, NextResponse } from "next/server";
import { adminDb as db } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/requireAdmin";

// GET - Fetch all clips for a video
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin(req.headers.get("authorization") || undefined);
    
    const videoId = params.id;
    
    // Fetch clips for this video - check both sourceVideoId and videoId fields
    const clipsQuery1 = await db!.collection("clips")
      .where("sourceVideoId", "==", videoId)
      .get();
      
    const clipsQuery2 = await db!.collection("clips")
      .where("videoId", "==", videoId)
      .get();
    
    // Combine results and remove duplicates
    const clipMap = new Map();
    
    [...clipsQuery1.docs, ...clipsQuery2.docs].forEach(doc => {
      const data = doc.data();
      clipMap.set(doc.id, {
        id: doc.id,
        title: data.title || data.titleShort || '',
        categoryId: data.categoryId || '',
        startTimeSeconds: data.startTimeSeconds || data.startSec || 0,
        endTimeSeconds: data.endTimeSeconds || data.endSec || 0,
        episode: data.episode || '',
        briefDescription: data.briefDescription || data.fullText || '',
        language: data.language || 'English',
        sourceVideoId: data.sourceVideoId || data.videoId || videoId,
        status: data.status || 'reviewing',
        createdAt: data.createdAt
      });
    });
    
    const clips = Array.from(clipMap.values());
    
    // Sort by start time
    clips.sort((a, b) => a.startTimeSeconds - b.startTimeSeconds);
    
    return NextResponse.json({
      success: true,
      clips,
      count: clips.length
    });

  } catch (error: any) {
    console.error("Error fetching clips:", error);
    
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

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin(req.headers.get("authorization") || undefined);
    
    const videoId = params.id;
    
    // Check if video exists
    const videoDoc = await db!.collection("videos").doc(videoId).get();
    if (!videoDoc.exists) {
      return NextResponse.json(
        { error: "Video not found" },
        { status: 404 }
      );
    }

    console.log(`Clearing all testimonies for video ${videoId}...`);

    // Get all clips for this video
    const clipsQuery = await db!.collection("clips")
      .where("sourceVideoId", "==", videoId)
      .get();

    console.log(`Found ${clipsQuery.size} testimonies to clear for video ${videoId}`);

    if (clipsQuery.size === 0) {
      return NextResponse.json({
        success: true,
        message: "No testimonies to clear",
        deleted: 0
      });
    }

    // Use batch operations to delete all clips
    const batch = db!.batch();
    
    // Add all clip deletions to batch
    clipsQuery.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Execute batch delete
    await batch.commit();

    console.log(`Successfully cleared ${clipsQuery.size} testimonies for video ${videoId}`);

    return NextResponse.json({
      success: true,
      message: `${clipsQuery.size} testimonies cleared successfully`,
      deleted: clipsQuery.size
    });

  } catch (error: any) {
    console.error("Error clearing testimonies:", error);
    
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