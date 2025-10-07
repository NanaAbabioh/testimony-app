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
  const [shareTestimonyExpanded, setShareTestimonyExpanded] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const authContext = useAuthContext();
  console.log('Auth context in HamburgerMenu:', authContext);
  const { sendSignInLink } = authContext || {};

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
        setShareTestimonyExpanded(false);
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
    setShareTestimonyExpanded(false);
  }, [pathname]);

  const handleSaveSync = async () => {
    const email = prompt("Enter your email address to save and sync across devices:");

    if (email && email.trim()) {
      try {
        if (!sendSignInLink) {
          console.error('sendSignInLink function not available');
          alert("System Unavailable\n\nThe account setup service is currently unavailable. Please refresh the page and try again.");
          return;
        }

        // Store email for post-authentication sync
        localStorage.setItem('pendingSync', 'true');
        localStorage.setItem('syncEmail', email.trim());

        const result = await sendSignInLink(email.trim());
        if (result.success) {
          alert("Account Setup - Email Sent\n\n" + result.message + "\n\nIMPORTANT: Please check your spam/junk folder if you don't see the email within a few minutes.\n\nAfter clicking the link in your email, your saved testimonies will be automatically synced to the cloud and available across all your devices.");
        } else {
          alert("Setup Failed\n\n" + (result.message || "Unable to send verification email. Please check your email address and try again."));
          // Clean up pending sync if failed
          localStorage.removeItem('pendingSync');
          localStorage.removeItem('syncEmail');
        }
      } catch (error) {
        console.error('Error starting magic link flow:', error);
        alert("Connection Error\n\nUnable to connect to the authentication service. Please check your internet connection and try again.");
        // Clean up pending sync if failed
        localStorage.removeItem('pendingSync');
        localStorage.removeItem('syncEmail');
      }
    }

    setIsOpen(false);
  };

  // Contact functions for Share My Testimony
  const handleWhatsAppContact = (phoneNumber: string) => {
    // Remove spaces and format for WhatsApp
    const cleanNumber = phoneNumber.replace(/\s+/g, '');
    const whatsappUrl = `https://wa.me/${cleanNumber}?text=Hello! I would like to share my testimony with Alpha Hour.`;
    window.open(whatsappUrl, '_blank');
    setIsOpen(false);
  };

  const handleEmailContact = (email: string) => {
    const subject = encodeURIComponent('My Testimony for Alpha Hour');
    const body = encodeURIComponent('Hello,\n\nI would like to share my testimony with Alpha Hour.\n\n[Please write your testimony here]\n\nThank you!');
    const mailtoUrl = `mailto:${email}?subject=${subject}&body=${body}`;
    window.location.href = mailtoUrl;
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
        <div className="absolute top-full left-0 mt-2 w-64 bg-slate-800 rounded-lg shadow-xl border border-slate-700 overflow-hidden">
          <nav className="py-2">
            {/* Home */}
            <Link
              href="/"
              className="block px-4 py-2 hover:bg-slate-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span className="text-white font-medium text-sm">Home</span>
              </div>
            </Link>

            {/* Explore Testimonies */}
            <div>
              <button
                onClick={() => setCategoriesExpanded(!categoriesExpanded)}
                className="w-full px-4 py-2 hover:bg-slate-700 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  <span className="text-white font-medium text-sm">Explore Testimonies</span>
                </div>
                <svg
                  className={`w-3 h-3 text-slate-400 transition-transform ${
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
                <div className="bg-slate-700 border-t border-slate-600">
                  {categories.map((category) => (
                    <Link
                      key={category.id}
                      href={`/category/${category.id}`}
                      className="block px-6 py-1.5 hover:bg-slate-600 transition-colors"
                    >
                      <span className="text-slate-200 text-xs">{category.name}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Altar Call */}
            <Link
              href="/altar-call"
              className="block px-4 py-2 hover:bg-slate-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-white font-medium text-sm">Altar Call</span>
              </div>
            </Link>

            {/* My Testimony Wall */}
            <Link
              href="/my-testimony-wall"
              className="block px-4 py-2 hover:bg-slate-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span className="text-white font-medium text-sm">My Testimony Wall</span>
              </div>
            </Link>

            {/* Share My Testimony */}
            <div>
              <button
                onClick={() => setShareTestimonyExpanded(!shareTestimonyExpanded)}
                className="w-full px-4 py-2 hover:bg-slate-700 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                  <span className="text-white font-medium text-sm">Share My Testimony</span>
                </div>
                <svg
                  className={`w-3 h-3 text-slate-400 transition-transform ${
                    shareTestimonyExpanded ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Share Testimony Contact Options */}
              {shareTestimonyExpanded && (
                <div className="bg-slate-700 border-t border-slate-600">
                  {/* WhatsApp Line 1 */}
                  <button
                    onClick={() => handleWhatsAppContact('+233548695731')}
                    className="w-full px-6 py-1.5 hover:bg-slate-600 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2">
                      <svg className="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                      </svg>
                      <span className="text-slate-200 text-xs">Testimony Line 1</span>
                    </div>
                  </button>

                  {/* WhatsApp Line 2 */}
                  <button
                    onClick={() => handleWhatsAppContact('+233592748953')}
                    className="w-full px-6 py-1.5 hover:bg-slate-600 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2">
                      <svg className="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                      </svg>
                      <span className="text-slate-200 text-xs">Testimony Line 2</span>
                    </div>
                  </button>

                  {/* Email Option */}
                  <button
                    onClick={() => handleEmailContact('testimonies@alphahour.org')}
                    className="w-full px-6 py-1.5 hover:bg-slate-600 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2">
                      <svg className="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="text-slate-200 text-xs">Send via email</span>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="h-px bg-slate-600 my-1"></div>

            {/* Save & Sync */}
            <button
              onClick={handleSaveSync}
              className="w-full px-4 py-2 hover:bg-slate-700 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="text-white font-medium text-sm">Save & Sync Across Devices</span>
              </div>
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}