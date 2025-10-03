import { NextRequest, NextResponse } from "next/server";
import { adminDb as db } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/requireAdmin";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin(req.headers.get("authorization") || undefined);
    
    const videoDoc = await db!.collection("videos").doc(params.id).get();
    
    if (!videoDoc.exists) {
      return NextResponse.json(
        { error: "Video not found" },
        { status: 404 }
      );
    }

    const videoData = videoDoc.data();
    
    // Get clip count for this video
    const clipsSnapshot = await db!.collection("clips")
      .where("sourceVideoId", "==", params.id)
      .get();

    const video = {
      id: videoDoc.id,
      ...videoData,
      clipCount: clipsSnapshot.size,
      url: `https://www.youtube.com/watch?v=${params.id}`
    };

    return NextResponse.json({ video });

  } catch (error: any) {
    console.error("Error fetching video:", error);
    
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

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin(req.headers.get("authorization") || undefined);
    
    const body = await req.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { error: "status is required" },
        { status: 400 }
      );
    }

    const validStatuses = ["submitted", "processing", "reviewing", "live", "hidden"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `status must be one of: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    // Patch 2: Mark videos when they first reach Live status
    const vref = db!.collection("videos").doc(params.id);
    const snap = await vref.get();
    
    if (!snap.exists) {
      return NextResponse.json(
        { error: "Video not found" },
        { status: 404 }
      );
    }
    
    const prev = snap.data() || {};
    
    await vref.update({
      status,
      processedAt: status === "reviewing" || status === "live" ? new Date() : prev.processedAt || null,
      wentLiveAt: status === "live" && !prev.wentLiveAt ? new Date() : prev.wentLiveAt || null,
      lastModifiedBy: admin.uid,
      lastModifiedAt: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: `Video status updated to ${status}`,
      status,
      wentLiveAt: status === "live" && !prev.wentLiveAt ? new Date().toISOString() : prev.wentLiveAt
    });

  } catch (error: any) {
    console.error("Error updating video status:", error);
    
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

    console.log(`Deleting video ${videoId} and all associated clips...`);

    // Get all clips for this video
    const clipsQuery = await db!.collection("clips")
      .where("sourceVideoId", "==", videoId)
      .get();

    console.log(`Found ${clipsQuery.size} clips to delete for video ${videoId}`);

    // Use batch operations to delete everything
    const batch = db!.batch();
    
    // Add all clip deletions to batch
    clipsQuery.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Add video deletion to batch
    batch.delete(videoDoc.ref);

    // Execute batch delete
    await batch.commit();

    console.log(`Successfully deleted video ${videoId} and ${clipsQuery.size} clips`);

    return NextResponse.json({
      success: true,
      message: `Video and ${clipsQuery.size} associated clips deleted successfully`,
      deleted: {
        videoId: videoId,
        clipsDeleted: clipsQuery.size
      }
    });

  } catch (error: any) {
    console.error("Error deleting video:", error);
    
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