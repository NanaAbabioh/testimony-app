"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import Link from "next/link";
import ClipRow from "@/components/ClipRow";
import SaveButton from "./SaveButton";

type Params = {
  categoryId?: string;
  month?: string;
  episode?: string;
  sort: "recent" | "mostSaved";
};

type Clip = {
  id: string;
  title: string;
  titleShort?: string;
  summaryShort?: string;
  startSec: number;
  endSec: number;
  categoryId: string;
  serviceDate: string;
  savedCount: number;
  videoId: string;
  thumbUrl?: string;
  status: "live";
  createdAt?: string;
  episode?: string; // Episode number from CSV
  fullText?: string; // Brief description from CSV
};

interface ClipsResponse {
  items: Clip[];
  nextCursor?: string;
  meta: {
    count: number;
    hasMore: boolean;
    queryTimeMs: number;
  };
}

function keyOf(p: Params): string {
  return JSON.stringify(p);
}

export default function ClipInfinite({ params }: { params: Params }) {
  const [items, setItems] = useState<Clip[]>([]);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [categoryVerified, setCategoryVerified] = useState<boolean>(false);
  const [categoryExists, setCategoryExists] = useState<boolean>(true);
  
  // Cache for different filter combinations
  const cacheRef = useRef(new Map<string, { items: Clip[]; cursor?: string; hasMore: boolean }>());
  const k = useMemo(() => keyOf(params), [params]);

  // Build API URL with parameters
  const buildApiUrl = useCallback((useCursor: boolean = false): string => {
    const base = new URL("/api/clips", window.location.origin);

    if (params.categoryId) {
      base.searchParams.set("categoryId", params.categoryId);
    }
    if (params.month && params.sort !== "mostSaved") {
      base.searchParams.set("month", params.month);
    }
    if (params.episode) {
      base.searchParams.set("episode", params.episode);
    }

    base.searchParams.set("sort", params.sort);
    base.searchParams.set("limit", "20");

    if (useCursor && cursor) {
      base.searchParams.set("cursor", cursor);
    }

    return base.toString();
  }, [params, cursor]);

  // Verify category exists before loading clips
  const verifyCategory = useCallback(async () => {
    if (!params.categoryId || categoryVerified) return;

    try {
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        const categories = data.categories || [];
        
        // Check if category exists (by ID or by name)
        const categoryExists = categories.some((cat: any) => 
          cat.id === params.categoryId || cat.name === params.categoryId
        );
        
        setCategoryExists(categoryExists);
      }
    } catch (error) {
      console.error('[ClipInfinite] Category verification error:', error);
      // Assume category exists on error to avoid blocking
      setCategoryExists(true);
    } finally {
      setCategoryVerified(true);
    }
  }, [params.categoryId, categoryVerified]);

  // Load clips from API
  const load = useCallback(async (reset = false) => {
    if (loading || (!reset && !hasMore)) return;
    
    // Don't load clips if category doesn't exist
    if (params.categoryId && (!categoryVerified || !categoryExists)) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const url = buildApiUrl(!reset);
      const res = await fetch(url);
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `HTTP ${res.status}`);
      }

      const json: ClipsResponse = await res.json();
      
      // Deduplicate items to prevent duplicate keys
      const deduplicateItems = (items: Clip[]) => {
        const seen = new Set<string>();
        return items.filter(item => {
          if (seen.has(item.id)) {
            console.warn('[ClipInfinite] Duplicate item filtered:', item.id);
            return false;
          }
          seen.add(item.id);
          return true;
        });
      };

      if (reset) {
        const deduplicatedItems = deduplicateItems(json.items || []);
        setItems(deduplicatedItems);
        setCursor(json.nextCursor);
        setHasMore(!!json.nextCursor);
        
        // Update cache
        cacheRef.current.set(k, { 
          items: deduplicatedItems, 
          cursor: json.nextCursor,
          hasMore: !!json.nextCursor
        });
      } else {
        // Use functional update to avoid stale closure
        setItems((prevItems) => {
          const merged = [...prevItems, ...(json.items || [])];
          const deduplicatedMerged = deduplicateItems(merged);
          // Update cache with merged items
          cacheRef.current.set(k, { 
            items: deduplicatedMerged, 
            cursor: json.nextCursor,
            hasMore: !!json.nextCursor
          });
          return deduplicatedMerged;
        });
        setCursor(json.nextCursor);
        setHasMore(!!json.nextCursor);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load clips';
      console.error('[ClipInfinite] Load error:', err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [buildApiUrl, loading, hasMore, k, params.categoryId, categoryVerified, categoryExists]);

  // Verify category when params change
  useEffect(() => {
    setCategoryVerified(false);
    setCategoryExists(true); // Optimistically assume it exists
    
    if (params.categoryId) {
      verifyCategory();
    } else {
      setCategoryVerified(true); // No category to verify
    }
  }, [params.categoryId]); // Remove verifyCategory from dependencies to avoid infinite loop

  // Handle filter changes - restore from cache or fetch fresh
  useEffect(() => {
    const cached = cacheRef.current.get(k);
    
    if (cached && cached.items.length > 0) {
      // Restore from cache with deduplication safety check
      const deduplicateItems = (items: Clip[]) => {
        const seen = new Set<string>();
        return items.filter(item => {
          if (seen.has(item.id)) {
            console.warn('[ClipInfinite] Duplicate item in cache filtered:', item.id);
            return false;
          }
          seen.add(item.id);
          return true;
        });
      };
      
      const deduplicatedCachedItems = deduplicateItems(cached.items);
      setItems(deduplicatedCachedItems);
      setCursor(cached.cursor);
      setHasMore(cached.hasMore);
      setError(null);
    } else {
      // Fresh load - wait for category verification if needed
      setItems([]);
      setCursor(undefined);
      setHasMore(true);
      setError(null);
      
      // If no category or category is verified, load immediately
      if (!params.categoryId || categoryVerified) {
        load(true);
      }
    }
  }, [k, categoryVerified]); // Depend on categoryVerified to trigger load after verification

  // IntersectionObserver for infinite scroll
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry && entry.isIntersecting && !loading && hasMore && cursor) {
          load(false);
        }
      },
      { 
        rootMargin: "200px", // Trigger 200px before the element comes into view
        threshold: 0.1
      }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [cursor, loading, hasMore, load]);


  // Show category not found state
  if (categoryVerified && !categoryExists && params.categoryId) {
    return (
      <div className="mt-8 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-full mb-4">
          <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Category not found</h3>
        <p className="text-gray-600 mb-4">The requested category does not exist or has been removed.</p>
        <a
          href="/"
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors inline-block"
        >
          Browse Categories
        </a>
      </div>
    );
  }

  // Show error state
  if (error && items.length === 0) {
    return (
      <div className="mt-8 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mb-4">
          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to load clips</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={() => load(true)}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Show loading state while verifying category
  if (!categoryVerified && params.categoryId) {
    return (
      <div className="mt-8 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-4">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-600 border-t-transparent"></div>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Loading testimonies...</h3>
        <p className="text-gray-600">Verifying category and fetching content</p>
      </div>
    );
  }

  // Show empty state
  if (!loading && items.length === 0 && !error) {
    return (
      <div className="mt-8 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-4">
          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No testimonies found</h3>
        <p className="text-gray-600">
          {params.categoryId || params.month || params.episode
            ? 'Try adjusting your filters to see more results.'
            : 'Check back later for new testimonies.'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      {/* Clips List */}
      <div className="space-y-3">
        {items.map((clip) => {
          // Debug log the first clip to see what data we have
          if (items.indexOf(clip) === 0) {
            console.log('[ClipInfinite] First clip data:', clip);
          }
          
          return (
            <ClipRow key={clip.id} clip={{
              id: clip.id,
              videoId: clip.videoId || (clip as any).sourceVideoId || '',
              startSec: clip.startSec,
              titleShort: clip.titleShort || clip.title || "",
              summaryShort: clip.summaryShort,
              thumbUrl: clip.thumbUrl,
              serviceDate: clip.serviceDate,
              savedCount: clip.savedCount,
              episode: (clip as any).episode || clip.episode,
              title: clip.title, // AI-generated title
              fullText: (clip as any).fullText || clip.fullText, // Brief description from CSV
              ...clip // Pass all fields through
            }} />
          );
        })}
      </div>

      {/* Loading Sentinel & Status */}
      <div 
        ref={sentinelRef} 
        className="h-16 flex items-center justify-center mt-8"
      >
        {loading ? (
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-purple-600 border-t-transparent"></div>
            <span className="text-sm text-gray-600">Loading more testimonies...</span>
          </div>
        ) : hasMore ? (
          <span className="text-sm text-gray-400">Scroll for more testimonies</span>
        ) : items.length > 0 ? (
          <span className="text-sm text-gray-400">
            You've reached the end • {items.length} testimonies loaded
          </span>
        ) : null}
      </div>

      {/* Error Banner */}
      {error && items.length > 0 && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-red-700">{error}</span>
            <button
              onClick={() => load(false)}
              className="text-sm text-red-600 hover:text-red-800 underline"
            >
              Try Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}