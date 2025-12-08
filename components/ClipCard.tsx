"use client";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { HeartIcon, ShareIcon, PlayIcon } from "@/components/ui/icons";
import { useState } from "react";
import { ensureGuest } from "@/lib/authClient";

type Clip = {
  id: string;
  title: string;
  serviceDate: string;
  savedCount: number;
  startSec: number;
  videoId: string;
  categoryLabel?: string;
  thumbUrl?: string; // optional when you wire real thumbs
};

export default function ClipCard({ clip }: { clip: Clip }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function onSave() {
    setSaving(true);
    try {
      const user = await ensureGuest();
      const token = await user.getIdToken();
      const path = saved ? `/api/clips/${clip.id}/unsave` : `/api/clips/${clip.id}/save`;
      await fetch(path, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      setSaved(!saved);
    } finally {
      setSaving(false);
    }
  }

  const playUrl = `/watch/${clip.videoId}?start=${Math.floor(clip.startSec)}`;

  return (
    <Card className="overflow-hidden">
      {/* Mixed layout: medium thumbnail */}
      <div className="p-[var(--pad-medium)] pb-0">
        <div className="relative aspect-[16/9] rounded-[14px] overflow-hidden bg-black/10">
          {clip.thumbUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={clip.thumbUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
          ) : null}
          <button
            onClick={() => (window.location.href = playUrl)}
            className="absolute inset-0 grid place-items-center"
            aria-label="Play clip"
          >
            <div className="rounded-full bg-[hsl(var(--brand))] text-white p-3 shadow-[var(--shadow)] transition duration-150 ease-out active:scale-[1.03]">
              <PlayIcon size={22} />
            </div>
          </button>
        </div>
      </div>

      <div className="p-[var(--pad-medium)] space-y-2">
        <div className="text-xs text-black/60 dark:text-white/70">{clip.serviceDate}</div>
        <h3 className="font-serif text-[17px] leading-snug">{clip.title}</h3>
        <div className="text-xs text-black/50 dark:text-white/60">Saves: {clip.savedCount}</div>

        <div className="flex items-center gap-2 pt-2">
          <Button onClick={() => (window.location.href = playUrl)} size="sm">Watch</Button>
          <Button onClick={onSave} size="sm" variant="outline" disabled={saving}>
            <HeartIcon active={saved} />
            <span className="ml-2">{saved ? "Saved" : "Save"}</span>
          </Button>
          <Button onClick={() => navigator.share?.({ url: window.location.origin + playUrl, title: clip.title }) || navigator.clipboard.writeText(window.location.origin + playUrl)} size="sm" variant="ghost">
            <ShareIcon />
            <span className="ml-2">Share</span>
          </Button>
        </div>
      </div>
    </Card>
  );
}