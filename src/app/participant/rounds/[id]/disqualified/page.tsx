'use client';

import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import GlowButton from '@/components/shared/GlowButton';
import GlassCard from '@/components/shared/GlassCard';
import FadeIn from '@/components/shared/FadeIn';
import { ShieldX } from 'lucide-react';
import { Suspense } from 'react';

function DisqualifiedContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason') || 'anti-cheat violation';

  const reasonLabels: Record<string, string> = {
    tab_switch: 'Tab switching detected',
    window_blur: 'Window lost focus',
    fullscreen_exit: 'Fullscreen mode exited',
    fullscreen_denied: 'Fullscreen permission denied',
    devtools_detected: 'Developer tools detected',
    keyboard_shortcut: 'Blocked keyboard shortcut used',
    time_expired: 'Time expired',
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <FadeIn y={30}>
        <GlassCard variant="pink" radius={28} className="!p-12 text-center max-w-md" hover={false} noHover>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', bounce: 0.3 }}
            className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center shadow-[var(--glow-pink-md)]"
            style={{ background: 'rgba(244,63,94,0.15)', border: '1px solid rgba(244,63,94,0.4)' }}
          >
            <ShieldX size={48} className="text-[var(--aurora-rose)]" />
          </motion.div>

          <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold text-[var(--aurora-rose)] mb-4">
            ⚠️ Attempt Terminated
          </h1>

          <div
            className="p-4 rounded-2xl mb-6 font-[family-name:var(--font-body)] text-xs"
            style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.25)' }}
          >
            <p className="text-[var(--text-muted)] mb-1">Violation Detected:</p>
            <p className="text-[var(--aurora-rose)] font-bold text-sm">{reasonLabels[reason] || reason}</p>
          </div>

          <p className="font-[family-name:var(--font-body)] text-[var(--text-muted)] text-sm mb-8 leading-relaxed">
            Your test has been automatically submitted and marked as disqualified. This action cannot be reversed.
          </p>

          <Link href="/participant/dashboard">
            <GlowButton size="lg" variant="ghost" fullWidth>
              Back to Dashboard 🏠
            </GlowButton>
          </Link>
        </GlassCard>
      </FadeIn>
    </div>
  );
}

export default function DisqualifiedPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <DisqualifiedContent />
    </Suspense>
  );
}
