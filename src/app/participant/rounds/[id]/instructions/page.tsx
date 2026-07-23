'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase/client';
import GlassCard from '@/components/shared/GlassCard';
import GlowButton from '@/components/shared/GlowButton';
import FadeIn from '@/components/shared/FadeIn';
import { AlertTriangle, Shield, Clock, CheckCircle } from 'lucide-react';

export default function InstructionsPage() {
  const router = useRouter();
  const params = useParams();
  const roundId = params.id as string;
  const [agreed, setAgreed] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const startTest = async () => {
    if (!agreed) { toast.error('Please agree to the anti-cheat policy'); return; }
    setIsStarting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }
      const res = await fetch(`/api/participant/rounds/${roundId}/start`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Failed to start test'); return; }
      toast.success('Test started! Good luck! ⚡');
      router.push(`/participant/rounds/${roundId}/test`);
    } catch {
      toast.error('Something went wrong');
    } finally {
      setIsStarting(false);
    }
  };

  const rules = [
    { icon: Clock, text: 'The timer starts immediately when you begin. It cannot be paused.' },
    { icon: Shield, text: 'The test runs in fullscreen mode. You cannot exit fullscreen.' },
    { icon: AlertTriangle, text: 'Switching tabs, windows, or using Alt+Tab will result in immediate disqualification.' },
    { icon: Shield, text: 'Copy, paste, right-click, and developer tools are disabled.' },
    { icon: CheckCircle, text: 'Answers are auto-saved as you select them. You can change them before submitting.' },
    { icon: Clock, text: 'If time runs out, your test is automatically submitted.' },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <FadeIn y={-20}>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold text-[var(--text-primary)]">
          Test Instructions 📋
        </h1>
      </FadeIn>

      <FadeIn delay={0.1}>
        <GlassCard variant="elevated" hover={false} noHover className="!p-8">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--text-primary)] mb-6">
            Rules & Guidelines
          </h2>
          <div className="space-y-4">
            {rules.map((rule, i) => (
              <div
                key={i}
                className="flex items-start gap-4 p-4 rounded-xl"
                style={{ background: 'var(--glass-purple)', border: '1px solid rgba(168, 85, 247, 0.2)' }}
              >
                <rule.icon size={20} className="text-[var(--aurora-purple)] mt-0.5 flex-shrink-0" />
                <span className="font-[family-name:var(--font-body)] text-[var(--text-secondary)] text-sm md:text-base leading-relaxed">
                  {rule.text}
                </span>
              </div>
            ))}
          </div>
        </GlassCard>
      </FadeIn>

      {/* Critical Warning Box */}
      <FadeIn delay={0.25}>
        <GlassCard variant="pink" hover={false} noHover className="!p-6">
          <p className="font-[family-name:var(--font-heading)] text-[var(--aurora-rose)] font-bold mb-2 text-base flex items-center gap-2">
            <AlertTriangle size={18} /> Critical Warning
          </p>
          <p className="font-[family-name:var(--font-body)] text-[var(--text-secondary)] text-sm md:text-base leading-relaxed">
            Once started, fullscreen must be maintained at all times. ANY violation (tab switch, fullscreen exit, window blur)
            will result in IMMEDIATE and PERMANENT disqualification. There are no second chances.
          </p>
        </GlassCard>
      </FadeIn>

      {/* Consent Checkbox */}
      <FadeIn delay={0.35}>
        <label
          className="flex items-center gap-4 cursor-pointer p-6 rounded-2xl transition-all shadow-sm select-none"
          style={{
            background: agreed ? 'var(--glass-purple)' : 'var(--glass-white)',
            border: agreed ? '1px solid rgba(168, 85, 247, 0.5)' : '1px solid var(--glass-border)',
          }}
        >
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="w-5 h-5 accent-[var(--aurora-purple)] cursor-pointer"
          />
          <span className="font-[family-name:var(--font-body)] text-[var(--text-primary)] text-sm md:text-base leading-relaxed">
            I have read and agree to the anti-cheat policy. I understand that any violation will result in disqualification.
          </span>
        </label>
      </FadeIn>

      <FadeIn delay={0.45}>
        <GlowButton onClick={startTest} disabled={!agreed || isStarting} fullWidth size="lg" className="!py-4">
          {isStarting ? 'Starting...' : 'Start Test ⚡'}
        </GlowButton>
      </FadeIn>
    </div>
  );
}
