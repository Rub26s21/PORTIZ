'use client';

import Link from 'next/link';
import Logo from '@/components/shared/Logo';
import GlassCard from '@/components/shared/GlassCard';
import FadeIn from '@/components/shared/FadeIn';
import { ArrowLeft, Shield, AlertTriangle, BookOpen, Clock, Users, Ban } from 'lucide-react';

const rules = [
  { icon: Users, text: 'Only registered students of the college with a valid register number can participate.' },
  { icon: BookOpen, text: 'Each round has a fixed duration. The timer starts when you click "Start Test" and cannot be paused.' },
  { icon: Clock, text: 'You get exactly ONE attempt per round. No retakes are allowed under any circumstances.' },
  { icon: Shield, text: 'The test must be taken in fullscreen mode. Exiting fullscreen will result in disqualification.' },
  { icon: Ban, text: 'Tab switching, window switching, and Alt+Tab are all detected and will result in immediate disqualification.' },
  { icon: AlertTriangle, text: 'Copy, paste, cut, right-click, and developer tools are all disabled during the test.' },
  { icon: BookOpen, text: 'Questions and options are randomized for each participant. No two participants will see the same order.' },
  { icon: Shield, text: 'Answers are auto-saved as you select them. You can change your answer before submitting.' },
  { icon: Clock, text: 'If the timer runs out, your test is automatically submitted with whatever answers you have provided.' },
  { icon: Users, text: 'Promotion to the next round is decided by the admin based on scores. Only promoted participants can attempt the next round.' },
];

const antiCheatPolicies = [
  { emoji: '🔒', title: 'Fullscreen Enforcement', desc: 'The test runs in mandatory fullscreen. Any attempt to exit is a violation.' },
  { emoji: '👁️', title: 'Tab & Window Detection', desc: 'Switching tabs or windows triggers immediate disqualification.' },
  { emoji: '🚫', title: 'Input Blocking', desc: 'Copy, paste, cut, and text selection are completely disabled.' },
  { emoji: '⌨️', title: 'Keyboard Shortcut Blocking', desc: 'Ctrl+C, Ctrl+V, F12, Ctrl+Shift+I, and other shortcuts are blocked.' },
  { emoji: '📊', title: 'Live Proctoring', desc: 'All activities are logged in real-time and visible to administrators.' },
  { emoji: '🎲', title: 'Randomization', desc: 'Questions and options are shuffled uniquely for each participant.' },
];

export default function RulesPage() {
  return (
    <div className="min-h-screen text-[var(--text-primary)]">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50">
        <div className="mx-4 mt-3">
          <GlassCard variant="elevated" radius={16} hover={false} noHover className="!p-0 px-6 py-3">
            <div className="flex items-center justify-between max-w-7xl mx-auto">
              <Link href="/"><Logo size="sm" /></Link>
              <Link href="/" className="font-[family-name:var(--font-heading)] text-xs text-[var(--text-muted)] hover:text-[var(--aurora-purple)] transition-colors flex items-center gap-2">
                <ArrowLeft size={14} /> Back Home
              </Link>
            </div>
          </GlassCard>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-36 pb-16 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <FadeIn y={30}>
            <h1 className="font-[family-name:var(--font-display)] text-[clamp(2.5rem,7vw,5rem)] font-extrabold gradient-text mb-4">
              Rules & Guidelines 📋
            </h1>
            <p className="font-[family-name:var(--font-body)] text-[var(--text-muted)] text-lg max-w-2xl mx-auto leading-relaxed">
              Read these carefully before starting the competition. Ignorance of the rules is not an excuse.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Rules */}
      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto space-y-4">
          <FadeIn>
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--text-primary)] mb-6">
              ⚡ Competition Rules
            </h2>
          </FadeIn>

          {rules.map((rule, i) => (
            <FadeIn key={i} delay={i * 0.05}>
              <GlassCard variant="purple" hover={false} noHover className="!p-5 flex items-start gap-4">
                <div
                  className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center font-[family-name:var(--font-mono)] font-bold text-xs"
                  style={{ background: 'var(--glass-white)', border: '1px solid rgba(168,85,247,0.3)', color: 'var(--aurora-purple)' }}
                >
                  {i + 1}
                </div>
                <p className="font-[family-name:var(--font-body)] text-[var(--text-secondary)] text-sm md:text-base leading-relaxed pt-0.5">{rule.text}</p>
              </GlassCard>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* Anti-Cheat */}
      <section className="py-12 px-6 max-w-4xl mx-auto">
        <FadeIn>
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--text-primary)] mb-6">
            🔒 Anti-Cheat Policy
          </h2>
          <GlassCard variant="pink" hover={false} noHover className="!p-6 mb-8">
            <p className="font-[family-name:var(--font-heading)] font-bold text-[var(--aurora-rose)] text-base mb-2">⚠️ Zero Tolerance Policy</p>
            <p className="font-[family-name:var(--font-body)] text-[var(--text-secondary)] text-sm leading-relaxed">
              Any violation of the anti-cheat measures results in IMMEDIATE and PERMANENT disqualification
              from that round. There are no warnings, no second chances.
            </p>
          </GlassCard>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {antiCheatPolicies.map((policy, i) => (
            <FadeIn key={i} delay={i * 0.08}>
              <GlassCard variant="elevated" className="h-full !p-6">
                <div className="text-3xl mb-3">{policy.emoji}</div>
                <h3 className="font-[family-name:var(--font-heading)] font-bold text-[var(--text-primary)] text-base mb-2">{policy.title}</h3>
                <p className="font-[family-name:var(--font-body)] text-[var(--text-muted)] text-xs leading-relaxed">{policy.desc}</p>
              </GlassCard>
            </FadeIn>
          ))}
        </div>
      </section>
    </div>
  );
}
