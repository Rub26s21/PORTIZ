'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import GlowButton from '@/components/shared/GlowButton';
import GlassCard from '@/components/shared/GlassCard';
import FadeIn from '@/components/shared/FadeIn';
import { CheckCircle } from 'lucide-react';

export default function SubmittedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <FadeIn y={30}>
        <GlassCard variant="elevated" radius={28} className="!p-12 text-center max-w-md" hover={false} noHover>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', bounce: 0.5 }}
            className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center shadow-[var(--glow-purple-md)]"
            style={{ background: 'var(--glass-purple)', border: '1px solid rgba(168,85,247,0.4)' }}
          >
            <CheckCircle size={48} className="text-[var(--aurora-purple)]" />
          </motion.div>

          <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold text-[var(--text-primary)] mb-3">
            Test Submitted! ✅
          </h1>

          <p className="font-[family-name:var(--font-body)] text-[var(--text-muted)] text-sm mb-8 leading-relaxed">
            Great job! 🎉 Your answers have been recorded. Results will be published once the round closes.
          </p>

          <Link href="/participant/dashboard">
            <GlowButton size="lg" variant="primary" fullWidth>
              Back to Dashboard 🏠
            </GlowButton>
          </Link>
        </GlassCard>
      </FadeIn>
    </div>
  );
}
