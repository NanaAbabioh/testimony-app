'use client';

import { useState } from 'react';
import CleanPlayer from "@/components/CleanPlayer";
import Button from "@/components/ui/Button";

export default function AltarCallPage() {
  // Add custom CSS for animations
  const customStyles = `
    @keyframes fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    .animate-fade-in {
      animation: fade-in 0.5s ease-in-out;
    }
  `;
  const [amenAnimationStage, setAmenAnimationStage] = useState<'idle' | 'blackout' | 'curtain' | 'message' | 'complete'>('idle');

  // Direct clip data for the processed Altar Call video
  const altarCallClip = {
    title: "Altar Call - Prayer of Salvation",
    videoId: "IvDRxX9asvM",
    startSec: 6303, // 01:45:03
    endSec: 6430,   // 01:47:10
    processedClipUrl: "https://storage.googleapis.com/ah-testimony-library.firebasestorage.app/clips/IvDRxX9asvM/1759543638_6363-6430.mp4"
  };

  const handleAmen = () => {
    setAmenAnimationStage('blackout');

    // Play the crowd cheer sound
    const audio = new Audio('/crowd-cheer-in-school-auditorium-236699.mp3');
    audio.play().catch(console.error);

    // Start the animation sequence
    setTimeout(() => setAmenAnimationStage('curtain'), 94); // Blackout for 0.094s (reduced by half again)
    setTimeout(() => setAmenAnimationStage('message'), 2094); // Curtain opens at 2.094s (adjusted)

    // Return to normal after audio duration (estimate ~8-10 seconds total)
    audio.addEventListener('ended', () => {
      setTimeout(() => {
        setAmenAnimationStage('complete');
        setTimeout(() => setAmenAnimationStage('idle'), 2000); // Slower closing (2 seconds)
      }, 1000);
    });
  };

  const [showShareDialog, setShowShareDialog] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const shareUrl = typeof window !== "undefined" ? window.location.href : '';
  const displayTitle = 'Altar Call - Prayer of Salvation';

  const handleShare = () => {
    setShowShareDialog(true);
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />
      <main className="min-h-screen relative">
        {/* Fixed Background Layer */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url('/Ayaaaa-bg.svg')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        ></div>

        <div className="relative z-10 py-3 sm:py-6 px-2 sm:px-4 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-800 via-purple-900 to-indigo-900 rounded-lg p-4 sm:p-6 shadow-lg text-center">
          <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl leading-tight text-white font-bold mb-3">
            Altar Call - Prayer of Salvation
          </h1>
          <p className="text-purple-100 text-sm sm:text-base leading-relaxed">
            Are you ready to accept Jesus Christ as your Lord and Savior? Watch this prayer and follow along to make the most important decision of your life.
          </p>
        </div>

        {/* Video Player */}
        <div className="w-full">
          <CleanPlayer
            title={altarCallClip.title}
            videoId={altarCallClip.videoId}
            startSec={altarCallClip.startSec}
            endSec={altarCallClip.endSec}
            processedClipUrl={altarCallClip.processedClipUrl}
            hideControls={true}
          />
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-200">
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={handleAmen}
              className="bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 text-white touch-manipulation px-6 py-3 text-base font-medium"
            >
              🙏 Amen
            </Button>
            <Button
              onClick={handleShare}
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-50 touch-manipulation px-6 py-3 text-base font-medium flex items-center gap-2"
            >
              <img
                src="/icons/share-button-altar call.svg"
                alt="Share"
                className="w-4 h-4"
              />
              Share
            </Button>
          </div>
        </div>


        {/* Navigation */}
        <div className="flex justify-center">
          <Button
            onClick={() => window.location.href = '/'}
            variant="outline"
            size="sm"
            className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 touch-manipulation"
          >
            ← Back to Testimonies
          </Button>
        </div>
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
              <h3 className="text-lg font-semibold text-gray-900">Share Altar Call</h3>
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

      {/* Dramatic Amen Animation Overlay */}
      {amenAnimationStage !== 'idle' && (
        <div className="fixed inset-0 z-[100] overflow-hidden">
          {/* Blackout Stage */}
          {amenAnimationStage === 'blackout' && (
            <div className="absolute inset-0 bg-black animate-fade-in" />
          )}

          {/* Curtain Stage */}
          {(amenAnimationStage === 'curtain' || amenAnimationStage === 'message' || amenAnimationStage === 'complete') && (
            <div className="absolute inset-0 bg-white flex">
              {/* Left Curtain - Starts full width, slides left */}
              <div
                className={`bg-black transition-all duration-[2000ms] ease-in-out ${
                  amenAnimationStage === 'curtain' ? 'w-full' :
                  amenAnimationStage === 'message' ? 'w-1/2 -translate-x-full' : 'w-full'
                }`}
              />

              {/* Right Curtain - Starts full width, slides right */}
              <div
                className={`bg-black absolute top-0 right-0 h-full transition-all duration-[2000ms] ease-in-out ${
                  amenAnimationStage === 'curtain' ? 'w-full' :
                  amenAnimationStage === 'message' ? 'w-1/2 translate-x-full' : 'w-full'
                }`}
              />

              {/* Enhanced Background with SVG - Always present but revealed when curtains open */}
              <div
                className={`absolute inset-0 flex items-center justify-center transition-all duration-[2000ms] ease-in-out ${
                  amenAnimationStage === 'message' ? 'opacity-100' : 'opacity-0'
                }`}
                style={{
                  backgroundImage: "url('/altar-call-bg.svg')",
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat'
                }}
              >
                {/* Content Card with Glass Morphism - Mobile Optimized */}
                <div className={`content-card rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 md:p-12 lg:p-16 mx-4 sm:mx-6 md:mx-8 max-w-xs sm:max-w-2xl md:max-w-3xl lg:max-w-4xl text-center transform transition-all duration-1000 delay-500 ${
                  amenAnimationStage === 'message' ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-8 opacity-0 scale-95'
                }`}
                style={{
                  background: 'rgba(255, 255, 255, 0.25)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1) inset'
                }}>
                  {/* Main Heading - Deep Navy */}
                  <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight" style={{ color: '#1E293B' }}>
                    Welcome to the Family of God!
                  </h1>

                  {/* Subtitle - Warm Gold */}
                  <p className="text-2xl sm:text-3xl lg:text-4xl font-semibold mb-8 font-sans" style={{ color: '#B45309' }}>
                    Heaven rejoices over You!
                  </p>

                  {/* Body Text - Deep Navy */}
                  <div className="space-y-4 text-base sm:text-lg md:text-xl lg:text-2xl leading-relaxed font-sans" style={{ color: '#1E293B' }}>
                    <p className="leading-relaxed">
                      Please find a Bible believing Church and join.
                    </p>
                    <p className="leading-relaxed">
                      You could also join any Grace Mountain Ministries branch around you.
                    </p>

                    {/* Call to Action - Warm Gold */}
                    <p className="text-2xl sm:text-3xl lg:text-4xl font-bold mt-8" style={{ color: '#B45309' }}>
                      Welcome to the New You!!!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
        </div>
      </main>
    </>
  );
}