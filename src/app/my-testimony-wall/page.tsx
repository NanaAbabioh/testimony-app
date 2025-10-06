'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ClipRow from '@/components/ClipRow';

interface Testimony {
  id: string;
  title: string;
  fullText: string;
  startTimeSeconds: number;
  endTimeSeconds: number;
  sourceVideoId: string;
  sourceVideoTitle: string;
  thumbnailUrl: string;
  category: string;
}

interface Playlist {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  testimonyIds: string[];
  count: number;
  testimonies?: Testimony[];
}

interface Download {
  id: string;
  testimonyId: string;
  testimonyTitle: string;
  downloadedAt: string;
  fileSize?: string;
  status: 'pending' | 'completed' | 'failed';
  clipData?: any;
}

export default function MyTestimonyWall() {
  const [activeTab, setActiveTab] = useState<'playlists' | 'downloads'>('playlists');
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [downloads, setDownloads] = useState<Download[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    setLoading(true);
    try {
      // Load saved clips from localStorage
      const savedClipsData = JSON.parse(localStorage.getItem('saved_clips') || '[]');
      
      // Convert saved clips to downloads format for display
      const formattedDownloads: Download[] = savedClipsData.map((clip: any) => ({
        id: clip.id,
        testimonyId: clip.id,
        testimonyTitle: clip.title || clip.titleShort,
        downloadedAt: clip.savedAt || clip.downloadedAt || new Date().toISOString(),
        fileSize: clip.downloadType === 'video' ? 'Video' : clip.downloadType === 'audio' ? 'Audio' : 'Saved',
        status: 'completed' as const,
        clipData: clip
      }));
      
      setDownloads(formattedDownloads);

      // For now, leave playlists empty since we're focusing on saved/downloaded clips
      setPlaylists([]);

    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlaylist = async (playlistId: string) => {
    if (!confirm('Are you sure you want to delete this playlist?')) return;

    try {
      const response = await fetch(`/api/playlists/${playlistId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setPlaylists(playlists.filter(p => p.id !== playlistId));
        if (selectedPlaylist?.id === playlistId) {
          setSelectedPlaylist(null);
        }
      }
    } catch (error) {
      console.error('Error deleting playlist:', error);
      alert('Error deleting playlist. Please try again.');
    }
  };

  const formatDate = (dateString: string) => {
    // Use a consistent format to avoid hydration mismatch
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()} at ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <div
      className="min-h-screen py-3 sm:py-6 px-2 sm:px-4 lg:px-8"
      style={{
        backgroundImage: `url('/everyday-bg.svg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundColor: '#f9fafb'
      }}
    >
      {/* Mobile-Optimized Header */}
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-200">
          <Link href="/" className="text-[#301934] hover:text-[#301934]/80 font-medium flex items-center gap-2 mb-3 text-sm sm:text-base">
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </Link>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">My Testimony Wall</h1>
          <p className="text-sm sm:text-base text-gray-600">Your personal collection of saved testimonies and downloads</p>
        </div>

        {/* Mobile-Optimized Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex">
            <button
              onClick={() => setActiveTab('playlists')}
              className={`flex-1 py-3 sm:py-4 px-3 sm:px-4 border-b-2 font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors ${
                activeTab === 'playlists'
                  ? 'border-[#301934] text-[#301934] bg-purple-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              <span className="hidden sm:inline">Saved Clips</span>
              <span className="sm:hidden">Saved</span>
              <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full text-xs">
                {downloads.filter(d => d.clipData?.type === 'saved').length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('downloads')}
              className={`flex-1 py-3 sm:py-4 px-3 sm:px-4 border-b-2 font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors ${
                activeTab === 'downloads'
                  ? 'border-[#301934] text-[#301934] bg-purple-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
              <span className="hidden sm:inline">Downloads</span>
              <span className="sm:hidden">Downloaded</span>
              <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full text-xs">
                {downloads.filter(d => d.clipData?.type === 'downloaded').length}
              </span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div>
          {loading ? (
            <div className="bg-white rounded-lg p-8 sm:p-12 text-center shadow-sm border border-gray-200">
              <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-[#301934] mx-auto mb-4"></div>
              <span className="text-sm sm:text-base text-gray-600">Loading your testimony wall...</span>
            </div>
          ) : (
            <>
              {/* Saved Clips Tab */}
              {activeTab === 'playlists' && (
                <div>
                  {downloads.filter(d => d.clipData?.type === 'saved').length === 0 ? (
                    <div className="bg-white rounded-lg p-8 sm:p-12 text-center shadow-sm border border-gray-200">
                      <div className="mb-4 flex justify-center">
                        <svg className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                      </div>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No saved clips yet</h3>
                      <p className="text-sm sm:text-base text-gray-600 mb-6">
                        Start saving your favorite testimonies and they'll appear here!
                      </p>
                      <Link
                        href="/"
                        className="bg-[#301934] text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-[#301934]/90 transition-colors font-medium text-sm sm:text-base"
                      >
                        Explore Testimonies
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3 sm:space-y-4">
                      {downloads.filter(d => d.clipData?.type === 'saved').map((download) => {
                        // Convert to ClipRow format
                        const clipForRow = {
                          id: download.clipData?.id || download.id,
                          videoId: download.clipData?.videoId || '',
                          startSec: download.clipData?.startSec || 0,
                          endSec: download.clipData?.endSec,
                          titleShort: download.clipData?.titleShort || download.testimonyTitle,
                          summaryShort: download.clipData?.summaryShort || '',
                          title: download.clipData?.title || download.testimonyTitle,
                          fullText: download.clipData?.fullText || '',
                          episode: download.clipData?.episode,
                          serviceDate: download.clipData?.serviceDate,
                          thumbUrl: download.clipData?.thumbUrl
                        };

                        return (
                          <ClipRow
                            key={download.id}
                            clip={clipForRow}
                            onRemove={() => {
                              // Remove from saved clips
                              const savedClipsKey = 'saved_clips';
                              const existingSavedClips = JSON.parse(localStorage.getItem(savedClipsKey) || '[]');
                              const filteredClips = existingSavedClips.filter((clip: any) => clip.id !== download.id);
                              localStorage.setItem(savedClipsKey, JSON.stringify(filteredClips));

                              // Remove from localStorage saved state
                              localStorage.removeItem(`saved_${download.id}`);

                              // Reload data
                              loadUserData();
                            }}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Downloads Tab */}
              {activeTab === 'downloads' && (
                <div>
                  {downloads.filter(d => d.clipData?.type === 'downloaded').length === 0 ? (
                    <div className="bg-white rounded-lg p-8 sm:p-12 text-center shadow-sm border border-gray-200">
                      <div className="mb-4 flex justify-center">
                        <svg className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                        </svg>
                      </div>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No downloads yet</h3>
                      <p className="text-sm sm:text-base text-gray-600 mb-6">
                        Download testimonies to listen offline and they'll appear here.
                      </p>
                      <Link
                        href="/"
                        className="bg-[#301934] text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-[#301934]/90 transition-colors font-medium text-sm sm:text-base"
                      >
                        Browse Testimonies
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3 sm:space-y-4">
                      {downloads.filter(d => d.clipData?.type === 'downloaded').map((download) => {
                        // Convert to ClipRow format
                        const clipForRow = {
                          id: download.clipData?.id || download.id,
                          videoId: download.clipData?.videoId || '',
                          startSec: download.clipData?.startSec || 0,
                          endSec: download.clipData?.endSec,
                          titleShort: download.clipData?.titleShort || download.testimonyTitle,
                          summaryShort: download.clipData?.summaryShort || '',
                          title: download.clipData?.title || download.testimonyTitle,
                          fullText: download.clipData?.fullText || '',
                          episode: download.clipData?.episode,
                          serviceDate: download.clipData?.serviceDate,
                          thumbUrl: download.clipData?.thumbUrl
                        };

                        return (
                          <ClipRow
                            key={download.id}
                            clip={clipForRow}
                            onRemove={() => {
                              // Remove from saved clips
                              const savedClipsKey = 'saved_clips';
                              const existingSavedClips = JSON.parse(localStorage.getItem(savedClipsKey) || '[]');
                              const filteredClips = existingSavedClips.filter((clip: any) => clip.id !== download.id);
                              localStorage.setItem(savedClipsKey, JSON.stringify(filteredClips));

                              // Remove from localStorage downloaded state
                              localStorage.removeItem(`downloaded_${download.id}`);

                              // Reload data
                              loadUserData();
                            }}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Playlist Viewer Modal */}
      {selectedPlaylist && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{selectedPlaylist.name}</h3>
                  <p className="text-gray-600">{selectedPlaylist.count} testimonies</p>
                </div>
                <button
                  onClick={() => setSelectedPlaylist(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-96">
              {selectedPlaylist.testimonyIds.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>This playlist is empty</p>
                  <p className="text-sm mt-2">Add some testimonies to get started!</p>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                    <p>{selectedPlaylist.count} testimonies saved</p>
                  </div>
                  <p className="text-sm mt-2">Individual testimony viewing coming soon!</p>
                  <div className="mt-4">
                    <Link
                      href="/"
                      onClick={() => setSelectedPlaylist(null)}
                      className="bg-[#301934] text-white px-4 py-2 rounded-lg hover:bg-[#301934]/90 transition-colors font-medium text-sm"
                    >
                      Browse More Testimonies
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}