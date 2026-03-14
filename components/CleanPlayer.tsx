"use client";
import { useState, useRef, useEffect } from "react";
import Button from "@/components/ui/Button";
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
  
  // Load YouTube API (always load it as fallback, even for extracted clips)
  useEffect(() => {
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
  }, []);

  // Initialize player when API is ready
  useEffect(() => {
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
    }

    // For YouTube player, wait for API to be ready
    if (!isAPIReady || !window.YT || !window.YT.Player) {
      console.log('[CleanPlayer] YouTube API not ready yet, waiting...');
      return;
    }

    // Small delay to ensure DOM is ready after switching from video element
    const initPlayer = () => {
      if (!playerRef.current) {
        console.log('[CleanPlayer] Player ref not ready, waiting...');
        return;
      }

      console.log('[CleanPlayer] Initializing YouTube player for video:', videoId);
      // YouTube player for full video mode
      try {
        const newPlayer = new window.YT.Player(playerRef.current, {
          videoId: videoId,
          playerVars: {
            start: start,
            autoplay: 1, // Auto-play when falling back from failed extracted clip
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
              console.log('[CleanPlayer] YouTube player ready');
              event.target.seekTo(start);
              if (showFullVideo) {
                // If we're in fallback mode, start playing
                event.target.playVideo();
              }
            },
            onError: (event: { data: number }) => {
              console.error('[CleanPlayer] YouTube player error:', {
                errorCode: event.data,
                videoId,
                startTime: start
              });
              // Error codes: 2 = invalid param, 5 = HTML5 player error, 100 = video not found, 101/150 = embed not allowed
              alert(`YouTube player error (code ${event.data}). This video may have playback restrictions.`);
            },
            onStateChange: (event: { data: number }) => {
              console.log('[CleanPlayer] YouTube player state changed:', event.data);
              // -1: unstarted, 0: ended, 1: playing, 2: paused, 3: buffering, 5: video cued
            }
          }
        });

        setPlayer(newPlayer);
      } catch (error) {
        console.error('[CleanPlayer] Error creating YouTube player:', error);
      }
    };

    // Use setTimeout to ensure DOM is ready when switching from video element
    if (showFullVideo && !player) {
      setTimeout(initPlayer, 100);
    } else if (playerRef.current) {
      initPlayer();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isAPIReady, videoId, start, useExtractedClip, showFullVideo, player]);

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
              console.error('[CleanPlayer] Error loading extracted clip:', {
                processedClipUrl,
                error: e,
                videoElement: videoRef.current
              });
              // Check if video element has more details
              if (videoRef.current) {
                console.error('[CleanPlayer] Video error details:', {
                  networkState: videoRef.current.networkState,
                  readyState: videoRef.current.readyState,
                  error: videoRef.current.error
                });
              }
              // Fallback to YouTube if extracted clip fails
              console.log('[CleanPlayer] Falling back to YouTube player...');
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