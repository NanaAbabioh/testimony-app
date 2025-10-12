"use client";

import { useEffect, useState } from "react";
import AdminToken from "@/app/components/admin/AdminToken";
import AdminHeader from "@/components/admin/AdminHeader";
import StatCard from "@/components/admin/StatCard";
import CategoryList from "@/components/admin/CategoryList";
import VideoTable from "@/components/admin/VideoTable";
import ClipValidation from "@/components/admin/ClipValidation";
import MultiSelectDropdown from "@/components/admin/MultiSelectDropdown";
import { SkeletonCard } from "@/components/ui/Skeleton";
import {
  VideoCamera,
  Target,
  Folder,
  ChartBar,
  ArrowClockwise,
  Plus,
  Detective,
  FilmReel
} from "@phosphor-icons/react";

type Video = { 
  id: string; 
  title: string; 
  status: string; 
  createdAt?: string; 
  testimonyCount?: number; 
  url?: string;
  uploadDate?: string;
};

type DashboardStats = {
  totalVideos: number;
  totalTestimonies: number;
  totalCategories: number;
  avgTestimoniesPerVideo: number;
  categoryBreakdown: { [key: string]: number };
};

// Utility function to parse episode information from video titles
function parseEpisodeInfo(title: string, uploadDate?: string) {
  // Try to extract episode number from common patterns like:
  // "Episode 1087 | 29 Aug 2025" (your current format)
  // "Alpha Hour Episode 1087 | My Light Shines"
  // "Episode 1087: My Light Shines"
  // "Ep 1087 - My Light Shines"
  // "1087: My Light Shines"

  const episodePatterns = [
    /Episode\s*(\d+)\s*\|\s*(.+)/i,  // Matches "Episode XXXX | Date/Title" (your format)
    /Alpha Hour\s*Episode\s*(\d+)\s*[|:]\s*(.+)/i,
    /Episode\s*(\d+)\s*[|:]\s*(.+)/i,
    /Episode\s*(\d+)\s*[-:]\s*(.+)/i,
    /Ep\s*(\d+)\s*[|:-]\s*(.+)/i,
    /(\d{3,4})\s*[-:]\s*(.+)/,
    /Alpha Hour\s*(\d+)\s*[|:-]\s*(.+)/i
  ];

  let episodeNumber = '';
  let episodeTitle = title;

  for (const pattern of episodePatterns) {
    const match = title.match(pattern);
    if (match) {
      episodeNumber = match[1];
      episodeTitle = match[2] ? match[2].trim() : title;
      break;
    }
  }

  // Format the date
  let formattedDate = '';
  if (uploadDate) {
    try {
      const date = new Date(uploadDate);
      formattedDate = date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch (error) {
      console.warn('Error parsing upload date:', uploadDate);
      formattedDate = new Date().toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    }
  }

  return {
    episodeNumber,
    episodeTitle: episodeTitle || title,
    formattedDate,
    displayTitle: episodeNumber 
      ? `Episode ${episodeNumber} | ${episodeTitle} | ${formattedDate}`
      : `${episodeTitle} | ${formattedDate}`
  };
}

export default function AdminPage() {
  const handleCreateManual = () => {
    window.location.href = "/admin/clips/manual";
  };

  const handleBulkImport = () => {
    window.location.href = "/admin/clips/manual?tab=bulk";
  };

  return (
    <AdminToken>
      {(token) => (
        <div className="min-h-screen bg-[hsl(var(--bg))]">
          <AdminHeader
            title="Alpha Hour Admin Dashboard"
            subtitle="Manage testimonies and video content with intelligent AI processing"
            onManual={handleCreateManual}
            onBulkImport={handleBulkImport}
          />
          
          <main className="mx-auto max-w-6xl px-[var(--pad-medium)] py-8 space-y-8">

            {/* Key Metrics */}
            <section>
              <DashboardStats token={token} />
            </section>


            {/* Category Breakdown */}
            <section>
              <CategoryBreakdown token={token} />
            </section>

            {/* Clip Validation Detective */}
            <section id="clip-validation">
              <ClipValidation />
            </section>

            {/* Video Library */}
            <section id="video-library">
              <VideoLibrary token={token} />
            </section>
          </main>
        </div>
      )}
    </AdminToken>
  );
}

function UserDropdown() {
  return (
    <div className="relative inline-block text-left">
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">A</span>
          </div>
          <button
            className="flex items-center text-sm font-medium text-slate-700 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-md px-2 py-1"
            onClick={() => {
              const menu = document.getElementById('user-menu');
              menu?.classList.toggle('hidden');
            }}
          >
            Admin
            <svg className="ml-1 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
      <div 
        id="user-menu"
        className="hidden absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
      >
        <a
          href="/admin/analytics"
          className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
        >
          📊 Analytics
        </a>
        <button
          onClick={() => {
            localStorage.removeItem('adminToken');
            window.location.href = '/admin/login';
          }}
          className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
        >
          Logout
        </button>
      </div>
    </div>
  );
}


function VideoLibrary({ token }: { token: string | null }) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedEpisodes, setSelectedEpisodes] = useState<string[]>([]);
  const [availableEpisodes, setAvailableEpisodes] = useState<string[]>([]);

  useEffect(() => {
    if (!token) return;
    loadVideos();
  }, [token]);

  // Load available episodes when videos change
  useEffect(() => {
    if (videos.length > 0) {
      // Extract episode numbers from video titles
      const episodes = [...new Set(videos
        .map(video => {
          const episodeInfo = parseEpisodeInfo(video.title, video.uploadDate);
          return episodeInfo.episodeNumber;
        })
        .filter((episode: string) => episode && episode.trim() !== '')
      )].sort((a, b) => {
        // Ensure proper numeric sorting (latest episode first)
        const numA = parseInt(a, 10);
        const numB = parseInt(b, 10);
        return numB - numA; // Descending order
      });
      console.log('Available episodes extracted:', episodes);
      console.log('Total videos:', videos.length);
      setAvailableEpisodes(episodes);
    }
  }, [videos]);

  // Filter videos when filters change or videos are loaded
  useEffect(() => {
    let filtered = [...videos];

    if (selectedYear !== 'all') {
      filtered = filtered.filter(video => {
        if (!video.uploadDate) return false;
        const videoYear = new Date(video.uploadDate).getFullYear().toString();
        return videoYear === selectedYear;
      });
    }

    if (selectedMonth !== 'all') {
      filtered = filtered.filter(video => {
        if (!video.uploadDate) return false;
        const videoMonth = (new Date(video.uploadDate).getMonth() + 1).toString().padStart(2, '0');
        return videoMonth === selectedMonth;
      });
    }

    if (selectedEpisodes.length > 0) {
      filtered = filtered.filter(video => {
        const episodeInfo = parseEpisodeInfo(video.title, video.uploadDate);
        return selectedEpisodes.includes(episodeInfo.episodeNumber);
      });
    }

    setFilteredVideos(filtered);
  }, [videos, selectedYear, selectedMonth, selectedEpisodes]);

  const loadVideos = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/videos?status=live&limit=100', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error(`Failed to load videos: ${response.statusText}`);
      }

      const data = await response.json();
      setVideos(data.items || []);
    } catch (error) {
      console.error('Error loading videos:', error);
      setError(error instanceof Error ? error.message : 'Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  const handleEditTestimonies = (videoId: string) => {
    window.location.href = `/admin/clips?videoId=${videoId}`;
  };

  const handleClearTestimonies = async (videoId: string) => {
    if (!token) return;
    
    const video = videos.find(v => v.id === videoId);
    if (!confirm(`Are you sure you want to clear all testimonies for "${video?.title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/videos/${videoId}/clips`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();

      if (response.ok) {
        alert(`Successfully cleared ${data.deleted} testimonies`);
        loadVideos();
      } else {
        alert(`Failed to clear testimonies: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error clearing testimonies:', error);
      alert(`Failed to clear testimonies: ${error}`);
    }
  };

  const handleRowMenu = (videoId: string) => {
    console.log('More actions for video:', videoId);
    // Can implement additional actions here if needed
  };

  const handleDeleteVideo = async (videoId: string) => {
    if (!token) return;
    
    const video = videos.find(v => v.id === videoId);
    if (!confirm(`Are you sure you want to delete "${video?.title}"? This will also delete all associated testimonies. This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/videos/${videoId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();

      if (response.ok) {
        // Update local state immediately
        setVideos(videos.filter(v => v.id !== videoId));
        // Show success message with details
        alert(`Successfully deleted video and ${data.deleted?.clipsDeleted || 0} testimonies`);
      } else {
        // Show specific error message
        alert(`Failed to delete video: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting video:', error);
      alert(`Failed to delete video: ${error}`);
    }
  };

  const handleBulkDelete = async (videoIds: string[]) => {
    if (!token || videoIds.length === 0) return;
    
    let successCount = 0;
    let totalClipsDeleted = 0;
    let errorCount = 0;

    for (const videoId of videoIds) {
      try {
        const response = await fetch(`/api/admin/videos/${videoId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();

        if (response.ok) {
          successCount++;
          totalClipsDeleted += data.deleted?.clipsDeleted || 0;
        } else {
          errorCount++;
          console.error(`Failed to delete video ${videoId}:`, data.error);
        }
      } catch (error) {
        errorCount++;
        console.error(`Error deleting video ${videoId}:`, error);
      }
    }

    // Update local state
    if (successCount > 0) {
      loadVideos(); // Reload the video list
    }

    // Show result message
    if (errorCount === 0) {
      alert(`Successfully deleted ${successCount} video${successCount !== 1 ? 's' : ''} and ${totalClipsDeleted} testimonies`);
    } else {
      alert(`Deleted ${successCount} video${successCount !== 1 ? 's' : ''}, ${errorCount} failed`);
    }
  };

  const handleBulkEdit = (videoIds: string[]) => {
    if (videoIds.length === 0) return;
    
    // For bulk edit, navigate to a special page or show multiple videos
    // For now, if only one video is selected, navigate to its edit page
    if (videoIds.length === 1) {
      window.location.href = `/admin/clips?videoId=${videoIds[0]}`;
    } else {
      // For multiple videos, you could navigate to a bulk edit page
      // or show them in sequence
      const videoIdParams = videoIds.join(',');
      window.location.href = `/admin/clips?videoIds=${videoIdParams}`;
    }
  };

  // Generate available years and months from all videos
  const availableYears = [...new Set(videos
    .filter(video => video.uploadDate)
    .map(video => new Date(video.uploadDate!).getFullYear().toString())
  )].sort((a, b) => parseInt(a) - parseInt(b));

  const availableMonths = [...new Set(videos
    .filter(video => video.uploadDate)
    .map(video => (new Date(video.uploadDate!).getMonth() + 1).toString().padStart(2, '0'))
  )].sort((a, b) => parseInt(a) - parseInt(b));

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const tableRows = filteredVideos.map(video => {
    const episodeInfo = parseEpisodeInfo(video.title, video.uploadDate);
    return {
      id: video.id,
      title: episodeInfo.displayTitle,
      originalTitle: video.title,
      episodeNumber: episodeInfo.episodeNumber,
      episodeTitle: episodeInfo.episodeTitle,
      date: episodeInfo.formattedDate || (video.uploadDate ? new Date(video.uploadDate).toLocaleDateString() : "—"),
      uploadDate: video.uploadDate, // Keep raw upload date for filtering
      testimoniesCount: video.testimonyCount || 0,
      youtubeUrl: video.url || ""
    };
  });

  return (
    <>
      {/* Filter Section */}
      {!loading && videos.length > 0 && (
        <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-[12px] border border-black/5 dark:border-white/10 shadow-sm">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Filter Videos</h3>
          <div className="flex gap-4 items-center flex-wrap">
            <div className="flex items-center gap-2">
              <label htmlFor="year-filter" className="text-sm text-gray-600 dark:text-gray-400">Year:</label>
              <select
                id="year-filter"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#5050F0] focus:border-[#5050F0]"
              >
                <option value="all">All Years</option>
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <label htmlFor="month-filter" className="text-sm text-gray-600 dark:text-gray-400">Month:</label>
              <select
                id="month-filter"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#5050F0] focus:border-[#5050F0]"
              >
                <option value="all">All Months</option>
                {availableMonths.map(month => (
                  <option key={month} value={month}>
                    {monthNames[parseInt(month) - 1]}
                  </option>
                ))}
              </select>
            </div>

            <MultiSelectDropdown
              label="Episode"
              options={availableEpisodes}
              selectedValues={selectedEpisodes}
              onChange={setSelectedEpisodes}
              placeholder="All Episodes"
              renderOption={(episode) => `Episode ${episode}`}
            />
            
            {(selectedYear !== 'all' || selectedMonth !== 'all' || selectedEpisodes.length > 0) && (
              <button
                onClick={() => {
                  setSelectedYear('all');
                  setSelectedMonth('all');
                  setSelectedEpisodes([]);
                }}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 underline"
              >
                Clear Filters
              </button>
            )}
            
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Showing {filteredVideos.length} of {videos.length} videos
            </div>
          </div>
        </div>
      )}
      
      <VideoTable 
        rows={tableRows} 
        onRowMenu={handleRowMenu}
        onDeleteVideo={handleDeleteVideo}
        onClearTestimonies={handleClearTestimonies}
        onEditTestimonies={handleEditTestimonies}
        onBulkDelete={handleBulkDelete}
        onBulkEdit={handleBulkEdit}
        loading={loading}
        error={error}
        onRetry={loadVideos}
        onAddFirst={() => window.location.href = "/admin/clips/manual"}
      />
    </>
  );
}



function DashboardStats({ token }: { token: string | null }) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        if (data.success) {
          const totalVideos = data.stats.totalVideos;
          const totalTestimonies = data.stats.totalTestimonies;
          const avgTestimoniesPerVideo = totalVideos > 0 ? Math.round(totalTestimonies / totalVideos) : 0;

          setStats({
            totalVideos,
            totalTestimonies,
            totalCategories: data.stats.totalCategories,
            avgTestimoniesPerVideo,
            categoryBreakdown: data.stats.categoryBreakdown
          });
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [token]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      <StatCard
        label="Videos processed"
        value={stats.totalVideos}
        icon={<VideoCamera />}
        hint={stats.totalVideos > 0 ? "Active" : "Get started"}
      />
      <StatCard
        label="Total testimonies"
        value={stats.totalTestimonies}
        icon={<Target />}
        trend={stats.totalTestimonies > 0 ? "up" : null}
      />
      <StatCard
        label="Categories"
        value={stats.totalCategories}
        icon={<Folder />}
      />
      <StatCard
        label="Avg per video"
        value={stats.avgTestimoniesPerVideo}
        icon={<ChartBar />}
        hint={stats.avgTestimoniesPerVideo > 3 ? "High yield" : undefined}
      />
    </div>
  );
}


function CategoryBreakdown({ token }: { token: string | null }) {
  const [categoryData, setCategoryData] = useState<{ [key: string]: number }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    const fetchCategoryBreakdown = async () => {
      try {
        const response = await fetch('/api/admin/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        if (data.success) {
          setCategoryData(data.stats.categoryBreakdown || {});
        }
      } catch (error) {
        console.error('Error fetching category breakdown:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryBreakdown();
  }, [token]);

  if (loading) {
    return (
      <CategoryList items={[]} />
    );
  }

  const categories = Object.entries(categoryData)
    .sort(([,a], [,b]) => b - a)
    .map(([name, count]) => ({ name, count }));
  
  const total = Math.max(...categories.map(c => c.count));

  return <CategoryList items={categories} total={total} />;
}

