'use client';

import { useEffect, useState, useRef, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/supabase/client';
import GlassCard from '@/components/shared/GlassCard';
import GalaxyButton from '@/components/shared/GalaxyButton';
import QuizTimer from '@/components/quiz/QuizTimer';
import Logo from '@/components/shared/Logo';
import {
  Bookmark, CheckCircle2, XCircle, CheckCircle, Loader2,
  AlertTriangle, HelpCircle, FileText
} from 'lucide-react';
import toast from 'react-hot-toast';

interface QuestionPayload {
  id: string;
  question_text: string;
  question_type: 'mcq' | 'true_false' | 'fill_blank' | 'numerical';
  options?: string[] | null;
  image_url?: string | null;
  image_alt?: string | null;
  marks: number;
  negative_marks?: number;
  category?: string;
}

interface PageProps {
  params: Promise<{ roundId: string }>;
}

export default function QuizTestPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const roundId = resolvedParams.roundId;
  const router = useRouter();

  // Session & Metadata
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [participantName, setParticipantName] = useState<string>('Participant');
  const [roundTitle, setRoundTitle] = useState<string>('Competition Round');
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [startedAt, setStartedAt] = useState<string>(new Date().toISOString());

  // Question Engine
  const [questionOrder, setQuestionOrder] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionPayload | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [answersMap, setAnswersMap] = useState<Record<string, string>>({});
  const [markedQuestions, setMarkedQuestions] = useState<Record<string, boolean>>({});

  // UI & Loading States
  const [loading, setLoading] = useState(true);
  const [fetchingQ, setFetchingQ] = useState(false);
  const [savingStatus, setSavingStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submittingFinal, setSubmittingFinal] = useState(false);
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  // Cache & Debounce Refs
  const cachedQuestions = useRef<Map<string, QuestionPayload>>(new Map());
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // 1. Initialize Exam Session
  useEffect(() => {
    const initSession = async () => {
      // Read session from sessionStorage
      const sessionStr = sessionStorage.getItem('quiz_session');
      let attId = '';
      if (sessionStr) {
        try {
          const parsed = JSON.parse(sessionStr);
          attId = parsed.attempt_id;
          if (parsed.name) setParticipantName(parsed.name);
        } catch {
          // fallback
        }
      }

      if (!attId) {
        toast.error('Session expired. Please enter again.');
        router.push('/quiz');
        return;
      }
      setAttemptId(attId);

      // Fetch attempt & round data from Supabase
      const { data: att, error: attErr } = await supabase
        .from('attempts')
        .select('id, status, started_at, question_order, disqualified, rounds(title, duration_minutes)')
        .eq('id', attId)
        .single();

      if (attErr || !att) {
        toast.error('Invalid attempt session.');
        router.push('/quiz');
        return;
      }

      if (att.disqualified || att.status === 'submitted') {
        router.push(`/quiz/submitted?attempt_id=${attId}`);
        return;
      }

      const rData = (att as any).rounds;
      if (rData) {
        setRoundTitle(rData.title || 'Quiz Round');
        setDurationMinutes(rData.duration_minutes || 30);
      }
      setStartedAt(att.started_at || new Date().toISOString());

      const orderArr: string[] = att.question_order || [];
      setQuestionOrder(orderArr);

      if (orderArr.length === 0) {
        toast.error('No questions assigned for this round.');
        setLoading(false);
        return;
      }

      // Fetch saved answers
      const { data: savedResp } = await supabase
        .from('responses')
        .select('question_id, selected')
        .eq('attempt_id', attId);

      const aMap: Record<string, string> = {};
      (savedResp || []).forEach((r) => {
        if (r.selected !== null) aMap[r.question_id] = r.selected;
      });
      setAnswersMap(aMap);

      // Prefetch first question
      await loadQuestion(0, orderArr, attId, aMap);
      setLoading(false);
    };

    initSession();
  }, [roundId, router]);

  // 2. Question Loader with Cache
  const loadQuestion = useCallback(
    async (index: number, order: string[], attId: string, currentAnswers: Record<string, string>) => {
      const qId = order[index];
      if (!qId) return;

      setFetchingQ(true);

      // Check Cache First
      if (cachedQuestions.current.has(qId)) {
        const cached = cachedQuestions.current.get(qId)!;
        setCurrentQuestion(cached);
        setSelectedAnswer(currentAnswers[qId] || '');
        setFetchingQ(false);
        return;
      }

      try {
        const res = await fetch(`/api/quiz/question?id=${qId}&attempt_id=${attId}`);
        const data = await res.json();
        if (data.question) {
          cachedQuestions.current.set(qId, data.question);
          setCurrentQuestion(data.question);
          setSelectedAnswer(currentAnswers[qId] || data.savedAnswer || '');
        }
      } catch (err) {
        console.error('Error fetching question:', err);
      } finally {
        setFetchingQ(false);
      }
    },
    []
  );

  // Handle Question Navigation
  const goToQuestion = (index: number) => {
    if (index < 0 || index >= questionOrder.length || !attemptId) return;
    setCurrentIndex(index);
    loadQuestion(index, questionOrder, attemptId, answersMap);
  };

  // Debounced Auto-Save
  const triggerAutoSave = (qId: string, value: string) => {
    setSavingStatus('saving');
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(async () => {
      if (!attemptId) return;
      try {
        const res = await fetch('/api/quiz/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            attempt_id: attemptId,
            question_id: qId,
            selected: value,
          }),
        });

        if (res.ok) {
          setSavingStatus('saved');
        } else {
          setSavingStatus('idle');
        }
      } catch {
        setSavingStatus('idle');
      }
    }, 800);
  };

  // Answer Select Handler
  const handleSelectAnswer = (value: string) => {
    if (!currentQuestion) return;
    setSelectedAnswer(value);
    setAnswersMap((prev) => ({ ...prev, [currentQuestion.id]: value }));
    triggerAutoSave(currentQuestion.id, value);
  };

  // Mark for Review Toggle
  const toggleMarkReview = () => {
    if (!currentQuestion) return;
    const qId = currentQuestion.id;
    setMarkedQuestions((prev) => ({ ...prev, [qId]: !prev[qId] }));
  };

  // Final Submission Handler
  const handleFinalSubmit = async () => {
    if (!attemptId) return;
    setSubmittingFinal(true);

    try {
      const res = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attempt_id: attemptId }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        sessionStorage.removeItem('quiz_session');
        router.push(`/quiz/submitted?score=${data.score}&rank=${data.rank}`);
      } else {
        toast.error(data.error || 'Failed to submit quiz');
        setSubmittingFinal(false);
      }
    } catch {
      toast.error('Error submitting quiz');
      setSubmittingFinal(false);
    }
  };

  const answeredCount = Object.keys(answersMap).filter((k) => answersMap[k] !== '').length;
  const currentQId = questionOrder[currentIndex];
  const isMarked = currentQId ? !!markedQuestions[currentQId] : false;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030008] text-[var(--text-primary)] flex items-center justify-center flex-col space-y-3">
        <Loader2 size={32} className="animate-spin text-[var(--aurora-cyan)]" />
        <p className="font-[family-name:var(--font-mono)] text-xs text-[var(--text-muted)] tracking-wider">
          INITIALIZING COMPETITION ENGINE...
        </p>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-[#030008] text-[var(--text-primary)] font-[family-name:var(--font-body)] overflow-hidden select-none flex flex-col relative z-50">
      {/* Zoom Image Modal */}
      {zoomImage && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" onClick={() => setZoomImage(null)}>
          <div className="relative max-w-4xl w-full p-4 bg-black/80 border border-white/20 rounded-2xl flex flex-col items-center">
            <button onClick={() => setZoomImage(null)} className="absolute top-4 right-4 text-white text-xl font-bold bg-white/10 hover:bg-white/20 w-8 h-8 rounded-full flex items-center justify-center">✕</button>
            <img src={zoomImage} alt="Enlarged Circuit Diagram" className="max-h-[80vh] object-contain rounded-lg" />
            <span className="text-xs text-[#94A3B8] font-mono mt-3">⚡ Click anywhere to close image preview</span>
          </div>
        </div>
      )}

      {/* ═══ CSS GRID LAYOUT ═══ */}
      <div className="h-full w-full grid grid-rows-[60px_1fr] md:grid-cols-[220px_1fr_200px]">

        {/* ═══ ZONE 1: TOP BAR ═══ */}
        <header className="col-span-full h-[60px] bg-[rgba(6,1,14,0.95)] border-b border-[rgba(168,85,247,0.12)] px-5 flex items-center justify-between z-30">
          {/* Left Logo + Title */}
          <div className="flex items-center gap-3 min-w-0">
            <Logo size="sm" showText={false} />
            <div className="h-5 w-[1px] bg-[rgba(255,255,255,0.1)] hidden sm:block" />
            <span className="font-[family-name:var(--font-heading)] text-sm text-[var(--text-secondary)] font-medium truncate max-w-[200px] sm:max-w-[300px]">
              {roundTitle}
            </span>
          </div>

          {/* Center Progress Counter */}
          <div className="hidden sm:flex items-center gap-3">
            <span className="font-[family-name:var(--font-mono)] text-xs text-[var(--text-muted)]">
              {currentIndex + 1} of {questionOrder.length} Questions
            </span>
            <div className="w-[120px] h-1.5 rounded-full bg-[rgba(255,255,255,0.08)] overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#A855F7] to-[#06B6D4] transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / questionOrder.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Right Submit Trigger */}
          <GalaxyButton
            variant="secondary"
            size="sm"
            onClick={() => setShowSubmitModal(true)}
            className="!border-[rgba(16,185,129,0.4)] !text-[#10B981] hover:!bg-[rgba(16,185,129,0.1)]"
          >
            Submit Quiz ✓
          </GalaxyButton>
        </header>

        {/* ═══ ZONE 2: QUESTION PALETTE (LEFT PANEL) ═══ */}
        <aside className="hidden md:flex flex-col justify-between bg-[rgba(4,0,10,0.96)] border-r border-[rgba(168,85,247,0.10)] p-3.5 overflow-y-auto no-scrollbar">
          <div>
            <div className="font-[family-name:var(--font-heading)] font-medium text-[10px] uppercase tracking-[0.14em] text-[var(--text-dim)] mb-3">
              Questions
            </div>

            {/* 5-Column Button Grid */}
            <div className="grid grid-cols-5 gap-1.5">
              {questionOrder.map((qId, idx) => {
                const isAnswered = answersMap[qId] !== undefined && answersMap[qId] !== '';
                const isCurrent = idx === currentIndex;
                const isRev = !!markedQuestions[qId];

                let bgStyle = 'rgba(255,255,255,0.04)';
                let borderStyle = 'rgba(255,255,255,0.08)';
                let textColor = 'var(--text-dim)';
                let shadow = 'none';

                if (isCurrent) {
                  bgStyle = 'rgba(6,182,212,0.2)';
                  borderStyle = '2px solid rgba(6,182,212,0.7)';
                  textColor = 'white';
                  shadow = '0 0 10px rgba(6,182,212,0.3)';
                } else if (isAnswered) {
                  bgStyle = 'rgba(168,85,247,0.2)';
                  borderStyle = '1px solid rgba(168,85,247,0.45)';
                  textColor = 'var(--aurora-purple)';
                  shadow = '0 0 8px rgba(168,85,247,0.2)';
                } else if (isRev) {
                  bgStyle = 'rgba(245,158,11,0.18)';
                  borderStyle = '1px solid rgba(245,158,11,0.4)';
                  textColor = 'var(--aurora-gold)';
                }

                return (
                  <button
                    key={qId}
                    onClick={() => goToQuestion(idx)}
                    className="relative w-8 h-8 rounded-[9px] font-[family-name:var(--font-mono)] font-semibold text-xs flex items-center justify-center transition-all cursor-pointer hover:scale-105"
                    style={{
                      background: bgStyle,
                      border: borderStyle,
                      color: textColor,
                      boxShadow: shadow,
                    }}
                  >
                    {idx + 1}
                    {isRev && !isCurrent && (
                      <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-[var(--aurora-gold)]" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-5 space-y-1.5 pt-3 border-t border-[rgba(255,255,255,0.05)] text-[11px] font-[family-name:var(--font-body)] text-[var(--text-dim)]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-[3px] bg-[rgba(168,85,247,0.25)] border border-[rgba(168,85,247,0.5)]" />
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-[3px] bg-[rgba(245,158,11,0.25)] border border-[rgba(245,158,11,0.5)]" />
                <span>For Review</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-[3px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)]" />
                <span>Unanswered</span>
              </div>
            </div>
          </div>

          {/* Palette Bottom Stats */}
          <GlassCard variant="solid" radius={10} hover={false} noHover className="!p-3 border border-[rgba(255,255,255,0.06)]">
            <div className="flex items-center justify-between text-xs">
              <span className="font-[family-name:var(--font-mono)] font-bold text-[var(--aurora-purple)]">{answeredCount}</span>
              <span className="font-[family-name:var(--font-heading)] text-[10px] text-[var(--text-dim)] uppercase">Answered</span>
            </div>
            <div className="flex items-center justify-between text-xs mt-1">
              <span className="font-[family-name:var(--font-mono)] font-bold text-[var(--text-muted)]">{questionOrder.length - answeredCount}</span>
              <span className="font-[family-name:var(--font-heading)] text-[10px] text-[var(--text-dim)] uppercase">Remaining</span>
            </div>
          </GlassCard>
        </aside>

        {/* ═══ ZONE 3: MAIN QUESTION AREA (CENTER) ═══ */}
        <main className="flex flex-col justify-between overflow-y-auto p-4 sm:p-6 bg-transparent relative no-scrollbar">
          <div className="max-w-[760px] mx-auto w-full space-y-6">

            {/* QUESTION CARD */}
            {fetchingQ || !currentQuestion ? (
              <GlassCard variant="elevated" radius={20} hover={false} noHover className="!p-8 text-center py-20">
                <Loader2 size={24} className="animate-spin mx-auto text-[var(--aurora-purple)] mb-2" />
                <p className="font-[family-name:var(--font-body)] text-xs text-[var(--text-muted)] font-light">Loading question...</p>
              </GlassCard>
            ) : (
              <div key={currentQuestion.id} className="animate-[questionIn_0.18s_ease-out]">
                <GlassCard
                  variant="elevated"
                  radius={20}
                  hover={false}
                  noHover
                  className="!p-6 sm:!p-8 border border-[rgba(255,255,255,0.08)] bg-[rgba(10,2,24,0.7)]"
                  style={{
                    boxShadow: '0 0 0 1px rgba(255,255,255,0.04), 0 4px 30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.07)',
                  }}
                >
                  {/* Question Header */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-1 rounded-lg bg-[rgba(168,85,247,0.14)] border border-[rgba(168,85,247,0.28)] font-[family-name:var(--font-mono)] font-semibold text-xs text-[var(--aurora-purple)]">
                        Q{currentIndex + 1}
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-[rgba(6,182,212,0.12)] border border-[rgba(6,182,212,0.25)] font-[family-name:var(--font-heading)] text-xs text-[var(--aurora-cyan)] uppercase">
                        {currentQuestion.question_type.replace('_', ' ')}
                      </span>
                      {currentQuestion.category && (
                        <span className="px-2.5 py-1 rounded-lg bg-[var(--glass-white)] border border-[var(--glass-border)] font-[family-name:var(--font-body)] text-xs text-[var(--text-muted)]">
                          {currentQuestion.category}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={toggleMarkReview}
                      className={`flex items-center gap-1.5 text-xs font-[family-name:var(--font-heading)] transition-colors cursor-pointer ${
                        isMarked ? 'text-[var(--aurora-gold)] font-semibold' : 'text-[var(--text-muted)] hover:text-white'
                      }`}
                    >
                      <Bookmark size={14} className={isMarked ? 'fill-[var(--aurora-gold)] text-[var(--aurora-gold)]' : ''} />
                      <span>{isMarked ? 'Marked' : 'Mark'}</span>
                    </button>
                  </div>

                  {/* Marks */}
                  <div className="flex items-center gap-2 mb-3 text-xs font-[family-name:var(--font-mono)]">
                    <span className="px-2 py-0.5 rounded bg-[rgba(16,185,129,0.14)] text-[var(--aurora-green)] border border-[rgba(16,185,129,0.3)]">
                      +{currentQuestion.marks} marks
                    </span>
                    {currentQuestion.negative_marks ? (
                      <span className="px-2 py-0.5 rounded bg-[rgba(244,63,94,0.14)] text-[var(--aurora-rose)] border border-[rgba(244,63,94,0.3)]">
                        −{currentQuestion.negative_marks} penalty
                      </span>
                    ) : null}
                  </div>

                  {/* Question Text */}
                  <h2 className="font-[family-name:var(--font-body)] font-medium text-base sm:text-lg text-[var(--text-primary)] leading-relaxed">
                    {currentQuestion.question_text}
                  </h2>

                  {/* Question Image (if exists) */}
                  {currentQuestion.image_url && (
                    <div
                      className="mt-4 mb-4 p-3 rounded-xl bg-black/60 border border-[rgba(255,255,255,0.12)] flex flex-col items-center gap-2 group cursor-pointer hover:border-[#00E5FF]/40 transition-all"
                      onClick={() => setZoomImage(currentQuestion.image_url || null)}
                    >
                      <div className="w-full flex items-center justify-between text-xs text-[#94A3B8] font-mono px-1">
                        <span>⚡ Circuit Schematic Diagram / Figure</span>
                        <span className="text-[#00E5FF] group-hover:underline">🔍 Click to Expand</span>
                      </div>
                      <img
                        src={currentQuestion.image_url}
                        alt={currentQuestion.image_alt || 'Question Image'}
                        className="max-h-[280px] object-contain rounded-xl border border-white/10 bg-black/80 p-2 shadow-lg"
                        loading="lazy"
                      />
                    </div>
                  )}

                  {/* ANSWER OPTIONS RENDERING */}
                  <div className="mt-6">

                    {/* TYPE 1: MCQ OPTIONS */}
                    {currentQuestion.question_type === 'mcq' && currentQuestion.options && (
                      <div className="space-y-3">
                        {currentQuestion.options.map((optionText, optIdx) => {
                          const letter = String.fromCharCode(65 + optIdx);
                          const isSelected = selectedAnswer === optionText;

                          return (
                            <div
                              key={optIdx}
                              onClick={() => handleSelectAnswer(optionText)}
                              className={`flex items-center justify-between p-3.5 px-4 rounded-[13px] border transition-all cursor-pointer select-none ${
                                isSelected
                                  ? 'bg-[rgba(168,85,247,0.14)] border-[rgba(168,85,247,0.5)] text-[var(--text-primary)] shadow-[0_0_16px_rgba(168,85,247,0.15)]'
                                  : 'bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.08)] text-[var(--text-secondary)] hover:bg-[rgba(168,85,247,0.07)] hover:border-[rgba(168,85,247,0.22)]'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div
                                  className={`w-8 h-8 rounded-[9px] flex items-center justify-center font-[family-name:var(--font-mono)] font-bold text-xs flex-shrink-0 transition-all ${
                                    isSelected
                                      ? 'bg-[rgba(168,85,247,0.25)] border border-[rgba(168,85,247,0.5)] text-[var(--aurora-purple)] shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                                      : 'bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.10)] text-[var(--text-dim)]'
                                  }`}
                                >
                                  {letter}
                                </div>
                                <span className="font-[family-name:var(--font-body)] text-sm sm:text-[0.95rem] leading-snug">
                                  {optionText}
                                </span>
                              </div>

                              {isSelected && (
                                <CheckCircle2 size={18} className="text-[var(--aurora-purple)] flex-shrink-0 ml-2" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* TYPE 2: TRUE / FALSE */}
                    {currentQuestion.question_type === 'true_false' && (
                      <div className="grid grid-cols-2 gap-4">
                        {['True', 'False'].map((tfVal) => {
                          const isSelected = selectedAnswer.toLowerCase() === tfVal.toLowerCase();
                          const isTrue = tfVal === 'True';
                          return (
                            <div
                              key={tfVal}
                              onClick={() => handleSelectAnswer(tfVal)}
                              className={`p-5 rounded-2xl border flex flex-col items-center gap-2 cursor-pointer transition-all ${
                                isSelected
                                  ? isTrue
                                    ? 'bg-[rgba(6,182,212,0.18)] border-[rgba(6,182,212,0.6)] shadow-[0_0_20px_rgba(6,182,212,0.2)]'
                                    : 'bg-[rgba(244,63,94,0.18)] border-[rgba(244,63,94,0.6)] shadow-[0_0_20px_rgba(244,63,94,0.2)]'
                                  : 'bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.06)]'
                              }`}
                            >
                              {isTrue ? (
                                <CheckCircle2 size={28} style={{ color: isSelected ? '#06B6D4' : 'rgba(6,182,212,0.4)' }} />
                              ) : (
                                <XCircle size={28} style={{ color: isSelected ? '#F43F5E' : 'rgba(244,63,94,0.4)' }} />
                              )}
                              <span className="font-[family-name:var(--font-heading)] font-bold text-lg" style={{ color: isSelected ? (isTrue ? '#06B6D4' : '#F43F5E') : 'var(--text-muted)' }}>
                                {tfVal.toUpperCase()}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* TYPE 3: FILL IN THE BLANK */}
                    {currentQuestion.question_type === 'fill_blank' && (
                      <div className="space-y-2">
                        <label className="font-[family-name:var(--font-heading)] text-xs text-[var(--text-muted)]">Your Answer:</label>
                        <input
                          type="text"
                          value={selectedAnswer}
                          onChange={(e) => handleSelectAnswer(e.target.value)}
                          placeholder="Type your answer here..."
                          className="w-full bg-[rgba(6,1,14,0.5)] border border-[rgba(255,255,255,0.10)] rounded-[11px] p-3.5 text-sm text-[var(--text-primary)] font-[family-name:var(--font-body)] focus:border-[rgba(6,182,212,0.65)] focus:shadow-[0_0_0_3px_rgba(6,182,212,0.12)] outline-none"
                        />
                      </div>
                    )}

                    {/* TYPE 4: NUMERICAL */}
                    {currentQuestion.question_type === 'numerical' && (
                      <div className="space-y-2">
                        <label className="font-[family-name:var(--font-heading)] text-xs text-[var(--text-muted)]">Enter Numerical Value:</label>
                        <input
                          type="number"
                          step="any"
                          inputMode="decimal"
                          value={selectedAnswer}
                          onChange={(e) => handleSelectAnswer(e.target.value)}
                          placeholder="0.00"
                          className="w-full bg-[rgba(6,1,14,0.5)] border border-[rgba(255,255,255,0.10)] rounded-[11px] p-3.5 text-sm text-[var(--text-primary)] font-[family-name:var(--font-mono)] focus:border-[rgba(16,185,129,0.65)] focus:shadow-[0_0_0_3px_rgba(16,185,129,0.12)] outline-none"
                        />
                      </div>
                    )}

                  </div>
                </GlassCard>
              </div>
            )}
          </div>

          {/* Sticky Bottom Navigation Bar */}
          <div className="sticky bottom-0 left-0 right-0 bg-[rgba(4,0,10,0.9)] backdrop-blur-md border-t border-[rgba(255,255,255,0.06)] p-3.5 px-6 flex items-center justify-between mt-6">
            <GalaxyButton
              variant="secondary"
              size="sm"
              onClick={() => goToQuestion(currentIndex - 1)}
              disabled={currentIndex === 0}
            >
              ← Previous
            </GalaxyButton>

            {/* Auto-save indicator */}
            <div className="flex items-center gap-1.5 font-[family-name:var(--font-body)] text-xs text-[var(--text-dim)] font-light">
              {savingStatus === 'saving' && (
                <>
                  <Loader2 size={12} className="animate-spin text-[var(--aurora-cyan)]" />
                  <span>Saving...</span>
                </>
              )}
              {savingStatus === 'saved' && (
                <>
                  <CheckCircle size={12} className="text-[var(--aurora-green)]" />
                  <span>Saved</span>
                </>
              )}
            </div>

            {currentIndex < questionOrder.length - 1 ? (
              <GalaxyButton
                variant="primary"
                size="sm"
                onClick={() => goToQuestion(currentIndex + 1)}
              >
                Next →
              </GalaxyButton>
            ) : (
              <GalaxyButton
                variant="cyan"
                size="sm"
                onClick={() => setShowSubmitModal(true)}
              >
                Submit Quiz ✓
              </GalaxyButton>
            )}
          </div>
        </main>

        {/* ═══ ZONE 4: TIMER & RULES PANEL (RIGHT COLUMN) ═══ */}
        <aside className="hidden md:flex flex-col items-center justify-between bg-[rgba(4,0,10,0.96)] border-l border-[rgba(168,85,247,0.10)] p-4 space-y-4 overflow-y-auto no-scrollbar">
          <div className="w-full space-y-4">
            {/* QuizTimer Component */}
            <QuizTimer
              totalDurationMinutes={durationMinutes}
              startedAtIso={startedAt}
              onTimeUp={() => handleFinalSubmit()}
            />

            {/* Round Summary Card */}
            <GlassCard variant="solid" radius={14} hover={false} noHover className="!p-3 border border-[rgba(255,255,255,0.06)] space-y-1.5 text-xs font-[family-name:var(--font-body)]">
              <div className="flex justify-between text-[var(--text-dim)]">
                <span>Total Qs:</span>
                <span className="font-[family-name:var(--font-mono)] text-[var(--text-primary)]">{questionOrder.length}</span>
              </div>
              <div className="flex justify-between text-[var(--text-dim)]">
                <span>Marks:</span>
                <span className="font-[family-name:var(--font-mono)] text-[var(--aurora-green)]">+{currentQuestion?.marks || 1}</span>
              </div>
            </GlassCard>

            {/* Danger Zone Rules Card */}
            <GlassCard variant="pink" radius={12} hover={false} noHover className="!p-3 border border-[rgba(244,63,94,0.22)] space-y-1.5">
              <div className="flex items-start gap-1.5 text-[11px] text-[var(--aurora-rose)] font-light">
                <AlertTriangle size={11} className="flex-shrink-0 mt-0.5" />
                <span>Tab switching is monitored</span>
              </div>
              <div className="flex items-start gap-1.5 text-[11px] text-[var(--aurora-rose)] font-light">
                <AlertTriangle size={11} className="flex-shrink-0 mt-0.5" />
                <span>Answers save automatically</span>
              </div>
            </GlassCard>
          </div>

          <div className="text-[10px] font-[family-name:var(--font-mono)] text-[var(--text-dim)] text-center">
            Session: {attemptId ? attemptId.slice(0, 8) : 'Active'}
          </div>
        </aside>

      </div>

      {/* SUBMIT CONFIRMATION MODAL */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <GlassCard variant="elevated" radius={24} hover={false} noHover className="!p-8 max-w-sm w-full border border-[rgba(168,85,247,0.3)] text-center space-y-4">
            <h3 className="font-[family-name:var(--font-display)] font-extrabold text-xl gradient-text">
              Submit Quiz? ✦
            </h3>
            <div className="space-y-1 font-[family-name:var(--font-body)] text-xs text-[var(--text-muted)]">
              <p>{answeredCount} of {questionOrder.length} questions answered.</p>
              {questionOrder.length - answeredCount > 0 && (
                <p className="text-[var(--aurora-gold)] font-semibold">
                  ⚠️ {questionOrder.length - answeredCount} questions remain unanswered!
                </p>
              )}
            </div>
            <div className="pt-3 flex flex-col gap-2.5">
              <GalaxyButton variant="primary" fullWidth size="md" onClick={handleFinalSubmit} loading={submittingFinal}>
                Confirm & Submit →
              </GalaxyButton>
              <GalaxyButton variant="secondary" fullWidth size="sm" onClick={() => setShowSubmitModal(false)}>
                Continue Answering
              </GalaxyButton>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
