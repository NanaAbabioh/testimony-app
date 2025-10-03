'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import FilterBar from '../../components/FilterBar';
import ClipInfinite from '../../components/ClipInfinite';

export default function CategoryPage() {
  const params = useParams();
  const categoryId = params.id as string;
  
  const [filters, setFilters] = useState<{
    categoryId?: string;
    month?: string;
    year?: string;
    episode?: string;
    sort: "recent" | "mostSaved";
  }>({
    sort: "recent",
    categoryId: categoryId // Initialize with the categoryId from params
  });
  
  const filtersRef = useRef(filters);
  
  const [categoryName, setCategoryName] = useState<string>('');
  const [actualCategoryId, setActualCategoryId] = useState<string>('');
  const [isLoadingCategoryId, setIsLoadingCategoryId] = useState<boolean>(true);

  // Map category IDs to names for display (matching backend categories)
  const categoryMapping: { [key: string]: string } = {
    'academic-educational-advancement': 'Academic & Educational Advancement',
    'career-financial-breakthrough': 'Career & Financial Breakthrough',
    'deliverance-freedom': 'Deliverance & Freedom',
    'divine-intervention-protection': 'Divine Intervention & Protection',
    'healing-divine-health': 'Healing & Divine Health',
    'immigration-travel': 'Immigration & Travel',
    'marriage-family-fruitfulness': 'Marriage, Family & Fruitfulness',
  };

  // Map category IDs to background images
  const getCategoryBackgroundImage = (categoryId: string): string => {
    const backgroundMapping: { [key: string]: string } = {
      'academic-educational-advancement': '/category-backgrounds/academic-bg.svg',
      'career-financial-breakthrough': '/category-backgrounds/career-bg.svg',
      'deliverance-freedom': '/category-backgrounds/deliverance-bg.svg',
      'divine-intervention-protection': '/category-backgrounds/divine-bg.svg',
      'healing-divine-health': '/category-backgrounds/healing-bg.svg',
      'immigration-travel': '/category-backgrounds/immigration-bg.svg',
      'marriage-family-fruitfulness': '/category-backgrounds/family-bg.svg',
    };
    
    return backgroundMapping[categoryId] || '/hallelujah-bg.svg'; // fallback to default background
  };

  // Stable filter change handler to prevent infinite loops
  const handleFilterChange = useCallback((newFilters: {
    categoryId?: string;
    month?: string;
    year?: string;
    episode?: string;
    sort: "recent" | "mostSaved";
  }) => {
    // Only update if filters actually changed
    const currentFilters = filtersRef.current;
    const hasChanged =
      currentFilters.categoryId !== newFilters.categoryId ||
      currentFilters.month !== newFilters.month ||
      currentFilters.year !== newFilters.year ||
      currentFilters.episode !== newFilters.episode ||
      currentFilters.sort !== newFilters.sort;
    
    if (hasChanged) {
      const updatedFilters = { ...newFilters };
      setFilters(updatedFilters);
      filtersRef.current = updatedFilters;
    }
  }, []);

  useEffect(() => {
    console.log('Category page loaded with categoryId:', categoryId);
    
    // Check if categoryId is a clean ID or a database ID
    const isCleanId = categoryMapping[categoryId];
    console.log('Is clean ID?', isCleanId, 'Mapped name:', categoryMapping[categoryId]);
    
    if (isCleanId) {
      // If it's a clean ID, set name immediately
      setCategoryName(categoryMapping[categoryId]);
      setActualCategoryId(categoryId); // Use clean ID initially
      setIsLoadingCategoryId(false); // Allow clips to load immediately
    } else {
      // If it's a database ID, set it immediately and try to find the name
      setCategoryName('Loading...');
      setActualCategoryId(categoryId);
      setIsLoadingCategoryId(false); // Still allow clips to load immediately
    }
    
    // Fetch categories in background to verify and get database ID
    const verifyAndUpdateCategoryId = async () => {
      try {
        const response = await fetch('/api/categories');
        if (response.ok) {
          const data = await response.json();
          const categories = data.categories || [];
          
          if (isCleanId) {
            // If it's a clean ID, find the database category by name
            const categoryName = categoryMapping[categoryId];
            const foundCategory = categories.find((cat: any) => cat.name === categoryName);
            
            if (foundCategory && foundCategory.id !== categoryId) {
              // Only update if the database ID is different from clean ID
              setActualCategoryId(foundCategory.id);
              // Don't update filters here to prevent infinite loop - ClipInfinite handles clean IDs
            }
          } else {
            // If it's a database ID, find the category by ID and set the display name
            const foundCategory = categories.find((cat: any) => cat.id === categoryId);
            if (foundCategory) {
              setCategoryName(foundCategory.name);
            } else {
              // Ultimate fallback for display name
              setCategoryName(categoryId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));
            }
          }
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        // Keep using the original categoryId on error
        if (!isCleanId) {
          setCategoryName(categoryId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));
        }
      }
    };

    // Run verification in background without blocking UI
    verifyAndUpdateCategoryId();
  }, [categoryId]);

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Category Header with Background Image */}
      <section className="relative py-16 border-b border-gray-200 overflow-hidden" style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.7)), url('${getCategoryBackgroundImage(actualCategoryId)}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}>
        <div className="container mx-auto px-6 relative z-10">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-white/80 mb-6">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>→</span>
            <span className="text-white font-medium">{categoryName}</span>
          </div>
          
          {/* Category Title */}
          <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg">
            {categoryName} Testimonies
          </h1>
          <p className="text-white/90 text-lg mt-4 drop-shadow-md">
            Discover powerful testimonies of God's faithfulness
          </p>
        </div>
      </section>

      {/* Filter Bar */}
      <FilterBar 
        onFilterChange={handleFilterChange} 
        currentCategoryId={categoryId}
        currentCategoryName={categoryName}
        disableInitialCallback={true}
      />
      
      {/* Main Content with clips */}
      <main 
        className="min-h-[60vh] relative"
        style={{
          backgroundImage: `url('/Ayaaaa-bg.svg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundColor: '#f9fafb'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ClipInfinite params={filters} />
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="bg-gray-100 border-t border-gray-200 py-8">
        <div className="container mx-auto px-6 text-center">
          <p className="text-gray-600">&copy; 2025 Alpha Hour Testimony Library</p>
        </div>
      </footer>
    </div>
  );
}