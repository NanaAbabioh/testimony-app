"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import FilterSheet from "@/components/FilterSheet";
import ClipRow from "@/components/ClipRow";
import Skeleton from "@/components/ui/Skeleton";
import Button from "@/components/ui/Button";

type Clip = {
  id: string;
  title: string;
  titleShort: string;
  summaryShort?: string;
  serviceDate: string;
  savedCount: number;
  startSec: number;
  videoId: string;
  categoryLabel?: string;
  thumbUrl?: string;
};

type Category = { id: string; name: string };

function useQuery() {
  const sp = useSearchParams();
  return {
    q: sp.get("q") ?? "",
    category: sp.get("category") ?? "",
    from: sp.get("from") ?? "",
    to: sp.get("to") ?? "",
    sort: sp.get("sort") ?? "relevance",
  };
}

function SearchPageContent() {
  const { q, category, from, to, sort } = useQuery();

  const [loading, setLoading] = useState(true);
  const [clips, setClips] = useState<Clip[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [cats, setCats] = useState<Category[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // fetch categories once
  useEffect(() => {
    fetch("/api/categories")
      .then(r => r.json())
      .then((data) => {
        if (data.success) {
          setCats(data.categories || []);
        }
      })
      .catch(() => {});
  }, []);

  // fetch results when filters change
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (category) params.set("category", category);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (sort && sort !== "relevance") params.set("sort", sort);
    params.set("limit", "18");
    
    fetch(`/api/search?${params.toString()}`, { cache: "no-store" })
      .then(r => r.json())
      .then((res) => {
        if (res.success) {
          // Transform the API response to match ClipRow expected format (same as category pages)
          const transformedClips = (res.testimonies || res.items || []).map((item: any) => ({
            id: item.id,
            title: item.title,
            titleShort: item.titleShort || item.title || "",
            summaryShort: item.summaryShort,
            serviceDate: item.serviceDate || "",
            savedCount: item.savedCount || 0,
            startSec: item.startSec || item.startTime || item.startTimeSeconds || 0,
            endSec: item.endSec || item.endTime || item.endTimeSeconds || 0,
            videoId: item.videoId || item.sourceVideo?.id || item.sourceVideoId || "",
            categoryLabel: item.category || item.categoryLabel,
            thumbUrl: item.thumbUrl || item.thumbnail,
            episode: item.episode || item.sourceVideo?.episode || "", // Include episode for sorting
            fullText: item.fullText || "", // Include full text for consistency
            // Pass all original fields for full compatibility
            ...item
          }));
          setClips(transformedClips);
          setNextCursor(res.nextCursor || null);
          setSuggestions(res.suggestions || []);
        } else {
          setClips([]);
          setNextCursor(null);
          setSuggestions(res.suggestions || []);
        }
      })
      .catch(() => {
        setClips([]);
        setNextCursor(null);
        setSuggestions([]);
      })
      .finally(() => setLoading(false));
  }, [q, category, from, to, sort]);

  function loadMore() {
    if (!nextCursor || loadingMore) return;
    
    setLoadingMore(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (category) params.set("category", category);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (sort && sort !== "relevance") params.set("sort", sort);
    params.set("limit", "18");
    params.set("cursor", nextCursor);
    
    fetch(`/api/search?${params.toString()}`, { cache: "no-store" })
      .then(r => r.json())
      .then((res) => {
        if (res.success) {
          const transformedClips = (res.testimonies || res.items || []).map((item: any) => ({
            id: item.id,
            title: item.title,
            titleShort: item.titleShort || item.title || "",
            summaryShort: item.summaryShort,
            serviceDate: item.serviceDate || "",
            savedCount: item.savedCount || 0,
            startSec: item.startSec || item.startTime || item.startTimeSeconds || 0,
            endSec: item.endSec || item.endTime || item.endTimeSeconds || 0,
            videoId: item.videoId || item.sourceVideo?.id || item.sourceVideoId || "",
            categoryLabel: item.category || item.categoryLabel,
            thumbUrl: item.thumbUrl || item.thumbnail,
            episode: item.episode || item.sourceVideo?.episode || "", // Include episode for sorting
            fullText: item.fullText || "", // Include full text for consistency
            // Pass all original fields for full compatibility
            ...item
          }));
          setClips(prev => [...prev, ...transformedClips]);
          setNextCursor(res.nextCursor || null);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingMore(false));
  }

  const hasFilters = q || category || from || to || sort !== "relevance";
  const resultCount = clips.length;

  return (
    <div className="min-h-screen relative">
      {/* Fixed Background Layer */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: `url('/Ayaaaa-bg.svg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      ></div>

      {/* Search Header */}
      <section className="relative z-10 bg-gray-50 py-6 sm:py-8 border-b border-gray-200">
        <div className="container mx-auto px-4 sm:px-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm sm:text-base text-gray-700 mb-3 sm:mb-4">
            <a href="/" className="hover:text-purple-600 transition-colors touch-manipulation font-medium">Home</a>
            <span className="text-gray-400">→</span>
            <span className="text-gray-900 font-semibold">Search</span>
          </div>

          {/* Page Title */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
            {q ? `Search Results for "${q}"` : 'Search Testimonies'}
          </h1>
        </div>
      </section>

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
      {/* Sticky Toolbar */}
      <div className="sticky top-0 z-30 bg-gray-50 backdrop-blur-md border-b border-gray-200 -mx-4 sm:-mx-6 px-4 sm:px-6">
        <div className="py-2 sm:py-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <FilterSheet categories={cats} />

          {/* Quick Search Input */}
          <input
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 sm:py-2 bg-white text-gray-900 text-sm sm:text-base transition-colors focus:outline-none focus:ring-2 focus:ring-[#301934]/20 focus:border-[#301934] placeholder-gray-500"
            placeholder="Search testimonies…"
            defaultValue={q}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const v = (e.target as HTMLInputElement).value;
                const p = new URLSearchParams(window.location.search);
                if (v) p.set("q", v); else p.delete("q");
                window.location.href = `/search?${p.toString()}`;
              }
            }}
          />

          {/* Quick Sort */}
          <select
            className="w-full sm:w-auto border border-gray-300 rounded-lg px-3 py-2.5 sm:py-2 bg-white text-gray-900 text-sm sm:text-base transition-colors focus:outline-none focus:ring-2 focus:ring-[#301934]/20 focus:border-[#301934]"
            defaultValue={sort}
            onChange={(e) => {
              const p = new URLSearchParams(window.location.search);
              if (e.target.value === "relevance") {
                p.delete("sort");
              } else {
                p.set("sort", e.target.value);
              }
              window.location.href = `/search?${p.toString()}`;
            }}
          >
            <option value="relevance">Relevance</option>
            <option value="newest">Newest</option>
            <option value="most-saved">Most saved</option>
          </select>
        </div>
      </div>

      {/* Results Section */}
      <div className="py-4 sm:py-6 md:py-8">
        {/* Results Header */}
        {(hasFilters || loading) && (
          <div className="mb-4 sm:mb-6">
            {loading ? (
              <div className="h-5 sm:h-6 bg-black/5 dark:bg-white/10 rounded animate-pulse w-32 sm:w-48"></div>
            ) : (
              <div className="text-xs sm:text-sm text-[hsl(var(--ink))]/70">
                {resultCount === 0 ? "No results found" :
                 resultCount === 1 ? "1 result" :
                 `${resultCount} results`}
                {hasFilters && " with current filters"}
              </div>
            )}
          </div>
        )}

{loading ? (
  <div className="space-y-3">
    {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-[var(--radius-card)]" />)}
  </div>
) : clips.length === 0 ? (
  <div className="text-center py-12">
    <div className="mb-8">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">No testimonies found</h3>
      <p className="text-gray-600 mb-6">
        {q ? `We couldn't find any testimonies matching "${q}"` : 'Try searching for something specific'}
      </p>
    </div>
    
    {suggestions.length > 0 && (
      <div className="max-w-md mx-auto">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Try searching for:</h4>
        <div className="flex flex-wrap gap-2 justify-center">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => {
                const params = new URLSearchParams(window.location.search);
                params.set('q', suggestion);
                window.location.href = `/search?${params.toString()}`;
              }}
              className="px-4 py-2 bg-[#301934] text-white rounded-full hover:bg-[#301934]/90 transition-colors text-sm font-medium"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    )}
    
    <div className="mt-8">
      <a
        href="/"
        className="text-[#301934] hover:text-[#301934]/80 font-medium inline-flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
        </svg>
        Browse categories instead
      </a>
    </div>
  </div>
) : (
  <>
    <div className="space-y-3">
      {clips.map((c:any) => <ClipRow key={c.id} clip={c} />)}
    </div>
    {nextCursor && (
      <div className="flex justify-center mt-6">
        <Button onClick={loadMore} variant="outline">Load more</Button>
      </div>
    )}
  </>
)}
      </div>
      
      {/* Footer */}
      <footer className="bg-gray-100 border-t border-gray-200 py-6 sm:py-8 mt-12 sm:mt-16">
        <div className="container mx-auto px-4 sm:px-6 text-center">
          <p className="text-sm sm:text-base text-gray-600">&copy; 2025 Alpha Hour Testimony Library</p>
        </div>
      </footer>
    </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div>Loading search...</div>}>
      <SearchPageContent />
    </Suspense>
  );
}