'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import GlassCard from '@/components/shared/GlassCard';
import RoundBadge from '@/components/shared/RoundBadge';
import FadeIn from '@/components/shared/FadeIn';

interface Result {
  id: string; round_title: string; round_number: number; status: string;
  score: number | null; total_marks: number | null; submitted_at: string;
}

export default function ParticipantResultsPage() {
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchResults = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const res = await fetch('/api/participant/results', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    const data = await res.json();
    setResults(data.results || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchResults(); }, [fetchResults]);

  return (
    <div className="space-y-8">
      <FadeIn y={-20}>
        <h1 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl font-extrabold text-[var(--text-primary)]">
          My Results 📊
        </h1>
      </FadeIn>

      {loading ? (
        <p className="font-[family-name:var(--font-body)] text-[var(--text-muted)]">Loading results...</p>
      ) : results.length === 0 ? (
        <GlassCard variant="solid" className="!p-8 text-center">
          <p className="font-[family-name:var(--font-body)] text-[var(--text-muted)] py-8">
            No results yet. Complete a round to see your scores! 📡
          </p>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {results.map((r, i) => (
            <FadeIn key={r.id} delay={i * 0.1}>
              <GlassCard variant="elevated" hover={false} noHover className="!p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-[family-name:var(--font-display)] font-bold text-lg text-[var(--text-primary)] mb-1">
                      Round {r.round_number}: {r.round_title}
                    </h3>
                    <RoundBadge status={r.status} />
                  </div>
                  <div className="text-right">
                    {r.score !== null ? (
                      <div className="font-[family-name:var(--font-mono)] text-2xl font-extrabold gradient-text">
                        {r.score} / {r.total_marks}
                      </div>
                    ) : (
                      <div className="font-[family-name:var(--font-body)] text-[var(--text-muted)] text-sm">
                        Score hidden by admin
                      </div>
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
