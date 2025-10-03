export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../../../lib/firebaseAdmin";
import { requireAdmin } from "../../../../../../lib/requireAdmin";

interface BulkPublishRequest {
  clipIds: string[];
  status: "live" | "hidden";
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req.headers.get("authorization") || undefined);
    
    const body = await req.json() as BulkPublishRequest;
    const { clipIds, status } = body;

    if (!Array.isArray(clipIds) || clipIds.length === 0) {
      return NextResponse.json(
        { error: "clipIds must be a non-empty array" },
        { status: 400 }
      );
    }

    if (!["live", "hidden"].includes(status)) {
      return NextResponse.json(
        { error: "status must be 'live' or 'hidden'" },
        { status: 400 }
      );
    }

    if (clipIds.length > 100) {
      return NextResponse.json(
        { error: "Cannot update more than 100 clips at once" },
        { status: 400 }
      );
    }

    const batch = db.batch();
    let updatedCount = 0;

    // Process clips in batches for safety
    for (const id of clipIds) {
      const ref = db.collection("clips").doc(id);
      const doc = await ref.get();
      
      if (!doc.exists) continue;
      
      const prev = doc.data() || {};
      const update: any = { 
        status, 
        lastModifiedAt: new Date().toISOString(),
        lastModifiedBy: admin.uid
      };
      
      // Patch 1: Set publishedAt when status becomes "live" for the first time
      if (status === "live" && !prev.publishedAt) {
        update.publishedAt = new Date();
      }
      
      batch.update(ref, update);
      updatedCount++;
    }

    await batch.commit();

    return NextResponse.json({
      success: true,
      updatedCount,
      status,
      message: `Successfully updated ${updatedCount} clips to ${status} status`
    });

  } catch (error: any) {
    console.error("Error in bulk publish:", error);
    
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