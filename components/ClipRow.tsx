"use client";
import Image from "next/image";
import Button from "@/components/ui/button";
import { HeartIcon, ShareIcon, PlayIcon } from "@/components/ui/icons";
import { useState, useEffect } from "react";
import { isDataSaverEffective } from "@/lib/dataSaver";

type RowClip = {
  id: string;
  videoId: string;
  startSec: number;
  titleShort: string;
  summaryShort?: string;
  thumbUrl?: string;
  serviceDate?: string;
  savedCount?: number;
  episode?: string;
  title?: string; // AI-generated title
  fullText?: string; // Brief description from CSV
};

export default function ClipRow({ clip }: { clip: RowClip }) {
  // Debug logging to check videoId
  useEffect(() => {
    console.log('[ClipRow] Clip data:', {
      id: clip.id,
      videoId: clip.videoId,
      sourceVideoId: (clip as any).sourceVideoId,
      thumbUrl: clip.thumbUrl,
      episode: clip.episode
    });
  }, [clip]);

  const playUrl = `/watch/${clip.id}?start=${Math.floor(clip.startSec)}`;
  const audioUrl = `/watch/${clip.id}?start=${Math.floor(clip.startSec)}&audioOnly=true`;
  const shareUrl = (typeof window !== "undefined") ? `${window.location.origin}${playUrl}` : playUrl;
  
  const [dataSaverMode, setDataSaverMode] = useState(false);
  const [hallelujahCount, setHallelujahCount] = useState(0);
  const [isHallelujahActive, setIsHallelujahActive] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showUnsaveConfirm, setShowUnsaveConfirm] = useState(false);

  useEffect(() => {
    setDataSaverMode(isDataSaverEffective());
    
    // Check if this clip was previously saved
    const savedKey = `saved_${clip.id}`;
    const wasSaved = localStorage.getItem(savedKey) === 'true';
    setIsSaved(wasSaved);
  }, [clip.id]);
  

  // Generate YouTube thumbnail URL with higher quality
  const getYouTubeThumbnail = (videoId: string) => {
    // Use hqdefault for better quality (480x360)
    // Falls back to mqdefault (320x180) if hqdefault is not available
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  };

  // Use actual episode number from CSV data
  const episodeNumber = clip.episode || 'EP001';
  
  // Use AI-generated title, fallback to titleShort if not available
  const displayTitle = clip.title || clip.titleShort || 'Untitled Testimony';

  const confirmUnsave = () => {
    console.log('[ClipRow] Confirmed unsave');

    // Remove from saved clips
    const savedKey = `saved_${clip.id}`;
    const savedClipsKey = 'saved_clips';
    const existingSavedClips = JSON.parse(localStorage.getItem(savedClipsKey) || '[]');
    const filteredClips = existingSavedClips.filter((savedClip: any) => savedClip.id !== clip.id);
    localStorage.setItem(savedClipsKey, JSON.stringify(filteredClips));

    localStorage.removeItem(savedKey);
    setIsSaved(false);
    setShowUnsaveConfirm(false);

    // If we're on My Testimony Wall page, refresh to update the list
    if (typeof window !== 'undefined' && window.location.pathname === '/my-testimony-wall') {
      setTimeout(() => {
        window.location.reload();
      }, 500); // Small delay to ensure state updates are processed
    }
  };


  // Use brief description from CSV (fullText), fallback to summaryShort
  const displayDescription = clip.fullText || clip.summaryShort;

  return (
    <article className="flex flex-col sm:flex-row gap-3 p-3 sm:p-4 rounded-[18px] bg-white/25 backdrop-blur-sm border border-gray-200/30 shadow-sm hover:shadow-md transition-shadow">
      {/* Thumb */}
      <a href={playUrl} className="relative w-full sm:w-40 shrink-0 aspect-[16/9] rounded-[14px] overflow-hidden bg-black/10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src={getYouTubeThumbnail(clip.videoId)} 
          alt={`Episode ${episodeNumber} thumbnail`} 
          className="w-full h-full object-cover" 
          loading="lazy"
          onError={(e) => {
            // Fallback hierarchy: hqdefault -> mqdefault -> thumbUrl -> API thumbnail
            const target = e.target as HTMLImageElement;
            const currentSrc = target.src;
            
            if (currentSrc.includes('hqdefault')) {
              // First fallback: try medium quality
              target.src = `https://img.youtube.com/vi/${clip.videoId}/mqdefault.jpg`;
            } else if (currentSrc.includes('mqdefault')) {
              // Second fallback: use provided thumbUrl
              target.src = clip.thumbUrl || `/api/thumb/${clip.videoId}`;
            } else {
              // Final fallback: API thumbnail or default
              target.src = `/api/thumb/${clip.videoId}`;
            }
          }}
        />
        <div className="absolute inset-0 grid place-items-center">
          <div className="rounded-full bg-red-600 hover:bg-red-700 text-white p-2 shadow-lg transition-colors">
            <PlayIcon size={18} />
          </div>
        </div>
      </a>

      {/* Body */}
      <div className="min-w-0 flex-1">
        {/* Episode # and Clip Title */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
          <span className="font-serif text-[14px] sm:text-[17px] font-bold text-gray-800 whitespace-nowrap">
            Episode {episodeNumber}
          </span>
          <span className="text-gray-400 text-[14px] sm:text-[17px] hidden sm:inline">||</span>
          <h3 className="font-serif text-[14px] sm:text-[17px] leading-snug line-clamp-2 sm:line-clamp-1 flex-1 font-bold text-gray-900">{displayTitle}</h3>
        </div>
        
        {/* Brief description */}
        {displayDescription && (
          <p className="mt-1 text-[13px] sm:text-[15px] text-black/70 line-clamp-2 leading-relaxed mb-3">
            {displayDescription}
          </p>
        )}
        
        {/* Action Buttons - Equal Size Layout */}
        <div className="flex items-center gap-2 sm:gap-3 mt-1">
          {/* Hallelujah Button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              setHallelujahCount(prev => prev + 1);
              setIsHallelujahActive(true);
              // Brief animation reset
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
            {/* Animated background fill */}
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
            onClick={(e) => {
              e.preventDefault();
              console.log('[ClipRow] Save button clicked, isSaved:', isSaved);

              // Haptic feedback for mobile devices
              if ('vibrate' in navigator) {
                navigator.vibrate(50);
              }

              // If currently saved, show confirmation before unsaving
              if (isSaved) {
                console.log('[ClipRow] Showing unsave confirmation dialog');
                setShowUnsaveConfirm(true);
                return;
              }

              // If not saved, proceed with saving immediately
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
                  existingSavedClips.unshift(clipData); // Add to beginning
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
            }}
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
      </div>
      
      {/* Share Dialog */}
      {showShareDialog && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-[9999]"
            onClick={() => setShowShareDialog(false)}
          />

          {/* Dialog */}
          <div className="fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl z-[9999] w-[90%] max-w-sm p-4">
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
                  
                  // Haptic feedback for mobile devices
                  if ('vibrate' in navigator) {
                    navigator.vibrate(50); // Short vibration
                  }
                  
                  // Audio feedback (optional click sound)
                  try {
                    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwmgIBzRU5rPGRLYoNXgLp7OTRjZYk9k1GOzUQ3aX5MXjRTZHlXpLh9O2xWYlNnYGZ3ek5TMXJHWjNXnSd7UZQaYlcGgdA4YHFKZjJSSE8JRkFPYnSAclYNQFBpGQYMdcVs6T8LUjgmZNJLJlRVeIdUIjJnNgKGgXoJr1fmL8fKgPaXYS9GkGQVhAp5I4hCLZhJOKJCNUm5zGjKOpUJLi9cJTZdFzRKkmGfOGkHhTRqXNRzp7A/f7uYNnhtS1RZfVJ7Tk5HJHhhXYllZUljRko8MG5kJWZQRkZJp3m7s3ScdLc7fK0/t4HQZShCHKDcYgBUa0tPVVJuaVZNTVBrTUlQV0ljXFFnmGE7aBdqKnCJcK47dUZjUDNhTj0KUFJRVElLUU5JXGFKRjB0cURrPnE2Z29YT2JWRG15QnV7Skd8QnhqPnRrPnFRRGxORGF0Y2F1ZmFaY1R0W0lqU2JtU2NwV2x7YmNaXW1JY25PRm5YT2xOUWZNV1RKVGZOWIRMYYNJa39KYH1JZHpNZkNZSGNZH9dTz1d1VG9XZUdSQ1V5VHtXYVViVGR6UVdNVHBMS3dKVGJLUVdNVHBDUXNIV1NQVl1WV19sVltZXG1RT1FPV1hRU1ZSWG1RT1FJSF9YS2BPUklOXD8OfW1T0X5PK3xITHJPRXhIR2VOQ3RSTG9GYGpGW2FSZGhTWVNSVH1cUVNSaFJPXFZRVF9YVFlVXmZOUFFOVGZNVGFRUlVTVFNV'); 
                    audio.volume = 0.1;
                    audio.play().catch(() => {}); // Ignore errors if audio fails
                  } catch (audioError) {
                    // Ignore audio errors
                  }
                  
                  setLinkCopied(true);
                  
                  // Reset after 2 seconds
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
              {/* WhatsApp */}
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
              
              {/* Facebook */}
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
              
              {/* Instagram */}
              <a
                href={`https://www.instagram.com/`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-1 p-2 hover:bg-gray-50 rounded-lg transition-colors"
                onClick={() => {
                  // Instagram doesn't support direct URL sharing, copy to clipboard instead
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
              
              {/* Telegram */}
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
      

      {/* Unsave Confirmation Dialog */}
      {showUnsaveConfirm && (
        <>
          <div
            className="fixed inset-0 bg-black/50"
            style={{ zIndex: 999999 }}
            onClick={() => setShowUnsaveConfirm(false)}
          />
          <div
            className="fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl w-[90%] max-w-sm p-6"
            style={{ zIndex: 999999 }}
          >
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

    </article>
  );
}