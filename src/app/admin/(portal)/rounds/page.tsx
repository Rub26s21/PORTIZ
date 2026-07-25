'use client';

import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import GlassCard from '@/components/shared/GlassCard';
import GalaxyButton from '@/components/shared/GalaxyButton';
import FadeIn from '@/components/shared/FadeIn';
import {
  Clock, Plus, Calendar, AlertOctagon, CheckCircle2, Play, Square,
  Settings2, Edit3, Trash2, Layers, RefreshCw, AlertTriangle, ShieldCheck, Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';

interface CompetitionRound {
  id: string;
  round_number: number;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  status: 'draft' | 'published' | 'live' | 'closed';
  requires_promotion?: boolean;
  randomize_questions?: boolean;
  show_results?: boolean;
  show_leaderboard?: boolean;
}

export default function RoundsManagementPage() {
  const [rounds, setRounds] = useState<CompetitionRound[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State for Creating/Editing Round
  const [showModal, setShowModal] = useState(false);
  const [editingRound, setEditingRound] = useState<CompetitionRound | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [roundNumber, setRoundNumber] = useState<number>(1);
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [maxParticipants, setMaxParticipants] = useState<number>(100);
  const [shuffleQuestions, setShuffleQuestions] = useState<boolean>(true);
  const [hasImages, setHasImages] = useState<boolean>(true);
  const [startTime, setStartTime] = useState<string>('');
  const [manualEndTime, setManualEndTime] = useState<string>('');
  const [status, setStatus] = useState<'draft' | 'published' | 'live' | 'closed'>('draft');

  // Manual End Confirmation Modal
  const [manualEndRound, setManualEndRound] = useState<CompetitionRound | null>(null);
  const [manualEnding, setManualEnding] = useState(false);

  // ── FETCH ROUNDS DATA ──
  const fetchRounds = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = session ? { Authorization: `Bearer ${session.access_token}` } : {};

      const res = await fetch('/api/admin/rounds', { headers });
      if (!res.ok) throw new Error('Failed to fetch rounds');

      const data = await res.json();
      if (data.rounds) {
        setRounds(data.rounds);
        setRoundNumber(data.rounds.length + 1);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load competition rounds');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRounds();
  }, [fetchRounds]);

  // ── 1. CREATE / EDIT ROUND ──
  const handleSaveRound = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Please enter a round title');
      return;
    }

    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Authentication session expired. Please log in again.');
        return;
      }

      const payload = {
        round_number: roundNumber,
        title: title,
        description: description,
        duration_minutes: Number(durationMinutes),
        status: status,
      };

      const url = editingRound ? `/api/admin/rounds/${editingRound.id}` : '/api/admin/rounds';
      const method = editingRound ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save round');
      }

      toast.success(editingRound ? `Round #${roundNumber} updated!` : `Round #${roundNumber} created successfully! 🚀`);
      setShowModal(false);
      fetchRounds();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save round');
    } finally {
      setSubmitting(false);
    }
  };

  // ── 2. QUICK DURATION UPDATE ──
  const handleQuickDurationChange = async (round: CompetitionRound, deltaMinutes: number) => {
    const newDuration = Math.max(1, (round.duration_minutes || 30) + deltaMinutes);

    setRounds((prev) =>
      prev.map((r) => (r.id === round.id ? { ...r, duration_minutes: newDuration } : r))
    );

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`/api/admin/rounds/${round.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ duration_minutes: newDuration }),
      });

      if (!res.ok) throw new Error();
      toast.success(`Round #${round.round_number} duration updated to ${newDuration} mins! ⏱️`);
    } catch {
      toast.error('Failed to update round duration');
      fetchRounds();
    }
  };

  // ── 3. MANUAL END ROUND ──
  const handleManualEndRound = async () => {
    if (!manualEndRound) return;
    setManualEnding(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`/api/admin/rounds/${manualEndRound.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ status: 'closed' }),
      });

      if (!res.ok) throw new Error();

      toast.success(`Round #${manualEndRound.round_number} ("${manualEndRound.title}") HAS BEEN MANUALLY ENDED! 🛑`);
      setManualEndRound(null);
      fetchRounds();
    } catch (err: any) {
      toast.error(err.message || 'Failed to end round manually');
    } finally {
      setManualEnding(false);
    }
  };

  // ── 4. ACTIVATE / START ROUND LIVE ──
  const handleActivateRound = async (round: CompetitionRound) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`/api/admin/rounds/${round.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ status: 'live' }),
      });

      if (!res.ok) throw new Error();

      toast.success(`Round #${round.round_number} IS NOW LIVE! 🟢 Timer started (${round.duration_minutes} mins)`);
      fetchRounds();
    } catch {
      toast.error('Failed to activate round');
    }
  };

  // ── DELETE ROUND ──
  const handleDeleteRound = async (roundId: string) => {
    if (!confirm('Are you sure you want to delete this round? All associated questions will remain.')) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`/api/admin/rounds/${roundId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!res.ok) throw new Error();
      toast.success('Round deleted');
      fetchRounds();
    } catch {
      toast.error('Failed to delete round');
    }
  };

  // Modal Open Helpers
  const openCreateModal = () => {
    setEditingRound(null);
    setRoundNumber(rounds.length + 1);
    setTitle(`Round ${rounds.length + 1}: Quiz Challenge`);
    setDescription('');
    setDurationMinutes(30);
    setMaxParticipants(100);
    setShuffleQuestions(true);
    setHasImages(true);
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    setStartTime(now.toISOString().slice(0, 16));
    setManualEndTime('');
    setStatus('draft');
    setShowModal(true);
  };

  const openEditModal = (r: CompetitionRound) => {
    setEditingRound(r);
    setRoundNumber(r.round_number || 1);
    setTitle(r.title || '');
    setDescription(r.description || '');
    setDurationMinutes(r.duration_minutes || 30);
    setMaxParticipants(100);
    setShuffleQuestions(r.randomize_questions ?? true);
    setHasImages(true);

    if (r.start_time) {
      const sDate = new Date(r.start_time);
      sDate.setMinutes(sDate.getMinutes() - sDate.getTimezoneOffset());
      setStartTime(sDate.toISOString().slice(0, 16));
    } else {
      setStartTime('');
    }

    if (r.end_time) {
      const eDate = new Date(r.end_time);
      eDate.setMinutes(eDate.getMinutes() - eDate.getTimezoneOffset());
      setManualEndTime(eDate.toISOString().slice(0, 16));
    } else {
      setManualEndTime('');
    }

    setStatus(r.status || 'draft');
    setShowModal(true);
  };

  const liveRound = rounds.find((r) => r.status === 'live');
  const totalDuration = rounds.reduce((sum, r) => sum + (r.duration_minutes || 0), 0);
  const cleanShadow = '0 4px 20px rgba(0,0,0,0.8)';

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-6xl mx-auto relative z-10" style={{ background: '#000000', minHeight: '100vh', color: '#FFFFFF' }}>

      {/* ═══ HEADER ═══ */}
      <FadeIn delay={0}>
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.2)] w-fit mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FFFFFF] animate-pulse" />
              <span className="font-[family-name:var(--font-heading)] text-[10px] font-semibold tracking-widest text-[#FFFFFF] uppercase">
                COMPETITION PIPELINE & SCHEDULING ✦
              </span>
            </div>

            <h1 className="font-[family-name:var(--font-display)] font-extrabold text-2xl md:text-3xl text-[#FFFFFF]">
              Rounds Management Dashboard
            </h1>
            <p className="font-[family-name:var(--font-body)] text-xs md:text-sm text-[#94A3B8] font-light mt-0.5">
              Set total competition rounds, round durations, start schedules, and manual end times
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={fetchRounds} className="p-2 rounded-xl bg-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.18)] border border-[rgba(255,255,255,0.18)] text-white transition-colors cursor-pointer" title="Refresh rounds">
              <RefreshCw size={15} />
            </button>

            <GalaxyButton variant="primary" size="sm" onClick={openCreateModal}>
              <Plus size={14} /> Create New Round
            </GalaxyButton>
          </div>
        </div>

        <div className="h-[1px] w-full mt-4 bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.2)] to-transparent" />
      </FadeIn>

      {/* ═══ 1. HOW MANY ROUNDS SHOULD BE THERE? (SUMMARY STATS BAR) ═══ */}
      <FadeIn delay={0.06}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* TOTAL ROUNDS COUNT */}
          <GlassCard variant="elevated" radius={20} hover={false} noHover className="!p-5 border border-[rgba(255,255,255,0.12)]" style={{ background: '#000000', boxShadow: cleanShadow }}>
            <div className="flex items-center justify-between w-full h-full">
              <div>
                <span className="font-[family-name:var(--font-heading)] text-[10px] text-[#94A3B8] uppercase tracking-wider block">
                  Total Competition Rounds
                </span>
                <div className="font-[family-name:var(--font-mono)] font-bold text-3xl text-[#FFFFFF] mt-1 flex items-baseline">
                  {rounds.length}
                  <span className="text-xs font-normal text-[#94A3B8] font-[family-name:var(--font-body)] ml-1.5">Rounds</span>
                </div>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.18)] flex items-center justify-center text-white flex-shrink-0 ml-4">
                <Layers size={22} />
              </div>
            </div>
          </GlassCard>

          {/* LIVE ROUND STATUS */}
          <GlassCard variant="elevated" radius={20} hover={false} noHover className="!p-5 border border-[rgba(255,255,255,0.12)]" style={{ background: '#000000', boxShadow: cleanShadow }}>
            <div className="flex items-center justify-between w-full h-full">
              <div>
                <span className="font-[family-name:var(--font-heading)] text-[10px] text-[#94A3B8] uppercase tracking-wider block">
                  Active Live Round
                </span>
                <div className="font-[family-name:var(--font-display)] font-extrabold text-xl text-[#FFFFFF] mt-1 flex items-center gap-2 truncate">
                  {liveRound ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-[#FF0033] animate-pulse" />
                      Round #{liveRound.round_number} ({liveRound.duration_minutes}m)
                    </>
                  ) : (
                    <span className="text-[#64748B] text-base font-normal">No Round Live</span>
                  )}
                </div>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.18)] flex items-center justify-center text-white flex-shrink-0 ml-4">
                <Play size={22} />
              </div>
            </div>
          </GlassCard>

          {/* TOTAL DURATION */}
          <GlassCard variant="elevated" radius={20} hover={false} noHover className="!p-5 border border-[rgba(255,255,255,0.12)]" style={{ background: '#000000', boxShadow: cleanShadow }}>
            <div className="flex items-center justify-between w-full h-full">
              <div>
                <span className="font-[family-name:var(--font-heading)] text-[10px] text-[#94A3B8] uppercase tracking-wider block">
                  Total Tournament Time
                </span>
                <div className="font-[family-name:var(--font-mono)] font-bold text-3xl text-[#FFFFFF] mt-1 flex items-baseline">
                  {totalDuration}
                  <span className="text-xs font-normal text-[#94A3B8] font-[family-name:var(--font-body)] ml-1.5">Minutes</span>
                </div>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.18)] flex items-center justify-center text-white flex-shrink-0 ml-4">
                <Clock size={22} />
              </div>
            </div>
          </GlassCard>

        </div>
      </FadeIn>

      {/* ═══ 2. ROUNDS LIST (TIMING & MANUAL END CONTROLS) ═══ */}
      <FadeIn delay={0.12}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-[family-name:var(--font-display)] font-bold text-xl text-[#FFFFFF]">
              Configured Competition Rounds ({rounds.length})
            </h2>

            <span className="text-xs text-[#94A3B8] font-[family-name:var(--font-body)]">
              Click &quot;Edit Schedule &amp; Timing&quot; to adjust start/end times or &quot;End Round Manually&quot; to force close
            </span>
          </div>

          {loading ? (
            <div className="py-16 text-center text-xs text-[#94A3B8]">Loading rounds pipeline...</div>
          ) : rounds.length === 0 ? (
            <GlassCard variant="solid" radius={24} hover={false} noHover className="!p-16 text-center border border-[rgba(255,255,255,0.12)]" style={{ background: '#000000' }}>
              <Layers size={48} className="mx-auto text-[#64748B] opacity-40 mb-3" />
              <h3 className="font-[family-name:var(--font-display)] font-bold text-lg text-[#FFFFFF]">
                No competition rounds configured yet
              </h3>
              <p className="font-[family-name:var(--font-body)] text-xs text-[#94A3B8] mt-1">
                Create your first round to specify how many rounds there will be and their respective timing.
              </p>
              <div className="mt-5">
                <GalaxyButton variant="primary" size="sm" onClick={openCreateModal}>
                  <Plus size={14} /> Create Round 1
                </GalaxyButton>
              </div>
            </GlassCard>
          ) : (
            rounds.map((round) => {
              const isLive = round.status === 'live';
              const isClosed = round.status === 'closed';

              return (
                <GlassCard
                  key={round.id}
                  variant="elevated"
                  radius={22}
                  hover={false}
                  noHover
                  className={`!p-6 border transition-all ${
                    isLive
                      ? 'border-[rgba(255,0,51,0.5)] bg-[rgba(255,0,51,0.04)]'
                      : 'border-[rgba(255,255,255,0.12)] bg-[#000000]'
                  }`}
                  style={{ boxShadow: cleanShadow }}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">

                    {/* Left Details */}
                    <div className="space-y-3 flex-1 min-w-0">
                      {/* Badge & Title */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-[family-name:var(--font-mono)] font-bold text-xs px-3 py-1 rounded-full bg-[rgba(255,255,255,0.12)] border border-[rgba(255,255,255,0.22)] text-white">
                          ROUND #{round.round_number}
                        </span>

                        {isLive && (
                          <span className="px-3 py-1 rounded-full text-[10px] font-[family-name:var(--font-heading)] font-bold bg-[rgba(255,0,51,0.2)] text-[#FF4569] border border-[rgba(255,0,51,0.4)] uppercase animate-pulse">
                            ● LIVE NOW
                          </span>
                        )}

                        {isClosed && (
                          <span className="px-3 py-1 rounded-full text-[10px] font-[family-name:var(--font-heading)] font-bold bg-[rgba(255,255,255,0.08)] text-[#94A3B8] border border-[rgba(255,255,255,0.14)] uppercase">
                            CLOSED / COMPLETED
                          </span>
                        )}

                        {!isLive && !isClosed && (
                          <span className="px-3 py-1 rounded-full text-[10px] font-[family-name:var(--font-heading)] font-bold bg-[rgba(255,255,255,0.06)] text-[#FFFFFF] border border-[rgba(255,255,255,0.16)] uppercase">
                            {round.status.toUpperCase()}
                          </span>
                        )}
                      </div>

                      <div>
                        <h3 className="font-[family-name:var(--font-display)] font-extrabold text-xl text-[#FFFFFF]">
                          {round.title}
                        </h3>
                        {round.description && (
                          <p className="font-[family-name:var(--font-body)] text-xs text-[#94A3B8] font-light mt-0.5">
                            {round.description}
                          </p>
                        )}
                      </div>

                      {/* ══ TIMING BREAKDOWN DISPLAY ══ */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                        <div className="p-2.5 px-3 rounded-xl bg-[#000000] border border-[rgba(255,255,255,0.1)]">
                          <span className="font-[family-name:var(--font-heading)] text-[10px] text-[#94A3B8] uppercase block">
                            Duration:
                          </span>
                          <span className="font-[family-name:var(--font-mono)] font-bold text-sm text-[#FFFFFF] flex items-center gap-1.5 mt-0.5">
                            <Clock size={14} className="text-[#00B0FF]" /> {round.duration_minutes} Minutes
                          </span>
                        </div>

                        <div className="p-2.5 px-3 rounded-xl bg-[#000000] border border-[rgba(255,255,255,0.1)]">
                          <span className="font-[family-name:var(--font-heading)] text-[10px] text-[#94A3B8] uppercase block">
                            Started At:
                          </span>
                          <span className="font-[family-name:var(--font-mono)] text-xs text-[#FFFFFF] block mt-0.5">
                            {(round as any).started_at ? new Date((round as any).started_at).toLocaleString('en-IN') : 'Not Started'}
                          </span>
                        </div>

                        <div className="p-2.5 px-3 rounded-xl bg-[#000000] border border-[rgba(255,255,255,0.1)]">
                          <span className="font-[family-name:var(--font-heading)] text-[10px] text-[#94A3B8] uppercase block">
                            Ended At:
                          </span>
                          <span className="font-[family-name:var(--font-mono)] text-xs text-[#FFFFFF] block mt-0.5">
                            {(round as any).ended_at ? new Date((round as any).ended_at).toLocaleString('en-IN') : 'Still Open'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right Interactive Controls */}
                    <div className="flex flex-col sm:flex-row lg:flex-col items-stretch lg:items-end justify-center gap-3 border-t lg:border-t-0 lg:border-l border-[rgba(255,255,255,0.08)] pt-4 lg:pt-0 lg:pl-6">
                      {/* Live / End Action Button */}
                      {isLive ? (
                        <button
                          type="button"
                          onClick={() => setManualEndRound(round)}
                          className="px-4 py-2.5 rounded-xl bg-[rgba(255,0,51,0.2)] hover:bg-[rgba(255,0,51,0.35)] border border-[rgba(255,0,51,0.5)] text-[#FF4569] font-[family-name:var(--font-heading)] text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer w-full"
                        >
                          <Square size={14} /> END ROUND MANUALLY NOW
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleActivateRound(round)}
                          className="px-4 py-2.5 rounded-xl bg-[rgba(255,255,255,0.12)] hover:bg-[rgba(255,255,255,0.22)] border border-[rgba(255,255,255,0.25)] text-white font-[family-name:var(--font-heading)] text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer w-full"
                        >
                          <Play size={14} /> ACTIVATE ROUND (START LIVE)
                        </button>
                      )}

                      {/* Edit Schedule & Delete Bar */}
                      <div className="flex items-center gap-2 w-full justify-end">
                        <button
                          type="button"
                          onClick={() => openEditModal(round)}
                          className="flex-1 px-3 py-2 rounded-xl bg-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.18)] border border-[rgba(255,255,255,0.15)] text-white text-xs font-[family-name:var(--font-heading)] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Edit3 size={13} /> Edit Timing & Schedule
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteRound(round.id)}
                          className="p-2 rounded-xl bg-[rgba(255,0,51,0.12)] hover:bg-[rgba(255,0,51,0.24)] border border-[rgba(255,0,51,0.3)] text-[#FF4569] transition-colors cursor-pointer"
                          title="Delete round"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                  </div>
                </GlassCard>
              );
            })
          )}
        </div>
      </FadeIn>

      {/* ═══ CREATE / EDIT ROUND MODAL POPUP (DOCUMENT BODY PORTAL OVERLAY) ═══ */}
      {showModal && typeof window !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 overflow-y-auto">
          <div className="fixed inset-0 bg-[#000000]/90 backdrop-blur-xl" onClick={() => setShowModal(false)} />
          <div className="relative z-[100000] w-full max-w-lg my-auto">
            <GlassCard variant="elevated" radius={28} hover={false} noHover className="!p-7 border border-white/20 space-y-4 select-none shadow-[0_25px_80px_rgba(0,0,0,0.98)]" style={{ background: '#05050A' }}>
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="font-[family-name:var(--font-display)] font-bold text-xl text-white flex items-center gap-2">
                  <Sparkles size={18} className="text-[#FF0033]" />
                  {editingRound ? `Edit Round #${roundNumber}` : 'Create Competition Round'}
                </h3>
                <button onClick={() => setShowModal(false)} className="text-[#94A3B8] hover:text-white cursor-pointer font-bold text-lg">✕</button>
              </div>

              <form onSubmit={handleSaveRound} className="space-y-4">
                
                {/* 1. TITLE & PRESET SELECTOR */}
                <div>
                  <label className="form-label text-xs text-[#CBD5E1] font-semibold mb-1 block">Round Title Presets</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {['First Round', 'Second Round', 'Third Round', 'Qualifier Round', 'Grand Finale'].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setTitle(preset)}
                        className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 border border-white/15 text-[11px] text-white font-medium transition-all cursor-pointer"
                      >
                        + {preset}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="form-label text-[11px] text-[#CBD5E1]">Round #</label>
                      <input
                        type="number"
                        value={roundNumber}
                        onChange={(e) => setRoundNumber(Number(e.target.value))}
                        className="form-input bg-black text-white border border-white/15 font-[family-name:var(--font-mono)]"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="form-label text-[11px] text-[#CBD5E1]">Title <span className="text-[#FF0033]">*</span></label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. First Round / Second Round"
                        className="form-input bg-black text-white border border-white/15 font-bold text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. DURATION IN MINUTES & PARTICIPANT LIMIT */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label text-[11px] text-[#CBD5E1]">Minutes Active (Duration) <span className="text-[#FF0033]">*</span></label>
                    <input
                      type="number"
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(Number(e.target.value))}
                      className="form-input bg-black text-white border border-white/15 font-[family-name:var(--font-mono)] font-bold text-sm"
                      placeholder="e.g. 30, 45, 60"
                      min={1}
                    />
                  </div>

                  <div>
                    <label className="form-label text-[11px] text-[#CBD5E1]">Max Participants Allowed</label>
                    <input
                      type="number"
                      value={maxParticipants}
                      onChange={(e) => setMaxParticipants(Number(e.target.value))}
                      placeholder="e.g. 100 (0 for unlimited)"
                      className="form-input bg-black text-white border border-white/15 font-[family-name:var(--font-mono)] text-xs"
                    />
                  </div>
                </div>

                {/* 3. QUESTION DISPLAY TYPE (WITH IMAGES VS TEXT ONLY) */}
                <div>
                  <label className="form-label text-[11px] text-[#CBD5E1] font-semibold mb-1 block">Round Question Type & Media</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setHasImages(true)}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        hasImages
                          ? 'bg-[#FF0033]/15 border-[#FF0033] text-white shadow-sm'
                          : 'bg-black/60 border-white/12 text-[#94A3B8] hover:text-white'
                      }`}
                    >
                      🖼️ With Question Images (Circuit Diagrams)
                    </button>
                    <button
                      type="button"
                      onClick={() => setHasImages(false)}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        !hasImages
                          ? 'bg-white/15 border-white text-white shadow-sm'
                          : 'bg-black/60 border-white/12 text-[#94A3B8] hover:text-white'
                      }`}
                    >
                      📄 Text Only Questions (No Images)
                    </button>
                  </div>
                </div>

                {/* 4. SHUFFLING QUESTIONS & CUSTOMIZATION TOGGLES */}
                <div className="space-y-2">
                  <span className="form-label text-[11px] text-[#CBD5E1] font-semibold block">Customization & Shuffling</span>
                  
                  <div className="p-3 rounded-xl bg-black/60 border border-white/12 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-xs text-white block">Shuffle Questions for Each Participant</span>
                      <span className="text-[10px] text-[#94A3B8]">Randomize question order per student attempt</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={shuffleQuestions}
                      onChange={(e) => setShuffleQuestions(e.target.checked)}
                      className="w-4 h-4 accent-[#FF0033] cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="form-label text-[11px] text-[#CBD5E1]">Instructions & Scope Description</label>
                    <input
                      type="text"
                      value={description || ''}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Brief instructions for participants..."
                      className="form-input bg-black text-white border border-white/15 text-xs"
                    />
                  </div>
                </div>

                {/* Admin Manual Start Notice */}
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
                  <Play size={14} className="text-[#FF0033] flex-shrink-0" />
                  <p className="text-[11px] text-[#94A3B8] font-light">
                    <strong className="text-white">Manual Admin Control:</strong> Once saved, you can manually click <strong className="text-white">&quot;Start Round Now&quot;</strong> whenever you are ready to begin the event.
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <GalaxyButton variant="secondary" size="sm" onClick={() => setShowModal(false)}>
                    Cancel
                  </GalaxyButton>
                  <GalaxyButton variant="primary" size="sm" type="submit" loading={submitting}>
                    {editingRound ? 'Save Round Parameters' : 'Create Round'}
                  </GalaxyButton>
                </div>
              </form>
            </GlassCard>
          </div>
        </div>,
        document.body
      )}

      {/* ═══ MANUAL END ROUND CONFIRMATION MODAL (DOCUMENT BODY PORTAL OVERLAY) ═══ */}
      {manualEndRound && typeof window !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-[#000000]/90 backdrop-blur-xl" onClick={() => setManualEndRound(null)} />
          <div className="relative z-[100000] w-full max-w-md my-auto">
            <GlassCard variant="elevated" radius={28} hover={false} noHover className="!p-7 border border-[rgba(255,0,51,0.4)] space-y-4 shadow-[0_25px_80px_rgba(0,0,0,0.98)]" style={{ background: '#05050A' }}>
              <div className="flex items-center gap-2 text-[#FF0033] font-[family-name:var(--font-display)] font-bold text-xl">
                <AlertOctagon size={22} /> End Round Manually Now?
              </div>
              <p className="font-[family-name:var(--font-body)] text-xs text-[#94A3B8] font-light leading-relaxed">
                Are you sure you want to manually terminate <strong className="text-white">Round #{manualEndRound.round_number} (&quot;{manualEndRound.title}&quot;)</strong>?
                This will immediately stop active test submission for all student participants.
              </p>
              <div className="flex justify-end gap-3 pt-2">
                <GalaxyButton variant="secondary" size="sm" onClick={() => setManualEndRound(null)}>
                  Cancel
                </GalaxyButton>
                <GalaxyButton variant="danger" size="sm" onClick={handleManualEndRound} loading={manualEnding}>
                  Confirm Manual End Now
                </GalaxyButton>
              </div>
            </GlassCard>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
