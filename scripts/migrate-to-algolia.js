/**
 * One-time migration: pushes all Firestore clips to Algolia.
 * Run with: node scripts/migrate-to-algolia.js
 */

require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');
const { algoliasearch } = require('algoliasearch');

const ALGOLIA_INDEX = 'clips';
const BATCH_SIZE = 500;

// --- Firebase Admin init ---
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
    ),
  });
}
const db = admin.firestore();

// --- Algolia admin client ---
const client = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID,
  process.env.ALGOLIA_ADMIN_KEY
);

function toRecord(id, data) {
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

async function configureIndex() {
  console.log('⚙️  Configuring Algolia index settings...');
  await client.setSettings({
    indexName: ALGOLIA_INDEX,
    indexSettings: {
      searchableAttributes: [
        'title',
        'titleShort',
        'summaryShort',
      ],
      attributesForFaceting: ['category'],
      customRanking: ['desc(savedCount)', 'desc(serviceDate)'],
      // Typo tolerance
      typoTolerance: true,
      minWordSizefor1Typo: 4,
      minWordSizefor2Typos: 8,
      // Handle plurals: "years" matches "year", "babies" matches "baby"
      ignorePlurals: true,
      // Treat common filler words as optional so "18 years of barrenness"
      // still matches "18-Year Barrenness Broken"
      optionalWords: ['of', 'the', 'a', 'an', 'for', 'in', 'and', 'with'],
      queryType: 'prefixLast',
      // If no exact match found, progressively drop words until results appear
      removeWordsIfNoResults: 'allOptional',
    },
  });
  console.log('✅ Index settings configured.');
}

async function migrate() {
  await configureIndex();

  console.log('📦 Fetching all clips from Firestore...');
  const snapshot = await db.collection('clips').get();
  console.log(`📊 Found ${snapshot.size} clips.`);

  const records = snapshot.docs.map(doc => toRecord(doc.id, doc.data()));

  // Push in batches
  let pushed = 0;
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    await client.saveObjects({ indexName: ALGOLIA_INDEX, objects: batch });
    pushed += batch.length;
    console.log(`  ↑ Indexed ${pushed} / ${records.length}`);
  }

  console.log(`\n🎉 Migration complete! ${records.length} clips indexed in Algolia.`);
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
