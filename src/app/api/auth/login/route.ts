import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { signAdminSession, COOKIE_NAME } from '@/lib/session';
import { checkRateLimit, getClientIp } from '@/lib/rate-limiter';

export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limiter Defense (Max 5 attempts per minute per IP to prevent brute-force)
    const clientIp = getClientIp(req);
    const rateLimit = checkRateLimit(`login:${clientIp}`, 5, 60 * 1000);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: `Too many login attempts. Please wait ${rateLimit.retryAfterSeconds} seconds before trying again.`,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.retryAfterSeconds),
          },
        }
      );
    }

    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // 2. Production Admin Credentials Check
    const emailClean = String(email).trim().toLowerCase();
    if (
      emailClean === 'rubahanponraj@gmail.com' &&
      (password === 'rubahanponraj' || password === 'Rub26s21')
    ) {
      const adminUser = {
        id: '00000000-0000-0000-0000-000000000000',
        email: 'rubahanponraj@gmail.com',
        displayName: 'Rubahan Ponraj (Admin)',
      };

      // Generate cryptographically signed HMAC-SHA256 session token
      const sessionToken = await signAdminSession(adminUser);

      const response = NextResponse.json({
        success: true,
        user: {
          id: adminUser.id,
          display_name: adminUser.displayName,
          role: 'admin',
          email: adminUser.email,
        },
        role: 'admin',
        session: {
          access_token: sessionToken,
          user: { id: adminUser.id, email: adminUser.email },
        },
      });

      // Issue HttpOnly secure cookie for web portal & Edge middleware
      response.cookies.set({
        name: COOKIE_NAME,
        value: sessionToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 24 * 60 * 60, // 24 hours
      });

      return response;
    }

    // 3. Supabase Auth Check
    try {
      const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
        email: emailClean,
        password,
      });

      if (authError || !authData.user) {
        return NextResponse.json({ error: authError?.message || 'Invalid credentials' }, { status: 401 });
      }

      // Check profile role
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      const userRole = profile?.role || 'participant';

      let sessionToken = authData.session?.access_token || '';

      const response = NextResponse.json({
        success: true,
        user: profile || { id: authData.user.id, email: emailClean, role: userRole },
        role: userRole,
        session: authData.session,
      });

      // If user is an admin, also generate our signed admin token for seamless Edge middleware verification
      if (userRole === 'admin') {
        const signedAdminToken = await signAdminSession({
          id: authData.user.id,
          email: emailClean,
          displayName: profile?.display_name || 'Admin',
        });

        response.cookies.set({
          name: COOKIE_NAME,
          value: signedAdminToken,
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 24 * 60 * 60,
        });
      }

      return response;
    } catch {
      return NextResponse.json({
        error: 'Authentication failed. Please check your credentials.',
      }, { status: 401 });
    }
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
