import { NextResponse } from 'next/server';
import { getSearchClient, ALGOLIA_INDEX } from '../../../../lib/algolia';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query    = searchParams.get('q') || '';
    const category = searchParams.get('category') || '';
    const from     = searchParams.get('from') || '';
    const to       = searchParams.get('to') || '';
    const sort     = searchParams.get('sort') || 'relevance';
    const limit    = parseInt(searchParams.get('limit') || '18', 10);
    const cursor   = searchParams.get('cursor') || '';

    if (!query.trim() && !category && !from && !to) {
      return NextResponse.json(
        { success: false, error: 'Search query or filters are required' },
        { status: 400 }
      );
    }

    // Build Algolia filter string
    const filters: string[] = [];
    if (category) filters.push(`category:"${category}"`);
    if (from)     filters.push(`serviceDate >= "${from}"`);
    if (to)       filters.push(`serviceDate <= "${to}"`);

    // Cursor-based pagination: decode page from cursor token
    let page = 0;
    if (cursor) {
      const decoded = parseInt(Buffer.from(cursor, 'base64').toString(), 10);
      if (!isNaN(decoded)) page = decoded;
    }

    const indexName =
      sort === 'newest'     ? `${ALGOLIA_INDEX}_newest`     :
      sort === 'most-saved' ? `${ALGOLIA_INDEX}_most_saved` :
      ALGOLIA_INDEX;

    const result = await getSearchClient().searchSingleIndex({
      indexName,
      searchParams: {
        query: query.trim(),
        filters: filters.join(' AND '),
        hitsPerPage: limit,
        page,
        attributesToRetrieve: [
          'objectID', 'title', 'titleShort', 'summaryShort',
          'category', 'videoId', 'thumbUrl', 'serviceDate',
          'savedCount', 'startTimeSeconds', 'endTimeSeconds', 'episode',
        ],
      },
    });

    const hits = result.hits as any[];
    const totalResults = result.nbHits ?? hits.length;
    const hasMore = (page + 1) < (result.nbPages ?? 1);
    const nextCursor = hasMore
      ? Buffer.from(String(page + 1)).toString('base64')
      : null;

    const testimonies = hits.map(hit => ({
      id: hit.objectID,
      title: hit.title,
      titleShort: hit.titleShort,
      summaryShort: hit.summaryShort,
      category: hit.category,
      videoId: hit.videoId,
      thumbUrl: hit.thumbUrl,
      serviceDate: hit.serviceDate,
      savedCount: hit.savedCount,
      startSec: hit.startTimeSeconds,
      endSec: hit.endTimeSeconds,
      episode: hit.episode,
      sourceVideo: {
        id: hit.videoId,
        episode: hit.episode,
      },
    }));

    return NextResponse.json({
      success: true,
      testimonies,
      totalResults,
      query: query || undefined,
      nextCursor,
    });

  } catch (error: any) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Failed to search testimonies', detail: error?.message || String(error) },
      { status: 500 }
    );
  }
}
