'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

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
    <div className="min-h-screen bg-gray-50" style={{
      backgroundImage: `url('/everyday-bg.svg')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundAttachment: 'fixed'
    }}>
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/" className="text-[#301934] hover:text-[#301934]/80 font-medium flex items-center gap-2 mb-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Home
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">My Testimony Wall</h1>
              <p className="text-gray-600">Your personal collection of saved testimonies and downloads</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('playlists')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'playlists'
                  ? 'border-[#301934] text-[#301934]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              Saved Clips ({downloads.filter(d => d.clipData?.type === 'saved').length})
            </button>
            <button
              onClick={() => setActiveTab('downloads')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'downloads'
                  ? 'border-[#301934] text-[#301934]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
              Downloads ({downloads.filter(d => d.clipData?.type === 'downloaded').length})
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#301934]"></div>
            <span className="ml-4 text-gray-600">Loading your testimony wall...</span>
          </div>
        ) : (
          <>
            {/* Saved Clips Tab */}
            {activeTab === 'playlists' && (
              <div>
                {downloads.filter(d => d.clipData?.type === 'saved').length === 0 ? (
                  <div className="text-center py-20">
                    <div className="mb-4 flex justify-center">
                      <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No saved clips yet</h3>
                    <p className="text-gray-600 mb-6">
                      Start saving your favorite testimonies and they'll appear here!
                    </p>
                    <Link 
                      href="/"
                      className="bg-[#301934] text-white px-6 py-3 rounded-lg hover:bg-[#301934]/90 transition-colors font-medium"
                    >
                      Explore Testimonies
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-gray-900">Saved Testimonies</h3>
                      <span className="text-sm text-gray-600">
                        {downloads.filter(d => d.clipData?.type === 'saved').length} saved
                      </span>
                    </div>

                    {downloads.filter(d => d.clipData?.type === 'saved').map((download) => (
                      <div key={download.id} className="bg-white rounded-lg border p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4">
                          {/* Thumbnail */}
                          <div className="relative w-24 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                            <img 
                              src={`https://img.youtube.com/vi/${download.clipData?.videoId}/mqdefault.jpg`} 
                              alt={download.testimonyTitle}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = '/api/thumb/' + download.clipData?.videoId;
                              }}
                            />
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z"/>
                              </svg>
                            </div>
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 mb-1">{download.testimonyTitle}</h4>
                            {download.clipData?.episode && (
                              <p className="text-sm text-gray-600 mb-1">Episode {download.clipData.episode}</p>
                            )}
                            {download.clipData?.fullText && (
                              <p className="text-sm text-gray-600 line-clamp-2 mb-2">{download.clipData.fullText}</p>
                            )}
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span>Saved {formatDate(download.downloadedAt)}</span>
                              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Saved
                              </span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-3">
                            <Link
                              href={`/watch/${download.testimonyId}`}
                              className="bg-[#301934] text-white px-4 py-2 rounded-lg hover:bg-[#301934]/90 transition-colors font-medium text-sm"
                            >
                              Watch
                            </Link>
                            <button 
                              onClick={() => {
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
                              className="text-gray-400 hover:text-red-600 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Downloads Tab */}
            {activeTab === 'downloads' && (
              <div>
                {downloads.filter(d => d.clipData?.type === 'downloaded').length === 0 ? (
                  <div className="text-center py-20">
                    <div className="mb-4 flex justify-center">
                      <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No downloads yet</h3>
                    <p className="text-gray-600 mb-6">
                      Download testimonies to listen offline and they'll appear here.
                    </p>
                    <Link 
                      href="/"
                      className="bg-[#301934] text-white px-6 py-3 rounded-lg hover:bg-[#301934]/90 transition-colors font-medium"
                    >
                      Browse Testimonies
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-gray-900">Downloaded Testimonies</h3>
                      <span className="text-sm text-gray-600">
                        {downloads.filter(d => d.clipData?.type === 'downloaded').length} downloaded
                      </span>
                    </div>

                    {downloads.filter(d => d.clipData?.type === 'downloaded').map((download) => (
                      <div key={download.id} className="bg-white rounded-lg border p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4">
                          {/* Thumbnail */}
                          <div className="relative w-24 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                            <img 
                              src={`https://img.youtube.com/vi/${download.clipData?.videoId}/mqdefault.jpg`} 
                              alt={download.testimonyTitle}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = '/api/thumb/' + download.clipData?.videoId;
                              }}
                            />
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z"/>
                              </svg>
                            </div>
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 mb-1">{download.testimonyTitle}</h4>
                            {download.clipData?.episode && (
                              <p className="text-sm text-gray-600 mb-1">Episode {download.clipData.episode}</p>
                            )}
                            {download.clipData?.fullText && (
                              <p className="text-sm text-gray-600 line-clamp-2 mb-2">{download.clipData.fullText}</p>
                            )}
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span>Downloaded {formatDate(download.downloadedAt)}</span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${download.clipData?.downloadType === 'video' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
                                {download.clipData?.downloadType === 'video' ? (
                                  <>
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                    Video
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                                    </svg>
                                    Audio
                                  </>
                                )}
                              </span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-3">
                            <Link
                              href={`/watch/${download.testimonyId}`}
                              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                            >
                              Watch
                            </Link>
                            <button 
                              onClick={() => {
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
                              className="text-gray-400 hover:text-red-600 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
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