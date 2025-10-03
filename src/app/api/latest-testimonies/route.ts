import { NextResponse } from 'next/server';

// This will store the latest processed testimonies in memory for testing
// In production, this would come from the database
let latestTestimonies: any[] = [];

export async function GET() {
  return NextResponse.json({
    success: true,
    count: latestTestimonies.length,
    testimonies: latestTestimonies,
    message: latestTestimonies.length > 0 
      ? `Found ${latestTestimonies.length} recently processed testimonies`
      : 'No testimonies have been processed yet. Process a video through /admin first.'
  });
}

export async function POST(request: Request) {
  try {
    const { testimonies } = await request.json();
    latestTestimonies = testimonies || [];
    
    return NextResponse.json({
      success: true,
      message: `Stored ${latestTestimonies.length} testimonies for viewing`
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to store testimonies' },
      { status: 500 }
    );
  }
}