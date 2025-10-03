'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthContext } from '@/components/providers/AuthProvider';

interface Category {
  id: string;
  name: string;
  description: string;
  count?: number;
  apiId?: string;
}

export default function HamburgerMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesExpanded, setCategoriesExpanded] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { startMagicLinkFlow } = useAuthContext();

  // Default categories to ensure key ones are always present
  const defaultCategories: Category[] = [
    { id: "academic-educational-advancement", name: "Academic & Educational Advancement", description: "" },
    { id: "career-financial-breakthrough", name: "Career & Financial Breakthrough", description: "" },
    { id: "deliverance-freedom", name: "Deliverance & Freedom", description: "" },
    { id: "divine-intervention-protection", name: "Divine Intervention & Protection", description: "" },
    { id: "healing-divine-health", name: "Healing & Divine Health", description: "" },
    { id: "immigration-travel", name: "Immigration & Travel", description: "" },
    { id: "marriage-family-fruitfulness", name: "Marriage, Family & Fruitfulness", description: "" },
  ];

  // Fetch categories from API
  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch('/api/categories');
        let apiCategories: Category[] = [];
        
        if (response.ok) {
          const data = await response.json();
          apiCategories = data.categories || [];
        }

        // Use API categories if available, otherwise fall back to defaults
        const finalCategories = apiCategories.length > 0 ? apiCategories : defaultCategories.map(cat => ({ ...cat, count: 0 }));
        setCategories(finalCategories);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        setCategories(defaultCategories.map(cat => ({ ...cat, count: 0 })));
      }
    }

    fetchCategories();
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setCategoriesExpanded(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false);
    setCategoriesExpanded(false);
  }, [pathname]);

  const handleSaveSync = async () => {
    const email = prompt("Enter your email address to save and sync across devices:");
    
    if (email && email.trim()) {
      try {
        await startMagicLinkFlow(email.trim());
        alert("Check your email for a magic link to complete the sync setup!");
      } catch (error) {
        console.error('Error starting magic link flow:', error);
        alert("There was an error. Please try again.");
      }
    }
    
    setIsOpen(false);
  };

  return (
    <div ref={menuRef} className="relative z-50">
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Menu"
      >
        <svg
          className="w-6 h-6 text-gray-700"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          {isOpen ? (
            <path d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Menu Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden">
          <nav className="py-2">
            {/* Home */}
            <Link
              href="/"
              className="block px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span className="text-gray-800 font-medium">Home</span>
              </div>
            </Link>

            {/* Explore Testimonies */}
            <div>
              <button
                onClick={() => setCategoriesExpanded(!categoriesExpanded)}
                className="w-full px-4 py-3 hover:bg-gray-50 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  <span className="text-gray-800 font-medium">Explore Testimonies</span>
                </div>
                <svg
                  className={`w-4 h-4 text-gray-500 transition-transform ${
                    categoriesExpanded ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Categories Submenu */}
              {categoriesExpanded && (
                <div className="bg-gray-50 border-t border-gray-100">
                  {categories.map((category) => (
                    <Link
                      key={category.id}
                      href={`/category/${category.id}`}
                      className="block px-8 py-2.5 hover:bg-gray-100 transition-colors"
                    >
                      <span className="text-gray-700 text-sm">{category.name}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* My Testimony Wall */}
            <Link
              href="/my-testimony-wall"
              className="block px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span className="text-gray-800 font-medium">My Testimony Wall</span>
              </div>
            </Link>

            {/* Divider */}
            <div className="h-px bg-gray-200 my-2"></div>

            {/* Save & Sync */}
            <button
              onClick={handleSaveSync}
              className="w-full px-4 py-3 hover:bg-gray-50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="text-gray-800 font-medium">Save & Sync Across Devices</span>
              </div>
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}