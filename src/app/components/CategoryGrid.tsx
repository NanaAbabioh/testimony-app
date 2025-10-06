'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface Category {
  id: string;
  name: string;
  description: string;
  count?: number;
  apiId?: string;
}

export default function CategoryGrid() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Default categories to ensure key ones are always present (7 categories matching backend)
  const defaultCategories: Category[] = [
    { id: "academic-educational-advancement", name: "Academic & Educational Advancement", description: "" },
    { id: "career-financial-breakthrough", name: "Career & Financial Breakthrough", description: "" },
    { id: "deliverance-freedom", name: "Deliverance & Freedom", description: "" },
    { id: "divine-intervention-protection", name: "Divine Intervention & Protection", description: "" },
    { id: "healing-divine-health", name: "Healing & Divine Health", description: "" },
    { id: "immigration-travel", name: "Immigration & Travel", description: "" },
    { id: "marriage-family-fruitfulness", name: "Marriage, Family & Fruitfulness", description: "" },
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch('/api/categories');
        let apiCategories: Category[] = [];
        
        if (response.ok) {
          const data = await response.json();
          apiCategories = data.categories || [];
          console.log('API Categories:', apiCategories);
        }

        // Use API categories if available, otherwise fall back to defaults
        const finalCategories = apiCategories.length > 0 ? apiCategories : defaultCategories.map(cat => ({ ...cat, count: 0 }));

        console.log('Final Categories:', finalCategories);
        setCategories(finalCategories);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        // Fallback to default categories with 0 counts
        setCategories(defaultCategories.map(cat => ({ ...cat, count: 0 })));
      } finally {
        setLoading(false);
      }
    }

    fetchCategories();
  }, []);

  const handleCategoryClick = (categoryId: string) => {
    console.log('Category clicked:', categoryId);
    // Navigate to category page
    router.push(`/category/${categoryId}`);
  };

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

  if (loading) {
    return (
      <section className="relative py-16 bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 overflow-hidden">
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              What testimony are you believing God for?
            </h2>
            <div className="max-w-2xl mx-auto mb-8">
              <div className="relative">
                <div className="w-full px-6 py-4 text-lg rounded-full border-2 border-white/20 bg-white/10 backdrop-blur-sm text-white placeholder-gray-300">
                  Loading categories...
                </div>
              </div>
            </div>
            <p className="text-gray-200 text-lg">
              Search across all testimonies to find inspiration for your situation
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="categories-section" ref={sectionRef} className="relative pt-3 pb-16 sm:pb-20 md:pb-24 overflow-hidden" style={{
        backgroundImage: `url('/hallelujah-bg.svg')`,
        backgroundColor: '#ffffff'
      }}>
      <div className="relative container mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-14 md:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-[#1a1a2e] via-[#0f3460] to-[#16213e] bg-clip-text text-transparent drop-shadow-lg mb-4 sm:mb-6 leading-tight py-2">
            What testimony are you believing God for?
          </h2>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-8 sm:mb-10 md:mb-12">
            <form onSubmit={handleSearch} className="relative">
              <div className="relative rounded-full p-0.5" style={{
                background: 'linear-gradient(135deg, #1a1a2e, #c0c0c0, #0f3460, #e5e5e5)'
              }}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Your keywords here....."
                  className="w-full px-4 sm:px-6 py-3 sm:py-4 pr-20 sm:pr-24 text-base sm:text-lg rounded-full bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:bg-white transition-all border-0"
                />
              </div>
              
              {searchQuery && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-12 sm:right-16 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors touch-manipulation"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              
              <button
                type="submit"
                disabled={!searchQuery.trim()}
                className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 disabled:cursor-not-allowed rounded-full p-1.5 sm:p-2 transition-colors touch-manipulation"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </form>
          </div>
          
        </div>

        {/* Category Cards Grid */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-6xl mx-auto ${isVisible ? 'animate-categories' : ''}`}>
          {categories.map((category, index) => {
            // Map category IDs to background images
            const getBackgroundImage = (categoryId: string) => {
              const imageMap: { [key: string]: string } = {
                'academic-educational-advancement': '/category-backgrounds/academic-bg.svg',
                'career-financial-breakthrough': '/category-backgrounds/career-bg.svg',
                'deliverance-freedom': '/category-backgrounds/deliverance-bg.svg',
                'divine-intervention-protection': '/category-backgrounds/divine-bg.svg',
                'healing-divine-health': '/category-backgrounds/healing-bg.svg',
                'immigration-travel': '/category-backgrounds/immigration-bg.svg',
                'marriage-family-fruitfulness': '/category-backgrounds/family-bg.svg',
              };
              return imageMap[categoryId] || '/category-backgrounds/healing-bg.svg'; // fallback
            };

            return (
              <div
                key={category.id}
                className={`category-card group relative rounded-2xl p-4 sm:p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 cursor-pointer overflow-hidden h-28 sm:h-32 flex flex-col justify-between touch-manipulation ${isVisible ? 'in-view' : ''}`}
                onClick={() => handleCategoryClick(category.id)}
                style={{
                  backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.6)), url('${getBackgroundImage(category.id)}')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat'
                }}
              >
                {/* Category Content */}
                <div className="flex-1 flex items-center justify-center">
                  <h3 className="text-lg sm:text-xl font-bold text-white group-hover:text-yellow-300 transition-colors drop-shadow-lg text-center leading-tight">
                    {category.name}
                  </h3>
                </div>

                {/* Hover Effect Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-yellow-200/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}