'use client';

import { useState, useEffect } from 'react';

interface Testimony {
  id: string;
  title: string;
  fullText: string;
  startTimeSeconds: number;
  endTimeSeconds: number;
  sourceVideoId: string;
  sourceVideoTitle: string;
}

interface TestimonyActionsProps {
  testimony: Testimony;
}

interface Playlist {
  id: string;
  name: string;
  count: number;
}

export default function TestimonyActions({ testimony }: TestimonyActionsProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([
    { id: '1', name: 'My Favorites', count: 5 },
    { id: '2', name: 'Healing Testimonies', count: 8 },
    { id: '3', name: 'Breakthrough Stories', count: 3 }
  ]);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);

  // Load initial like count and playlists
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load real playlists from API
        const playlistResponse = await fetch('/api/playlists');
        if (playlistResponse.ok) {
          const playlistData = await playlistResponse.json();
          if (playlistData.success) {
            setPlaylists(playlistData.playlists);
          }
        }
        
        // Use a deterministic like count based on testimony ID to avoid hydration mismatch
        // In a real app, this would fetch the actual like count from the database
        const hash = testimony.id.split('').reduce((a, b) => {
          a = ((a << 5) - a) + b.charCodeAt(0);
          return a & a;
        }, 0);
        setLikeCount(Math.abs(hash % 50) + 1);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    
    loadData();
  }, [testimony.id]);

  const handleAmenClick = async () => {
    try {
      setIsLiked(!isLiked);
      setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
      
      // API call to save like/unlike
      const response = await fetch('/api/testimonies/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          testimonyId: testimony.id,
          action: isLiked ? 'unlike' : 'like'
        })
      });
      
      if (!response.ok) {
        // Revert on error
        setIsLiked(isLiked);
        setLikeCount(prev => isLiked ? prev + 1 : prev - 1);
      }
    } catch (error) {
      console.error('Error updating like:', error);
      // Revert on error
      setIsLiked(isLiked);
      setLikeCount(prev => isLiked ? prev + 1 : prev - 1);
    }
  };

  const handleShare = (platform: string) => {
    const url = `${window.location.origin}/watch/${testimony.id}`;
    const text = `Check out this amazing testimony: "${testimony.title}"`;
    
    let shareUrl = '';
    
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`;
        break;
      case 'email':
        shareUrl = `mailto:?subject=${encodeURIComponent('Amazing Testimony')}&body=${encodeURIComponent(text + '\n\n' + url)}`;
        break;
      case 'copy':
        navigator.clipboard.writeText(url);
        alert('Link copied to clipboard!');
        setShowShareModal(false);
        return;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
      setShowShareModal(false);
    }
  };

  const handleSaveToPlaylist = async (playlistId: string) => {
    try {
      const response = await fetch('/api/playlists/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          playlistId,
          testimonyId: testimony.id
        })
      });
      
      if (response.ok) {
        alert('Testimony saved to playlist!');
        setShowSaveModal(false);
      }
    } catch (error) {
      console.error('Error saving to playlist:', error);
      alert('Error saving to playlist. Please try again.');
    }
  };

  const handleCreateNewPlaylist = async () => {
    if (!newPlaylistName.trim()) return;
    
    try {
      const response = await fetch('/api/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: newPlaylistName,
          testimonyId: testimony.id
        })
      });
      
      if (response.ok) {
        alert('New playlist created and testimony saved!');
        setNewPlaylistName('');
        setShowSaveModal(false);
      }
    } catch (error) {
      console.error('Error creating playlist:', error);
      alert('Error creating playlist. Please try again.');
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch('/api/testimonies/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          testimonyId: testimony.id,
          startTime: testimony.startTimeSeconds,
          endTime: testimony.endTimeSeconds,
          sourceVideoId: testimony.sourceVideoId
        })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        // This would handle successful download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${testimony.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.mp3`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        // Show informative message about download feature
        alert(result.message || 'Download feature is coming soon! For now, you can visit the YouTube link and use a converter.');
        
        // Optionally open YouTube link
        if (result.youtubeUrl && confirm('Would you like to open the YouTube video?')) {
          window.open(result.youtubeUrl, '_blank');
        }
      }
    } catch (error) {
      console.error('Error downloading:', error);
      alert('Download feature is currently being developed. Please check back soon!');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
        {/* AMEN Button */}
        <button
          onClick={handleAmenClick}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            isLiked 
              ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <span className={`text-lg ${isLiked ? 'animate-pulse' : ''}`}>🙏</span>
          <span>AMEN</span>
          <span className="text-xs bg-white px-2 py-1 rounded-full">{likeCount}</span>
        </button>

        {/* Share Button */}
        <button
          onClick={() => setShowShareModal(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors duration-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
          </svg>
          <span>Share</span>
        </button>

        {/* Save Button */}
        <button
          onClick={() => setShowSaveModal(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors duration-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          <span>Save</span>
        </button>

        {/* Download Button */}
        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {isDownloading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-700 border-t-transparent"></div>
              <span>Downloading...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Download</span>
            </>
          )}
        </button>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Share Testimony</h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <p className="text-gray-600 mb-4 text-sm">"{testimony.title}"</p>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleShare('facebook')}
                className="flex items-center gap-2 p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <span>📘</span>
                <span>Facebook</span>
              </button>
              
              <button
                onClick={() => handleShare('twitter')}
                className="flex items-center gap-2 p-3 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors"
              >
                <span>🐦</span>
                <span>Twitter</span>
              </button>
              
              <button
                onClick={() => handleShare('whatsapp')}
                className="flex items-center gap-2 p-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                <span>💬</span>
                <span>WhatsApp</span>
              </button>
              
              <button
                onClick={() => handleShare('email')}
                className="flex items-center gap-2 p-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <span>📧</span>
                <span>Email</span>
              </button>
              
              <button
                onClick={() => handleShare('copy')}
                className="col-span-2 flex items-center justify-center gap-2 p-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>Copy Link</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save to Playlist Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Save to Playlist</h3>
              <button
                onClick={() => setShowSaveModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <p className="text-gray-600 mb-4 text-sm">"{testimony.title}"</p>
            
            <div className="space-y-3 mb-4">
              <h4 className="font-medium text-gray-900">Existing Playlists:</h4>
              {playlists.map(playlist => (
                <button
                  key={playlist.id}
                  onClick={() => handleSaveToPlaylist(playlist.id)}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left"
                >
                  <span className="font-medium">{playlist.name}</span>
                  <span className="text-sm text-gray-500">{playlist.count} items</span>
                </button>
              ))}
            </div>
            
            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-900 mb-3">Create New Playlist:</h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="Playlist name"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleCreateNewPlaylist}
                  disabled={!newPlaylistName.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}