"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { isDataSaverEffective, onDataSaverChange, getDataSaverStatus } from "../../lib/dataSaver";
import { getMediaSources, getOptimalMediaSource, estimateDataUsage } from "../../lib/media";

interface SmartPlayerProps {
  videoId: string;
  start?: number;
  end?: number;
  preferAudioAvailable?: boolean;
  autoplay?: boolean;
  className?: string;
  showControls?: boolean;
  showDataUsage?: boolean;
}

export default function SmartPlayer({
  videoId,
  start = 0,
  end,
  preferAudioAvailable = true,
  autoplay = false,
  className = "",
  showControls = true,
  showDataUsage = false
}: SmartPlayerProps) {
  const [ready, setReady] = useState(false);
  const [audioOnly, setAudioOnly] = useState<boolean>(false);
  const [useLow, setUseLow] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const vref = useRef<HTMLVideoElement | null>(null);
  const aref = useRef<HTMLAudioElement | null>(null);

  // Get media sources
  const mediaSources = useMemo(() => getMediaSources(videoId, { 
    startTime: start, 
    endTime: end 
  }), [videoId, start, end]);

  // Calculate estimated duration for data usage
  const estimatedDuration = useMemo(() => {
    if (end && start) return end - start;
    return duration || 120; // Default to 2 minutes if unknown
  }, [duration, end, start]);

  // Get optimal media source based on data saver
  const optimalSource = useMemo(() => {
    const quality = audioOnly ? 'audio' : (useLow ? 'low' : 'auto');
    return getOptimalMediaSource(videoId, { 
      startTime: start, 
      endTime: end, 
      quality 
    });
  }, [videoId, start, end, audioOnly, useLow]);

  // Initialize based on data saver preferences
  useEffect(() => {
    const dataSaverActive = isDataSaverEffective();
    setUseLow(dataSaverActive);
    if (dataSaverActive && preferAudioAvailable) {
      setAudioOnly(true);
    }

    // Listen for data saver changes
    const cleanup = onDataSaverChange((isEffective) => {
      setUseLow(isEffective);
      if (isEffective && preferAudioAvailable && !ready) {
        setAudioOnly(true);
      }
    });

    return cleanup;
  }, [preferAudioAvailable, ready]);

  // Handle media loading with precise seeking
  const handleLoadedMetadata = useCallback(() => {
    const element = audioOnly ? aref.current : vref.current;
    if (element && start > 0) {
      try {
        element.currentTime = start;
        setCurrentTime(start);
      } catch (error) {
        console.warn('Failed to seek to start time:', error);
      }
    }
    if (element) {
      setDuration(element.duration || 0);
    }
  }, [start, audioOnly]);

  // Handle time updates and auto-stop at end time
  const handleTimeUpdate = useCallback(() => {
    const element = audioOnly ? aref.current : vref.current;
    if (element) {
      const current = element.currentTime;
      setCurrentTime(current);
      
      // Auto-stop at end time if specified
      if (end && current >= end) {
        element.pause();
        setIsPlaying(false);
      }
    }
  }, [audioOnly, end]);

  // Handle play/pause state
  const handlePlay = useCallback(() => setIsPlaying(true), []);
  const handlePause = useCallback(() => setIsPlaying(false), []);
  const handleEnded = useCallback(() => setIsPlaying(false), []);

  // Handle errors
  const handleError = useCallback((e: Event) => {
    console.error('Media error:', e);
    setError('Failed to load media. Please try a different quality option.');
    setLoading(false);
  }, []);

  // Setup event listeners
  useEffect(() => {
    const element = audioOnly ? aref.current : vref.current;
    if (!element) return;

    element.addEventListener('loadedmetadata', handleLoadedMetadata);
    element.addEventListener('timeupdate', handleTimeUpdate);
    element.addEventListener('play', handlePlay);
    element.addEventListener('pause', handlePause);
    element.addEventListener('ended', handleEnded);
    element.addEventListener('error', handleError);
    element.addEventListener('loadstart', () => setLoading(true));
    element.addEventListener('canplay', () => setLoading(false));

    return () => {
      element.removeEventListener('loadedmetadata', handleLoadedMetadata);
      element.removeEventListener('timeupdate', handleTimeUpdate);
      element.removeEventListener('play', handlePlay);
      element.removeEventListener('pause', handlePause);
      element.removeEventListener('ended', handleEnded);
      element.removeEventListener('error', handleError);
      element.removeEventListener('loadstart', () => setLoading(true));
      element.removeEventListener('canplay', () => setLoading(false));
    };
  }, [audioOnly, handleLoadedMetadata, handleTimeUpdate, handlePlay, handlePause, handleEnded, handleError]);

  const handlePlayClick = useCallback(() => {
    if (!ready) {
      setReady(true);
      setLoading(true);
    } else {
      const element = audioOnly ? aref.current : vref.current;
      if (element) {
        if (isPlaying) {
          element.pause();
        } else {
          element.play().catch(err => {
            console.error('Play failed:', err);
            setError('Playback failed. Please try again.');
          });
        }
      }
    }
  }, [ready, audioOnly, isPlaying]);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Data usage estimation
  const dataUsage = useMemo(() => {
    const quality = audioOnly ? 'audio' : (useLow ? 'low' : 'auto');
    return estimateDataUsage(estimatedDuration, quality);
  }, [estimatedDuration, audioOnly, useLow]);

  const dataSaverStatus = getDataSaverStatus();

  return (
    <div className={`bg-white border rounded-lg overflow-hidden ${className}`}>
      {/* Controls */}
      {showControls && (
        <div className="p-3 border-b bg-gray-50">
          <div className="flex items-center justify-between gap-4 mb-2">
            <div className="flex items-center gap-3">
              <button 
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  ready && !loading
                    ? isPlaying 
                      ? "bg-orange-600 hover:bg-orange-700 text-white" 
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-gray-600 hover:bg-gray-700 text-white"
                }`}
                onClick={handlePlayClick}
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Loading...
                  </span>
                ) : ready ? (
                  isPlaying ? "⏸️ Pause" : "▶️ Play"
                ) : (
                  "▶️ Load & Play"
                )}
              </button>

              {ready && duration > 0 && (
                <div className="text-sm text-gray-600">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={audioOnly} 
                  onChange={(e) => setAudioOnly(e.target.checked)}
                  disabled={ready}
                  className="rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="flex items-center gap-1">
                  🎧 Audio only
                  {audioOnly && <span className="text-green-600 text-xs">(Data saving)</span>}
                </span>
              </label>

              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={useLow} 
                  onChange={(e) => setUseLow(e.target.checked)}
                  disabled={ready || audioOnly}
                  className="rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="flex items-center gap-1">
                  📱 Low quality
                  {useLow && !audioOnly && <span className="text-green-600 text-xs">(Data saving)</span>}
                </span>
              </label>
            </div>
          </div>

          {/* Data usage info */}
          {(showDataUsage || dataSaverStatus.isActive) && (
            <div className="flex items-center justify-between text-xs text-gray-600 mt-2 pt-2 border-t">
              <div className="flex items-center gap-2">
                <span>Estimated data usage:</span>
                <span className="font-medium">{dataUsage.totalMB} MB</span>
                <span className="text-gray-500">({dataUsage.description})</span>
              </div>
              {dataSaverStatus.isActive && (
                <div className="flex items-center gap-1 text-green-700">
                  🔋 <span className="font-medium">Data Saver Active</span>
                </div>
              )}
            </div>
          )}

          {ready && !loading && (
            <div className="text-xs text-gray-500 mt-1">
              Quality: {audioOnly ? 'Audio Only' : useLow ? 'Low' : 'Auto'} 
              {start > 0 && ` • Start: ${formatTime(start)}`}
              {end && ` • End: ${formatTime(end)}`}
            </div>
          )}
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="p-3 bg-red-50 border-l-4 border-red-400 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Media elements */}
      <div className="relative">
        {audioOnly ? (
          <div className="p-6 bg-gray-100 flex items-center justify-center min-h-32">
            <div className="text-center">
              <div className="text-4xl mb-2">🎧</div>
              <div className="text-sm text-gray-600 mb-4">Audio Only Mode</div>
              <audio
                ref={aref}
                controls
                preload="none"
                src={ready ? mediaSources.audioOnly : undefined}
                className="w-full max-w-sm"
                autoPlay={ready && autoplay}
              />
            </div>
          </div>
        ) : (
          <video
            ref={vref}
            controls
            playsInline
            preload="none"
            poster={ready ? mediaSources.thumbnail : undefined}
            src={ready ? (useLow ? mediaSources.videoHlsLow : mediaSources.videoHlsAuto) : undefined}
            className="w-full aspect-video bg-black"
            autoPlay={ready && autoplay}
          />
        )}

        {loading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent mx-auto mb-2"></div>
              <div className="text-sm">Loading media...</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}