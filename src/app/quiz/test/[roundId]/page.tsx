'use client';

import { useEffect, useState, useRef, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/supabase/client';
import GlassCard from '@/components/shared/GlassCard';
import GalaxyButton from '@/components/shared/GalaxyButton';
import QuizTimer from '@/components/quiz/QuizTimer';
import Logo from '@/components/shared/Logo';
import { formatImageUrl } from '@/lib/utils';
import {
  Bookmark, CheckCircle2, XCircle, CheckCircle, Loader2,
  AlertTriangle, HelpCircle, FileText, ShieldAlert, ShieldCheck, Maximize, AlertOctagon, Lock,
  Grid3X3, ChevronDown, Clock
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
  const [sessionReady, setSessionReady] = useState(false); // Prevents timer from firing before session loads

  // Question Engine
  const [questionOrder, setQuestionOrder] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionPayload | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [answersMap, setAnswersMap] = useState<Record<string, string>>({});
  const [markedQuestions, setMarkedQuestions] = useState<Record<string, boolean>>({});
  // Keep a ref to answersMap to avoid stale closures in goToQuestion/loadQuestion
  const answersMapRef = useRef<Record<string, string>>({});

  // UI & Loading States
  const [loading, setLoading] = useState(true);
  const [fetchingQ, setFetchingQ] = useState(false);
  const [questionLoadError, setQuestionLoadError] = useState<string | null>(null);
  const [savingStatus, setSavingStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submittingFinal, setSubmittingFinal] = useState(false);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [showMobilePalette, setShowMobilePalette] = useState(false);

  // Anti-Cheat & Security Proctoring States
  const [strikes, setStrikes] = useState<number>(0);
  const [warningModal, setWarningModal] = useState<{ open: boolean; reason: string; strikes: number } | null>(null);
  const [showFullscreenPrompt, setShowFullscreenPrompt] = useState(false);
  const MAX_STRIKES = 5; // Increased from 3 to prevent false-positive auto-disqualification
  const antiCheatArmed = useRef(false);
  const antiCheatGracePeriod = useRef(true); // Grace period after page load

  // Submission Guard: prevents double-submission from timer + manual + anti-cheat racing
  const hasSubmittedRef = useRef(false);

  // Network & Offline Queue States
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [pendingQueueCount, setPendingQueueCount] = useState<number>(0);

  // Cache & Debounce Refs
  const cachedQuestions = useRef<Map<string, QuestionPayload>>(new Map());
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Race condition prevention: only the latest loadQuestion request's result is applied
  const loadRequestCounter = useRef(0);

  // Keep answersMapRef in sync with answersMap state
  useEffect(() => {
    answersMapRef.current = answersMap;
  }, [answersMap]);

  // Reconnection Auto-Sync
  const flushOfflineQueue = useCallback(async () => {
    if (!attemptId) return;
    const queueKey = `quiz_offline_queue_${attemptId}`;
    const rawQueue = typeof window !== 'undefined' ? localStorage.getItem(queueKey) : null;
    if (!rawQueue) return;

    try {
      const queue: Array<{ question_id: string; selected: string }> = JSON.parse(rawQueue);
      if (queue.length === 0) return;

      for (const item of queue) {
        await fetch('/api/quiz/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            attempt_id: attemptId,
            question_id: item.question_id,
            selected: item.selected,
          }),
        });
      }

      localStorage.removeItem(queueKey);
      setPendingQueueCount(0);
      setSavingStatus('saved');
    } catch {
      /* retry later */
    }
  }, [attemptId]);

  // Network listeners
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setIsOnline(navigator.onLine);

    const handleOnline = async () => {
      setIsOnline(true);
      toast.success('🌐 Reconnected! Syncing offline answers...');
      await flushOfflineQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.error('📡 Offline Mode Active — Answers saved locally');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [flushOfflineQueue]);

  // 1. Initialize Exam Session
  useEffect(() => {
    const initSession = async () => {
      // 1. Read session from sessionStorage or localStorage
      let sessionStr = typeof window !== 'undefined' ? sessionStorage.getItem('quiz_session') : null;
      if (!sessionStr && typeof window !== 'undefined') {
        sessionStr = localStorage.getItem('quiz_session');
      }

      let attId = '';
      let partInfo: any = null;

      if (sessionStr) {
        try {
          const parsed = JSON.parse(sessionStr);
          attId = parsed.attempt_id;
          if (parsed.name) setParticipantName(parsed.name);
        } catch {
          // fallback
        }
      }

      // If no attId in session, check participant_info in localStorage to auto-recover session
      if (!attId && typeof window !== 'undefined') {
        const rawPart = localStorage.getItem('participant_info');
        if (rawPart) {
          try {
            partInfo = JSON.parse(rawPart);
          } catch {}
        }

        const userRegNo = partInfo?.register_no || partInfo?.registerNo;
        if (userRegNo) {
          try {
            const reEnterRes = await fetch('/api/quiz/enter', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...partInfo,
                register_no: userRegNo,
                round_id: roundId !== 'undefined' ? roundId : null,
              }),
            });
            const reEnterData = await reEnterRes.json();
            if (reEnterRes.ok && reEnterData.attempt_id) {
              attId = reEnterData.attempt_id;
              if (reEnterData.name || partInfo.name) setParticipantName(reEnterData.name || partInfo.name);
              const recoveredSession = {
                attempt_id: attId,
                participant_id: reEnterData.participant_id,
                name: reEnterData.name || partInfo.name,
                register_no: userRegNo,
                round_id: reEnterData.round_id || roundId,
              };
              sessionStorage.setItem('quiz_session', JSON.stringify(recoveredSession));
              localStorage.setItem('quiz_session', JSON.stringify(recoveredSession));
            }
          } catch (recoveryErr) {
            console.error('Session auto-recovery error:', recoveryErr);
          }
        }
      }

      if (!attId) {
        toast.error('Session expired. Please enter again.');
        router.push('/quiz');
        return;
      }
      setAttemptId(attId);

      // Fetch attempt, round & answers securely via server endpoint (bypasses anon client RLS)
      const res = await fetch(`/api/quiz/session?attempt_id=${attId}`);
      const sessionData = await res.json();

      if (!res.ok || !sessionData.attempt) {
        toast.error(sessionData.error || 'Invalid attempt session. Please re-enter.');
        router.push('/quiz');
        return;
      }

      const { attempt: att, round: rData, participantName: pName, answersMap: aMap } = sessionData;

      if (pName) setParticipantName(pName);

      if (att.disqualified) {
        router.push(`/quiz/disqualified?reason=${att.disqualification_reason || 'anti-cheat violation'}`);
        return;
      }

      if (att.status === 'submitted') {
        router.push(`/quiz/submitted?attempt_id=${attId}`);
        return;
      }

      if (rData) {
        setRoundTitle(rData.title || 'Competition Assessment');
        setDurationMinutes(rData.duration_minutes || 30);
      }
      setStartedAt(att.started_at || new Date().toISOString());

      let orderArr: string[] = att.question_order || [];
      if (orderArr.length > 50) {
        orderArr = orderArr.slice(0, 50);
      }
      setQuestionOrder(orderArr);

      if (orderArr.length === 0) {
        toast.error('No questions assigned for this round.');
        setLoading(false);
        return;
      }

      const initialAnswers = aMap || {};
      setAnswersMap(initialAnswers);
      answersMapRef.current = initialAnswers;

      // Prefetch first question
      await loadQuestion(0, orderArr, attId, initialAnswers);
      setLoading(false);
      // Mark session as ready AFTER all data is loaded — this enables the timer
      setSessionReady(true);
    };

    initSession();
  }, [roundId, router]);

  // 2. Question Loader with Cache + Race Condition Prevention
  const loadQuestion = useCallback(
    async (index: number, order: string[], attId: string, currentAnswers: Record<string, string>) => {
      const qId = order[index];
      if (!qId) return;

      // Assign a unique request ID to prevent stale async responses from overwriting current question
      const thisRequestId = ++loadRequestCounter.current;

      setFetchingQ(true);
      setQuestionLoadError(null);

      // Check Cache First — instant navigation for already-fetched questions
      if (cachedQuestions.current.has(qId)) {
        // Only apply if this is still the latest request (user hasn't clicked another question)
        if (loadRequestCounter.current === thisRequestId) {
          const cached = cachedQuestions.current.get(qId)!;
          setCurrentQuestion(cached);
          setSelectedAnswer(currentAnswers[qId] || '');
          setFetchingQ(false);
        }
        return;
      }

      try {
        const res = await fetch(`/api/quiz/question?id=${qId}&attempt_id=${attId}`);

        // ── STALE CHECK: If user already clicked another question while this was loading, discard ──
        if (loadRequestCounter.current !== thisRequestId) return;

        if (!res.ok) {
          const errData = await res.json().catch(() => ({ error: 'Unknown error' }));

          // 403 = Exam session ended (submitted/disqualified by server-side timer or anti-cheat)
          if (res.status === 403) {
            if (errData.error?.includes('terminated') || errData.error?.includes('disqualified')) {
              toast.error('Your exam session was terminated.');
              if (!hasSubmittedRef.current) {
                hasSubmittedRef.current = true;
                sessionStorage.removeItem('quiz_session');
                router.push(`/quiz/disqualified?reason=session_terminated`);
              }
            } else {
              // Exam was auto-submitted by server
              toast.error('⏰ Your exam time has expired. Redirecting to results...');
              if (!hasSubmittedRef.current) {
                hasSubmittedRef.current = true;
                sessionStorage.removeItem('quiz_session');
                if (typeof window !== 'undefined') localStorage.setItem('latest_quiz_attempt_id', attId);
                router.push(`/quiz/submitted?attempt_id=${attId}`);
              }
            }
            setFetchingQ(false);
            return;
          }

          // 404 = Question not found in DB (possibly deleted or wrong round)
          if (res.status === 404) {
            setQuestionLoadError(`Question ${index + 1} could not be loaded. It may have been removed.`);
            toast.error(`Question ${index + 1} not found. Try navigating to another question.`);
            setFetchingQ(false);
            return;
          }

          // Other errors
          setQuestionLoadError(errData.error || 'Failed to load question. Please try again.');
          setFetchingQ(false);
          return;
        }

        const data = await res.json();

        // ── SECOND STALE CHECK after JSON parsing ──
        if (loadRequestCounter.current !== thisRequestId) return;

        if (data.question) {
          cachedQuestions.current.set(qId, data.question);
          setCurrentQuestion(data.question);
          setSelectedAnswer(currentAnswers[qId] || data.savedAnswer || '');
          setQuestionLoadError(null);

          // ── BACKGROUND PRE-FETCH: Load next 2 adjacent questions for instant navigation ──
          const prefetchIndices = [index + 1, index + 2].filter(i => i < order.length);
          for (const pi of prefetchIndices) {
            const prefetchId = order[pi];
            if (prefetchId && !cachedQuestions.current.has(prefetchId)) {
              // Fire-and-forget prefetch (don't await, don't block current render)
              fetch(`/api/quiz/question?id=${prefetchId}&attempt_id=${attId}`)
                .then(r => r.ok ? r.json() : null)
                .then(d => { if (d?.question) cachedQuestions.current.set(prefetchId, d.question); })
                .catch(() => {}); // Silently ignore prefetch failures
            }
          }
        } else {
          setQuestionLoadError('Question data was empty. Please try another question.');
        }
      } catch (err) {
        // ── STALE CHECK on error path too ──
        if (loadRequestCounter.current !== thisRequestId) return;
        console.error('Error fetching question:', err);
        setQuestionLoadError('Network error loading question. Check your connection and try again.');
        toast.error('Network error. Your progress is auto-saved.');
      } finally {
        // Only clear loading if this is still the active request
        if (loadRequestCounter.current === thisRequestId) {
          setFetchingQ(false);
        }
      }
    },
    [router]
  );

  // Handle Question Navigation — uses answersMapRef to avoid stale closure
  const goToQuestion = useCallback((index: number) => {
    if (index < 0 || index >= questionOrder.length || !attemptId) return;
    setCurrentIndex(index);
    setShowMobilePalette(false); // Close mobile drawer on navigation
    loadQuestion(index, questionOrder, attemptId, answersMapRef.current);
  }, [questionOrder, attemptId, loadQuestion]);

  const lastViolationTime = useRef<number>(0);
  const lastViolationReason = useRef<string>('');

  // ── ANTI-CHEAT PROCTORING CORE ──
  const recordViolation = useCallback(
    async (reason: string) => {
      if (!attemptId || !antiCheatArmed.current) return;

      // Skip violations during grace period (first 5 seconds after arming)
      if (antiCheatGracePeriod.current) return;

      // Skip if already submitted
      if (hasSubmittedRef.current) return;

      // 3 second cooldown between ALL strikes to prevent cascading triggers
      // (e.g. visibilitychange + blur + fullscreenchange all fire together)
      const now = Date.now();
      if (now - lastViolationTime.current < 3000) {
        return;
      }

      // Deduplicate: same reason within 10 seconds counts as one event
      if (reason === lastViolationReason.current && now - lastViolationTime.current < 10000) {
        return;
      }

      lastViolationTime.current = now;
      lastViolationReason.current = reason;

      setStrikes((prev) => {
        const nextStrikes = prev + 1;

        // Log proctoring event to database (fire-and-forget)
        fetch('/api/quiz/proctor-event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ attempt_id: attemptId, eventType: reason }),
        }).catch(() => {});

        if (nextStrikes >= MAX_STRIKES) {
          // Auto-disqualify on max strikes — but only if not already submitted
          if (!hasSubmittedRef.current) {
            hasSubmittedRef.current = true;
            fetch('/api/quiz/submit', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                attempt_id: attemptId,
                forceDisqualify: true,
                reason: reason,
              }),
            }).finally(() => {
              sessionStorage.removeItem('quiz_session');
              router.push(`/quiz/disqualified?reason=${reason}`);
            });
          }
        } else {
          setWarningModal({
            open: true,
            reason: reason,
            strikes: nextStrikes,
          });
        }

        return nextStrikes;
      });
    },
    [attemptId, router]
  );

  const requestFullscreenMode = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
      setShowFullscreenPrompt(false);
      // Arm anti-cheat ONLY after fullscreen is confirmed entered
      // Add a 5-second grace period so browser events from entering fullscreen don't count as violations
      antiCheatArmed.current = true;
      antiCheatGracePeriod.current = true;
      setTimeout(() => {
        antiCheatGracePeriod.current = false;
      }, 5000);
    } catch {
      // Don't block the exam — just show a warning
      toast.error('Fullscreen not supported. The exam will continue, but proctoring is active.');
      setShowFullscreenPrompt(false);
      antiCheatArmed.current = true;
      antiCheatGracePeriod.current = true;
      setTimeout(() => {
        antiCheatGracePeriod.current = false;
      }, 5000);
    }
  };

  // ── ANTI-CHEAT EVENT LISTENERS ──
  useEffect(() => {
    if (loading || !attemptId) return;

    // Prompt for fullscreen if not currently in fullscreen
    // Do NOT arm anti-cheat yet — it arms only when fullscreen is actually entered
    if (!document.fullscreenElement) {
      setShowFullscreenPrompt(true);
    } else {
      // Already in fullscreen (e.g. session recovery)
      antiCheatArmed.current = true;
      antiCheatGracePeriod.current = true;
      setTimeout(() => {
        antiCheatGracePeriod.current = false;
      }, 5000);
    }

    // 1. Block Context Menu (Right Click)
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      toast.error('🔒 Right-click is strictly disabled during the exam.');
    };
    document.addEventListener('contextmenu', handleContextMenu);

    // 2. Block Copy, Paste, Cut, Selection
    const handleCopyPaste = (e: Event) => {
      e.preventDefault();
      toast.error('🔒 Copy/Paste operations are blocked.');
    };
    ['copy', 'paste', 'cut', 'selectstart'].forEach((ev) => {
      document.addEventListener(ev, handleCopyPaste);
    });

    // 3. Block Developer Tools & Hotkeys (only block keys, don't count as strikes for common shortcuts)
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const isDevTools =
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && ['i', 'j', 'c'].includes(key)) ||
        (e.ctrlKey && key === 'u');

      const isForbiddenAction =
        (e.ctrlKey && ['c', 'v', 'x', 'a', 'p', 's'].includes(key)) ||
        e.key === 'PrintScreen';

      // Block F5 and Ctrl+R silently (prevent page refresh without counting as strike)
      const isRefreshAttempt =
        e.key === 'F5' || (e.ctrlKey && key === 'r');

      if (isDevTools) {
        e.preventDefault();
        e.stopPropagation();
        recordViolation('devtools_detected');
      } else if (isForbiddenAction) {
        e.preventDefault();
        e.stopPropagation();
        // Block the action but don't count common shortcuts as strikes
        toast.error('🔒 This operation is blocked during the exam.');
      } else if (isRefreshAttempt) {
        e.preventDefault();
        e.stopPropagation();
        toast.error('🔒 Page refresh is blocked. Your progress is auto-saved.');
      }
    };
    document.addEventListener('keydown', handleKeyDown, { capture: true });

    // 4. Tab Switch & Visibility Change Detection
    // Only count as violation if anti-cheat is armed AND grace period is over
    const handleVisibilityChange = () => {
      if (document.hidden && antiCheatArmed.current && !antiCheatGracePeriod.current) {
        recordViolation('tab_switch');
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 5. Window Blur Detection — REMOVED as separate listener
    // Reason: blur fires simultaneously with visibilitychange and fullscreenchange,
    // causing 2-3 strikes to fire at once. visibilitychange alone is sufficient.

    // 6. Fullscreen Exit Detection
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && antiCheatArmed.current && !antiCheatGracePeriod.current) {
        recordViolation('fullscreen_exit');
        setShowFullscreenPrompt(true);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    // 7. DevTools Dimension Anomaly Check — increased threshold to reduce false positives
    const devToolsInterval = setInterval(() => {
      if (!antiCheatArmed.current || antiCheatGracePeriod.current) return;
      const threshold = 200; // Increased from 160 to reduce false positives on laptops with scaling
      if (
        window.outerWidth - window.innerWidth > threshold ||
        window.outerHeight - window.innerHeight > threshold
      ) {
        recordViolation('devtools_detected');
      }
    }, 3000); // Reduced frequency from 1.5s to 3s

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      ['copy', 'paste', 'cut', 'selectstart'].forEach((ev) => {
        document.removeEventListener(ev, handleCopyPaste);
      });
      document.removeEventListener('keydown', handleKeyDown, { capture: true });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      clearInterval(devToolsInterval);
    };
  }, [loading, attemptId, recordViolation]);

  // Debounced Auto-Save with LocalStorage Cache & Offline Queue
  const triggerAutoSave = (qId: string, value: string) => {
    if (!attemptId) return;
    setSavingStatus('saving');

    // 1. Immediately cache in LocalStorage (Never lose student progress)
    const cacheKey = `quiz_answers_${attemptId}`;
    const queueKey = `quiz_offline_queue_${attemptId}`;

    const existingCache = JSON.parse(localStorage.getItem(cacheKey) || '{}');
    existingCache[qId] = value;
    localStorage.setItem(cacheKey, JSON.stringify(existingCache));

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(async () => {
      if (!navigator.onLine) {
        // Add to offline queue
        const existingQueue: Array<{ question_id: string; selected: string }> = JSON.parse(localStorage.getItem(queueKey) || '[]');
        const updatedQueue = existingQueue.filter(i => i.question_id !== qId);
        updatedQueue.push({ question_id: qId, selected: value });
        localStorage.setItem(queueKey, JSON.stringify(updatedQueue));

        setPendingQueueCount(updatedQueue.length);
        setSavingStatus('saved');
        return;
      }

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
          // Check if the server auto-submitted due to time expiry
          try {
            const errData = await res.json();
            if (errData.expired) {
              // Server has auto-submitted — redirect to results
              toast.error('⏰ Exam time has expired! Your answers have been saved.');
              if (!hasSubmittedRef.current) {
                hasSubmittedRef.current = true;
                sessionStorage.removeItem('quiz_session');
                localStorage.setItem('latest_quiz_attempt_id', attemptId);
                router.push(`/quiz/submitted?attempt_id=${attemptId}`);
              }
              return;
            }
          } catch {}
          setSavingStatus('idle');
        }
      } catch {
        setSavingStatus('idle');
      }
    }, 600);
  };

  // Answer Select Handler
  const handleSelectAnswer = (value: string) => {
    if (!currentQuestion) return;
    setSelectedAnswer(value);
    const newMap = { ...answersMapRef.current, [currentQuestion.id]: value };
    setAnswersMap(newMap);
    answersMapRef.current = newMap;
    triggerAutoSave(currentQuestion.id, value);
  };

  // Mark for Review Toggle
  const toggleMarkReview = () => {
    if (!currentQuestion) return;
    const qId = currentQuestion.id;
    setMarkedQuestions((prev) => ({ ...prev, [qId]: !prev[qId] }));
  };

  // Final Submission Handler — protected by hasSubmittedRef to prevent double-submission
  const handleFinalSubmit = async () => {
    if (!attemptId) return;
    // Prevent double-submission from timer + manual + anti-cheat racing
    if (hasSubmittedRef.current) return;
    hasSubmittedRef.current = true;
    setSubmittingFinal(true);

    try {
      // Ensure any pending offline answers are synced before grading
      await flushOfflineQueue();

      const res = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attempt_id: attemptId }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        sessionStorage.removeItem('quiz_session');
        if (typeof window !== 'undefined') {
          localStorage.setItem('latest_quiz_attempt_id', attemptId);
        }
        router.push(`/quiz/submitted?attempt_id=${attemptId}&score=${data.score}&rank=${data.rank}`);
      } else if (data.error === 'Attempt already submitted') {
        // Already submitted by timer or server-side — just redirect
        sessionStorage.removeItem('quiz_session');
        router.push(`/quiz/submitted?attempt_id=${attemptId}`);
      } else {
        toast.error(data.error || 'Failed to submit quiz');
        hasSubmittedRef.current = false; // Allow retry on actual errors
        setSubmittingFinal(false);
      }
    } catch {
      toast.error('Error submitting quiz. Please check your connection and try again.');
      hasSubmittedRef.current = false; // Allow retry on network errors
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
        <header className="col-span-full h-[60px] bg-[rgba(6,1,14,0.95)] border-b border-[rgba(168,85,247,0.12)] px-3 sm:px-5 flex items-center justify-between z-30">
          {/* Left: Logo + mobile timer + question palette toggle */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Logo size="sm" showText={false} />

            {/* ── MOBILE TIMER (visible only on mobile, replaces the hidden right panel) ── */}
            {sessionReady && (
              <div className="flex md:hidden items-center gap-1.5 px-2 py-1 rounded-lg bg-[rgba(6,182,212,0.1)] border border-[rgba(6,182,212,0.3)]">
                <Clock size={12} className="text-[var(--aurora-cyan)]" />
                <QuizTimer
                  totalDurationMinutes={durationMinutes}
                  startedAtIso={startedAt}
                  onTimeUp={() => handleFinalSubmit()}
                  compact
                />
              </div>
            )}

            {/* ── MOBILE QUESTION PALETTE TOGGLE ── */}
            <button
              onClick={() => setShowMobilePalette(!showMobilePalette)}
              className="flex md:hidden items-center gap-1 px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-[family-name:var(--font-mono)] text-[var(--text-muted)] hover:bg-white/10 transition-all"
            >
              <Grid3X3 size={12} />
              <span>{currentIndex + 1}/{questionOrder.length}</span>
              <ChevronDown size={10} className={`transition-transform ${showMobilePalette ? 'rotate-180' : ''}`} />
            </button>

            <div className="h-5 w-[1px] bg-[rgba(255,255,255,0.1)] hidden sm:block" />
            <span className="font-[family-name:var(--font-heading)] text-sm text-[var(--text-secondary)] font-medium truncate max-w-[120px] sm:max-w-[300px] hidden sm:inline">
              {roundTitle}
            </span>
          </div>

          {/* Center Progress Counter & Proctor Badge (desktop only) */}
          <div className="hidden sm:flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[rgba(16,185,129,0.1)] border border-[rgba(16,185,129,0.3)] text-xs text-[#10B981] font-[family-name:var(--font-mono)]">
              {strikes > 0 ? (
                <>
                  <ShieldAlert size={13} className="text-[#F43F5E] animate-pulse" />
                  <span className="text-[#F43F5E] font-bold">⚠️ Strikes: {strikes}/{MAX_STRIKES}</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={13} className="text-[#10B981]" />
                  <span>Proctor Active</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-3">
              <span className="font-[family-name:var(--font-mono)] text-xs text-[var(--text-muted)]">
                {currentIndex + 1} of {questionOrder.length} Qs
              </span>
              <div className="w-[100px] h-1.5 rounded-full bg-[rgba(255,255,255,0.08)] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#A855F7] to-[#06B6D4] transition-all duration-300"
                  style={{ width: `${((currentIndex + 1) / questionOrder.length) * 100}%` }}
                />
              </div>
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

        {/* ═══ MOBILE QUESTION PALETTE DROPDOWN ═══ */}
        {showMobilePalette && (
          <div className="md:hidden col-span-full bg-[rgba(4,0,10,0.98)] border-b border-[rgba(168,85,247,0.15)] px-3 py-3 z-20 animate-[questionIn_0.15s_ease-out]">
            <div className="grid grid-cols-10 gap-1.5 max-h-[120px] overflow-y-auto">
              {questionOrder.map((qId, idx) => {
                const isAnswered = answersMap[qId] !== undefined && answersMap[qId] !== '';
                const isCurrent = idx === currentIndex;
                const isRev = !!markedQuestions[qId];

                let bgStyle = 'rgba(255,255,255,0.04)';
                let borderStyle = 'rgba(255,255,255,0.08)';
                let textColor = 'var(--text-dim)';

                if (isCurrent) {
                  bgStyle = 'rgba(6,182,212,0.25)';
                  borderStyle = '2px solid rgba(6,182,212,0.7)';
                  textColor = 'white';
                } else if (isAnswered) {
                  bgStyle = 'rgba(168,85,247,0.2)';
                  borderStyle = '1px solid rgba(168,85,247,0.45)';
                  textColor = 'var(--aurora-purple)';
                } else if (isRev) {
                  bgStyle = 'rgba(245,158,11,0.18)';
                  borderStyle = '1px solid rgba(245,158,11,0.4)';
                  textColor = 'var(--aurora-gold)';
                }

                return (
                  <button
                    key={qId}
                    onClick={() => goToQuestion(idx)}
                    className="w-7 h-7 rounded-lg font-[family-name:var(--font-mono)] font-semibold text-[10px] flex items-center justify-center cursor-pointer"
                    style={{ background: bgStyle, border: borderStyle, color: textColor }}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center justify-between mt-2 text-[10px] text-[var(--text-dim)] font-[family-name:var(--font-mono)]">
              <span>✅ {answeredCount} answered</span>
              <span>📝 {questionOrder.length - answeredCount} remaining</span>
            </div>
          </div>
        )}

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
            {/* Error State: Question failed to load */}
            {questionLoadError && !fetchingQ ? (
              <GlassCard variant="elevated" radius={20} hover={false} noHover className="!p-8 text-center py-12 border border-[rgba(244,63,94,0.3)]">
                <AlertTriangle size={28} className="mx-auto text-[var(--aurora-gold)] mb-3" />
                <p className="font-[family-name:var(--font-body)] text-sm text-[var(--text-primary)] font-medium mb-2">Question Load Error</p>
                <p className="font-[family-name:var(--font-body)] text-xs text-[var(--text-muted)] font-light mb-4">{questionLoadError}</p>
                <div className="flex items-center justify-center gap-3">
                  <GalaxyButton variant="secondary" size="sm" onClick={() => goToQuestion(currentIndex)}>
                    Retry Loading
                  </GalaxyButton>
                  {currentIndex < questionOrder.length - 1 && (
                    <GalaxyButton variant="primary" size="sm" onClick={() => goToQuestion(currentIndex + 1)}>
                      Skip to Next →
                    </GalaxyButton>
                  )}
                </div>
              </GlassCard>
            ) : fetchingQ || !currentQuestion ? (
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
                      {((currentQuestion as any).subject_name || currentQuestion.category) && (
                        <span className="px-2.5 py-1 rounded-lg bg-[rgba(0,229,255,0.12)] border border-[rgba(0,229,255,0.28)] font-[family-name:var(--font-heading)] font-semibold text-xs text-[#00E5FF]">
                          📚 {(currentQuestion as any).subject_name || currentQuestion.category}
                        </span>
                      )}
                      <span className="px-2.5 py-1 rounded-lg bg-[rgba(6,182,212,0.12)] border border-[rgba(6,182,212,0.25)] font-[family-name:var(--font-heading)] text-xs text-[var(--aurora-cyan)] uppercase">
                        {currentQuestion.question_type.replace('_', ' ')}
                      </span>
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
                    <span className="px-2.5 py-0.5 rounded-full bg-[rgba(16,185,129,0.14)] text-[var(--aurora-green)] border border-[rgba(16,185,129,0.3)] font-semibold">
                      +{currentQuestion.marks} marks
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-white/5 text-[#94A3B8] border border-white/10 text-[10px]">
                      No Negative Marking
                    </span>
                  </div>

                  {/* Question Text */}
                  <h2 className="font-[family-name:var(--font-body)] font-medium text-base sm:text-lg text-[var(--text-primary)] leading-relaxed">
                    {currentQuestion.question_text}
                  </h2>

                  {/* Question Image (Only rendered if image_url exists and is non-empty) */}
                  {Boolean(currentQuestion.image_url && currentQuestion.image_url.trim()) && (
                    <div
                      className="mt-4 mb-4 p-3 rounded-xl bg-black/60 border border-[rgba(255,255,255,0.12)] flex flex-col items-center gap-2 group cursor-pointer hover:border-[#00E5FF]/40 transition-all"
                      onClick={() => setZoomImage(formatImageUrl(currentQuestion.image_url))}
                    >
                      <div className="w-full flex items-center justify-between text-xs text-[#94A3B8] font-mono px-1">
                        <span>⚡ Question Diagram / Figure</span>
                        <span className="text-[#00E5FF] group-hover:underline">🔍 Click to Expand</span>
                      </div>
                      <img
                        src={formatImageUrl(currentQuestion.image_url)}
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

            {/* Auto-save & Network Status Indicator */}
            <div className="flex items-center gap-2 font-[family-name:var(--font-body)] text-xs font-light">
              {!isOnline ? (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-[10px] font-mono animate-pulse flex items-center gap-1">
                  <span>📡 Offline Mode (Local Cache Active)</span>
                  {pendingQueueCount > 0 && <span className="font-bold">({pendingQueueCount} queued)</span>}
                </span>
              ) : (
                <>
                  {savingStatus === 'saving' && (
                    <>
                      <Loader2 size={12} className="animate-spin text-[var(--aurora-cyan)]" />
                      <span className="text-[#94A3B8]">Syncing...</span>
                    </>
                  )}
                  {savingStatus === 'saved' && (
                    <>
                      <CheckCircle size={12} className="text-[var(--aurora-green)]" />
                      <span className="text-emerald-400">All Answers Synced</span>
                    </>
                  )}
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
            {/* Only render timer AFTER session data is fully loaded to prevent premature onTimeUp */}
            {sessionReady ? (
              <QuizTimer
                totalDurationMinutes={durationMinutes}
                startedAtIso={startedAt}
                onTimeUp={() => handleFinalSubmit()}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-[140px]">
                <Loader2 size={20} className="animate-spin text-[var(--aurora-cyan)]" />
                <span className="font-[family-name:var(--font-mono)] text-[9px] text-[var(--text-dim)] mt-2">Loading timer...</span>
              </div>
            )}

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

      {/* FULLSCREEN PROMPT MODAL */}
      {showFullscreenPrompt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
          <GlassCard variant="pink" radius={24} hover={false} noHover className="!p-8 max-w-md w-full border border-[rgba(244,63,94,0.4)] text-center space-y-5 shadow-[0_0_50px_rgba(244,63,94,0.25)]">
            <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center bg-[rgba(244,63,94,0.15)] border border-[rgba(244,63,94,0.4)]">
              <Lock size={30} className="text-[#F43F5E]" />
            </div>

            <h3 className="font-[family-name:var(--font-display)] font-extrabold text-2xl text-white">
              🔒 Fullscreen Mode Required
            </h3>

            <p className="font-[family-name:var(--font-body)] text-xs text-[#94A3B8] leading-relaxed">
              This competition is protected by live proctoring. You must remain in <strong className="text-white">Fullscreen mode</strong> throughout the assessment. Switching tabs, exiting fullscreen, or using developer tools will result in security strikes and potential disqualification.
            </p>

            <GalaxyButton variant="primary" fullWidth size="lg" onClick={requestFullscreenMode} className="flex items-center justify-center gap-2">
              <Maximize size={18} /> Enter Fullscreen & Begin 🚀
            </GalaxyButton>
          </GlassCard>
        </div>
      )}

      {/* ANTI-CHEAT STRIKE WARNING MODAL */}
      {warningModal?.open && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <GlassCard variant="pink" radius={24} hover={false} noHover className="!p-8 max-w-md w-full border-2 border-[#F43F5E] text-center space-y-4 shadow-[0_0_60px_rgba(244,63,94,0.4)] animate-shake">
            <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center bg-[rgba(244,63,94,0.2)] border-2 border-[#F43F5E]">
              <AlertOctagon size={36} className="text-[#F43F5E]" />
            </div>

            <div>
              <span className="px-3 py-1 rounded-full bg-[rgba(244,63,94,0.2)] text-[#FDA4AF] font-[family-name:var(--font-mono)] font-bold text-xs uppercase tracking-wider">
                Security Strike {warningModal.strikes} of {MAX_STRIKES}
              </span>
              <h3 className="font-[family-name:var(--font-display)] font-extrabold text-2xl text-[#F43F5E] mt-2">
                ⚠️ Security Violation Detected
              </h3>
            </div>

            <div className="p-3 rounded-xl bg-[rgba(244,63,94,0.1)] border border-[rgba(244,63,94,0.3)] font-[family-name:var(--font-mono)] text-xs text-[#FDA4AF]">
              {warningModal.reason === 'tab_switch' && 'Tab switching or window minimization detected.'}
              {warningModal.reason === 'window_blur' && 'Window focus lost / application switch detected.'}
              {warningModal.reason === 'fullscreen_exit' && 'Fullscreen mode was exited.'}
              {warningModal.reason === 'devtools_detected' && 'Developer tools inspection detected.'}
              {warningModal.reason === 'keyboard_shortcut' && 'Blocked shortcut used (Ctrl+C, Ctrl+V, F12, etc.).'}
            </div>

            <p className="font-[family-name:var(--font-body)] text-xs text-[#E2E8F0] leading-relaxed">
              If you reach <strong className="text-[#F43F5E] font-bold">3 strikes</strong>, your test will be instantly terminated, disqualified, and submitted with zero tolerance.
            </p>

            <GalaxyButton
              variant="primary"
              fullWidth
              size="md"
              onClick={async () => {
                setWarningModal(null);
                await requestFullscreenMode();
              }}
              className="!bg-[#F43F5E] hover:!bg-[#E11D48] text-white font-bold"
            >
              I Understand — Return to Exam 🛡️
            </GalaxyButton>
          </GlassCard>
        </div>
      )}

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
