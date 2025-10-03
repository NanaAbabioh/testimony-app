'use client';

import { ClipDTO } from '../../../lib/types';
import SaveButton from './SaveButton';

interface ClipCardProps {
  clip: ClipDTO;
  showSaveButton?: boolean;
}

export default function ClipCard({ clip, showSaveButton = true }: ClipCardProps) {
  const handleSaveChange = (saved: boolean) => {
    console.log(`Clip ${clip.id} save state changed to:`, saved);
  };

  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-lg line-clamp-2">{clip.title}</h3>
        {showSaveButton && (
          <SaveButton 
            clipId={clip.id} 
            showText={false}
            onSaveChange={handleSaveChange}
          />
        )}
      </div>
      
      <div className="text-sm text-gray-600 space-y-1">
        <p>Category: {clip.categoryId}</p>
        <p>Duration: {Math.round(clip.endSec - clip.startSec)}s</p>
        <p>Date: {new Date(clip.serviceDate).toLocaleDateString()}</p>
        {clip.savedCount > 0 && (
          <p className="text-purple-600">
            💜 Saved by {clip.savedCount} {clip.savedCount === 1 ? 'person' : 'people'}
          </p>
        )}
      </div>
      
      <div className="mt-3 flex gap-2">
        <button className="flex-1 bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700 transition-colors">
          Watch
        </button>
        {showSaveButton && (
          <SaveButton 
            clipId={clip.id} 
            className="flex-1"
            onSaveChange={handleSaveChange}
          />
        )}
      </div>
    </div>
  );
}