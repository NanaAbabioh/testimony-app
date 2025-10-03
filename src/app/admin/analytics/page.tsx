"use client";

import { useEffect, useState } from "react";
import AdminToken from "../../components/admin/AdminToken";
import AdminHeader from "../../../../components/admin/AdminHeader";

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/analytics/read")
      .then(r => r.json())
      .then(result => {
        setData(result);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load analytics:", err);
        setError("Failed to load analytics data");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
            <div className="text-sm text-gray-500">Loading analytics...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-red-800 font-semibold mb-2">Error Loading Analytics</h2>
          <p className="text-red-600 text-sm">
            {error || "No analytics data available. The scheduled function may not have run yet."}
          </p>
        </div>
      </div>
    );
  }

  const s = data.last7d || {};

  return (
    <AdminToken>
      {(token) => (
        <div className="min-h-screen bg-[hsl(var(--bg))]">
          <AdminHeader 
            title="Analytics Dashboard"
            subtitle="Detailed insights and performance metrics for your testimony library"
          />
          
          <main className="mx-auto max-w-6xl px-[var(--pad-medium)] py-8">
            <div className="flex items-center justify-between mb-6">
              <div className="text-sm text-gray-500">
                Last updated: {data.updatedAtReadable || "Never"}
              </div>
            </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card label="Videos Processed" value={s.videosProcessed ?? 0} />
        <Card label="Clips Published" value={s.clipsPublished ?? 0} />
        <Card 
          label="Top Category" 
          value={s.topCategory?.categoryId ?? "-"} 
          subtitle={s.topCategory?.saves ? `${s.topCategory.saves} saves` : undefined}
        />
        <Card 
          label="Avg Time to Publish" 
          value={s.timeToPublishAvgHours ?? 0} 
          unit="hours"
        />
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card label="Total Saves" value={s.totalSaves ?? 0} />
        <Card label="Active Categories" value={s.activeCategories ?? 0} />
        <Card label="Flags Open" value={s.flagsOpen ?? 0} />
        <Card 
          label="Median Flag Age" 
          value={s.flagsMedianAgeHours ?? 0} 
          unit="hours"
        />
      </div>

      {/* Detailed Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Top Clips */}
        <div className="bg-white border rounded-lg p-4">
          <h2 className="font-semibold text-lg mb-3">Top Clips by Saves</h2>
          {s.topClips && s.topClips.length > 0 ? (
            <ul className="space-y-2">
              {s.topClips.map((clip: any, index: number) => (
                <li key={clip.clipId} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center gap-3">
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
                      #{index + 1}
                    </span>
                    <span className="text-sm truncate max-w-xs" title={clip.title}>
                      {clip.title}
                    </span>
                  </div>
                  <span className="text-gray-500 font-medium">{clip.saves} saves</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-gray-500 text-sm py-4 text-center">No clips with saves yet</div>
          )}
        </div>

        {/* Category Split */}
        <div className="bg-white border rounded-lg p-4">
          <h2 className="font-semibold text-lg mb-3">Category Performance</h2>
          {s.categorySplit && s.categorySplit.length > 0 ? (
            <ul className="space-y-2">
              {s.categorySplit.map((category: any, index: number) => (
                <li key={category.categoryId} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center gap-3">
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                      #{index + 1}
                    </span>
                    <span className="text-sm font-medium capitalize">
                      {category.categoryId}
                    </span>
                  </div>
                  <span className="text-gray-500 font-medium">{category.saves} saves</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-gray-500 text-sm py-4 text-center">No category data yet</div>
          )}
        </div>
      </div>

      {/* Insights */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h2 className="font-semibold text-blue-900 mb-3">📊 Insights & Next Actions</h2>
        <div className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <span className="text-blue-600 font-medium">Highlight:</span>
            <span className="text-blue-800">{s.highlight || "No significant activity"}</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-blue-600 font-medium">Next Action:</span>
            <span className="text-blue-800">{s.nextAction || "Monitor content performance"}</span>
          </div>
        </div>
      </div>

            {/* Footer */}
            <div className="mt-8 text-xs text-gray-500 border-t pt-4">
              <p>Analytics are updated daily at 6:00 AM EST. Data reflects the last 7 days of activity.</p>
            </div>
          </main>
        </div>
      )}
    </AdminToken>
  );
}

function Card({ 
  label, 
  value, 
  subtitle, 
  unit 
}: { 
  label: string; 
  value: any; 
  subtitle?: string; 
  unit?: string; 
}) {
  const displayValue = typeof value === "number" && unit !== "hours" 
    ? value.toLocaleString() 
    : value;
    
  const displayUnit = unit && typeof value === "number" && value !== 0 ? ` ${unit}` : "";

  return (
    <div className="bg-white border rounded-lg p-4">
      <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">
        {label}
      </div>
      <div className="text-2xl font-bold text-gray-900">
        {displayValue}{displayUnit}
      </div>
      {subtitle && (
        <div className="text-xs text-gray-600 mt-1">
          {subtitle}
        </div>
      )}
    </div>
  );
}