'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase/client';
import GlassCard from '@/components/shared/GlassCard';
import GalaxyButton from '@/components/shared/GalaxyButton';
import FadeIn from '@/components/shared/FadeIn';
import HostControlPanel from '@/components/admin/HostControlPanel';
import StatusBadge from '@/components/admin/StatusBadge';
import { formatDateIST } from '@/lib/utils';
import {
  Users, Zap, Trophy, Activity, CheckCircle2,
  RefreshCw, ChevronRight, Eye, Settings2, ShieldCheck,
  Award, BarChart3, HelpCircle, Calendar, Users2, FileSpreadsheet,
  Layers, Printer, Sparkles, AlertCircle, ArrowUpRight, BookOpen
} from 'lucide-react';

const CountUp = dynamic(() => import('react-countup'), {
  ssr: false,
});

interface DashboardData {
  totalEnrolled: number;
  totalSubmissions: number;
  liveAttempts: number;
  avgScore: number;
  topScore: number;
  totalQuestions: number;
  masterQuestionsCount: number;
  activeRoundsCount: number;
  totalRoundsCount: number;
  liveRoundTitle: string;
  rounds: any[];
  recentSubmissions: any[];
  sectionStats: Record<string, { enrolled: number; assessed: number; avgScore: number; topScore: number }>;
}

