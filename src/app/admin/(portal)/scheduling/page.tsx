'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import GlassCard from '@/components/shared/GlassCard';
import GalaxyButton from '@/components/shared/GalaxyButton';
import FadeIn from '@/components/shared/FadeIn';
import { Calendar, Clock, Sparkles, Plus, Trash2, Edit3, Play, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

interface ScheduledTest {
  id: string;
  round_number: number;
  title: string;
  description?: string;
  duration_minutes: number;
  start_time?: string;
  status: 'draft' | 'live' | 'completed' | 'archived';
  questions?: { count: number }[];
  created_at: string;
}

export default function SchedulingDashboardPage() {
  const [tests, setTests] = useState<ScheduledTest[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State (Create / Edit)
  const [showModal, setShowModal] = useState(false);
  const [editingTestId, setEditingTestId] = useState<string | null>(null);
  const [testTitle, setTestTitle] = useState('Weekly Test 1');
  const [durationMinutes, setDurationMinutes] = useState(60); // Default 60 Minutes (1 Hour)
  const [startTime, setStartTime] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [autoGenerating, setAutoGenerating] = useState(false);

  const fetchScheduledTests = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || 'admin';

      const res = await fetch('/api/admin/scheduling', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setTests(data.scheduled_tests || []);
      }
    } catch {
      toast.error('Failed to load scheduled tests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchScheduledTests();
  }, [fetchScheduledTests]);

  // ── AUTO-GENERATE MONDAY & FRIDAY WEEKLY TESTS (6:00 PM, 1 HOUR, 50 QS) ──
  const handleAutoGenerateMonFri = async () => {
    setAutoGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || 'admin';

      const res = await fetch('/api/admin/scheduling', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'auto_generate_mon_fri' }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to auto-generate tests');

      toast.success(`🎉 Auto-Generated Monday & Friday Weekly Tests at 6:00 PM (1 Hour Duration, 50 Qs per test)! 🚀`);
      fetchScheduledTests();
    } catch (err: any) {
      toast.error(err.message || 'Error generating weekly tests');
    } finally {
      setAutoGenerating(false);
    }
  };

  // ── SAVE OR EDIT SINGLE TEST ──
  const handleSaveOrEditTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || 'admin';

      if (editingTestId) {
        // EDIT EXISTING TEST & TIMER
        const res = await fetch('/api/admin/scheduling', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            id: editingTestId,
            title: testTitle,
            duration_minutes: durationMinutes,
            start_time: startTime || null,
          }),
        });

        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to update test timer');
        toast.success(`Updated ${testTitle}! Duration set to ${durationMinutes} minutes! ✏️`);
      } else {
        // SCHEDULE NEW TEST
        const res = await fetch('/api/admin/scheduling', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: testTitle,
            duration_minutes: durationMinutes,
            start_time: startTime || new Date().toISOString(),
            total_target_questions: 50,
          }),
        });

        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to schedule test');

        toast.success(`🎉 ${json.scheduled_test.title} Scheduled! 50 Questions compiled across subjects! 🚀`);
      }

      setShowModal(false);
      fetchScheduledTests();
    } catch (err: any) {
      toast.error(err.message || 'Error saving test');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEditModal = (test: ScheduledTest) => {
    setEditingTestId(test.id);
    setTestTitle(test.title);
    setDurationMinutes(test.duration_minutes || 60);
    setStartTime(test.start_time ? new Date(test.start_time).toISOString().slice(0, 16) : '');
    setShowModal(true);
  };

  const handleToggleStatus = async (testId: string, currentStatus: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || 'admin';

      const newStatus = currentStatus === 'live' ? 'draft' : 'live';
      const res = await fetch('/api/admin/scheduling', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: testId, status: newStatus }),
      });

      if (!res.ok) throw new Error('Failed to update status');
      toast.success(`Test marked as ${newStatus.toUpperCase()}`);
      fetchScheduledTests();
    } catch {
      toast.error('Failed to update test status');
    }
  };

  const handleDeleteTest = async (testId: string) => {
    if (!confirm('Are you sure you want to delete this scheduled test?')) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || 'admin';

      const res = await fetch(`/api/admin/rounds/${testId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed to delete test');
      toast.success('Scheduled test deleted');
      fetchScheduledTests();
    } catch {
      toast.error('Failed to delete test');
    }
  };

  const cleanShadow = '0 4px 20px rgba(0,0,0,0.8)';

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-[1400px] mx-auto relative z-10" style={{ background: '#000000', minHeight: '100vh', color: '#FFFFFF' }}>
      
      {/* ═══ HEADER ═══ */}
      <FadeIn delay={0}>
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.2)] w-fit mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF] animate-pulse" />
              <span className="font-[family-name:var(--font-heading)] text-[10px] font-semibold tracking-widest text-[#00E5FF] uppercase">
                TEST SCHEDULER & AUTOMATION HUB ✦
              </span>
            </div>

            <h1 className="font-[family-name:var(--font-display)] font-extrabold text-2xl md:text-3xl text-[#FFFFFF]">
              Weekly Test Scheduling
            </h1>
            <p className="font-[family-name:var(--font-body)] text-xs md:text-sm text-[#94A3B8] font-light mt-0.5">
              Auto-generate 50-Question Weekly Tests for Monday & Friday (6:00 PM, 1 Hour Duration) with editable timers
            </p>
          </div>

          <div className="flex items-center gap-3">
            <GalaxyButton
              variant="gold"
              size="sm"
              onClick={handleAutoGenerateMonFri}
              loading={autoGenerating}
              className="!border-[#FFD700] !text-[#FFD700] shadow-[0_0_20px_rgba(255,215,0,0.3)]"
            >
              <RefreshCw size={14} /> Auto-Generate Mon & Fri Tests (6 PM)
            </GalaxyButton>

            <GalaxyButton
              variant="cyan"
              size="sm"
              onClick={() => {
                setEditingTestId(null);
                setTestTitle(`Weekly Test ${tests.length + 1}`);
                setDurationMinutes(60);
                setStartTime('');
                setShowModal(true);
              }}
              className="!border-[#00E5FF] !text-[#00E5FF] shadow-[0_0_20px_rgba(0,229,255,0.3)]"
            >
              <Plus size={14} /> Schedule Custom Test
            </GalaxyButton>
          </div>
        </div>

        <div className="h-[1px] w-full mt-4 bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.2)] to-transparent" />
      </FadeIn>

      {/* ═══ SCHEDULED TESTS LIST ═══ */}
      <FadeIn delay={0.06}>
        {loading ? (
          <div className="py-20 text-center text-xs text-[#94A3B8]">Loading scheduled tests...</div>
        ) : tests.length === 0 ? (
          <GlassCard variant="solid" radius={24} hover={false} noHover className="!p-16 text-center border border-[rgba(255,255,255,0.12)]" style={{ background: '#000000' }}>
            <Calendar size={48} className="mx-auto text-[#64748B] opacity-40 mb-3" />
            <h3 className="font-[family-name:var(--font-display)] font-bold text-lg text-[#FFFFFF]">
              No scheduled tests found
            </h3>
            <p className="font-[family-name:var(--font-body)] text-xs text-[#94A3B8] mt-1 max-w-md mx-auto">
              Click &quot;Auto-Generate Mon & Fri Tests&quot; to automatically create upcoming Monday and Friday tests (6:00 PM, 1 Hour, 50 Qs), or schedule a custom test paper!
            </p>
            <div className="flex justify-center gap-3 mt-5">
              <GalaxyButton variant="gold" size="sm" onClick={handleAutoGenerateMonFri}>
                <RefreshCw size={14} /> Auto-Generate Mon & Fri Tests
              </GalaxyButton>
              <GalaxyButton variant="cyan" size="sm" onClick={() => setShowModal(true)}>
                <Plus size={14} /> Schedule Custom Test
              </GalaxyButton>
            </div>
          </GlassCard>
        ) : (
          <div className="space-y-4">
            {tests.map((test, index) => {
              const qCount = test.questions?.[0]?.count || 50;

              return (
                <GlassCard
                  key={test.id}
                  variant="elevated"
                  radius={20}
                  hover={false}
                  noHover
                  className="!p-6 border border-[rgba(255,255,255,0.12)] transition-all"
                  style={{ background: '#000000', boxShadow: cleanShadow }}
                >
                  <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                    <div className="space-y-3 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-[family-name:var(--font-mono)] font-bold text-xs px-2.5 py-0.5 rounded-full bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.2)] text-white">
                          #{index + 1}
                        </span>

                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-[family-name:var(--font-heading)] font-bold bg-[rgba(0,229,255,0.14)] border border-[rgba(0,229,255,0.3)] text-[#00E5FF] uppercase">
                          📝 {qCount} Questions
                        </span>

                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-[family-name:var(--font-heading)] font-bold bg-[rgba(255,215,0,0.14)] border border-[rgba(255,215,0,0.3)] text-[#FFD700] uppercase">
                          ⏱️ {test.duration_minutes || 60} Mins (1 Hour)
                        </span>

                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-[family-name:var(--font-heading)] font-bold uppercase ${
                          test.status === 'live'
                            ? 'bg-[rgba(16,185,129,0.15)] border border-[rgba(16,185,129,0.4)] text-[#10B981]'
                            : 'bg-[rgba(245,158,11,0.15)] border border-[rgba(245,158,11,0.4)] text-[#F59E0B]'
                        }`}>
                          {test.status === 'live' ? '🔴 LIVE NOW' : '⏳ SCHEDULED DRAFT'}
                        </span>
                      </div>

                      <h2 className="font-[family-name:var(--font-display)] font-extrabold text-lg text-white">
                        {test.title}
                      </h2>

                      <p className="font-[family-name:var(--font-body)] text-xs text-[#94A3B8]">
                        {test.description || 'Automated multi-subject weekly test paper compiled across active subject bank.'}
                      </p>

                      <div className="flex flex-wrap gap-4 text-xs font-[family-name:var(--font-mono)] text-[#00E5FF]">
                        <span className="flex items-center gap-1">
                          <Calendar size={13} />
                          {test.start_time ? new Date(test.start_time).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Flexible'}
                        </span>
                        <span className="flex items-center gap-1 text-[#FFD700]">
                          <Clock size={13} />
                          Timer: {test.duration_minutes} Mins
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleOpenEditModal(test)}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold font-[family-name:var(--font-heading)] bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all cursor-pointer flex items-center gap-1.5"
                        title="Edit test title, date, or timer duration"
                      >
                        <Edit3 size={13} />
                        <span>Edit Timer / Info</span>
                      </button>

                      <button
                        onClick={() => handleToggleStatus(test.id, test.status)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold font-[family-name:var(--font-heading)] transition-all cursor-pointer flex items-center gap-1.5 ${
                          test.status === 'live'
                            ? 'bg-amber-500/20 border border-amber-500/40 text-amber-400 hover:bg-amber-500/35'
                            : 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/35'
                        }`}
                      >
                        {test.status === 'live' ? (
                          <><span>Pause Test</span></>
                        ) : (
                          <><Play size={13} /><span>Make Live Now</span></>
                        )}
                      </button>

                      <button
                        onClick={() => handleDeleteTest(test.id)}
                        className="p-2 rounded-xl bg-[rgba(255,0,51,0.14)] hover:bg-[rgba(255,0,51,0.25)] border border-[rgba(255,0,51,0.3)] text-[#FF4569] transition-colors cursor-pointer"
                        title="Delete scheduled test"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        )}
      </FadeIn>

      {/* ═══ SCHEDULE / EDIT TEST MODAL ═══ */}
      {showModal && (
        <div className="fixed inset-0 z-[99999] overflow-y-auto bg-black/90 backdrop-blur-md p-3 sm:p-6 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/80" onClick={() => setShowModal(false)} />

          <div className="relative z-10 w-full max-w-lg bg-[#08080C] border border-[#00E5FF]/40 rounded-3xl shadow-[0_0_50px_rgba(0,229,255,0.2)] overflow-hidden my-auto p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="font-[family-name:var(--font-display)] font-extrabold text-lg text-white flex items-center gap-2">
                <span className="text-[#00E5FF]">📅</span> {editingTestId ? 'Edit Test & Timer' : 'Schedule Weekly Test'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center transition-all cursor-pointer text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveOrEditTest} className="space-y-4">
              <div>
                <label className="form-label text-xs text-[#E2E8F0] font-bold">Test Title</label>
                <input
                  type="text"
                  value={testTitle}
                  onChange={(e) => setTestTitle(e.target.value)}
                  placeholder="e.g. Weekly Test 1 (Monday 6:00 PM)"
                  className="form-input bg-[#000000] text-white border border-white/20 text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="form-label text-xs text-[#E2E8F0] font-bold">Start Date & Time (Default 6:00 PM)</label>
                  <input
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="form-input bg-[#000000] text-white border border-white/20 text-xs"
                  />
                </div>

                <div>
                  <label className="form-label text-xs text-[#FFD700] font-bold">Timer Duration (Minutes)</label>
                  <input
                    type="number"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    placeholder="60"
                    className="form-input bg-[#000000] text-[#FFD700] border border-[#FFD700]/40 text-xs font-bold font-[family-name:var(--font-mono)]"
                    required
                  />
                  <span className="text-[10px] text-[#94A3B8]">Default: 60 mins (1 hour)</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#00E5FF]/10 border border-[#00E5FF]/30 space-y-1 text-xs text-white">
                <div className="font-bold flex items-center gap-1.5 text-[#00E5FF]">
                  <Sparkles size={14} />
                  <span>50-Question Automated Paper Generation:</span>
                </div>
                <p className="text-[11px] text-[#94A3B8] leading-relaxed">
                  The system automatically compiles an equal random quota of 50 questions across all subjects containing questions in your Question Bank. You can edit the timer anytime!
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <GalaxyButton variant="secondary" size="sm" type="button" onClick={() => setShowModal(false)}>
                  Cancel
                </GalaxyButton>
                <GalaxyButton variant="cyan" size="sm" type="submit" loading={submitting}>
                  {editingTestId ? '✏️ Save Timer & Details' : '📅 Schedule Test Now'}
                </GalaxyButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
