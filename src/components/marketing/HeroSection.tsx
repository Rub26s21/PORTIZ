'use client';

import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import GlowButton from '@/components/shared/GlowButton';
import Logo from '@/components/shared/Logo';
import { ChevronDown } from 'lucide-react';

const HeroScene = dynamic(() => import('@/components/three/HeroScene'), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-[var(--bg)]" />,
});

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* 3D Background */}
      <HeroScene />

      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--bg)]/30 to-[var(--bg)] z-[1]" />

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="flex justify-center mb-8"
        >
          <Logo size="lg" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="font-[family-name:var(--font-heading)] text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black mb-6 leading-tight"
          style={{
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 50%, var(--primary) 100%)',
            backgroundSize: '200% auto',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            animation: 'gradient-shift 4s ease infinite',
          }}
        >
          Electronic Club ⚡ Quiz Portal
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-lg sm:text-xl text-[var(--muted)] max-w-2xl mx-auto mb-10"
        >
          The Ultimate Electronics Competition Platform for Future Engineers 🚀
        </motion.p>

        {/* Registration badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8"
          style={{
            background: 'rgba(37, 99, 235, 0.08)',
            border: '1px solid rgba(37, 99, 235, 0.2)',
          }}
        >
          <span className="w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse" />
          <span className="text-[var(--primary)] text-sm font-medium">
            Now Open for Registration ✨
          </span>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link href="/register">
            <GlowButton size="lg" variant="primary">
              Register Now 🎯
            </GlowButton>
          </Link>
          <Link href="#rounds">
            <GlowButton size="lg" variant="ghost">
              View Rounds 📡
            </GlowButton>
          </Link>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <ChevronDown size={32} className="text-[var(--muted)]" />
      </motion.div>

      <style jsx>{`
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% center; }
          50% { background-position: 200% center; }
        }
      `}</style>
    </section>
  );
}
