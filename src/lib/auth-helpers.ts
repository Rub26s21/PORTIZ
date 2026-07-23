// Authentication helper functions for API routes

import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { Profile } from '@/types/database';

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

// Extract and verify the auth token from request
export async function getAuthenticatedUser(
  req: NextRequest
): Promise<AuthCheckResult> {
  const authHeader = req.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Missing or invalid authorization header', status: 401 };
  }

  const token = authHeader.replace('Bearer ', '');

  // Verify the token with Supabase
  const {
    data: { user },
    error: authError,
  } = await supabaseAdmin.auth.getUser(token);

  if (authError || !user) {
    return { error: 'Invalid or expired token', status: 401 };
  }

  // Get the profile
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return { error: 'Profile not found', status: 404 };
  }

  return { user: profile as Profile, token };
}

// Require admin role
export async function requireAdmin(
  req: NextRequest
): Promise<AuthCheckResult> {
  const result = await getAuthenticatedUser(req);

  if (isAuthError(result)) {
    return result;
  }

  if (result.user.role !== 'admin') {
    return { error: 'Admin access required', status: 403 };
  }

  return result;
}

// Require participant role
export async function requireParticipant(
  req: NextRequest
): Promise<AuthCheckResult> {
  const result = await getAuthenticatedUser(req);

  if (isAuthError(result)) {
    return result;
  }

  if (result.user.role !== 'participant') {
    return { error: 'Participant access required', status: 403 };
  }

  return result;
}

// Type guard export
export { isAuthError };
export type { AuthResult, AuthError };
