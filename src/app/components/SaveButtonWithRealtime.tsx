'use client';

import { useState } from 'react';
import { ensureGuest } from '../../../lib/authClient';
import { useIsClipSaved } from '../../../lib/hooks/useUserSaves';

interface SaveButtonWithRealtimeProps {
  clipId: string;
  className?: string;
  showText?: boolean;
  useRealtime?: boolean; // Enable real-time Firestore updates
  onSaveChange?: (saved: boolean) => void;
}

export default function SaveButtonWithRealtime({ 
  clipId, 
  className = '',
  showText = true,
  useRealtime = false, // Default to API-based for better performance
  onSaveChange 
}: SaveButtonWithRealtimeProps) {
  // Real-time Firestore state (when enabled)
  const { isSaved: realtimeSaved, loading: realtimeLoading } = useIsClipSaved(
    useRealtime ? clipId : ''
  );

  // Local state for API-based approach
  const [apiSaved, setApiSaved] = useState(false);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiChecking, setApiChecking] = useState(!useRealtime);
  const [error, setError] = useState<string | null>(null);

  // Use realtime or API state based on mode
  const saved = useRealtime ? realtimeSaved : apiSaved;
  const loading = useRealtime ? false : apiLoading; // Don't show loading for realtime
  const checking = useRealtime ? realtimeLoading : apiChecking;

  // API-based save state check (only when not using realtime)
  const checkApiSavedState = async () => {
    if (useRealtime) return;

    try {
      setApiChecking(true);
      setError(null);
      
      const user = await ensureGuest();
      const idToken = await user.getIdToken();
      
      const response = await fetch(`/api/clips/${clipId}/saved`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setApiSaved(data.saved);
      }
    } catch (err) {
      console.error('[SaveButtonWithRealtime] Error checking API saved state:', err);
    } finally {
      setApiChecking(false);
    }
  };

  // Initial load for API mode
  useState(() => {
    if (!useRealtime) {
      checkApiSavedState();
    }
  });

  const toggleSave = async () => {
    try {
      setApiLoading(true);
      setError(null);
      
      const user = await ensureGuest();
      const idToken = await user.getIdToken();
      
      // Optimistically update for API mode
      if (!useRealtime) {
        const newSavedState = !saved;
        setApiSaved(newSavedState);
      }
      
      // Make API call
      const path = saved ? `/api/clips/${clipId}/unsave` : `/api/clips/${clipId}/save`;
      const response = await fetch(path, { 
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        // Revert optimistic update on error (API mode only)
        if (!useRealtime) {
          setApiSaved(!(!saved)); // Revert
        }
        
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update save state');
      }
      
      const data = await response.json();
      
      // Handle edge cases from API response (API mode only)
      if (!useRealtime) {
        if (data.alreadySaved) {
          setApiSaved(true);
        } else if (data.wasNotSaved) {
          setApiSaved(false);
        }
      }
      
      // Notify parent component
      onSaveChange?.(!saved);
      
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save';
      console.error('[SaveButtonWithRealtime] Error toggling save:', message);
      setError(message);
      
      // Show error briefly then clear
      setTimeout(() => setError(null), 3000);
    } finally {
      setApiLoading(false);
    }
  };

  // Button styles
  const baseClasses = 'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
  const sizeClasses = showText ? 'px-4 py-2 text-sm' : 'p-2';
  const stateClasses = saved 
    ? 'bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500' 
    : 'border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-purple-500';
  const disabledClasses = (loading || checking) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';
  
  const finalClassName = `${baseClasses} ${sizeClasses} ${stateClasses} ${disabledClasses} ${className}`;

  // Loading state for initial check
  if (checking) {
    return (
      <button 
        className={finalClassName}
        disabled
        aria-label="Loading save state"
      >
        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        {showText && <span>Loading...</span>}
      </button>
    );
  }

  return (
    <>
      <button
        className={finalClassName}
        onClick={toggleSave}
        disabled={loading}
        aria-label={saved ? 'Unsave clip' : 'Save clip'}
        aria-pressed={saved}
        title={saved ? 'Remove from saved' : 'Save for later'}
      >
        {loading ? (
          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : saved ? (
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z"/>
          </svg>
        ) : (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 20 20">
            <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z"/>
          </svg>
        )}
        
        {showText && (
          <span>
            {loading 
              ? 'Saving...' 
              : saved 
                ? `Saved${useRealtime ? ' ⚡' : ''}` 
                : 'Save'
            }
          </span>
        )}
      </button>
      
      {/* Error toast */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-in slide-in-from-bottom-2">
          <p className="text-sm">{error}</p>
        </div>
      )}
    </>
  );
}