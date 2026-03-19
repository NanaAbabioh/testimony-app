import { algoliasearch } from 'algoliasearch';

export const ALGOLIA_INDEX = 'clips';

// Search client (read-only, safe for server-side queries)
export const searchClient = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!,
  process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY!
);

// Admin client (write access, for indexing clips)
export const adminClient = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!,
  process.env.ALGOLIA_ADMIN_KEY!
);

export interface AlgoliaClipRecord {
  objectID: string;       // Firestore clip doc ID
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
    await adminClient.saveObject({
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
    await adminClient.deleteObject({ indexName: ALGOLIA_INDEX, objectID: id });
  } catch (err) {
    console.error(`[Algolia] Failed to delete clip ${id}:`, err);
  }
}
