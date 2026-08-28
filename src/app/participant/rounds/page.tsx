'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import GlassCard from '@/components/shared/GlassCard';
import GlowButton from '@/components/shared/GlowButton';
import RoundBadge from '@/components/shared/RoundBadge';
import FadeIn from '@/components/shared/FadeIn';
import Link from 'next/link';
import { formatDateIST } from '@/lib/utils';
import { ParticipantRound } from '@/types/quiz';

export default function ParticipantRoundsPage() {
  const [rounds, setRounds] = useState<ParticipantRound[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRounds = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const res = await fetch('/api/participant/rounds', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    const data = await res.json();
    setRounds(data.rounds || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchRounds(); }, [fetchRounds]);

  return (
    <div className="space-y-8">
      <FadeIn y={-20}>
        <h1 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl font-extrabold text-[var(--text-primary)] tracking-tight">
          Weekly Department Assessments 🏆
        </h1>
      </FadeIn>

      {loading ? (
        <p className="font-[family-name:var(--font-body)] text-[var(--text-muted)] text-base font-medium">Loading tests...</p>
      ) : rounds.length === 0 ? (
        <GlassCard variant="solid" className="!p-8 text-center">
          <p className="font-[family-name:var(--font-body)] text-[var(--text-muted)] text-lg py-8">
            No tests available right now. Check back later! 📡
          </p>
        </GlassCard>
      ) : (
        <div className="space-y-6">
          {rounds.map((round, i) => (
            <FadeIn key={i} delay={i * 0.1}>
              <GlassCard variant="elevated" hover={true} className="!p-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <h3 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--text-primary)]">
                        {round.title || `Weekly Test #${round.round_number}`}
                      </h3>
                      <RoundBadge status={round.status as string} />
                    </div>
                    <p className="font-[family-name:var(--font-body)] text-[var(--text-muted)] text-sm md:text-base leading-relaxed mb-4">
                      {round.description as string || '50-Question Adaptable Multi-Subject Department Test'}
                    </p>
                    <div className="flex flex-wrap gap-6 text-sm font-[family-name:var(--font-mono)] text-[var(--aurora-cyan)] font-medium mb-4">
                      <span>📅 {(round as any).started_at ? formatDateIST((round as any).started_at as string) : round.status === 'live' ? '🔴 LIVE NOW' : 'Not Started'}</span>
                      <span>⏱️ {round.duration_minutes as number} min</span>
                      <span>📝 50 Questions</span>
                    </div>
                    <div className="flex flex-wrap gap-2.5">
                      {round.is_eligible ? <RoundBadge status="eligible" /> : <RoundBadge status="not_eligible" />}
                      {round.has_attempted && <RoundBadge status={round.attempt_status as string} />}
                    </div>
                  </div>
                  <div className="flex-shrink-0 self-end md:self-center">
                    {round.is_eligible && !round.has_attempted && round.status === 'live' && (
                      <Link href={`/participant/rounds/${round.id}/instructions`}>
                        <GlowButton variant="primary" size="md">
                          Start 50-Q Test ⚡
                        </GlowButton>
                      </Link>
                    )}
                    {!round.is_eligible && (
                      <span className="font-[family-name:var(--font-heading)] text-[var(--aurora-rose)] text-sm font-semibold tracking-wide bg-[rgba(244,63,94,0.12)] border border-[rgba(244,63,94,0.3)] px-4 py-2 rounded-full">
                        ⛔ Not Promoted
                      </span>
                    )}
                    {round.has_attempted && round.attempt_status === 'submitted' && (
                      <span className="font-[family-name:var(--font-heading)] text-[var(--aurora-green)] text-sm font-semibold tracking-wide bg-[rgba(16,185,129,0.12)] border border-[rgba(16,185,129,0.3)] px-4 py-2 rounded-full">
                        ✅ Completed
                      </span>
                    )}
                  </div>
                </div>
              </GlassCard>
            </FadeIn>
          ))}
        </div>
      )}
    </div>
  );
}
