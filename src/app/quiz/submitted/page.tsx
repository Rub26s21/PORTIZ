'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import GlassCard from '@/components/shared/GlassCard';
import GalaxyButton from '@/components/shared/GalaxyButton';
import AuroraBackground from '@/components/shared/AuroraBackground';
import Logo from '@/components/shared/Logo';
import { CheckCircle2, Trophy, Award, Home, BarChart3 } from 'lucide-react';
import CountUp from 'react-countup';

function SubmittedContent() {
  const searchParams = useSearchParams();
  const scoreStr = searchParams.get('score');
  const rankStr = searchParams.get('rank');

  const score = scoreStr !== null ? Number(scoreStr) : null;
  const rank = rankStr !== null ? Number(rankStr) : null;

  const skeuomorphicShadow = '0 0 60px rgba(16,185,129,0.1), 0 0 120px rgba(168,85,247,0.06), inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(0,0,0,0.2)';

  return (
    <AuroraBackground>
      <div className="min-h-screen flex items-center justify-center p-4 relative z-10 w-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md mx-auto text-center"
        >
          <GlassCard
            variant="elevated"
            radius={24}
            hover={false}
            noHover
            className="!p-8 sm:!p-10 border border-[rgba(16,185,129,0.3)] space-y-6"
            style={{ boxShadow: skeuomorphicShadow }}
          >
            {/* Logo */}
            <div className="flex justify-center">
              <Logo size="md" showText={false} />
            </div>

            {/* Check Icon */}
            <div className="w-16 h-16 rounded-full bg-[rgba(16,185,129,0.18)] border border-[rgba(16,185,129,0.4)] flex items-center justify-center mx-auto text-[var(--aurora-green)] shadow-[0_0_24px_rgba(16,185,129,0.3)]">
              <CheckCircle2 size={36} />
            </div>

            {/* Title */}
            <div>
              <h1 className="font-[family-name:var(--font-display)] font-extrabold text-2xl sm:text-3xl text-[var(--text-primary)]">
                Quiz Submitted! 🎉
              </h1>
              <p className="font-[family-name:var(--font-body)] text-xs sm:text-sm text-[var(--text-muted)] mt-1.5 font-light">
                Your responses have been recorded successfully.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col gap-3">
              <Link href="/">
                <GalaxyButton variant="secondary" fullWidth size="md">
                  <Home size={14} /> Back to Homepage
                </GalaxyButton>
              </Link>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </AuroraBackground>
  );
}

export default function SubmittedPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-[var(--text-muted)]">Loading submission result...</div>}>
      <SubmittedContent />
    </Suspense>
  );
}
