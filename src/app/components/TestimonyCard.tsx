'use client';

import Link from 'next/link';
import TestimonyActions from './TestimonyActions';
import ClientOnly from './ClientOnly';

interface Testimony {
  id: string;
  title: string;
  fullText: string;
  startTimeSeconds: number;
  endTimeSeconds: number;
  sourceVideoId: string;
  sourceVideoTitle: string;
  thumbnailUrl: string;
  uploadDate: string;
}

interface TestimonyCardProps {
  testimony: Testimony;
  onPlay?: () => void;
}

export default function TestimonyCard({ testimony, onPlay }: TestimonyCardProps) {
  const formatDuration = (startSeconds: number, endSeconds: number) => {
    const duration = endSeconds - startSeconds;
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatTimestamp = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
      <div className="md:flex">
        {/* Thumbnail */}
        <div className="md:w-64 md:flex-shrink-0">
          <div className="relative h-48 md:h-full">
            <img
              src={testimony.thumbnailUrl}
              alt={testimony.sourceVideoTitle}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback to a placeholder if image fails to load
                e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDMyMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMTgwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNDQgNzJMMTc2IDg4TDE0NCAxMDRWNzJaIiBmaWxsPSIjOUI5QjlCIi8+Cjx0ZXh0IHg9IjE2MCIgeT0iMTMwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5QjlCOUIiPgpWaWRlbyBUaHVtYm5haWwKPC90ZXh0Pgo8L3N2Zz4K';
              }}
            />
            
            {/* Play Button Overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
              <Link
                href={`/watch/${testimony.id}`}
                className="bg-white bg-opacity-90 rounded-full p-3 transform hover:scale-110 transition-transform duration-200"
              >
                <svg className="w-6 h-6 text-gray-800 ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </Link>
            </div>
            
            {/* Duration Badge */}
            <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
              {formatDuration(testimony.startTimeSeconds, testimony.endTimeSeconds)}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 flex-1">
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
              {testimony.title}
            </h3>
            <Link
              href={`/watch/${testimony.id}`}
              className="ml-4 flex-shrink-0 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
              Play
            </Link>
          </div>

          {/* Testimony Preview */}
          <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-3">
            {testimony.fullText}
          </p>

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>
                {formatTimestamp(testimony.startTimeSeconds)} - {formatTimestamp(testimony.endTimeSeconds)}
              </span>
            </div>
            
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 110 2H4a1 1 0 110-2h3zM5 6v14a2 2 0 002 2h10a2 2 0 002-2V6H5z" />
              </svg>
              <span>{new Date(testimony.uploadDate).toLocaleDateString('en-CA')}</span>
            </div>
          </div>

          {/* Source Video */}
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500 truncate">
              From: {testimony.sourceVideoTitle}
            </p>
          </div>

          {/* Interactive Actions */}
          <ClientOnly fallback={<div className="mt-4 pt-4 border-t border-gray-100 h-12"></div>}>
            <TestimonyActions testimony={testimony} />
          </ClientOnly>
        </div>
      </div>
    </div>
  );
}