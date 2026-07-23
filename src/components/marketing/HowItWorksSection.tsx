'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { UserPlus, Zap, Target, Microscope, Award } from 'lucide-react';

const steps = [
  { icon: UserPlus, label: 'Register', emoji: '✍️', description: 'Create your account and join the competition' },
  { icon: Zap, label: 'Attend Round 1', emoji: '⚡', description: 'Take on the Spark round basics challenge' },
  { icon: Target, label: 'Get Promoted', emoji: '🎯', description: 'Score high to advance to the next stage' },
  { icon: Microscope, label: 'Advance Rounds', emoji: '🔬', description: 'Face tougher challenges in Circuit and Nexus' },
  { icon: Award, label: 'Win Certificates', emoji: '🏅', description: 'Top performers earn official certificates' },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
} as const;

const item = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
} as const;

export default function HowItWorksSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end center'],
  });
  const pathLength = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section className="py-24 px-4 relative" ref={sectionRef} id="how-it-works">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h2 className="font-[family-name:var(--font-heading)] text-4xl md:text-5xl font-bold text-[var(--text)] mb-4">
            How the Competition Works 💡
          </h2>
          <p className="text-[var(--muted)] text-lg max-w-2xl mx-auto">
            Five simple steps to glory. Follow the path and prove your worth.
          </p>
        </motion.div>

        {/* Desktop Timeline */}
        <div className="hidden md:block relative">
          {/* SVG connector line */}
          <svg
            className="absolute top-16 left-0 w-full h-2 overflow-visible"
            viewBox="0 0 1000 4"
            preserveAspectRatio="none"
          >
            <motion.line
              x1="50"
              y1="2"
              x2="950"
              y2="2"
              stroke="url(#lineGradient)"
              strokeWidth="2"
              strokeLinecap="round"
              style={{ pathLength }}
            />
            <defs>
              <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#00cfff" />
                <stop offset="50%" stopColor="#12ff80" />
                <stop offset="100%" stopColor="#f5c518" />
              </linearGradient>
            </defs>
          </svg>

          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-5 gap-4"
          >
            {steps.map((step, i) => (
              <motion.div key={i} variants={item} className="flex flex-col items-center text-center">
                {/* Step number circle */}
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mb-4 relative z-10"
                  style={{
                    background: 'linear-gradient(135deg, rgba(0,207,255,0.2), rgba(18,255,128,0.1))',
                    border: '2px solid rgba(0,207,255,0.4)',
                    boxShadow: '0 0 20px rgba(0,207,255,0.2)',
                  }}
                >
                  <step.icon size={20} className="text-[var(--primary)]" />
                </div>

                {/* Step content */}
                <div className="mt-6">
                  <span className="text-3xl mb-2 block">{step.emoji}</span>
                  <h4 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-[var(--text)] mb-2">
                    {step.label}
                  </h4>
                  <p className="text-[var(--muted)] text-xs leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Mobile Timeline */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="md:hidden space-y-6"
        >
          {steps.map((step, i) => (
            <motion.div
              key={i}
              variants={item}
              className="flex items-start gap-4 p-4 rounded-xl"
              style={{
                background: 'rgba(12, 20, 40, 0.5)',
                border: '1px solid rgba(0, 207, 255, 0.1)',
              }}
            >
              <div
                className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(0,207,255,0.2), rgba(18,255,128,0.1))',
                  border: '1px solid rgba(0,207,255,0.3)',
                }}
              >
                <span className="text-[var(--primary)] text-sm font-bold">{i + 1}</span>
              </div>
              <div>
                <h4 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-[var(--text)]">
                  {step.emoji} {step.label}
                </h4>
                <p className="text-[var(--muted)] text-sm">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
