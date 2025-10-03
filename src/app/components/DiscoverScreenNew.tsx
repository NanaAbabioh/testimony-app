'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ClipInfinite from './ClipInfinite';
import FilterBar from './FilterBar';

interface DiscoverScreenProps {
  onCategorySelect?: (categoryName: string) => void;
}

interface Category {
  id: string;
  name: string;
  description: string;
  count: number;
}

interface Stats {
  totalTestimonies: number;
  totalCategories: number;
  totalVideos: number;
}

// Predefined categories in alphabetical order
const predefinedCategories = [
  'Academic Breakthrough',
  'Addiction and Deliverance', 
  'Career/Business',
  'Family and Childbirth',
  'Financial Breakthrough',
  'Healing',
  'Multiple Testimonies',
  'Others'
];

export default function DiscoverScreen({ onCategorySelect }: DiscoverScreenProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState<Stats>({ totalTestimonies: 0, totalCategories: 0, totalVideos: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<'categories' | 'clips'>('categories');
  const [filters, setFilters] = useState<{
    categoryId?: string;
    month?: string;
    sort: "recent" | "mostSaved";
  }>({
    sort: "recent"
  });

  // Initialize from URL parameters
  useEffect(() => {
    const categoryId = searchParams.get("categoryId");
    const month = searchParams.get("month");
    const sort = (searchParams.get("sort") as "recent" | "mostSaved") || "recent";
    
    if (categoryId || month || sort !== "recent") {
      setFilters({ categoryId: categoryId || undefined, month: month || undefined, sort });
      setView('clips');
    } else {
      setView('categories');
    }
  }, [searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const handleCategoryClick = (category: Category) => {
    if (onCategorySelect) {
      onCategorySelect(category.name);
    } else {
      // Update URL and show clips for this category
      const params = new URLSearchParams();
      params.set('categoryId', category.id);
      router.push(`?${params.toString()}`, { scroll: false });
      setFilters({ categoryId: category.id, sort: "recent" });
      setView('clips');
    }
  };

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
    setView('clips');
  };

  const handleBackToCategories = () => {
    router.replace('/', { scroll: false });
    setFilters({ sort: "recent" });
    setView('categories');
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        const data = await response.json();
        
        // Create a map of database categories for quick lookup
        const dbCategoriesMap = new Map();
        if (data.success && data.categories) {
          data.categories.forEach((cat: Category) => {
            dbCategoriesMap.set(cat.name, cat);
          });
        }
        
        // Create categories array with all predefined categories
        const allCategories = predefinedCategories.map(categoryName => {
          const dbCategory = dbCategoriesMap.get(categoryName);
          return {
            id: dbCategory?.id || categoryName.toLowerCase().replace(/[^a-z0-9]/g, ''),
            name: categoryName,
            description: dbCategory?.description || `Testimonies about ${categoryName.toLowerCase()}`,
            count: dbCategory?.count || 0
          };
        });
        
        setCategories(allCategories);
        setStats(data.stats || { totalTestimonies: 0, totalCategories: 0, totalVideos: 0 });
        
      } catch (error) {
        console.error('Error fetching categories:', error);
        // Fallback to predefined categories with zero counts
        const fallbackCategories = predefinedCategories.map(categoryName => ({
          id: categoryName.toLowerCase().replace(/[^a-z0-9]/g, ''),
          name: categoryName,
          description: `Testimonies about ${categoryName.toLowerCase()}`,
          count: 0
        }));
        setCategories(fallbackCategories);
        setStats({ totalTestimonies: 0, totalCategories: 0, totalVideos: 0 });
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (view === 'clips') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Back to categories button */}
                <button
                  onClick={handleBackToCategories}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="hidden sm:inline">Categories</span>
                </button>
                
                {/* Title */}
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {filters.categoryId 
                      ? `${categories.find(c => c.id === filters.categoryId)?.name || 'Category'} Testimonies`
                      : 'All Testimonies'
                    }
                  </h1>
                  <p className="text-gray-600 text-sm mt-1">
                    Discover inspiring stories of God's goodness
                  </p>
                </div>
              </div>

              {/* Search bar - Desktop */}
              <form onSubmit={handleSearch} className="hidden md:block">
                <div className="relative max-w-md">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search testimonies..."
                    className="w-full py-2 px-4 pr-10 text-sm border border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                  
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={clearSearch}
                      className="absolute right-8 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                  
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </div>
              </form>
            </div>

            {/* Mobile search bar */}
            <form onSubmit={handleSearch} className="md:hidden mt-4">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search testimonies..."
                  className="w-full py-3 px-4 pr-12 border border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
                
                {searchQuery && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="absolute right-10 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
                
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Filter Bar */}
        <FilterBar onFilterChange={handleFilterChange} />

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ClipInfinite params={filters} />
        </div>
      </div>
    );
  }

  // Categories view
  return (
    <div id="categories-section">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Browse by Category</h2>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          Explore testimonies organized by the areas where God has moved powerfully in people's lives
        </p>
      </div>

      {/* Search Bar */}
      <div className="max-w-2xl mx-auto mb-12">
        <form onSubmit={handleSearch} className="relative">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search all testimonies..."
              className="w-full py-4 px-6 pr-20 text-lg border border-gray-300 rounded-full focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-600/20 transition-colors bg-white shadow-sm"
            />
            
            {searchQuery && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-16 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            
            <button
              type="submit"
              disabled={!searchQuery.trim()}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-purple-600 text-white p-3 rounded-full hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </form>
      </div>

      {/* Stats */}
      {!loading && stats.totalTestimonies > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="text-center p-6 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="text-3xl font-bold text-purple-600 mb-2">{stats.totalTestimonies}</div>
            <div className="text-gray-600">Total Testimonies</div>
          </div>
          <div className="text-center p-6 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="text-3xl font-bold text-purple-600 mb-2">{stats.totalCategories}</div>
            <div className="text-gray-600">Categories</div>
          </div>
          <div className="text-center p-6 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="text-3xl font-bold text-purple-600 mb-2">{stats.totalVideos}</div>
            <div className="text-gray-600">Source Videos</div>
          </div>
        </div>
      )}

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? (
          // Loading skeletons
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="h-6 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-3 w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))
        ) : (
          categories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryClick(category)}
              className="group text-left bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-purple-200 transition-all duration-200 transform hover:-translate-y-1"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="font-bold text-lg text-gray-900 group-hover:text-purple-600 transition-colors">
                  {category.name}
                </h3>
                <span className="bg-purple-100 text-purple-600 px-2 py-1 rounded-full text-sm font-medium">
                  {category.count}
                </span>
              </div>
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {category.description}
              </p>
              <div className="flex items-center text-purple-600 text-sm font-medium">
                Browse testimonies
                <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}