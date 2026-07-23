'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '@/components/shared/GlassCard';
import GalaxyButton from '@/components/shared/GalaxyButton';
import AuroraBackground from '@/components/shared/AuroraBackground';
import Logo from '@/components/shared/Logo';
import { User, Hash, Mail, Phone, Clock, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface ActiveRound {
  id: string;
  title: string;
  round_number: number;
  duration_minutes: number;
  description?: string;
  show_results?: boolean;
}

export default function StudentEntryPage() {
  const router = useRouter();

  // Form State
  const [name, setName] = useState('');
  const [registerNo, setRegisterNo] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Page States
  const [activeRound, setActiveRound] = useState<ActiveRound | null>(null);
  const [loadingRound, setLoadingRound] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [alreadyAttempted, setAlreadyAttempted] = useState(false);
  const [previousScore, setPreviousScore] = useState<number | null>(null);

  // Lock Portal Entry state
  const [isPortalLocked, setIsPortalLocked] = useState(false);

  useEffect(() => {
    const isLocked = typeof window !== 'undefined' && localStorage.getItem('portal_entry_locked') === 'true';
    if (isLocked) {
      setIsPortalLocked(true);
    }

    const checkActiveRound = async () => {
      try {
        const { data: round } = await supabase
          .from('rounds')
          .select('id, title, round_number, duration_minutes, description, show_results')
          .eq('status', 'live')
          .limit(1)
          .single();

        if (round) {
          setActiveRound(round);
        } else {
          setActiveRound(null);
        }
      } catch {
        setActiveRound(null);
      } finally {
        setLoadingRound(false);
      }
    };

    checkActiveRound();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Client validation
    if (!name.trim() || !registerNo.trim() || !phone.trim()) {
      setErrorMessage('Please fill in all required fields (Name, Register Number, Phone).');
      return;
    }

    if (!/^[0-9]{10}$/.test(phone.trim())) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (!activeRound) {
      setErrorMessage('No active competition round available to attempt.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/quiz/enter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          register_no: registerNo.trim().toUpperCase(),
          email: email.trim() || null,
          phone: phone.trim(),
          round_id: activeRound.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.alreadyAttempted) {
          setAlreadyAttempted(true);
          if (data.score !== undefined) setPreviousScore(data.score);
          setSubmitting(false);
          return;
        }
        throw new Error(data.error || 'Failed to enter quiz session');
      }

      // Store participant session in sessionStorage
      sessionStorage.setItem('quiz_session', JSON.stringify({
        attempt_id: data.attempt_id,
        participant_id: data.participant_id,
        name: name.trim(),
        round_id: activeRound.id,
      }));

      // Instant redirect to test page
      router.push(`/quiz/test/${activeRound.id}`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error initializing quiz session. Please try again.');
      setSubmitting(false);
    }
  };

  const skeuomorphicShadow = '0 0 60px rgba(6,182,212,0.1), 0 0 120px rgba(168,85,247,0.06), inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(0,0,0,0.2)';

  return (
    <AuroraBackground>
      <div className="min-h-screen flex items-center justify-center p-4 relative z-10 w-full">
        <motion.div
          initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md mx-auto"
        >
          <GlassCard
            variant="elevated"
            radius={24}
            hover={false}
            noHover
            className="!p-8 sm:!p-10 border border-[rgba(6,182,212,0.22)]"
            style={{ boxShadow: skeuomorphicShadow }}
          >
            {/* 1. Back link */}
            <Link
              href="/"
              className="inline-flex items-center gap-1 font-[family-name:var(--font-body)] text-sm text-[var(--text-muted)] hover:text-[var(--aurora-purple)] transition-colors mb-4 font-light"
            >
              <ArrowLeft size={14} /> Home
            </Link>

            {/* 2. Logo */}
            <div className="flex justify-center mb-3">
              <div className="filter drop-shadow-[0_0_18px_rgba(168,85,247,0.6)]">
                <Logo size="md" showText={false} />
              </div>
            </div>

            {/* 3. Heading */}
            <h1
              className="font-[family-name:var(--font-display)] font-extrabold text-2xl sm:text-3xl text-center leading-tight"
              style={{
                background: 'linear-gradient(135deg, #F8F4FF, #A855F7, #06B6D4)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Enter the Quiz ⚡
            </h1>

            {/* 4. Sub */}
            <p className="font-[family-name:var(--font-body)] text-sm text-[var(--text-muted)] text-center mt-1 font-light">
              Fill in your details to begin
            </p>

            {/* 5. Divider */}
            <div className="h-[1px] w-full mt-5 mb-5 bg-gradient-to-r from-transparent via-[rgba(168,85,247,0.35)] to-transparent" />

            {loadingRound ? (
              <div className="py-12 text-center space-y-3">
                <Loader2 size={28} className="animate-spin mx-auto text-[var(--aurora-cyan)]" />
                <p className="font-[family-name:var(--font-body)] text-xs text-[var(--text-muted)] font-light">
                  Checking active competition round...
                </p>
              </div>
            ) : !activeRound ? (
              /* NO ACTIVE ROUND MESSAGE */
              <div className="py-6 text-center space-y-3">
                <Clock size={40} className="mx-auto text-[var(--aurora-gold)] opacity-50 animate-pulse" />
                <h3 className="font-[family-name:var(--font-display)] font-semibold text-lg text-[var(--text-muted)]">
                  No active round right now ⏳
                </h3>
                <p className="font-[family-name:var(--font-body)] text-xs text-[var(--text-dim)] font-light max-w-xs mx-auto">
                  Check back when the administrators open a competition round.
                </p>
                <Link href="/">
                  <GalaxyButton variant="secondary" size="sm" className="mt-4">
                    Return to Homepage
                  </GalaxyButton>
                </Link>
              </div>
            ) : alreadyAttempted ? (
              /* ALREADY ATTEMPTED MESSAGE */
              <div className="py-6 text-center space-y-3">
                <GlassCard variant="purple" radius={16} hover={false} noHover className="!p-5 text-center">
                  <p className="font-[family-name:var(--font-display)] font-semibold text-base text-[var(--text-primary)]">
                    You have already attempted this round.
                  </p>
                  {previousScore !== null && (
                    <p className="font-[family-name:var(--font-mono)] font-bold text-xl text-[var(--aurora-cyan)] mt-2">
                      Score: {previousScore} pts
                    </p>
                  )}
                  <p className="font-[family-name:var(--font-body)] text-xs text-[var(--text-muted)] mt-2 font-light">
                    Multiple attempts for the same round are not allowed.
                  </p>
                </GlassCard>
                <Link href="/participant/dashboard">
                  <GalaxyButton variant="cyan" size="sm" className="mt-4">
                    Go to Participant Dashboard
                  </GalaxyButton>
                </Link>
              </div>
            ) : (
              /* 6. ENTRY FORM */
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Active Round Info Badge */}
                <div className="p-3 rounded-xl bg-[rgba(6,182,212,0.08)] border border-[rgba(6,182,212,0.25)] flex items-center justify-between text-xs">
                  <span className="font-[family-name:var(--font-heading)] text-[var(--aurora-cyan)] font-semibold uppercase">
                    Round {activeRound.round_number}: {activeRound.title}
                  </span>
                  <span className="font-[family-name:var(--font-mono)] text-[var(--text-muted)]">
                    ⏱️ {activeRound.duration_minutes} min
                  </span>
                </div>

                {/* Field 1 — Full Name */}
                <div>
                  <label className="flex items-center gap-1.5 mb-1.5 font-[family-name:var(--font-heading)] text-xs text-[var(--text-secondary)]">
                    <User size={13} className="text-[var(--aurora-cyan)]" /> Full Name <span className="text-[var(--aurora-rose)]">*</span>
                  </label>
                  <input
                    type="text"
                    autoComplete="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full bg-[rgba(6,1,14,0.5)] border border-[rgba(255,255,255,0.10)] rounded-[11px] px-3.5 py-3 text-sm text-[var(--text-primary)] font-[family-name:var(--font-body)] focus:border-[rgba(6,182,212,0.65)] focus:shadow-[0_0_0_3px_rgba(6,182,212,0.12),0_0_16px_rgba(6,182,212,0.18)] outline-none placeholder:text-[var(--text-dim)] transition-all"
                  />
                </div>

                {/* Field 2 — Register Number */}
                <div>
                  <label className="flex items-center gap-1.5 mb-1.5 font-[family-name:var(--font-heading)] text-xs text-[var(--text-secondary)]">
                    <Hash size={13} className="text-[var(--aurora-cyan)]" /> Register Number <span className="text-[var(--aurora-rose)]">*</span>
                  </label>
                  <input
                    type="text"
                    autoComplete="off"
                    required
                    value={registerNo}
                    onChange={(e) => setRegisterNo(e.target.value.toUpperCase())}
                    placeholder="e.g. 22ECE001"
                    className="w-full bg-[rgba(6,1,14,0.5)] border border-[rgba(255,255,255,0.10)] rounded-[11px] px-3.5 py-3 text-sm text-[var(--text-primary)] font-[family-name:var(--font-mono)] uppercase tracking-wider focus:border-[rgba(6,182,212,0.65)] focus:shadow-[0_0_0_3px_rgba(6,182,212,0.12),0_0_16px_rgba(6,182,212,0.18)] outline-none placeholder:text-[var(--text-dim)] transition-all"
                  />
                  <p className="font-[family-name:var(--font-body)] text-[11px] text-[var(--text-dim)] mt-1 font-light">
                    📋 Used to identify you as a winner. No password required.
                  </p>
                </div>

                {/* Field 3 — Email ID (optional) */}
                <div>
                  <label className="flex items-center gap-1.5 mb-1.5 font-[family-name:var(--font-heading)] text-xs text-[var(--text-secondary)]">
                    <Mail size={13} className="text-[var(--aurora-cyan)]" /> Email ID <span className="text-[var(--text-dim)]">(optional)</span>
                  </label>
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com (optional)"
                    className="w-full bg-[rgba(6,1,14,0.5)] border border-[rgba(255,255,255,0.10)] rounded-[11px] px-3.5 py-3 text-sm text-[var(--text-primary)] font-[family-name:var(--font-body)] focus:border-[rgba(6,182,212,0.65)] focus:shadow-[0_0_0_3px_rgba(6,182,212,0.12),0_0_16px_rgba(6,182,212,0.18)] outline-none placeholder:text-[var(--text-dim)] transition-all"
                  />
                  <p className="font-[family-name:var(--font-body)] text-[11px] text-[var(--text-dim)] mt-1 font-light">
                    💬 Only for result notifications if announced.
                  </p>
                </div>

                {/* Field 4 — Phone Number */}
                <div>
                  <label className="flex items-center gap-1.5 mb-1.5 font-[family-name:var(--font-heading)] text-xs text-[var(--text-secondary)]">
                    <Phone size={13} className="text-[var(--aurora-cyan)]" /> Phone Number <span className="text-[var(--aurora-rose)]">*</span>
                  </label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    pattern="[0-9]{10}"
                    maxLength={10}
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="10-digit mobile number"
                    className="w-full bg-[rgba(6,1,14,0.5)] border border-[rgba(255,255,255,0.10)] rounded-[11px] px-3.5 py-3 text-sm text-[var(--text-primary)] font-[family-name:var(--font-mono)] focus:border-[rgba(6,182,212,0.65)] focus:shadow-[0_0_0_3px_rgba(6,182,212,0.12),0_0_16px_rgba(6,182,212,0.18)] outline-none placeholder:text-[var(--text-dim)] transition-all"
                  />
                </div>

                {/* Error Banner */}
                <AnimatePresence>
                  {errorMessage && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <GlassCard variant="pink" radius={10} hover={false} noHover className="!p-3 flex items-center gap-2 border border-[rgba(244,63,94,0.3)]">
                        <AlertCircle size={15} className="text-[var(--aurora-rose)] flex-shrink-0" />
                        <span className="font-[family-name:var(--font-body)] text-xs text-[var(--aurora-rose)] font-light">
                          {errorMessage}
                        </span>
                      </GlassCard>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit Button */}
                <div className="pt-2">
                  <GalaxyButton
                    variant="cyan"
                    fullWidth
                    size="md"
                    type="submit"
                    loading={submitting}
                    disabled={submitting}
                  >
                    {submitting ? 'Initializing Session...' : 'Start Quiz Now →'}
                  </GalaxyButton>
                </div>
              </form>
            )}
          </GlassCard>
        </motion.div>
      </div>
    </AuroraBackground>
  );
}
