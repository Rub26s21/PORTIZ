import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, isAuthError } from '@/lib/auth-helpers';

export async function GET(req: NextRequest) {
  try {
    const result = await getAuthenticatedUser(req);

    if (isAuthError(result)) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({ user: result.user });
  } catch (error) {
    console.error('Auth me error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
