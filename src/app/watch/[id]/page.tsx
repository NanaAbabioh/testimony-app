'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import CleanPlayer from "@/components/CleanPlayer";
import ClipRow from "@/components/ClipRow";
import Button from "@/components/ui/button";
import VideoInteractionButtons from "@/components/VideoInteractionButtons";

async function getClip(id: string) {
  try {
    console.log('[Watch Page] Fetching clip with ID:', id);
    
    // Use API call since we're now a client component
    const res = await fetch(`/api/clips/${id}`);
    if (!res.ok) {
      console.error('[Watch Page] Failed to fetch clip:', res.status);
      return null;
    }
    
    const { clip } = await res.json();
    console.log('[Watch Page] Fetched clip:', clip);
    return clip;
  } catch (error) {
    console.error('[Watch Page] Error fetching clip:', error);
    return null;
  }
}

async function getRelated(categoryId: string, currentClipId: string) {
  try {
    // Use clips API to get related clips from same category
    const res = await fetch(`/api/clips?categoryId=${categoryId}&limit=6`);
    if (!res.ok) return [];
    
    const { items } = await res.json();
    
    // Filter out current clip and limit to 5
    const relatedClips = items
      .filter((clip: any) => clip.id !== currentClipId)
      .slice(0, 5);
    
    return relatedClips;
  } catch (error) {
    console.error('[Watch Page] Error fetching related clips:', error);
    return [];
  }
}

export default function WatchPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [clip, setClip] = useState<any>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clipId = params.id as string;
  const startParam = searchParams.get('start');
  
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        
        const clipData = await getClip(clipId);
        if (!clipData) {
          setError('Clip not found');
          return;
        }
        
        setClip(clipData);
        
        // Load related clips if we have a category
        if (clipData.categoryId) {
          const relatedClips = await getRelated(clipData.categoryId, clipId);
          setRelated(relatedClips);
        }
        
      } catch (err) {
        console.error('Error loading clip data:', err);
        setError('Failed to load clip');
      } finally {
        setLoading(false);
      }
    }
    
    if (clipId) {
      loadData();
    }
  }, [clipId]);
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-2 text-gray-700 font-medium">Loading testimony...</p>
        </div>
      </div>
    );
  }
  
  if (error || !clip) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-700 font-medium">Testimony not found.</p>
          <button 
            onClick={() => window.history.back()} 
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const startOverride = Number(startParam ?? NaN);
  const startSec = Number.isFinite(startOverride) ? Math.max(0, Math.floor(startOverride)) : clip.startSec;

  return (
    <main
      className="min-h-screen py-3 sm:py-6 px-2 sm:px-4 lg:px-8"
      style={{
        backgroundImage: `url('/Ayaaaa-bg.svg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundColor: '#f9fafb'
      }}
    >
      <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6">
        {/* Title + summary with banner background */}
        <div className="bg-gradient-to-r from-purple-800 to-purple-900 rounded-lg p-4 sm:p-6 shadow-lg">
          {clip.serviceDate ? <div className="text-xs text-purple-100 mb-2">{clip.serviceDate}</div> : null}
          <h1 className="font-serif text-xl sm:text-2xl lg:text-3xl leading-tight text-white font-bold mb-2">{clip.titleShort}</h1>
          {clip.summaryShort ? <p className="text-sm sm:text-base text-purple-50 leading-relaxed">{clip.summaryShort}</p> : null}
        </div>

        {/* Player - Full width on mobile */}
        <div className="w-full">
          <CleanPlayer
            title={clip.titleShort}
            videoId={clip.videoId}
            startSec={startSec}
            endSec={clip.endSec}
            processedClipUrl={clip.processedClipUrl}
          />
        </div>

        {/* Interaction Buttons - Mobile optimized */}
        <div className="bg-white rounded-lg p-3 sm:px-4 sm:py-3 shadow-sm border border-gray-200">
          <VideoInteractionButtons
            clip={{
              id: clip.id,
              videoId: clip.videoId,
              startSec: clip.startSec,
              endSec: clip.endSec,
              titleShort: clip.titleShort,
              summaryShort: clip.summaryShort,
              title: clip.title,
              fullText: clip.fullText,
              episode: clip.episode,
              serviceDate: clip.serviceDate,
              thumbUrl: clip.thumbUrl
            }}
          />
        </div>

        {/* Actions - Mobile friendly buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <Button
            onClick={() => window.history.back()}
            variant="outline"
            size="sm"
            className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 touch-manipulation"
          >
            ← Back
          </Button>
          <Button
            onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })}
            size="sm"
            className="bg-purple-600 text-white hover:bg-purple-700 touch-manipulation"
          >
            See related ↓
          </Button>
        </div>

        {/* Related - Mobile optimized */}
        {related.length > 0 && (
          <section className="space-y-3">
            <h2 className="font-serif text-lg sm:text-xl text-gray-900 font-bold px-1">More like this</h2>
            <div className="space-y-2 sm:space-y-3">
              {related.map((r) => <ClipRow key={r.id} clip={r} />)}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}