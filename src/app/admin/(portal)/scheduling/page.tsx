'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import GlassCard from '@/components/shared/GlassCard';
import GalaxyButton from '@/components/shared/GalaxyButton';
import FadeIn from '@/components/shared/FadeIn';
import { Calendar, Clock, Play, Pause, CheckCircle2, ChevronDown, ChevronUp, Settings, Layers, Users, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';

interface SectionInfo {
  section: string;
  roundId: string;
  roundNumber: number;
  batchNumber: string;
  questionCount: number;
  status: string;
}

interface TestInfo {
  testNumber: number;
  week: number;
  testInWeek: number;
  cycle?: number;
  status: 'draft' | 'live' | 'completed';
  duration_minutes: number;
  sections: SectionInfo[];
}

interface DemoTestInfo {
  roundId: string;
  title: string;
  description?: string;
  status: string;
  duration_minutes: number;
  questionCount: number;
}

export default function SchedulingDashboardPage() {
  const [tests, setTests] = useState<TestInfo[]>([]);
  const [demoTest, setDemoTest] = useState<DemoTestInfo | null>(null);
  const [totalRounds, setTotalRounds] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedCycle, setSelectedCycle] = useState<number | 'all'>('all');
  const [expandedTest, setExpandedTest] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState<number | string | null>(null);
  const [editingDuration, setEditingDuration] = useState<number | null>(null);
  const [durationValue, setDurationValue] = useState(60);
  const [demoDuration, setDemoDuration] = useState<number>(15);
  const [editingDemoDuration, setEditingDemoDuration] = useState<boolean>(false);

  const fetchTests = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || 'admin';

      const res = await fetch('/api/admin/scheduling', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setTests(data.tests || []);
        setDemoTest(data.demo_test || null);
        if (data.demo_test) {
          setDemoDuration(data.demo_test.duration_minutes || 15);
        }
        setTotalRounds(data.total_rounds || 0);
        setTotalQuestions(data.total_questions || 0);
      }
    } catch {
      toast.error('Failed to load test schedule');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTests();
  }, [fetchTests]);

  const handleAction = async (action: string, testNumber: number) => {
    setActionLoading(testNumber);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || 'admin';

      const res = await fetch('/api/admin/scheduling', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action, test_number: testNumber }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Action failed');

      toast.success(json.message || 'Action completed');
      fetchTests();
    } catch (err: any) {
      toast.error(err.message || 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateDuration = async (testNumber: number) => {
    setActionLoading(testNumber);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || 'admin';

      const res = await fetch('/api/admin/scheduling', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'update_duration',
          test_number: testNumber,
          duration_minutes: durationValue,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Update failed');

      toast.success(`Duration updated to ${durationValue} minutes`);
      setEditingDuration(null);
      fetchTests();
    } catch (err: any) {
      toast.error(err.message || 'Update failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleDemo = async (activate: boolean) => {
    setActionLoading('demo');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || 'admin';

      const res = await fetch('/api/admin/scheduling', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: activate ? 'activate_demo' : 'deactivate_demo' }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to toggle demo test');

      toast.success(json.message || 'Demo test updated');
      fetchTests();
    } catch (err: any) {
      toast.error(err.message || 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateDemoDuration = async (minutes: number) => {
    setActionLoading('demo-duration');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || 'admin';

      const res = await fetch('/api/admin/scheduling', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'update_demo_duration',
          duration_minutes: minutes,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to update duration');

      toast.success(json.message || `Demo duration set to ${minutes} mins`);
      setEditingDemoDuration(false);
      fetchTests();
    } catch (err: any) {
      toast.error(err.message || 'Update failed');
    } finally {
      setActionLoading(null);
    }
  };


  const liveTest = tests.find(t => t.status === 'live');
  const completedTests = tests.filter(t => t.status === 'completed').length;
  const draftTests = tests.filter(t => t.status === 'draft').length;

  const getStatusColor = (status: string) => {
    if (status === 'live') return { bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.4)', text: '#10B981' };
    if (status === 'completed') return { bg: 'rgba(99,102,241,0.15)', border: 'rgba(99,102,241,0.4)', text: '#818CF8' };
    return { bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.15)', text: '#94A3B8' };
  };

  const getStatusLabel = (status: string) => {
    if (status === 'live') return '🔴 LIVE NOW';
    if (status === 'completed') return '✅ COMPLETED';
    return '⏸️ DRAFT';
  };

  const getWeekLabel = (week: number) => `Week ${week}`;

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-[1400px] mx-auto relative z-10" style={{ background: '#000000', minHeight: '100vh', color: '#FFFFFF' }}>
      
      {/* ═══ HEADER ═══ */}
      <FadeIn delay={0}>
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.2)] w-fit mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF] animate-pulse" />
              <span className="font-[family-name:var(--font-heading)] text-[10px] font-semibold tracking-widest text-[#00E5FF] uppercase">
                BATCH-BASED TEST SCHEDULER ✦
              </span>
            </div>

            <h1 className="font-[family-name:var(--font-display)] font-extrabold text-2xl md:text-3xl text-[#FFFFFF]">
              Test Scheduling Dashboard
            </h1>
            <p className="font-[family-name:var(--font-body)] text-xs md:text-sm text-[#94A3B8] font-light mt-0.5">
              1,600 Questions → 32 Batches → 32 Tests (128 Rounds) → 16 Weeks (4 Cycles) of Latin Square Rotation
            </p>
          </div>
        </div>

        {/* ═══ CYCLE FILTER TABS ═══ */}
        <div className="flex flex-wrap items-center gap-2 mt-4 p-1.5 rounded-2xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)]">
          <span className="text-[11px] text-[#94A3B8] font-[family-name:var(--font-heading)] uppercase font-semibold px-3 py-1">
            Cycle View:
          </span>
          {[
            { id: 'all', label: 'All 16 Weeks (32 Tests)' },
            { id: 1, label: 'Cycle 1 (Tests 1–8 • W1–4)' },
            { id: 2, label: 'Cycle 2 (Tests 9–16 • W5–8)' },
            { id: 3, label: 'Cycle 3 (Tests 17–24 • W9–12)' },
            { id: 4, label: 'Cycle 4 (Tests 25–32 • W13–16)' },
          ].map(c => {
            const isSelected = selectedCycle === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedCycle(c.id as any)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold font-[family-name:var(--font-heading)] transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-[#00E5FF]/20 text-[#00E5FF] border-[#00E5FF]/50 shadow-[0_0_15px_rgba(0,229,255,0.25)]'
                    : 'bg-transparent text-[#94A3B8] border-transparent hover:bg-white/5 hover:text-white'
                }`}
              >
                {c.label}
              </button>
            );
          })}
        </div>

        <div className="h-[1px] w-full mt-4 bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.2)] to-transparent" />
      </FadeIn>

      {/* ═══ SUMMARY STATS ═══ */}
      <FadeIn delay={0.03}>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'Total Tests', value: tests.length, icon: Layers, color: '#00E5FF' },
            { label: 'Total Rounds', value: totalRounds, icon: BookOpen, color: '#A855F7' },
            { label: 'Total Questions', value: totalQuestions.toLocaleString(), icon: Calendar, color: '#FFD700' },
            { label: 'Currently Live', value: liveTest ? `Test ${liveTest.testNumber}` : 'None', icon: Play, color: '#10B981' },
            { label: 'Completed / Remaining', value: `${completedTests} / ${draftTests}`, icon: CheckCircle2, color: '#818CF8' },
          ].map((stat, idx) => (
            <div
              key={idx}
              className="rounded-2xl p-4 border transition-all"
              style={{
                background: '#000000',
                borderColor: `${stat.color}30`,
                boxShadow: `0 0 20px ${stat.color}10`,
              }}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <stat.icon size={14} style={{ color: stat.color }} />
                <span className="font-[family-name:var(--font-heading)] text-[10px] font-semibold tracking-wider uppercase" style={{ color: stat.color }}>
                  {stat.label}
                </span>
              </div>
              <p className="font-[family-name:var(--font-mono)] font-bold text-lg text-white">{stat.value}</p>
            </div>
          ))}
        </div>
      </FadeIn>

      {/* ═══ SAMPLE / DEMO TEST CONTROLLER ═══ */}
      <FadeIn delay={0.05}>
        <div
          className="rounded-3xl p-6 border transition-all relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.08) 0%, rgba(168, 85, 247, 0.08) 50%, rgba(0, 0, 0, 0.95) 100%)',
            borderColor: demoTest?.status === 'live' ? '#00E5FF80' : 'rgba(255,255,255,0.15)',
            boxShadow: demoTest?.status === 'live' ? '0 0 35px rgba(0,229,255,0.2), inset 0 1px 0 rgba(255,255,255,0.2)' : '0 10px 30px rgba(0,0,0,0.6)',
          }}
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Left: Info */}
            <div className="space-y-3 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full text-[10px] font-[family-name:var(--font-heading)] font-extrabold bg-[#00E5FF]/20 border border-[#00E5FF]/50 text-[#00E5FF] tracking-wider uppercase flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#00E5FF] animate-pulse" />
                  DEPARTMENT SAMPLE & DEMO TEST ✦
                </span>

                <span
                  className="px-3 py-1 rounded-full text-[10px] font-[family-name:var(--font-heading)] font-bold uppercase tracking-wider"
                  style={{
                    background: demoTest?.status === 'live' ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.08)',
                    color: demoTest?.status === 'live' ? '#10B981' : '#94A3B8',
                    border: `1px solid ${demoTest?.status === 'live' ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.2)'}`,
                  }}
                >
                  {demoTest?.status === 'live' ? '🟢 LIVE (READY FOR COLLEAGUES)' : '⏸️ DRAFT (INACTIVE)'}
                </span>

                <span className="px-3 py-1 rounded-full text-[10px] font-[family-name:var(--font-mono)] font-bold bg-[#FFD700]/15 border border-[#FFD700]/40 text-[#FFD700]">
                  📝 15 Questions (10 MCQs + 5 Fill-in-the-blanks)
                </span>
              </div>

              <div>
                <h2 className="font-[family-name:var(--font-display)] font-extrabold text-xl md:text-2xl text-white flex items-center gap-2">
                  <span>{demoTest?.title || 'Sample Demo Test — ECE Platform Compatibility Trial'}</span>
                </h2>
                <p className="font-[family-name:var(--font-body)] text-xs md:text-sm text-[#CBD5E1] mt-1 leading-relaxed">
                  {demoTest?.description || 'Colleague & student trial test to practically verify web responsiveness, question display, fill-in-the-blanks engine, and collect attendance data.'}
                </p>
              </div>

              {/* Status pills */}
              <div className="flex flex-wrap items-center gap-4 text-xs font-[family-name:var(--font-mono)] text-[#94A3B8]">
                <span className="flex items-center gap-1.5 text-[#00E5FF]">
                  <Clock size={14} />
                  Current Timer: <strong className="text-white font-bold">{demoTest?.duration_minutes || demoDuration} Minutes</strong>
                </span>
                <span className="flex items-center gap-1.5 text-[#A855F7]">
                  <Users size={14} />
                  Open to All 4 Sections (A, B, C, D)
                </span>
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 size={14} />
                  Instant Attendance & Reports Logging
                </span>
              </div>
            </div>

            {/* Right: Controls (Activate/Deactivate + Timer controller + Attendance Link) */}
            <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-3 flex-shrink-0">
              {/* Primary Activate / Deactivate Toggle */}
              <div className="flex items-center gap-2 w-full justify-end">
                {demoTest?.status === 'live' ? (
                  <button
                    onClick={() => handleToggleDemo(false)}
                    disabled={actionLoading === 'demo'}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-2xl text-xs font-bold font-[family-name:var(--font-heading)] bg-amber-500/20 border border-amber-500/50 text-amber-400 hover:bg-amber-500/35 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.2)] disabled:opacity-50"
                  >
                    <Pause size={14} />
                    <span>{actionLoading === 'demo' ? 'Deactivating...' : 'Disable Demo Test'}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleToggleDemo(true)}
                    disabled={actionLoading === 'demo'}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-2xl text-xs font-bold font-[family-name:var(--font-heading)] bg-emerald-500/25 border border-emerald-500/60 text-emerald-300 hover:bg-emerald-500/40 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(16,185,129,0.3)] disabled:opacity-50"
                  >
                    <Play size={14} />
                    <span>{actionLoading === 'demo' ? 'Activating...' : '🚀 Activate Demo Test (Go Live)'}</span>
                  </button>
                )}

                <Link
                  href="/admin/participants"
                  className="px-4 py-2.5 rounded-2xl text-xs font-bold font-[family-name:var(--font-heading)] bg-[#A855F7]/20 hover:bg-[#A855F7]/35 border border-[#A855F7]/40 text-[#D8B4FE] transition-all flex items-center gap-1.5"
                  title="View Colleague Attendance Sheet"
                >
                  <BookOpen size={14} />
                  <span>Attendance Sheet</span>
                </Link>
              </div>

              {/* Timer / Duration Controller */}
              <div className="w-full bg-black/60 border border-white/10 rounded-2xl p-3 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-[family-name:var(--font-heading)] text-[#CBD5E1]">
                  <span className="flex items-center gap-1">
                    <Clock size={12} className="text-[#FFD700]" />
                    <span>Timer Control:</span>
                  </span>
                  <span className="font-mono text-[#FFD700] font-bold">
                    {demoDuration} Mins
                  </span>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {[5, 10, 15, 20, 30, 45].map((m) => (
                    <button
                      key={m}
                      onClick={() => {
                        setDemoDuration(m);
                        handleUpdateDemoDuration(m);
                      }}
                      disabled={actionLoading === 'demo-duration'}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold font-mono transition-all cursor-pointer border ${
                        demoDuration === m
                          ? 'bg-[#FFD700]/25 text-[#FFD700] border-[#FFD700]/60'
                          : 'bg-white/5 text-[#94A3B8] border-white/10 hover:bg-white/15 hover:text-white'
                      }`}
                    >
                      {m}m
                    </button>
                  ))}

                  {/* Custom Duration Input */}
                  <div className="flex items-center gap-1 ml-auto">
                    <input
                      type="number"
                      min={1}
                      max={180}
                      value={demoDuration}
                      onChange={(e) => setDemoDuration(Number(e.target.value))}
                      className="w-12 px-1.5 py-0.5 rounded-lg bg-black border border-white/20 text-white font-mono text-[10px] text-center"
                    />
                    <button
                      onClick={() => handleUpdateDemoDuration(demoDuration)}
                      disabled={actionLoading === 'demo-duration'}
                      className="px-2 py-0.5 rounded-lg bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/40 text-[10px] font-bold hover:bg-[#00E5FF]/30 cursor-pointer"
                    >
                      Set
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* ═══ TEST CARDS ═══ */}
      <FadeIn delay={0.06}>
        {loading ? (
          <div className="py-20 text-center text-xs text-[#94A3B8]">Loading test schedule...</div>
        ) : tests.length === 0 ? (
          <GlassCard variant="solid" radius={24} hover={false} noHover className="!p-16 text-center border border-[rgba(255,255,255,0.12)]" style={{ background: '#000000' }}>
            <Calendar size={48} className="mx-auto text-[#64748B] opacity-40 mb-3" />
            <h3 className="font-[family-name:var(--font-display)] font-bold text-lg text-[#FFFFFF]">
              No tests scheduled
            </h3>
            <p className="font-[family-name:var(--font-body)] text-xs text-[#94A3B8] mt-1 max-w-md mx-auto">
              Run the batch migration to create 8 tests across 4 weeks.
            </p>
          </GlassCard>
        ) : (
          <div className="space-y-4">
            {/* Group by week (dynamically filtered by cycle) */}
            {(() => {
              const filteredTests = selectedCycle === 'all'
                ? tests
                : tests.filter(t => (t.cycle || Math.floor((t.testNumber - 1) / 8) + 1) === selectedCycle);
              const uniqueWeeks = Array.from(new Set(filteredTests.map(t => t.week))).sort((a, b) => a - b);

              if (filteredTests.length === 0) {
                return (
                  <div className="py-12 text-center text-xs text-[#94A3B8]">
                    No tests scheduled for the selected cycle.
                  </div>
                );
              }

              return uniqueWeeks.map(weekNum => {
                const weekTests = filteredTests.filter(t => t.week === weekNum);
                if (weekTests.length === 0) return null;

                return (
                  <div key={weekNum} className="space-y-3">
                    {/* Week Header */}
                    <div className="flex items-center gap-3 pt-2">
                      <span className="font-[family-name:var(--font-heading)] text-xs font-bold tracking-widest text-[#FFD700] uppercase">
                        📅 {getWeekLabel(weekNum)}
                      </span>
                      <div className="flex-1 h-[1px] bg-gradient-to-r from-[#FFD70040] to-transparent" />
                      <span className="font-[family-name:var(--font-mono)] text-[10px] text-[#94A3B8]">
                        {weekTests.length} tests • {weekTests.length * 4} batches • {weekTests.length * 200} questions
                      </span>
                    </div>

                    {weekTests.map(test => {
                      const sc = getStatusColor(test.status);
                      const isExpanded = expandedTest === test.testNumber;
                      const isLoading = actionLoading === test.testNumber;
                      const isEditingDur = editingDuration === test.testNumber;
                      const cycleNum = test.cycle || Math.floor((test.testNumber - 1) / 8) + 1;
                      const shift = cycleNum - 1;

                      return (
                        <div
                          key={test.testNumber}
                          className="rounded-2xl border transition-all overflow-hidden"
                          style={{
                            background: '#000000',
                            borderColor: test.status === 'live' ? '#10B98150' : 'rgba(255,255,255,0.1)',
                            boxShadow: test.status === 'live' ? '0 0 30px rgba(16,185,129,0.15)' : '0 4px 20px rgba(0,0,0,0.8)',
                          }}
                        >
                          {/* Test Card Header */}
                          <div className="p-5 flex flex-col md:flex-row items-start justify-between gap-4">
                            <div className="space-y-2.5 flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-[family-name:var(--font-mono)] font-bold text-xs px-2.5 py-0.5 rounded-full bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.2)] text-white">
                                  Test {test.testNumber}
                                </span>

                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-[family-name:var(--font-heading)] font-bold bg-[rgba(168,85,247,0.14)] border border-[rgba(168,85,247,0.3)] text-[#A855F7] uppercase">
                                  Cycle {cycleNum} (Shift +{shift})
                                </span>

                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-[family-name:var(--font-heading)] font-bold bg-[rgba(255,215,0,0.14)] border border-[rgba(255,215,0,0.3)] text-[#FFD700] uppercase">
                                  {getWeekLabel(test.week)} • Test {test.testInWeek}
                                </span>

                                <span
                                  className="px-2.5 py-0.5 rounded-full text-[10px] font-[family-name:var(--font-heading)] font-bold uppercase"
                                  style={{ background: sc.bg, borderColor: sc.border, color: sc.text, border: `1px solid ${sc.border}` }}
                                >
                                  {getStatusLabel(test.status)}
                                </span>

                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-[family-name:var(--font-heading)] font-bold bg-[rgba(0,229,255,0.14)] border border-[rgba(0,229,255,0.3)] text-[#00E5FF] uppercase">
                                  📝 4 × 50 = 200 Questions
                                </span>
                              </div>

                              <h2 className="font-[family-name:var(--font-display)] font-extrabold text-lg text-white">
                                {getWeekLabel(test.week)} — Test {test.testInWeek}
                              </h2>

                              <div className="flex flex-wrap gap-4 text-xs font-[family-name:var(--font-mono)]">
                                <span className="flex items-center gap-1 text-[#FFD700]">
                                  <Clock size={13} />
                                  Duration: {test.duration_minutes} Mins
                                </span>
                                <span className="flex items-center gap-1 text-[#94A3B8]">
                                  <Users size={13} />
                                  4 Sections (A, B, C, D)
                                </span>
                                <span className="flex items-center gap-1 text-[#A855F7]">
                                  <Layers size={13} />
                                  Batches: {test.sections.map(s => `#${s.batchNumber}`).join(', ')}
                                </span>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                              {/* Duration Edit */}
                              {isEditingDur ? (
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="number"
                                    value={durationValue}
                                    onChange={(e) => setDurationValue(Number(e.target.value))}
                                    className="w-16 px-2 py-1.5 rounded-lg bg-black border border-[#FFD700]/40 text-[#FFD700] text-xs font-bold font-[family-name:var(--font-mono)] text-center"
                                    min={10}
                                    max={180}
                                  />
                                  <button
                                    onClick={() => handleUpdateDuration(test.testNumber)}
                                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#FFD700]/20 border border-[#FFD700]/40 text-[#FFD700] hover:bg-[#FFD700]/30 transition-all cursor-pointer"
                                    disabled={isLoading}
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingDuration(null)}
                                    className="px-2 py-1.5 rounded-lg text-xs font-bold bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all cursor-pointer"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => { setEditingDuration(test.testNumber); setDurationValue(test.duration_minutes); }}
                                  className="px-3 py-2 rounded-xl text-xs font-bold font-[family-name:var(--font-heading)] bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all cursor-pointer flex items-center gap-1.5"
                                  title="Change test duration"
                                >
                                  <Settings size={13} />
                                  <span>Duration</span>
                                </button>
                              )}

                              {/* Enable / Disable Test */}
                              {test.status === 'live' ? (
                                <button
                                  onClick={() => handleAction('deactivate_test', test.testNumber)}
                                  disabled={isLoading}
                                  className="px-4 py-2 rounded-xl text-xs font-bold font-[family-name:var(--font-heading)] bg-amber-500/20 border border-amber-500/40 text-amber-400 hover:bg-amber-500/35 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                                >
                                  <Pause size={13} />
                                  <span>{isLoading ? 'Stopping...' : 'Disable Test'}</span>
                                </button>
                              ) : test.status === 'completed' ? (
                                <span className="px-4 py-2 rounded-xl text-xs font-bold font-[family-name:var(--font-heading)] bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 flex items-center gap-1.5">
                                  <CheckCircle2 size={13} />
                                  <span>Completed</span>
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleAction('activate_test', test.testNumber)}
                                  disabled={isLoading}
                                  className="px-4 py-2 rounded-xl text-xs font-bold font-[family-name:var(--font-heading)] bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/35 transition-all cursor-pointer flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.2)] disabled:opacity-50"
                                >
                                  <Play size={13} />
                                  <span>{isLoading ? 'Enabling...' : 'Enable Test'}</span>
                                </button>
                              )}

                              {/* Mark Complete */}
                              {test.status === 'live' && (
                                <button
                                  onClick={() => handleAction('complete_test', test.testNumber)}
                                  disabled={isLoading}
                                  className="px-3 py-2 rounded-xl text-xs font-bold font-[family-name:var(--font-heading)] bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 hover:bg-indigo-500/35 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                                >
                                  <CheckCircle2 size={13} />
                                  <span>Mark Complete</span>
                                </button>
                              )}

                              {/* Expand Details */}
                              <button
                                onClick={() => setExpandedTest(isExpanded ? null : test.testNumber)}
                                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all cursor-pointer"
                                title="View batch details"
                              >
                                {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                              </button>
                            </div>
                          </div>

                          {/* Expanded Section Details */}
                          {isExpanded && (
                            <div className="px-5 pb-5 pt-0">
                              <div className="h-[1px] w-full mb-4 bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.15)] to-transparent" />
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                {test.sections.map(sec => {
                                  const secColors: Record<string, string> = {
                                    A: '#00E5FF',
                                    B: '#A855F7',
                                    C: '#FFD700',
                                    D: '#F43F5E',
                                  };
                                  const color = secColors[sec.section] || '#94A3B8';

                                  return (
                                    <div
                                      key={sec.section}
                                      className="rounded-xl p-4 border transition-all"
                                      style={{
                                        background: `${color}08`,
                                        borderColor: `${color}30`,
                                      }}
                                    >
                                      <div className="flex items-center justify-between mb-2">
                                        <span className="font-[family-name:var(--font-display)] font-extrabold text-base" style={{ color }}>
                                          Section {sec.section}
                                        </span>
                                        <span
                                          className="px-2 py-0.5 rounded-full text-[9px] font-[family-name:var(--font-heading)] font-bold uppercase"
                                          style={{
                                            background: sec.status === 'live' ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)',
                                            color: sec.status === 'live' ? '#10B981' : '#94A3B8',
                                            border: `1px solid ${sec.status === 'live' ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.15)'}`,
                                          }}
                                        >
                                          {sec.status}
                                        </span>
                                      </div>

                                      <div className="space-y-1 text-xs font-[family-name:var(--font-mono)]">
                                        <div className="flex justify-between">
                                          <span className="text-[#94A3B8]">Batch</span>
                                          <span className="text-white font-bold">#{sec.batchNumber}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-[#94A3B8]">Questions</span>
                                          <span className="text-white font-bold">{sec.questionCount}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-[#94A3B8]">Round #</span>
                                          <span className="text-white font-bold">{sec.roundNumber}</span>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>

                              <div className="mt-3 p-3 rounded-xl bg-[rgba(0,229,255,0.06)] border border-[rgba(0,229,255,0.15)]">
                                <p className="text-[11px] text-[#94A3B8] font-[family-name:var(--font-body)] leading-relaxed">
                                  <span className="text-[#00E5FF] font-bold">🔒 Latin Square Rotation Guarantee:</span> 32 batches rotated across 4 cycles (16 weeks). Every section attempts all 32 batches exactly once across the 32 tests, with zero cross-section batch overlap on any test day.
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              });
            })()}
          </div>
        )}
      </FadeIn>
    </div>
  );
}
