'use client';

import Link from 'next/link';
import Logo from '@/components/shared/Logo';
import GlassCard from '@/components/shared/GlassCard';
import GlowButton from '@/components/shared/GlowButton';
import FadeIn from '@/components/shared/FadeIn';
import { getInitials } from '@/lib/utils';
import { ArrowLeft, Target, Eye, Lightbulb } from 'lucide-react';

const team = [
  { name: 'Dr. Rajesh Kumar', role: 'Faculty Advisor', dept: 'ECE' },
  { name: 'Ananya Patel', role: 'Club President', dept: 'ECE' },
  { name: 'Rohit Menon', role: 'Technical Lead', dept: 'EEE' },
  { name: 'Sneha Reddy', role: 'Event Coordinator', dept: 'ECE' },
  { name: 'Karthik S', role: 'Quiz Master', dept: 'CSE' },
  { name: 'Divya Nair', role: 'Design Lead', dept: 'IT' },
];

export default function AboutPage() {
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
              About Electronic Club 🔬
            </h1>
            <p className="font-[family-name:var(--font-body)] text-[var(--text-muted)] text-lg max-w-2xl mx-auto leading-relaxed">
              Powering innovation, one circuit at a time. Learn about our mission,
              vision, and the team behind the biggest electronics competition.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Mission / Vision / Values */}
      <section className="py-16 px-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: Target,
              title: 'Our Mission 🎯',
              text: 'To foster a community of electronics enthusiasts who push the boundaries of innovation through competitive learning, hands-on projects, and collaborative problem-solving.',
              color: 'var(--aurora-purple)',
            },
            {
              icon: Eye,
              title: 'Our Vision 👁️',
              text: 'To be the premier electronics club in the country, producing engineers who lead technological revolutions and shape the future of electronic systems and embedded technology.',
              color: 'var(--aurora-pink)',
            },
            {
              icon: Lightbulb,
              title: 'Our Values 💡',
              text: 'Innovation, Integrity, Collaboration, and Excellence. We believe in fair competition, continuous learning, and building a supportive community for all aspiring engineers.',
              color: 'var(--aurora-gold)',
            },
          ].map((v, i) => (
            <FadeIn key={i} delay={i * 0.15}>
              <GlassCard variant="elevated" className="h-full !p-8">
                <v.icon size={32} style={{ color: v.color }} className="mb-4" />
                <h3 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--text-primary)] mb-3">
                  {v.title}
                </h3>
                <p className="font-[family-name:var(--font-body)] text-[var(--text-muted)] text-sm leading-relaxed">{v.text}</p>
              </GlassCard>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* Team */}
      <section className="py-16 px-6 max-w-6xl mx-auto">
        <FadeIn>
          <h2 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl font-extrabold text-center gradient-text mb-12">
            Meet the Team 🧑‍🔬
          </h2>
        </FadeIn>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {team.map((member, i) => (
            <FadeIn key={i} delay={i * 0.08}>
              <GlassCard variant="purple" className="text-center !p-8">
                <div
                  className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center font-[family-name:var(--font-mono)] font-bold text-lg"
                  style={{
                    background: 'var(--glass-purple)',
                    border: '2px solid rgba(168,85,247,0.4)',
                    color: 'var(--aurora-purple)',
                  }}
                >
                  {getInitials(member.name)}
                </div>
                <h3 className="font-[family-name:var(--font-heading)] font-bold text-[var(--text-primary)] text-base mb-1">{member.name}</h3>
                <p className="font-[family-name:var(--font-heading)] text-[var(--aurora-purple)] text-sm mb-1 font-medium">{member.role}</p>
                <p className="font-[family-name:var(--font-body)] text-[var(--text-muted)] text-xs">{member.dept} Department</p>
              </GlassCard>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 text-center">
        <FadeIn>
          <Link href="/register">
            <GlowButton variant="primary" size="lg">Join the Competition 🚀</GlowButton>
          </Link>
        </FadeIn>
      </section>
    </div>
  );
}
