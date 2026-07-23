'use client';

import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import GlassCard from '@/components/shared/GlassCard';
import CountUp from '@/components/shared/CountUp';

const RoundIcon = dynamic(() => import('@/components/three/RoundIcon'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-transparent" />,
});

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
} as const;

const item = {
  hidden: { opacity: 0, y: 60 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
} as const;

const stats = [
  { value: 500, suffix: '+', label: 'Participants 🎓' },
  { value: 3, suffix: '', label: 'Intense Rounds 🏆' },
  { value: 100, suffix: '+', label: 'Questions ⚡' },
  { value: 50, suffix: '+', label: 'Top Engineers 🧠' },
];

export default function AboutSection() {
  return (
    <section className="py-24 px-4 relative" id="about">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left: Text */}
          <motion.div
            initial={{ opacity: 0, x: -60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <h2 className="font-[family-name:var(--font-heading)] text-4xl md:text-5xl font-bold text-[var(--text)] mb-6">
              Who Are We? 🔬
            </h2>
            <p className="text-[var(--muted)] text-lg leading-relaxed mb-8">
              The Electronic Club is the premier hub of electronics innovation at our college.
              We bring together passionate engineers who push the boundaries of technology,
              from circuit design to embedded systems. Our annual quiz competition is the
              ultimate test of electronics knowledge — a multi-round battleground where only
              the best advance to claim victory.
            </p>
            <p className="text-[var(--muted)] text-lg leading-relaxed">
              Whether you&apos;re a first-year enthusiast or a final-year expert, our competition
              is designed to challenge, educate, and inspire. Join hundreds of participants
              in this electrifying journey through the world of electronics. ⚡
            </p>
          </motion.div>

          {/* Right: 3D Model */}
          <motion.div
            initial={{ opacity: 0, x: 60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
            className="h-[400px] relative"
          >
            <div
              className="absolute inset-0 rounded-2xl overflow-hidden"
              style={{
                background: 'rgba(255, 255, 255, 0.8)',
                border: '1px solid rgba(37, 99, 235, 0.12)',
              }}
            >
              <RoundIcon shape="icosahedron" color="#2563eb" />
            </div>
          </motion.div>
        </div>

        {/* Stats */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20"
        >
          {stats.map((stat, i) => (
            <motion.div key={i} variants={item}>
              <GlassCard className="text-center py-8">
                <div className="font-[family-name:var(--font-heading)] text-4xl md:text-5xl font-bold text-[var(--primary)] mb-2">
                  <CountUp end={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-[var(--muted)] text-sm">{stat.label}</div>
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
