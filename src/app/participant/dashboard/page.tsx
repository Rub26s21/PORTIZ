'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase/client';
import GlassCard from '@/components/shared/GlassCard';
import CountUp from '@/components/shared/CountUp';
import GlowButton from '@/components/shared/GlowButton';
import RoundBadge from '@/components/shared/RoundBadge';
import FadeIn from '@/components/shared/FadeIn';
import Link from 'next/link';
import { ListOrdered, Trophy, Target } from 'lucide-react';
import { ParticipantRound } from '@/types/quiz';

export default function ParticipantDashboard() {
  const [userName, setUserName] = useState('');
  const [stats, setStats] = useState({ roundsAttempted: 0, totalScore: 0, rank: '-' });
  const [activeRounds, setActiveRounds] = useState<ParticipantRound[]>([]);

  const fetchData = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: profile } = await supabase.from('profiles').select('display_name').eq('id', session.user.id).single();
    setUserName(profile?.display_name || '');

    const { data: attempts } = await supabase.from('attempts').select('score, status').eq('user_id', session.user.id);
    const submitted = attempts?.filter(a => a.status === 'submitted') || [];
    setStats({
      roundsAttempted: submitted.length,
      totalScore: submitted.reduce((sum, a) => sum + (a.score || 0), 0),
      rank: '-',
    });

    const res = await fetch('/api/participant/rounds', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    const data = await res.json();
    setActiveRounds((data.rounds || []).filter((r: Record<string, unknown>) => r.status === 'live' || r.status === 'published'));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="space-y-10">
      {/* Welcome Banner */}
      <FadeIn y={-20}>
        <GlassCard variant="elevated" radius={24} className="!p-8 relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl font-extrabold text-[var(--text-primary)]">
              Welcome back, <span className="gradient-text">{userName}</span> 🎓
            </h1>
            <p className="font-[family-name:var(--font-body)] text-[var(--text-muted)] mt-2 text-base max-w-2xl leading-relaxed">
              Your competition portal is ready. Track your progress, enter active rounds, and climb the leaderboard.
            </p>
          </div>
        </GlassCard>
      </FadeIn>

      {/* Stats Row */}
      <div>
        <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--text-primary)] mb-6 tracking-wide">
          Your Performance 📊
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'Rounds Attempted', value: stats.roundsAttempted, icon: ListOrdered, color: 'var(--aurora-purple)', variant: 'purple' as const },
            { label: 'Total Score', value: stats.totalScore, icon: Target, color: 'var(--aurora-cyan)', variant: 'cyan' as const },
            { label: 'Current Rank', value: 0, icon: Trophy, color: 'var(--aurora-gold)', display: stats.rank, variant: 'default' as const },
          ].map((s, i) => (
            <FadeIn key={i} delay={i * 0.1}>
              <GlassCard variant={s.variant} hover={true} className="!p-6">
                <div className="flex items-center gap-5">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner"
                    style={{ background: 'var(--glass-white)', border: '1px solid var(--glass-border)', color: s.color }}
                  >
                    <s.icon size={26} />
                  </div>
                  <div>
                    <div
                      className="font-[family-name:var(--font-mono)] text-3xl font-extrabold"
                      style={{ color: s.color }}
                    >
                      {s.display || <CountUp end={s.value} />}
                    </div>
                    <div className="font-[family-name:var(--font-heading)] text-[var(--text-muted)] text-xs uppercase tracking-wider mt-1">
                      {s.label}
                    </div>
                  </div>
                </div>
              </GlassCard>
            </FadeIn>
          ))}
        </div>
      </div>

      {/* Active Rounds */}
      <div>
        <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--text-primary)] mb-6 tracking-wide">
          Active Rounds ⚡
        </h2>
        {activeRounds.length === 0 ? (
          <GlassCard variant="solid" className="!p-8 text-center">
            <p className="font-[family-name:var(--font-body)] text-[var(--text-muted)] text-base py-4">
              No active rounds at the moment. Stay tuned! 📡
            </p>
          </GlassCard>
        ) : (
          <div className="space-y-6">
            {activeRounds.map((round, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <GlassCard variant="purple" hover={true} className="!p-8">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div>
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <h3 className="font-[family-name:var(--font-display)] font-bold text-xl text-[var(--text-primary)]">
                          {round.title as string}
                        </h3>
                        <RoundBadge status={round.status as string} />
                        {round.is_eligible ? <RoundBadge status="eligible" /> : <RoundBadge status="not_eligible" />}
                      </div>
                      <p className="font-[family-name:var(--font-body)] text-[var(--text-muted)] text-sm md:text-base leading-relaxed max-w-3xl">
                        {round.description as string}
                      </p>
                    </div>
                    <div className="flex-shrink-0 self-end sm:self-center">
                      {round.is_eligible && !round.has_attempted && round.status === 'live' && (
                        <Link href={`/participant/rounds/${round.id}/instructions`}>
                          <GlowButton size="md" variant="primary">
                            Enter Round ⚡
                          </GlowButton>
                        </Link>
                      )}
                      {round.has_attempted && <RoundBadge status={round.attempt_status as string} className="text-sm px-4 py-1.5" />}
                    </div>
                  </div>
                </GlassCard>
              </FadeIn>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
