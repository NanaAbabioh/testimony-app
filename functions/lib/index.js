"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.triggerDailySummary = exports.computeDailySummary = void 0;
const scheduler_1 = require("firebase-functions/v2/scheduler");
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
admin.initializeApp();
const db = admin.firestore();
function avg(nums) {
    return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
}
function median(nums) {
    if (!nums.length)
        return 0;
    const s = [...nums].sort((a, b) => a - b);
    const m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
exports.computeDailySummary = (0, scheduler_1.onSchedule)({
    schedule: "0 6 * * *",
    timeZone: "America/New_York",
}, async (event) => {
    try {
        console.log("Starting daily summary computation...");
        const now = Date.now();
        const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
        const sevenDaysAgoDate = new Date(sevenDaysAgo);
        console.log("Computing videos processed...");
        const videosQuery = await db.collection("videos")
            .where("processedAt", ">=", sevenDaysAgoDate)
            .get();
        const videosProcessed = videosQuery.size;
        console.log("Computing clips published...");
        const clipsQuery = await db.collection("clips")
            .where("status", "==", "live")
            .where("publishedAt", ">=", sevenDaysAgoDate)
            .get();
        const clipsPublished = clipsQuery.size;
        const clipMap = new Map();
        clipsQuery.forEach(doc => {
            const clipData = doc.data();
            clipMap.set(doc.id, { categoryId: clipData.categoryId || "uncategorized" });
        });
        console.log("Computing user saves...");
        const savesQuery = await db.collectionGroup("clips")
            .where("savedAtMs", ">=", sevenDaysAgo)
            .get();
        const savesByClip = new Map();
        savesQuery.forEach(doc => {
            const clipId = doc.id;
            savesByClip.set(clipId, (savesByClip.get(clipId) || 0) + 1);
        });
        const topClipEntries = [...savesByClip.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
        const topClipDetails = [];
        if (topClipEntries.length > 0) {
            const clipIds = topClipEntries.map(([id]) => id);
            const batches = [];
            while (clipIds.length > 0) {
                batches.push(clipIds.splice(0, 10));
            }
            for (const batch of batches) {
                const snapshots = await Promise.all(batch.map(id => db.collection("clips").doc(id).get()));
                snapshots.forEach((snap, i) => {
                    if (!snap.exists)
                        return;
                    const clipData = snap.data();
                    topClipDetails.push({
                        clipId: snap.id,
                        title: clipData.title || "Untitled Clip",
                        saves: savesByClip.get(snap.id) || 0
                    });
                    if (!clipMap.has(snap.id)) {
                        clipMap.set(snap.id, { categoryId: clipData.categoryId || "uncategorized" });
                    }
                });
            }
        }
        console.log("Computing category statistics...");
        const categorySaves = new Map();
        for (const [clipId, saveCount] of savesByClip.entries()) {
            const clipMeta = clipMap.get(clipId);
            const category = clipMeta?.categoryId || "unknown";
            categorySaves.set(category, (categorySaves.get(category) || 0) + saveCount);
        }
        const categorySplit = [...categorySaves.entries()]
            .map(([categoryId, saves]) => ({ categoryId, saves }))
            .sort((a, b) => b.saves - a.saves);
        const topCategory = categorySplit[0] || { categoryId: "-", saves: 0 };
        console.log("Computing time to publish metrics...");
        const liveVideosQuery = await db.collection("videos")
            .where("wentLiveAt", ">=", sevenDaysAgoDate)
            .get();
        const publishDeltas = [];
        liveVideosQuery.forEach(doc => {
            const videoData = doc.data();
            const createdAt = videoData.createdAt?.toDate?.();
            const wentLiveAt = videoData.wentLiveAt?.toDate?.();
            if (createdAt && wentLiveAt) {
                const deltaHours = (wentLiveAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
                publishDeltas.push(deltaHours);
            }
        });
        const timeToPublishAvgHours = Number(avg(publishDeltas).toFixed(1));
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
                    const reportData = doc.data();
                    const createdAt = reportData.createdAt?.toDate?.();
                    return createdAt ? (now - createdAt.getTime()) / (1000 * 60 * 60) : 0;
                }).filter(age => age > 0);
                flagsMedianAgeHours = Number(median(flagAges).toFixed(1));
            }
        }
        catch (error) {
            console.log("Reports collection not found or accessible, defaulting to 0");
        }
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
    }
    catch (error) {
        console.error("Error computing daily summary:", error);
        throw error;
    }
});
exports.triggerDailySummary = (0, https_1.onRequest)(async (req, res) => {
    try {
        console.log("Manual trigger of daily summary computation");
        const testQuery = await db.collection("videos").limit(1).get();
        const dbConnected = testQuery.docs.length >= 0;
        res.status(200).json({
            success: true,
            message: "Daily summary trigger function is working",
            timestamp: new Date().toISOString(),
            databaseConnected: dbConnected,
            note: "Use the scheduled function for actual analytics computation"
        });
    }
    catch (error) {
        console.error("Error in manual daily summary trigger:", error);
        res.status(500).json({
            error: "Failed to trigger daily summary",
            details: error instanceof Error ? error.message : "Unknown error"
        });
    }
});
//# sourceMappingURL=index.js.map