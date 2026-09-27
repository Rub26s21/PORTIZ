'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { initAntiCheat, ViolationType, requestFullscreen } from '@/lib/anti-cheat';
import { formatDuration, getTimeRemaining, formatImageUrl } from '@/lib/utils';
import { QuestionWithoutAnswer, AnswerValue } from '@/types/quiz';
import {
  Clock, Send, ChevronLeft, ChevronRight, Flag, X, Maximize2,
  ShieldAlert, AlertTriangle, Maximize, AlertOctagon
} from 'lucide-react';
import GlowButton from '@/components/shared/GlowButton';
import GlassCard from '@/components/shared/GlassCard';

export default function TestPage() {
  const router = useRouter();
  const params = useParams();
  const roundId = params.id as string;

  const [questions, setQuestions] = useState<QuestionWithoutAnswer[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerValue | null>>({});
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [markedForReview, setMarkedForReview] = useState<Set<string>>(new Set());
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [startedAt, setStartedAt] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(0);
  const [endTime, setEndTime] = useState('');
  const [loading, setLoading] = useState(true);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Anti-cheat state
  const [isFullscreenRequired, setIsFullscreenRequired] = useState(true);
  const [strikeCount, setStrikeCount] = useState(0);
  const [activeWarning, setActiveWarning] = useState<string | null>(null);

  const antiCheatArmed = useRef(false);
  const antiCheatCleanup = useRef<(() => void) | null>(null);
  const tokenRef = useRef('');
  const hasSubmitted = useRef(false);
  const timerEverRan = useRef(false);
  const strikeCountRef = useRef(0);
  const lastViolationTimeRef = useRef(0);

  // Submit test (regular or forced)
  const handleSubmit = useCallback(async (auto = false, forceDisqualify = false, reason = '') => {
    if (hasSubmitted.current || isSubmitting) return;
    hasSubmitted.current = true;
    setIsSubmitting(true);

    try {
      await fetch(`/api/participant/rounds/${roundId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenRef.current}`,
        },
        body: JSON.stringify({
          forceDisqualify,
          reason,
        }),
      });
    } catch {
      /* continue redirect */
    }

    if (antiCheatCleanup.current) antiCheatCleanup.current();

    if (forceDisqualify) {
      router.push(`/participant/rounds/${roundId}/disqualified?reason=${encodeURIComponent(reason)}`);
    } else {
      router.push(`/participant/rounds/${roundId}/submitted`);
    }
  }, [roundId, isSubmitting, router]);

  // Handle anti-cheat violation with 3-strike tolerance
  const handleViolation = useCallback(async (reason: ViolationType) => {
    if (!antiCheatArmed.current || hasSubmitted.current) return;

    const now = Date.now();
    // 3.5s cooldown between strikes to avoid cascade
    if (now - lastViolationTimeRef.current < 3500) {
      return;
    }
    lastViolationTimeRef.current = now;

    strikeCountRef.current += 1;
    const newCount = strikeCountRef.current;
    setStrikeCount(newCount);

    // Log proctor event
    try {
      fetch(`/api/participant/rounds/${roundId}/proctor-event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenRef.current}`,
        },
        body: JSON.stringify({ eventType: reason, strike: newCount }),
      }).catch(() => {});
    } catch {
      /* ignore */
    }

    const violationLabels: Record<string, string> = {
      tab_switch: 'Tab switch / backgrounding',
      window_blur: 'Focus loss / leaving exam window',
      fullscreen_exit: 'Fullscreen exited',
      devtools_detected: 'Developer tools inspection',
      keyboard_shortcut: 'Prohibited keyboard shortcut',
    };
    const label = violationLabels[reason] || reason;

    if (newCount >= 3) {
      // 3 strikes: Auto-submit with disqualification
      setActiveWarning(null);
      await handleSubmit(true, true, `Exceeded maximum anti-cheat violations (${label})`);
    } else {
      // Strikes 1 and 2: Show non-blocking warning modal with countdown
      setActiveWarning(
        `Warning ${newCount} of 3: ${label} was detected. Please stay focused in Fullscreen mode. Further violations will result in automatic disqualification.`
      );
    }
  }, [roundId, handleSubmit]);

  // Request fullscreen to start
  const handleEnterFullscreen = async () => {
    const success = await requestFullscreen();
    if (success) {
      setIsFullscreenRequired(false);
      // Arm anti-cheat after 1 second grace period
      setTimeout(() => {
        antiCheatArmed.current = true;
      }, 1000);
    } else {
      // In case browser rejects or user denies, still let them proceed after acknowledgment
      setIsFullscreenRequired(false);
      setTimeout(() => {
        antiCheatArmed.current = true;
      }, 2000);
    }
  };

  // Load questions and init
  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      tokenRef.current = session.access_token;

      try {
        const res = await fetch(`/api/participant/rounds/${roundId}/questions`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });

        if (!res.ok) {
          router.push('/participant/dashboard');
          return;
        }

        const data = await res.json();
        if (!isMounted) return;

        setQuestions(data.questions || []);
        const serverStartedAt = data.attempt?.started_at || new Date().toISOString();
        setStartedAt(serverStartedAt);
        setDurationMinutes(data.round?.duration_minutes || 30);
        setEndTime(data.round?.end_time || '');

        const savedAnswers: Record<string, AnswerValue | null> = {};
        (data.responses || []).forEach((r: { question_id: string; selected_answer: AnswerValue | null }) => {
          savedAnswers[r.question_id] = r.selected_answer;
        });
        setAnswers(savedAnswers);
        setLoading(false);

        // Check if already in fullscreen
        if (typeof document !== 'undefined' && document.fullscreenElement) {
          setIsFullscreenRequired(false);
          antiCheatArmed.current = true;
        }

        // Initialize anti-cheat listener (only triggers when antiCheatArmed.current is true)
        antiCheatCleanup.current = initAntiCheat(handleViolation, {
          isArmed: () => antiCheatArmed.current && !hasSubmitted.current,
          cooldownMs: 3500,
        });
      } catch (err) {
        console.error('Failed to init test session:', err);
      }
    };

    init();

    return () => {
      isMounted = false;
      if (antiCheatCleanup.current) antiCheatCleanup.current();
    };
  }, [roundId, router, handleViolation]);

  // Safe Timer Engine
  useEffect(() => {
    if (!startedAt || !durationMinutes || loading) return;

    // Initial calculation
    const initialRemaining = getTimeRemaining(startedAt, durationMinutes, endTime);
    setTimeRemaining(initialRemaining);
    if (initialRemaining > 5) {
      timerEverRan.current = true;
    }

    const tick = () => {
      const remaining = getTimeRemaining(startedAt, durationMinutes, endTime);
      setTimeRemaining(remaining);

      if (remaining > 5) {
        timerEverRan.current = true;
      }

      // Only trigger auto-submit if the timer actually started and reached zero
      if (remaining <= 0 && timerEverRan.current && !hasSubmitted.current) {
        clearInterval(interval);
        handleSubmit(true, false, 'Time expired');
      }
    };

    const interval = setInterval(tick, 1000);

    const handleWakeup = () => {
      tick();
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleWakeup);
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', handleWakeup);
    }

    return () => {
      clearInterval(interval);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleWakeup);
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', handleWakeup);
      }
    };
  }, [startedAt, durationMinutes, endTime, loading, handleSubmit]);

  const [isOnline, setIsOnline] = useState<boolean>(true);

  // Network listener & LocalStorage Auto-Sync
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setIsOnline(navigator.onLine);

    const flushOfflineQueue = async () => {
      const queueKey = `participant_offline_queue_${roundId}`;
      const rawQueue = localStorage.getItem(queueKey);
      if (!rawQueue) return;

      try {
        const queue: Array<{ questionId: string; selectedAnswer: any }> = JSON.parse(rawQueue);
        if (queue.length === 0) return;

        for (const item of queue) {
          await fetch(`/api/participant/rounds/${roundId}/save-answer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenRef.current}` },
            body: JSON.stringify({ questionId: item.questionId, selectedAnswer: item.selectedAnswer }),
          });
        }

        localStorage.removeItem(queueKey);
      } catch {
        /* retry later */
      }
    };

    const handleOnline = async () => {
      setIsOnline(true);
      await flushOfflineQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [roundId]);

  // Save answer with offline caching
  const saveAnswer = useCallback(async (questionId: string, answer: AnswerValue | null) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));

    // 1. Instantly cache in LocalStorage
    const cacheKey = `participant_answers_${roundId}`;
    const queueKey = `participant_offline_queue_${roundId}`;
    try {
      const existingCache = JSON.parse(localStorage.getItem(cacheKey) || '{}');
      existingCache[questionId] = answer;
      localStorage.setItem(cacheKey, JSON.stringify(existingCache));
    } catch {
      /* ignore storage errors */
    }

    if (!navigator.onLine) {
      try {
        const existingQueue: Array<{ questionId: string; selectedAnswer: any }> = JSON.parse(localStorage.getItem(queueKey) || '[]');
        const updatedQueue = existingQueue.filter(i => i.questionId !== questionId);
        updatedQueue.push({ questionId, selectedAnswer: answer });
        localStorage.setItem(queueKey, JSON.stringify(updatedQueue));
      } catch {
        /* ignore */
      }
      return;
    }

    try {
      await fetch(`/api/participant/rounds/${roundId}/save-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenRef.current}` },
        body: JSON.stringify({ questionId, selectedAnswer: answer }),
      });
    } catch {
      /* queued for auto-sync */
    }
  }, [roundId]);

  const toggleReview = (qId: string) => {
    setMarkedForReview(prev => {
      const next = new Set(prev);
      next.has(qId) ? next.delete(qId) : next.add(qId);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--space-void)] flex items-center justify-center">
        <div className="font-[family-name:var(--font-heading)] text-[var(--aurora-purple)] text-xl flex items-center gap-2">
          Loading test interface... ⚡
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.values(answers).filter(a => a !== null && a !== undefined).length;

  return (
    <div className="min-h-screen bg-[var(--space-void)] text-[var(--text-primary)] flex flex-col select-none relative z-50">
      {/* Fullscreen Prompt Gate Modal */}
      {isFullscreenRequired && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4">
          <GlassCard variant="elevated" radius={24} className="!p-8 max-w-lg w-full text-center" hover={false} noHover>
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto mb-5 text-cyan-400">
              <Maximize size={32} />
            </div>
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-white mb-3">
              Secure Assessment Mode
            </h2>
            <p className="font-[family-name:var(--font-body)] text-sm text-slate-300 mb-6 leading-relaxed">
              This exam requires Fullscreen Mode to ensure test integrity. Tab switching or exiting fullscreen will be recorded by the proctoring monitor.
            </p>
            <GlowButton variant="primary" fullWidth size="lg" onClick={handleEnterFullscreen}>
              Enter Fullscreen & Begin Test
            </GlowButton>
          </GlassCard>
        </div>
      )}

      {/* Warning Strike Modal */}
      {activeWarning && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <GlassCard variant="elevated" radius={24} className="!p-6 max-w-md w-full border-amber-500/40 text-center" hover={false} noHover>
            <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto mb-4 text-amber-400">
              <AlertTriangle size={28} />
            </div>
            <h3 className="font-[family-name:var(--font-heading)] text-xl font-bold text-amber-300 mb-2">
              Proctoring Warning ({strikeCount}/3)
            </h3>
            <p className="font-[family-name:var(--font-body)] text-sm text-slate-200 mb-6 leading-relaxed">
              {activeWarning}
            </p>
            <GlowButton
              variant="primary"
              fullWidth
              onClick={() => {
                setActiveWarning(null);
                requestFullscreen().catch(() => {});
              }}
            >
              I Understand, Resume Test
            </GlowButton>
          </GlassCard>
        </div>
      )}

      {/* Zoom Image Modal */}
      {zoomImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" onClick={() => setZoomImage(null)}>
          <div className="relative max-w-4xl w-full p-4 bg-black/80 border border-white/20 rounded-2xl flex flex-col items-center">
            <button onClick={() => setZoomImage(null)} className="absolute top-4 right-4 text-white text-xl font-bold bg-white/10 hover:bg-white/20 w-8 h-8 rounded-full flex items-center justify-center">✕</button>
            <img src={zoomImage} alt="Enlarged Circuit Diagram" className="max-h-[80vh] object-contain rounded-lg" />
            <span className="text-xs text-[#94A3B8] font-mono mt-3">⚡ Click anywhere to close image preview</span>
          </div>
        </div>
      )}

      {/* Top Bar */}
      <header
        className="sticky top-0 z-50 flex items-center justify-between px-6 py-3 border-b border-[var(--glass-border)]"
        style={{ background: 'rgba(10, 1, 24, 0.98)' }}
      >
        <div className="flex items-center gap-3">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-bold gradient-text">⚡ Quiz in Progress</h2>
          {strikeCount > 0 && (
            <span className="flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono">
              <ShieldAlert size={12} /> {strikeCount}/3 Strikes
            </span>
          )}
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-sm font-[family-name:var(--font-heading)]">
            <span className="text-[var(--text-muted)]">Answered:</span>
            <span className="text-[var(--aurora-purple)] font-bold font-[family-name:var(--font-mono)]">{answeredCount} / {questions.length}</span>
          </div>

          <div className={`flex items-center gap-2 font-[family-name:var(--font-mono)] font-bold text-lg ${
            (timeRemaining !== null && timeRemaining < 300) ? 'text-[var(--aurora-rose)] animate-pulse' : 'text-[var(--aurora-cyan)]'
          }`}>
            <Clock size={18} />{timeRemaining !== null ? formatDuration(timeRemaining) : '--:--'}
          </div>

          <GlowButton size="sm" variant="primary" onClick={() => setShowSubmitModal(true)}>
            <Send size={14} /> Submit
          </GlowButton>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Left Palette */}
        <aside
          className="w-60 flex-shrink-0 p-4 border-r border-[var(--glass-border)] flex flex-col justify-between"
          style={{ background: 'rgba(10, 1, 24, 0.6)' }}
        >
          <div>
            <h3 className="font-[family-name:var(--font-heading)] text-[var(--aurora-purple)] text-xs uppercase tracking-wider mb-4">
              Question Map
            </h3>
            <div className="grid grid-cols-5 gap-2 max-h-[60vh] overflow-y-auto pr-1">
              {questions.map((q, i) => {
                const isAnswered = answers[q.id] !== null && answers[q.id] !== undefined;
                const isCurrent = i === currentIndex;
                const isMarked = markedForReview.has(q.id);
                return (
                  <button
                    key={`${q.id}-${i}`}
                    onClick={() => setCurrentIndex(i)}
                    className={`w-8 h-8 rounded-lg text-xs font-[family-name:var(--font-mono)] font-bold flex items-center justify-center transition-all ${
                      isCurrent
                        ? 'bg-[var(--aurora-purple)] text-white ring-2 ring-[var(--aurora-purple)]/50'
                        : isMarked
                        ? 'bg-[rgba(245,158,11,0.2)] text-[var(--aurora-gold)] border border-[rgba(245,158,11,0.5)]'
                        : isAnswered
                        ? 'bg-[rgba(168,85,247,0.2)] text-[var(--aurora-purple)] border border-[rgba(168,85,247,0.3)]'
                        : 'bg-[var(--glass-white)] text-[var(--text-muted)] border border-[var(--glass-border)]'
                    }`}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5 text-xs font-[family-name:var(--font-heading)] text-[var(--text-muted)] pt-4 border-t border-[var(--glass-border)]">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-[rgba(168,85,247,0.2)] border border-[rgba(168,85,247,0.3)]" /> Answered</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-[var(--glass-white)] border border-[var(--glass-border)]" /> Unanswered</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-[var(--aurora-purple)]" /> Current</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-[rgba(245,158,11,0.2)] border border-[rgba(245,158,11,0.5)]" /> Review</div>
          </div>
        </aside>

        {/* Main Question Display */}
        <main className="flex-1 p-8 md:p-12 max-w-4xl mx-auto">
          {currentQuestion ? (
            <div>
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--glass-border)]">
                <span className="font-[family-name:var(--font-mono)] text-[var(--aurora-purple)] text-sm font-semibold">
                  Question {currentIndex + 1} of {questions.length}
                </span>
                <div className="flex items-center gap-3 text-xs font-[family-name:var(--font-mono)] text-[var(--text-muted)]">
                  <span>+{currentQuestion.marks || 1} marks</span>
                  <span className="text-emerald-400">No negative marking</span>
                </div>
              </div>

              <h2 className="font-[family-name:var(--font-body)] text-[var(--text-primary)] text-xl md:text-2xl leading-relaxed mb-6 font-medium">
                {currentQuestion.question_text}
              </h2>

              {/* Circuit Schematic Diagram / Figure */}
              {currentQuestion.image_url && (
                <div
                  className="mb-8 p-4 rounded-2xl bg-black/60 border border-white/12 flex flex-col items-center gap-2 group cursor-pointer hover:border-[#00E5FF]/40 transition-all"
                  onClick={() => setZoomImage(formatImageUrl(currentQuestion.image_url))}
                >
                  <div className="w-full flex items-center justify-between text-xs text-[#94A3B8] font-mono px-1">
                    <span>⚡ Circuit Schematic Diagram / Figure</span>
                    <span className="text-[#00E5FF] group-hover:underline flex items-center gap-1">
                      <Maximize2 size={12} /> Click to Expand
                    </span>
                  </div>
                  <img
                    src={formatImageUrl(currentQuestion.image_url)}
                    alt={currentQuestion.image_alt || 'Circuit Diagram'}
                    className="max-h-64 object-contain rounded-xl border border-white/10 bg-black/80 p-2 shadow-lg"
                  />
                </div>
              )}

              {/* MCQ */}
              {currentQuestion.question_type === 'mcq' && currentQuestion.options && (
                <div className="space-y-3">
                  {(currentQuestion.options as string[]).map((opt, i) => {
                    const isSelected = answers[currentQuestion.id]?.type === 'mcq' && answers[currentQuestion.id]?.value === i;
                    return (
                      <button
                        key={i}
                        onClick={() => saveAnswer(currentQuestion.id, { type: 'mcq', value: i })}
                        className={`w-full text-left p-5 rounded-2xl transition-all cursor-pointer font-[family-name:var(--font-body)] text-sm md:text-base flex items-center justify-between ${
                          isSelected
                            ? 'bg-[var(--glass-purple)] border-[var(--aurora-purple)] text-[var(--text-primary)] shadow-[var(--glow-purple-sm)]'
                            : 'bg-[var(--glass-white)] border-[var(--glass-border)] text-[var(--text-secondary)] hover:bg-[var(--glass-white-md)]'
                        }`}
                        style={{ border: '1px solid' }}
                      >
                        <div>
                          <span className="font-[family-name:var(--font-mono)] font-bold text-[var(--aurora-purple)] mr-3">
                            {String.fromCharCode(65 + i)}.
                          </span>
                          {opt}
                        </div>
                        {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-[var(--aurora-purple)] shadow-[var(--glow-purple-sm)]" />}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* True/False */}
              {currentQuestion.question_type === 'true_false' && (
                <div className="flex gap-4">
                  {[true, false].map((val) => {
                    const isSelected = answers[currentQuestion.id]?.type === 'true_false' && answers[currentQuestion.id]?.value === val;
                    return (
                      <button
                        key={String(val)}
                        onClick={() => saveAnswer(currentQuestion.id, { type: 'true_false', value: val })}
                        className={`flex-1 p-6 rounded-2xl text-center text-lg font-[family-name:var(--font-heading)] font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[var(--glass-purple)] border-[var(--aurora-purple)] text-[var(--aurora-purple)] shadow-[var(--glow-purple-sm)]'
                            : 'bg-[var(--glass-white)] border-[var(--glass-border)] text-[var(--text-muted)] hover:bg-[var(--glass-white-md)]'
                        }`}
                        style={{ border: '1px solid' }}
                      >
                        {val ? '✅ True' : '❌ False'}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Fill Blank */}
              {currentQuestion.question_type === 'fill_blank' && (
                <input
                  type="text"
                  value={(answers[currentQuestion.id] as { type: 'fill_blank'; value: string })?.value || ''}
                  onChange={(e) => saveAnswer(currentQuestion.id, { type: 'fill_blank', value: e.target.value })}
                  className="form-input text-lg !py-4"
                  placeholder="Type your answer here..."
                />
              )}

              {/* Numerical */}
              {currentQuestion.question_type === 'numerical' && (
                <input
                  type="number"
                  step="any"
                  value={(answers[currentQuestion.id] as { type: 'numerical'; value: number })?.value ?? ''}
                  onChange={(e) => saveAnswer(currentQuestion.id, { type: 'numerical', value: parseFloat(e.target.value) })}
                  className="form-input text-lg !py-4 font-[family-name:var(--font-mono)]"
                  placeholder="Enter numerical value..."
                />
              )}

              {/* Controls */}
              <div className="flex items-center justify-between mt-12 pt-6 border-t border-[var(--glass-border)]">
                <GlowButton
                  variant="ghost"
                  onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                  disabled={currentIndex === 0}
                >
                  <ChevronLeft size={18} /> Previous
                </GlowButton>

                <button
                  onClick={() => toggleReview(currentQuestion.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-[family-name:var(--font-heading)] font-medium transition-colors ${
                    markedForReview.has(currentQuestion.id)
                      ? 'bg-[rgba(245,158,11,0.2)] text-[var(--aurora-gold)] border border-[rgba(245,158,11,0.4)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--aurora-gold)]'
                  }`}
                >
                  <Flag size={14} />{markedForReview.has(currentQuestion.id) ? 'Unmark' : 'Mark for Review'}
                </button>

                <GlowButton
                  variant="secondary"
                  onClick={() => setCurrentIndex(Math.min(questions.length - 1, currentIndex + 1))}
                  disabled={currentIndex === questions.length - 1}
                >
                  Next <ChevronRight size={18} />
                </GlowButton>
              </div>
            </div>
          ) : (
            <div className="text-center py-20 text-slate-400">
              <p className="text-lg mb-2">No question available.</p>
              <p className="text-sm">Please refresh the page or contact the invigilator.</p>
            </div>
          )}
        </main>
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md">
          <GlassCard variant="elevated" radius={24} className="!p-8 max-w-md w-full mx-4" hover={false} noHover>
            <h3 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--text-primary)] mb-3">
              Submit Test? 📝
            </h3>
            <p className="font-[family-name:var(--font-body)] text-sm text-[var(--text-muted)] mb-2">
              Answered: <strong className="text-[var(--aurora-purple)] font-[family-name:var(--font-mono)]">{answeredCount}</strong> / {questions.length}
            </p>
            <p className="font-[family-name:var(--font-body)] text-sm text-[var(--text-muted)] mb-6">
              Unanswered: <strong className="text-[var(--aurora-rose)] font-[family-name:var(--font-mono)]">{questions.length - answeredCount}</strong>
            </p>
            <p className="font-[family-name:var(--font-body)] text-xs text-[var(--aurora-rose)] bg-[rgba(244,63,94,0.1)] p-3 rounded-xl border border-[rgba(244,63,94,0.2)] mb-6">
              ⚠️ You cannot change your answers after submitting.
            </p>
            <div className="flex gap-4">
              <GlowButton variant="primary" fullWidth onClick={() => handleSubmit(false)} disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Confirm Submit'}
              </GlowButton>
              <GlowButton variant="ghost" fullWidth onClick={() => setShowSubmitModal(false)}>
                Go Back
              </GlowButton>
            </div>
          </GlassCard>
        </div>
      )}

      {/* HIGH-RES LIGHTBOX IMAGE ZOOM MODAL */}
      {zoomImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" onClick={() => setZoomImage(null)}>
          <div className="relative max-w-5xl max-h-[90vh] p-2 bg-black border border-white/20 rounded-2xl flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setZoomImage(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all cursor-pointer z-10"
            >
              <X size={20} />
            </button>
            <img
              src={formatImageUrl(zoomImage)}
              alt="High Res Circuit Diagram"
              className="max-h-[85vh] max-w-full object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
