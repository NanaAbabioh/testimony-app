'use client';

import { usePathname } from 'next/navigation';
import HamburgerMenu from "@/components/HamburgerMenu";

export default function ConditionalNavigation({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Check if current route is an admin route
  const isAdminRoute = pathname?.startsWith('/admin');
  
  if (isAdminRoute) {
    // For admin routes, render children without the front-end navigation
    return (
      <div className="min-h-screen">
        {children}
      </div>
    );
  }
  
  // For non-admin routes, render with the front-end navigation
  return (
    <div className="min-h-screen">
      {/* Global Navigation Header with Hamburger Menu */}
      <nav className="fixed top-0 left-0 right-0 bg-white shadow-sm border-b border-gray-100 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Hamburger Menu */}
              <HamburgerMenu />
              
              {/* Logo */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-lg flex items-center justify-center shadow-md">
                  <span className="text-purple-900 font-bold text-lg">AH</span>
                </div>
                <div>
                  <span className="text-gray-900 font-bold text-xl">ALPHA HOUR</span>
                  <span className="block text-gray-500 text-sm font-medium">Testimony Library</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Main Content - Add padding to account for fixed header */}
      <div className="pt-20">
        {children}
      </div>
    </div>
  );
}