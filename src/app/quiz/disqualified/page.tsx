'use client';

import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import GlassCard from '@/components/shared/GlassCard';
import GalaxyButton from '@/components/shared/GalaxyButton';
import { ShieldAlert, AlertTriangle, ArrowLeft } from 'lucide-react';
import { Suspense } from 'react';

function DisqualifiedContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason') || 'Anti-cheat violation';

  const reasonLabels: Record<string, string> = {
    tab_switch: 'Tab switching / Window minimized',
    window_blur: 'Window focus lost / Application switch',
    fullscreen_exit: 'Fullscreen mode exited',
    fullscreen_denied: 'Fullscreen permission declined',
    devtools_detected: 'Developer tools / Inspector detected',
    keyboard_shortcut: 'Prohibited keyboard shortcuts (Ctrl+C, Ctrl+V, F12)',
    time_expired: 'Test session timer expired',
  };

  return (
    <div className="min-h-screen bg-[#030008] text-[var(--text-primary)] flex items-center justify-center px-4">
      <GlassCard variant="pink" radius={24} className="!p-8 sm:!p-12 text-center max-w-lg w-full" hover={false} noHover>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: 'spring', bounce: 0.3 }}
          className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center shadow-[0_0_30px_rgba(244,63,94,0.35)]"
          style={{ background: 'rgba(244,63,94,0.15)', border: '2px solid rgba(244,63,94,0.5)' }}
        >
          <ShieldAlert size={42} className="text-[#F43F5E]" />
        </motion.div>

        <h1 className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-extrabold text-[#F43F5E] mb-3">
          Test Session Terminated
        </h1>

        <div
          className="p-4 rounded-xl mb-6 font-[family-name:var(--font-mono)] text-xs text-left"
          style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.3)' }}
        >
          <div className="flex items-center gap-2 text-[#FDA4AF] mb-1.5 font-bold">
            <AlertTriangle size={14} /> Security Violation Detected:
          </div>
          <p className="text-white text-sm font-semibold pl-5">
            {reasonLabels[reason] || reason}
          </p>
        </div>

        <p className="font-[family-name:var(--font-body)] text-[var(--text-muted)] text-xs sm:text-sm mb-8 leading-relaxed">
          The test integrity monitor detected repeated prohibited activity. Your attempt has been locked, submitted, and flagged for proctor review.
        </p>

        <Link href="/quiz">
          <GalaxyButton size="lg" variant="primary" fullWidth className="flex items-center justify-center gap-2">
            <ArrowLeft size={16} /> Return to Quiz Portal
          </GalaxyButton>
        </Link>
      </GlassCard>
    </div>
  );
}

export default function QuizDisqualifiedPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#030008]" />}>
      <DisqualifiedContent />
    </Suspense>
  );
}
