'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import GlassCard from '@/components/shared/GlassCard';
import GalaxyButton from '@/components/shared/GalaxyButton';
import FadeIn from '@/components/shared/FadeIn';
import {
  Settings2, Save, ShieldAlert, User, Trash2, CheckCircle2,
  Clock, Plus, Minus, Lock, Unlock, UserX, Search, ShieldOff,
  AlertTriangle, RefreshCw, Trophy, Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';

interface RoundTiming {
  id: string;
  round_number: number;
  title: string;
  duration_minutes: number;
  start_time: string;
  status: string;
}

interface ParticipantEntry {
  id: string;
  name: string;
  register_no: string;
  email: string;
  phone: string;
  attempt_id?: string;
  attempt_status?: string;
}

export default function SettingsPage() {
  // ── ADMIN PROFILE ──
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // ── 1. TIMING CONTROL STATE ──
  const [rounds, setRounds] = useState<RoundTiming[]>([]);
  const [loadingRounds, setLoadingRounds] = useState(true);
  const [updatingRoundId, setUpdatingRoundId] = useState<string | null>(null);

  // ── 2. KICKING / DISQUALIFICATION STATE ──
  const [participants, setParticipants] = useState<ParticipantEntry[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(true);
  const [participantSearch, setParticipantSearch] = useState('');
  const [kickModalParticipant, setKickModalParticipant] = useState<ParticipantEntry | null>(null);
  const [kicking, setKicking] = useState(false);

  // ── 3. LOCKING ENTRY OF WEB STATE ──
  const [portalLocked, setPortalLocked] = useState(false);
  const [lockReason, setLockReason] = useState('Entry is currently locked by the Administrator.');

  // ── RESET STATE ──
  const [confirmResetText, setConfirmResetText] = useState('');
  const [resetting, setResetting] = useState(false);

  // ── INITIAL DATA FETCHING ──
  const fetchRoundsData = useCallback(async () => {
    setLoadingRounds(true);
    const { data } = await supabase
      .from('rounds')
      .select('id, round_number, title, duration_minutes, start_time, status')
      .order('round_number', { ascending: true });

    if (data) setRounds(data);
    setLoadingRounds(false);
  }, []);

  const fetchParticipantsData = useCallback(async () => {
    setLoadingParticipants(true);
    const { data: partData } = await supabase
      .from('participants')
      .select('id, name, register_no, email, phone')
      .order('created_at', { ascending: false });

    if (partData) {
      const enriched = await Promise.all(
        partData.map(async (p) => {
          const { data: att } = await supabase
            .from('attempts')
            .select('id, status')
            .eq('participant_id', p.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          return {
            ...p,
            attempt_id: att?.id,
            attempt_status: att?.status || 'none',
          };
        })
      );
      setParticipants(enriched);
    }
    setLoadingParticipants(false);
  }, []);

  useEffect(() => {
    // Check initial portal lock status
    const savedLock = localStorage.getItem('portal_entry_locked');
    if (savedLock === 'true') {
      setPortalLocked(true);
    }

    const fetchAdminProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setAdminEmail(session.user.email || '');
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', session.user.id)
          .single();
        if (profile) setAdminName(profile.display_name || '');
      } else {
        const local = localStorage.getItem('admin_session');
        if (local) {
          try {
            const parsed = JSON.parse(local);
            setAdminName(parsed.displayName || 'Admin');
            setAdminEmail(parsed.email || 'admin@electronicclub.edu');
          } catch {}
        }
      }
    };

    fetchAdminProfile();
    fetchRoundsData();
    fetchParticipantsData();
  }, [fetchRoundsData, fetchParticipantsData]);

  // ── 1. HANDLE ROUND TIMING UPDATE ──
  const handleUpdateRoundDuration = (roundId: string, newDuration: number) => {
    setRounds((prev) =>
      prev.map((r) => (r.id === roundId ? { ...r, duration_minutes: Math.max(1, newDuration) } : r))
    );
  };

  const handleSaveRoundTiming = async (r: RoundTiming) => {
    setUpdatingRoundId(r.id);
    try {
      const { error } = await supabase
        .from('rounds')
        .update({
          duration_minutes: r.duration_minutes,
          start_time: r.start_time,
        })
        .eq('id', r.id);

      if (error) throw error;
      toast.success(`Round #${r.round_number} timing updated to ${r.duration_minutes} mins! ⏱️`);
      fetchRoundsData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update round timing');
    } finally {
      setUpdatingRoundId(null);
    }
  };

  const handleQuickAddMinutes = async (r: RoundTiming, minsToAdd: number) => {
    const updatedMins = (r.duration_minutes || 30) + minsToAdd;
    handleUpdateRoundDuration(r.id, updatedMins);
    try {
      await supabase
        .from('rounds')
        .update({ duration_minutes: updatedMins })
        .eq('id', r.id);
      toast.success(`Added +${minsToAdd} mins to Round #${r.round_number}! (Total: ${updatedMins} mins) ⏱️`);
      fetchRoundsData();
    } catch {
      toast.error('Failed to extend round time');
    }
  };

  // ── 2. HANDLE KICKING / DISQUALIFYING PARTICIPANT ──
  const handleKickParticipant = async () => {
    if (!kickModalParticipant) return;
    setKicking(true);
    try {
      // 1. Update active attempts for participant to disqualified
      const { error: attError } = await supabase
        .from('attempts')
        .update({
          status: 'disqualified',
          disqualification_reason: 'Evicted & Kicked by Host Administrator',
        })
        .eq('participant_id', kickModalParticipant.id);

      if (attError) console.warn('Attempt update error:', attError);

      toast.success(`Participant ${kickModalParticipant.name} (${kickModalParticipant.register_no}) HAS BEEN KICKED! 🛑`);
      setKickModalParticipant(null);
      fetchParticipantsData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to kick participant');
    } finally {
      setKicking(false);
    }
  };

  // ── 3. HANDLE LOCKING WEB PORTAL ENTRY ──
  const handleTogglePortalLock = () => {
    const nextState = !portalLocked;
    setPortalLocked(nextState);
    localStorage.setItem('portal_entry_locked', String(nextState));

    if (nextState) {
      toast.error('PORTAL ENTRY LOCKED 🔒 Student logins & test access are blocked!');
    } else {
      toast.success('PORTAL ENTRY UNLOCKED 🔓 Students can now enter and attempt quizzes.');
    }
  };

  // ── ADMIN PROFILE SAVE ──
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await supabase
          .from('profiles')
          .update({ display_name: adminName })
          .eq('id', session.user.id);
      }
      localStorage.setItem('admin_session', JSON.stringify({
        displayName: adminName,
        email: adminEmail,
        role: 'admin',
      }));
      toast.success('Admin profile saved successfully! ⚙️');
    } catch {
      toast.error('Failed to save profile');
    } finally {
      setSavingProfile(false);
    }
  };

  // ── FULL COMPETITION RESET ──
  const handleFullReset = async () => {
    if (confirmResetText !== 'RESET') {
      toast.error('Please type RESET to confirm');
      return;
    }

    if (!confirm('FINAL WARNING: This will delete ALL participant data, attempts, responses, and scores. Proceed?')) {
      return;
    }

    setResetting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Admin authentication required');
        setResetting(false);
        return;
      }

      const res = await fetch('/api/admin/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Competition data has been reset to zero! 🧹');
        setConfirmResetText('');
        setTimeout(() => window.location.reload(), 1500);
      } else {
        toast.error(data.error || 'Failed to perform reset');
      }
    } catch {
      toast.error('Error executing competition reset');
    } finally {
      setResetting(false);
    }
  };

  const filteredParticipants = participants.filter(
    (p) =>
      p.name?.toLowerCase().includes(participantSearch.toLowerCase()) ||
      p.register_no?.toLowerCase().includes(participantSearch.toLowerCase()) ||
      p.phone?.includes(participantSearch)
  );

  const cleanShadow = '0 4px 20px rgba(0,0,0,0.8)';

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-5xl mx-auto relative z-10" style={{ background: '#000000', minHeight: '100vh', color: '#FFFFFF' }}>

      {/* HEADER */}
      <FadeIn delay={0}>
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.2)] w-fit mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FFFFFF] animate-pulse" />
              <span className="font-[family-name:var(--font-heading)] text-[10px] font-semibold tracking-widest text-[#FFFFFF] uppercase">
                MISSION CONTROL SETTINGS
              </span>
            </div>
            <h1 className="font-[family-name:var(--font-display)] font-extrabold text-2xl md:text-3xl text-[#FFFFFF]">
              Portal Settings & Live Controls
            </h1>
            <p className="font-[family-name:var(--font-body)] text-xs md:text-sm text-[#94A3B8] font-light mt-0.5">
              Round timing adjustments, participant eviction, web entry locks, and system profile
            </p>
          </div>
        </div>

        <div className="h-[1px] w-full mt-4 bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.2)] to-transparent" />
      </FadeIn>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* SECTION 1: MASTER LOCK ENTRY OF THE WEB */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <FadeIn delay={0.06}>
        <GlassCard
          variant="elevated"
          radius={24}
          hover={false}
          noHover
          className={`!p-7 border ${portalLocked ? '!border-[rgba(255,0,51,0.5)]' : '!border-[rgba(255,255,255,0.16)]'}`}
          style={{ boxShadow: cleanShadow, background: '#000000' }}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${portalLocked ? 'bg-[rgba(255,0,51,0.15)] border-[rgba(255,0,51,0.4)] text-[#FF0033]' : 'bg-[rgba(255,255,255,0.08)] border-[rgba(255,255,255,0.2)] text-[#FFFFFF]'}`}>
                  {portalLocked ? <Lock size={20} /> : <Unlock size={20} />}
                </div>
                <div>
                  <h2 className="font-[family-name:var(--font-display)] font-bold text-xl text-[#FFFFFF]">
                    Web Portal Entry Lock 🔒
                  </h2>
                  <p className="font-[family-name:var(--font-body)] text-xs text-[#94A3B8] font-light">
                    Master gatekeeper to lock or unlock student web logins and quiz test entry
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span
                className={`px-3 py-1 rounded-full font-[family-name:var(--font-heading)] font-semibold text-xs uppercase tracking-wider ${
                  portalLocked
                    ? 'bg-[rgba(255,0,51,0.2)] text-[#FF4569] border border-[rgba(255,0,51,0.4)]'
                    : 'bg-[rgba(255,255,255,0.1)] text-[#FFFFFF] border border-[rgba(255,255,255,0.2)]'
                }`}
              >
                {portalLocked ? '● ENTRY LOCKED' : '○ ENTRY OPEN'}
              </span>

              <GalaxyButton
                variant={portalLocked ? "danger" : "primary"}
                size="md"
                onClick={handleTogglePortalLock}
              >
                {portalLocked ? <Unlock size={16} /> : <Lock size={16} />}
                {portalLocked ? 'UNLOCK WEB PORTAL' : 'LOCK WEB PORTAL ENTRY'}
              </GalaxyButton>
            </div>
          </div>
        </GlassCard>
      </FadeIn>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* SECTION 2: TIMING CONTROL OF EACH ROUND */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <FadeIn delay={0.12}>
        <GlassCard
          variant="elevated"
          radius={24}
          hover={false}
          noHover
          className="!p-7 border border-[rgba(255,255,255,0.12)] space-y-6"
          style={{ boxShadow: cleanShadow, background: '#000000' }}
        >
          <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] pb-4">
            <div>
              <h2 className="font-[family-name:var(--font-display)] font-bold text-xl text-[#FFFFFF] flex items-center gap-2">
                <Clock size={20} className="text-[#00B0FF]" /> Round Timing Control
              </h2>
              <p className="font-[family-name:var(--font-body)] text-xs text-[#94A3B8] font-light mt-0.5">
                Inspect and instantly extend duration or update start times for each competition round
              </p>
            </div>

            <button onClick={fetchRoundsData} className="p-2 rounded-lg bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.14)] text-[#FFFFFF] transition-colors cursor-pointer" title="Refresh rounds">
              <RefreshCw size={15} />
            </button>
          </div>

          {loadingRounds ? (
            <div className="py-12 text-center text-xs text-[#94A3B8]">Loading round timing controls...</div>
          ) : rounds.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#64748B]">No rounds created yet.</div>
          ) : (
            <div className="space-y-4">
              {rounds.map((r) => {
                const isUpdating = updatingRoundId === r.id;
                const isLive = r.status === 'live';

                return (
                  <div
                    key={r.id}
                    className={`p-4 md:p-5 rounded-2xl border transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 ${
                      isLive ? 'border-[rgba(0,176,255,0.4)] bg-[rgba(0,176,255,0.03)]' : 'border-[rgba(255,255,255,0.08)] bg-[#000000]'
                    }`}
                  >
                    {/* Left Details */}
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-[family-name:var(--font-mono)] font-bold text-sm text-[#FFFFFF]">
                          Round #{r.round_number}
                        </span>
                        <span className="font-[family-name:var(--font-display)] font-semibold text-base text-[#FFFFFF] truncate">
                          {r.title}
                        </span>
                        {isLive && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-[family-name:var(--font-heading)] font-bold bg-[rgba(255,0,51,0.2)] text-[#FF4569] border border-[rgba(255,0,51,0.4)] uppercase animate-pulse">
                            LIVE
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-[#94A3B8] font-[family-name:var(--font-mono)]">
                        <span>⏱ Current: <strong className="text-white">{r.duration_minutes} mins</strong></span>
                        <span>·</span>
                        <span>Start: {r.start_time ? new Date(r.start_time).toLocaleString('en-IN') : 'Not Set'}</span>
                      </div>
                    </div>

                    {/* Interactive Timing Controls */}
                    <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                      {/* Increment / Decrement Controls */}
                      <div className="flex items-center gap-1.5 bg-[rgba(255,255,255,0.06)] p-1 rounded-xl border border-[rgba(255,255,255,0.12)]">
                        <button
                          type="button"
                          onClick={() => handleUpdateRoundDuration(r.id, r.duration_minutes - 5)}
                          className="w-7 h-7 rounded-lg bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.2)] flex items-center justify-center text-white cursor-pointer"
                          title="Decrease 5 mins"
                        >
                          <Minus size={13} />
                        </button>

                        <div className="px-3 font-[family-name:var(--font-mono)] font-bold text-sm text-[#FFFFFF] min-w-[64px] text-center">
                          {r.duration_minutes}m
                        </div>

                        <button
                          type="button"
                          onClick={() => handleUpdateRoundDuration(r.id, r.duration_minutes + 5)}
                          className="w-7 h-7 rounded-lg bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.2)] flex items-center justify-center text-white cursor-pointer"
                          title="Increase 5 mins"
                        >
                          <Plus size={13} />
                        </button>
                      </div>

                      {/* Quick Extend Buttons */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleQuickAddMinutes(r, 10)}
                          className="px-2.5 py-1.5 rounded-lg bg-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.18)] border border-[rgba(255,255,255,0.15)] text-[11px] font-[family-name:var(--font-heading)] text-white cursor-pointer"
                        >
                          +10m
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickAddMinutes(r, 30)}
                          className="px-2.5 py-1.5 rounded-lg bg-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.18)] border border-[rgba(255,255,255,0.15)] text-[11px] font-[family-name:var(--font-heading)] text-white cursor-pointer"
                        >
                          +30m
                        </button>
                      </div>

                      {/* Save Button */}
                      <GalaxyButton
                        variant="primary"
                        size="xs"
                        onClick={() => handleSaveRoundTiming(r)}
                        loading={isUpdating}
                        disabled={isUpdating}
                      >
                        <Save size={13} /> Save Timing
                      </GalaxyButton>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>
      </FadeIn>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* SECTION 3: KICKING / DISQUALIFYING PARTICIPANTS */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <FadeIn delay={0.18}>
        <GlassCard
          variant="elevated"
          radius={24}
          hover={false}
          noHover
          className="!p-7 border border-[rgba(255,0,51,0.25)] space-y-6"
          style={{ boxShadow: cleanShadow, background: '#000000' }}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[rgba(255,255,255,0.08)] pb-4">
            <div>
              <h2 className="font-[family-name:var(--font-display)] font-bold text-xl text-[#FFFFFF] flex items-center gap-2">
                <UserX size={20} className="text-[#FF0033]" /> Participant Eviction & Disqualification
              </h2>
              <p className="font-[family-name:var(--font-body)] text-xs text-[#94A3B8] font-light mt-0.5">
                Search any active participant and kick/disqualify them from the competition in real time
              </p>
            </div>

            <div className="flex items-center gap-2 bg-[#000000] p-2 px-3 rounded-xl border border-[rgba(255,255,255,0.12)] w-full md:w-[280px]">
              <Search size={14} className="text-[#94A3B8] flex-shrink-0" />
              <input
                type="text"
                placeholder="Search by name or reg no..."
                value={participantSearch}
                onChange={(e) => setParticipantSearch(e.target.value)}
                className="bg-transparent border-none outline-none text-xs text-[#FFFFFF] placeholder:text-[#64748B] font-[family-name:var(--font-body)] w-full"
              />
            </div>
          </div>

          {loadingParticipants ? (
            <div className="py-12 text-center text-xs text-[#94A3B8]">Loading participant eviction list...</div>
          ) : filteredParticipants.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#64748B]">No participants found matching your query.</div>
          ) : (
            <div className="max-h-[360px] overflow-y-auto no-scrollbar space-y-2">
              {filteredParticipants.map((p) => {
                const isDisqualified = p.attempt_status === 'disqualified';

                return (
                  <div
                    key={p.id}
                    className={`p-3.5 px-4 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                      isDisqualified
                        ? 'border-[rgba(255,0,51,0.4)] bg-[rgba(255,0,51,0.08)]'
                        : 'border-[rgba(255,255,255,0.08)] bg-[#000000] hover:border-[rgba(255,255,255,0.2)]'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-[family-name:var(--font-body)] font-semibold text-sm text-[#FFFFFF] truncate">
                          {p.name || 'Participant'}
                        </span>
                        <span className="font-[family-name:var(--font-mono)] text-xs text-[#00B0FF]">
                          {p.register_no}
                        </span>
                      </div>

                      <p className="font-[family-name:var(--font-body)] text-xs text-[#94A3B8] font-light mt-0.5 truncate">
                        {p.email || '—'} · {p.phone || 'No phone'}
                      </p>
                    </div>

                    {isDisqualified ? (
                      <span className="px-3 py-1 rounded-full text-[10px] font-[family-name:var(--font-heading)] font-bold text-[#FF0033] bg-[rgba(255,0,51,0.16)] border border-[rgba(255,0,51,0.3)] uppercase">
                        KICKED & DISQUALIFIED
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setKickModalParticipant(p)}
                        className="px-3 py-1.5 rounded-xl bg-[rgba(255,0,51,0.14)] hover:bg-[rgba(255,0,51,0.28)] border border-[rgba(255,0,51,0.35)] text-[#FF4569] text-xs font-[family-name:var(--font-heading)] font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <UserX size={13} /> KICK PARTICIPANT
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>
      </FadeIn>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* SECTION 4: ADMIN PROFILE FORM */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <FadeIn delay={0.24}>
        <GlassCard variant="elevated" radius={24} hover={false} noHover className="!p-8 border border-[rgba(255,255,255,0.12)]" style={{ boxShadow: cleanShadow, background: '#000000' }}>
          <form onSubmit={handleSaveProfile} className="space-y-6">

            <div className="space-y-4">
              <h3 className="font-[family-name:var(--font-display)] font-semibold text-base text-[#FFFFFF] flex items-center gap-2">
                <User size={16} /> Admin Profile & Identity
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label text-xs text-[#E2E8F0]">Administrator Display Name</label>
                  <input
                    type="text"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    className="form-input bg-[#000000] text-[#FFFFFF] border border-[rgba(255,255,255,0.15)]"
                    placeholder="e.g. Chief Proctor"
                  />
                </div>

                <div>
                  <label className="form-label text-xs text-[#E2E8F0]">Admin Email (Read-only)</label>
                  <input
                    type="email"
                    value={adminEmail}
                    disabled
                    className="form-input bg-[#000000] text-[#94A3B8] opacity-70 cursor-not-allowed border border-[rgba(255,255,255,0.12)]"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <GalaxyButton variant="primary" size="md" type="submit" loading={savingProfile} disabled={savingProfile}>
                <Save size={16} /> Save Admin Profile
              </GalaxyButton>
            </div>

          </form>
        </GlassCard>
      </FadeIn>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* SECTION 5: FULL COMPETITION RESET */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <FadeIn delay={0.30}>
        <GlassCard
          variant="pink"
          radius={24}
          hover={false}
          noHover
          className="!p-8 border border-[rgba(255,0,51,0.35)] space-y-6"
          style={{ boxShadow: cleanShadow, background: '#000000' }}
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[rgba(255,0,51,0.18)] border border-[rgba(255,0,51,0.4)] flex items-center justify-center text-[var(--red-core)] flex-shrink-0">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h2 className="font-[family-name:var(--font-display)] font-bold text-xl text-[#FFFFFF]">
                Full Competition Reset ⚠
              </h2>
              <p className="font-[family-name:var(--font-body)] text-xs text-[#94A3B8] mt-1 font-light">
                Permanently wipe all student registration details, exam attempts, responses, and proctor logs.
              </p>
            </div>
          </div>

          <GlassCard variant="solid" radius={14} hover={false} noHover className="!p-4 border border-[rgba(255,255,255,0.08)] space-y-2" style={{ background: '#000000' }}>
            <div className="font-[family-name:var(--font-heading)] text-xs text-[#FF4569] font-semibold uppercase tracking-wider mb-2">
              What will be permanently deleted:
            </div>
            {[
              'All participant registrations (names, phones, register numbers)',
              'All quiz attempts and scores',
              'All saved student responses',
              'All proctor/violation events and logs',
              'All session cookies and active tokens',
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-xs font-[family-name:var(--font-body)] text-[#94A3B8] font-light">
                <Trash2 size={13} className="text-[#FF0033] flex-shrink-0" />
                <span>{item}</span>
              </div>
            ))}

            <div className="h-[1px] bg-[rgba(255,255,255,0.08)] my-3" />

            <div className="font-[family-name:var(--font-heading)] text-xs text-[#FFFFFF] font-semibold uppercase tracking-wider mb-2">
              These will be KEPT intact:
            </div>
            {[
              'Round configurations and timing settings',
              'All question bank questions and image assets',
              'Admin accounts and portal credentials',
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-xs font-[family-name:var(--font-body)] text-[#94A3B8] font-light">
                <CheckCircle2 size={13} className="text-[#FFFFFF] flex-shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </GlassCard>

          <div className="space-y-3 pt-2">
            <label className="font-[family-name:var(--font-heading)] text-xs text-[#E2E8F0] block">
              Type <span className="font-[family-name:var(--font-mono)] font-bold text-[#FF0033]">RESET</span> to confirm:
            </label>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={confirmResetText}
                onChange={(e) => setConfirmResetText(e.target.value)}
                placeholder="Type RESET here"
                className="flex-1 bg-[#000000] border border-[rgba(255,0,51,0.35)] focus:border-[#FF0033] rounded-xl px-4 py-3 text-sm font-[family-name:var(--font-mono)] text-[#FF0033] outline-none"
              />

              <GalaxyButton
                variant="danger"
                size="md"
                onClick={handleFullReset}
                loading={resetting}
                disabled={confirmResetText !== 'RESET' || resetting}
                className="whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {resetting ? 'Executing Reset...' : '⚠ RESET ALL COMPETITION DATA'}
              </GalaxyButton>
            </div>
          </div>
        </GlassCard>
      </FadeIn>

      {/* KICK CONFIRMATION MODAL */}
      {kickModalParticipant && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 pb-28 overflow-y-auto">
          <div className="fixed inset-0 bg-[#000000]/85 backdrop-blur-md" onClick={() => setKickModalParticipant(null)} />
          <div className="relative z-10 w-full max-w-sm">
            <GlassCard variant="elevated" radius={28} hover={false} noHover className="!p-7 border border-[rgba(255,0,51,0.4)] space-y-4" style={{ background: '#000000' }}>
              <div className="flex items-center gap-2 text-[#FF0033] font-[family-name:var(--font-display)] font-bold text-xl">
                <UserX size={20} /> Kick Participant?
              </div>
              <p className="font-[family-name:var(--font-body)] text-xs text-[#94A3B8] font-light">
                Are you sure you want to kick and disqualify <strong className="text-white">{kickModalParticipant.name}</strong> ({kickModalParticipant.register_no})?
              </p>
              <div className="flex justify-end gap-3 pt-2">
                <GalaxyButton variant="secondary" size="sm" onClick={() => setKickModalParticipant(null)}>
                  Cancel
                </GalaxyButton>
                <GalaxyButton variant="danger" size="sm" onClick={handleKickParticipant} loading={kicking}>
                  Confirm Kick
                </GalaxyButton>
              </div>
            </GlassCard>
          </div>
        </div>
      )}

    </div>
  );
}
