import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Check if demo admin credentials
    if (email === 'admin@electronicclub.edu' && password === 'ElectronicClub@2026') {
      return NextResponse.json({
        success: true,
        user: { id: 'demo-admin-id', display_name: 'Demo Admin', role: 'admin' },
        role: 'admin',
        session: { access_token: 'demo-admin-token', user: { id: 'demo-admin-id', email } },
      });
    }

    // Try Supabase auth
    try {
      const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        return NextResponse.json({ error: authError.message }, { status: 401 });
      }

      // Get profile
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      return NextResponse.json({
        success: true,
        user: profile || { id: authData.user.id, email, role: 'admin' },
        role: profile?.role || 'admin',
        session: authData.session,
      });
    } catch {
      return NextResponse.json({
        error: 'Authentication failed. Please verify your Supabase credentials in .env.local',
      }, { status: 401 });
    }
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

