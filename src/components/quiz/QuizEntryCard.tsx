'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Hash, Mail, Phone, AlertCircle, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface ActiveRound {
  id: string;
  title: string;
  round_number: number;
  duration_minutes: number;
  description?: string;
  show_results?: boolean;
}

export default function QuizEntryCard() {
  const router = useRouter();

  // Form State
  const [name, setName] = useState('');
  const [registerNo, setRegisterNo] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Round / Status State
  const [activeRound, setActiveRound] = useState<ActiveRound | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // Pre-fill participant data if saved previously
    const saved = typeof window !== 'undefined' ? localStorage.getItem('participant_info') : null;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.name) setName(parsed.name);
        if (parsed.register_no) setRegisterNo(parsed.register_no);
        if (parsed.phone) setPhone(parsed.phone);
        if (parsed.email) setEmail(parsed.email);
      } catch {}
    }

    const fetchActiveRound = async () => {
      try {
        const res = await fetch('/api/participant/rounds');
        if (res.ok) {
          const data = await res.json();
          const live = data.rounds?.find((r: any) => r.status === 'active' || r.status === 'live' || r.status === 'ongoing');
          setActiveRound(live || null);
        }
      } catch {
        setActiveRound(null);
      }
    };

    fetchActiveRound();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Form Validation
    if (!name.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    if (!registerNo.trim()) {
      setErrorMessage('Please enter your register number.');
      return;
    }

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (phone.trim() && !/^[0-9]{10}$/.test(phone.trim())) {
      setErrorMessage('Please enter a valid 10-digit phone number.');
      return;
    }

    setSubmitting(true);

    const participantData = {
      name: name.trim(),
      register_no: registerNo.trim().toUpperCase(),
      email: email.trim(),
      phone: phone.trim() || null,
    };

    // Store participant details locally
    localStorage.setItem('participant_info', JSON.stringify(participantData));
    sessionStorage.setItem('participant_info', JSON.stringify(participantData));

    try {
      // Post to /api/quiz/enter backend route
      const res = await fetch('/api/quiz/enter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...participantData,
          round_id: activeRound?.id || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.alreadyAttempted) {
          router.push(`/quiz/waiting`);
          return;
        }
        throw new Error(data.error || 'Failed to enter live quiz session.');
      }

      if (data.waiting) {
        // No live round yet -> redirect to Waiting Room
        sessionStorage.setItem('quiz_session', JSON.stringify({
          name: name.trim(),
          register_no: registerNo.trim().toUpperCase(),
          phone: phone.trim(),
          email: email.trim() || null,
        }));
        router.push('/quiz/waiting');
        return;
      }

      sessionStorage.setItem('quiz_session', JSON.stringify({
        attempt_id: data.attempt_id,
        participant_id: data.participant_id,
        name: name.trim(),
        register_no: registerNo.trim().toUpperCase(),
        round_id: data.round_id,
      }));

      // Redirect immediately to the test!
      router.push(`/quiz/test/${data.round_id}`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error recording participant details. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-md mx-auto"
    >
      {/* ═══ APPLE MAC CLEAN GLASS CARD (75% LIQUID GLASS TRANSPARENCY) ═══ */}
      <div
        className="relative rounded-[28px] border border-white/15 p-6 sm:p-8 select-none"
        style={{
          background: 'rgba(6, 6, 12, 0.25)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
        }}
      >
        {/* macOS Window Controls Top Bar */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10 relative z-10">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#FF5F56] border border-black/40 inline-block" />
            <span className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-black/40 inline-block" />
            <span className="w-3 h-3 rounded-full bg-[#27C93F] border border-black/40 inline-block" />
          </div>

          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
            <Image
              src="/logo.png"
              alt="Electronics Club Logo"
              width={16}
              height={16}
              className="object-contain"
            />
            <span className="font-[family-name:var(--font-heading)] font-bold text-[10px] text-white uppercase tracking-wider">
              Electronics Club
            </span>
          </div>
        </div>

        {/* Card Title & Subtitle */}
        <div className="text-center mb-5 relative z-10">
          <h2 className="font-[family-name:var(--font-display)] font-extrabold text-xl sm:text-2xl text-white tracking-tight">
            Participant Entry
          </h2>
          <p className="font-[family-name:var(--font-body)] text-xs text-[#94A3B8] font-light mt-1">
            Enter your 3 basic details below to proceed to the quiz
          </p>
        </div>

        {/* Form Content Area */}
        <div className="relative z-10">
          <form onSubmit={handleSubmit} className="space-y-3.5">

            {/* Live Test Badge if Active */}
            {activeRound && (
              <div className="px-3.5 py-2 rounded-xl bg-white/5 border border-white/15 flex items-center justify-between text-xs mb-1">
                <span className="font-[family-name:var(--font-heading)] text-white font-bold uppercase tracking-wider text-[11px]">
                  ⚡ {activeRound.title || `Weekly Test #${activeRound.round_number}`} (50 Qs)
                </span>
                <span className="font-[family-name:var(--font-mono)] text-[#FF0033] font-semibold">
                  ⏱️ {activeRound.duration_minutes}m
                </span>
              </div>
            )}

            {/* 1. Full Name */}
            <div>
              <label className="flex items-center gap-1.5 mb-1 font-[family-name:var(--font-heading)] text-xs text-[#CBD5E1] font-semibold">
                <User size={13} className="text-[#FF0033]" /> Full Name <span className="text-[#FF0033]">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full bg-black/80 border border-white/12 rounded-xl px-3.5 py-2.5 text-xs text-white font-[family-name:var(--font-body)] focus:border-[#FF0033] focus:ring-1 focus:ring-[#FF0033] outline-none placeholder:text-[#64748B] transition-all"
              />
            </div>

            {/* 2. Register Number */}
            <div>
              <label className="flex items-center gap-1.5 mb-1 font-[family-name:var(--font-heading)] text-xs text-[#CBD5E1] font-semibold">
                <Hash size={13} className="text-[#FF0033]" /> Register Number <span className="text-[#FF0033]">*</span>
              </label>
              <input
                type="text"
                required
                value={registerNo}
                onChange={(e) => setRegisterNo(e.target.value.toUpperCase())}
                placeholder="e.g. 22ECE001"
                className="w-full bg-black/80 border border-white/12 rounded-xl px-3.5 py-2.5 text-xs text-white font-[family-name:var(--font-mono)] uppercase tracking-wider focus:border-[#FF0033] focus:ring-1 focus:ring-[#FF0033] outline-none placeholder:text-[#64748B] transition-all"
              />
            </div>

            {/* 3. Email Address (Compulsory) */}
            <div>
              <label className="flex items-center gap-1.5 mb-1 font-[family-name:var(--font-heading)] text-xs text-[#CBD5E1] font-semibold">
                <Mail size={13} className="text-[#FF0033]" /> Email Address <span className="text-[#FF0033]">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full bg-black/80 border border-white/12 rounded-xl px-3.5 py-2.5 text-xs text-white font-[family-name:var(--font-body)] focus:border-[#FF0033] focus:ring-1 focus:ring-[#FF0033] outline-none placeholder:text-[#64748B] transition-all"
              />
            </div>

            {/* 4. Phone Number (Optional) */}
            <div>
              <label className="flex items-center gap-1.5 mb-1 font-[family-name:var(--font-heading)] text-xs text-[#CBD5E1] font-semibold">
                <Phone size={13} className="text-[#FF0033]" /> Phone Number <span className="text-[#64748B] font-normal">(optional)</span>
              </label>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                placeholder="10-digit mobile number (optional)"
                className="w-full bg-black/80 border border-white/12 rounded-xl px-3.5 py-2.5 text-xs text-white font-[family-name:var(--font-mono)] focus:border-[#FF0033] focus:ring-1 focus:ring-[#FF0033] outline-none placeholder:text-[#64748B] transition-all"
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
                  <div className="p-3 rounded-xl bg-[rgba(255,0,51,0.12)] border border-[rgba(255,0,51,0.3)] flex items-center gap-2">
                    <AlertCircle size={14} className="text-[#FF0033] flex-shrink-0" />
                    <span className="font-[family-name:var(--font-body)] text-xs text-white">
                      {errorMessage}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Solid Red Action Button (No Neon Glow) */}
            <div className="pt-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-xl font-[family-name:var(--font-heading)] font-bold text-xs text-white bg-gradient-to-r from-[#FF0033] via-[#E6002E] to-[#C62828] border border-[#FF4D6D]/30 shadow-none cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Proceeding...</span>
                  </>
                ) : (
                  <>
                    <span>Proceed to Test</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </motion.button>
            </div>

          </form>
        </div>
      </div>
    </motion.div>
  );
}
