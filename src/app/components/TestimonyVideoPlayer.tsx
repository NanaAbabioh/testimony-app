'use client';

import { useEffect, useRef, useState } from 'react';

interface TestimonyVideoPlayerProps {
  videoId: string;
  startTime: number;
  endTime: number;
  title: string;
  onClose: () => void;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export default function TestimonyVideoPlayer({ 
  videoId, 
  startTime, 
  endTime, 
  title, 
  onClose 
}: TestimonyVideoPlayerProps) {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [player, setPlayer] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState(startTime);
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Load YouTube IFrame API
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = initializePlayer;
    } else {
      initializePlayer();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (player) {
        player.destroy();
      }
    };
  }, []);

  const initializePlayer = () => {
    if (!containerRef.current) return;

    const newPlayer = new window.YT.Player(containerRef.current, {
      height: '100%',
      width: '100%',
      videoId: videoId,
      playerVars: {
        start: startTime,
        autoplay: 1,
        controls: 0, // Hide YouTube controls
        rel: 0,
        modestbranding: 1,
        playsinline: 1,
        disablekb: 1, // Disable keyboard shortcuts
        fs: 0, // Disable fullscreen
        iv_load_policy: 3 // Hide annotations
      },
      events: {
        onReady: (event: any) => {
          setPlayer(event.target);
          event.target.seekTo(startTime);
          event.target.playVideo();
          startTimeTracking(event.target);
        },
        onStateChange: (event: any) => {
          if (event.data === window.YT.PlayerState.PLAYING) {
            setIsPlaying(true);
          } else {
            setIsPlaying(false);
          }
        }
      }
    });
  };

  const startTimeTracking = (playerInstance: any) => {
    intervalRef.current = setInterval(() => {
      if (playerInstance && playerInstance.getCurrentTime) {
        const current = Math.floor(playerInstance.getCurrentTime());
        setCurrentTime(current);
        
        // Auto-pause when reaching end time
        if (current >= endTime) {
          playerInstance.pauseVideo();
          setIsPlaying(false);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
        }
      }
    }, 1000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRestart = () => {
    if (player) {
      player.seekTo(startTime);
      player.playVideo();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      startTimeTracking(player);
    }
  };

  const progressPercentage = ((currentTime - startTime) / (endTime - startTime)) * 100;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          {/* Video Player Container */}
          <div className="bg-gray-900 rounded-lg aspect-video mb-4 overflow-hidden relative">
            <div ref={containerRef} className="w-full h-full" />
            
            {/* Overlay to hide YouTube controls and timeline */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <div className="flex items-center justify-between text-white text-sm">
                <span>Testimony Clip</span>
                <span>{formatTime(Math.max(0, endTime - currentTime))}s remaining</span>
              </div>
            </div>
          </div>

          {/* Custom Clip Controls */}
          <div className="bg-gray-800 text-white rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-medium">
                📹 Testimony Clip • {formatTime(endTime - startTime)} duration
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (player) {
                      if (isPlaying) {
                        player.pauseVideo();
                      } else {
                        player.playVideo();
                      }
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                >
                  {isPlaying ? '⏸️ Pause' : '▶️ Play'}
                </button>
                <button
                  onClick={handleRestart}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm"
                >
                  🔄 Restart
                </button>
              </div>
            </div>
            
            {/* Custom Timeline (only shows clip duration) */}
            <div className="w-full bg-gray-600 rounded-full h-3 mb-2 cursor-pointer" 
                 onClick={(e) => {
                   if (player) {
                     const rect = e.currentTarget.getBoundingClientRect();
                     const clickPosition = (e.clientX - rect.left) / rect.width;
                     const targetTime = startTime + (clickPosition * (endTime - startTime));
                     player.seekTo(targetTime);
                   }
                 }}>
              <div 
                className="bg-blue-500 h-3 rounded-full transition-all duration-300 flex items-center justify-end pr-1"
                style={{ width: `${Math.min(Math.max(progressPercentage, 0), 100)}%` }}
              >
                <div className="w-3 h-3 bg-white rounded-full shadow-lg"></div>
              </div>
            </div>
            
            <div className="flex justify-between text-xs text-gray-300">
              <span>0:00</span>
              <span className="font-medium">{formatTime(currentTime - startTime)}</span>
              <span>{formatTime(endTime - startTime)}</span>
            </div>
          </div>

          {/* Auto-Stop Notice */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="text-sm text-green-800">
              <strong>✅ Smart Testimony Playback:</strong> This video will automatically pause when the testimony ends at {formatTime(endTime)}. 
              Use the "Restart Testimony" button to replay just this segment.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}