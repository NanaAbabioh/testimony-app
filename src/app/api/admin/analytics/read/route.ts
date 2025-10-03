export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../../../lib/firebaseAdmin";
import { requireAdmin } from "../../../../../../lib/requireAdmin";

export async function GET(req: NextRequest) {
  try {
    // Require admin authentication
    const admin = await requireAdmin(req.headers.get("authorization") || undefined);
    
    console.log("Fetching analytics data...");
    
    // Fetch the daily summary document
    const snap = await db.collection("analytics").doc("dailySummary").get();
    
    if (!snap.exists) {
      return NextResponse.json({
        error: "No analytics data found",
        message: "The scheduled analytics function may not have run yet. Analytics are generated daily at 6 AM EST.",
        last7d: {},
        updatedAtReadable: "-"
      });
    }

    const data = snap.data() || {};
    console.log("Analytics data found:", Object.keys(data));
    
    // Convert Firebase timestamp to readable format
    const updatedAt = data.updatedAt?.toDate?.() || null;
    const updatedAtReadable = updatedAt 
      ? updatedAt.toISOString().replace("T", " ").slice(0, 16) + " UTC"
      : "-";

    // Add some computed fields for better display
    const enrichedData = {
      ...data,
      updatedAtReadable,
      last7d: {
        ...data.last7d,
        // Ensure we have default values
        videosProcessed: data.last7d?.videosProcessed ?? 0,
        clipsPublished: data.last7d?.clipsPublished ?? 0,
        topClips: data.last7d?.topClips ?? [],
        categorySplit: data.last7d?.categorySplit ?? [],
        topCategory: data.last7d?.topCategory ?? { categoryId: "-", saves: 0 },
        timeToPublishAvgHours: data.last7d?.timeToPublishAvgHours ?? 0,
        flagsOpen: data.last7d?.flagsOpen ?? 0,
        flagsMedianAgeHours: data.last7d?.flagsMedianAgeHours ?? 0,
        totalSaves: data.last7d?.totalSaves ?? 0,
        activeCategories: data.last7d?.activeCategories ?? 0,
        highlight: data.last7d?.highlight ?? "No activity yet",
        nextAction: data.last7d?.nextAction ?? "Monitor content performance"
      }
    };

    return NextResponse.json(enrichedData);

  } catch (error: any) {
    console.error("Error fetching analytics:", error);
    
    if (error.message?.includes("Unauthorized") || error.status === 401) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 }
      );
    }

    // Return a friendly error response
    return NextResponse.json({
      error: "Failed to load analytics",
      message: error.message || "Internal server error",
      last7d: {},
      updatedAtReadable: "-"
    }, { status: 500 });
  }
}