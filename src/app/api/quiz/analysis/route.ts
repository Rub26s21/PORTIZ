import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { evaluateAnswerDetailed } from '@/lib/answer-evaluator';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const attemptId = searchParams.get('attempt_id');

    if (!attemptId) {
      return NextResponse.json({ error: 'Missing attempt_id parameter' }, { status: 400 });
    }

    // 1. Fetch Attempt Record
    const { data: attempt, error: attErr } = await supabaseAdmin
      .from('attempts')
      .select('id, round_id, participant_id, user_id, score, status, started_at, submitted_at, question_order, disqualified, disqualification_reason')
      .eq('id', attemptId)
      .maybeSingle();

    if (attErr || !attempt) {
      return NextResponse.json({ error: 'Exam attempt not found' }, { status: 404 });
    }

    // Security check: Only allow viewing analysis once the attempt is completed/submitted/disqualified
    if (attempt.status !== 'submitted' && !attempt.disqualified) {
      return NextResponse.json(
        { error: 'Exam is still in progress. Analysis is only available after final submission.' },
        { status: 403 }
      );
    }

    // 2. Fetch Participant Details
    let participantName = 'Participant';
    let registerNo = 'N/A';
    let department = 'ECE';
    let studentSection = 'A';
    let email = '';

    if (attempt.participant_id) {
      const { data: p } = await supabaseAdmin
        .from('participants')
        .select('name, register_no, email, phone, roll_number, college, department')
        .eq('id', attempt.participant_id)
        .maybeSingle();

      if (p) {
        participantName = p.name || participantName;
        registerNo = p.register_no || registerNo;
        email = p.email || '';
        if (p.roll_number && ['A', 'B', 'C', 'D'].includes(p.roll_number.toUpperCase())) {
          studentSection = p.roll_number.toUpperCase() as any;
        } else if (p.college) {
          const m = p.college.match(/Section\s*([A-D])/i);
          if (m) studentSection = m[1].toUpperCase() as any;
        }
      }
    } else if (attempt.user_id) {
      const { data: u } = await supabaseAdmin
        .from('profiles')
        .select('display_name, register_number, email, department')
        .eq('id', attempt.user_id)
        .maybeSingle();

      if (u) {
        participantName = u.display_name || participantName;
        registerNo = u.register_number || registerNo;
        department = u.department || department;
        email = u.email || '';
      }
    }

    // 3. Fetch Round Details
    const { data: round } = await supabaseAdmin
      .from('rounds')
      .select('id, title, description, duration_minutes, round_number, negative_marking, negative_marks_per_wrong')
      .eq('id', attempt.round_id)
      .maybeSingle();

    if (round?.title) {
      const t = round.title.toUpperCase();
      if (t.includes('SECTION A') || t.includes('SEC A')) studentSection = 'A';
      else if (t.includes('SECTION B') || t.includes('SEC B')) studentSection = 'B';
      else if (t.includes('SECTION C') || t.includes('SEC C')) studentSection = 'C';
      else if (t.includes('SECTION D') || t.includes('SEC D')) studentSection = 'D';
    }

    // 4. Fetch All Questions for this round
    const { data: allQuestions } = await supabaseAdmin
      .from('questions')
      .select('id, question_text, question_type, options, correct_answer, marks, negative_marks, category, difficulty, image_url')
      .eq('round_id', attempt.round_id);

    const questionMap = new Map<string, any>();
    (allQuestions || []).forEach((q) => questionMap.set(q.id, q));

    // Determine ordered questions
    const orderedIds: string[] = Array.isArray(attempt.question_order) && attempt.question_order.length > 0
      ? attempt.question_order
      : (allQuestions || []).map((q) => q.id);

    // 5. Fetch User Responses
    const { data: responses } = await supabaseAdmin
      .from('responses')
      .select('question_id, selected, saved_at')
      .eq('attempt_id', attemptId);

    const userResponsesMap = new Map<string, string>();
    (responses || []).forEach((r) => {
      if (r.selected !== null && r.selected !== undefined) {
        userResponsesMap.set(r.question_id, String(r.selected).trim());
      }
    });

    // 6. Evaluate Each Question
    let correctCount = 0;
    let wrongCount = 0;
    let skippedCount = 0;
    let totalPossibleMarks = 0;

    const evaluatedQuestions = orderedIds.map((qId, idx) => {
      const q = questionMap.get(qId);
      if (!q) return null;

      const maxMarks = Number(q.marks || 1);
      const negPenalty = Number(q.negative_marks || round?.negative_marks_per_wrong || 0);
      totalPossibleMarks += maxMarks;

      const userSel = userResponsesMap.get(qId) ?? null;
      const isSkipped = userSel === null || userSel === '';

      // Normalize correct answer
      let correctVal: any = q.correct_answer;
      if (correctVal && typeof correctVal === 'object' && correctVal.value !== undefined) {
        correctVal = correctVal.value;
      }
      const cStr = String(correctVal ?? '').trim().toLowerCase();

      // Normalize options array
      const optionsArray: string[] = Array.isArray(q.options)
        ? q.options.map((opt: any) => String(opt ?? '').trim())
        : [];

      // Determine correct answer text and index
      let correctIndex: number | null = null;
      let correctAnswerText = String(correctVal ?? '');

      const parsedCIdx = Number(correctVal);
      if (!isNaN(parsedCIdx) && parsedCIdx >= 0 && parsedCIdx < optionsArray.length) {
        correctIndex = parsedCIdx;
        correctAnswerText = optionsArray[parsedCIdx];
      } else {
        const foundIdx = optionsArray.findIndex((o) => o.toLowerCase() === cStr);
        if (foundIdx !== -1) {
          correctIndex = foundIdx;
          correctAnswerText = optionsArray[foundIdx];
        }
      }

      // Determine user selected answer text and index
      let userSelectedIndex: number | null = null;
      let userSelectedText: string | null = null;

      if (!isSkipped) {
        const parsedUIdx = Number(userSel);
        if (!isNaN(parsedUIdx) && parsedUIdx >= 0 && parsedUIdx < optionsArray.length) {
          userSelectedIndex = parsedUIdx;
          userSelectedText = optionsArray[parsedUIdx];
        } else {
          userSelectedText = userSel;
          const foundUIdx = optionsArray.findIndex((o) => o.toLowerCase() === userSel.toLowerCase());
          if (foundUIdx !== -1) {
            userSelectedIndex = foundUIdx;
          }
        }
      }

      // Use 3-Stage Smart Engineering Answer Evaluator
      const evalRes = isSkipped ? null : evaluateAnswerDetailed(q, userSel);
      const isCorrect = evalRes ? evalRes.isCorrect : false;
      const isWrong = !isSkipped && !isCorrect;
      let marksAwarded = 0;

      if (isSkipped) {
        skippedCount++;
      } else if (isCorrect) {
        correctCount++;
        marksAwarded = maxMarks;
      } else {
        wrongCount++;
        if (round?.negative_marking) {
          marksAwarded = -negPenalty;
        }
      }

      const isMcq = optionsArray.length > 0;

      return {
        id: q.id,
        orderIndex: idx + 1,
        questionText: q.question_text,
        questionType: q.question_type || (isMcq ? 'mcq' : 'fill_blank'),
        isMcq,
        imageUrl: q.image_url || null,
        category: q.category || 'Electronics',
        difficulty: q.difficulty || 'medium',
        options: optionsArray,
        userSelectedRaw: userSel,
        userSelectedText: evalRes?.userAnswerFormatted || userSelectedText || userSel,
        userSelectedIndex,
        correctAnswerRaw: String(correctVal ?? ''),
        correctAnswerText: evalRes?.correctAnswerFormatted || correctAnswerText,
        correctIndex,
        isCorrect,
        isWrong,
        isSkipped,
        marksAwarded,
        maxMarks,
        negativePenalty: negPenalty,
        matchType: evalRes?.matchType || (isSkipped ? 'none' : 'none'),
        feedback: evalRes?.feedback || (isSkipped ? 'Unattempted' : ''),
      };
    }).filter(Boolean);

    // 7. Calculate Time Taken
    let timeTakenSeconds = 0;
    if (attempt.started_at && attempt.submitted_at) {
      const startMs = new Date(attempt.started_at).getTime();
      const endMs = new Date(attempt.submitted_at).getTime();
      timeTakenSeconds = Math.max(0, Math.round((endMs - startMs) / 1000));
    }

    // 8. Calculate Current Rank
    const { count: higherScores } = await supabaseAdmin
      .from('attempts')
      .select('*', { count: 'exact', head: true })
      .eq('round_id', attempt.round_id)
      .eq('status', 'submitted')
      .gt('score', attempt.score ?? 0);

    const rank = (higherScores || 0) + 1;

    // Accuracy %: correct / attempted
    const attemptedCount = correctCount + wrongCount;
    const accuracy = attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0;
    const finalScore = attempt.score ?? 0;
    const percentage = totalPossibleMarks > 0 ? Math.round((finalScore / totalPossibleMarks) * 100) : 0;

    return NextResponse.json({
      success: true,
      summary: {
        attemptId: attempt.id,
        roundId: attempt.round_id,
        roundTitle: round?.title || 'Electronics Quiz Round',
        participantName,
        registerNo,
        department,
        section: studentSection,
        email,
        score: finalScore,
        totalPossibleMarks,
        percentage,
        accuracy,
        rank,
        totalQuestions: evaluatedQuestions.length,
        correctCount,
        wrongCount,
        skippedCount,
        timeTakenSeconds,
        startedAt: attempt.started_at,
        submittedAt: attempt.submitted_at,
        disqualified: !!attempt.disqualified,
        disqualificationReason: attempt.disqualification_reason || null,
      },
      questions: evaluatedQuestions,
    });
  } catch (error: any) {
    console.error('Error generating quiz analysis:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
