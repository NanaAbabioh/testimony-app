'use client';

import { useState } from 'react';
import AdminToken from '../../components/admin/AdminToken';
import AdminHeader from '../../../../components/admin/AdminHeader';

interface TitleData {
  videoId: string;
  titles: { [key: number]: string };
  titleCount: number;
}

export default function TitleManagementPage() {
  const [videoId, setVideoId] = useState('');
  const [titlesText, setTitlesText] = useState('');
  const [currentTitles, setCurrentTitles] = useState<TitleData | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const extractVideoId = (url: string): string => {
    if (!url) return '';
    
    // If it's already just an ID
    if (url.length === 11 && !url.includes('http')) {
      return url;
    }
    
    // Extract from YouTube URL
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/;
    const match = url.match(regex);
    return match ? match[1] : url;
  };

  const handleSetTitles = async (token: string) => {
    if (!videoId.trim() || !titlesText.trim()) {
      setMessage({ type: 'error', text: 'Please provide both video ID/URL and titles' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const cleanVideoId = extractVideoId(videoId.trim());
      const titlesArray = titlesText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

      if (titlesArray.length === 0) {
        setMessage({ type: 'error', text: 'No valid titles found' });
        setLoading(false);
        return;
      }

      const response = await fetch('/api/admin/set-titles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          videoId: cleanVideoId,
          titles: titlesArray,
          action: 'set'
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ 
          type: 'success', 
          text: `✅ Successfully set ${data.titleCount} titles for video ${cleanVideoId}` 
        });
        
        // Load the current titles to show confirmation
        loadCurrentTitles(token, cleanVideoId);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to set titles' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error occurred' });
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentTitles = async (token: string, vId?: string) => {
    const targetVideoId = vId || extractVideoId(videoId.trim());
    if (!targetVideoId) return;

    try {
      const response = await fetch(`/api/admin/set-titles?videoId=${targetVideoId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentTitles(data);
      }
    } catch (error) {
      console.error('Error loading current titles:', error);
    }
  };

  const handleGetTitles = async (token: string) => {
    if (!videoId.trim()) {
      setMessage({ type: 'error', text: 'Please provide a video ID/URL' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    const cleanVideoId = extractVideoId(videoId.trim());
    await loadCurrentTitles(token, cleanVideoId);
    
    setLoading(false);
  };

  const renderCurrentTitles = () => {
    if (!currentTitles || currentTitles.titleCount === 0) {
      return (
        <div className="text-gray-500 text-center py-4">
          No manual titles set for this video
        </div>
      );
    }

    const sortedTitles = Object.entries(currentTitles.titles)
      .sort(([a], [b]) => parseInt(a) - parseInt(b));

    return (
      <div className="space-y-2">
        {sortedTitles.map(([index, title]) => (
          <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded">
            <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
              {parseInt(index) + 1}
            </span>
            <span className="text-gray-800 flex-1">{title}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <AdminToken>
      {(token) => (
        <div className="min-h-screen bg-[hsl(var(--bg))]">
          <AdminHeader 
            title="Manual Title Management"
            subtitle="Provide manual titles for testimony clips"
          />
          
          <div className="max-w-4xl mx-auto p-6 space-y-8">
            {/* Set Titles Section */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Set Manual Titles</h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="videoId" className="block text-sm font-medium text-gray-700 mb-2">
                    YouTube Video ID or URL *
                  </label>
                  <input
                    id="videoId"
                    type="text"
                    value={videoId}
                    onChange={(e) => setVideoId(e.target.value)}
                    placeholder="e.g., dQw4w9WgXcQ or https://youtube.com/watch?v=dQw4w9WgXcQ"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="titles" className="block text-sm font-medium text-gray-700 mb-2">
                    Testimony Titles (one per line) *
                  </label>
                  <textarea
                    id="titles"
                    value={titlesText}
                    onChange={(e) => setTitlesText(e.target.value)}
                    placeholder={`Cancer Healed | University Admission | Visa Approved
Marriage Restored After 15 Years
From Bankruptcy to 50 Million Contract
Depression Lifted | Career Breakthrough`}
                    rows={8}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Enter one title per line. Use pipe (|) separation for multi-concept testimonies.
                    Order should match the order of testimonies in the video.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => handleSetTitles(token)}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Setting...' : 'Set Titles'}
                  </button>
                  
                  <button
                    onClick={() => handleGetTitles(token)}
                    disabled={loading}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Loading...' : 'View Current Titles'}
                  </button>
                </div>
              </div>

              {message.text && (
                <div className={`mt-4 p-3 rounded-md ${
                  message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                }`}>
                  {message.text}
                </div>
              )}
            </div>

            {/* Current Titles Section */}
            {currentTitles && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Current Manual Titles for {currentTitles.videoId}
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  {currentTitles.titleCount} manual titles set
                </p>
                {renderCurrentTitles()}
              </div>
            )}

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">How It Works</h3>
              <div className="text-sm text-blue-800 space-y-2">
                <p><strong>1. Process Video:</strong> First, process your YouTube video through the normal admin interface</p>
                <p><strong>2. Set Titles:</strong> Use this page to provide manual titles for the detected testimonies</p>
                <p><strong>3. Reprocess:</strong> Delete and reprocess the video - it will now use your manual titles</p>
                <p><strong>4. Multi-concept:</strong> Use pipe (|) separation for testimonies with multiple concepts</p>
              </div>
              
              <div className="mt-4 p-3 bg-blue-100 rounded">
                <p className="text-sm text-blue-800">
                  <strong>📝 Title Order:</strong> Provide titles in the same order as testimonies appear in the video.
                  The first title will be applied to the first testimony, second title to second testimony, etc.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminToken>
  );
}