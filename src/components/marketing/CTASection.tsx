'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import GlowButton from '@/components/shared/GlowButton';

export default function CTASection() {
  return (
    <section className="py-24 px-4 relative">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="relative rounded-3xl overflow-hidden p-12 md:p-16 text-center"
          style={{
            background: 'linear-gradient(135deg, rgba(37,99,235,0.06) 0%, rgba(59,130,246,0.03) 50%, rgba(37,99,235,0.06) 100%)',
            border: '1px solid rgba(37,99,235,0.15)',
          }}
        >
          {/* Animated border effect */}
          <div className="absolute inset-0 rounded-3xl animate-spark-border pointer-events-none" />

          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-[var(--primary)] rounded-tl-3xl opacity-50" />
          <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-[var(--secondary)] rounded-tr-3xl opacity-50" />
          <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-[var(--secondary)] rounded-bl-3xl opacity-50" />
          <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-[var(--primary)] rounded-br-3xl opacity-50" />

          <motion.h2
            className="font-[family-name:var(--font-heading)] text-4xl md:text-5xl lg:text-6xl font-bold text-[var(--text)] mb-6"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Ready to Prove Your Skills? ⚡
          </motion.h2>

          <motion.p
            className="text-[var(--muted)] text-lg mb-10 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            Join hundreds of engineering students in the most electrifying quiz competition.
            Register now and show the world what you&apos;re made of.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Link href="/register">
              <GlowButton size="lg" variant="primary">
                Register Now 🚀
              </GlowButton>
            </Link>
          </motion.div>
        </motion.div>
      </div>

      <style jsx>{`
        @keyframes spark-border {
          0%, 100% {
            box-shadow: inset 0 0 20px rgba(37, 99, 235, 0.03);
          }
          25% {
            box-shadow: inset 0 0 40px rgba(37, 99, 235, 0.08), inset 0 0 60px rgba(59, 130, 246, 0.04);
          }
          50% {
            box-shadow: inset 0 0 20px rgba(59, 130, 246, 0.04);
          }
          75% {
            box-shadow: inset 0 0 40px rgba(37, 99, 235, 0.08), inset 0 0 60px rgba(37, 99, 235, 0.03);
          }
        }
        .animate-spark-border {
          animation: spark-border 4s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
}
