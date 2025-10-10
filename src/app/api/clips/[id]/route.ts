import { NextRequest, NextResponse } from "next/server";
import { adminDb as db } from "../../../../../lib/firebase-admin";
import { requireAdmin } from "../../../../../lib/requireAdmin";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    console.log('[Clips API] Fetching clip with ID:', id);
    
    if (!db) {
      console.error('[Clips API] Database not initialized');
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }
    
    const snap = await db.collection("clips").doc(id).get();
    console.log('[Clips API] Clip exists:', snap.exists);
    
    if (!snap.exists) return NextResponse.json({ error: "not_found" }, { status: 404 });

    const data = snap.data() as any;
    
    // Get video ID from sourceVideoId (CSV import) or videoId
    const videoId = data.sourceVideoId || data.videoId || "";
    
    // Debug: Log what's in the database
    console.log('[Clips API] Raw data from DB:', {
      processedClipUrl: data.processedClipUrl,
      hasProcessedClipUrl: !!data.processedClipUrl,
      allFields: Object.keys(data)
    });

    // minimal shape the watch page needs
    const clip = {
      id: snap.id,
      videoId: videoId,
      startSec: Math.max(0, Math.floor(data.startTimeSeconds || data.startSec || 0)),
      endSec: data.endTimeSeconds ? Math.max(0, Math.floor(data.endTimeSeconds)) : 
              data.endSec ? Math.max(0, Math.floor(data.endSec)) : undefined,
      titleShort: data.titleShort || data.title || "Testimony",
      summaryShort: data.summaryShort || data.fullText || "",
      thumbUrl: data.thumbUrl || (videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : ""),
      serviceDate: data.serviceDate || "",
      categoryId: data.categoryId || "",
      savedCount: data.savedCount || 0,
      audioUrl: data.audioUrl || "", // optional
      episode: data.episode || "", // Include episode number
      fullText: data.fullText || "", // Include full text from CSV
      processedClipUrl: data.processedClipUrl || "", // NEW: Include the extracted clip URL
    };

    console.log('[Clips API] Returning clip:', clip);
    return NextResponse.json({ clip });
    
  } catch (error) {
    console.error('[Clips API] Error fetching clip:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT - Update clip (admin only)
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Require admin authentication for updates
    const admin = await requireAdmin(req.headers.get("authorization") || undefined);
    const { id } = params;
    
    const body = await req.json();
    const { 
      title,
      categoryId,
      startTimeSeconds,
      endTimeSeconds,
      episode,
      briefDescription,
      language,
      status
    } = body;

    if (!db) {
      console.error('[Clips API] Database not initialized');
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

    // Check if clip exists
    const clipRef = db.collection("clips").doc(id);
    const clipDoc = await clipRef.get();
    
    if (!clipDoc.exists) {
      return NextResponse.json({ error: "Clip not found" }, { status: 404 });
    }

    // Validate required fields
    if (title !== undefined && (!title.trim() || title.trim().length > 200)) {
      return NextResponse.json(
        { error: "Title must be between 1 and 200 characters" },
        { status: 400 }
      );
    }

    // Validate timing if provided
    if (startTimeSeconds !== undefined && endTimeSeconds !== undefined) {
      if (endTimeSeconds <= startTimeSeconds) {
        return NextResponse.json(
          { error: "End time must be greater than start time" },
          { status: 400 }
        );
      }

      const duration = endTimeSeconds - startTimeSeconds;
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
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date(),
      updatedBy: admin.uid
    };

    if (title !== undefined) {
      updateData.title = title.trim();
      updateData.titleShort = title.trim();
    }

    if (categoryId !== undefined) {
      updateData.categoryId = categoryId.trim();
    }

    if (startTimeSeconds !== undefined) {
      updateData.startTimeSeconds = startTimeSeconds;
      updateData.startSec = startTimeSeconds;
    }

    if (endTimeSeconds !== undefined) {
      updateData.endTimeSeconds = endTimeSeconds;
      updateData.endSec = endTimeSeconds;
    }

    if (startTimeSeconds !== undefined && endTimeSeconds !== undefined) {
      updateData.duration = endTimeSeconds - startTimeSeconds;
    }

    if (episode !== undefined) {
      updateData.episode = episode.trim();
    }

    if (briefDescription !== undefined) {
      updateData.briefDescription = briefDescription.trim();
      updateData.fullText = briefDescription.trim();
    }

    if (language !== undefined) {
      updateData.language = language.trim();
    }

    if (status !== undefined) {
      updateData.status = status.trim();
    }

    // Update the clip
    await clipRef.update(updateData);

    console.log('[Clips API] Clip updated successfully:', id);
    return NextResponse.json({ 
      success: true, 
      message: "Clip updated successfully",
      id: id
    });

  } catch (error: any) {
    console.error('[Clips API] Error updating clip:', error);
    
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

// DELETE - Delete clip (admin only)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Require admin authentication for deletion
    const admin = await requireAdmin(req.headers.get("authorization") || undefined);
    const { id } = params;

    if (!db) {
      console.error('[Clips API] Database not initialized');
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

    // Check if clip exists
    const clipRef = db.collection("clips").doc(id);
    const clipDoc = await clipRef.get();

    if (!clipDoc.exists) {
      return NextResponse.json({ error: "Clip not found" }, { status: 404 });
    }

    // Delete the clip from Firestore
    await clipRef.delete();

    console.log('[Clips API] Clip deleted successfully:', id);
    return NextResponse.json({
      success: true,
      message: "Clip deleted successfully",
      id: id
    });

  } catch (error: any) {
    console.error('[Clips API] Error deleting clip:', error);

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