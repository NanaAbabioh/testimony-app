export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../../../lib/firebaseAdmin";
import { verifyIdToken } from "../../../../../../lib/authMiddleware";
import { FieldValue } from "firebase-admin/firestore";

/**
 * POST /api/clips/[id]/unsave
 * Removes a saved clip for the authenticated user
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

    console.log(`[Unsave API] User ${userId} unsaving clip ${clipId}`);

    // Start a batch operation
    const batch = db.batch();

    // 1. Check if save exists
    const saveRef = db
      .collection("userSaves")
      .doc(userId)
      .collection("clips")
      .doc(clipId);

    const saveDoc = await saveRef.get();

    if (!saveDoc.exists) {
      // Not saved, nothing to do
      return NextResponse.json(
        { 
          success: true, 
          message: "Clip was not saved",
          wasNotSaved: true 
        }
      );
    }

    // 2. Delete the save record
    batch.delete(saveRef);

    // 3. Decrement savedCount on the clip (ensure it doesn't go below 0)
    const clipRef = db.collection("clips").doc(clipId);
    const clipDoc = await clipRef.get();

    if (clipDoc.exists) {
      const currentCount = clipDoc.data()?.savedCount || 0;
      if (currentCount > 0) {
        batch.update(clipRef, {
          savedCount: FieldValue.increment(-1),
        });
      }
    }

    // 4. Update user's saved clips count
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();
    
    if (userDoc.exists) {
      const currentUserSaves = userDoc.data()?.totalSaves || 0;
      if (currentUserSaves > 0) {
        batch.update(userRef, {
          totalSaves: FieldValue.increment(-1),
          lastActivity: FieldValue.serverTimestamp(),
        });
      }
    } else {
      // Create user doc if it doesn't exist
      batch.set(userRef, {
        totalSaves: 0,
        lastActivity: FieldValue.serverTimestamp(),
      });
    }

    // Commit the batch
    await batch.commit();

    console.log(`[Unsave API] Successfully unsaved clip ${clipId} for user ${userId}`);

    return NextResponse.json({
      success: true,
      message: "Clip unsaved successfully",
      clipId,
      userId,
    });

  } catch (error) {
    console.error("[Unsave API] Error:", error);
    
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message.includes("permission") ? 403 : 500;
    
    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}