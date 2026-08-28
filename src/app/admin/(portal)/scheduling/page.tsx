'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import GlassCard from '@/components/shared/GlassCard';
import GalaxyButton from '@/components/shared/GalaxyButton';
import FadeIn from '@/components/shared/FadeIn';
import { Calendar, Clock, Sparkles, Plus, Trash2, CheckCircle2, Play, AlertCircle, FileText } from 'lucide-react';
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

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [testTitle, setTestTitle] = useState('Weekly Test 1');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [startTime, setStartTime] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

  const handleScheduleTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || 'admin';

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

      toast.success(`🎉 ${json.scheduled_test.title} Scheduled! 50 Questions compiled across ${json.active_subjects_count} subjects! 🚀`);
      setShowModal(false);
      fetchScheduledTests();
    } catch (err: any) {
      toast.error(err.message || 'Error scheduling test');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (testId: string, currentStatus: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || 'admin';

      const newStatus = currentStatus === 'live' ? 'draft' : 'live';
      const res = await fetch(`/api/admin/rounds/${testId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
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
                TEST SCHEDULER & ASSESSMENT HUB ✦
              </span>
            </div>

            <h1 className="font-[family-name:var(--font-display)] font-extrabold text-2xl md:text-3xl text-[#FFFFFF]">
              Weekly Test Scheduling
            </h1>
            <p className="font-[family-name:var(--font-body)] text-xs md:text-sm text-[#94A3B8] font-light mt-0.5">
              Schedule weekly department exams with 50 automated random questions drawn from your subject question bank
            </p>
          </div>

          <GalaxyButton
            variant="cyan"
            size="sm"
            onClick={() => {
              setTestTitle(`Weekly Test ${tests.length + 1}`);
              setShowModal(true);
            }}
            className="!border-[#00E5FF] !text-[#00E5FF] shadow-[0_0_20px_rgba(0,229,255,0.3)]"
          >
            <Plus size={14} /> Schedule New 50-Q Test
          </GalaxyButton>
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
              Schedule your first Weekly Test! The system will automatically compile 50 random questions across all subjects containing questions in your Question Bank.
            </p>
            <div className="flex justify-center mt-5">
              <GalaxyButton variant="cyan" size="sm" onClick={() => setShowModal(true)}>
                <Plus size={14} /> Schedule Weekly Test
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
                        {test.description || 'Automated multi-subject weekly test paper.'}
                      </p>

                      <div className="flex flex-wrap gap-4 text-xs font-[family-name:var(--font-mono)] text-[#00E5FF]">
                        <span className="flex items-center gap-1">
                          <Calendar size={13} />
                          {test.start_time ? new Date(test.start_time).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Flexible'}
                        </span>
                        <span className="flex items-center gap-1 text-[#94A3B8]">
                          <Clock size={13} />
                          {test.duration_minutes} Minutes
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
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

      {/* ═══ SCHEDULE TEST MODAL ═══ */}
      {showModal && (
        <div className="fixed inset-0 z-[99999] overflow-y-auto bg-black/90 backdrop-blur-md p-3 sm:p-6 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/80" onClick={() => setShowModal(false)} />

          <div className="relative z-10 w-full max-w-lg bg-[#08080C] border border-[#00E5FF]/40 rounded-3xl shadow-[0_0_50px_rgba(0,229,255,0.2)] overflow-hidden my-auto p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="font-[family-name:var(--font-display)] font-extrabold text-lg text-white flex items-center gap-2">
                <span className="text-[#00E5FF]">📅</span> Schedule Weekly Test
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center transition-all cursor-pointer text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleScheduleTest} className="space-y-4">
              <div>
                <label className="form-label text-xs text-[#E2E8F0] font-bold">Test Title</label>
                <input
                  type="text"
                  value={testTitle}
                  onChange={(e) => setTestTitle(e.target.value)}
                  placeholder="e.g. Weekly Test 1"
                  className="form-input bg-[#000000] text-white border border-white/20 text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="form-label text-xs text-[#E2E8F0] font-bold">Start Date & Time</label>
                  <input
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="form-input bg-[#000000] text-white border border-white/20 text-xs"
                  />
                </div>

                <div>
                  <label className="form-label text-xs text-[#E2E8F0] font-bold">Duration (Minutes)</label>
                  <input
                    type="number"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    placeholder="45"
                    className="form-input bg-[#000000] text-white border border-white/20 text-xs"
                    required
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#00E5FF]/10 border border-[#00E5FF]/30 space-y-1 text-xs text-white">
                <div className="font-bold flex items-center gap-1.5 text-[#00E5FF]">
                  <Sparkles size={14} />
                  <span>Automated 50-Question Generation:</span>
                </div>
                <p className="text-[11px] text-[#94A3B8] leading-relaxed">
                  When scheduled, the system automatically draws an equal random distribution of questions across all subjects containing questions in your Question Bank to assemble a 50-question test paper.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <GalaxyButton variant="secondary" size="sm" type="button" onClick={() => setShowModal(false)}>
                  Cancel
                </GalaxyButton>
                <GalaxyButton variant="cyan" size="sm" type="submit" loading={submitting}>
                  📅 Schedule Test Now
                </GalaxyButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
