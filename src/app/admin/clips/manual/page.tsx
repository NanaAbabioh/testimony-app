'use client';

import { useEffect, useState } from 'react';
import AdminToken from '@/app/components/admin/AdminToken';
import AdminHeader from '@/components/admin/AdminHeader';
import Link from 'next/link';
import CSVImporter from '@/app/components/admin/CSVImporter';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface Category {
  id: string;
  name: string;
}

export default function ManualClipPage() {
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single');

  useEffect(() => {
    // Check for URL parameter to set initial tab
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam === 'bulk') {
      setActiveTab('bulk');
    }
  }, []);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    categoryId: '',
    startTime: '',
    endTime: '',
    videoUrl: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [importProgress, setImportProgress] = useState<{
    processing: boolean;
    current: number;
    total: number;
    results?: any;
  }>({ processing: false, current: 0, total: 0 });

  useEffect(() => {
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

  const handleSubmit = async (e: React.FormEvent, token: string) => {
    e.preventDefault();
    if (!token) return;

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Use Railway backend for video processing
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || '';
      const apiUrl = backendUrl ? `${backendUrl}/api/admin/clips/manual` : '/api/admin/clips/manual';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: formData.title,
          categoryId: formData.categoryId,
          startTime: formData.startTime,
          endTime: formData.endTime,
          videoUrl: formData.videoUrl,
          description: formData.description
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ 
          type: 'success', 
          text: `Clip "${data.clip.title}" created successfully!` 
        });
        // Reset form
        setFormData({
          title: '',
          categoryId: '',
          startTime: '',
          endTime: '',
          videoUrl: '',
          description: ''
        });
      } else {
        setMessage({ 
          type: 'error', 
          text: data.error || 'Failed to create clip' 
        });
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: 'Network error. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminToken>
      {(token) => (
        <div className="min-h-screen bg-[hsl(var(--bg))]">
          <AdminHeader 
            title="Create Manual Clip"
            subtitle="Add testimony clips manually or import multiple clips from CSV files"
          />

          <main className="mx-auto max-w-6xl px-[var(--pad-medium)] py-8">
            {/* Tab Navigation */}
            <div className="bg-white rounded-t-lg shadow-sm border-b">
              <div className="flex">
                <button
                  onClick={() => setActiveTab('single')}
                  className={`flex-1 py-3 px-4 text-center font-medium transition-colors ${
                    activeTab === 'single'
                      ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Create Single Clip
                </button>
                <button
                  onClick={() => setActiveTab('bulk')}
                  className={`flex-1 py-3 px-4 text-center font-medium transition-colors ${
                    activeTab === 'bulk'
                      ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Bulk Import
                </button>
              </div>
            </div>

            <div className="bg-white rounded-b-lg shadow-sm p-6">
              {activeTab === 'single' ? (
                <>
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">Create Single Clip</h2>
                    <p className="text-gray-600">
                      Create a single testimony clip manually by providing the details below.
                    </p>
                  </div>

              {/* Message Display */}
              {message.text && (
                <div className={`mb-6 p-4 rounded-lg ${
                  message.type === 'success' 
                    ? 'bg-green-50 border border-green-200 text-green-800' 
                    : 'bg-red-50 border border-red-200 text-red-800'
                }`}>
                  {message.text}
                </div>
              )}

              {/* Form */}
              <form onSubmit={(e) => handleSubmit(e, token!)} className="space-y-6">
                {/* Title */}
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                    Clip Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g., Healing from Cancer"
                    required
                  />
                </div>

                {/* Category */}
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    id="category"
                    value={formData.categoryId}
                    onChange={(e) => setFormData({...formData, categoryId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Video URL */}
                <div>
                  <label htmlFor="videoUrl" className="block text-sm font-medium text-gray-700 mb-2">
                    YouTube Video URL *
                  </label>
                  <input
                    type="url"
                    id="videoUrl"
                    value={formData.videoUrl}
                    onChange={(e) => setFormData({...formData, videoUrl: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="https://www.youtube.com/watch?v=..."
                    required
                  />
                </div>

                {/* Time Range */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-2">
                      Start Time *
                    </label>
                    <input
                      type="text"
                      id="startTime"
                      value={formData.startTime}
                      onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="1:30 or 90 or 1:30:45"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Format: mm:ss, seconds, or hh:mm:ss
                    </p>
                  </div>
                  
                  <div>
                    <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-2">
                      End Time *
                    </label>
                    <input
                      type="text"
                      id="endTime"
                      value={formData.endTime}
                      onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="3:45 or 225 or 1:33:20"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Format: mm:ss, seconds, or hh:mm:ss
                    </p>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Brief description of the testimony..."
                  />
                </div>

                {/* Submit Button */}
                <div className="flex items-center justify-between pt-4">
                  <Link
                    href="/admin"
                    className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
                  >
                    Cancel
                  </Link>
                  
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
                          <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"></path>
                        </svg>
                        Creating...
                      </>
                    ) : (
                      '✨ Create Clip'
                    )}
                  </button>
                </div>
              </form>

                  {/* Help Section */}
                  <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="text-sm font-medium text-blue-800 mb-2">💡 Tips</h3>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Time formats: "1:30" (1 min 30 sec), "90" (90 seconds), or "1:30:45" (1 hour 30 min 45 sec)</li>
                      <li>• Make sure the YouTube URL is public and accessible</li>
                      <li>• Choose the most specific category that matches the testimony</li>
                      <li>• Keep titles descriptive but concise</li>
                    </ul>
                  </div>
                </>
              ) : (
                <BulkImportTab token={token!} categories={categories} />
              )}
            </div>
          </main>
        </div>
      )}
    </AdminToken>
  );
}

function BulkImportTab({ token, categories }: { token: string; categories: Category[] }) {
  const [importStatus, setImportStatus] = useState<{
    processing: boolean;
    message: string;
    type: 'success' | 'error' | 'info' | '';
  }>({ processing: false, message: '', type: '' });

  const handleCSVImport = async (clips: any[]) => {
    // Validate token before proceeding
    if (!token) {
      setImportStatus({
        processing: false,
        message: 'Invalid token - please refresh and login again',
        type: 'error'
      });
      return;
    }

    setImportStatus({ processing: true, message: 'Processing clips...', type: 'info' });

    try {
      // Create an abort controller with a 30-minute timeout for large imports
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1800000); // 30 minutes

      // Use Railway backend for video processing
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || '';
      const apiUrl = backendUrl ? `${backendUrl}/api/admin/clips/import` : '/api/admin/clips/import';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          clips,
          categories
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      const data = await response.json();

      if (response.ok) {
        const errorDetails = data.details?.errors?.length > 0 
          ? `\nFirst error: ${data.details.errors[0]?.error || 'Unknown error'}` 
          : '';
        
        setImportStatus({
          processing: false,
          message: `Successfully imported ${data.imported} clips${data.errors > 0 ? ` (${data.errors} errors)${errorDetails}` : ''}`,
          type: data.errors > 0 ? 'error' : 'success'
        });
      } else {
        // Handle specific error cases
        if (response.status === 401) {
          setImportStatus({
            processing: false,
            message: 'Authentication failed - please refresh and login again',
            type: 'error'
          });
        } else {
          setImportStatus({
            processing: false,
            message: data.error || 'Import failed',
            type: 'error'
          });
        }
      }
    } catch (error) {
      setImportStatus({
        processing: false,
        message: `Network error during import: ${error}`,
        type: 'error'
      });
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Bulk Import</h2>
        <p className="text-gray-600">
          Import multiple testimony clips from a CSV file. Categories must be provided in the CSV. AI will only generate titles for clips without titles.
        </p>
      </div>

      {importStatus.message && (
        <div className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
          importStatus.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800'
            : importStatus.type === 'error'
            ? 'bg-red-50 border border-red-200 text-red-800'
            : 'bg-blue-50 border border-blue-200 text-blue-800'
        }`}>
          {importStatus.type === 'success' && <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
          {importStatus.type === 'error' && <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
          {importStatus.processing && <Loader2 className="w-5 h-5 flex-shrink-0 mt-0.5 animate-spin" />}
          <div>{importStatus.message}</div>
        </div>
      )}

      <CSVImporter onImport={handleCSVImport} categories={categories} />

      {/* CSV Format Guide */}
      <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 mb-3">📋 CSV Format Guide</h3>
        <div className="space-y-3 text-sm text-gray-600">
          <div>
            <strong>Required Columns:</strong>
            <ul className="mt-1 ml-4 list-disc space-y-1">
              <li><code>Episode</code> - Episode number (e.g., 1087)</li>
              <li><code>YouTube Link</code> - Full YouTube URL</li>
              <li><code>Start Time</code> - Format: MM:SS or H:MM:SS</li>
              <li><code>End Time</code> - Format: MM:SS or H:MM:SS</li>
              <li><code>Language</code> - English or Twi</li>
              <li><code>Brief Description</code> - Description of the testimony</li>
            </ul>
          </div>
          <div>
            <strong>Optional Columns (recommended for Twi):</strong>
            <ul className="mt-1 ml-4 list-disc space-y-1">
              <li><code>Category</code> - Pre-fill for Twi testimonies</li>
              <li><code>Clip Title</code> - Pre-fill for Twi testimonies</li>
            </ul>
          </div>
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
            <strong className="text-yellow-800">Note:</strong>
            <span className="text-yellow-700 ml-2">
              For Twi testimonies, provide Category and Clip Title to avoid AI misinterpretation.
              English testimonies without these fields will be processed by AI automatically.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}