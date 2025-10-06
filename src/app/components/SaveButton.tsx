'use client';

import { useState, useEffect, useCallback } from 'react';
import { ensureGuest, auth } from '../../../lib/authClient';

interface SaveButtonProps {
  clipId: string;
  className?: string;
  showText?: boolean;
  onSaveChange?: (saved: boolean) => void;
}

export default function SaveButton({
  clipId,
  className = '',
  showText = true,
  onSaveChange
}: SaveButtonProps) {
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUnsaveConfirm, setShowUnsaveConfirm] = useState(false);

  // Check initial saved state
  useEffect(() => {
    checkSavedState();
  }, [clipId]);

  const checkSavedState = async () => {
    try {
      setChecking(true);
      setError(null);
      
      // Ensure user is authenticated
      const user = await ensureGuest();
      const idToken = await user.getIdToken();
      
      // Check if clip is saved
      const response = await fetch(`/api/clips/${clipId}/saved`, {
        headers: { 
          Authorization: `Bearer ${idToken}` 
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setSaved(data.saved);
      }
    } catch (err) {
      console.error('[SaveButton] Error checking saved state:', err);
      // Don't show error for initial check
    } finally {
      setChecking(false);
    }
  };

  const toggle = async () => {
    console.log('[SaveButton] Toggle clicked, saved:', saved);

    // If currently saved, show confirmation before unsaving
    if (saved) {
      console.log('[SaveButton] Showing unsave confirmation dialog');
      setShowUnsaveConfirm(true);
      return;
    }

    // If not saved, proceed with saving immediately
    await performToggle();
  };

  const performToggle = async () => {
    try {
      setLoading(true);
      setError(null);

      // Ensure user is authenticated
      const user = await ensureGuest();
      const idToken = await user.getIdToken();

      // Optimistically update UI
      const newSavedState = !saved;
      setSaved(newSavedState);

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
        // Revert optimistic update on error
        setSaved(!newSavedState);

        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update save state');
      }

      const data = await response.json();

      // Handle edge cases from API response
      if (data.alreadySaved) {
        setSaved(true);
      } else if (data.wasNotSaved) {
        setSaved(false);
      }

      // Notify parent component if callback provided
      onSaveChange?.(newSavedState);

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save';
      console.error('[SaveButton] Error toggling save:', message);
      setError(message);

      // Show error briefly then clear
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const confirmUnsave = () => {
    console.log('[SaveButton] Confirmed unsave');
    setShowUnsaveConfirm(false);
    performToggle();
  };

  // Determine button styles
  const baseClasses = 'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
  const sizeClasses = showText ? 'px-4 py-2 text-sm' : 'p-2';
  const stateClasses = saved 
    ? 'bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500' 
    : 'border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-purple-500';
  const disabledClasses = (loading || checking) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';
  
  const finalClassName = `${baseClasses} ${sizeClasses} ${stateClasses} ${disabledClasses} ${className}`;

  // Render loading state for initial check
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
        onClick={toggle}
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
          <span>{loading ? 'Saving...' : saved ? 'Saved' : 'Save'}</span>
        )}
      </button>
      
      {/* Error toast */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-in slide-in-from-bottom-2">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Unsave Confirmation Dialog */}
      {showUnsaveConfirm && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setShowUnsaveConfirm(false)}
          />
          <div className="fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl z-50 w-[90%] max-w-sm p-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Remove from Saved?</h3>
              <p className="text-sm text-gray-600 mb-6">
                This will remove this testimony from your personal collection under My Testimony Wall.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowUnsaveConfirm(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Never Mind
                </button>
                <button
                  onClick={confirmUnsave}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  OK, Remove
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}