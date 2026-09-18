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

// Helper to generate a clean subject code (e.g. "DE301", "VLSI302", "EC310")
function generateSubjectCode(name: string, index: number): string {
  const words = name.trim().split(/[\s&/_-]+/);
  let codePrefix = '';
  if (words.length >= 2) {
    codePrefix = words.map((w) => w[0]?.toUpperCase() || '').slice(0, 3).join('');
  } else if (name.length >= 3) {
    codePrefix = name.substring(0, 3).toUpperCase();
  } else {
    codePrefix = 'EC';
  }
  return `${codePrefix}${301 + index}`;
}

export async function GET() {
  try {
    // 1. Fetch all subjects currently in `subjects` table
    const { data: dbSubjects } = await supabaseAdmin
      .from('subjects')
      .select('*')
      .order('created_at', { ascending: true });

    const existingMap = new Map<string, any>();
    (dbSubjects || []).forEach((s) => {
      existingMap.set(s.name.trim().toLowerCase(), s);
    });

    // 2. Scan `questions` table for all unique subject_name & category strings
    const { data: qSubjects } = await supabaseAdmin
      .from('questions')
      .select('subject_name, category');

    const discoveredNames = new Set<string>();
    (qSubjects || []).forEach((q) => {
      if (q.subject_name && q.subject_name.trim()) {
        discoveredNames.add(q.subject_name.trim());
      }
      if (q.category && q.category.trim()) {
        discoveredNames.add(q.category.trim());
      }
    });

    // Also include default subjects if database is brand new
    DEFAULT_SUBJECTS.forEach((name) => discoveredNames.add(name));

    // 3. Auto-register any new subjects found in `questions` into `subjects` table
    const newSubjectsToInsert: { name: string; code: string; description: string }[] = [];
    let currentCount = existingMap.size;

    discoveredNames.forEach((name) => {
      const lower = name.toLowerCase();
      if (!existingMap.has(lower)) {
        const code = generateSubjectCode(name, currentCount);
        newSubjectsToInsert.push({
          name: name,
          code: code,
          description: `Auto-synchronized subject bank from uploaded questions`,
        });
        currentCount++;
      }
    });

    if (newSubjectsToInsert.length > 0) {
      const { data: inserted } = await supabaseAdmin
        .from('subjects')
        .insert(newSubjectsToInsert)
        .select('*');

      if (inserted) {
        inserted.forEach((s) => {
          existingMap.set(s.name.trim().toLowerCase(), s);
        });
      }
    }

    // 4. Return all synchronized subjects
    const allSubjects = Array.from(existingMap.values());
    allSubjects.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ subjects: allSubjects });
  } catch (err: any) {
    // Graceful fallback with generated codes
    const fallback = DEFAULT_SUBJECTS.map((name, i) => ({
      id: `sub-${i + 1}`,
      name,
      code: `EC${301 + i}`,
      description: 'Department Subject Bank',
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

    const trimmedName = name.trim();
    const generatedCode = code ? code.trim() : generateSubjectCode(trimmedName, Math.floor(Math.random() * 50));

    const { data, error } = await supabaseAdmin
      .from('subjects')
      .insert({
        name: trimmedName,
        code: generatedCode,
        description: description ? description.trim() : `Department subject bank for ${trimmedName}`,
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
