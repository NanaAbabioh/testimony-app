"use client";

import { useEffect, useState } from "react";
import { 
  getDataSaverPref, 
  setDataSaverPref, 
  isDataSaverEffective, 
  getDataSaverStatus,
  onDataSaverChange,
  type DataSaverPref 
} from "../../lib/dataSaver";

interface DataSaverToggleProps {
  variant?: 'default' | 'compact' | 'detailed';
  className?: string;
}

export default function DataSaverToggle({ variant = 'default', className = '' }: DataSaverToggleProps) {
  const [pref, setPref] = useState<DataSaverPref>("auto");
  const [effective, setEffective] = useState<boolean>(false);
  const [reason, setReason] = useState<string>("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Set mounted flag to prevent hydration mismatch
    setMounted(true);
    
    // Initialize state
    setPref(getDataSaverPref());
    setEffective(isDataSaverEffective());
    
    const status = getDataSaverStatus();
    setReason(status.reason);

    // Listen for preference changes from other components
    const cleanup = onDataSaverChange((isEffectiveNow) => {
      setEffective(isEffectiveNow);
      const newStatus = getDataSaverStatus();
      setReason(newStatus.reason);
    });

    return cleanup;
  }, []);

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newPref = e.target.value as DataSaverPref;
    setPref(newPref);
    setDataSaverPref(newPref);
    
    // Update effective state immediately
    setTimeout(() => {
      setEffective(isDataSaverEffective());
      const status = getDataSaverStatus();
      setReason(status.reason);
    }, 0);
  }

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return <div className={`flex items-center gap-2 text-sm ${className}`}>
      <span className="text-gray-400">Data Saver</span>
      <div className="border rounded px-2 py-1 bg-gray-50 text-gray-400 text-sm">Loading...</div>
    </div>;
  }

  const baseClasses = `flex items-center gap-2 text-sm ${className}`;

  if (variant === 'compact') {
    return (
      <div className={baseClasses}>
        <select 
          className="border rounded px-2 py-1 text-xs bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
          value={pref} 
          onChange={onChange}
          title={`Data Saver: ${reason}`}
        >
          <option value="auto">📶 Auto</option>
          <option value="on">🔋 Save Data</option>
          <option value="off">🎥 Full Quality</option>
        </select>
        <div className={`w-2 h-2 rounded-full ${effective ? "bg-green-500" : "bg-gray-400"}`} 
             title={effective ? "Data saver active" : "Data saver inactive"} />
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <div className={`${baseClasses} flex-col items-start gap-1`}>
        <div className="flex items-center gap-2">
          <span className="text-gray-700 font-medium">Data Saver Mode</span>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            effective 
              ? "bg-green-100 text-green-800" 
              : "bg-gray-100 text-gray-600"
          }`}>
            {effective ? "🔋 Active" : "📱 Inactive"}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <select 
            className="border rounded px-3 py-1 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
            value={pref} 
            onChange={onChange}
          >
            <option value="auto">📶 Auto (detect connection)</option>
            <option value="on">🔋 Always save data</option>
            <option value="off">🎥 Always full quality</option>
          </select>
        </div>
        
        <div className="text-xs text-gray-500">
          {reason}
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className={baseClasses}>
      <span className="text-gray-600 flex items-center gap-1">
        <span className="text-lg">🔋</span>
        Data Saver
      </span>
      
      <select 
        className="border rounded px-2 py-1 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors" 
        value={pref} 
        onChange={onChange}
      >
        <option value="auto">📶 Auto</option>
        <option value="on">🔋 On</option>
        <option value="off">🎥 Off</option>
      </select>
      
      <div className="flex items-center gap-1">
        <div className={`w-2 h-2 rounded-full ${effective ? "bg-green-500" : "bg-gray-400"}`} />
        <span className={`text-xs font-medium ${effective ? "text-green-700" : "text-gray-500"}`}>
          {effective ? "Active" : "Inactive"}
        </span>
      </div>
      
      {variant === 'default' && (
        <div className="text-xs text-gray-500 max-w-32 truncate" title={reason}>
          {reason}
        </div>
      )}
    </div>
  );
}

/**
 * Compact version specifically designed for headers/navbars
 */
export function DataSaverToggleCompact({ className = '' }: { className?: string }) {
  return <DataSaverToggle variant="compact" className={className} />;
}

/**
 * Detailed version for settings pages or modals
 */
export function DataSaverToggleDetailed({ className = '' }: { className?: string }) {
  return <DataSaverToggle variant="detailed" className={className} />;
}

/**
 * Simple indicator showing just the current status (no controls)
 */
export function DataSaverIndicator({ className = '' }: { className?: string }) {
  const [effective, setEffective] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setEffective(isDataSaverEffective());

    const cleanup = onDataSaverChange(setEffective);
    return cleanup;
  }, []);

  if (!mounted) return null;

  if (!effective) return null; // Only show when active

  return (
    <div className={`flex items-center gap-1 text-xs text-green-700 ${className}`}>
      <span className="text-green-500">🔋</span>
      <span className="font-medium">Data Saver Active</span>
    </div>
  );
}