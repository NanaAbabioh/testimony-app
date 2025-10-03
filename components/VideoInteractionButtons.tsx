"use client";
import { useState, useEffect } from "react";
import { PlayIcon } from "@/components/ui/icons";

type VideoInteractionButtonsProps = {
  clip: {
    id: string;
    videoId: string;
    startSec: number;
    endSec?: number;
    titleShort: string;
    summaryShort?: string;
    title?: string;
    fullText?: string;
    episode?: string;
    serviceDate?: string;
    thumbUrl?: string;
  };
  className?: string;
};

export default function VideoInteractionButtons({ clip, className = "" }: VideoInteractionButtonsProps) {
  const [hallelujahCount, setHallelujahCount] = useState(0);
  const [isHallelujahActive, setIsHallelujahActive] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [fileSizes, setFileSizes] = useState<{video?: string, audio?: string}>({});
  const [loadingSizes, setLoadingSizes] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const playUrl = `/watch/${clip.id}?start=${Math.floor(clip.startSec)}`;
  const audioUrl = `/watch/${clip.id}?start=${Math.floor(clip.startSec)}&audioOnly=true`;
  const shareUrl = (typeof window !== "undefined") ? `${window.location.origin}${playUrl}` : playUrl;
  
  const displayTitle = clip.title || clip.titleShort || 'Untitled Testimony';
  const displayDescription = clip.fullText || clip.summaryShort;

  useEffect(() => {
    // Check if this clip was previously downloaded
    const downloadKey = `downloaded_${clip.id}`;
    const wasDownloaded = localStorage.getItem(downloadKey) === 'true';
    setIsDownloaded(wasDownloaded);
    
    // Check if this clip was previously saved
    const savedKey = `saved_${clip.id}`;
    const wasSaved = localStorage.getItem(savedKey) === 'true';
    setIsSaved(wasSaved);
  }, [clip.id]);

  // Function to estimate file sizes based on clip duration
  const estimateFileSizes = () => {
    if (loadingSizes || fileSizes.video) return;
    
    setLoadingSizes(true);
    
    // Calculate duration in minutes
    const startSec = clip.startSec || 0;
    const endSec = clip.endSec || (startSec + 360); // Default to 6 minutes if no end time
    const durationMinutes = Math.max((endSec - startSec) / 60, 1);
    
    // Estimate sizes based on typical compression rates
    const estimatedVideoMB = Math.round(durationMinutes * 8);
    const estimatedAudioMB = Math.round(durationMinutes * 1);
    
    setTimeout(() => {
      setFileSizes({
        video: `~${estimatedVideoMB}MB`,
        audio: `~${estimatedAudioMB}MB`
      });
      setLoadingSizes(false);
    }, 500);
  };

  const handleSave = () => {
    // Haptic feedback for mobile devices
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
    
    const savedKey = `saved_${clip.id}`;
    const newSavedState = !isSaved;
    
    if (newSavedState) {
      // Save the clip data to localStorage for My Testimony Wall
      const savedClipsKey = 'saved_clips';
      const existingSavedClips = JSON.parse(localStorage.getItem(savedClipsKey) || '[]');
      
      const clipData = {
        id: clip.id,
        title: displayTitle,
        titleShort: clip.titleShort,
        summaryShort: clip.summaryShort,
        fullText: displayDescription,
        videoId: clip.videoId,
        startSec: clip.startSec,
        endSec: clip.endSec,
        episode: clip.episode,
        serviceDate: clip.serviceDate,
        thumbUrl: clip.thumbUrl,
        savedAt: new Date().toISOString(),
        type: 'saved'
      };
      
      // Add to saved clips if not already there
      const isAlreadySaved = existingSavedClips.some((savedClip: any) => savedClip.id === clip.id);
      if (!isAlreadySaved) {
        existingSavedClips.unshift(clipData);
        localStorage.setItem(savedClipsKey, JSON.stringify(existingSavedClips));
      }
      
      localStorage.setItem(savedKey, 'true');
    } else {
      // Remove from saved clips
      const savedClipsKey = 'saved_clips';
      const existingSavedClips = JSON.parse(localStorage.getItem(savedClipsKey) || '[]');
      const filteredClips = existingSavedClips.filter((savedClip: any) => savedClip.id !== clip.id);
      localStorage.setItem(savedClipsKey, JSON.stringify(filteredClips));
      
      localStorage.removeItem(savedKey);
    }
    
    setIsSaved(newSavedState);
  };

  return (
    <>
      {/* Action Buttons Container */}
      <div className={`flex flex-wrap gap-2 sm:gap-3 ${className}`}>
        {/* Hallelujah Button */}
        <button 
          onClick={(e) => {
            e.preventDefault();
            setHallelujahCount(prev => prev + 1);
            setIsHallelujahActive(true);
            setTimeout(() => setIsHallelujahActive(false), 200);
          }}
          className={`relative flex items-center justify-center gap-1 px-3 py-2 rounded-full text-sm transition-all duration-300 overflow-hidden ${
            hallelujahCount > 0 
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md transform scale-105' 
              : 'bg-white/90 backdrop-blur hover:bg-white text-gray-700 border border-gray-200'
          }`}
          style={{
            transform: isHallelujahActive ? 'scale(1.1)' : hallelujahCount > 0 ? 'scale(1.05)' : 'scale(1)'
          }}
        >
          {hallelujahCount > 0 && (
            <div 
              className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-20"
              style={{
                animation: isHallelujahActive ? 'pulse 0.3s ease-out' : 'none'
              }}
            />
          )}
          <span className="text-sm sm:text-base relative z-10" style={{ fontFamily: 'Brittany Signature, cursive' }}>
            Hallelujah
          </span>
          {hallelujahCount > 0 && (
            <span className="ml-1 font-bold text-xs sm:text-sm relative z-10">
              {hallelujahCount}
            </span>
          )}
        </button>
        
        {/* Share Button */}
        <button 
          onClick={(e) => {
            e.preventDefault();
            setShowShareDialog(true);
          }}
          className="flex items-center justify-center gap-1 px-3 py-2 bg-white/90 backdrop-blur hover:bg-white rounded-full text-gray-700 text-sm transition-colors border border-gray-200"
        >
          <img 
            src="/icons/share-button.svg" 
            alt="Share" 
            className="w-4 h-4"
          />
          <span>Share</span>
        </button>
        
        {/* Download Button */}
        <button 
          onClick={(e) => {
            e.preventDefault();
            setShowDownloadDialog(true);
            estimateFileSizes();
          }}
          className={`flex items-center justify-center gap-1 px-3 py-2 rounded-full text-sm transition-colors border ${
            isDownloaded 
              ? 'bg-blue-600 text-white border-blue-600' 
              : 'bg-white/90 backdrop-blur hover:bg-white text-gray-700 border-gray-200'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isDownloaded ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            )}
          </svg>
          <span>{isDownloaded ? 'Downloaded' : 'Download'}</span>
        </button>
        
        {/* Save Button */}
        <button 
          onClick={handleSave}
          className={`flex items-center justify-center gap-1 px-3 py-2 rounded-full text-sm transition-colors border ${
            isSaved
              ? 'bg-purple-600 text-white border-purple-600'
              : 'bg-white/90 backdrop-blur hover:bg-white text-gray-700 border-gray-200'
          }`}
        >
          <svg className="w-4 h-4" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" 
              fill={isSaved ? 'currentColor' : 'none'}
            />
          </svg>
          <span>{isSaved ? 'Saved' : 'Save'}</span>
        </button>
      </div>

      {/* Share Dialog */}
      {showShareDialog && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setShowShareDialog(false)}
          />
          
          <div className="fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl z-50 w-[90%] max-w-sm p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Share Testimony</h3>
              <button 
                onClick={() => setShowShareDialog(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Copy Link Option */}
            <button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(shareUrl);
                  if ('vibrate' in navigator) {
                    navigator.vibrate(50);
                  }
                  setLinkCopied(true);
                  setTimeout(() => {
                    setLinkCopied(false);
                  }, 2000);
                } catch (err) {
                  console.error('Failed to copy link:', err);
                }
              }}
              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors mb-3 ${
                linkCopied 
                  ? 'bg-green-50 border border-green-200' 
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                linkCopied 
                  ? 'bg-green-100' 
                  : 'bg-gray-100'
              }`}>
                {linkCopied ? (
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </div>
              <span className={`font-medium ${
                linkCopied 
                  ? 'text-green-700' 
                  : 'text-gray-700'
              }`}>
                {linkCopied ? 'Link copied!' : 'Copy link'}
              </span>
            </button>
            
            {/* Social Media Options */}
            <div className="grid grid-cols-4 gap-3">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(displayTitle + ' ' + shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-1 p-2 hover:bg-gray-50 rounded-lg transition-colors"
                onClick={() => setShowShareDialog(false)}
              >
                <div className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden">
                  <img 
                    src="/icons/whatsapp.svg" 
                    alt="WhatsApp" 
                    className="w-12 h-12 object-contain"
                  />
                </div>
                <span className="text-xs text-gray-600">WhatsApp</span>
              </a>
              
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-1 p-2 hover:bg-gray-50 rounded-lg transition-colors"
                onClick={() => setShowShareDialog(false)}
              >
                <div className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden">
                  <img 
                    src="/icons/facebook.svg" 
                    alt="Facebook" 
                    className="w-12 h-12 object-contain"
                  />
                </div>
                <span className="text-xs text-gray-600">Facebook</span>
              </a>
              
              <a
                href={`https://www.instagram.com/`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-1 p-2 hover:bg-gray-50 rounded-lg transition-colors"
                onClick={() => {
                  navigator.clipboard.writeText(shareUrl);
                  setShowShareDialog(false);
                }}
              >
                <div className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden">
                  <img 
                    src="/icons/instagram.svg" 
                    alt="Instagram" 
                    className="w-12 h-12 object-contain"
                  />
                </div>
                <span className="text-xs text-gray-600">Instagram</span>
              </a>
              
              <a
                href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(displayTitle)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-1 p-2 hover:bg-gray-50 rounded-lg transition-colors"
                onClick={() => setShowShareDialog(false)}
              >
                <div className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden">
                  <img 
                    src="/icons/telegram.svg" 
                    alt="Telegram" 
                    className="w-12 h-12 object-contain"
                  />
                </div>
                <span className="text-xs text-gray-600">Telegram</span>
              </a>
            </div>
          </div>
        </>
      )}
      
      {/* Download Dialog */}
      {showDownloadDialog && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setShowDownloadDialog(false)}
          />
          
          <div className="fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl z-50 w-[90%] max-w-sm p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Download Testimony</h3>
              <button 
                onClick={() => setShowDownloadDialog(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm text-blue-800 font-medium mb-1">Offline Access</p>
                  <p className="text-xs text-blue-700">Download to watch or listen to this testimony even when you're offline.</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = playUrl;
                  link.download = `${displayTitle}-video.mp4`;
                  link.target = '_blank';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  
                  const savedClipsKey = 'saved_clips';
                  const existingSavedClips = JSON.parse(localStorage.getItem(savedClipsKey) || '[]');
                  
                  const clipData = {
                    id: clip.id,
                    title: displayTitle,
                    titleShort: clip.titleShort,
                    summaryShort: clip.summaryShort,
                    fullText: displayDescription,
                    videoId: clip.videoId,
                    startSec: clip.startSec,
                    endSec: clip.endSec,
                    episode: clip.episode,
                    serviceDate: clip.serviceDate,
                    thumbUrl: clip.thumbUrl,
                    downloadedAt: new Date().toISOString(),
                    type: 'downloaded',
                    downloadType: 'video'
                  };
                  
                  const existingClipIndex = existingSavedClips.findIndex((savedClip: any) => savedClip.id === clip.id);
                  if (existingClipIndex >= 0) {
                    existingSavedClips[existingClipIndex] = { ...existingSavedClips[existingClipIndex], ...clipData };
                  } else {
                    existingSavedClips.unshift(clipData);
                  }
                  localStorage.setItem(savedClipsKey, JSON.stringify(existingSavedClips));
                  
                  const downloadKey = `downloaded_${clip.id}`;
                  localStorage.setItem(downloadKey, 'true');
                  
                  setIsDownloaded(true);
                  setShowDownloadDialog(false);
                }}
                className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200"
              >
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="text-left flex-1">
                  <p className="text-gray-900 font-medium">Download Video</p>
                  <p className="text-xs text-gray-600">Watch offline with full video</p>
                </div>
                <div className="text-right">
                  {loadingSizes ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-600 border-t-transparent"></div>
                  ) : (
                    <span className="text-sm font-medium text-purple-600">{fileSizes.video || '...'}</span>
                  )}
                </div>
              </button>
              
              <button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = audioUrl;
                  link.download = `${displayTitle}-audio.mp3`;
                  link.target = '_blank';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  
                  const savedClipsKey = 'saved_clips';
                  const existingSavedClips = JSON.parse(localStorage.getItem(savedClipsKey) || '[]');
                  
                  const clipData = {
                    id: clip.id,
                    title: displayTitle,
                    titleShort: clip.titleShort,
                    summaryShort: clip.summaryShort,
                    fullText: displayDescription,
                    videoId: clip.videoId,
                    startSec: clip.startSec,
                    endSec: clip.endSec,
                    episode: clip.episode,
                    serviceDate: clip.serviceDate,
                    thumbUrl: clip.thumbUrl,
                    downloadedAt: new Date().toISOString(),
                    type: 'downloaded',
                    downloadType: 'audio'
                  };
                  
                  const existingClipIndex = existingSavedClips.findIndex((savedClip: any) => savedClip.id === clip.id);
                  if (existingClipIndex >= 0) {
                    existingSavedClips[existingClipIndex] = { ...existingSavedClips[existingClipIndex], ...clipData };
                  } else {
                    existingSavedClips.unshift(clipData);
                  }
                  localStorage.setItem(savedClipsKey, JSON.stringify(existingSavedClips));
                  
                  const downloadKey = `downloaded_${clip.id}`;
                  localStorage.setItem(downloadKey, 'true');
                  
                  setIsDownloaded(true);
                  setShowDownloadDialog(false);
                }}
                className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200"
              >
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM22 16c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
                  </svg>
                </div>
                <div className="text-left flex-1">
                  <p className="text-gray-900 font-medium">Download Audio</p>
                  <p className="text-xs text-gray-600">Listen offline, smaller file size</p>
                </div>
                <div className="text-right">
                  {loadingSizes ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-600 border-t-transparent"></div>
                  ) : (
                    <span className="text-sm font-medium text-green-600">{fileSizes.audio || '...'}</span>
                  )}
                </div>
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}