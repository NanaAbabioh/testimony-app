export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../../lib/firebaseAdmin";
import { verifyIdToken } from "../../../../../lib/authMiddleware";
import { ClipDTO } from "../../../../../lib/types";

/**
 * GET /api/user/saves
 * Gets all saved clips for the authenticated user
 * 
 * Query params:
 * - limit?: number (default 20, max 100)
 * - categoryId?: string (filter by category)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const decodedToken = await verifyIdToken(request);
    if (!decodedToken) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = decodedToken.uid;
    const { searchParams } = request.nextUrl;
    
    // Parse query params
    const categoryId = searchParams.get("categoryId") || undefined;
    const limitParam = searchParams.get("limit");
    const parsedLimit = limitParam ? parseInt(limitParam, 10) : 20;
    const limit = isNaN(parsedLimit) ? 20 : Math.min(Math.max(1, parsedLimit), 100);

    console.log(`[User Saves API] Getting saves for user ${userId}`, { categoryId, limit });

    // Build query for user's saves
    let savesQuery: FirebaseFirestore.Query = db
      .collection("userSaves")
      .doc(userId)
      .collection("clips")
      .orderBy("savedAt", "desc");

    // Apply category filter if provided
    if (categoryId) {
      savesQuery = savesQuery.where("categoryId", "==", categoryId);
    }

    // Apply limit
    savesQuery = savesQuery.limit(limit);

    // Get saved clips references
    const savesSnapshot = await savesQuery.get();
    
    if (savesSnapshot.empty) {
      return NextResponse.json({
        success: true,
        saves: [],
        count: 0,
        userId,
      });
    }

    // Get full clip data for each save
    const saves: any[] = [];
    const clipIds = savesSnapshot.docs.map(doc => doc.id);
    
    // Batch get all clips
    const clipRefs = clipIds.map(id => db.collection("clips").doc(id));
    const clipDocs = await db.getAll(...clipRefs);
    
    // Create a map for quick lookup
    const clipsMap = new Map<string, any>();
    clipDocs.forEach((doc) => {
      if (doc.exists) {
        const data = doc.data();
        clipsMap.set(doc.id, {
          ...data,
          id: doc.id,
          createdAt: data?.createdAt?.toDate?.()?.toISOString(),
        });
      }
    });

    // Combine save data with clip data
    savesSnapshot.docs.forEach(saveDoc => {
      const saveData = saveDoc.data();
      const clipData = clipsMap.get(saveDoc.id);
      
      if (clipData && clipData.status === "live") {
        saves.push({
          ...clipData,
          savedAt: saveData.savedAt?.toDate?.()?.toISOString(),
        });
      }
    });

    console.log(`[User Saves API] Returning ${saves.length} saved clips for user ${userId}`);

    return NextResponse.json({
      success: true,
      saves,
      count: saves.length,
      userId,
      query: {
        categoryId,
        limit,
      },
    });

  } catch (error) {
    console.error("[User Saves API] Error:", error);
    
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message.includes("permission") ? 403 : 500;
    
    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}