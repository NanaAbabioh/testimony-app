import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Temporary admin password (you should change this and use environment variables in production)
const ADMIN_PASSWORD = 'AlphaHour2025!';
const TOKEN_SECRET = process.env.ADMIN_TOKEN_SECRET || 'ah-admin-secret-2025';

function generateToken(): string {
  // Generate a random token
  const token = crypto.randomBytes(32).toString('hex');
  const timestamp = Date.now();
  
  // Create a signed token with timestamp
  const payload = `${token}.${timestamp}`;
  const signature = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(payload)
    .digest('hex');
  
  return `${payload}.${signature}`;
}

export function verifyToken(token: string): boolean {
  if (!token) return false;
  
  try {
    const [tokenPart, timestamp, signature] = token.split('.');
    
    if (!tokenPart || !timestamp || !signature) return false;
    
    // Check if token is expired (24 hours)
    const tokenAge = Date.now() - parseInt(timestamp);
    if (tokenAge > 24 * 60 * 60 * 1000) return false;
    
    // Verify signature
    const payload = `${tokenPart}.${timestamp}`;
    const expectedSignature = crypto
      .createHmac('sha256', TOKEN_SECRET)
      .update(payload)
      .digest('hex');
    
    return signature === expectedSignature;
  } catch (error) {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { success: false, error: 'Password is required' },
        { status: 400 }
      );
    }

    // Check password
    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { success: false, error: 'Invalid password' },
        { status: 401 }
      );
    }

    // Generate token
    const token = generateToken();

    return NextResponse.json({
      success: true,
      token,
      message: 'Login successful'
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}