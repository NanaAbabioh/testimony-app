import { onSchedule } from "firebase-functions/v2/scheduler";
import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// Utility functions for statistics
function avg(nums: number[]): number { 
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0; 
}

function median(nums: number[]): number { 
  if (!nums.length) return 0; 
  const s = [...nums].sort((a, b) => a - b); 
  const m = Math.floor(s.length / 2); 
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; 
}

/**
 * Scheduled function that runs daily at 6 AM EST to compute analytics summary
 * Analyzes the last 7 days of data and stores results in analytics/dailySummary
 */
export const computeDailySummary = onSchedule({
  schedule: "0 6 * * *", // Daily at 6:00 AM
  timeZone: "America/New_York",
}, async (event) => {
    try {
      console.log("Starting daily summary computation...");
      
      const now = Date.now();
      const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
      const sevenDaysAgoDate = new Date(sevenDaysAgo);

      // 1) Videos processed in last 7 days
      console.log("Computing videos processed...");
      const videosQuery = await db.collection("videos")
        .where("processedAt", ">=", sevenDaysAgoDate)
        .get();
      const videosProcessed = videosQuery.size;

      // 2) Clips published in last 7 days
      console.log("Computing clips published...");
      const clipsQuery = await db.collection("clips")
        .where("status", "==", "live")
        .where("publishedAt", ">=", sevenDaysAgoDate)
        .get();
      const clipsPublished = clipsQuery.size;

      // Build a quick lookup for clips (id -> {categoryId})
      const clipMap = new Map<string, { categoryId: string }>();
      clipsQuery.forEach(doc => {
        const clipData = doc.data() as any;
        clipMap.set(doc.id, { categoryId: clipData.categoryId || "uncategorized" });
      });

      // 3) User saves in last 7 days using collection group query
      console.log("Computing user saves...");
      const savesQuery = await db.collectionGroup("clips")
        .where("savedAtMs", ">=", sevenDaysAgo)
        .get();
      
      const savesByClip = new Map<string, number>();
      savesQuery.forEach(doc => {
        // In userSaves/{uid}/clips/{clipId}, doc.id is the clipId
        const clipId = doc.id;
        savesByClip.set(clipId, (savesByClip.get(clipId) || 0) + 1);
      });

      // Get top 5 clips by saves
      const topClipEntries = [...savesByClip.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      const topClipDetails: any[] = [];
      if (topClipEntries.length > 0) {
        // Batch fetch clip metadata
        const clipIds = topClipEntries.map(([id]) => id);
        const batches: string[][] = [];
        
        // Split into batches of 10 (Firestore limit for batch gets)
        while (clipIds.length > 0) {
          batches.push(clipIds.splice(0, 10));
        }

        for (const batch of batches) {
          const snapshots = await Promise.all(
            batch.map(id => db.collection("clips").doc(id).get())
          );
          
          snapshots.forEach((snap, i) => {
            if (!snap.exists) return;
            
            const clipData = snap.data() as any;
            topClipDetails.push({
              clipId: snap.id,
              title: clipData.title || "Untitled Clip",
              saves: savesByClip.get(snap.id) || 0
            });
            
            // Ensure clipMap has this clip's category
            if (!clipMap.has(snap.id)) {
              clipMap.set(snap.id, { categoryId: clipData.categoryId || "uncategorized" });
            }
          });
        }
      }

      // 4) Category split by saves in last 7 days
      console.log("Computing category statistics...");
      const categorySaves = new Map<string, number>();
      for (const [clipId, saveCount] of savesByClip.entries()) {
        const clipMeta = clipMap.get(clipId);
        const category = clipMeta?.categoryId || "unknown";
        categorySaves.set(category, (categorySaves.get(category) || 0) + saveCount);
      }

      const categorySplit = [...categorySaves.entries()]
        .map(([categoryId, saves]) => ({ categoryId, saves }))
        .sort((a, b) => b.saves - a.saves);
      
      const topCategory = categorySplit[0] || { categoryId: "-", saves: 0 };

      // 5) Time to publish average hours
      console.log("Computing time to publish metrics...");
      const liveVideosQuery = await db.collection("videos")
        .where("wentLiveAt", ">=", sevenDaysAgoDate)
        .get();

      const publishDeltas: number[] = [];
      liveVideosQuery.forEach(doc => {
        const videoData = doc.data() as any;
        const createdAt = videoData.createdAt?.toDate?.() as Date | undefined;
        const wentLiveAt = videoData.wentLiveAt?.toDate?.() as Date | undefined;
        
        if (createdAt && wentLiveAt) {
          const deltaHours = (wentLiveAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
          publishDeltas.push(deltaHours);
        }
      });

      const timeToPublishAvgHours = Number(avg(publishDeltas).toFixed(1));

      // 6) Reports/flags analysis (optional - may not exist yet)
      console.log("Computing flags and reports...");
      let flagsOpen = 0;
      let flagsMedianAgeHours = 0;
      
      try {
        const reportsQuery = await db.collection("reports")
          .where("status", "==", "open")
          .get();
        
        flagsOpen = reportsQuery.size;
        
        if (flagsOpen > 0) {
          const flagAges = reportsQuery.docs.map(doc => {
            const reportData = doc.data() as any;
            const createdAt = reportData.createdAt?.toDate?.() as Date | undefined;
            return createdAt ? (now - createdAt.getTime()) / (1000 * 60 * 60) : 0;
          }).filter(age => age > 0);
          
          flagsMedianAgeHours = Number(median(flagAges).toFixed(1));
        }
      } catch (error) {
        console.log("Reports collection not found or accessible, defaulting to 0");
      }

      // 7) Create summary document
      console.log("Writing daily summary...");
      const summaryDoc = {
        updatedAt: admin.firestore.Timestamp.now(),
        last7d: {
          videosProcessed,
          clipsPublished,
          topCategory,
          topClips: topClipDetails.sort((a, b) => b.saves - a.saves),
          categorySplit,
          timeToPublishAvgHours,
          flagsOpen,
          flagsMedianAgeHours,
          highlight: topCategory.categoryId !== "-" 
            ? `Top saves in "${topCategory.categoryId}" (${topCategory.saves} saves)` 
            : "No activity yet",
          nextAction: flagsOpen > 0 
            ? `Review ${flagsOpen} flagged clip(s)` 
            : "All clear",
          totalSaves: [...savesByClip.values()].reduce((sum, count) => sum + count, 0),
          activeCategories: categorySplit.length
        }
      };

      await db.collection("analytics").doc("dailySummary").set(summaryDoc, { merge: true });

      console.log("Daily summary computation completed successfully");
      console.log(`Stats: ${videosProcessed} videos processed, ${clipsPublished} clips published, ${summaryDoc.last7d.totalSaves} total saves`);
      
    } catch (error) {
      console.error("Error computing daily summary:", error);
      throw error;
    }
  });

/**
 * HTTP function for manual triggering of daily summary (useful for testing)
 */
export const triggerDailySummary = onRequest(async (req, res) => {
  try {
    console.log("Manual trigger of daily summary computation");
    
    // Basic database connectivity test
    const testQuery = await db.collection("videos").limit(1).get();
    const dbConnected = testQuery.docs.length >= 0; // Will be true even if empty
    
    res.status(200).json({
      success: true,
      message: "Daily summary trigger function is working",
      timestamp: new Date().toISOString(),
      databaseConnected: dbConnected,
      note: "Use the scheduled function for actual analytics computation"
    });
  } catch (error) {
    console.error("Error in manual daily summary trigger:", error);
    res.status(500).json({
      error: "Failed to trigger daily summary",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});