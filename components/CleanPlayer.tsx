"use client";
import { useState, useRef, useEffect } from "react";
import Button from "@/components/ui/button";
import { Clock } from "@phosphor-icons/react";

declare global {
  interface Window {
    YT: {
      Player: new (element: HTMLElement, config: any) => any;
      PlayerState: {
        ENDED: number;
      };
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

type Props = {
  videoId: string;
  startSec: number;
  endSec?: number;
  title: string;
  processedClipUrl?: string; // NEW: URL to the extracted clip
  hideControls?: boolean; // NEW: Hide YouTube/Full Video buttons
};

export default function CleanPlayer({ videoId, startSec, endSec, processedClipUrl, hideControls = false }: Props) {
  const [showFullVideo, setShowFullVideo] = useState(false);
  const [player, setPlayer] = useState<any>(null);
  const [isAPIReady, setIsAPIReady] = useState(false);
  const playerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Debug logging
  console.log('[CleanPlayer] Props received:', { videoId, startSec, endSec, processedClipUrl });
  
  // Prefer the extracted clip if available
  const hasExtractedClip = processedClipUrl && processedClipUrl.trim() !== '';
  const useExtractedClip = hasExtractedClip && !showFullVideo;
  
  console.log('[CleanPlayer] Clip status:', { hasExtractedClip, useExtractedClip, showFullVideo });
  
  const start = Math.max(0, Math.floor(startSec || 0));
  const end = endSec ? Math.floor(endSec) : null;
  
  // Load YouTube API only when needed (for full video mode)
  useEffect(() => {
    if (!useExtractedClip) {
      if (window.YT && window.YT.Player) {
        setIsAPIReady(true);
        return;
      }

      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const script = document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        script.async = true;
        document.body.appendChild(script);
      }

      window.onYouTubeIframeAPIReady = () => {
        setIsAPIReady(true);
      };
    } else {
      // For extracted clips, we don't need YouTube API
      setIsAPIReady(true);
    }
  }, [useExtractedClip]);

  // Initialize player when API is ready
  useEffect(() => {
    if (!isAPIReady) return;

    // Clean up previous player/interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (player) {
      player.destroy();
      setPlayer(null);
    }

    // Use extracted clip (HTML5 video) or YouTube player
    if (useExtractedClip) {
      // For extracted clips, we don't need to initialize YouTube player
      // The HTML5 video element will be handled separately
      return;
    } else if (playerRef.current) {
      // YouTube player for full video mode
      const newPlayer = new window.YT.Player(playerRef.current, {
        videoId: videoId,
        playerVars: {
          start: start,
          autoplay: 0, // Let user control playback
          controls: 1,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
          fs: 1, // Allow fullscreen in full video mode
          iv_load_policy: 3,
          cc_load_policy: 0,
        },
        events: {
          onReady: (event: { target: any }) => {
            event.target.seekTo(start);
          }
        }
      });

      setPlayer(newPlayer);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isAPIReady, videoId, start, useExtractedClip]);

  // Handle mode toggle
  const handleToggleMode = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (player) {
      player.destroy();
      setPlayer(null);
    }
    
    setShowFullVideo(!showFullVideo);
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (player) {
        player.destroy();
      }
    };
  }, []);
  
  // Calculate clip duration
  const clipDuration = end ? end - start : 0;
  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  };

  const openOnYouTube = () => {
    const t = Math.max(0, Math.floor((startSec || 0)));
    window.open(`https://www.youtube.com/watch?v=${videoId}&t=${t}s`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm bg-black">
      {/* Video Player - Mobile optimized */}
      <div className="aspect-video bg-black relative">
        {useExtractedClip ? (
          /* HTML5 Video Player for Extracted Clips - Mobile Enhanced */
          <video
            ref={videoRef}
            src={processedClipUrl}
            controls
            autoPlay
            loop
            playsInline
            className="w-full h-full object-contain"
            style={{
              // Enhanced mobile video experience
              touchAction: 'manipulation',
              WebkitTouchAction: 'manipulation'
            }}
            controlsList="nodownload"
            onError={(e) => {
              console.error('Error loading extracted clip:', e);
              // Fallback to YouTube if extracted clip fails
              setShowFullVideo(true);
            }}
          >
            Your browser does not support the video tag.
          </video>
        ) : (
          /* YouTube Player Container for Full Video - Mobile Enhanced */
          <div
            ref={playerRef}
            className="w-full h-full"
            style={{
              // Better touch handling for YouTube player
              touchAction: 'manipulation'
            }}
          />
        )}

        {/* Loading indicator */}
        {!isAPIReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-white"></div>
          </div>
        )}

      </div>

    </div>
  );
}