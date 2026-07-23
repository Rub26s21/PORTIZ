'use client';

import { useEffect, useState, useCallback, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase/client';
import GlassCard from '@/components/shared/GlassCard';
import GalaxyButton from '@/components/shared/GalaxyButton';
import StatusBadge from '@/components/admin/StatusBadge';
import FadeIn from '@/components/shared/FadeIn';
import { formatDateIST } from '@/lib/utils';
import { Round } from '@/types/database';
import {
  ArrowLeft, Calendar, Clock, Users, HelpCircle, Trophy, Activity,
  Trash2, Save, Play, Square, Settings2, HelpCircle as HelpIcon, BarChart3
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
  const [saving, setSaving] = useState(false);
  const [questionsCount, setQuestionsCount] = useState(0);
  const [attemptsCount, setAttemptsCount] = useState(0);

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

  const handleUpdateStatus = async (newStatus: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const res = await fetch(`/api/admin/rounds/${roundId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ status: newStatus }),
    });

    if (res.ok) {
      toast.success(`Round status updated to ${newStatus.toUpperCase()}`);
      fetchRoundDetails();
    } else {
      toast.error('Failed to update status');
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

  const skeuomorphicShadow = '0 0 0 1px rgba(255,255,255,0.04), 0 4px 24px rgba(0,0,0,0.45), 0 1px 60px rgba(168,85,247,0.04), inset 0 1px 0 rgba(255,255,255,0.09), inset 0 -1px 0 rgba(0,0,0,0.25), inset 1px 0 0 rgba(255,255,255,0.03), inset -1px 0 0 rgba(0,0,0,0.08)';

  if (loading || !round) {
    return (
      <div className="p-8 text-center text-[var(--text-muted)] font-[family-name:var(--font-body)] text-sm">
        Loading round details...
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto relative z-10">

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
            {round.status !== 'live' && (
              <GalaxyButton variant="cyan" size="sm" onClick={() => handleUpdateStatus('live')}>
                <Play size={14} /> Set LIVE
              </GalaxyButton>
            )}
            {round.status === 'live' && (
              <GalaxyButton variant="danger" size="sm" onClick={() => handleUpdateStatus('closed')}>
                <Square size={14} /> Close Round
              </GalaxyButton>
            )}
            <Link href={`/admin/rounds/${round.id}/questions`}>
              <GalaxyButton variant="primary" size="sm">
                <HelpIcon size={14} /> Questions ({questionsCount})
              </GalaxyButton>
            </Link>
          </div>
        </div>

        <div className="h-[1px] w-full mt-4 bg-gradient-to-r from-transparent via-[rgba(168,85,247,0.4)] to-transparent" />
      </FadeIn>

      {/* QUICK KPI METRICS ROW */}
      <FadeIn delay={0.06}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Enrolled Participants', val: attemptsCount, icon: Users, color: 'var(--aurora-purple)' },
            { label: 'Total Questions', val: questionsCount, icon: HelpCircle, color: 'var(--aurora-cyan)' },
            { label: 'Duration', val: `${round.duration_minutes} min`, icon: Clock, color: 'var(--aurora-gold)' },
            { label: 'Start Time', val: formatDateIST(round.start_time).split(',')[0], icon: Calendar, color: 'var(--aurora-green)' },
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
            <Link href={`/admin/rounds/${round.id}/results`} className="pb-3 text-[var(--text-muted)] hover:text-white transition-colors">Results</Link>
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
