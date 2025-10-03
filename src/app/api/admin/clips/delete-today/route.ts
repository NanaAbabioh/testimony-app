import { NextRequest, NextResponse } from 'next/server';
import { adminDb as db } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/requireAdmin';
import * as admin from 'firebase-admin';

export async function DELETE(request: NextRequest) {
  try {
    // Verify admin token
    const authHeader = request.headers.get('authorization');
    const adminUser = await requireAdmin(authHeader || undefined);
    
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get today's date range (September 4, 2025)
    const todayStart = new Date('2025-09-04T00:00:00.000Z');
    const todayEnd = new Date('2025-09-04T23:59:59.999Z');
    
    console.log('🗑️ Deleting clips created between:', todayStart.toISOString(), 'and', todayEnd.toISOString());

    // Query clips created today
    const clipsSnapshot = await db!.collection('clips')
      .where('createdAt', '>=', todayStart.toISOString())
      .where('createdAt', '<=', todayEnd.toISOString())
      .get();

    console.log(`Found ${clipsSnapshot.size} clips to delete`);

    if (clipsSnapshot.empty) {
      return NextResponse.json({ 
        success: true, 
        message: 'No clips found for today',
        deleted: 0 
      });
    }

    // Delete clips in batches (Firestore batch limit is 500)
    const BATCH_SIZE = 500;
    let deleted = 0;
    
    // Process in batches
    const docs = clipsSnapshot.docs;
    for (let i = 0; i < docs.length; i += BATCH_SIZE) {
      const batch = db!.batch();
      const batchDocs = docs.slice(i, Math.min(i + BATCH_SIZE, docs.length));
      
      batchDocs.forEach(doc => {
        console.log(`Deleting clip: ${doc.data().title} (ID: ${doc.id})`);
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      deleted += batchDocs.length;
      console.log(`Batch deleted: ${deleted}/${docs.length} clips`);
    }

    // Also check for any orphaned video documents created today
    const videosSnapshot = await db!.collection('videos')
      .where('createdAt', '>=', todayStart.toISOString())
      .where('createdAt', '<=', todayEnd.toISOString())
      .get();
    
    let videosDeleted = 0;
    if (!videosSnapshot.empty) {
      const videoBatch = db!.batch();
      videosSnapshot.docs.forEach(doc => {
        console.log(`Deleting video document: ${doc.id}`);
        videoBatch.delete(doc.ref);
        videosDeleted++;
      });
      await videoBatch.commit();
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully deleted ${deleted} clips and ${videosDeleted} video documents from September 4, 2025`,
      deleted,
      videosDeleted,
      details: {
        dateRange: {
          start: todayStart.toISOString(),
          end: todayEnd.toISOString()
        }
      }
    });

  } catch (error: any) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete clips' },
      { status: 500 }
    );
  }
}

// Also support POST for easier testing from browser
export async function POST(request: NextRequest) {
  return DELETE(request);
}