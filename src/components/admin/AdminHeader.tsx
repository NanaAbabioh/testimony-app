"use client";

import { useState } from "react";
import { 
  List, 
  X, 
  House, 
  ChartBar, 
  Detective, 
  VideoCamera, 
  Play, 
  Plus, 
  SignOut,
  Target
} from "@phosphor-icons/react";

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  onManual?: () => void;
  onBulkImport?: () => void;
}

export default function AdminHeader({
  title,
  subtitle,
  onManual,
  onBulkImport
}: AdminHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    window.location.href = '/admin/login';
  };

  const menuItems = [
    { label: "Home", icon: <House size={20} />, href: "/admin" },
    { label: "Stats", icon: <ChartBar size={20} />, href: "/admin/analytics" },
    { label: "Clip Time Validation Detective", icon: <Detective size={20} />, action: () => {
      document.getElementById('clip-validation')?.scrollIntoView({ behavior: 'smooth' });
      setIsMenuOpen(false);
    }},
    { label: "Video Library", icon: <VideoCamera size={20} />, action: () => {
      document.getElementById('video-library')?.scrollIntoView({ behavior: 'smooth' });
      setIsMenuOpen(false);
    }},
    { label: "Bulk Import", icon: <List size={20} />, action: () => {
      onBulkImport?.();
      setIsMenuOpen(false);
    }},
    { label: "Create Single Clip", icon: <Plus size={20} />, action: () => {
      onManual?.();
      setIsMenuOpen(false);
    }},
    { label: "Logout", icon: <SignOut size={20} />, action: handleLogout, isLogout: true }
  ];

  return (
    <>
      <header className="relative bg-gradient-to-br from-[#0F172A] via-[#5050F0] to-[#FFFAFF] shadow-lg lg:rounded-b-[18px] overflow-hidden">
        <div className="mx-auto max-w-6xl px-[var(--pad-medium)] py-8">
          <div className="absolute top-4 left-4 flex items-center gap-3">
            <button
              onClick={() => setIsMenuOpen(true)}
              className="p-2 rounded-lg bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all duration-200 text-white"
              aria-label="Open menu"
            >
              <List size={20} />
            </button>
            <span className="inline-flex items-center rounded-full bg-white/20 backdrop-blur-sm px-3 py-1 text-xs font-medium text-white shadow-sm">
              Admin
            </span>
          </div>
        
        <div className="pt-8 text-center text-white">
          <h1 className="font-serif text-4xl lg:text-5xl font-bold mb-3 drop-shadow-lg">
            {title}
          </h1>
          {subtitle && (
            <p className="text-lg lg:text-xl opacity-95 mb-8 drop-shadow-md max-w-2xl mx-auto">
              {subtitle}
            </p>
          )}
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={onBulkImport}
              className="rounded-[12px] bg-[#5050F0] hover:bg-[#4040E0] px-6 py-3 text-white font-medium shadow-md hover:shadow-lg active:scale-[1.03] transition-all duration-200 min-w-[180px]"
            >
              Bulk Import
            </button>
            <button
              onClick={onManual}
              className="rounded-[12px] border-2 border-white/30 bg-white/10 backdrop-blur-sm hover:bg-white/20 px-6 py-3 text-white font-medium shadow-md hover:shadow-lg active:scale-[1.03] transition-all duration-200 min-w-[180px]"
            >
              Create Single Clip
            </button>
          </div>
        </div>
      </div>
    </header>

      {/* Hamburger Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)}>
          <div 
            className="fixed left-0 top-0 h-full w-80 bg-white shadow-2xl transform transition-transform duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Menu Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-[#5050F0] to-[#4040E0]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Target size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Admin Panel</h3>
                  <p className="text-white/80 text-sm">Testimony Library</p>
                </div>
              </div>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-all duration-200 text-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* Menu Items */}
            <nav className="p-6">
              <ul className="space-y-2">
                {menuItems.map((item, index) => (
                  <li key={index}>
                    {item.href ? (
                      <a
                        href={item.href}
                        className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 hover:bg-gray-100 ${
                          item.isLogout ? 'text-red-600 hover:bg-red-50' : 'text-gray-700 hover:text-gray-900'
                        }`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {item.icon}
                        <span className="font-medium">{item.label}</span>
                      </a>
                    ) : (
                      <button
                        onClick={item.action}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 hover:bg-gray-100 text-left ${
                          item.isLogout ? 'text-red-600 hover:bg-red-50' : 'text-gray-700 hover:text-gray-900'
                        }`}
                      >
                        {item.icon}
                        <span className="font-medium">{item.label}</span>
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </nav>

            {/* Menu Footer */}
            <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-200 bg-gray-50">
              <div className="text-center text-sm text-gray-500">
                <p>Alpha Hour Testimony Library</p>
                <p className="text-xs mt-1">Admin Dashboard v1.0</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}