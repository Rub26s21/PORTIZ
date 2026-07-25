'use client';

import { useEffect, useState, useCallback, useRef, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase/client';
import GlassCard from '@/components/shared/GlassCard';
import GalaxyButton from '@/components/shared/GalaxyButton';
import StatusBadge from '@/components/admin/StatusBadge';
import FadeIn from '@/components/shared/FadeIn';
import { formatDateIST } from '@/lib/utils';
import { Round } from '@/types/database';
import {
  ArrowLeft, Clock, Users, HelpCircle, Trophy,
  Trash2, Play, Square, HelpCircle as HelpIcon, BarChart3,
  Bell, Timer, AlertTriangle, CheckCircle2, XCircle
} from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function RoundDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const roundId = resolvedParams.id;
  const router = useRouter();

  const [round, setRound] = useState<Round | null>(null);
  const [loading, setLoading] = useState(true);
  const [questionsCount, setQuestionsCount] = useState(0);
  const [attemptsCount, setAttemptsCount] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [showExpiryModal, setShowExpiryModal] = useState(false);
  const [expiryAcknowledged, setExpiryAcknowledged] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fetchRoundDetails = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const res = await fetch(`/api/admin/rounds/${roundId}`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (!res.ok) {
      toast.error('Failed to load round details');
      router.push('/admin/rounds');
      return;
    }

    const data = await res.json();
    setRound(data.round);

    // Counts
    const { count: qCount } = await supabase.from('questions').select('*', { count: 'exact', head: true }).eq('round_id', roundId);
    const { count: aCount } = await supabase.from('attempts').select('*', { count: 'exact', head: true }).eq('round_id', roundId);

    setQuestionsCount(qCount || 0);
    setAttemptsCount(aCount || 0);
    setLoading(false);
  }, [roundId, router]);

  useEffect(() => { fetchRoundDetails(); }, [fetchRoundDetails]);

  // Live countdown timer
  useEffect(() => {
    if (!round || round.status !== 'live' || !round.started_at) return;

    const calculateRemaining = () => {
      const startedAt = new Date(round.started_at!).getTime();
      const endAt = startedAt + (round.duration_minutes * 60 * 1000);
      const now = Date.now();
      return Math.max(0, Math.floor((endAt - now) / 1000));
    };

    setTimeRemaining(calculateRemaining());

    timerRef.current = setInterval(() => {
      const remaining = calculateRemaining();
      setTimeRemaining(remaining);

      if (remaining <= 0 && !expiryAcknowledged) {
        setShowExpiryModal(true);
        if (timerRef.current) clearInterval(timerRef.current);
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [round, expiryAcknowledged]);

  const handleStartRound = async () => {
    if (!confirm('Are you sure you want to START this round? All eligible participants will be able to enter the quiz immediately.')) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const res = await fetch(`/api/admin/rounds/${roundId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ status: 'live' }),
    });

    if (res.ok) {
      toast.success('🚀 Round is NOW LIVE! Participants can start.');
      setExpiryAcknowledged(false);
      fetchRoundDetails();
    } else {
      toast.error('Failed to start round');
    }
  };

  const handleCloseRound = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const res = await fetch(`/api/admin/rounds/${roundId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ status: 'closed' }),
    });

    if (res.ok) {
      toast.success('Round CLOSED. All in-progress attempts have been auto-submitted.');
      setShowExpiryModal(false);
      setExpiryAcknowledged(true);
      fetchRoundDetails();
    } else {
      toast.error('Failed to close round');
    }
  };

  const handleExtendTime = async (extraMinutes: number) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const newDuration = (round?.duration_minutes || 0) + extraMinutes;
    const res = await fetch(`/api/admin/rounds/${roundId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ duration_minutes: newDuration }),
    });

    if (res.ok) {
      toast.success(`Extended by ${extraMinutes} minutes!`);
      setShowExpiryModal(false);
      setExpiryAcknowledged(false);
      fetchRoundDetails();
    }
  };

  const handleDeleteRound = async () => {
    if (!confirm('ARE YOU SURE? This will permanently delete this round and all its questions.')) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const res = await fetch(`/api/admin/rounds/${roundId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (res.ok) {
      toast.success('Round deleted permanently');
      router.push('/admin/rounds');
    } else {
      toast.error('Failed to delete round');
    }
  };

  // Format countdown
  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const skeuomorphicShadow = '0 0 0 1px rgba(255,255,255,0.04), 0 4px 24px rgba(0,0,0,0.45), 0 1px 60px rgba(168,85,247,0.04), inset 0 1px 0 rgba(255,255,255,0.09), inset 0 -1px 0 rgba(0,0,0,0.25), inset 1px 0 0 rgba(255,255,255,0.03), inset -1px 0 0 rgba(0,0,0,0.08)';

  if (loading || !round) {
    return (
      <div className="p-8 text-center text-[var(--text-muted)] font-[family-name:var(--font-body)] text-sm">
        Loading round details...
      </div>
    );
  }

  const isLive = round.status === 'live';
  const isClosed = round.status === 'closed';
  const canStart = round.status === 'draft' || round.status === 'published';

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto relative z-10">

      {/* EXPIRY NOTIFICATION MODAL */}
      <AnimatePresence>
        {showExpiryModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="w-full max-w-md mx-4 p-8 rounded-3xl border border-[#FF0033]/30 relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(20,0,0,0.98) 0%, rgba(40,0,10,0.98) 100%)',
                boxShadow: '0 0 60px rgba(255,0,51,0.3), 0 0 120px rgba(255,0,51,0.1)',
              }}
            >
              {/* Pulsing glow */}
              <div className="absolute inset-0 rounded-3xl animate-pulse" style={{ boxShadow: 'inset 0 0 40px rgba(255,0,51,0.15)' }} />

              <div className="relative z-10 text-center space-y-5">
                <div className="w-16 h-16 rounded-full bg-[#FF0033]/20 border border-[#FF0033]/40 flex items-center justify-center mx-auto">
                  <AlertTriangle size={28} className="text-[#FF0033] animate-pulse" />
                </div>

                <div>
                  <h3 className="font-[family-name:var(--font-display)] font-extrabold text-xl text-white">
                    ⏰ Round Duration Expired!
                  </h3>
                  <p className="font-[family-name:var(--font-body)] text-sm text-[#FF9999] mt-2 leading-relaxed">
                    The allocated <span className="font-bold text-white">{round.duration_minutes} minutes</span> for <span className="font-bold text-white">&quot;{round.title}&quot;</span> have ended. Would you like to close the round now?
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <button
                    onClick={handleCloseRound}
                    className="w-full py-3.5 rounded-xl font-[family-name:var(--font-heading)] font-bold text-sm text-white bg-[#FF0033] hover:bg-[#FF0033]/80 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Square size={16} /> Close Round Now
                  </button>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleExtendTime(5)}
                      className="flex-1 py-2.5 rounded-xl font-[family-name:var(--font-heading)] text-xs font-semibold text-white/80 bg-white/10 hover:bg-white/15 border border-white/15 transition-all cursor-pointer"
                    >
                      + 5 Minutes
                    </button>
                    <button
                      onClick={() => handleExtendTime(10)}
                      className="flex-1 py-2.5 rounded-xl font-[family-name:var(--font-heading)] text-xs font-semibold text-white/80 bg-white/10 hover:bg-white/15 border border-white/15 transition-all cursor-pointer"
                    >
                      + 10 Minutes
                    </button>
                    <button
                      onClick={() => handleExtendTime(15)}
                      className="flex-1 py-2.5 rounded-xl font-[family-name:var(--font-heading)] text-xs font-semibold text-white/80 bg-white/10 hover:bg-white/15 border border-white/15 transition-all cursor-pointer"
                    >
                      + 15 Minutes
                    </button>
                  </div>

                  <button
                    onClick={() => { setShowExpiryModal(false); setExpiryAcknowledged(true); }}
                    className="w-full py-2 text-xs text-white/40 hover:text-white/60 transition-colors cursor-pointer"
                  >
                    Dismiss (keep round open)
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOP HEADER */}
      <FadeIn delay={0}>
        <div className="flex flex-wrap justify-between items-start gap-4">
          <div className="flex items-center gap-3">
            <Link href="/admin/rounds">
              <button className="w-10 h-10 rounded-xl bg-[var(--glass-white)] hover:bg-[var(--glass-purple)] border border-[var(--glass-border)] flex items-center justify-center text-[var(--text-muted)] hover:text-white transition-colors cursor-pointer">
                <ArrowLeft size={18} />
              </button>
            </Link>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <StatusBadge status={round.status} />
                <span className="font-[family-name:var(--font-mono)] text-xs text-[var(--text-dim)]">
                  ID: {round.id.slice(0, 8)}
                </span>
              </div>

              <h1 className="font-[family-name:var(--font-display)] font-extrabold text-2xl md:text-3xl gradient-text">
                Round {round.round_number}: {round.title}
              </h1>
            </div>
          </div>

          {/* MASTER STATUS CONTROLS */}
          <div className="flex items-center gap-2">
            {canStart && (
              <GalaxyButton variant="cyan" size="sm" onClick={handleStartRound}>
                <Play size={14} /> Start Round
              </GalaxyButton>
            )}
            {isLive && (
              <GalaxyButton variant="danger" size="sm" onClick={handleCloseRound}>
                <Square size={14} /> Close Round
              </GalaxyButton>
            )}
            <Link href={`/admin/rounds/${round.id}/questions`}>
              <GalaxyButton variant="primary" size="sm">
                <HelpIcon size={14} /> Questions ({questionsCount})
              </GalaxyButton>
            </Link>
            {isClosed && (
              <Link href={`/admin/rounds/${round.id}/results`}>
                <GalaxyButton variant="secondary" size="sm">
                  <Trophy size={14} /> Leaderboard
                </GalaxyButton>
              </Link>
            )}
          </div>
        </div>

        <div className="h-[1px] w-full mt-4 bg-gradient-to-r from-transparent via-[rgba(168,85,247,0.4)] to-transparent" />
      </FadeIn>

      {/* LIVE COUNTDOWN TIMER (Only when round is live) */}
      {isLive && timeRemaining !== null && (
        <FadeIn delay={0.03}>
          <GlassCard variant="elevated" radius={24} hover={false} noHover className="!p-6 border border-[rgba(255,0,51,0.25)]" style={{ boxShadow: '0 0 40px rgba(255,0,51,0.1)', background: 'rgba(255,0,51,0.03)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#FF0033]/15 border border-[#FF0033]/30 flex items-center justify-center">
                  <Timer size={24} className="text-[#FF0033] animate-pulse" />
                </div>
                <div>
                  <span className="font-[family-name:var(--font-heading)] text-xs text-[#FF9999] uppercase tracking-wider block">
                    ⚡ Round is LIVE — Time Remaining
                  </span>
                  <span className="font-[family-name:var(--font-mono)] font-extrabold text-4xl text-white block mt-1">
                    {formatCountdown(timeRemaining)}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="font-[family-name:var(--font-body)] text-xs text-[var(--text-muted)] block">
                  Started: {round.started_at ? formatDateIST(round.started_at) : '—'}
                </span>
                <span className="font-[family-name:var(--font-body)] text-xs text-[var(--text-muted)] block">
                  Duration: {round.duration_minutes} minutes
                </span>
                <span className="font-[family-name:var(--font-body)] text-xs text-[var(--text-muted)] block">
                  Active participants: {attemptsCount}
                </span>
              </div>
            </div>
          </GlassCard>
        </FadeIn>
      )}

      {/* QUICK KPI METRICS ROW */}
      <FadeIn delay={0.06}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Participants', val: attemptsCount, icon: Users, color: 'var(--aurora-purple)' },
            { label: 'Total Questions', val: questionsCount, icon: HelpCircle, color: 'var(--aurora-cyan)' },
            { label: 'Duration', val: `${round.duration_minutes} min`, icon: Clock, color: 'var(--aurora-gold)' },
            { label: 'Status', val: round.status.toUpperCase(), icon: isLive ? Bell : isClosed ? CheckCircle2 : Clock, color: isLive ? '#FF0033' : isClosed ? 'var(--aurora-green)' : 'var(--aurora-gold)' },
          ].map((m, i) => (
            <GlassCard key={i} variant="elevated" radius={18} hover={false} noHover className="!p-4 border border-[rgba(255,255,255,0.08)] flex items-center gap-3" style={{ boxShadow: skeuomorphicShadow }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${m.color}20`, border: `1px solid ${m.color}40` }}>
                <m.icon size={18} style={{ color: m.color }} />
              </div>
              <div>
                <span className="font-[family-name:var(--font-mono)] font-bold text-lg text-[var(--text-primary)] block">
                  {m.val}
                </span>
                <span className="font-[family-name:var(--font-heading)] text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">
                  {m.label}
                </span>
              </div>
            </GlassCard>
          ))}
        </div>
      </FadeIn>

      {/* MAIN CONTENT CARD */}
      <FadeIn delay={0.12}>
        <GlassCard variant="elevated" radius={24} hover={false} noHover className="!p-7 border border-[rgba(168,85,247,0.15)] space-y-6" style={{ boxShadow: skeuomorphicShadow }}>
          {/* NAV TABS */}
          <div className="flex border-b border-[rgba(255,255,255,0.06)] gap-6 font-[family-name:var(--font-heading)] text-sm">
            <span className="pb-3 border-b-2 border-[var(--aurora-purple)] text-[var(--aurora-purple)] font-semibold cursor-pointer">Overview</span>
            <Link href={`/admin/rounds/${round.id}/questions`} className="pb-3 text-[var(--text-muted)] hover:text-white transition-colors">Questions</Link>
            <Link href={`/admin/rounds/${round.id}/results`} className="pb-3 text-[var(--text-muted)] hover:text-white transition-colors">Results & Leaderboard</Link>
            <Link href={`/admin/rounds/${round.id}/monitoring`} className="pb-3 text-[var(--text-muted)] hover:text-white transition-colors">Live Monitoring</Link>
          </div>

          {/* PARAMETERS SUMMARY */}
          <div className="space-y-4">
            <h3 className="font-[family-name:var(--font-display)] font-bold text-lg text-[var(--text-primary)]">
              Round Parameters & Rules
            </h3>
            <p className="font-[family-name:var(--font-body)] text-xs text-[var(--text-muted)] font-light leading-relaxed">
              {round.description || 'No description available for this round.'}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              {[
                { label: "Shuffle Questions", val: round.randomize_questions },
                { label: "Shuffle Options", val: round.randomize_options },
                { label: "Negative Marking", val: round.negative_marking },
                { label: "Requires Promotion", val: round.requires_promotion },
                { label: "Public Leaderboard", val: round.show_leaderboard },
                { label: "Instant Results", val: round.show_results },
              ].map((t, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-[var(--space-surface)] border border-[var(--glass-border)] flex items-center justify-between">
                  <span className="font-[family-name:var(--font-heading)] text-xs text-[var(--text-muted)]">{t.label}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-[family-name:var(--font-heading)] font-semibold ${t.val ? 'bg-[rgba(16,185,129,0.15)] text-[#10B981]' : 'bg-[rgba(255,255,255,0.05)] text-[var(--text-dim)]'}`}>
                    {t.val ? 'ENABLED' : 'DISABLED'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ROUND TIMELINE */}
          <div className="space-y-3 pt-4 border-t border-[rgba(255,255,255,0.06)]">
            <h4 className="font-[family-name:var(--font-display)] font-bold text-sm text-[var(--text-primary)]">Round Timeline</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-[var(--space-surface)] border border-[var(--glass-border)]">
                <span className="font-[family-name:var(--font-heading)] text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">Started At</span>
                <span className="font-[family-name:var(--font-mono)] text-xs text-white font-semibold block mt-1">
                  {round.started_at ? formatDateIST(round.started_at) : 'Not started yet'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[var(--space-surface)] border border-[var(--glass-border)]">
                <span className="font-[family-name:var(--font-heading)] text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">Duration</span>
                <span className="font-[family-name:var(--font-mono)] text-xs text-white font-semibold block mt-1">
                  {round.duration_minutes} minutes
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[var(--space-surface)] border border-[var(--glass-border)]">
                <span className="font-[family-name:var(--font-heading)] text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">Ended At</span>
                <span className="font-[family-name:var(--font-mono)] text-xs text-white font-semibold block mt-1">
                  {round.ended_at ? formatDateIST(round.ended_at) : 'Still open'}
                </span>
              </div>
            </div>
          </div>

          {/* DANGER ZONE */}
          <div className="pt-6 border-t border-[rgba(244,63,94,0.15)] space-y-3">
            <h4 className="font-[family-name:var(--font-display)] font-bold text-sm text-[var(--aurora-rose)]">Danger Zone</h4>
            <div className="flex items-center justify-between p-4 rounded-xl bg-[rgba(244,63,94,0.06)] border border-[rgba(244,63,94,0.2)]">
              <div>
                <span className="font-[family-name:var(--font-heading)] text-xs font-semibold text-[var(--aurora-rose)] block">
                  Delete Competition Round
                </span>
                <span className="font-[family-name:var(--font-body)] text-xs text-[var(--text-dim)] font-light block">
                  Permanently remove this round, questions, and attempts. Cannot be undone.
                </span>
              </div>
              <GalaxyButton variant="danger" size="xs" onClick={handleDeleteRound}>
                <Trash2 size={12} /> Delete Round
              </GalaxyButton>
            </div>
          </div>
        </GlassCard>
      </FadeIn>

    </div>
  );
}
