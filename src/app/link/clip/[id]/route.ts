import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const doc = await db.collection("clips").doc(params.id).get();
  if (!doc.exists) return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_BASE_URL), 302);
  const start = Math.floor((doc.data() as any).startSec || 0);
  const url = new URL(`/watch/${doc.id}?start=${start}`, process.env.NEXT_PUBLIC_BASE_URL);
  return NextResponse.redirect(url, 302);
}