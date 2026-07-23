'use client';

import { motion } from 'framer-motion';
import GlassCard from '@/components/shared/GlassCard';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
} as const;

const item = {
  hidden: { opacity: 0, y: 50 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
} as const;

const features = [
  {
    emoji: '🔒',
    title: 'Fullscreen Lock',
    description: 'Test runs in fullscreen. Any attempt to exit triggers immediate disqualification.',
  },
  {
    emoji: '👁️',
    title: 'Tab Switch Detection',
    description: 'Switching tabs or windows is detected and logged as a violation instantly.',
  },
  {
    emoji: '⏱️',
    title: 'Server-Side Timer',
    description: 'Timer runs on the server. No manipulation possible from the client side.',
  },
  {
    emoji: '🚫',
    title: 'Copy/Paste Disabled',
    description: 'All clipboard operations are blocked. No copying questions or pasting answers.',
  },
  {
    emoji: '🎲',
    title: 'Randomized Questions',
    description: 'Every participant gets questions in a different order. No coordination possible.',
  },
  {
    emoji: '📊',
    title: 'Live Proctoring Logs',
    description: 'Every suspicious activity is logged and visible to admins in real-time.',
  },
];

export default function SecuritySection() {
  return (
    <section
      className="py-24 px-4 relative"
      style={{
        background: 'linear-gradient(180deg, var(--bg) 0%, #050a18 50%, var(--bg) 100%)',
      }}
    >
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-[family-name:var(--font-heading)] text-4xl md:text-5xl font-bold text-[var(--text)] mb-4">
            Fort Knox Level Security 🔒
          </h2>
          <p className="text-[var(--muted)] text-lg max-w-2xl mx-auto">
            Our anti-cheat system ensures a fair competition for everyone. No shortcuts, no exceptions.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature, i) => (
            <motion.div key={i} variants={item}>
              <GlassCard className="h-full" glowColor="blue">
                <div className="text-4xl mb-4">{feature.emoji}</div>
                <h3 className="font-[family-name:var(--font-heading)] text-xl font-bold text-[var(--text)] mb-2">
                  {feature.title}
                </h3>
                <p className="text-[var(--muted)] text-sm leading-relaxed">
                  {feature.description}
                </p>
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
