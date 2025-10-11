"use client";
import { useEffect, useMemo, useState, useRef } from "react";
import Button from "@/components/ui/button";
import { Play, Pause, SpeakerHigh, SpeakerX } from "@phosphor-icons/react";

type Props = {
  videoId: string;
  startSec: number;
  endSec?: number;
  audioUrl?: string; // optional mp3 in Storage
  title: string;     // for aria/labels
};

export default function SmartPlayer({ videoId, startSec, endSec, audioUrl, title }: Props) {
  // Respect "data saver" if available
  const [audioOnly, setAudioOnly] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [currentProgress, setCurrentProgress] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  // Calculate clip duration
  const clipDuration = endSec ? endSec - startSec : 0;
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    try {
      const c = (navigator as any).connection;
      const save = !!c?.saveData;
      const slow = ["slow-2g", "2g"].includes(c?.effectiveType);
      if (save || slow) setAudioOnly(true);
    } catch {}
  }, []);

  const start = Math.max(0, Math.floor(startSec || 0));
  const endParam = endSec ? `&end=${Math.floor(endSec)}` : "";

  const ytUrl = useMemo(() => {
    const base = `https://www.youtube-nocookie.com/embed/${videoId}`;
    // Hide controls, no related, playsinline, enable JS API
    return `${base}?start=${start}&modestbranding=1&rel=0&playsinline=1&autoplay=1&controls=0&showinfo=0&enablejsapi=1&origin=${window.location.origin}${endParam}`;
  }, [videoId, start, endParam]);

  const openOnYouTube = () => {
    const t = Math.max(0, Math.floor((startSec || 0)));
    window.open(`https://www.youtube.com/watch?v=${videoId}&t=${t}s`, "_blank", "noopener,noreferrer");
  };

  const copyLinkAtTime = () => {
    const url = new URL(window.location.href);
    url.searchParams.set("start", String(Math.floor(currentTime())));
    navigator.clipboard.writeText(url.toString());
    alert("Link copied");
  };

  // crude current time for "copy link at time"
  function currentTime() {
    if (audioOnly && audioRef?.current) return audioRef.current.currentTime + start;
    // for iframe we don't poll the YouTube API (kept simple). Use original start.
    return start;
  }

  const audioRef = useState<HTMLAudioElement | null>(null)[0] as any;

  return (
    <div className="rounded-[18px] overflow-hidden border border-black/5 dark:border-white/10 shadow-[var(--shadow)] bg-[hsl(var(--bg-snow))]">
      <div className="p-2 flex items-center justify-between">
        <div className="text-xs opacity-70">Player</div>
        <div className="flex items-center gap-2">
          {audioUrl ? (
            <label className="text-sm flex items-center gap-2">
              <input type="checkbox" checked={audioOnly} onChange={e=>setAudioOnly(e.target.checked)} />
              Audio-only
            </label>
          ) : null}
          <Button variant="outline" size="sm" onClick={openOnYouTube}>Open on YouTube</Button>
          <Button variant="ghost" size="sm" onClick={copyLinkAtTime}>Copy link</Button>
        </div>
      </div>

      <div className="aspect-video bg-black relative">
        {audioOnly && audioUrl ? (
          <div className="h-full w-full grid place-items-center">
            <div className="text-center text-white/90 p-6">
              <div className="text-sm opacity-80 mb-2">Audio-only to save data</div>
              <audio
                ref={(el)=> (audioRef.current = el)}
                src={audioUrl}
                autoPlay
                controls
                // browsers don't support start offset for audio; it begins at 0.
                // Keep simple now; later we can splice server-side or use HLS.
              />
            </div>
          </div>
        ) : (
          <>
            <iframe
              ref={iframeRef}
              className="w-full h-full"
              title={title}
              src={ytUrl}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
            
            {/* Custom Controls Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4">
              <div className="flex items-center gap-3">
                {/* Play/Pause */}
                <button
                  onClick={() => {
                    if (iframeRef.current) {
                      const iframe = iframeRef.current;
                      const command = isPlaying ? 'pauseVideo' : 'playVideo';
                      iframe.contentWindow?.postMessage(
                        JSON.stringify({ event: 'command', func: command }),
                        '*'
                      );
                      setIsPlaying(!isPlaying);
                    }
                  }}
                  className="text-white hover:text-white/80 transition-colors"
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? <Pause size={24} weight="fill" /> : <Play size={24} weight="fill" />}
                </button>
                
                {/* Progress Bar */}
                <div className="flex-1 flex items-center gap-2">
                  <span className="text-white text-xs">
                    {formatTime(currentProgress)}
                  </span>
                  <div className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-white transition-all duration-200"
                      style={{ width: `${(currentProgress / clipDuration) * 100}%` }}
                    />
                  </div>
                  <span className="text-white text-xs">
                    {formatTime(clipDuration)}
                  </span>
                </div>
                
                {/* Mute/Unmute */}
                <button
                  onClick={() => {
                    if (iframeRef.current) {
                      const iframe = iframeRef.current;
                      const command = isMuted ? 'unMute' : 'mute';
                      iframe.contentWindow?.postMessage(
                        JSON.stringify({ event: 'command', func: command }),
                        '*'
                      );
                      setIsMuted(!isMuted);
                    }
                  }}
                  className="text-white hover:text-white/80 transition-colors"
                  aria-label={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <SpeakerX size={20} /> : <SpeakerHigh size={20} />}
                </button>
                
                {/* Clip Duration Badge */}
                <div className="bg-white/20 backdrop-blur-sm px-2 py-1 rounded text-white text-xs font-medium">
                  Clip: {formatTime(clipDuration)}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}