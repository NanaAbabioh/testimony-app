"use client";

import { useEffect, useState } from "react";
import AdminToken from "../../../components/admin/AdminToken";

type Clip = { 
  id: string; 
  title: string; 
  startSec: number; 
  endSec: number; 
  categoryId: string; 
  status: string; 
  transcript?: string; 
  transcriptLang?: string;
  duration: number;
  confidence?: number;
  source?: string;
};

export default function ReviewPage({ params }: { params: { videoId: string }}) {
  const [clips, setClips] = useState<Clip[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [videoInfo, setVideoInfo] = useState<any>(null);

  return (
    <AdminToken>
      {(token) => (
        <div className="container mx-auto p-4 max-w-7xl">
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <a 
                href="/admin" 
                className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                ← Back to Dashboard
              </a>
              <h1 className="text-2xl font-semibold">Review Video</h1>
            </div>
            
            {videoInfo && (
              <div className="bg-white border rounded-lg p-4 mb-6">
                <h2 className="font-semibold mb-2">{videoInfo.title}</h2>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>Video ID: {params.videoId}</span>
                  <span>Status: {videoInfo.status}</span>
                  {videoInfo.url && (
                    <a 
                      href={videoInfo.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      📺 View on YouTube
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          <ManualClipForm 
            token={token} 
            videoId={params.videoId} 
            onCreated={() => loadClips(token, params.videoId, setClips)} 
          />

          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Existing Clips ({clips.length})</h2>
              
              <div className="flex items-center gap-3">
                {selected.length > 0 && (
                  <>
                    <button 
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors" 
                      onClick={() => bulkAction(token, selected, "live", () => {
                        loadClips(token, params.videoId, setClips);
                        setSelected([]);
                      })}
                    >
                      📢 Publish Selected ({selected.length})
                    </button>
                    <button 
                      className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors" 
                      onClick={() => bulkAction(token, selected, "hidden", () => {
                        loadClips(token, params.videoId, setClips);
                        setSelected([]);
                      })}
                    >
                      🙈 Hide Selected ({selected.length})
                    </button>
                    <button 
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg border transition-colors" 
                      onClick={() => setSelected([])}
                    >
                      Clear Selection
                    </button>
                  </>
                )}
                <button 
                  className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-lg border transition-colors" 
                  onClick={() => loadClips(token, params.videoId, setClips)}
                >
                  🔄 Refresh
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading clips...</span>
              </div>
            ) : clips.length === 0 ? (
              <div className="bg-gray-50 border rounded-lg p-8 text-center">
                <div className="text-4xl mb-2">🎬</div>
                <p className="text-gray-600">No clips found for this video</p>
                <p className="text-sm text-gray-500 mt-1">Use the form above to create manual clips</p>
              </div>
            ) : (
              <ClipsList 
                clips={clips}
                selected={selected}
                onToggleSelect={toggleSelect}
                onSelectAll={handleSelectAll}
                token={token}
                onClipUpdated={() => loadClips(token, params.videoId, setClips)}
              />
            )}
          </div>

          <AutoLoadClips 
            token={token} 
            videoId={params.videoId} 
            setClips={setClips} 
            setVideoInfo={setVideoInfo}
            setLoading={setLoading}
          />
        </div>
      )}
    </AdminToken>
  );

  function toggleSelect(clipId: string, checked: boolean) {
    setSelected(prev => 
      checked 
        ? [...prev, clipId]
        : prev.filter(id => id !== clipId)
    );
  }

  function handleSelectAll(checked: boolean) {
    setSelected(checked ? clips.map(c => c.id) : []);
  }
}

function ManualClipForm({ token, videoId, onCreated }: { token: string|null; videoId: string; onCreated: () => void }) {
  const [formData, setFormData] = useState({
    title: "",
    categoryId: "",
    start: "",
    end: "",
    transcript: "",
    transcriptLang: "en"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [expanded, setExpanded] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setIsSubmitting(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/clips/manual", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          videoId,
          ...formData
        })
      });

      const result = await response.json();

      if (result.success) {
        setMessage("Clip created successfully!");
        setFormData({
          title: "",
          categoryId: "",
          start: "",
          end: "",
          transcript: "",
          transcriptLang: "en"
        });
        onCreated();
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage(`Error: ${result.error || "Unknown error"}`);
      }
    } catch (error) {
      setMessage(`Error: ${error}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="bg-white border rounded-lg overflow-hidden">
      <div 
        className="bg-blue-50 border-b p-4 cursor-pointer hover:bg-blue-100 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-blue-900">➕ Add Manual Clip</h2>
          <span className="text-blue-600">{expanded ? '▼' : '▶'}</span>
        </div>
      </div>

      {expanded && (
        <div className="p-6">
          {message && (
            <div className={`p-3 rounded-lg mb-4 ${
              message.includes('Error') 
                ? 'bg-red-50 border border-red-200 text-red-800' 
                : 'bg-green-50 border border-green-200 text-green-800'
            }`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Clip Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Amazing Healing Testimony"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <input
                  type="text"
                  value={formData.categoryId}
                  onChange={(e) => handleChange("categoryId", e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., healing, financial, breakthrough"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time *
                </label>
                <input
                  type="text"
                  value={formData.start}
                  onChange={(e) => handleChange("start", e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 1:23:45 or 123"
                  required
                  disabled={isSubmitting}
                />
                <p className="text-xs text-gray-500 mt-1">Format: hh:mm:ss, mm:ss, or seconds</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Time *
                </label>
                <input
                  type="text"
                  value={formData.end}
                  onChange={(e) => handleChange("end", e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 1:25:30 or 180"
                  required
                  disabled={isSubmitting}
                />
                <p className="text-xs text-gray-500 mt-1">Format: hh:mm:ss, mm:ss, or seconds</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Language (optional)
                </label>
                <input
                  type="text"
                  value={formData.transcriptLang}
                  onChange={(e) => handleChange("transcriptLang", e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., en, es, fr"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transcript (optional)
              </label>
              <textarea
                value={formData.transcript}
                onChange={(e) => handleChange("transcript", e.target.value)}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
                placeholder="Enter the clip transcript here..."
                disabled={isSubmitting}
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isSubmitting || !formData.title || !formData.categoryId || !formData.start || !formData.end}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Creating...
                  </div>
                ) : (
                  "Create Clip"
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function ClipsList({ clips, selected, onToggleSelect, onSelectAll, token, onClipUpdated }: {
  clips: Clip[];
  selected: string[];
  onToggleSelect: (id: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  token: string | null;
  onClipUpdated: () => void;
}) {
  return (
    <div className="bg-white border rounded-lg overflow-hidden">
      <div className="bg-gray-50 px-4 py-3 border-b">
        <label className="flex items-center gap-2 font-medium text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={selected.length === clips.length && clips.length > 0}
            onChange={(e) => onSelectAll(e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          Select All
        </label>
      </div>

      <div className="divide-y divide-gray-200">
        {clips.map((clip) => (
          <ClipRow
            key={clip.id}
            clip={clip}
            isSelected={selected.includes(clip.id)}
            onToggleSelect={(checked) => onToggleSelect(clip.id, checked)}
            token={token}
            onUpdated={onClipUpdated}
          />
        ))}
      </div>
    </div>
  );
}

function ClipRow({ clip, isSelected, onToggleSelect, token, onUpdated }: {
  clip: Clip;
  isSelected: boolean;
  onToggleSelect: (checked: boolean) => void;
  token: string | null;
  onUpdated: () => void;
}) {
  const [editing, setEditing] = useState(false);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return h > 0 
      ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
      : `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "live": return "bg-green-100 text-green-800";
      case "hidden": return "bg-gray-100 text-gray-800";
      case "reviewing": return "bg-orange-100 text-orange-800";
      default: return "bg-blue-100 text-blue-800";
    }
  };

  return (
    <div className={`p-4 ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'} transition-colors`}>
      <div className="flex items-start gap-4">
        <div className="pt-1">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onToggleSelect(e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-medium text-gray-900 truncate pr-4">{clip.title}</h3>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(clip.status)}`}>
              {clip.status}
            </span>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
            <span>⏱️ {formatTime(clip.startSec)} - {formatTime(clip.endSec)}</span>
            <span>📁 {clip.categoryId}</span>
            <span>⏳ {Math.round(clip.duration)}s</span>
            {clip.source && <span>📝 {clip.source}</span>}
            {clip.confidence && <span>🎯 {Math.round(clip.confidence * 100)}%</span>}
          </div>

          {clip.transcript && (
            <div className="bg-gray-50 border rounded p-2 text-sm text-gray-700 mt-2">
              <span className="font-medium">Transcript ({clip.transcriptLang || 'en'}):</span>
              <p className="mt-1 line-clamp-3">{clip.transcript}</p>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setEditing(!editing)}
            className="text-blue-600 hover:text-blue-800 px-3 py-1 text-sm font-medium"
          >
            {editing ? 'Cancel' : 'Edit'}
          </button>
        </div>
      </div>

      {editing && (
        <EditClipForm
          clip={clip}
          token={token}
          onSaved={() => {
            setEditing(false);
            onUpdated();
          }}
          onCancel={() => setEditing(false)}
        />
      )}
    </div>
  );
}

function EditClipForm({ clip, token, onSaved, onCancel }: {
  clip: Clip;
  token: string | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    title: clip.title,
    categoryId: clip.categoryId,
    startSec: clip.startSec,
    endSec: clip.endSec,
    transcript: clip.transcript || "",
    transcriptLang: clip.transcriptLang || ""
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!token) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/clips/${clip.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        onSaved();
      } else {
        console.error("Failed to save clip");
      }
    } catch (error) {
      console.error("Error saving clip:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mt-4 p-4 bg-white border rounded-lg space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            disabled={isSaving}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <input
            type="text"
            value={formData.categoryId}
            onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
            className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            disabled={isSaving}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start (seconds)</label>
          <input
            type="number"
            value={formData.startSec}
            onChange={(e) => setFormData(prev => ({ ...prev, startSec: Number(e.target.value) }))}
            className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            disabled={isSaving}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End (seconds)</label>
          <input
            type="number"
            value={formData.endSec}
            onChange={(e) => setFormData(prev => ({ ...prev, endSec: Number(e.target.value) }))}
            className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            disabled={isSaving}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
          <input
            type="text"
            value={formData.transcriptLang}
            onChange={(e) => setFormData(prev => ({ ...prev, transcriptLang: e.target.value }))}
            className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            disabled={isSaving}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Transcript</label>
        <textarea
          value={formData.transcript}
          onChange={(e) => setFormData(prev => ({ ...prev, transcript: e.target.value }))}
          className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
          rows={3}
          disabled={isSaving}
        />
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium disabled:bg-gray-400"
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
        <button
          onClick={onCancel}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded text-sm font-medium"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function AutoLoadClips({ token, videoId, setClips, setVideoInfo, setLoading }: any) {
  useEffect(() => {
    loadClips(token, videoId, setClips);
    loadVideoInfo(token, videoId, setVideoInfo, setLoading);
  }, [token, videoId]);
  return null;
}

async function loadClips(token: string|null, videoId: string, setClips: any) {
  if (!token) return;

  try {
    const response = await fetch(`/api/clips?videoId=${videoId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await response.json();
    setClips(data.clips || []);
  } catch (error) {
    console.error("Error loading clips:", error);
  }
}

async function loadVideoInfo(token: string|null, videoId: string, setVideoInfo: any, setLoading: any) {
  if (!token) return;

  try {
    const response = await fetch(`/api/admin/videos?videoId=${videoId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await response.json();
    setVideoInfo(data.video || { title: "Unknown Video", status: "unknown" });
  } catch (error) {
    console.error("Error loading video info:", error);
    setVideoInfo({ title: "Unknown Video", status: "unknown" });
  } finally {
    setLoading(false);
  }
}

async function bulkAction(token: string|null, clipIds: string[], status: "live"|"hidden", callback: () => void) {
  if (!token || !clipIds.length) return;

  try {
    const response = await fetch(`/api/admin/clips/bulk-publish`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ clipIds, status })
    });

    if (response.ok) {
      callback();
    }
  } catch (error) {
    console.error("Bulk action error:", error);
  }
}