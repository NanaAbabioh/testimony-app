import { NextResponse } from 'next/server';

// Simple in-memory storage for testing
const titleOverrides = new Map<string, { [clipIndex: number]: string }>();

/**
 * API endpoint for setting manual clip titles for videos
 * POST /api/admin/set-titles
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { videoId, titles, action = 'set' } = body;

    if (!videoId) {
      return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
    }

    switch (action) {
      case 'set':
        if (!titles || !Array.isArray(titles)) {
          return NextResponse.json({ error: 'Titles array is required for set action' }, { status: 400 });
        }

        // Store titles in memory for now
        const titleMap: { [clipIndex: number]: string } = {};
        titles.forEach((title: string, index: number) => {
          if (title && title.trim()) {
            titleMap[index] = title.trim();
          }
        });
        
        titleOverrides.set(videoId, titleMap);
        
        return NextResponse.json({
          success: true,
          message: `Set ${Object.keys(titleMap).length} manual titles for video ${videoId}`,
          videoId,
          titleCount: Object.keys(titleMap).length
        });

      case 'get':
        const overrides = titleOverrides.get(videoId) || {};
        
        return NextResponse.json({
          success: true,
          videoId,
          titles: overrides,
          titleCount: Object.keys(overrides).length
        });

      case 'clear':
        titleOverrides.delete(videoId);
        
        return NextResponse.json({
          success: true,
          message: `Cleared all manual titles for video ${videoId}`,
          videoId
        });

      case 'summary':
        const summary = {
          totalVideos: titleOverrides.size,
          totalTitles: 0,
          videoDetails: {} as any
        };

        for (const [vid, titles] of titleOverrides) {
          const titleCount = Object.keys(titles).length;
          summary.totalTitles += titleCount;
          summary.videoDetails[vid] = {
            titleCount,
            titles: titles
          };
        }
        
        return NextResponse.json({
          success: true,
          summary
        });

      default:
        return NextResponse.json({ error: 'Invalid action. Use: set, get, clear, or summary' }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ Error in set-titles API:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 });
  }
}

/**
 * GET endpoint for retrieving title overrides
 * GET /api/admin/set-titles?videoId=xyz or GET /api/admin/set-titles?action=summary
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('videoId');
    const action = searchParams.get('action');

    if (action === 'summary') {
      const summary = {
        totalVideos: titleOverrides.size,
        totalTitles: 0,
        videoDetails: {} as any
      };

      for (const [vid, titles] of titleOverrides) {
        const titleCount = Object.keys(titles).length;
        summary.totalTitles += titleCount;
        summary.videoDetails[vid] = {
          titleCount,
          titles: titles
        };
      }
      
      return NextResponse.json({
        success: true,
        summary
      });
    }

    if (videoId) {
      const overrides = titleOverrides.get(videoId) || {};
      
      return NextResponse.json({
        success: true,
        videoId,
        titles: overrides,
        titleCount: Object.keys(overrides).length
      });
    }

    return NextResponse.json({ error: 'Either videoId or action=summary is required' }, { status: 400 });

  } catch (error) {
    console.error('❌ Error in get titles API:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 });
  }
}