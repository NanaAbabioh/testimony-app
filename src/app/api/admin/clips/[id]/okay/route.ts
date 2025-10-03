import { NextRequest, NextResponse } from 'next/server';
import { adminDb as db } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/requireAdmin';

interface OkayRequest {
  adminComments?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin token
    const authHeader = request.headers.get('authorization');
    const admin = await requireAdmin(authHeader || undefined);

    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clipId = params.id;
    const body: OkayRequest = await request.json();

    if (!clipId) {
      return NextResponse.json({ error: 'Clip ID is required' }, { status: 400 });
    }

    console.log(`[Clip Okay] Marking clip ${clipId} as okay (false positive) by admin ${admin.uid}`);

    // Get the clip document
    const clipRef = db!.collection('clips').doc(clipId);
    const clipDoc = await clipRef.get();

    if (!clipDoc.exists) {
      return NextResponse.json({ error: 'Clip not found' }, { status: 404 });
    }

    const clipData = clipDoc.data();

    // Mark clip as manually approved (false positive)
    const updateData = {
      // Mark as manually approved
      validationStatus: 'approved',
      validationApprovedAt: new Date().toISOString(),
      validationApprovedBy: admin.uid,
      validationAdminComments: body.adminComments || null,

      // Indicate this was a false positive
      falsePositive: true,
      falsePositiveReviewedAt: new Date().toISOString(),
      falsePositiveReviewedBy: admin.uid,

      // Set status to published if it wasn't already
      status: 'published',

      // Track manual review
      manuallyReviewed: true,
      reviewedAt: new Date().toISOString(),
      reviewedBy: admin.uid,

      // Clear any validation timestamp to mark as resolved
      lastValidatedAt: new Date().toISOString()
    };

    await clipRef.update(updateData);

    console.log(`[Clip Okay] Successfully marked clip ${clipId} as okay (false positive)`);

    return NextResponse.json({
      success: true,
      message: 'Clip marked as okay and released',
      clip: {
        id: clipId,
        title: clipData?.title,
        validationStatus: 'approved',
        falsePositive: true,
        status: 'published',
        approvedAt: updateData.validationApprovedAt,
        approvedBy: admin.uid
      }
    });

  } catch (error: any) {
    console.error('[Clip Okay] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to mark clip as okay' },
      { status: 500 }
    );
  }
}