"use client";

import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import { PencilSimple, X, FloppyDisk, CheckCircle, Check, Trash } from '@phosphor-icons/react';

interface ValidationIssue {
  id: string;
  title: string;
  episode: string;
  startTimeSeconds: number;
  endTimeSeconds: number;
  duration: number;
  formattedStartTime: string;
  formattedEndTime: string;
  formattedDuration: string;
  validation: {
    type?: 'time_validation' | 'video_extraction_failure';
    issues?: string[];
    message?: string;
    severity: 'low' | 'medium' | 'high';
    suggestedAction?: string;
    details?: {
      hasProcessedClipUrl?: boolean;
      hasVideoProcessingError?: boolean;
      videoProcessingError?: string | null;
      processedClipUrl?: string | null;
    };
  };
  categoryId: string;
  createdAt: string;
  sourceVideoId: string;
}

interface ValidationSummary {
  total: number;
  valid: number;
  flagged: number;
  highSeverity: number;
  mediumSeverity: number;
  lowSeverity: number;
  videoExtractionFailures?: number;
}

interface EditClipData {
  id: string;
  title: string;
  categoryId: string;
  startTimeSeconds: number;
  endTimeSeconds: number;
  episode: string;
  briefDescription?: string;
  language?: string;
  sourceVideoId: string;
}

