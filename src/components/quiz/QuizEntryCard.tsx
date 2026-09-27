'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Hash, Mail, Phone, AlertCircle, Loader2, ArrowRight,
  CheckCircle2, ShieldAlert, AlertTriangle, X
} from 'lucide-react';
import {
  validateStudentSection,
  getStudentByRegisterNo
} from '@/data/studentRoster';

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
  const [section, setSection] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Round / Status State
  const [activeRound, setActiveRound] = useState<ActiveRound | null>(null);
  const [allLiveRounds, setAllLiveRounds] = useState<ActiveRound[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Pop-up Confirmation Modal State
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [sectionMismatchAlert, setSectionMismatchAlert] = useState<{
    officialSection: 'A' | 'B' | 'C' | 'D';
    enteredSection: string;
    regNo: string;
    studentName?: string;
  } | null>(null);

  // Helper to pick the best round matching the chosen section
  const resolveRoundForSection = (rounds: ActiveRound[], targetSec: 'A' | 'B' | 'C' | 'D') => {
    if (!rounds || rounds.length === 0) return null;
    // 1. Direct section match
    const secMatch = rounds.find((r) => {
      const t = (r.title + ' ' + (r.description || '')).toUpperCase();
      return t.includes(`SECTION ${targetSec}`) || t.includes(`SEC ${targetSec}`);
    });
    if (secMatch) return secMatch;

    // 2. Demo or Sample round
    const demoMatch = rounds.find((r) => {
      const t = (r.title + ' ' + (r.description || '')).toLowerCase();
      return t.includes('demo') || t.includes('sample');
    });
    if (demoMatch) return demoMatch;

    // 3. Any round without explicit conflicting section
    const generalRound = rounds.find((r) => {
      const t = (r.title + ' ' + (r.description || '')).toUpperCase();
      return !t.includes('SECTION A') && !t.includes('SECTION B') && !t.includes('SECTION C') && !t.includes('SECTION D');
    });
    return generalRound || rounds[0] || null;
  };

  useEffect(() => {
    // Pre-fill participant data if saved previously
    const saved = typeof window !== 'undefined' ? localStorage.getItem('participant_info') : null;
    let initialSec: 'A' | 'B' | 'C' | 'D' = 'A';
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.name) setName(parsed.name);
        if (parsed.register_no) setRegisterNo(parsed.register_no);
        if (parsed.section && ['A', 'B', 'C', 'D'].includes(parsed.section)) {
          setSection(parsed.section);
          initialSec = parsed.section;
        }
        if (parsed.phone) setPhone(parsed.phone);
        if (parsed.email) setEmail(parsed.email);
      } catch {}
    }

    const fetchActiveRounds = async () => {
      try {
        const res = await fetch('/api/participant/rounds');
        if (res.ok) {
          const data = await res.json();
          const liveList = (data.rounds || []).filter(
            (r: any) => r.status === 'active' || r.status === 'live' || r.status === 'ongoing'
          );
          setAllLiveRounds(liveList);
          setActiveRound(resolveRoundForSection(liveList, initialSec));
        }
      } catch {
        setActiveRound(null);
      }
    };

    fetchActiveRounds();
  }, []);

  // Live roster lookup whenever register number is typed
  const matchedStudent = getStudentByRegisterNo(registerNo);

  const handleRegisterNoChange = (value: string) => {
    const clean = value.toUpperCase().trim();
    setRegisterNo(clean);
    setErrorMessage(null);

    // Auto-detect and pre-fill name & section if found in official roster
    const student = getStudentByRegisterNo(clean);
    if (student) {
      if (!name.trim() || name === 'Participant') {
        setName(student.name);
      }
      setSection(student.section);
      if (allLiveRounds.length > 0) {
        setActiveRound(resolveRoundForSection(allLiveRounds, student.section));
      }
    }
  };

  // Update active round preview when user changes section dropdown
  const handleSectionChange = (newSec: 'A' | 'B' | 'C' | 'D') => {
    setSection(newSec);
    setErrorMessage(null);
    if (allLiveRounds.length > 0) {
      setActiveRound(resolveRoundForSection(allLiveRounds, newSec));
    }
  };

  // Step 1: Form Validation & Section Confirmation Pop-Up Trigger
  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Basic Validations
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

    // Official Section Verification
    const rosterCheck = validateStudentSection(registerNo.trim().toUpperCase(), section);

    if (!rosterCheck.isValid && rosterCheck.officialSection) {
      // Show High-Priority Section Mismatch Pop-Up!
      setSectionMismatchAlert({
        officialSection: rosterCheck.officialSection,
        enteredSection: section,
        regNo: registerNo.trim().toUpperCase(),
        studentName: rosterCheck.studentName || name.trim(),
      });
      return;
    }

    // Section is verified or valid: Open Confirmation Pop-Up Modal
    setShowConfirmModal(true);
  };

  // Step 2: Final Submission Execution after Pop-Up Confirmation
  const executeSubmit = async () => {
    setShowConfirmModal(false);
    setSubmitting(true);
    setErrorMessage(null);

    const participantData = {
      name: name.trim(),
      register_no: registerNo.trim().toUpperCase(),
      section: section || 'A',
      email: email.trim(),
      phone: phone.trim() || null,
    };

    // Store participant details locally
    localStorage.setItem('participant_info', JSON.stringify(participantData));
    sessionStorage.setItem('participant_info', JSON.stringify(participantData));

    try {
      // Verify active round does not conflict with selected section
      let roundIdToSend = activeRound?.id || null;
      if (activeRound?.title) {
        const t = activeRound.title.toUpperCase();
        const hasOtherSection = ['A', 'B', 'C', 'D'].some(
          (s) => s !== (section || 'A') && (t.includes(`SECTION ${s}`) || t.includes(`SEC ${s}`))
        );
        if (hasOtherSection) {
          roundIdToSend = null; // Let backend find/activate the exact round for this section
        }
      }

      // Post to /api/quiz/enter backend route
      const res = await fetch('/api/quiz/enter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...participantData,
          round_id: roundIdToSend,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to enter live quiz session.');
      }

      if (data.waiting) {
        // No live round yet -> redirect to Waiting Room
        const waitPayload = {
          name: name.trim(),
          register_no: registerNo.trim().toUpperCase(),
          section: section || 'A',
          phone: phone.trim(),
          email: email.trim() || null,
        };
        sessionStorage.setItem('quiz_session', JSON.stringify(waitPayload));
        localStorage.setItem('quiz_session', JSON.stringify(waitPayload));
        router.push('/quiz/waiting');
        return;
      }

      const sessionPayload = {
        attempt_id: data.attempt_id,
        participant_id: data.participant_id,
        name: name.trim(),
        register_no: registerNo.trim().toUpperCase(),
        section: section || 'A',
        round_id: data.round_id,
      };

      sessionStorage.setItem('quiz_session', JSON.stringify(sessionPayload));
      localStorage.setItem('quiz_session', JSON.stringify(sessionPayload));

      if (data.alreadyAttempted && data.status === 'submitted') {
        router.push(`/quiz/submitted?attempt_id=${data.attempt_id}`);
        return;
      }

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
      className="w-full max-w-md mx-auto relative"
    >
      {/* ═══ SECTION CONFIRMATION POP-UP MODAL ═══ */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 10 }}
              className="bg-[#0D0B18] border border-cyan-500/40 rounded-3xl p-6 sm:p-7 max-w-sm w-full shadow-2xl text-center relative overflow-hidden"
            >
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto mb-4 text-[#00E5FF]">
                <CheckCircle2 size={30} />
              </div>

              <h3 className="font-[family-name:var(--font-heading)] font-extrabold text-lg text-white mb-2">
                Confirm Section & Details
              </h3>

              <p className="font-[family-name:var(--font-body)] text-xs text-slate-300 mb-5 leading-relaxed">
                Please verify that your section is correctly chosen. Official attendance and marks will be mapped to this section.
              </p>

              {/* Detail Verification Card */}
              <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-4 text-left space-y-2 mb-6 font-[family-name:var(--font-mono)] text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Reg No:</span>
                  <span className="text-white font-bold">{registerNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Name:</span>
                  <span className="text-white font-semibold truncate max-w-[170px]">{name}</span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-white/10">
                  <span className="text-slate-400">Section:</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-[#00E5FF] font-bold border border-cyan-500/30">
                    Section {section}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-3 rounded-xl font-[family-name:var(--font-heading)] text-xs font-semibold text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer"
                >
                  Edit Details
                </button>
                <button
                  type="button"
                  onClick={executeSubmit}
                  className="flex-1 py-3 rounded-xl font-[family-name:var(--font-heading)] text-xs font-bold text-black bg-[#00E5FF] hover:bg-[#00D0E8] transition-all cursor-pointer shadow-[0_0_15px_rgba(0,229,255,0.4)]"
                >
                  Confirm & Start
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══ SECTION MISMATCH WARNING POP-UP MODAL ═══ */}
      <AnimatePresence>
        {sectionMismatchAlert && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 10 }}
              className="bg-[#14050A] border border-rose-500/50 rounded-3xl p-6 sm:p-7 max-w-sm w-full shadow-2xl text-center relative overflow-hidden"
            >
              <div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center mx-auto mb-4 text-[#F43F5E]">
                <ShieldAlert size={30} />
              </div>

              <h3 className="font-[family-name:var(--font-heading)] font-extrabold text-lg text-rose-400 mb-2">
                Section Mismatch Detected
              </h3>

              <p className="font-[family-name:var(--font-body)] text-xs text-slate-200 mb-4 leading-relaxed">
                Register Number <strong className="font-mono text-white">{sectionMismatchAlert.regNo}</strong> is officially assigned to <strong className="text-emerald-400">Section {sectionMismatchAlert.officialSection}</strong>.
              </p>

              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[11px] text-rose-300 font-[family-name:var(--font-body)] mb-5">
                ⛔ You selected <strong>Section {sectionMismatchAlert.enteredSection}</strong>. You are not permitted to take the assessment for a different section.
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    handleSectionChange(sectionMismatchAlert.officialSection);
                    setSectionMismatchAlert(null);
                  }}
                  className="w-full py-3 rounded-xl font-[family-name:var(--font-heading)] text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 transition-all cursor-pointer shadow-lg"
                >
                  Switch to Section {sectionMismatchAlert.officialSection} & Proceed
                </button>
                <button
                  type="button"
                  onClick={() => setSectionMismatchAlert(null)}
                  className="w-full py-2.5 rounded-xl font-[family-name:var(--font-heading)] text-xs text-slate-400 hover:text-white transition-colors"
                >
                  Cancel / Re-check Details
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
            Enter your details below to proceed to the quiz
          </p>
        </div>

        {/* Form Content Area */}
        <div className="relative z-10">
          <form onSubmit={handlePreSubmit} className="space-y-3.5">

            {/* Live Test Badge if Active */}
            {activeRound && (
              <div
                className="px-3.5 py-2 rounded-xl border flex items-center justify-between text-xs mb-1 transition-all"
                style={{
                  background: activeRound.round_number === 0
                    ? 'linear-gradient(135deg, rgba(0,229,255,0.15), rgba(168,85,247,0.15))'
                    : 'rgba(255,255,255,0.05)',
                  borderColor: activeRound.round_number === 0
                    ? 'rgba(0,229,255,0.4)'
                    : 'rgba(255,255,255,0.15)',
                  boxShadow: activeRound.round_number === 0
                    ? '0 0 15px rgba(0,229,255,0.15)'
                    : 'none',
                }}
              >
                <div className="flex items-center gap-1.5 min-w-0 pr-2">
                  <span className={`w-2 h-2 rounded-full ${activeRound.round_number === 0 ? 'bg-[#00E5FF]' : 'bg-emerald-400'} animate-pulse flex-shrink-0`} />
                  <span className="font-[family-name:var(--font-heading)] text-white font-bold uppercase tracking-wider text-[11px] truncate">
                    {activeRound.round_number === 0
                      ? '🧪 Sample Demo Test (15 Qs)'
                      : `⚡ ${activeRound.title || `Weekly Test #${activeRound.round_number}`} (50 Qs)`}
                  </span>
                </div>
                <span className="font-[family-name:var(--font-mono)] text-[#00E5FF] font-bold flex-shrink-0">
                  ⏱️ {activeRound.duration_minutes}m
                </span>
              </div>
            )}

            {/* 1. Register Number (Top Priority for Verification) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="flex items-center gap-1.5 font-[family-name:var(--font-heading)] text-xs text-[#CBD5E1] font-semibold">
                  <Hash size={13} className="text-[#00E5FF]" /> Register Number <span className="text-[#FF0033]">*</span>
                </label>
                {matchedStudent && (
                  <span className="text-[10px] text-emerald-400 font-[family-name:var(--font-mono)] flex items-center gap-1">
                    <CheckCircle2 size={11} /> Verified ECE Roster
                  </span>
                )}
              </div>
              <input
                type="text"
                required
                value={registerNo}
                onChange={(e) => handleRegisterNoChange(e.target.value)}
                placeholder="e.g. 922524106001"
                className="w-full bg-black/80 border border-white/12 rounded-xl px-3.5 py-2.5 text-xs text-white font-[family-name:var(--font-mono)] uppercase tracking-wider focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF] outline-none placeholder:text-[#64748B] transition-all"
              />
            </div>

            {/* 2. Full Name & Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="flex items-center gap-1.5 font-[family-name:var(--font-heading)] text-xs text-[#CBD5E1] font-semibold">
                    <span>🏛️ Section</span> <span className="text-[#FF0033]">*</span>
                  </label>
                  {matchedStudent && (
                    <span className={`text-[10px] font-mono font-semibold ${
                      matchedStudent.section === section ? 'text-emerald-400' : 'text-rose-400 animate-pulse'
                    }`}>
                      {matchedStudent.section === section ? `✓ Sec ${matchedStudent.section}` : `⚠️ Sec ${matchedStudent.section}`}
                    </span>
                  )}
                </div>
                <select
                  value={section}
                  onChange={(e) => handleSectionChange(e.target.value as any)}
                  className={`w-full bg-black/80 border rounded-xl px-3.5 py-2.5 text-xs text-white font-[family-name:var(--font-heading)] outline-none transition-all cursor-pointer ${
                    matchedStudent && matchedStudent.section !== section
                      ? 'border-rose-500/60 focus:border-rose-500'
                      : 'border-white/12 focus:border-[#00E5FF]'
                  }`}
                >
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                  <option value="C">Section C</option>
                  <option value="D">Section D</option>
                </select>
              </div>
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

            {/* Action Button */}
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
