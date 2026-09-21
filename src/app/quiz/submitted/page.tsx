'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '@/components/shared/GlassCard';
import GalaxyButton from '@/components/shared/GalaxyButton';
import AuroraBackground from '@/components/shared/AuroraBackground';
import Logo from '@/components/shared/Logo';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Trophy,
  Award,
  Home,
  Clock,
  Check,
  X,
  Printer,
  ChevronRight,
  Filter,
  Sparkles,
  Zap,
  BookOpen,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';
import CountUp from 'react-countup';

interface QuestionAnalysis {
  id: string;
  orderIndex: number;
  questionText: string;
  questionType: string;
  imageUrl: string | null;
  category: string;
  difficulty: string;
  options: string[];
  userSelectedRaw: string | null;
  userSelectedText: string | null;
  userSelectedIndex: number | null;
  correctAnswerRaw: string;
  correctAnswerText: string;
  correctIndex: number | null;
  isCorrect: boolean;
  isWrong: boolean;
  isSkipped: boolean;
  marksAwarded: number;
  maxMarks: number;
  negativePenalty: number;
}

interface AnalysisSummary {
  attemptId: string;
  roundId: string;
  roundTitle: string;
  participantName: string;
  registerNo: string;
  department: string;
  section: string;
  email: string;
  score: number;
  totalPossibleMarks: number;
  percentage: number;
  accuracy: number;
  rank: number;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  timeTakenSeconds: number;
  startedAt: string;
  submittedAt: string;
  disqualified: boolean;
  disqualificationReason: string | null;
}

