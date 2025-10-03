import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const clipId = searchParams.get("clipId");
  if (!clipId) return NextResponse.json({ items: [] });

  const doc = await db.collection("clips").doc(clipId).get();
  if (!doc.exists) return NextResponse.json({ items: [] });
  const data = doc.data() as any;

  const q = await db.collection("clips")
    .where("categoryId", "==", data.categoryId || null)
    .orderBy("savedCount", "desc")
    .limit(10)
    .get();

  const items = q.docs
    .filter(d => d.id !== doc.id)
    .map(d => {
      const x = d.data() as any;
      return {
        id: d.id,
        videoId: x.videoId,
        startSec: Math.floor(x.startSec || 0),
        titleShort: x.titleShort || x.title || "",
        summaryShort: x.summaryShort || "",
        thumbUrl: x.thumbUrl || (x.videoId ? `https://i.ytimg.com/vi/${x.videoId}/hqdefault.jpg` : ""),
        serviceDate: x.serviceDate || "",
        savedCount: x.savedCount || 0,
      };
    });

  return NextResponse.json({ items });
}