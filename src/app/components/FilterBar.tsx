"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface Category {
  id: string;
  name: string;
  description?: string;
  count?: number;
}

interface FilterBarProps {
  onFilterChange: (filters: {
    categoryId?: string;
    episode?: string;
  }) => void;
  className?: string;
  currentCategoryId?: string;
  currentCategoryName?: string;
  disableInitialCallback?: boolean;
}

export default function FilterBar({ onFilterChange, className = "", currentCategoryId, currentCategoryName, disableInitialCallback = false }: FilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State for filters
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedEpisode, setSelectedEpisode] = useState<string>("");
  const [availableEpisodes, setAvailableEpisodes] = useState<string[]>([]);
  const [loadingEpisodes, setLoadingEpisodes] = useState<boolean>(true);

  // Mobile filter panel state
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Prevent infinite loops with initialization flag
  const isInitialized = useRef(false);

  // Show this filter bar if a category is selected
  const shouldShowFilterBar = selectedCategory || currentCategoryId;

  // Initialize filters from URL params or props
  useEffect(() => {
    const categoryId = currentCategoryId || searchParams.get("categoryId") || "";
    const episode = searchParams.get("episode") || "";

    setSelectedCategory(categoryId);
    setSelectedEpisode(episode);

    // Only trigger initial filter change once, and only if not disabled
    if (!isInitialized.current && !disableInitialCallback) {
      isInitialized.current = true;
      onFilterChange({
        categoryId: categoryId || undefined,
        episode: episode || undefined,
      });
    } else if (!isInitialized.current) {
      isInitialized.current = true;
    }
  }, [searchParams, currentCategoryId]);

  // Load available episodes when category changes and clear episode selection
  useEffect(() => {
    // Clear episode selection when category changes (unless it's the initial load)
    if (isInitialized.current) {
      setSelectedEpisode("");
      // Update filters to clear episode when category changes
      onFilterChange({
        categoryId: selectedCategory || currentCategoryId || undefined,
        episode: undefined,
      });
    }
    loadAvailableEpisodes();
  }, [selectedCategory, currentCategoryId]);

  const loadAvailableEpisodes = async () => {
    try {
      console.log('Loading available episodes...');
      setLoadingEpisodes(true);

      // Get the active category ID
      const activeCategoryId = currentCategoryId || selectedCategory;

      // Build API URL with category filter if available
      let apiUrl = "/api/clips?limit=50";
      if (activeCategoryId) {
        apiUrl += `&categoryId=${encodeURIComponent(activeCategoryId)}`;
        console.log(`Loading episodes for category: ${activeCategoryId}`);
      } else {
        console.log('Loading episodes for all categories');
      }

      const response = await fetch(apiUrl);
      console.log('Episodes fetch response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Episodes API response structure:', {
          hasItems: !!data.items,
          itemsLength: data.items?.length,
          meta: data.meta,
          sampleKeys: data.items?.[0] ? Object.keys(data.items[0]) : []
        });

        if (data.items && Array.isArray(data.items)) {
          console.log('Sample clips data:', data.items.slice(0, 3).map(item => ({
            id: item.id,
            episode: item.episode,
            title: item.titleShort || item.title
          })));

          // Extract unique episodes and sort them properly
          const episodeSet = new Set<string>();
          data.items.forEach((item: any) => {
            if (item.episode && typeof item.episode === 'string' && item.episode.trim() !== "") {
              episodeSet.add(item.episode.trim());
            }
          });

          // Convert to array and sort properly
          const episodes = Array.from(episodeSet).sort((a: string, b: string) => {
            // Extract episode numbers for proper numeric sorting
            const aMatch = a.match(/(\d+)/);
            const bMatch = b.match(/(\d+)/);

            if (aMatch && bMatch) {
              const aNum = parseInt(aMatch[1], 10);
              const bNum = parseInt(bMatch[1], 10);
              return bNum - aNum; // Latest episodes first (descending order)
            }

            // Fallback to string comparison if no numbers found
            return b.localeCompare(a);
          });

          if (activeCategoryId) {
            console.log(`✅ Loaded ${episodes.length} unique episodes for category ${activeCategoryId}:`, episodes);
          } else {
            console.log(`✅ Loaded ${episodes.length} unique episodes:`, episodes);
          }
          setAvailableEpisodes(episodes);
        } else {
          console.log('❌ No items array in response:', data);
          setAvailableEpisodes([]);
        }
      } else {
        console.error('❌ Episodes fetch failed:', response.status, response.statusText);
        setAvailableEpisodes([]);
      }
    } catch (error) {
      console.error("❌ Error loading episodes:", error);
      setAvailableEpisodes([]);
    } finally {
      setLoadingEpisodes(false);
    }
  };

  const handleEpisodeChange = (episode: string) => {
    setSelectedEpisode(episode);
    updateFilters({ categoryId: selectedCategory, episode });
  };

  const updateFilters = (filters: { categoryId: string; episode: string }) => {
    // Update URL search params
    const params = new URLSearchParams(searchParams);

    if (filters.categoryId) {
      params.set("categoryId", filters.categoryId);
    } else {
      params.delete("categoryId");
    }

    if (filters.episode) {
      params.set("episode", filters.episode);
    } else {
      params.delete("episode");
    }

    // Update URL without refresh
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    router.replace(newUrl, { scroll: false });

    // Call the parent callback
    onFilterChange({
      categoryId: filters.categoryId || undefined,
      episode: filters.episode || undefined,
    });
  };

  const clearAllFilters = () => {
    setSelectedEpisode("");

    // Keep the categoryId since we're on a category page, only clear episode filter
    onFilterChange({
      categoryId: currentCategoryId || selectedCategory || undefined,
      episode: undefined,
    });

    // Remove episode from URL but keep categoryId
    const params = new URLSearchParams(window.location.search);
    params.delete("episode");
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    router.replace(newUrl, { scroll: false });
  };

  const hasActiveFilters = selectedEpisode;

  if (!shouldShowFilterBar) {
    return null;
  }

  return (
    <div className={`bg-white/95 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-20 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">

          {/* Left side - Category name and Episode filter */}
          <div className="flex items-center space-x-6">
            {/* Category Name */}
            <div className="flex items-center">
              <h2 className="text-lg font-semibold text-gray-900">
                {currentCategoryName || "All Categories"}
              </h2>
            </div>

            {/* Episode Filter */}
            <div className="hidden sm:flex items-center space-x-2">
              <label className="text-sm text-gray-600 font-medium">Episode:</label>
              <select
                value={selectedEpisode}
                onChange={(e) => handleEpisodeChange(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent min-w-[120px] text-gray-900 bg-white"
                disabled={loadingEpisodes}
              >
                <option value="">
                  {loadingEpisodes ? "Loading episodes..." : "All Episodes"}
                </option>
                {!loadingEpisodes && availableEpisodes.map((episode) => (
                  <option key={episode} value={episode}>
                    {episode.startsWith('Episode') || episode.startsWith('EP') ? episode : `Episode ${episode}`}
                  </option>
                ))}
              </select>
              {!loadingEpisodes && availableEpisodes.length === 0 && (
                <span className="text-xs text-red-500">(No episodes found)</span>
              )}
            </div>
          </div>

          {/* Right side - Clear filters */}
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-sm text-purple-600 hover:text-purple-800 font-medium"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Mobile Episode Filter */}
        <div className="sm:hidden pb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Episode Filter
          </label>
          <select
            value={selectedEpisode}
            onChange={(e) => handleEpisodeChange(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 bg-white"
          >
            <option value="">All Episodes</option>
            {availableEpisodes.map((episode) => (
              <option key={episode} value={episode}>
                {episode.startsWith('Episode') || episode.startsWith('EP') ? episode : `Episode ${episode}`}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}