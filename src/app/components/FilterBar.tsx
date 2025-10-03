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
    month?: string;
    year?: string;
    episode?: string;
    sort: "recent" | "mostSaved";
  }) => void;
  className?: string;
  currentCategoryId?: string;
  currentCategoryName?: string;
  disableInitialCallback?: boolean; // Disable initial onFilterChange call
}

// Predefined categories - these should match your database
const DEFAULT_CATEGORIES: Category[] = [
  { id: "healing", name: "Healing" },
  { id: "financial", name: "Financial Breakthrough" },
  { id: "family", name: "Family & Childbirth" },
  { id: "career", name: "Career/Business" },
  { id: "academic", name: "Academic Breakthrough" },
  { id: "deliverance", name: "Addiction & Deliverance" },
  { id: "multiple", name: "Multiple Testimonies" },
  { id: "others", name: "Others" },
];

export default function FilterBar({ onFilterChange, className = "", currentCategoryId, currentCategoryName, disableInitialCallback = false }: FilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State for filters
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedEpisode, setSelectedEpisode] = useState<string>("");
  const [selectedSort, setSelectedSort] = useState<"recent" | "mostSaved">("recent");
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [availableEpisodes, setAvailableEpisodes] = useState<string[]>([]);
  
  // Mobile filter panel state
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  
  // Prevent infinite loops with initialization flag
  const isInitialized = useRef(false);

  // Show this filter bar if a category is selected (either from URL params or props)
  const shouldShowFilterBar = selectedCategory || currentCategoryId;

  // Initialize filters from URL params or props
  useEffect(() => {
    const categoryId = currentCategoryId || searchParams.get("categoryId") || "";
    const month = searchParams.get("month") || "";
    const year = searchParams.get("year") || "";
    const episode = searchParams.get("episode") || "";
    const sort = (searchParams.get("sort") as "recent" | "mostSaved") || "recent";

    setSelectedCategory(categoryId);
    setSelectedMonth(month);
    setSelectedYear(year);
    setSelectedEpisode(episode);
    setSelectedSort(sort);

    // Only trigger initial filter change once, and only if not disabled
    if (!isInitialized.current && !disableInitialCallback) {
      isInitialized.current = true;
      onFilterChange({
        categoryId: categoryId || undefined,
        month: month || undefined,
        year: year || undefined,
        episode: episode || undefined,
        sort,
      });
    } else if (!isInitialized.current) {
      isInitialized.current = true; // Still mark as initialized even if callback is disabled
    }
  }, [searchParams, currentCategoryId]); // Remove onFilterChange from dependencies

  // Load categories from API
  useEffect(() => {
    loadCategories();
    loadAvailableEpisodes();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await fetch("/api/categories");
      if (response.ok) {
        const data = await response.json();
        if (data.categories && Array.isArray(data.categories)) {
          setCategories(data.categories);
        }
      }
    } catch (error) {
      console.error("Failed to load categories:", error);
      // Keep using default categories
    }
  };

  const loadAvailableEpisodes = async () => {
    try {
      // Fetch clips to get available episodes
      const response = await fetch("/api/clips?limit=50&sort=recent");
      if (response.ok) {
        const data = await response.json();
        if (data.items && Array.isArray(data.items)) {
          const episodes = [...new Set(data.items
            .map((item: any) => item.episode)
            .filter((episode: string) => episode)
            .map((episode: string) => episode.match(/\d+/)?.[0])
            .filter((episode: string) => episode)
          )].sort((a, b) => {
            // Ensure proper numeric sorting (latest episode first)
            const numA = parseInt(a, 10);
            const numB = parseInt(b, 10);
            return numB - numA; // Descending order
          });
          setAvailableEpisodes(episodes);
        }
      }
    } catch (error) {
      console.error("Failed to load available episodes:", error);
    }
  };

  // Handle filter changes
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    updateFilters({ categoryId, month: selectedMonth, year: selectedYear, episode: selectedEpisode, sort: selectedSort });
  };

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
    updateFilters({ categoryId: selectedCategory, month, year: selectedYear, episode: selectedEpisode, sort: selectedSort });
  };

  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    updateFilters({ categoryId: selectedCategory, month: selectedMonth, year, episode: selectedEpisode, sort: selectedSort });
  };

  const handleEpisodeChange = (episode: string) => {
    setSelectedEpisode(episode);
    updateFilters({ categoryId: selectedCategory, month: selectedMonth, year: selectedYear, episode, sort: selectedSort });
  };

  const handleSortChange = (sort: "recent" | "mostSaved") => {
    setSelectedSort(sort);
    updateFilters({ categoryId: selectedCategory, month: selectedMonth, year: selectedYear, episode: selectedEpisode, sort });
  };

  const updateFilters = (filters: { categoryId: string; month: string; year: string; episode: string; sort: "recent" | "mostSaved" }) => {
    // Update URL
    const params = new URLSearchParams(searchParams.toString());

    if (filters.categoryId) {
      params.set("categoryId", filters.categoryId);
    } else {
      params.delete("categoryId");
    }

    if (filters.month) {
      params.set("month", filters.month);
    } else {
      params.delete("month");
    }

    if (filters.year) {
      params.set("year", filters.year);
    } else {
      params.delete("year");
    }

    if (filters.episode) {
      params.set("episode", filters.episode);
    } else {
      params.delete("episode");
    }

    if (filters.sort !== "recent") {
      params.set("sort", filters.sort);
    } else {
      params.delete("sort");
    }

    router.replace(`?${params.toString()}`, { scroll: false });

    // Notify parent component
    onFilterChange({
      categoryId: filters.categoryId || undefined,
      month: filters.month || undefined,
      year: filters.year || undefined,
      episode: filters.episode || undefined,
      sort: filters.sort,
    });
  };

  const clearFilters = () => {
    setSelectedCategory("");
    setSelectedMonth("");
    setSelectedYear("");
    setSelectedEpisode("");
    setSelectedSort("recent");
    router.replace("?", { scroll: false });
    onFilterChange({ sort: "recent" });
  };

  // Generate month options (1-12)
  const getMonthOptions = () => {
    const months = [
      { value: "01", label: "January" },
      { value: "02", label: "February" },
      { value: "03", label: "March" },
      { value: "04", label: "April" },
      { value: "05", label: "May" },
      { value: "06", label: "June" },
      { value: "07", label: "July" },
      { value: "08", label: "August" },
      { value: "09", label: "September" },
      { value: "10", label: "October" },
      { value: "11", label: "November" },
      { value: "12", label: "December" },
    ];
    return months;
  };

  // Generate year options (2022 to current year)
  const getYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const options = [];
    
    for (let year = currentYear; year >= 2022; year--) {
      options.push({ value: year.toString(), label: year.toString() });
    }
    
    return options;
  };

  const monthOptions = getMonthOptions();
  const yearOptions = getYearOptions();
  const hasActiveFilters = selectedCategory || selectedMonth || selectedYear || selectedEpisode || selectedSort !== "recent";

  // Don't render if no category is selected
  if (!shouldShowFilterBar) {
    return null;
  }

  // Get current category name for display
  const currentCategory = categories.find(cat => cat.id === selectedCategory);
  const categoryDisplayName = currentCategoryName || currentCategory?.name || "Category";

  return (
    <>
      {/* Desktop Filter Bar */}
      <div className={`bg-white border-b border-gray-200 ${className}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="hidden md:flex items-center justify-between py-4">
            {/* Left side - Category name and Month filter */}
            <div className="flex items-center gap-4">
              {/* Back to Categories Button */}
              <button
                onClick={() => window.location.href = '/'}
                className="flex items-center gap-2 px-4 py-2 text-base font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors border border-purple-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                All Categories
              </button>

              {/* Current Category Display */}
              <div className="flex items-center gap-2">
                <span className="text-xl font-semibold text-gray-900">{categoryDisplayName}</span>
                <span className="text-base text-gray-500">Testimonies</span>
              </div>

              {/* Month and Year Filters (only for recent sort) */}
              {selectedSort === "recent" && (
                <div className="flex gap-3">
                  {/* Month Filter */}
                  <div className="relative">
                    <select
                      value={selectedMonth}
                      onChange={(e) => handleMonthChange(e.target.value)}
                      className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">All Months</option>
                      {monthOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <svg className="absolute right-2 top-3 h-4 w-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>

                  {/* Year Filter */}
                  <div className="relative">
                    <select
                      value={selectedYear}
                      onChange={(e) => handleYearChange(e.target.value)}
                      className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">All Years</option>
                      {yearOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <svg className="absolute right-2 top-3 h-4 w-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>

                  {/* Episode Filter */}
                  <div className="relative">
                    <select
                      value={selectedEpisode}
                      onChange={(e) => handleEpisodeChange(e.target.value)}
                      className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">All Episodes</option>
                      {availableEpisodes.map((episode) => (
                        <option key={episode} value={episode}>
                          Episode {episode}
                        </option>
                      ))}
                    </select>
                    <svg className="absolute right-2 top-3 h-4 w-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              )}

              {/* Clear Filters */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-base text-purple-600 hover:text-purple-800 font-medium"
                >
                  Clear Filters
                </button>
              )}
            </div>

            {/* Right side - Sort options */}
            <div className="flex items-center gap-3">
              <span className="text-base text-gray-600 font-medium">Sort by:</span>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => handleSortChange("recent")}
                  className={`px-4 py-2 text-base font-semibold rounded-md transition-colors ${
                    selectedSort === "recent"
                      ? "bg-white text-purple-600 shadow-sm border border-purple-200"
                      : "text-gray-700 hover:text-gray-900"
                  }`}
                >
                  Recent
                </button>
                <button
                  onClick={() => handleSortChange("mostSaved")}
                  className={`px-4 py-2 text-base font-semibold rounded-md transition-colors ${
                    selectedSort === "mostSaved"
                      ? "bg-white text-purple-600 shadow-sm border border-purple-200"
                      : "text-gray-700 hover:text-gray-900"
                  }`}
                >
                  Most Saved
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Filter Toggle */}
          <div className="md:hidden py-3">
            {/* Back to Categories Button */}
            <button
              onClick={() => window.location.href = '/'}
              className="flex items-center gap-2 mb-4 px-4 py-2 text-sm font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors border border-purple-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              All Categories
            </button>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl font-semibold text-gray-900">{categoryDisplayName}</span>
                <span className="text-base text-gray-500">Testimonies</span>
              </div>

              {/* Sort Toggle for Mobile */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => handleSortChange("recent")}
                  className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                    selectedSort === "recent"
                      ? "bg-white text-purple-600 shadow-sm border border-purple-200"
                      : "text-gray-700 hover:text-gray-900"
                  }`}
                >
                  Recent
                </button>
                <button
                  onClick={() => handleSortChange("mostSaved")}
                  className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                    selectedSort === "mostSaved"
                      ? "bg-white text-purple-600 shadow-sm border border-purple-200"
                      : "text-gray-700 hover:text-gray-900"
                  }`}
                >
                  Popular
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Month and Year Filters */}
          {selectedSort === "recent" && (
            <div className="md:hidden border-t border-gray-200 py-4 space-y-3">
              {/* Month Filter */}
              <div className="relative">
                <select
                  value={selectedMonth}
                  onChange={(e) => handleMonthChange(e.target.value)}
                  className="w-full appearance-none bg-white border border-gray-300 rounded-lg px-4 py-3 pr-10 text-base font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                >
                  <option value="" className="text-gray-700">All Months</option>
                  {monthOptions.map((option) => (
                    <option key={option.value} value={option.value} className="text-gray-900">
                      {option.label}
                    </option>
                  ))}
                </select>
                <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {/* Year Filter */}
              <div className="relative">
                <select
                  value={selectedYear}
                  onChange={(e) => handleYearChange(e.target.value)}
                  className="w-full appearance-none bg-white border border-gray-300 rounded-lg px-4 py-3 pr-10 text-base font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                >
                  <option value="" className="text-gray-700">All Years</option>
                  {yearOptions.map((option) => (
                    <option key={option.value} value={option.value} className="text-gray-900">
                      {option.label}
                    </option>
                  ))}
                </select>
                <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {/* Episode Filter */}
              <div className="relative">
                <select
                  value={selectedEpisode}
                  onChange={(e) => handleEpisodeChange(e.target.value)}
                  className="w-full appearance-none bg-white border border-gray-300 rounded-lg px-4 py-3 pr-10 text-base font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                >
                  <option value="" className="text-gray-700">All Episodes</option>
                  {availableEpisodes.map((episode) => (
                    <option key={episode} value={episode} className="text-gray-900">
                      Episode {episode}
                    </option>
                  ))}
                </select>
                <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              
              {/* Clear Filters */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="w-full px-4 py-3 text-base font-semibold text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors border border-purple-200"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}