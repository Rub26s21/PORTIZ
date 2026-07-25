'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Clock, ShieldCheck, RefreshCw, Home, Sparkles, ArrowRight } from 'lucide-react';
import HeaderNavbar from '@/components/shared/HeaderNavbar';
import { supabase } from '@/lib/supabase/client';

export default function ParticipantWaitingPage() {
  const router = useRouter();
  const [participantName, setParticipantName] = useState('Participant');
  const [registerNo, setRegisterNo] = useState('');
  const [checking, setChecking] = useState(false);
  const [liveRoundTitle, setLiveRoundTitle] = useState<string | null>(null);

  useEffect(() => {
    const sessionData = typeof window !== 'undefined' ? localStorage.getItem('participant_info') || sessionStorage.getItem('quiz_session') : null;
    if (sessionData) {
      try {
        const parsed = JSON.parse(sessionData);
        if (parsed.name) setParticipantName(parsed.name);
        if (parsed.register_no) setRegisterNo(parsed.register_no);
      } catch {}
    }

    // Auto Poll every 4 seconds to check if Admin starts a round
    const checkLiveRound = async () => {
      setChecking(true);
      try {
        const res = await fetch('/api/participant/rounds');
        if (res.ok) {
          const data = await res.json();
          const liveRound = data.rounds?.find((r: any) => r.status === 'active' || r.status === 'live' || r.status === 'ongoing');

          if (liveRound) {
            setLiveRoundTitle(liveRound.title);
            // Automatically redirect participant to test when round starts!
            setTimeout(() => {
              router.push(`/quiz/test/${liveRound.id}`);
            }, 1200);
          } else {
            setLiveRoundTitle(null);
          }
        }
      } catch (err) {
        console.warn('Checking live round status:', err);
      } finally {
        setChecking(false);
      }
    };

    checkLiveRound();
    const interval = setInterval(checkLiveRound, 4000);
    return () => clearInterval(interval);
  }, [router]);

  return (
    <div className="relative min-h-screen text-white overflow-x-hidden">
      <HeaderNavbar />

      <main className="pt-32 pb-20 px-4 flex items-center justify-center min-h-[90vh] relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md mx-auto"
        >
          {/* ═══ APPLE MAC CLEAN GLASS CARD ═══ */}
          <div
            className="relative rounded-[28px] border border-white/12 p-6 sm:p-8 select-none text-center"
            style={{
              background: 'rgba(6, 6, 12, 0.96)',
              backdropFilter: 'blur(30px)',
              WebkitBackdropFilter: 'blur(30px)',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.95)',
            }}
          >
            {/* macOS Top Bar */}
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/10 relative z-10">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#FF5F56] border border-black/40 inline-block" />
                <span className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-black/40 inline-block" />
                <span className="w-3 h-3 rounded-full bg-[#27C93F] border border-black/40 inline-block" />
              </div>

              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/6 border border-white/12">
                <Image src="/logo.png" alt="Electronics Club Logo" width={16} height={16} className="object-contain" />
                <span className="font-[family-name:var(--font-heading)] font-bold text-[10px] text-white uppercase tracking-wider">
                  Electronics Club
                </span>
              </div>
            </div>

            {/* Waiting Icon / Pulse */}
            <div className="relative z-10 my-4">
              {liveRoundTitle ? (
                <div className="w-16 h-16 rounded-full bg-[#FF0033]/20 border border-[#FF0033]/50 flex items-center justify-center mx-auto text-[#FF0033] animate-pulse">
                  <Sparkles size={32} />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-white/5 border border-white/15 flex items-center justify-center mx-auto text-[#FF0033]">
                  <Clock size={32} className="animate-spin" style={{ animationDuration: '8s' }} />
                </div>
              )}
            </div>

            {/* Title & Status */}
            <div className="relative z-10 space-y-2 mb-6">
              <h2 className="font-[family-name:var(--font-display)] font-extrabold text-2xl text-white">
                {liveRoundTitle ? 'Round Starting!' : 'Waiting Room'}
              </h2>
              <p className="font-[family-name:var(--font-body)] text-xs text-[#94A3B8] font-light max-w-xs mx-auto">
                {liveRoundTitle
                  ? `Round "${liveRoundTitle}" is now live! Redirecting to test...`
                  : 'Your registration details have been saved. Please wait until the Admin starts the competition round.'}
              </p>
            </div>

            {/* Participant Details Summary Badge */}
            <div className="relative z-10 p-4 rounded-2xl bg-white/5 border border-white/12 text-left mb-6 space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#94A3B8]">Participant Name:</span>
                <span className="font-bold text-white">{participantName}</span>
              </div>
              {registerNo && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#94A3B8]">Register Number:</span>
                  <span className="font-mono font-bold text-[#FF0033]">{registerNo}</span>
                </div>
              )}
            </div>

            {/* Live Monitoring Status Bar */}
            <div className="relative z-10 px-4 py-2.5 rounded-xl bg-black/50 border border-white/10 flex items-center justify-between text-xs text-[#94A3B8] mb-6">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#FF0033] animate-ping" />
                <span className="text-[11px]">Auto-checking live round status...</span>
              </div>
              <RefreshCw size={12} className={`text-white ${checking ? 'animate-spin' : ''}`} />
            </div>

            {/* Return Home Button */}
            <div className="relative z-10">
              <Link href="/">
                <button className="w-full py-2.5 rounded-xl font-bold text-xs text-white bg-white/10 hover:bg-white/15 border border-white/20 transition-all flex items-center justify-center gap-2">
                  <Home size={14} /> Back to Homepage
                </button>
              </Link>
            </div>

          </div>
        </motion.div>
      </main>
    </div>
  );
}
