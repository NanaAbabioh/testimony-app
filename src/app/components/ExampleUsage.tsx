'use client';

import Player from './Player';
import TestimonyPlayer from './TestimonyPlayer';
import { ClipDTO } from '../../../lib/types';

// Example usage of the Player components
export default function ExampleUsage() {
  // Example clip data
  const sampleClip: ClipDTO = {
    id: 'sample-clip-123',
    videoId: 'dQw4w9WgXcQ', // Rick Roll as example
    title: 'Sample Testimony - Never Gonna Give You Up',
    startSec: 30,
    endSec: 90,
    categoryId: 'inspiration',
    serviceDate: '2024-01-15',
    savedCount: 42,
    status: 'live',
  };

  return (
    <div className="space-y-8 p-8">
      {/* Generic Player with HLS URL */}
      <div>
        <h2 className="text-xl font-bold mb-4">Generic Player (HLS)</h2>
        <Player 
          hlsUrl="https://example.com/video.m3u8"
          title="Sample HLS Video"
          thumbnail="https://via.placeholder.com/640x360"
          startTime={10}
          endTime={60}
          className="max-w-2xl"
        />
      </div>

      {/* Generic Player with YouTube URL */}
      <div>
        <h2 className="text-xl font-bold mb-4">Generic Player (YouTube)</h2>
        <Player 
          videoId="dQw4w9WgXcQ"
          title="Sample YouTube Video"
          startTime={30}
          endTime={90}
          className="max-w-2xl"
        />
      </div>

      {/* Testimony Player */}
      <div>
        <h2 className="text-xl font-bold mb-4">Testimony Player</h2>
        <TestimonyPlayer 
          clip={sampleClip}
          showInfo={true}
          className="max-w-4xl"
        />
      </div>

      {/* Testimony Player without info */}
      <div>
        <h2 className="text-xl font-bold mb-4">Testimony Player (Minimal)</h2>
        <TestimonyPlayer 
          clip={sampleClip}
          showInfo={false}
          className="max-w-2xl"
        />
      </div>
    </div>
  );
}