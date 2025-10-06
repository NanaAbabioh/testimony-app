import { NextRequest, NextResponse } from 'next/server';
import { db, adminAuth } from '@/lib/firebaseAdmin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { idToken, savedClips } = body;

    if (!idToken) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Verify the Firebase ID token
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    if (!userId) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 });
    }

    // Store saved clips in Firestore under the user's document
    const userDocRef = db.collection('users').doc(userId);

    await userDocRef.set({
      savedClips: savedClips || [],
      lastSyncedAt: new Date().toISOString(),
      email: decodedToken.email || null
    }, { merge: true });

    console.log(`Synced ${savedClips?.length || 0} clips for user ${userId}`);

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${savedClips?.length || 0} clips`,
      syncedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error syncing clips:', error);
    return NextResponse.json({
      error: 'Failed to sync clips',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const idToken = searchParams.get('idToken');

    if (!idToken) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Verify the Firebase ID token
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    if (!userId) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 });
    }

    // Retrieve saved clips from Firestore
    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      return NextResponse.json({
        savedClips: [],
        lastSyncedAt: null,
        message: 'No saved clips found'
      });
    }

    const userData = userDoc.data();

    return NextResponse.json({
      savedClips: userData?.savedClips || [],
      lastSyncedAt: userData?.lastSyncedAt || null,
      email: userData?.email || null
    });

  } catch (error) {
    console.error('Error retrieving clips:', error);
    return NextResponse.json({
      error: 'Failed to retrieve clips',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}