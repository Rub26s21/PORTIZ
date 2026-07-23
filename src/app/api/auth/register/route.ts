import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, display_name, register_number, department, year } = body;

    if (!email || !password || !display_name || !register_number || !department || !year) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    // Check if register number already exists
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('register_number', register_number)
      .single();

    if (existingProfile) {
      return NextResponse.json({ error: 'Register number already in use' }, { status: 409 });
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        display_name,
        role: 'participant',
      },
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    // Update profile with additional fields
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        register_number,
        department,
        year,
        display_name,
      })
      .eq('id', authData.user.id);

    if (profileError) {
      // Profile might not exist yet (trigger delay), try insert
      await supabaseAdmin.from('profiles').upsert({
        id: authData.user.id,
        email,
        register_number,
        display_name,
        department,
        year,
        role: 'participant',
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Registration successful',
    }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
