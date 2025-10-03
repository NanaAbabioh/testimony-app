export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../../../lib/firebaseAdmin";
import { verifyIdToken } from "../../../../../../lib/authMiddleware";

/**
 * GET /api/clips/[id]/saved
 * Checks if a clip is saved by the authenticated user
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const decodedToken = await verifyIdToken(request);
    if (!decodedToken) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const clipId = params.id;
    const userId = decodedToken.uid;

    if (!clipId) {
      return NextResponse.json(
        { error: "Clip ID is required" },
        { status: 400 }
      );
    }

    // Check if save exists
    const saveRef = db
      .collection("userSaves")
      .doc(userId)
      .collection("clips")
      .doc(clipId);

    const saveDoc = await saveRef.get();
    const isSaved = saveDoc.exists;

    return NextResponse.json({
      success: true,
      saved: isSaved,
      clipId,
      userId,
      savedAt: isSaved ? saveDoc.data()?.savedAt?.toDate?.()?.toISOString() : null,
    });

  } catch (error) {
    console.error("[Saved Check API] Error:", error);
    
    const message = error instanceof Error ? error.message : "Internal server error";
    
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}