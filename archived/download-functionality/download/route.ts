import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../../../lib/firebaseAdmin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const url = new URL(request.url);
    const format = url.searchParams.get('format') || 'video'; // 'video' or 'audio'

    console.log(`[Download API] Requesting download for clip ${id}, format: ${format}`);

    // Get clip data from Firestore
    const clipDoc = await db.collection('clips').doc(id).get();

    if (!clipDoc.exists) {
      console.log(`[Download API] Clip ${id} not found`);
      return NextResponse.json({ error: 'Clip not found' }, { status: 404 });
    }

    const clipData = clipDoc.data();
    const processedClipUrl = clipData?.processedClipUrl;

    if (!processedClipUrl) {
      console.log(`[Download API] Clip ${id} has no processed video file`);
      return NextResponse.json({ error: 'No video file available for this clip' }, { status: 404 });
    }

    console.log(`[Download API] Found processedClipUrl: ${processedClipUrl}`);

    // For now, we only support video downloads since audio files aren't stored
    if (format === 'audio') {
      return NextResponse.json({ error: 'Audio downloads not yet available' }, { status: 404 });
    }

    // If it's already a public URL, redirect to it for download
    if (processedClipUrl.startsWith('http')) {
      console.log(`[Download API] Redirecting to public URL: ${processedClipUrl}`);

      // Create a simple response that triggers download by setting proper headers
      const response = await fetch(processedClipUrl);
      if (!response.ok) {
        console.log(`[Download API] Failed to fetch file from URL: ${response.status}`);
        return NextResponse.json({ error: 'Video file not accessible' }, { status: 404 });
      }

      const arrayBuffer = await response.arrayBuffer();
      const contentType = response.headers.get('content-type') || 'video/mp4';

      return new NextResponse(arrayBuffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${clipData.title?.replace(/[^a-zA-Z0-9]/g, '_') || id}.mp4"`,
          'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
        },
      });
    }

    // If it's not a public URL, we need to generate a signed URL or handle it differently
    console.log(`[Download API] processedClipUrl is not a public URL: ${processedClipUrl}`);
    return NextResponse.json({ error: 'Video file not accessible' }, { status: 404 });

  } catch (error) {
    console.error(`[Download API] General error:`, error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}