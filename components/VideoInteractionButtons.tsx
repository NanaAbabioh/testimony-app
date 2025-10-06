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
  console.log('[DEBUG] VideoInteractionButtons component loaded for clip:', clip.id);

  const [hallelujahCount, setHallelujahCount] = useState(0);
  const [isHallelujahActive, setIsHallelujahActive] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showUnsaveConfirm, setShowUnsaveConfirm] = useState(false);

  // Debug logging for dialog states
  useEffect(() => {
    console.log('[VideoInteractionButtons] showUnsaveConfirm changed:', showUnsaveConfirm);
  }, [showUnsaveConfirm]);

  const playUrl = `/watch/${clip.id}?start=${Math.floor(clip.startSec)}`;
  const audioUrl = `/watch/${clip.id}?start=${Math.floor(clip.startSec)}&audioOnly=true`;
  const shareUrl = (typeof window !== "undefined") ? `${window.location.origin}${playUrl}` : playUrl;
  
  const displayTitle = clip.title || clip.titleShort || 'Untitled Testimony';
  const displayDescription = clip.fullText || clip.summaryShort;

  useEffect(() => {
    console.log('[VideoInteractionButtons] Component mounted for clip:', clip.id);

    // Check if this clip was previously saved
    const savedKey = `saved_${clip.id}`;
    const wasSaved = localStorage.getItem(savedKey) === 'true';
    setIsSaved(wasSaved);
    console.log('[VideoInteractionButtons] Initial saved state:', wasSaved);
  }, [clip.id]);


  const handleSave = () => {
    console.log('[VideoInteractionButtons] Save button clicked, isSaved:', isSaved);

    // Haptic feedback for mobile devices
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }

    // If currently saved, show confirmation before unsaving
    if (isSaved) {
      console.log('[VideoInteractionButtons] Showing unsave confirmation dialog');
      setShowUnsaveConfirm(true);
      return;
    }

    // Save the clip data to localStorage for My Testimony Wall
    const savedKey = `saved_${clip.id}`;
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
    setIsSaved(true);
  };

  const confirmUnsave = () => {
    // Remove from saved clips
    const savedKey = `saved_${clip.id}`;
    const savedClipsKey = 'saved_clips';
    const existingSavedClips = JSON.parse(localStorage.getItem(savedClipsKey) || '[]');
    const filteredClips = existingSavedClips.filter((savedClip: any) => savedClip.id !== clip.id);
    localStorage.setItem(savedClipsKey, JSON.stringify(filteredClips));

    localStorage.removeItem(savedKey);
    setIsSaved(false);
    setShowUnsaveConfirm(false);
  };


  return (
    <>
      {/* Action Buttons Container - Equal Size Layout */}
      <div className={`flex items-center gap-2 sm:gap-3 mt-1 ${className}`}>
        {/* Hallelujah Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            setHallelujahCount(prev => prev + 1);
            setIsHallelujahActive(true);
            setTimeout(() => setIsHallelujahActive(false), 200);
          }}
          className={`relative flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-300 overflow-hidden flex-1 ${
            hallelujahCount > 0
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg transform scale-105'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700 shadow-sm'
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
            <span className="ml-1 font-bold text-sm relative z-10 bg-white/20 rounded-full px-2 py-0.5 min-w-[20px] text-center">
              {hallelujahCount}
            </span>
          )}
        </button>

        {/* Share Button - Equal Size */}
        <button
          onClick={(e) => {
            e.preventDefault();
            setShowShareDialog(true);
          }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700 text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md flex-1"
        >
          <img
            src="/icons/share-button.svg"
            alt="Share"
            className="w-4 h-4"
          />
          <span className="text-sm font-medium">Share</span>
        </button>

        {/* Save Button - Equal Size */}
        <button
          onClick={handleSave}
          className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md flex-1 ${
            isSaved
              ? 'bg-purple-100 text-purple-700 border border-purple-200'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
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
          <span className="text-sm">{isSaved ? 'Saved' : 'Save'}</span>
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
                  // Try modern clipboard API first
                  if (navigator.clipboard && window.isSecureContext) {
                    await navigator.clipboard.writeText(shareUrl);
                  } else {
                    // Fallback for mobile/older browsers
                    const textArea = document.createElement('textarea');
                    textArea.value = shareUrl;
                    textArea.style.position = 'fixed';
                    textArea.style.left = '-9999px';
                    textArea.style.top = '-9999px';
                    document.body.appendChild(textArea);
                    textArea.select();
                    textArea.setSelectionRange(0, 99999);
                    document.execCommand('copy');
                    document.body.removeChild(textArea);
                  }

                  // Haptic feedback for mobile
                  if ('vibrate' in navigator) {
                    navigator.vibrate(50);
                  }

                  setLinkCopied(true);
                  setTimeout(() => {
                    setLinkCopied(false);
                  }, 2000);
                } catch (err) {
                  console.error('Failed to copy link:', err);
                  // Show fallback prompt if all else fails
                  prompt('Copy this link:', shareUrl);
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
              <button
                onClick={async () => {
                  // Try native sharing first (like YouTube app)
                  if (navigator.share && /android|iphone|ipad|ipod/i.test(navigator.userAgent)) {
                    try {
                      await navigator.share({
                        title: displayTitle,
                        text: `Check out this testimony: ${displayTitle}`,
                        url: shareUrl
                      });
                      setShowShareDialog(false);
                      return;
                    } catch (err) {
                      // Fall back to WhatsApp web if native sharing fails
                    }
                  }
                  // Fallback to WhatsApp web
                  window.open(`https://wa.me/?text=${encodeURIComponent(displayTitle + ' ' + shareUrl)}`, '_blank');
                  setShowShareDialog(false);
                }}
                className="flex flex-col items-center gap-1 p-2 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden">
                  <img
                    src="/icons/whatsapp.svg"
                    alt="WhatsApp"
                    className="w-12 h-12 object-contain"
                  />
                </div>
                <span className="text-xs text-gray-600">WhatsApp</span>
              </button>

              <button
                onClick={async () => {
                  // Try native sharing first (like YouTube app)
                  if (navigator.share && /android|iphone|ipad|ipod/i.test(navigator.userAgent)) {
                    try {
                      await navigator.share({
                        title: displayTitle,
                        text: `Check out this testimony: ${displayTitle}`,
                        url: shareUrl
                      });
                      setShowShareDialog(false);
                      return;
                    } catch (err) {
                      // Fall back to Facebook web if native sharing fails
                    }
                  }
                  // Fallback to Facebook web
                  window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
                  setShowShareDialog(false);
                }}
                className="flex flex-col items-center gap-1 p-2 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden">
                  <img
                    src="/icons/facebook.svg"
                    alt="Facebook"
                    className="w-12 h-12 object-contain"
                  />
                </div>
                <span className="text-xs text-gray-600">Facebook</span>
              </button>

              <button
                onClick={async () => {
                  // Try native sharing first (like YouTube app)
                  if (navigator.share && /android|iphone|ipad|ipod/i.test(navigator.userAgent)) {
                    try {
                      await navigator.share({
                        title: displayTitle,
                        text: `Check out this testimony: ${displayTitle}`,
                        url: shareUrl
                      });
                      setShowShareDialog(false);
                      return;
                    } catch (err) {
                      // Fall back to copy for Instagram
                    }
                  }
                  // Instagram doesn't support URL sharing, so copy link
                  try {
                    if (navigator.clipboard && window.isSecureContext) {
                      await navigator.clipboard.writeText(shareUrl);
                    } else {
                      const textArea = document.createElement('textarea');
                      textArea.value = shareUrl;
                      textArea.style.position = 'fixed';
                      textArea.style.left = '-9999px';
                      document.body.appendChild(textArea);
                      textArea.select();
                      document.execCommand('copy');
                      document.body.removeChild(textArea);
                    }
                    alert('Link copied! You can paste it in Instagram.');
                  } catch (err) {
                    prompt('Copy this link for Instagram:', shareUrl);
                  }
                  setShowShareDialog(false);
                }}
                className="flex flex-col items-center gap-1 p-2 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden">
                  <img
                    src="/icons/instagram.svg"
                    alt="Instagram"
                    className="w-12 h-12 object-contain"
                  />
                </div>
                <span className="text-xs text-gray-600">Instagram</span>
              </button>

              <button
                onClick={async () => {
                  // Try native sharing first (like YouTube app)
                  if (navigator.share && /android|iphone|ipad|ipod/i.test(navigator.userAgent)) {
                    try {
                      await navigator.share({
                        title: displayTitle,
                        text: `Check out this testimony: ${displayTitle}`,
                        url: shareUrl
                      });
                      setShowShareDialog(false);
                      return;
                    } catch (err) {
                      // Fall back to Telegram web if native sharing fails
                    }
                  }
                  // Fallback to Telegram web
                  window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(displayTitle)}`, '_blank');
                  setShowShareDialog(false);
                }}
                className="flex flex-col items-center gap-1 p-2 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden">
                  <img
                    src="/icons/telegram.svg"
                    alt="Telegram"
                    className="w-12 h-12 object-contain"
                  />
                </div>
                <span className="text-xs text-gray-600">Telegram</span>
              </button>
            </div>
          </div>
        </>
      )}
      

      {/* Unsave Confirmation Dialog */}
      {showUnsaveConfirm && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setShowUnsaveConfirm(false)}
          />
          <div className="fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl z-50 w-[90%] max-w-sm p-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Remove from Saved?</h3>
              <p className="text-sm text-gray-600 mb-6">
                This will remove this testimony from your personal collection under My Testimony Wall.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowUnsaveConfirm(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Never Mind
                </button>
                <button
                  onClick={confirmUnsave}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  OK, Remove
                </button>
              </div>
            </div>
          </div>
        </>
      )}

    </>
  );
}