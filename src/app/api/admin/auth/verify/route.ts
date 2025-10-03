import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '../login/route';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token is required' },
        { status: 400 }
      );
    }

    const isValid = verifyToken(token);

    return NextResponse.json({
      success: isValid,
      valid: isValid
    });

  } catch (error) {
    console.error('Verify error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}