export default function AdminDashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData>({
    totalEnrolled: 0,
    totalSubmissions: 0,
    liveAttempts: 0,
    avgScore: 0,
    topScore: 0,
    totalQuestions: 1600,
    masterQuestionsCount: 1600,
    activeRoundsCount: 0,
    totalRoundsCount: 129,
    liveRoundTitle: '',
    rounds: [],
    recentSubmissions: [],
    sectionStats: {
      A: { enrolled: 0, assessed: 0, avgScore: 0, topScore: 0 },
      B: { enrolled: 0, assessed: 0, avgScore: 0, topScore: 0 },
      C: { enrolled: 0, assessed: 0, avgScore: 0, topScore: 0 },
      D: { enrolled: 0, assessed: 0, avgScore: 0, topScore: 0 },
    },
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      // Execute consolidated parallel queries for maximum performance
      const [
        { data: profiles },
        { data: participants },
        { data: roundsData },
        { count: masterCount },
        { data: attemptsData },
      ] = await Promise.all([
        supabase.from('profiles').select('id, register_number, display_name, department, year').eq('role', 'participant'),
        supabase.from('participants').select('id, name, register_no, email, phone'),
        supabase.from('rounds').select('id, round_number, title, status, duration_minutes, started_at').order('round_number', { ascending: true }),
        supabase.from('master_questions').select('*', { count: 'exact', head: true }),
        supabase.from('attempts').select('id, participant_id, user_id, round_id, score, total_marks, status, started_at, submitted_at, rounds(title)'),
      ]);

      // Deduplicate enrolled students across profiles and participants
      const uniqueRegs = new Set<string>();
      (profiles || []).forEach((p) => {
        if (p.register_number) uniqueRegs.add(p.register_number.trim().toUpperCase());
      });
      (participants || []).forEach((p) => {
        if (p.register_no) uniqueRegs.add(p.register_no.trim().toUpperCase());
      });
      const totalEnrolled = Math.max(uniqueRegs.size, (profiles || []).length, (participants || []).length);

      // Rounds computation
      const rounds = roundsData || [];
      const liveRoundObj = rounds.find((r) => r.status === 'live');
      const activeRoundsCount = rounds.filter((r) => r.status === 'live').length;
      const liveRoundTitle = liveRoundObj ? liveRoundObj.title : '';

      // Attempts computation
      const attempts = attemptsData || [];
      const liveAttempts = attempts.filter((a) => a.status === 'in_progress').length;
      const submittedAttempts = attempts.filter((a) => a.status === 'submitted');
      const totalSubmissions = submittedAttempts.length;

      const scores = submittedAttempts.map((a) => a.score || 0);
      const topScore = scores.length > 0 ? Math.max(...scores) : 0;
      const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

      // Section distribution (A, B, C, D)
      const sectionStats: Record<string, { enrolled: number; assessed: number; avgScore: number; topScore: number }> = {
        A: { enrolled: 0, assessed: 0, avgScore: 0, topScore: 0 },
        B: { enrolled: 0, assessed: 0, avgScore: 0, topScore: 0 },
        C: { enrolled: 0, assessed: 0, avgScore: 0, topScore: 0 },
        D: { enrolled: 0, assessed: 0, avgScore: 0, topScore: 0 },
      };

      const sections = ['A', 'B', 'C', 'D'] as const;
      sections.forEach((sec) => {
        const secAttempts = submittedAttempts.filter((a) => {
          const rnd = (Array.isArray(a.rounds) ? a.rounds[0] : a.rounds) as any;
          const t = rnd?.title?.toUpperCase() || '';
          return t.includes(`SECTION ${sec}`) || t.includes(`SEC ${sec}`);
        });
        const secScores = secAttempts.map((a) => a.score || 0);
        sectionStats[sec] = {
          enrolled: Math.floor(totalEnrolled / 4),
          assessed: secAttempts.length,
          avgScore: secScores.length > 0 ? Math.round(secScores.reduce((a, b) => a + b, 0) / secScores.length) : 0,
          topScore: secScores.length > 0 ? Math.max(...secScores) : 0,
        };
      });

      // Recent submissions
      const recent = submittedAttempts
        .slice(0, 6)
        .map((a) => {
          const rnd = (Array.isArray(a.rounds) ? a.rounds[0] : a.rounds) as any;
          const timeTaken = a.started_at && a.submitted_at
            ? Math.max(0, Math.round((new Date(a.submitted_at).getTime() - new Date(a.started_at).getTime()) / 1000))
            : null;

          return {
            id: a.id,
            score: a.score || 0,
            totalMarks: a.total_marks || 100,
            roundTitle: rnd?.title || 'Department Test',
            submittedAt: a.submitted_at,
            timeTaken,
          };
        });

      setData({
        totalEnrolled,
        totalSubmissions,
        liveAttempts,
        avgScore,
        topScore,
        totalQuestions: masterCount || 1600,
        masterQuestionsCount: masterCount || 1600,
        activeRoundsCount,
        totalRoundsCount: rounds.length,
        liveRoundTitle,
        rounds,
        recentSubmissions: recent,
        sectionStats,
      });
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const cleanShadow = '0 4px 20px rgba(0,0,0,0.8)';

  // Core KPI instrumentation gauges
  const kpis = [
    {
      label: 'Enrolled Undergraduates',
      value: data.totalEnrolled,
      icon: Users,
      color: '#00B0FF',
      sublabel: 'Across Sections A, B, C, D',
    },
    {
      label: 'Master Questions Bank',
      value: data.masterQuestionsCount,
      icon: BookOpen,
      color: '#00E676',
      sublabel: '16 Subjects × 100 Qs ✅',
      suffix: ' Qs',
    },
    {
      label: '32-Batch Scheduling',
      value: 32,
      icon: Calendar,
      color: '#FFD700',
      sublabel: '16 Weeks · 4 Latin Cycles',
      suffix: ' Batches',
    },
    {
      label: 'Tests Assessed',
      value: data.totalSubmissions,
      icon: CheckCircle2,
      color: '#00B0FF',
      sublabel: `${data.liveAttempts} in progress`,
    },
    {
      label: 'Department Benchmark',
      value: data.avgScore,
      icon: BarChart3,
      color: '#9C27B0',
      sublabel: 'Average Score',
      suffix: ' pts',
    },
    {
      label: 'Department Top Score',
      value: data.topScore,
      icon: Trophy,
      color: '#FF9100',
      sublabel: 'Highest Achievement',
      suffix: ' pts',
    },
  ];

  // The 6 Core Operational Modules of the Updated Portal
  const coreModules = [
    {
      title: 'Questions Bank (1,600 Qs)',
      description: '16 Canonical ECE Subjects with 100/100 verified questions each, search, pagination, and bulk excel uploader.',
      href: '/admin/questions',
      icon: HelpCircle,
      badge: '100/100 Qs per Subject',
      badgeColor: 'border-[#00E676]/40 text-[#00E676] bg-[#00E676]/10',
      actionText: 'Manage Question Bank',
    },
    {
      title: '32-Batch Scheduling Engine',
      description: '16 Weeks, 4 Cycles, 128 Rounds with Latin Square zero-overlap rotation and real-time Sample Demo Test timer controls.',
      href: '/admin/scheduling',
      icon: Calendar,
      badge: '32 Batches · 4 Sections',
      badgeColor: 'border-[#FFD700]/40 text-[#FFD700] bg-[#FFD700]/10',
      actionText: 'Configure Scheduling',
    },
    {
      title: 'Attendance & Section Reports 📋',
      description: 'Section A, B, C, D live attendance matrix, absence tracker, batch cards, and multi-tab Excel export.',
      href: '/admin/participants',
      icon: Users2,
      badge: 'Live Attendance Engine',
      badgeColor: 'border-[#00B0FF]/40 text-[#00B0FF] bg-[#00B0FF]/10',
      actionText: 'View Attendance Sheet',
    },
    {
      title: 'Rank Holders & Offline Honors 🏆',
      description: 'Comparative cross-section undergraduate rankings, Top 3 Podium (Gold, Silver, Bronze), and printable offline A4 certificates.',
      href: '/admin/certificates',
      icon: Award,
      badge: 'Printable Offline Honors',
      badgeColor: 'border-[#FFD700]/40 text-[#FFD700] bg-[#FFD700]/10',
      actionText: 'View Rank Holders',
    },
    {
      title: 'Faculty & Dept Analytics 📊',
      description: '16-Subject diagnostic proficiency, remedial student detection, section KPI comparisons, and monthly CSV downloads.',
      href: '/admin/analytics',
      icon: BarChart3,
      badge: 'Diagnostic & Remedial',
      badgeColor: 'border-[#9C27B0]/40 text-[#9C27B0] bg-[#9C27B0]/10',
      actionText: 'Open Analytics',
    },
    {
      title: 'Real-Time Leaderboard',
      description: 'Live test rankings and standing board with instant student portal visibility controls.',
      href: '/admin/leaderboard',
      icon: Trophy,
      badge: 'Live Standings',
      badgeColor: 'border-[#00B0FF]/40 text-[#00B0FF] bg-[#00B0FF]/10',
      actionText: 'Inspect Leaderboard',
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#000000', color: '#FFFFFF', position: 'relative', zIndex: 10 }}>
      <div className="p-6 md:p-10 space-y-8 max-w-7xl mx-auto">

        {/* ═══ HEADER & SYSTEM STATUS ═══ */}
        <FadeIn delay={0} y={-20}>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.2)] w-fit mb-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00E676] animate-pulse" />
                <span className="font-[family-name:var(--font-heading)] text-[11px] font-semibold tracking-widest text-[#FFFFFF] uppercase">
                  CENTRAL MISSION CONTROL · ECE DEPARTMENT
                </span>
              </div>
              <h1 className="font-[family-name:var(--font-display)] font-extrabold text-3xl md:text-5xl text-[#FFFFFF] tracking-tight">
                Admin Dashboard
              </h1>
              <p className="font-[family-name:var(--font-body)] text-xs md:text-sm text-[#94A3B8] mt-1.5 font-light max-w-3xl leading-relaxed">
                Centralized management for the 1,600 Master Question Bank, 32-Batch Scheduling Engine, Section Attendance Sheets, and Offline Honors Certificates.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/admin/scheduling">
                <GalaxyButton variant="secondary" size="sm">
                  <Calendar size={14} /> Scheduling 📅
                </GalaxyButton>
              </Link>
              <Link href="/admin/participants">
                <GalaxyButton variant="primary" size="sm">
                  <Users2 size={14} /> Attendance 📋
                </GalaxyButton>
              </Link>
              <button
                onClick={fetchDashboardData}
                className="p-2 rounded-xl bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.12)] border border-[rgba(255,255,255,0.15)] text-[#E2E8F0] transition-colors"
                title="Refresh Metrics"
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          <div className="h-[1px] w-full mt-6 bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.2)] to-transparent" />
        </FadeIn>

        {/* ═══ ACTIVE TEST / DEMO TEST CONTROLS ═══ */}
        <FadeIn delay={0.05}>
          <HostControlPanel
            hasLiveRound={data.activeRoundsCount > 0}
            liveRoundTitle={data.liveRoundTitle}
            rounds={data.rounds}
            onRefreshData={fetchDashboardData}
          />
        </FadeIn>

        {/* ═══ REAL CORE KPIS ═══ */}
        <FadeIn delay={0.1}>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {kpis.map((kpi, idx) => (
              <GlassCard
                key={idx}
                variant="elevated"
                hover={false}
                noHover
                className="!p-5 border border-[rgba(255,255,255,0.12)] flex flex-col justify-between"
                style={{ boxShadow: cleanShadow, background: '#000000' }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
                  >
                    <kpi.icon size={16} style={{ color: kpi.color }} />
                  </div>
                </div>

                <div>
                  <div className="font-[family-name:var(--font-mono)] font-bold text-2xl md:text-3xl text-[#FFFFFF] leading-none">
                    {mounted ? (
                      <CountUp end={kpi.value} duration={1.5} separator="," />
                    ) : (
                      kpi.value
                    )}
                    {kpi.suffix && <span className="text-sm font-normal text-[#94A3B8]">{kpi.suffix}</span>}
                  </div>
                  <div className="font-[family-name:var(--font-heading)] font-semibold text-xs text-[#FFFFFF] mt-2 truncate">
                    {kpi.label}
                  </div>
                  <div className="font-[family-name:var(--font-body)] text-[10px] text-[#94A3B8] mt-0.5 truncate font-light">
                    {kpi.sublabel}
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </FadeIn>

        {/* ═══ CORE OPERATIONAL MODULES (THE 6 PILLARS OF PORTIZ) ═══ */}
        <FadeIn delay={0.15}>
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-[family-name:var(--font-display)] font-bold text-xl text-[#FFFFFF]">
                  Core Operational Portals & Engines
                </h2>
                <p className="font-[family-name:var(--font-body)] text-xs text-[#94A3B8] font-light mt-0.5">
                  Direct navigation and management of the updated system components
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {coreModules.map((mod, i) => (
                <Link key={i} href={mod.href} className="group block">
                  <GlassCard
                    variant="elevated"
                    radius={22}
                    hover={false}
                    noHover
                    className="!p-6 border border-[rgba(255,255,255,0.12)] group-hover:border-[rgba(255,255,255,0.3)] transition-all flex flex-col justify-between h-full"
                    style={{ boxShadow: cleanShadow, background: '#000000' }}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="w-10 h-10 rounded-2xl bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.15)] flex items-center justify-center group-hover:scale-105 transition-transform">
                          <mod.icon size={20} className="text-[#FFFFFF]" />
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-[family-name:var(--font-heading)] border uppercase ${mod.badgeColor}`}>
                          {mod.badge}
                        </span>
                      </div>

                      <h3 className="font-[family-name:var(--font-display)] font-extrabold text-lg text-[#FFFFFF] group-hover:text-[#00B0FF] transition-colors">
                        {mod.title}
                      </h3>
                      <p className="font-[family-name:var(--font-body)] text-xs text-[#94A3B8] font-light mt-1.5 leading-relaxed">
                        {mod.description}
                      </p>
                    </div>

                    <div className="pt-4 mt-4 border-t border-[rgba(255,255,255,0.08)] flex items-center justify-between text-xs font-[family-name:var(--font-heading)] font-semibold text-[#E2E8F0] group-hover:text-[#FFFFFF]">
                      <span>{mod.actionText}</span>
                      <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform text-[#64748B] group-hover:text-[#FFFFFF]" />
                    </div>
                  </GlassCard>
                </Link>
              ))}
            </div>
          </div>
        </FadeIn>

        {/* ═══ SECTION HEALTH MATRIX (SECTIONS A, B, C, D) ═══ */}
        <FadeIn delay={0.2}>
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Layers size={18} className="text-[#00B0FF]" />
              <h2 className="font-[family-name:var(--font-display)] font-bold text-lg text-[#FFFFFF]">
                Section Performance & Attendance Matrix (Latin Rotation)
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {(['A', 'B', 'C', 'D'] as const).map((sec) => {
                const s = data.sectionStats[sec] || { enrolled: 0, assessed: 0, avgScore: 0, topScore: 0 };
                return (
                  <GlassCard
                    key={sec}
                    variant="solid"
                    radius={20}
                    hover={false}
                    noHover
                    className="!p-5 border border-[rgba(255,255,255,0.1)]"
                    style={{ background: '#000000', boxShadow: cleanShadow }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-[family-name:var(--font-display)] font-extrabold text-base text-[#FFFFFF]">
                        Section {sec}
                      </span>
                      <span className="text-[10px] font-bold font-[family-name:var(--font-mono)] px-2 py-0.5 rounded bg-[rgba(255,255,255,0.06)] text-[#00B0FF] border border-[#00B0FF]/20">
                        {s.assessed} Assessed
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs text-[#94A3B8] font-[family-name:var(--font-heading)]">Average Marks:</span>
                        <span className="font-[family-name:var(--font-mono)] font-bold text-lg text-[#FFFFFF]">
                          {s.avgScore} <span className="text-xs text-[#64748B]">pts</span>
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between text-xs font-[family-name:var(--font-mono)] text-[#94A3B8]">
                        <span>Top Score:</span>
                        <span className="text-[#00E676] font-semibold">{s.topScore} pts</span>
                      </div>
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          </div>
        </FadeIn>

        {/* ═══ RECENT DEPARTMENT TEST ACTIVITY ═══ */}
        <FadeIn delay={0.25}>
          <GlassCard
            variant="solid"
            radius={24}
            hover={false}
            noHover
            className="!p-0 border border-[rgba(255,255,255,0.12)] overflow-hidden"
            style={{ boxShadow: cleanShadow, background: '#000000' }}
          >
            <div className="p-4 md:p-5 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between">
              <div>
                <h3 className="font-[family-name:var(--font-display)] font-bold text-base text-[#FFFFFF]">
                  Live Test Submissions & Department Activity
                </h3>
                <p className="font-[family-name:var(--font-body)] text-xs text-[#94A3B8] font-light">
                  Real-time participant completions from active assessment sessions
                </p>
              </div>

              <Link href="/admin/certificates" className="text-xs font-[family-name:var(--font-heading)] text-[#00B0FF] hover:underline flex items-center gap-1">
                View Rank List <ChevronRight size={12} />
              </Link>
            </div>

            <div className="p-4">
              {data.recentSubmissions.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full mx-auto flex items-center justify-center bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.1)]">
                    <Activity size={18} className="text-[#64748B]" />
                  </div>
                  <p className="font-[family-name:var(--font-body)] text-xs text-[#94A3B8] font-light">
                    No test submissions recorded yet. Awaiting student participation in active rounds.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-[rgba(255,255,255,0.04)]">
                  {data.recentSubmissions.map((sub) => (
                    <div key={sub.id} className="py-3 flex items-center justify-between gap-4">
                      <div>
                        <div className="font-[family-name:var(--font-body)] font-semibold text-xs text-[#FFFFFF]">
                          {sub.roundTitle}
                        </div>
                        <div className="text-[10px] font-[family-name:var(--font-mono)] text-[#64748B]">
                          {sub.submittedAt ? formatDateIST(sub.submittedAt) : 'Recently'}
                          {sub.timeTaken ? ` · ⏱️ ${Math.floor(sub.timeTaken / 60)}m ${sub.timeTaken % 60}s` : ''}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-[family-name:var(--font-mono)] font-bold text-xs text-[#00E676]">
                          {sub.score} / {sub.totalMarks} pts
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </GlassCard>
        </FadeIn>

      </div>
    </div>
  );
}
