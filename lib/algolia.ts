import { algoliasearch } from 'algoliasearch';

export const ALGOLIA_INDEX = 'clips';

// Lazy initialization — clients created on first use, not at module load time.
// This prevents Next.js build failures when env vars aren't available during
// the static analysis / page data collection phase.
let _searchClient: ReturnType<typeof algoliasearch> | null = null;
let _adminClient: ReturnType<typeof algoliasearch> | null = null;

const ALGOLIA_APP_ID = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || '7NDPGA6KYD';
const ALGOLIA_SEARCH_KEY = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY || 'f566dc934ce7fa1e3336f934b260202d';

export function getSearchClient() {
  if (!_searchClient) {
    _searchClient = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_SEARCH_KEY);
  }
  return _searchClient;
}

function getAdminClient() {
  if (!_adminClient) {
    _adminClient = algoliasearch(
      ALGOLIA_APP_ID,
      process.env.ALGOLIA_ADMIN_KEY!
    );
  }
  return _adminClient;
}

export interface AlgoliaClipRecord {
  objectID: string;
  title: string;
  titleShort: string;
  summaryShort: string;
  category: string;
  videoId: string;
  thumbUrl: string;
  serviceDate: string;
  savedCount: number;
  startTimeSeconds: number;
  endTimeSeconds: number;
  episode: string;
}

export function toAlgoliaRecord(id: string, data: any): AlgoliaClipRecord {
  return {
    objectID: id,
    title: data.title || '',
    titleShort: data.titleShort || data.title || '',
    summaryShort: data.summaryShort || '',
    category: data.category || data.categoryId || '',
    videoId: data.sourceVideoId || data.videoId || '',
    thumbUrl: data.thumbUrl || `https://i.ytimg.com/vi/${data.sourceVideoId || data.videoId}/hqdefault.jpg`,
    serviceDate: data.serviceDate || '',
    savedCount: data.savedCount || 0,
    startTimeSeconds: data.startTimeSeconds || 0,
    endTimeSeconds: data.endTimeSeconds || 0,
    episode: data.episode || '',
  };
}

/** Index or update a single clip in Algolia */
export async function indexClip(id: string, data: any) {
  try {
    await getAdminClient().saveObject({
      indexName: ALGOLIA_INDEX,
      body: toAlgoliaRecord(id, data),
    });
  } catch (err) {
    console.error(`[Algolia] Failed to index clip ${id}:`, err);
  }
}

/** Remove a clip from the Algolia index */
export async function deleteClipFromIndex(id: string) {
  try {
    await getAdminClient().deleteObject({ indexName: ALGOLIA_INDEX, objectID: id });
  } catch (err) {
    console.error(`[Algolia] Failed to delete clip ${id}:`, err);
  }
}
