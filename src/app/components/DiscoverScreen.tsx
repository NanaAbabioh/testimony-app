'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface DiscoverScreenProps {
  onCategorySelect: (categoryName: string) => void;
}

interface Category {
  id?: string;
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
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState<Stats>({ totalTestimonies: 0, totalCategories: 0, totalVideos: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to search results page
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
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
            id: dbCategory?.id || categoryName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
            name: categoryName,
            description: dbCategory?.description || `Testimonies about ${categoryName.toLowerCase()}`,
            count: dbCategory?.count || 0
          };
        });
        
        setCategories(allCategories);
        setStats(data.stats || { totalTestimonies: 0, totalCategories: 0, totalVideos: 0 });
        
        // Show database message if present (like "Database not initialized")
        if (data.message) {
          console.warn('Database message:', data.message);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        // Fallback to predefined categories with zero counts
        const fallbackCategories = predefinedCategories.map(categoryName => ({
          id: categoryName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#301934] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading testimonies...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white">
      {/* Section Header */}
      <div className="relative py-20 text-center overflow-hidden bg-[url('/crowd-gathering.jpg')] bg-cover bg-center bg-no-repeat">
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="relative max-w-4xl mx-auto px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-8 leading-tight drop-shadow-lg">
            Discover Testimonies
          </h2>
          <div className="text-xl md:text-2xl text-white leading-relaxed">
            <p className="italic mb-6 leading-loose drop-shadow-md">
              "Come and listen, all you who fear God,<br/>
              and I will tell you what he did for me."
            </p>
            <p className="text-lg text-gray-200 font-medium drop-shadow-md">
              — Psalms 66:16, NLT
            </p>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div className="bg-white py-12">
        <div className="max-w-4xl mx-auto px-8 text-center">
          <h3 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-8">
            What testimony are you believing God for?
          </h3>
          
          <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for healing, breakthrough, deliverance..."
                className="w-full py-4 px-6 pr-24 text-lg border-2 border-gray-300 rounded-full focus:border-[#301934] focus:outline-none focus:ring-2 focus:ring-[#301934]/20 transition-colors"
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
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-[#301934] text-white p-3 rounded-full hover:bg-[#301934]/90 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </form>
          
          <p className="text-gray-600 mt-4">
            Search across all testimonies to find inspiration for your situation
          </p>
        </div>
      </div>

      {/* Categories Grid */}
      <div id="categories-section" className="relative py-16 overflow-hidden bg-[url('/crowd-gathering.jpg')] bg-cover bg-center bg-no-repeat">
        <div className="relative max-w-7xl mx-auto px-8">
          {categories.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-8">📭</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6 leading-tight">No testimonies yet</h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                Process some videos first to see categories here!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {categories.map((category) => {
                return (
                  <button
                    key={category.id || category.name}
                    onClick={() => onCategorySelect(category.name)}
                    className="group relative bg-white rounded-xl border border-gray-200 hover:border-[#301934]/20 shadow-lg hover:shadow-xl transition-all duration-300 text-left overflow-hidden transform hover:-translate-y-1"
                  >
                    {/* Content */}
                    <div className="p-8">
                      {/* Count */}
                      <div className="flex items-center justify-end mb-6">
                        <span className="bg-[#301934]/10 text-[#301934] text-sm px-3 py-1 rounded-full font-bold">
                          {category.count}
                        </span>
                      </div>
                      
                      {/* Title */}
                      <h3 className="text-2xl font-bold text-gray-900 mb-6 leading-tight group-hover:text-[#301934] transition-colors">
                        {category.name}
                      </h3>
                      
                      {/* Explore Button */}
                      <div className="flex items-center text-[#301934] group-hover:text-[#301934]/80 transition-colors">
                        <span className="font-bold text-lg">EXPLORE TESTIMONIES</span>
                        <svg className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}