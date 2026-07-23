'use client';

import GlassCard from '@/components/shared/GlassCard';
import FadeIn from '@/components/shared/FadeIn';
import { Award } from 'lucide-react';

export default function ParticipantCertificatePage() {
  return (
    <div className="space-y-8">
      <FadeIn y={-20}>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold text-[var(--text-primary)]">
          Certificates 🏅
        </h1>
      </FadeIn>

      <FadeIn delay={0.1}>
        <GlassCard variant="elevated" className="text-center py-16" hover={false} noHover>
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)' }}>
            <Award size={32} className="text-[var(--aurora-gold)]" />
          </div>
          <h3 className="font-[family-name:var(--font-display)] font-bold text-xl text-[var(--text-primary)] mb-2">
            No Certificates Available Yet 🏅
          </h3>
          <p className="font-[family-name:var(--font-body)] text-[var(--text-muted)] text-sm max-w-md mx-auto leading-relaxed">
            Digital certificates will be generated here once the admin verifies and publishes competition certificates.
          </p>
        </GlassCard>
      </FadeIn>
    </div>
  );
}
