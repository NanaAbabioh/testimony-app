'use client';

import { useState, useRef, useEffect } from 'react';
import { ClipDTO } from '../../../lib/types';

interface TestimonyPlayerProps {
  clip: ClipDTO;
  autoplay?: boolean;
  showInfo?: boolean;
  className?: string;
}

export default function TestimonyPlayer({ 
  clip, 
  autoplay = false,
  showInfo = true,
  className = "" 
}: TestimonyPlayerProps) {
  const [ready, setReady] = useState(autoplay);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Generate YouTube thumbnail URL
  const getThumbnailUrl = (videoId: string, quality: 'default' | 'medium' | 'high' | 'maxres' = 'high') => {
    return `https://img.youtube.com/vi/${videoId}/${quality === 'high' ? 'hqdefault' : quality === 'maxres' ? 'maxresdefault' : quality === 'medium' ? 'mqdefault' : 'default'}.jpg`;
  };

  // Generate YouTube embed URL with testimony timing (fallback for old clips)
  const getEmbedUrl = () => {
    if (!clip.videoId) return null;
    
    const baseUrl = `https://www.youtube.com/embed/${clip.videoId}`;
    const params = new URLSearchParams({
      start: Math.floor(clip.startSec || 0).toString(),
      end: Math.floor(clip.endSec || 0).toString(),
      autoplay: ready ? '1' : '0',
      rel: '0', // Don't show related videos
      modestbranding: '1', // Minimal YouTube branding
      iv_load_policy: '3', // Don't show annotations
    });
    
    return `${baseUrl}?${params.toString()}`;
  };

  // Check if we have a processed clip URL
  const hasProcessedClip = !!(clip as any).processedClipUrl;
  const processedClipUrl = (clip as any).processedClipUrl;

  // Calculate testimony duration
  const getDuration = () => {
    return Math.ceil((clip.endSec || 0) - (clip.startSec || 0));
  };

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle play button click
  const handlePlay = () => {
    if (!clip.videoId) {
      setError('No video available');
      return;
    }

    setLoading(true);
    setError(null);
    setReady(true);

    // Stop loading state after iframe loads
    setTimeout(() => setLoading(false), 1000);
  };

  // Generate embed URL
  const embedUrl = getEmbedUrl();
  const thumbnailUrl = getThumbnailUrl(clip.videoId);
  const duration = getDuration();

  return (
    <div className={`relative ${className}`}>
      {/* Video Info Header */}
      {showInfo && (
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900 mb-2">{clip.title}</h2>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span className="inline-flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {formatTime(duration)} testimony
            </span>
            <span className="inline-flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              {clip.categoryId}
            </span>
            <span className="text-gray-500">
              {new Date(clip.serviceDate).toLocaleDateString()}
            </span>
          </div>
        </div>
      )}

      {/* Player Container */}
      <div className="relative bg-black rounded-lg overflow-hidden">
        {/* Play Button Overlay */}
        {!ready && (
          <div className="relative aspect-video bg-gray-900">
            {/* Thumbnail */}
            <img
              src={thumbnailUrl}
              alt={clip.title}
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => {
                // Fallback to lower quality thumbnail
                const target = e.target as HTMLImageElement;
                if (target.src.includes('hqdefault')) {
                  target.src = getThumbnailUrl(clip.videoId, 'medium');
                }
              }}
            />
            
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-black/40" />
            
            {/* Play Button */}
            <div className="absolute inset-0 flex items-center justify-center">
              <button
                onClick={handlePlay}
                disabled={loading || !embedUrl}
                className="group relative"
              >
                {/* Play button background */}
                <div className="w-20 h-20 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center transition-all duration-200 group-hover:scale-110 shadow-2xl">
                  {loading ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  )}
                </div>
                
                {/* YouTube logo */}
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md">
                  <svg className="w-4 h-4 text-red-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </div>
              </button>
            </div>

            {/* Duration badge */}
            <div className="absolute bottom-3 right-3 bg-black/80 text-white text-xs px-2 py-1 rounded">
              {formatTime(duration)}
            </div>

            {/* Testimony start time */}
            <div className="absolute top-3 left-3 bg-black/80 text-white text-xs px-2 py-1 rounded">
              Starts at {formatTime(clip.startSec || 0)}
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="aspect-video bg-red-50 border border-red-200 flex items-center justify-center">
            <div className="text-center text-red-600 p-6">
              <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="font-semibold mb-1">Unable to load video</p>
              <p className="text-sm text-red-500 mb-3">{error}</p>
              <button
                onClick={() => {
                  setError(null);
                  setReady(false);
                  setLoading(false);
                }}
                className="text-sm bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Self-Hosted Video (preferred) or YouTube Embed (fallback) */}
        {ready && !error && (
          hasProcessedClip ? (
            <video
              ref={videoRef}
              className="w-full aspect-video bg-black"
              controls
              autoPlay={autoplay}
              playsInline
              preload="metadata"
              onLoadStart={() => setLoading(true)}
              onCanPlay={() => setLoading(false)}
              onError={() => {
                setError('Failed to load self-hosted video');
                setLoading(false);
              }}
            >
              <source src={processedClipUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          ) : embedUrl ? (
            <iframe
              ref={iframeRef}
              src={embedUrl}
              title={`${clip.title} - Testimony`}
              className="w-full aspect-video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
              onLoad={() => setLoading(false)}
              onError={() => {
                setError('Failed to load YouTube video');
                setLoading(false);
              }}
            />
          ) : (
            <div className="aspect-video bg-gray-100 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <p className="text-sm">No video available</p>
              </div>
            </div>
          )
        )}
      </div>

      {/* Additional Info */}
      {showInfo && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 mb-1">About This Testimony</h3>
              <p className="text-sm text-gray-600">
                This {formatTime(duration)} testimony was shared during an Alpha Hour service 
                on {new Date(clip.serviceDate || '').toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}.
              </p>
              
              {/* Show video source type */}
              {hasProcessedClip && (
                <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                  ✨ <span className="font-medium">Enhanced Quality:</span> Self-hosted video clip for optimal viewing experience
                </p>
              )}
              
              {(clip.savedCount || 0) > 0 && (
                <p className="text-sm text-purple-600 mt-2">
                  💜 Saved by {clip.savedCount} {(clip.savedCount || 0) === 1 ? 'person' : 'people'}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}