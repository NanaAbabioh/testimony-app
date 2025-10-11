'use client';

import { useState } from 'react';
import AdminToken from '@/app/components/admin/AdminToken';
import AdminHeader from '@/components/admin/AdminHeader';
import Link from 'next/link';
import { Trash2, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';

export default function DeleteTodayClipsPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = async (token: string) => {
    if (!confirmDelete) {
      setError('Please confirm deletion by checking the box');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/admin/clips/delete-today', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Failed to delete clips');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
      setConfirmDelete(false);
    }
  };

  return (
    <AdminToken>
      {(token) => (
        <div className="min-h-screen bg-[hsl(var(--bg))]">
          <AdminHeader 
            title="Delete Today's Clips"
            subtitle="Remove all clips created on September 4, 2025"
          />

          <main className="mx-auto max-w-4xl px-[var(--pad-medium)] py-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                  <h2 className="text-xl font-semibold text-gray-900">
                    Delete All Clips from September 4, 2025
                  </h2>
                </div>
                
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-red-800 mb-2">⚠️ Warning</h3>
                  <ul className="text-red-700 space-y-1 text-sm">
                    <li>• This will permanently delete ALL clips created today (September 4, 2025)</li>
                    <li>• This action cannot be undone</li>
                    <li>• Associated video files will remain in storage but database entries will be removed</li>
                    <li>• This is useful for cleaning up duplicate imports or failed batch operations</li>
                  </ul>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-4">
                    {error}
                  </div>
                )}

                {result && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-green-800">{result.message}</div>
                        <div className="text-sm text-green-700 mt-2 space-y-1">
                          <div>Clips deleted: {result.deleted}</div>
                          <div>Video documents deleted: {result.videosDeleted}</div>
                          {result.details && (
                            <div className="mt-2 text-xs">
                              Date range: {new Date(result.details.dateRange.start).toLocaleString()} to {new Date(result.details.dateRange.end).toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="border-t pt-6">
                  <div className="flex items-start gap-3 mb-6">
                    <input
                      type="checkbox"
                      id="confirm"
                      checked={confirmDelete}
                      onChange={(e) => setConfirmDelete(e.target.checked)}
                      className="mt-1"
                    />
                    <label htmlFor="confirm" className="text-sm text-gray-700">
                      I understand that this action will permanently delete all clips created on September 4, 2025, and this cannot be undone.
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <Link
                      href="/admin"
                      className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
                    >
                      Cancel
                    </Link>
                    
                    <button
                      onClick={() => handleDelete(token!)}
                      disabled={loading || !confirmDelete}
                      className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4" />
                          Delete Today's Clips
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-sm font-medium text-blue-800 mb-2">ℹ️ Information</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• This tool is designed to clean up failed or duplicate imports</li>
                <li>• Only clips with createdAt timestamp of September 4, 2025 will be deleted</li>
                <li>• Video files in /public/clips/ will remain (can be manually deleted if needed)</li>
                <li>• To delete clips from a different date, the API endpoint would need modification</li>
              </ul>
            </div>
          </main>
        </div>
      )}
    </AdminToken>
  );
}