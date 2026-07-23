'use client';

import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import GlassCard from '@/components/shared/GlassCard';
import RoundBadge from '@/components/shared/RoundBadge';

const RoundIcon = dynamic(() => import('@/components/three/RoundIcon'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-transparent" />,
});

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.2 },
  },
} as const;

const item = {
  hidden: { opacity: 0, y: 80 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' } },
} as const;

const rounds = [
  {
    title: 'Round 1 — Spark',
    emoji: '⚡',
    description:
      'Electronics basics. Multiple choice and True/False questions to test your foundational knowledge. All registered participants are eligible.',
    shape: 'icosahedron' as const,
    color: '#2563eb',
    status: 'open',
    glowColor: 'blue' as const,
  },
  {
    title: 'Round 2 — Circuit',
    emoji: '🔬',
    description:
      'Intermediate challenge. Fill in the blanks and numerical problems. Only promoted participants from Round 1 can compete.',
    shape: 'octahedron' as const,
    color: '#3b82f6',
    status: 'upcoming',
    glowColor: 'blue' as const,
  },
  {
    title: 'Round 3 — Nexus',
    emoji: '🚀',
    description:
      'The final frontier. All question types combined into one ultimate challenge. Only the best advance here. Champions are crowned.',
    shape: 'dodecahedron' as const,
    color: '#1d4ed8',
    status: 'upcoming',
    glowColor: 'blue' as const,
  },
];

export default function RoundsSection() {
  return (
    <section className="py-24 px-4 relative" id="rounds">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-[family-name:var(--font-heading)] text-4xl md:text-5xl font-bold text-[var(--text)] mb-4">
            The Battleground 🏆
          </h2>
          <p className="text-[var(--muted)] text-lg max-w-2xl mx-auto">
            Three rounds of increasing difficulty. Only the best survive to the end.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {rounds.map((round, i) => (
            <motion.div key={i} variants={item}>
              <GlassCard
                glowColor={round.glowColor}
                className="h-full flex flex-col"
              >
                {/* 3D Icon */}
                <div className="h-40 mb-6 rounded-xl overflow-hidden">
                  <RoundIcon shape={round.shape} color={round.color} />
                </div>

                {/* Badge */}
                <div className="mb-4">
                  <RoundBadge status={round.status} />
                </div>

                {/* Title */}
                <h3 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-[var(--text)] mb-2">
                  {round.emoji} {round.title}
                </h3>

                {/* Description */}
                <p className="text-[var(--muted)] text-sm leading-relaxed flex-1">
                  {round.description}
                </p>
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
