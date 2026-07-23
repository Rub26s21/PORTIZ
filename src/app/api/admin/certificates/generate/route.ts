import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, isAuthError } from '@/lib/auth-helpers';

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isAuthError(auth)) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const { participantName, roundTitle, score, totalMarks, rank, date } = body;

    // Return certificate data — PDF generation happens on the client side
    // using @react-pdf/renderer for security and flexibility
    return NextResponse.json({
      success: true,
      certificate: {
        participantName,
        roundTitle,
        score,
        totalMarks,
        rank,
        date: date || new Date().toLocaleDateString('en-IN'),
        issuer: 'Electronic Club',
        verificationId: `EC-${Date.now().toString(36).toUpperCase()}`,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
