// Authentication helper functions for API routes
// Zero-Fallback Security Architecture: Rejects unauthenticated requests with 401/403

import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { Profile } from '@/types/database';
import { verifyAdminSession, COOKIE_NAME } from '@/lib/session';

interface AuthResult {
  user: Profile;
  token: string;
}

interface AuthError {
  error: string;
  status: number;
}

type AuthCheckResult = AuthResult | AuthError;

function isAuthError(result: AuthCheckResult): result is AuthError {
  return 'error' in result;
}

/**
 * Extract and verify authentication from Request Headers or Secure Cookies.
 * Enforces cryptographic verification with zero default/mock fallback.
 */
export async function getAuthenticatedUser(
  req: NextRequest
): Promise<AuthCheckResult> {
  // 1. Check HttpOnly Signed Admin Cookie (Primary Web Portal Session)
  const adminCookie = req.cookies.get(COOKIE_NAME)?.value;
  if (adminCookie) {
    const sessionPayload = await verifyAdminSession(adminCookie);
    if (sessionPayload && sessionPayload.role === 'admin') {
      const adminProfile: Profile = {
        id: sessionPayload.userId,
        email: sessionPayload.email,
        display_name: sessionPayload.displayName,
        register_number: 'ADMIN001',
        department: 'ECE',
        year: 'Staff',
        role: 'admin',
        created_at: new Date().toISOString(),
      };
      return { user: adminProfile, token: adminCookie };
    }
  }

  // 2. Check Authorization Header: Bearer <token>
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '').trim();

    // Check if token is a signed admin session token
    const verifiedSession = await verifyAdminSession(token);
    if (verifiedSession && verifiedSession.role === 'admin') {
      const adminProfile: Profile = {
        id: verifiedSession.userId,
        email: verifiedSession.email,
        display_name: verifiedSession.displayName,
        register_number: 'ADMIN001',
        department: 'ECE',
        year: 'Staff',
        role: 'admin',
        created_at: new Date().toISOString(),
      };
      return { user: adminProfile, token };
    }

    // Attempt Supabase JWT token verification
    try {
      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

      if (user && !authError) {
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (profile) {
          return { user: profile as Profile, token };
        }

        // Default profile if record exists in auth but pending in profiles
        return {
          user: {
            id: user.id,
            email: user.email || '',
            display_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            register_number: user.user_metadata?.register_number || '',
            department: user.user_metadata?.department || '',
            year: user.user_metadata?.year || '',
            role: (user.user_metadata?.role as any) || 'participant',
            created_at: user.created_at,
          },
          token,
        };
      }
    } catch {
      // Token invalid
    }
  }

  // 3. ZERO-FALLBACK: Reject unauthenticated requests
  return {
    error: 'Unauthorized: Access token or valid session required.',
    status: 401,
  };
}

/**
 * Enforce Admin role. Rejects non-admin or unauthenticated callers with 401/403.
 */
export async function requireAdmin(
  req: NextRequest
): Promise<AuthCheckResult> {
  const result = await getAuthenticatedUser(req);
  if (isAuthError(result)) {
    return result;
  }

  if (result.user.role !== 'admin') {
    return {
      error: 'Forbidden: Administrator privileges required.',
      status: 403,
    };
  }

  return result;
}

/**
 * Enforce Participant authentication.
 */
export async function requireParticipant(
  req: NextRequest
): Promise<AuthCheckResult> {
  const result = await getAuthenticatedUser(req);
  if (isAuthError(result)) {
    return result;
  }

  return result;
}

export { isAuthError };
export type { AuthResult, AuthError };
