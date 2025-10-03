export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../../../lib/firebaseAdmin";
import { verifyIdToken } from "../../../../../../lib/authMiddleware";
import { FieldValue } from "firebase-admin/firestore";

/**
 * POST /api/clips/[id]/save
 * Saves a clip for the authenticated user
 */
export async function POST(
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

    console.log(`[Save API] User ${userId} saving clip ${clipId}`);

    // Start a batch operation
    const batch = db.batch();

    // 1. Check if clip exists and get current data
    const clipRef = db.collection("clips").doc(clipId);
    const clipDoc = await clipRef.get();

    if (!clipDoc.exists) {
      return NextResponse.json(
        { error: "Clip not found" },
        { status: 404 }
      );
    }

    const clipData = clipDoc.data();
    if (clipData?.status !== "live") {
      return NextResponse.json(
        { error: "Clip is not available" },
        { status: 403 }
      );
    }

    // 2. Create or update user save record
    const saveRef = db
      .collection("userSaves")
      .doc(userId)
      .collection("clips")
      .doc(clipId);

    const existingSave = await saveRef.get();
    
    if (existingSave.exists) {
      // Already saved
      return NextResponse.json(
        { 
          success: true, 
          message: "Clip already saved",
          alreadySaved: true 
        }
      );
    }

    // Add save record
    // Patch 3: Add numeric timestamp for 7-day stats
    const nowIso = new Date().toISOString();
    batch.set(saveRef, {
      clipId,
      savedAt: nowIso, // ISO string for compatibility
      savedAtMs: Date.now(), // Numeric timestamp for efficient 7-day queries
      clipTitle: clipData.title || "",
      categoryId: clipData.categoryId || "",
      videoId: clipData.videoId || "",
    });

    // 3. Increment savedCount on the clip
    batch.update(clipRef, {
      savedCount: FieldValue.increment(1),
    });

    // 4. Update user's saved clips count (optional - for user stats)
    const userRef = db.collection("users").doc(userId);
    batch.set(
      userRef,
      {
        totalSaves: FieldValue.increment(1),
        lastActivity: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // Commit the batch
    await batch.commit();

    console.log(`[Save API] Successfully saved clip ${clipId} for user ${userId}`);

    return NextResponse.json({
      success: true,
      message: "Clip saved successfully",
      clipId,
      userId,
    });

  } catch (error) {
    console.error("[Save API] Error:", error);
    
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message.includes("permission") ? 403 : 500;
    
    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}