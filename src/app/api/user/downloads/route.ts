import { NextResponse } from 'next/server';
import { adminDb } from '../../../../../lib/firebase-admin';

export async function GET() {
  try {
    // For now, return mock download data since we don't have user authentication
    // In a real app, this would fetch downloads for the authenticated user
    const mockDownloads = [
      {
        id: '1',
        testimonyId: 'mock-testimony-1',
        testimonyTitle: 'Miraculous Healing from Cancer',
        downloadedAt: '2025-01-19T10:00:00Z',
        fileSize: '3.2 MB',
        status: 'completed'
      },
      {
        id: '2',
        testimonyId: 'mock-testimony-2',
        testimonyTitle: 'Financial Breakthrough Story',
        downloadedAt: '2025-01-18T15:30:00Z',
        fileSize: '2.8 MB',
        status: 'completed'
      },
      {
        id: '3',
        testimonyId: 'mock-testimony-3',
        testimonyTitle: 'Marriage Restoration Miracle',
        downloadedAt: '2025-01-17T09:15:00Z',
        status: 'pending'
      },
      {
        id: '4',
        testimonyId: 'mock-testimony-4',
        testimonyTitle: 'Addiction Deliverance',
        downloadedAt: '2025-01-16T14:20:00Z',
        fileSize: '4.1 MB',
        status: 'completed'
      }
    ];

    return NextResponse.json({
      success: true,
      downloads: mockDownloads,
      totalCount: mockDownloads.length,
      completedCount: mockDownloads.filter(d => d.status === 'completed').length
    });

  } catch (error) {
    console.error('Error fetching downloads:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { testimonyId, testimonyTitle } = await request.json();

    if (!testimonyId || !testimonyTitle) {
      return NextResponse.json({
        success: false,
        error: 'testimonyId and testimonyTitle are required'
      }, { status: 400 });
    }

    // In a real app, this would:
    // 1. Add the download request to a queue
    // 2. Start the background process to extract audio
    // 3. Store the download record in the database
    
    const mockDownload = {
      id: `download-${Date.now()}`,
      testimonyId,
      testimonyTitle,
      downloadedAt: new Date().toISOString(),
      status: 'pending'
    };

    console.log(`Download requested for: ${testimonyTitle}`);

    return NextResponse.json({
      success: true,
      download: mockDownload,
      message: 'Download started. It will appear in your downloads when ready.'
    });

  } catch (error) {
    console.error('Error starting download:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { downloadId } = await request.json();

    if (!downloadId) {
      return NextResponse.json({
        success: false,
        error: 'downloadId is required'
      }, { status: 400 });
    }

    // In a real app, this would:
    // 1. Remove the download record from the database
    // 2. Delete the actual audio file from storage
    
    console.log(`Download deleted: ${downloadId}`);

    return NextResponse.json({
      success: true,
      message: 'Download deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting download:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}