function SubmittedContent() {
  const searchParams = useSearchParams();
  const paramAttemptId = searchParams.get('attempt_id');
  const scoreStr = searchParams.get('score');
  const rankStr = searchParams.get('rank');

  const fallbackScore = scoreStr !== null && !isNaN(Number(scoreStr)) ? Number(scoreStr) : null;
  const fallbackRank = rankStr !== null && !isNaN(Number(rankStr)) ? Number(rankStr) : null;

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<AnalysisSummary | null>(null);
  const [questions, setQuestions] = useState<QuestionAnalysis[]>([]);
  const [filterTab, setFilterTab] = useState<'all' | 'wrong' | 'correct' | 'skipped'>('all');
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalysis = async () => {
      let targetAttemptId = paramAttemptId;
      if (!targetAttemptId && typeof window !== 'undefined') {
        targetAttemptId = localStorage.getItem('latest_quiz_attempt_id');
      }

      if (!targetAttemptId) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/quiz/analysis?attempt_id=${targetAttemptId}`);
        const data = await res.json();

        if (res.ok && data.success) {
          setSummary(data.summary);
          setQuestions(data.questions || []);
        }
      } catch (err) {
        console.error('Failed to load detailed quiz analysis:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [paramAttemptId]);

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    if (m === 0) return `${s}s`;
    return `${m}m ${s}s`;
  };

  const filteredQuestions = questions.filter((q) => {
    if (filterTab === 'wrong') return q.isWrong;
    if (filterTab === 'correct') return q.isCorrect;
    if (filterTab === 'skipped') return q.isSkipped;
    return true;
  });

  const displayScore = summary ? summary.score : fallbackScore ?? 0;
  const displayRank = summary ? summary.rank : fallbackRank ?? 1;
  const displayTotalMarks = summary?.totalPossibleMarks || 100;
  const displayPercentage = summary?.percentage ?? Math.round((displayScore / displayTotalMarks) * 100);

  return (
    <AuroraBackground>
      <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 relative z-10 w-full max-w-5xl mx-auto select-none">
        {/* Zoom Image Modal */}
        {zoomedImage && (
          <div
            className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md cursor-pointer"
            onClick={() => setZoomedImage(null)}
          >
            <div className="relative max-w-4xl w-full p-4 bg-[#0a0a0f] border border-white/20 rounded-2xl flex flex-col items-center">
              <button
                onClick={() => setZoomedImage(null)}
                className="absolute top-4 right-4 text-white text-lg font-bold bg-white/10 hover:bg-white/20 w-8 h-8 rounded-full flex items-center justify-center"
              >
                ✕
              </button>
              <img src={zoomedImage} alt="Enlarged Circuit" className="max-h-[80vh] object-contain rounded-lg" />
              <span className="text-xs text-[#94A3B8] font-mono mt-3">⚡ Click anywhere to close</span>
            </div>
          </div>
        )}

        {/* ═══ TOP NAVBAR & BRAND ═══ */}
        <header className="flex items-center justify-between pb-8 border-b border-white/10 print:hidden">
          <Link href="/" className="flex items-center gap-3">
            <Logo size="sm" showText={false} />
            <div className="flex flex-col">
              <span className="font-[family-name:var(--font-heading)] font-bold text-sm text-white tracking-wide">
                PORTIZ · ELECTRONICS CLUB
              </span>
              <span className="text-[10px] text-[#94A3B8] uppercase tracking-widest font-mono">
                Performance Evaluation & Post-Exam Audit
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-xs text-[#94A3B8] hover:text-white transition-all cursor-pointer font-mono"
              title="Print Official Scorecard"
            >
              <Printer size={14} />
              <span className="hidden sm:inline">Print Scorecard</span>
            </button>
            <Link href="/quiz">
              <GalaxyButton variant="secondary" size="sm">
                <ArrowRight size={13} />
                <span>Rounds</span>
              </GalaxyButton>
            </Link>
          </div>
        </header>

        {/* ═══ HERO CELEBRATION & PARTICIPANT BANNER ═══ */}
        <section className="pt-8 pb-6 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="w-16 h-16 rounded-full bg-[rgba(16,185,129,0.18)] border-2 border-[rgba(16,185,129,0.5)] flex items-center justify-center mx-auto text-[var(--aurora-green)] shadow-[0_0_30px_rgba(16,185,129,0.4)] mb-4"
          >
            <CheckCircle2 size={36} />
          </motion.div>

          <motion.h1
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="font-[family-name:var(--font-display)] font-extrabold text-3xl sm:text-4xl text-white tracking-tight"
          >
            Exam Completed & Analyzed! 🎉
          </motion.h1>

          <p className="font-[family-name:var(--font-body)] text-sm text-[#94A3B8] mt-2 max-w-xl mx-auto">
            Your responses have been verified and graded against the official answer key. Below is your detailed individual question-by-question analysis.
          </p>

          {/* Participant Credentials Ribbon */}
          {summary && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-4 inline-flex flex-wrap items-center justify-center gap-2 sm:gap-4 px-4 py-2 rounded-2xl bg-white/[0.04] border border-white/10 font-mono text-xs text-[#CBD5E1]"
            >
              <span className="font-semibold text-white">{summary.participantName}</span>
              <span className="text-white/30">•</span>
              <span className="text-[#00E5FF]">Reg: {summary.registerNo}</span>
              <span className="text-white/30">•</span>
              <span>Section {summary.section}</span>
              <span className="text-white/30">•</span>
              <span className="text-[#A78BFA]">{summary.roundTitle}</span>
            </motion.div>
          )}
        </section>

        {/* ═══ EXECUTIVE SCORECARD & KPI GRID ═══ */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 my-6">
          {/* Card 1: Final Score */}
          <GlassCard variant="elevated" radius={20} hover={false} noHover className="!p-4 sm:!p-5 border-emerald-500/20 text-center">
            <span className="font-mono text-[10px] uppercase text-[#94A3B8] tracking-widest block mb-1">
              Final Score
            </span>
            <div className="font-mono font-extrabold text-2xl sm:text-3xl text-emerald-400 flex items-center justify-center gap-1">
              <CountUp end={displayScore} duration={1.2} decimals={displayScore % 1 !== 0 ? 1 : 0} />
              <span className="text-sm font-normal text-[#64748B]">/ {displayTotalMarks}</span>
            </div>
            <div className="mt-2 inline-block px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 font-mono text-[10px] font-semibold">
              {displayPercentage}% Total Marks
            </div>
          </GlassCard>

          {/* Card 2: Current Standing / Rank */}
          <GlassCard variant="elevated" radius={20} hover={false} noHover className="!p-4 sm:!p-5 border-amber-500/20 text-center">
            <span className="font-mono text-[10px] uppercase text-[#94A3B8] tracking-widest block mb-1">
              Round Standing
            </span>
            <div className="font-mono font-extrabold text-2xl sm:text-3xl text-amber-400 flex items-center justify-center gap-1">
              <Trophy size={20} className="text-amber-400" />
              <span>#{displayRank}</span>
            </div>
            <div className="mt-2 inline-block px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 font-mono text-[10px] font-semibold">
              Leaderboard Rank
            </div>
          </GlassCard>

          {/* Card 3: Accuracy & Breakdown */}
          <GlassCard variant="elevated" radius={20} hover={false} noHover className="!p-4 sm:!p-5 border-cyan-500/20 text-center">
            <span className="font-mono text-[10px] uppercase text-[#94A3B8] tracking-widest block mb-1">
              Accuracy
            </span>
            <div className="font-mono font-extrabold text-2xl sm:text-3xl text-cyan-400 flex items-center justify-center gap-1">
              <Sparkles size={18} className="text-cyan-400" />
              <span>{summary ? summary.accuracy : 100}%</span>
            </div>
            <div className="mt-2 flex items-center justify-center gap-2 text-[10px] font-mono">
              <span className="text-emerald-400 font-bold">✓ {summary?.correctCount ?? 0}</span>
              <span className="text-rose-400 font-bold">✗ {summary?.wrongCount ?? 0}</span>
              <span className="text-[#64748B] font-bold">○ {summary?.skippedCount ?? 0}</span>
            </div>
          </GlassCard>

          {/* Card 4: Time Spent */}
          <GlassCard variant="elevated" radius={20} hover={false} noHover className="!p-4 sm:!p-5 border-purple-500/20 text-center">
            <span className="font-mono text-[10px] uppercase text-[#94A3B8] tracking-widest block mb-1">
              Time Elapsed
            </span>
            <div className="font-mono font-extrabold text-2xl sm:text-3xl text-purple-300 flex items-center justify-center gap-1">
              <Clock size={18} className="text-purple-400" />
              <span>{summary ? formatSeconds(summary.timeTakenSeconds) : '--'}</span>
            </div>
            <div className="mt-2 inline-block px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 font-mono text-[10px] font-semibold">
              Completed on Time
            </div>
          </GlassCard>
        </section>

        {/* ═══ QUESTION-BY-QUESTION INDIVIDUAL PERFORMANCE ANALYSIS ═══ */}
        <section className="my-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div>
              <h2 className="font-[family-name:var(--font-heading)] font-bold text-xl text-white flex items-center gap-2">
                <BookOpen size={20} className="text-[#00E5FF]" />
                <span>Question-by-Question Detailed Analysis</span>
              </h2>
              <p className="text-xs text-[#94A3B8] font-light mt-0.5">
                Review your selected choices versus the correct answers to understand where marks were scored or lost.
              </p>
            </div>

            {/* Interactive Filter Pills */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/[0.04] border border-white/10 self-start sm:self-auto overflow-x-auto print:hidden">
              <button
                onClick={() => setFilterTab('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                  filterTab === 'all'
                    ? 'bg-white/15 text-white font-semibold shadow-sm'
                    : 'text-[#94A3B8] hover:text-white'
                }`}
              >
                All ({questions.length})
              </button>

              <button
                onClick={() => setFilterTab('wrong')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer flex items-center gap-1 ${
                  filterTab === 'wrong'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold shadow-[0_0_12px_rgba(244,63,94,0.2)]'
                    : 'text-rose-400/80 hover:text-rose-300'
                }`}
              >
                <XCircle size={12} />
                <span>Wrong ({summary?.wrongCount ?? 0})</span>
              </button>

              <button
                onClick={() => setFilterTab('correct')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer flex items-center gap-1 ${
                  filterTab === 'correct'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold'
                    : 'text-emerald-400/80 hover:text-emerald-300'
                }`}
              >
                <CheckCircle2 size={12} />
                <span>Correct ({summary?.correctCount ?? 0})</span>
              </button>

              <button
                onClick={() => setFilterTab('skipped')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer flex items-center gap-1 ${
                  filterTab === 'skipped'
                    ? 'bg-slate-500/20 text-slate-300 border border-slate-500/30 font-semibold'
                    : 'text-[#94A3B8] hover:text-white'
                }`}
              >
                <AlertCircle size={12} />
                <span>Skipped ({summary?.skippedCount ?? 0})</span>
              </button>
            </div>
          </div>

          {/* Loading Skeleton */}
          {loading && (
            <div className="py-16 text-center space-y-3">
              <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin mx-auto" />
              <p className="font-mono text-xs text-[#94A3B8]">Compiling comprehensive test analysis...</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredQuestions.length === 0 && (
            <div className="py-16 text-center p-8 rounded-2xl bg-white/[0.02] border border-white/10 my-4">
              <CheckCircle2 size={36} className="text-emerald-400 mx-auto mb-2" />
              <h3 className="font-semibold text-white text-base">No questions match this filter</h3>
              <p className="text-xs text-[#94A3B8] mt-1">
                {filterTab === 'wrong'
                  ? 'Outstanding performance! You answered zero questions incorrectly.'
                  : 'No questions found under this filter.'}
              </p>
            </div>
          )}

          {/* Question Cards List */}
          <div className="space-y-4 my-6">
            <AnimatePresence mode="popLayout">
              {filteredQuestions.map((q) => {
                const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F'];

                return (
                  <motion.div
                    key={q.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.2 }}
                    className={`p-5 sm:p-6 rounded-2xl border transition-all ${
                      q.isCorrect
                        ? 'bg-emerald-950/10 border-emerald-500/30'
                        : q.isWrong
                        ? 'bg-rose-950/15 border-rose-500/40 shadow-[0_0_20px_rgba(244,63,94,0.06)]'
                        : 'bg-white/[0.02] border-white/10'
                    }`}
                  >
                    {/* Header: Question Number, Category & Status Badge */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/10">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-lg bg-white/10 font-mono font-bold text-xs flex items-center justify-center text-white">
                          {q.orderIndex}
                        </span>
                        <span className="text-xs font-mono text-[#00E5FF] px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/20">
                          {q.category}
                        </span>
                        <span className="text-[10px] font-mono text-[#94A3B8] uppercase">
                          {q.difficulty}
                        </span>
                      </div>

                      {/* Marks Outcome Badge */}
                      {q.isCorrect && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-bold">
                          <Check size={13} />
                          <span>Correct (+{q.maxMarks} Marks)</span>
                        </div>
                      )}

                      {q.isWrong && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/15 border border-rose-500/40 text-rose-300 font-mono text-xs font-bold">
                          <X size={13} />
                          <span>
                            Incorrect ({q.negativePenalty > 0 ? `-${q.negativePenalty} Penalty` : '0 Marks'})
                          </span>
                        </div>
                      )}

                      {q.isSkipped && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-500/15 border border-slate-500/30 text-[#94A3B8] font-mono text-xs font-semibold">
                          <span>Not Attempted (0 Marks)</span>
                        </div>
                      )}
                    </div>

                    {/* Question Text */}
                    <div className="pt-3.5 pb-2 text-sm sm:text-base font-[family-name:var(--font-body)] text-white leading-relaxed">
                      {q.questionText}
                    </div>

                    {/* Circuit / Question Image Preview */}
                    {q.imageUrl && (
                      <div className="my-3 flex justify-start">
                        <div
                          onClick={() => setZoomedImage(q.imageUrl)}
                          className="relative group rounded-xl overflow-hidden border border-white/20 bg-black/40 p-2 cursor-pointer max-w-sm hover:border-cyan-400/60 transition-all"
                        >
                          <img src={q.imageUrl} alt="Diagram" className="max-h-48 object-contain rounded-lg" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs text-white font-mono transition-opacity">
                            🔍 Click to Enlarge
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Options List with High-Visibility Answer Highlighting */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-3">
                      {q.options.map((optText, optIdx) => {
                        const optLetter = optionLetters[optIdx] || String(optIdx + 1);
                        const isThisTheCorrectAnswer =
                          q.correctIndex === optIdx ||
                          optText.trim().toLowerCase() === q.correctAnswerRaw.trim().toLowerCase();

                        const isThisWhatUserPicked =
                          q.userSelectedIndex === optIdx ||
                          (q.userSelectedRaw !== null &&
                            (optText.trim().toLowerCase() === q.userSelectedRaw.trim().toLowerCase() ||
                              String(optIdx) === q.userSelectedRaw.trim()));

                        let cardStyle = 'bg-white/[0.03] border-white/10 text-[#CBD5E1]';
                        let badge = null;

                        if (isThisWhatUserPicked && isThisTheCorrectAnswer) {
                          // User selected correctly!
                          cardStyle = 'bg-emerald-500/20 border-emerald-500/60 text-emerald-100 shadow-[0_0_12px_rgba(16,185,129,0.15)] font-semibold';
                          badge = (
                            <span className="text-[10px] font-mono font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-md border border-emerald-500/30 flex items-center gap-1">
                              <Check size={11} /> Your Answer (Correct!)
                            </span>
                          );
                        } else if (isThisWhatUserPicked && !isThisTheCorrectAnswer) {
                          // User selected incorrectly!
                          cardStyle = 'bg-rose-500/25 border-rose-500/60 text-rose-100 shadow-[0_0_12px_rgba(244,63,94,0.15)] font-semibold';
                          badge = (
                            <span className="text-[10px] font-mono font-bold text-rose-300 bg-rose-500/20 px-2 py-0.5 rounded-md border border-rose-500/30 flex items-center gap-1">
                              <X size={11} /> What You Selected (Incorrect)
                            </span>
                          );
                        } else if (isThisTheCorrectAnswer) {
                          // The actual right answer (user picked something else or skipped)
                          cardStyle = 'bg-emerald-500/10 border-emerald-500/40 text-emerald-200 border-dashed';
                          badge = (
                            <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-md border border-emerald-500/30 flex items-center gap-1">
                              ★ Correct Answer
                            </span>
                          );
                        }

                        return (
                          <div
                            key={optIdx}
                            className={`p-3 rounded-xl border flex flex-col justify-between gap-1.5 text-xs transition-all ${cardStyle}`}
                          >
                            <div className="flex items-start gap-2">
                              <span className="font-mono font-bold opacity-75">{optLetter}.</span>
                              <span className="flex-1 leading-snug">{optText}</span>
                            </div>
                            {badge && <div className="self-end mt-1">{badge}</div>}
                          </div>
                        );
                      })}
                    </div>

                    {/* Individual Verdict & Explanation Box */}
                    <div className="mt-4 pt-3 border-t border-white/10 flex items-start gap-2.5 text-xs font-mono">
                      {q.isCorrect ? (
                        <div className="flex items-start gap-2 text-emerald-400">
                          <CheckCircle2 size={15} className="mt-0.5 flex-shrink-0" />
                          <span>
                            <strong>Well done!</strong> You selected Option {optionLetters[q.userSelectedIndex ?? 0] || 'correct'}, which is the right answer.
                          </span>
                        </div>
                      ) : q.isWrong ? (
                        <div className="flex items-start gap-2 text-rose-300">
                          <XCircle size={15} className="mt-0.5 flex-shrink-0 text-rose-400" />
                          <span>
                            <strong>Mistake Review:</strong> You answered{' '}
                            <span className="underline decoration-rose-400 font-bold">
                              Option {optionLetters[q.userSelectedIndex ?? 0] || q.userSelectedText || 'N/A'}
                            </span>
                            , but the correct answer is{' '}
                            <span className="text-emerald-400 font-bold underline">
                              Option {optionLetters[q.correctIndex ?? 0] || q.correctAnswerText}
                            </span>
                            .
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-start gap-2 text-[#94A3B8]">
                          <AlertCircle size={15} className="mt-0.5 flex-shrink-0 text-amber-400" />
                          <span>
                            <strong>Unattempted:</strong> You did not select an answer for this question. The correct answer was{' '}
                            <span className="text-emerald-400 font-bold">
                              Option {optionLetters[q.correctIndex ?? 0] || q.correctAnswerText}
                            </span>
                            .
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </section>

        {/* ═══ FOOTER ACTIONS ═══ */}
        <footer className="pt-6 pb-12 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
          <div className="text-xs text-[#94A3B8] font-mono">
            PORTIZ Quiz Engine v2.6 · Official Department Audit
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-xs text-white transition-all cursor-pointer font-mono flex items-center gap-2"
            >
              <Printer size={14} />
              <span>Print Performance Report</span>
            </button>

            <Link href="/">
              <GalaxyButton variant="secondary" size="md">
                <Home size={14} />
                <span>Homepage</span>
              </GalaxyButton>
            </Link>
          </div>
        </footer>
      </div>
    </AuroraBackground>
  );
}

export default function SubmittedPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center text-white font-mono text-xs">
          Loading post-exam analysis...
        </div>
      }
    >
      <SubmittedContent />
    </Suspense>
  );
}
