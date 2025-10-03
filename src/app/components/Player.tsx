'use client';

import { useState, useRef, useEffect } from 'react';

interface PlayerProps {
  hlsUrl?: string;
  youtubeUrl?: string;
  videoId?: string;
  startTime?: number;
  endTime?: number;
  title?: string;
  thumbnail?: string;
  className?: string;
}

export default function Player({ 
  hlsUrl, 
  youtubeUrl,
  videoId,
  startTime = 0, 
  endTime,
  title,
  thumbnail,
  className = ""
}: PlayerProps) {
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Determine the video source URL
  const getVideoUrl = () => {
    if (hlsUrl) return hlsUrl;
    if (youtubeUrl) return youtubeUrl;
    if (videoId) {
      // Construct YouTube URL with start time
      const baseUrl = `https://www.youtube.com/embed/${videoId}`;
      const params = new URLSearchParams({
        autoplay: '1',
        start: startTime.toString(),
        ...(endTime && { end: endTime.toString() }),
      });
      return `${baseUrl}?${params.toString()}`;
    }
    return null;
  };

  const videoUrl = getVideoUrl();
  const isYouTube = videoUrl?.includes('youtube.com') || videoUrl?.includes('youtu.be');

  // Handle play button click
  const handlePlay = async () => {
    if (!videoUrl) {
      setError('No video source available');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      setReady(true);
      
      // For direct video files, try to play after a brief delay
      if (!isYouTube && videoRef.current) {
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.currentTime = startTime;
            videoRef.current.play().catch(console.error);
          }
        }, 100);
      }
    } catch (err) {
      console.error('Error initializing player:', err);
      setError('Failed to load video');
    } finally {
      setLoading(false);
    }
  };

  // Handle video time updates for end time enforcement
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !endTime) return;

    const handleTimeUpdate = () => {
      if (video.currentTime >= endTime) {
        video.pause();
        video.currentTime = endTime;
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [endTime]);

  // Format duration for display
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const duration = endTime ? endTime - startTime : null;

  return (
    <div className={`relative bg-black rounded-lg overflow-hidden ${className}`}>
      {/* Play Button Overlay */}
      {!ready && (
        <div className="relative aspect-video bg-gray-900 flex items-center justify-center">
          {/* Thumbnail Background */}
          {thumbnail && (
            <img
              src={thumbnail}
              alt={title || 'Video thumbnail'}
              className="absolute inset-0 w-full h-full object-cover opacity-50"
            />
          )}
          
          {/* Play Button */}
          <div className="relative z-10 text-center">
            <button
              onClick={handlePlay}
              disabled={loading || !videoUrl}
              className="group flex flex-col items-center gap-3 px-6 py-4 bg-black/70 backdrop-blur-sm rounded-lg border border-white/20 hover:bg-black/80 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center group-hover:bg-white transition-colors">
                  <svg 
                    className="w-6 h-6 text-black ml-1" 
                    fill="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
              )}
              
              <div className="text-white text-center">
                <div className="font-semibold text-lg">
                  {loading ? 'Loading...' : 'Play Video'}
                </div>
                {duration && (
                  <div className="text-sm text-white/80">
                    Duration: {formatDuration(duration)}
                  </div>
                )}
                {title && (
                  <div className="text-sm text-white/80 mt-1 max-w-xs truncate">
                    {title}
                  </div>
                )}
              </div>
            </button>
          </div>

          {/* Timestamp Indicator */}
          {startTime > 0 && (
            <div className="absolute top-3 left-3 bg-black/70 text-white text-xs px-2 py-1 rounded">
              Starts at {formatDuration(startTime)}
            </div>
          )}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="aspect-video bg-red-50 border border-red-200 rounded-lg flex items-center justify-center">
          <div className="text-center text-red-600">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="font-medium">Failed to load video</p>
            <p className="text-sm text-red-500">{error}</p>
            <button
              onClick={() => {
                setError(null);
                setReady(false);
              }}
              className="mt-2 text-sm underline hover:no-underline"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Video Player */}
      {ready && videoUrl && !error && (
        <>
          {isYouTube ? (
            <iframe
              src={videoUrl}
              title={title || 'Video player'}
              className="w-full aspect-video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video
              ref={videoRef}
              controls
              preload="metadata"
              playsInline
              src={videoUrl}
              className="w-full aspect-video bg-black"
              poster={thumbnail}
              onError={(e) => {
                console.error('Video error:', e);
                setError('Failed to play video');
              }}
              onLoadStart={() => setLoading(true)}
              onCanPlay={() => setLoading(false)}
            >
              <p className="text-white p-4">
                Your browser does not support the video element.
              </p>
            </video>
          )}
        </>
      )}
    </div>
  );
}