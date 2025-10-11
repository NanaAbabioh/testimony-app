"use client";

import { useState } from "react";
import { DotsThreeVertical, ArrowSquareOut, Plus, ArrowClockwise, Trash, PencilSimple, Eraser } from "@phosphor-icons/react";
import { SkeletonRow } from "../ui/Skeleton";

interface VideoRow {
  id: string;
  title: string;
  originalTitle?: string;
  episodeNumber?: string;
  episodeTitle?: string;
  date: string;
  uploadDate?: string;
  testimoniesCount: number;
  youtubeUrl: string;
}

interface VideoTableProps {
  rows: VideoRow[];
  onRowMenu?: (id: string) => void;
  onDeleteVideo?: (id: string) => void;
  onClearTestimonies?: (id: string) => void;
  onEditTestimonies?: (id: string) => void;
  onBulkDelete?: (ids: string[]) => void;
  onBulkEdit?: (ids: string[]) => void;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onAddFirst?: () => void;
}

export default function VideoTable({ 
  rows, 
  onRowMenu,
  onDeleteVideo,
  onClearTestimonies,
  onEditTestimonies,
  onBulkDelete,
  onBulkEdit, 
  loading = false, 
  error = null,
  onRetry,
  onAddFirst
}: VideoTableProps) {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedRows(new Set(rows.map(r => r.id)));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleRowSelect = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedRows);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedRows(newSelected);
    setSelectAll(newSelected.size === rows.length);
  };

  // Error state
  if (error) {
    return (
      <div className="rounded-[18px] bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 shadow-[var(--shadow)] p-12">
        <div className="text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <p className="text-lg text-red-800 dark:text-red-200 mb-2">Failed to load videos</p>
          <p className="text-red-600 dark:text-red-300 mb-6">{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-[12px] font-medium shadow-md hover:shadow-lg active:scale-[1.03] transition-all duration-200"
            >
              <ArrowClockwise className="w-4 h-4" />
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  // Empty state
  if (!loading && rows.length === 0) {
    return (
      <div className="rounded-[18px] bg-[hsl(var(--bg-snow))] dark:bg-gray-800 border border-black/5 dark:border-white/10 shadow-[var(--shadow)] p-12">
        <div className="text-center">
          <div className="text-6xl mb-4">🗂️</div>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-2">No videos in library</p>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Get started by processing your first video</p>
          {onAddFirst && (
            <button
              onClick={onAddFirst}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#5050F0] hover:bg-[#4040E0] text-white rounded-[12px] font-medium shadow-md hover:shadow-lg active:scale-[1.03] transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
              Add First Video
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[18px] bg-[hsl(var(--bg-snow))] dark:bg-gray-800 border border-black/5 dark:border-white/10 shadow-[var(--shadow)] overflow-hidden">
      <div className="p-6 border-b border-black/5 dark:border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="font-serif text-lg font-semibold text-[#101030] dark:text-white">Video Library</h2>
            {selectedRows.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedRows.size} selected
                </span>
                {onBulkEdit && (
                  <button
                    onClick={() => onBulkEdit(Array.from(selectedRows))}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-[8px] shadow-sm hover:shadow-md active:scale-[1.03] transition-all duration-200"
                  >
                    <PencilSimple size={16} />
                    Edit
                  </button>
                )}
                {onBulkDelete && (
                  <button
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete ${selectedRows.size} video${selectedRows.size !== 1 ? 's' : ''}? This will also delete all associated testimonies. This action cannot be undone.`)) {
                        onBulkDelete(Array.from(selectedRows));
                      }
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-[8px] shadow-sm hover:shadow-md active:scale-[1.03] transition-all duration-200"
                  >
                    <Trash size={16} />
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {loading ? "Loading..." : `${rows.length} videos processed`}
          </div>
        </div>
      </div>

      <div className="overflow-auto max-h-96">
        <table className="w-full table-fixed">
          <thead className="bg-white/70 dark:bg-gray-900/70 backdrop-blur supports-[backdrop-filter]:sticky top-0 z-10">
            <tr className="border-b border-black/5 dark:border-white/10">
              <th className="py-3 px-3 text-left w-12">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded border-gray-300 dark:border-gray-600 text-[#5050F0] focus:ring-[#5050F0] focus:ring-offset-0"
                  aria-label="Select all videos"
                  disabled={loading}
                />
              </th>
              <th className="py-3 px-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-2/5">
                Video Details
              </th>
              <th className="py-3 px-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-1/6">
                Testimonies
              </th>
              <th className="py-3 px-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-1/6">
                Link
              </th>
              <th className="py-3 px-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-1/6">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-black/5 dark:divide-white/10">
            {loading ? (
              <>
                {[...Array(6)].map((_, i) => (
                  <SkeletonRow key={i} />
                ))}
              </>
            ) : (
              rows.map((row) => (
              <tr
                key={row.id}
                className="hover:bg-black/[0.02] hover:shadow-[var(--shadow-hover)] transition-all duration-200 focus-within:ring-2 focus-within:ring-[#5050F0] focus-within:ring-offset-1 focus-within:ring-offset-white"
                tabIndex={-1}
              >
                <td className="py-3 px-3 w-12">
                  <input
                    type="checkbox"
                    checked={selectedRows.has(row.id)}
                    onChange={(e) => handleRowSelect(row.id, e.target.checked)}
                    className="rounded border-gray-300 text-[#5050F0] focus:ring-[#5050F0] focus:ring-offset-0"
                    aria-label={`Select ${row.title}`}
                  />
                </td>
                <td className="py-4 px-3 w-2/5">
                  <div className="min-w-0">
                    {row.episodeNumber ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#5050F0]/10 text-[#5050F0] flex-shrink-0">
                            Episode {row.episodeNumber}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">
                            {row.date}
                          </span>
                        </div>
                        <div className="font-medium text-[#101030] dark:text-white leading-relaxed break-words">
                          {row.episodeTitle}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="font-medium text-[#101030] dark:text-white leading-relaxed break-words">
                          {row.title}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {row.date}
                        </div>
                      </div>
                    )}
                  </div>
                </td>
                <td className="py-3 px-3 w-1/6">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#703090]/10 dark:bg-[#703090]/20 text-[#703090] dark:text-[#B080D0]">
                    {row.testimoniesCount} testimonies
                  </span>
                </td>
                <td className="py-3 px-3 w-1/6">
                  {row.youtubeUrl && (
                    <a
                      href={row.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-[#5050F0] hover:text-[#4040E0] text-sm font-medium active:scale-[1.03] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#5050F0] focus:ring-offset-1 focus:ring-offset-white rounded-sm break-words"
                    >
                      <ArrowSquareOut className="w-4 h-4 mr-1 flex-shrink-0" aria-label="External link" />
                      <span className="break-words">Watch on YouTube</span>
                    </a>
                  )}
                </td>
                <td className="py-3 px-3 w-1/6">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEditTestimonies?.(row.id)}
                      className="inline-flex items-center p-1.5 border border-transparent rounded-[8px] text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-white active:scale-[1.03] transition-all duration-200"
                      aria-label={`Edit testimonies for ${row.title}`}
                      title="Edit Testimonies"
                    >
                      <PencilSimple className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onClearTestimonies?.(row.id)}
                      className="inline-flex items-center p-1.5 border border-transparent rounded-[8px] text-orange-500 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/20 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1 focus:ring-offset-white active:scale-[1.03] transition-all duration-200"
                      aria-label={`Clear testimonies for ${row.title}`}
                      title="Clear Testimonies"
                    >
                      <Eraser className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteVideo?.(row.id)}
                      className="inline-flex items-center p-1.5 border border-transparent rounded-[8px] text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 focus:ring-offset-white active:scale-[1.03] transition-all duration-200"
                      aria-label={`Delete ${row.title}`}
                      title="Delete Video"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                    {onRowMenu && (
                      <button
                        onClick={() => onRowMenu(row.id)}
                        className="inline-flex items-center p-1.5 border border-transparent rounded-[8px] text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-[#5050F0] focus:ring-offset-1 focus:ring-offset-white active:scale-[1.03] transition-all duration-200"
                        aria-label={`More actions for ${row.title}`}
                        title="More Actions"
                      >
                        <DotsThreeVertical className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}