'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AdminToken from '../../components/admin/AdminToken';
import AdminHeader from '../../../../components/admin/AdminHeader';
import { ArrowLeft, FloppyDisk, CheckCircle, Warning, Clock } from '@phosphor-icons/react';
import Link from 'next/link';

interface ClipData {
  id: string;
  title: string;
  categoryId: string;
  startTimeSeconds: number;
  endTimeSeconds: number;
  episode: string;
  briefDescription: string;
  language: string;
  sourceVideoId: string;
  status: string;
  createdAt: any;
}

interface Category {
  id: string;
  name: string;
}

interface VideoInfo {
  id: string;
  title: string;
  url: string;
}

function EditVideoClipsPageContent() {
  const searchParams = useSearchParams();
  const videoId = searchParams.get('videoId');
  const videoIds = searchParams.get('videoIds');
  
  const [clips, setClips] = useState<ClipData[]>([]);
  const [editedClips, setEditedClips] = useState<{[key: string]: ClipData}>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [multipleVideos, setMultipleVideos] = useState<VideoInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error' | 'info' | '', text: string}>({type: '', text: ''});

  useEffect(() => {
    if (videoId) {
      loadVideoInfo();
      loadClips();
      loadCategories();
    } else if (videoIds) {
      loadMultipleVideos();
      loadMultipleClips();
      loadCategories();
    }
  }, [videoId, videoIds]);

  const loadVideoInfo = async () => {
    if (!videoId) return;
    
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/videos?videoId=${videoId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.items && data.items.length > 0) {
          setVideoInfo(data.items[0]);
        }
      }
    } catch (error) {
      console.error('Error loading video info:', error);
    }
  };

  const loadClips = async () => {
    if (!videoId) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/videos/${videoId}/clips`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setClips(data.clips || []);
      } else {
        throw new Error('Failed to load clips');
      }
    } catch (error) {
      console.error('Error loading clips:', error);
      setMessage({type: 'error', text: 'Failed to load clips for this video'});
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadMultipleVideos = async () => {
    if (!videoIds) return;
    
    const ids = videoIds.split(',');
    const videosData: VideoInfo[] = [];
    
    try {
      const token = localStorage.getItem('adminToken');
      for (const id of ids) {
        const response = await fetch(`/api/admin/videos?videoId=${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.items && data.items.length > 0) {
            videosData.push(data.items[0]);
          }
        }
      }
      setMultipleVideos(videosData);
    } catch (error) {
      console.error('Error loading videos info:', error);
    }
  };

  const loadMultipleClips = async () => {
    if (!videoIds) return;
    
    const ids = videoIds.split(',');
    const allClips: ClipData[] = [];
    
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      for (const id of ids) {
        const response = await fetch(`/api/admin/videos/${id}/clips`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          allClips.push(...(data.clips || []));
        }
      }
      setClips(allClips);
    } catch (error) {
      console.error('Error loading clips:', error);
      setMessage({type: 'error', text: 'Failed to load clips for selected videos'});
    } finally {
      setLoading(false);
    }
  };

  const handleClipChange = (clipId: string, field: keyof ClipData, value: any) => {
    const clip = clips.find(c => c.id === clipId);
    if (!clip) return;

    setEditedClips(prev => ({
      ...prev,
      [clipId]: {
        ...(prev[clipId] || clip),
        [field]: value
      }
    }));
  };

  const formatTimeForInput = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const parseTimeFromInput = (timeStr: string): number => {
    const parts = timeStr.split(':').map(p => parseInt(p));
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    }
    return parseInt(timeStr) || 0;
  };

  const handleSaveAll = async (token: string) => {
    if (Object.keys(editedClips).length === 0) {
      setMessage({type: 'info', text: 'No changes to save'});
      return;
    }

    setSaving(true);
    setMessage({type: '', text: ''});

    let successCount = 0;
    let errorCount = 0;

    for (const [clipId, clipData] of Object.entries(editedClips)) {
      try {
        const response = await fetch(`/api/clips/${clipId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            title: clipData.title,
            categoryId: clipData.categoryId,
            startTimeSeconds: clipData.startTimeSeconds,
            endTimeSeconds: clipData.endTimeSeconds,
            episode: clipData.episode,
            briefDescription: clipData.briefDescription,
            language: clipData.language,
            status: 'published'
          })
        });

        if (response.ok) {
          successCount++;
        } else {
          errorCount++;
          console.error(`Failed to update clip ${clipId}`);
        }
      } catch (error) {
        errorCount++;
        console.error(`Error updating clip ${clipId}:`, error);
      }
    }

    setSaving(false);

    if (errorCount === 0) {
      setMessage({
        type: 'success', 
        text: `Successfully updated ${successCount} clip${successCount !== 1 ? 's' : ''}`
      });
      setEditedClips({});
      // Reload clips to show updated data
      if (videoId) {
        loadClips();
      } else if (videoIds) {
        loadMultipleClips();
      }
    } else {
      setMessage({
        type: 'error',
        text: `Updated ${successCount} clip${successCount !== 1 ? 's' : ''}, ${errorCount} failed`
      });
    }
  };

  const getClipValue = (clipId: string, field: keyof ClipData) => {
    if (editedClips[clipId] && editedClips[clipId][field] !== undefined) {
      return editedClips[clipId][field];
    }
    const clip = clips.find(c => c.id === clipId);
    return clip ? clip[field] : '';
  };

  const hasChanges = Object.keys(editedClips).length > 0;

  return (
    <AdminToken>
      {(token) => (
        <div className="min-h-screen bg-[hsl(var(--bg))]">
          <AdminHeader 
            title="Edit Video Testimonies"
            subtitle={
              videoInfo 
                ? `Editing clips from: ${videoInfo.title}`
                : multipleVideos.length > 0
                ? `Editing clips from ${multipleVideos.length} videos`
                : 'Edit all testimonies from selected videos'
            }
          />
          
          <main className="mx-auto max-w-7xl px-[var(--pad-medium)] py-8">
            {/* Navigation and Actions */}
            <div className="flex items-center justify-between mb-6">
              <Link 
                href="/admin" 
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft size={20} className="mr-2" />
                Back to Admin
              </Link>

              {hasChanges && (
                <div className="flex items-center gap-4">
                  <span className="text-sm text-amber-600">
                    {Object.keys(editedClips).length} unsaved change{Object.keys(editedClips).length !== 1 ? 's' : ''}
                  </span>
                  <button
                    onClick={() => handleSaveAll(token!)}
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <FloppyDisk size={16} />
                        Save & Publish All
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Message Display */}
            {message.text && (
              <div className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
                message.type === 'success' 
                  ? 'bg-green-50 border border-green-200 text-green-800'
                  : message.type === 'error'
                  ? 'bg-red-50 border border-red-200 text-red-800'
                  : 'bg-blue-50 border border-blue-200 text-blue-800'
              }`}>
                {message.type === 'success' && <CheckCircle size={20} className="flex-shrink-0 mt-0.5" />}
                {message.type === 'error' && <Warning size={20} className="flex-shrink-0 mt-0.5" />}
                <div>{message.text}</div>
              </div>
            )}

            {/* Video Info */}
            {videoInfo && (
              <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{videoInfo.title}</h2>
                    <p className="text-sm text-gray-600 mt-1">Video ID: {videoInfo.id}</p>
                  </div>
                  <a
                    href={videoInfo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View on YouTube →
                  </a>
                </div>
              </div>
            )}

            {/* Multiple Videos Info */}
            {multipleVideos.length > 0 && (
              <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">
                  Selected Videos ({multipleVideos.length})
                </h2>
                <div className="space-y-2">
                  {multipleVideos.map((video, index) => (
                    <div key={video.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                      <div>
                        <span className="font-medium text-gray-900">{index + 1}. {video.title}</span>
                        <span className="text-sm text-gray-500 ml-2">ID: {video.id}</span>
                      </div>
                      <a
                        href={video.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        YouTube →
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Clips Table */}
            {loading ? (
              <div className="bg-white rounded-lg border border-gray-200 p-8">
                <div className="flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading clips...</p>
                  </div>
                </div>
              </div>
            ) : clips.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-8">
                <div className="text-center">
                  <p className="text-gray-500">No clips found for this video</p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Title
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Category
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Episode
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Start Time
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          End Time
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Language
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {clips.map((clip) => {
                        const hasEdits = !!editedClips[clip.id];
                        return (
                          <tr key={clip.id} className={hasEdits ? 'bg-yellow-50' : ''}>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <input
                                type="text"
                                value={getClipValue(clip.id, 'title')}
                                onChange={(e) => handleClipChange(clip.id, 'title', e.target.value)}
                                className="w-full min-w-[200px] px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <select
                                value={getClipValue(clip.id, 'categoryId')}
                                onChange={(e) => handleClipChange(clip.id, 'categoryId', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                              >
                                <option value="">Select category</option>
                                {categories.map((category) => (
                                  <option key={category.id} value={category.id}>
                                    {category.name}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <input
                                type="text"
                                value={getClipValue(clip.id, 'episode')}
                                onChange={(e) => handleClipChange(clip.id, 'episode', e.target.value)}
                                className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <input
                                type="text"
                                defaultValue={formatTimeForInput(getClipValue(clip.id, 'startTimeSeconds') as number)}
                                onBlur={(e) => {
                                  const seconds = parseTimeFromInput(e.target.value);
                                  handleClipChange(clip.id, 'startTimeSeconds', seconds);
                                  e.target.value = formatTimeForInput(seconds);
                                }}
                                className="w-24 px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                                placeholder="00:00:00"
                              />
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <input
                                type="text"
                                defaultValue={formatTimeForInput(getClipValue(clip.id, 'endTimeSeconds') as number)}
                                onBlur={(e) => {
                                  const seconds = parseTimeFromInput(e.target.value);
                                  handleClipChange(clip.id, 'endTimeSeconds', seconds);
                                  e.target.value = formatTimeForInput(seconds);
                                }}
                                className="w-24 px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                                placeholder="00:00:00"
                              />
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <select
                                value={getClipValue(clip.id, 'language')}
                                onChange={(e) => handleClipChange(clip.id, 'language', e.target.value)}
                                className="px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                              >
                                <option value="English">English</option>
                                <option value="Twi">Twi</option>
                              </select>
                            </td>
                            <td className="px-4 py-4">
                              <textarea
                                value={getClipValue(clip.id, 'briefDescription')}
                                onChange={(e) => handleClipChange(clip.id, 'briefDescription', e.target.value)}
                                rows={1}
                                className="w-full min-w-[200px] px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
                              />
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                clip.status === 'published' 
                                  ? 'bg-green-100 text-green-800'
                                  : clip.status === 'reviewing'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {clip.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Footer Actions */}
            {clips.length > 0 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  {clips.length} clip{clips.length !== 1 ? 's' : ''} total
                </div>
                
                {hasChanges && (
                  <button
                    onClick={() => handleSaveAll(token!)}
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <FloppyDisk size={16} />
                        Save & Publish All
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </main>
        </div>
      )}
    </AdminToken>
  );
}

export default function EditVideoClipsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EditVideoClipsPageContent />
    </Suspense>
  );
}