export default function ClipValidation() {
  const [flaggedClips, setFlaggedClips] = useState<ValidationIssue[]>([]);
  const [summary, setSummary] = useState<ValidationSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    episode: '',
    severity: ''
  });
  const [editingClip, setEditingClip] = useState<EditClipData | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [categories, setCategories] = useState<Array<{id: string, name: string}>>([]);
  const [reextractingClips, setReextractingClips] = useState<Set<string>>(new Set());
  const [approvingClips, setApprovingClips] = useState<Set<string>>(new Set());
  const [okayingClips, setOkayingClips] = useState<Set<string>>(new Set());
  const [deletingClips, setDeletingClips] = useState<Set<string>>(new Set());

  const runValidation = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (filters.episode) params.set('episode', filters.episode);
      if (filters.severity) params.set('severity', filters.severity);

      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/clips/validate?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Validation failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setFlaggedClips(data.validation.flaggedClips || []);
        setSummary(data.validation.summary);
      } else {
        throw new Error(data.error || 'Validation failed');
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Validation error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runValidation();
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const handleApproveClip = async (clipId: string, clipTitle: string) => {
    if (!confirm(`Reprocess and release "${clipTitle}"?\n\nThis will re-extract the video clip from YouTube with updated processing. The clip will only be removed from the flagged list if reprocessing succeeds.`)) {
      return;
    }

    setApprovingClips(prev => new Set(prev).add(clipId));

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/clips/${clipId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'approve',
          adminComments: 'Manually reviewed and approved via validation interface'
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert(`✅ Clip "${clipTitle}" has been successfully reprocessed and released!\n\nThe clip has been re-extracted from YouTube and will no longer appear in flagged clips.`);
        // Refresh the validation results to update the UI
        runValidation();
      } else {
        const errorMessage = data.message || data.error || 'Unknown error';
        const details = data.details ? `\n\nDetails: ${data.details}` : '';
        alert(`❌ Reprocessing failed: ${errorMessage}${details}\n\nThe clip will remain flagged until successfully reprocessed.`);
      }
    } catch (error) {
      console.error('Approval error:', error);
      alert(`❌ Network error during reprocessing. Please check the console for details.`);
    } finally {
      setApprovingClips(prev => {
        const newSet = new Set(prev);
        newSet.delete(clipId);
        return newSet;
      });
    }
  };

  const handleOkayClip = async (clipId: string, clipTitle: string) => {
    if (!confirm(`Mark "${clipTitle}" as okay (false positive)?\n\nThis will remove the clip from the flagged list without reprocessing. Use this for clips that are flagged incorrectly but are actually fine as-is.`)) {
      return;
    }
    setOkayingClips(prev => new Set(prev).add(clipId));
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/clips/${clipId}/okay`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          adminComments: 'Marked as false positive via validation interface'
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert(`✅ Clip "${clipTitle}" has been marked as okay and released!\n\nThe clip has been removed from the flagged list as a false positive.`);
        // Refresh the validation results to update the UI
        runValidation();
      } else {
        const errorMessage = data.message || data.error || 'Unknown error';
        alert(`❌ Failed to mark clip as okay: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Okay error:', error);
      alert(`❌ Network error during okay operation. Please check the console for details.`);
    } finally {
      setOkayingClips(prev => {
        const newSet = new Set(prev);
        newSet.delete(clipId);
        return newSet;
      });
    }
  };

  const handleReextractVideo = async (clipId: string, clipTitle: string) => {
    if (!confirm(`This will re-extract the video for "${clipTitle}". This may take 30-60 seconds. Continue?`)) {
      return;
    }

    setReextractingClips(prev => new Set(prev).add(clipId));

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/clips/${clipId}/reextract`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        alert(`✅ Video re-extracted successfully for "${clipTitle}"! The clip now has the extracted video.`);
        // Refresh the validation results to update the UI
        runValidation();
      } else {
        alert(`❌ Re-extraction failed: ${data.error || 'Unknown error'}\n\nDetails: ${data.details || 'No additional details'}`);
      }
    } catch (error) {
      console.error('Re-extraction error:', error);
      alert(`❌ Network error during re-extraction. Please check the console for details.`);
    } finally {
      setReextractingClips(prev => {
        const newSet = new Set(prev);
        newSet.delete(clipId);
        return newSet;
      });
    }
  };

  const handleDeleteClip = async (clipId: string, clipTitle: string) => {
    if (!confirm(`⚠️ PERMANENT DELETION WARNING ⚠️\n\nAre you sure you want to PERMANENTLY DELETE "${clipTitle}"?\n\nThis will:\n• Remove the clip from the video library completely\n• Delete all clip data from Firebase\n• This action CANNOT be undone\n\nClick OK to permanently delete this clip.`)) {
      return;
    }

    setDeletingClips(prev => new Set(prev).add(clipId));

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/clips/${clipId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert(`✅ Clip "${clipTitle}" has been permanently deleted!\n\nThe clip has been completely removed from the library and Firebase.`);
        // Refresh the validation results to update the UI
        runValidation();
      } else {
        const errorMessage = data.message || data.error || 'Unknown error';
        alert(`❌ Deletion failed: ${errorMessage}\n\nThe clip could not be deleted. Please try again.`);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert(`❌ Network error during deletion. Please check the console for details.`);
    } finally {
      setDeletingClips(prev => {
        const newSet = new Set(prev);
        newSet.delete(clipId);
        return newSet;
      });
    }
  };

  const handleEditClip = async (clipId: string) => {
    try {
      const response = await fetch(`/api/clips/${clipId}`);

      if (response.ok) {
        const data = await response.json();
        setEditingClip({
          id: data.clip.id,
          title: data.clip.titleShort || '',
          categoryId: data.clip.categoryId || '',
          startTimeSeconds: data.clip.startSec || 0,
          endTimeSeconds: data.clip.endSec || 0,
          episode: data.clip.episode || '',
          briefDescription: data.clip.fullText || '',
          language: data.clip.language || 'English',
          sourceVideoId: data.clip.videoId || ''
        });
      } else {
        throw new Error('Failed to fetch clip data');
      }
    } catch (error) {
      console.error('Error loading clip for edit:', error);
      setError('Failed to load clip data for editing');
    }
  };

  const handleSaveClip = async () => {
    if (!editingClip) return;

    setEditLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/clips/${editingClip.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: editingClip.title,
          categoryId: editingClip.categoryId,
          startTimeSeconds: editingClip.startTimeSeconds,
          endTimeSeconds: editingClip.endTimeSeconds,
          episode: editingClip.episode,
          briefDescription: editingClip.briefDescription,
          language: editingClip.language,
          status: 'published' // Set to published when saving
        })
      });

      if (response.ok) {
        setEditingClip(null);
        // Refresh the validation results
        runValidation();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save clip');
      }
    } catch (error) {
      console.error('Error saving clip:', error);
      setError(error instanceof Error ? error.message : 'Failed to save clip');
    } finally {
      setEditLoading(false);
    }
  };

  const formatTimeForInput = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    // Always format as HH:MM:SS (00:00:00)
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const parseTimeFromInput = (timeStr: string): number => {
    const parts = timeStr.split(':').map(p => parseInt(p));
    if (parts.length === 3) {
      // HH:MM:SS format
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
      // MM:SS format (fallback)
      return parts[0] * 60 + parts[1];
    }
    // Direct seconds input (fallback)
    return parseInt(timeStr) || 0;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'low': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return '🚨';
      case 'medium': return '⚠️';
      case 'low': return '💡';
      default: return 'ℹ️';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h2 className="text-xl font-semibold mb-4">Clip Validation Detective</h2>
        <p className="text-gray-600 mb-4">
          Automatically detects suspicious timing data and video extraction failures that might indicate import errors or processing issues.
        </p>

        {/* Filters */}
        <div className="flex gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Episode</label>
            <input
              type="text"
              placeholder="e.g., 1084"
              className="px-3 py-2 border rounded-md"
              value={filters.episode}
              onChange={(e) => setFilters(prev => ({ ...prev, episode: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Severity</label>
            <select
              className="px-3 py-2 border rounded-md"
              value={filters.severity}
              onChange={(e) => setFilters(prev => ({ ...prev, severity: e.target.value }))}
            >
              <option value="">All</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button onClick={runValidation} disabled={loading}>
              {loading ? 'Scanning...' : 'Run Validation'}
            </Button>
          </div>
        </div>

        {/* Summary */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-7 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{summary.total}</div>
              <div className="text-sm text-gray-600">Total Clips</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{summary.valid}</div>
              <div className="text-sm text-gray-600">Valid</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{summary.flagged}</div>
              <div className="text-sm text-gray-600">Flagged</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{summary.videoExtractionFailures || 0}</div>
              <div className="text-sm text-gray-600">🎬 Video Fails</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{summary.highSeverity}</div>
              <div className="text-sm text-gray-600">High Risk</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{summary.mediumSeverity}</div>
              <div className="text-sm text-gray-600">Medium Risk</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{summary.lowSeverity}</div>
              <div className="text-sm text-gray-600">Low Risk</div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          Error: {error}
        </div>
      )}

      {/* Flagged Clips */}
      {flaggedClips.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-medium">Flagged Clips ({flaggedClips.length})</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {flaggedClips.map((clip) => (
              <div key={clip.id} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{clip.title}</h4>
                    <div className="text-sm text-gray-600 mt-1">
                      Episode {clip.episode} • ID: {clip.id}
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getSeverityColor(clip.validation.severity)}`}>
                    {getSeverityIcon(clip.validation.severity)} {clip.validation.severity.toUpperCase()}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                  <div>
                    <span className="font-medium">Start:</span> {clip.formattedStartTime}
                    <div className="text-xs text-gray-500">({clip.startTimeSeconds}s)</div>
                  </div>
                  <div>
                    <span className="font-medium">End:</span> {clip.formattedEndTime}
                    <div className="text-xs text-gray-500">({clip.endTimeSeconds}s)</div>
                  </div>
                  <div>
                    <span className="font-medium">Duration:</span> {clip.formattedDuration}
                    <div className="text-xs text-gray-500">({clip.duration}s)</div>
                  </div>
                </div>

                <div className={`p-3 rounded-md ${clip.validation.type === 'video_extraction_failure' ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}>
                  <div className="text-sm font-medium text-gray-700 mb-1">
                    {clip.validation.type === 'video_extraction_failure' ? '🎬 Video Extraction Issue:' : 'Issues detected:'}
                  </div>
                  
                  {clip.validation.type === 'video_extraction_failure' ? (
                    <div className="space-y-2">
                      <div className="text-sm text-red-700 font-medium">
                        {clip.validation.message}
                      </div>
                      {clip.validation.details && (
                        <div className="text-xs text-gray-600 space-y-1">
                          <div>Has processed clip URL: <span className={clip.validation.details.hasProcessedClipUrl ? 'text-green-600' : 'text-red-600'}>{clip.validation.details.hasProcessedClipUrl ? 'Yes' : 'No'}</span></div>
                          <div>Has processing error: <span className={clip.validation.details.hasVideoProcessingError ? 'text-red-600' : 'text-green-600'}>{clip.validation.details.hasVideoProcessingError ? 'Yes' : 'No'}</span></div>
                          {clip.validation.details.videoProcessingError && (
                            <div className="text-red-600 mt-1">Error: {clip.validation.details.videoProcessingError}</div>
                          )}
                        </div>
                      )}
                      <div className="text-sm font-medium text-red-700 mt-2 p-2 bg-red-100 rounded">
                        🚨 <strong>Action Required:</strong> This clip will show the full YouTube video instead of the extracted testimony. Consider re-importing this clip or manually fixing the timestamps.
                      </div>
                    </div>
                  ) : (
                    <>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {clip.validation.issues?.map((issue, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-red-400 mr-2">•</span>
                            {issue}
                          </li>
                        ))}
                      </ul>
                      {clip.validation.suggestedAction && (
                        <div className="text-sm font-medium text-blue-700 mt-2">
                          💡 {clip.validation.suggestedAction}
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="flex gap-2 mt-3 flex-wrap">
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white border-green-600"
                    onClick={() => handleApproveClip(clip.id, clip.title)}
                    disabled={approvingClips.has(clip.id)}
                  >
                    {approvingClips.has(clip.id) ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent mr-1"></div>
                        Reprocessing...
                      </>
                    ) : (
                      <>
                        <Check size={16} className="mr-1" />
                        Reprocess & Release
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                    onClick={() => handleOkayClip(clip.id, clip.title)}
                    disabled={okayingClips.has(clip.id)}
                  >
                    {okayingClips.has(clip.id) ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent mr-1"></div>
                        Marking...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={16} className="mr-1" />
                        Okay
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditClip(clip.id)}
                  >
                    <PencilSimple size={16} className="mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(`/watch/${clip.id}`, '_blank')}
                  >
                    Test Watch
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(`https://www.youtube.com/watch?v=${clip.sourceVideoId}&t=${clip.startTimeSeconds}`, '_blank')}
                  >
                    View on YouTube
                  </Button>
                  {clip.validation.type === 'video_extraction_failure' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => handleReextractVideo(clip.id, clip.title)}
                      disabled={reextractingClips.has(clip.id)}
                    >
                      {reextractingClips.has(clip.id) ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-2 border-red-600 border-t-transparent mr-1"></div>
                          Extracting...
                        </>
                      ) : (
                        '🎬 Re-extract Video'
                      )}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400"
                    onClick={() => handleDeleteClip(clip.id, clip.title)}
                    disabled={deletingClips.has(clip.id)}
                  >
                    {deletingClips.has(clip.id) ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-2 border-red-600 border-t-transparent mr-1"></div>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash size={16} className="mr-1" />
                        Delete
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {flaggedClips.length === 0 && !loading && summary && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg text-center">
          <div className="text-2xl mb-2">🎉</div>
          <div className="font-medium">No issues found!</div>
          <div className="text-sm">All {summary.total} clips have valid timing data.</div>
        </div>
      )}

      {/* Edit Clip Dialog */}
      {editingClip && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Edit Clip</h2>
              <button
                onClick={() => setEditingClip(null)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Clip Title *
                </label>
                <input
                  type="text"
                  value={editingClip.title}
                  onChange={(e) => setEditingClip({...editingClip, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter clip title"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  value={editingClip.categoryId}
                  onChange={(e) => setEditingClip({...editingClip, categoryId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Episode */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Episode
                </label>
                <input
                  type="text"
                  value={editingClip.episode}
                  onChange={(e) => setEditingClip({...editingClip, episode: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 1084"
                />
              </div>

              {/* Time Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Time *
                  </label>
                  <input
                    type="text"
                    defaultValue={formatTimeForInput(editingClip.startTimeSeconds)}
                    onBlur={(e) => {
                      const seconds = parseTimeFromInput(e.target.value);
                      setEditingClip({
                        ...editingClip, 
                        startTimeSeconds: seconds
                      });
                      // Update the input value to formatted version after blur
                      e.target.value = formatTimeForInput(seconds);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="00:01:30"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Format: HH:MM:SS (e.g., 00:01:30 for 1 minute 30 seconds)
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Time *
                  </label>
                  <input
                    type="text"
                    defaultValue={formatTimeForInput(editingClip.endTimeSeconds)}
                    onBlur={(e) => {
                      const seconds = parseTimeFromInput(e.target.value);
                      setEditingClip({
                        ...editingClip, 
                        endTimeSeconds: seconds
                      });
                      // Update the input value to formatted version after blur
                      e.target.value = formatTimeForInput(seconds);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="00:03:45"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Format: HH:MM:SS (e.g., 00:03:45 for 3 minutes 45 seconds)
                  </p>
                </div>
              </div>

              {/* Language */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Language
                </label>
                <select
                  value={editingClip.language}
                  onChange={(e) => setEditingClip({...editingClip, language: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="English">English</option>
                  <option value="Twi">Twi</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Brief Description
                </label>
                <textarea
                  value={editingClip.briefDescription || ''}
                  onChange={(e) => setEditingClip({...editingClip, briefDescription: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Brief description of the testimony..."
                />
              </div>

              {/* Duration Info */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">
                  <strong>Duration:</strong> {formatTimeForInput(editingClip.endTimeSeconds - editingClip.startTimeSeconds)} 
                  <span className="text-xs text-gray-500 ml-1">({editingClip.endTimeSeconds - editingClip.startTimeSeconds} seconds)</span>
                </div>
              </div>
            </div>

            {/* Dialog Actions */}
            <div className="flex items-center justify-end gap-4 p-6 border-t border-gray-200">
              <button
                onClick={() => setEditingClip(null)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveClip}
                disabled={editLoading || !editingClip.title || !editingClip.categoryId}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                {editLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} />
                    Save & Publish
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}