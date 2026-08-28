import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export const DEFAULT_SUBJECTS = [
  'Digital Electronics',
  'Microprocessors & Microcontrollers',
  'VLSI Design',
  'Signals & Systems',
  'Analog Circuits',
  'Communication Systems',
  'Control Systems',
  'Electromagnetic Fields',
  'Embedded Systems',
  'Basic Electrical Engineering',
];

export async function GET() {
  try {
    const { data: dbSubjects, error } = await supabaseAdmin
      .from('subjects')
      .select('*')
      .order('name', { ascending: true });

    if (error || !dbSubjects || dbSubjects.length === 0) {
      // Fallback if subjects table doesn't exist yet or is empty
      const fallback = DEFAULT_SUBJECTS.map((name, i) => ({
        id: `sub-${i + 1}`,
        name,
        code: `EC${300 + i}`,
      }));
      return NextResponse.json({ subjects: fallback });
    }

    return NextResponse.json({ subjects: dbSubjects });
  } catch (err: any) {
    // Fallback
    const fallback = DEFAULT_SUBJECTS.map((name, i) => ({
      id: `sub-${i + 1}`,
      name,
      code: `EC${300 + i}`,
    }));
    return NextResponse.json({ subjects: fallback });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, code, description } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Subject name is required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('subjects')
      .insert({
        name: name.trim(),
        code: code ? code.trim() : null,
        description: description ? description.trim() : null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ subject: data, success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
