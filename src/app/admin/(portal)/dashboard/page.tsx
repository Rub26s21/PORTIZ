'use client';

/*
  DEVELOPER DEBUG CHECKLIST:
  1. Run: npm install recharts react-countup xlsx
  2. Check browser console for red errors
  3. Check Network tab — are any imports 404?
  4. Verify globals.css is loading (check Sources tab)
  5. If still blank: open DevTools → Console → look for:
     - "Cannot find module 'recharts'" → run npm install
     - "CSS variable undefined" → check globals.css aliases
     - "useEffect is not a function" → missing 'use client'
     - "Objects are not valid as a React child" → data error
*/

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase/client';
import GlassCard from '@/components/shared/GlassCard';
import GalaxyButton from '@/components/shared/GalaxyButton';
import FadeIn from '@/components/shared/FadeIn';
import StatusBadge from '@/components/admin/StatusBadge';
import HostControlPanel from '@/components/admin/HostControlPanel';
import GalaxyTooltip from '@/components/admin/charts/GalaxyTooltip';
import { formatDateIST, getInitials } from '@/lib/utils';
import {
  AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar,
  RadialBarChart, RadialBar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';

import {
  Users, Zap, Trophy, Activity, CheckCircle2, ShieldOff,
  RefreshCw, ChevronRight, Eye, Settings2, ShieldCheck,
  Award, BarChart3, Command, Play, StopCircle, Star, Megaphone,
  Globe, ExternalLink, GraduationCap, Wifi, FileCheck, Pencil
} from 'lucide-react';

const CountUp = dynamic(() => import('react-countup'), {
  ssr: false,
});

interface RoundItem {
  id: string;
  round_number: number;
  title: string;
  status: string;
  start_time: string;
  duration_minutes: number;
  participants_count?: number;
  questions_count?: number;
}

interface ActivityItem {
  id: string;
  type: 'registration' | 'submission' | 'disqualified' | 'start' | 'close' | 'default';
  title: string;
  subtitle: string;
  timestamp: string;
}

interface ParticipantItem {
  id: string;
  display_name: string;
  register_number: string;
  department: string;
  year: string;
  created_at: string;
}

export default function AdminDashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState({
    totalParticipants: 0,
    activeRounds: 0,
    totalRounds: 0,
    liveAttempts: 0,
    totalSubmissions: 0,
    totalDisqualified: 0,
  });

  const [rounds, setRounds] = useState<RoundItem[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [latestParticipants, setLatestParticipants] = useState<ParticipantItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<'1H' | '6H' | '24H'>('24H');
  const [liveRoundTitle, setLiveRoundTitle] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchDashboardData = useCallback(async () => {
    try {
      // 1. Fetch total participants count
      const { count: partCount } = await supabase
        .from('participants')
        .select('*', { count: 'exact', head: true });

      // 2. Fetch rounds data
      const { data: roundsData } = await supabase
        .from('rounds')
        .select('id, round_number, title, status, start_time, duration_minutes')
        .order('round_number', { ascending: true });

      const activeRoundsCount = (roundsData || []).filter((r) => r.status === 'live').length;
      const liveRoundObj = (roundsData || []).find((r) => r.status === 'live');
      setLiveRoundTitle(liveRoundObj ? liveRoundObj.title : '');

      // Enrich rounds with participants & questions count
      const enrichedRounds: RoundItem[] = await Promise.all(
        (roundsData || []).map(async (r) => {
          const { count: pCount } = await supabase
            .from('attempts')
            .select('*', { count: 'exact', head: true })
            .eq('round_id', r.id);

          const { count: qCount } = await supabase
            .from('questions')
            .select('*', { count: 'exact', head: true })
            .eq('round_id', r.id);

          return {
            ...r,
            participants_count: pCount || 0,
            questions_count: qCount || 0,
          };
        })
      );
      setRounds(enrichedRounds);

      // 3. Fetch attempts statistics
      const { count: liveAttemptsCount } = await supabase
        .from('attempts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'in_progress');

      const { count: submissionsCount } = await supabase
        .from('attempts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'submitted');

      const { count: dqCount } = await supabase
        .from('attempts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'disqualified');

      setStats({
        totalParticipants: partCount || 0,
        activeRounds: activeRoundsCount,
        totalRounds: (roundsData || []).length,
        liveAttempts: liveAttemptsCount || 0,
        totalSubmissions: submissionsCount || 0,
        totalDisqualified: dqCount || 0,
      });

      // 4. Fetch latest participants (last 6)
      const { data: partData } = await supabase
        .from('profiles')
        .select('id, display_name, register_number, department, year, created_at')
        .order('created_at', { ascending: false })
        .limit(6);

      if (partData) setLatestParticipants(partData);

      // Recent activities
      const { data: recentAttempts } = await supabase
        .from('attempts')
        .select('id, status, created_at, profiles(display_name), rounds(title)')
        .order('created_at', { ascending: false })
        .limit(8);

      const activityList: ActivityItem[] = [];
      (recentAttempts || []).forEach((att: any) => {
        const name = att.profiles?.display_name || 'Participant';
        const rTitle = att.rounds?.title || 'Round';
        if (att.status === 'submitted') {
          activityList.push({
            id: att.id,
            type: 'submission',
            title: `${name} submitted ${rTitle}`,
            subtitle: 'Attempt recorded successfully',
            timestamp: att.created_at,
          });
        } else if (att.status === 'disqualified') {
          activityList.push({
            id: att.id,
            type: 'disqualified',
            title: `${name} disqualified in ${rTitle}`,
            subtitle: 'Proctor violation flag triggered',
            timestamp: att.created_at,
          });
        } else {
          activityList.push({
            id: att.id,
            type: 'start',
            title: `${name} started ${rTitle}`,
            subtitle: 'Exam session initiated',
            timestamp: att.created_at,
          });
        }
      });

      setActivities(activityList);
    } catch (err) {
      console.error('fetchDashboardData error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Clean shadow helper
  const cleanShadow = '0 4px 20px rgba(0,0,0,0.8)';

  // Sparkline data generator for KPI card backgrounds
  const sparklineData = (val: number) => [
    { val: Math.max(2, (val || 0) * 0.3) },
    { val: Math.max(5, (val || 0) * 0.5) },
    { val: Math.max(3, (val || 0) * 0.4) },
    { val: Math.max(8, (val || 0) * 0.8) },
    { val: Math.max(6, (val || 0) * 0.6) },
    { val: Math.max(12, (val || 0) * 1.1) },
    { val: Math.max(10, val || 0) },
  ];

  // 6 KPI Instrument Gauges Definition (PURE WHITE TEXT)
  const kpiInstruments = [
    {
      label: 'Total Participants',
      value: stats.totalParticipants ?? 0,
      icon: Users,
      color: '#0066FF',
      trend: '+12%',
    },
    {
      label: 'Active Rounds',
      value: stats.activeRounds ?? 0,
      icon: Zap,
      color: '#00B0FF',
      isPulse: (stats.activeRounds ?? 0) > 0,
      trend: (stats.activeRounds ?? 0) > 0 ? 'LIVE' : 'STANDBY',
    },
    {
      label: 'Total Rounds',
      value: stats.totalRounds ?? 0,
      icon: Trophy,
      color: '#FF6D00',
    },
    {
      label: 'Live Attempts',
      value: stats.liveAttempts ?? 0,
      icon: Activity,
      color: '#2979FF',
      isPulse: (stats.liveAttempts ?? 0) > 0,
      trend: 'ACTIVE',
    },
    {
      label: 'Submissions',
      value: stats.totalSubmissions ?? 0,
      icon: CheckCircle2,
      color: '#00B0FF',
    },
    {
      label: 'Disqualified',
      value: stats.totalDisqualified ?? 0,
      icon: ShieldOff,
      color: '#FF0033',
      highlightBorder: (stats.totalDisqualified ?? 0) > 0,
      trend: (stats.totalDisqualified ?? 0) > 0 ? 'FLAGGED' : 'CLEAN',
    },
  ];

  // Timeline chart synthetic data
  const timelineData = [
    { time: '00:00', attempts: 12, submissions: 8 },
    { time: '02:00', attempts: 18, submissions: 14 },
    { time: '04:00', attempts: 8,  submissions: 5 },
    { time: '06:00', attempts: 15, submissions: 10 },
    { time: '08:00', attempts: 35, submissions: 28 },
    { time: '10:00', attempts: 68, submissions: 52 },
    { time: '12:00', attempts: 120, submissions: 95 },
    { time: '14:00', attempts: 145, submissions: 118 },
    { time: '16:00', attempts: 110, submissions: 92 },
    { time: '18:00', attempts: 160, submissions: 135 },
    { time: '20:00', attempts: 190, submissions: 165 },
    { time: '22:00', attempts: 95,  submissions: 78 },
  ];

  // Donut chart data
  const notStarted = Math.max(0, (stats.totalParticipants ?? 0) - ((stats.totalSubmissions ?? 0) + (stats.liveAttempts ?? 0)));
  const donutData = [
    { name: 'In Progress', value: stats.liveAttempts || 1, color: '#0066FF' },
    { name: 'Submitted', value: stats.totalSubmissions || 1, color: '#00B0FF' },
    { name: 'Disqualified', value: stats.totalDisqualified || 0, color: '#FF0033' },
    { name: 'Not Started', value: notStarted, color: '#2A3555' },
  ];

  // Round Performance bar chart data
  const roundBarData = (rounds && rounds.length > 0 ? rounds : [
    { title: 'Round 1', participants_count: 140, questions_count: 120 },
    { title: 'Round 2', participants_count: 85, questions_count: 70 },
    { title: 'Finals', participants_count: 30, questions_count: 28 },
  ]).map((r) => ({
    name: r.title || 'Round',
    participants: r.participants_count || 20,
    submissions: Math.floor((r.participants_count || 20) * 0.85),
  }));

  // Completion Radial Bar data
  const completionRate = (stats.totalParticipants ?? 0) > 0
    ? Math.round(((stats.totalSubmissions ?? 0) / (stats.totalParticipants ?? 1)) * 100)
    : 85;

  const radialData = [
    { name: 'Completed', value: completionRate, fill: '#00B0FF' },
    { name: 'Active', value: 35, fill: '#0066FF' },
    { name: 'DQ Rate', value: 8, fill: '#FF0033' },
  ];

  const getDeptGradient = (dept: string) => {
    switch ((dept || '').toUpperCase()) {
      case 'ECE': return 'linear-gradient(135deg, #1565C0, #0066FF)';
      case 'EEE': return 'linear-gradient(135deg, #0277BD, #00B0FF)';
      case 'CSE': return 'linear-gradient(135deg, #B71C1C, #FF0033)';
      case 'MECH': return 'linear-gradient(135deg, #E65100, #FF6D00)';
      default: return 'linear-gradient(135deg, #1A2340, #2A3555)';
    }
  };

  const getDotColor = (type: string) => {
    switch (type) {
      case 'registration': return '#0066FF';
      case 'submission': return '#00B0FF';
      case 'disqualified': return '#FF0033';
      case 'start': return '#2979FF';
      default: return '#2A3555';
    }
  };

  // Shimmer skeleton box for unmounted charts
  const ChartSkeleton = () => (
    <div
      style={{
        width: '100%',
        height: '100%',
        borderRadius: '12px',
        background: 'linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03) 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
      }}
    />
  );

  return (
    <div style={{ minHeight: '100vh', background: '#000000', color: '#FFFFFF', position: 'relative', zIndex: 10 }}>
      <div className="p-8 md:p-10 space-y-8 max-w-[1600px] mx-auto">

        {/* ═══ SECTION A — PAGE HEADER ═══ */}
        <FadeIn delay={0} y={-20}>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.2)] w-fit">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FFFFFF]" />
                <span className="font-[family-name:var(--font-heading)] text-[11px] font-medium tracking-[0.18em] text-[#FFFFFF] uppercase">
                  MISSION CONTROL ✦
                </span>
              </div>

              <h1 className="font-[family-name:var(--font-display)] font-extrabold text-[clamp(2rem,5vw,3rem)] leading-none mt-2 text-[#FFFFFF]">
                Admin Dashboard
              </h1>
              <p className="font-[family-name:var(--font-body)] text-sm text-[#94A3B8] mt-2 font-light">
                Electronic Club Quiz Portal · Full competition management
              </p>
            </div>
          </div>

          <div
            className="h-[1px] w-full mt-6"
            style={{
              background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.3) 30%, rgba(255,255,255,0.15) 70%, transparent)',
            }}
          />
        </FadeIn>

        {/* ═══ SECTION B — HOST CONTROL PANEL ═══ */}
        <FadeIn delay={0.06}>
          <HostControlPanel
            hasLiveRound={(stats.activeRounds ?? 0) > 0}
            liveRoundTitle={liveRoundTitle}
            rounds={rounds}
            onRefreshData={fetchDashboardData}
          />
        </FadeIn>

        {/* ═══ SECTION C — KPI INSTRUMENT GAUGES (PURE WHITE NUMBERS) ═══ */}
        <FadeIn delay={0.12}>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-5">
            {kpiInstruments.map((inst, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.02, y: -2, boxShadow: '0 6px 20px rgba(0,0,0,0.8)' }}
                transition={{ duration: 0.2 }}
                className="relative"
              >
                <GlassCard
                  variant="elevated"
                  hover={false}
                  noHover
                  className={`!p-6 rounded-[24px] relative overflow-hidden flex flex-col justify-between h-full ${
                    inst.highlightBorder ? '!border-[rgba(255,0,51,0.35)]' : 'border border-[rgba(255,255,255,0.12)]'
                  }`}
                  style={{
                    boxShadow: cleanShadow,
                    background: '#000000',
                  }}
                >
                  <div className="relative z-10 flex flex-col justify-between h-full space-y-2">
                    <div className="flex items-center justify-between">
                      <div
                        className="w-9 h-9 rounded-[14px] flex items-center justify-center flex-shrink-0"
                        style={{
                          background: 'rgba(255,255,255,0.08)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                        }}
                      >
                        <inst.icon size={18} style={{ color: '#FFFFFF' }} />
                      </div>

                      {inst.trend && (
                        <span
                          className="px-2 py-0.5 rounded-full font-[family-name:var(--font-mono)] text-[10px] font-semibold"
                          style={{
                            background: 'rgba(255,255,255,0.1)',
                            color: '#FFFFFF',
                            border: '1px solid rgba(255,255,255,0.2)',
                          }}
                        >
                          {inst.trend}
                        </span>
                      )}
                    </div>

                    <div>
                      <div className="font-[family-name:var(--font-mono)] font-bold text-[clamp(2rem,2.8vw,2.6rem)] leading-none tracking-tight text-[#FFFFFF]">
                        {mounted ? (
                          <CountUp end={inst.value} duration={2.2} separator="," />
                        ) : (
                          <span>{inst.value}</span>
                        )}
                      </div>

                      <div className="font-[family-name:var(--font-heading)] font-normal text-[11px] tracking-[0.12em] uppercase text-[#94A3B8] mt-1.5">
                        {inst.label}
                      </div>
                    </div>

                    {/* Mini Sparkline Chart */}
                    <div className="h-10 -mx-6 -mb-6 mt-2 opacity-60">
                      {!mounted ? (
                        <ChartSkeleton />
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={sparklineData(inst.value)} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                            <Area
                              type="monotone"
                              dataKey="val"
                              stroke={inst.color}
                              strokeWidth={1.5}
                              fill={`${inst.color}15`}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>

                  <div
                    className="absolute bottom-0 left-0 right-0 h-[2px] opacity-50"
                    style={{
                      background: `linear-gradient(to right, transparent 0%, ${inst.color} 40%, ${inst.color} 60%, transparent 100%)`,
                    }}
                  />
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </FadeIn>

        {/* ═══ SECTION D — CHARTS ROW 1 (8 COL + 4 COL) ═══ */}
        <FadeIn delay={0.18}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

            {/* D1: SUBMISSION TIMELINE */}
            <div className="lg:col-span-8">
              <GlassCard
                variant="elevated"
                radius={28}
                hover={false}
                noHover
                className="!p-7 border border-[rgba(255,255,255,0.12)] h-[380px] flex flex-col justify-between relative overflow-hidden"
                style={{ boxShadow: cleanShadow, background: '#000000' }}
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <h3 className="font-[family-name:var(--font-display)] font-bold text-lg text-[#FFFFFF]">
                      Submission Activity
                    </h3>
                    <p className="font-[family-name:var(--font-body)] text-xs text-[#94A3B8] font-light mt-0.5">
                      Attempts and submissions over time
                    </p>
                  </div>

                  <div className="flex items-center gap-1 bg-rgba(255,255,255,0.06) p-1 rounded-full border border-rgba(255,255,255,0.12)">
                    {(['1H', '6H', '24H'] as const).map((filter) => {
                      const isActive = timeFilter === filter;
                      return (
                        <button
                          key={filter}
                          onClick={() => setTimeFilter(filter)}
                          className={`px-3 py-1 rounded-full font-[family-name:var(--font-heading)] text-xs transition-all cursor-pointer ${
                            isActive
                              ? 'bg-white text-black font-semibold'
                              : 'text-[#94A3B8] hover:text-white font-normal'
                          }`}
                        >
                          {filter}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="w-full h-[230px] my-auto">
                  {!mounted ? (
                    <ChartSkeleton />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={timelineData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="gradBlue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#0066FF" stopOpacity={0.35} />
                            <stop offset="100%" stopColor="#0066FF" stopOpacity={0.02} />
                          </linearGradient>
                          <linearGradient id="gradRed" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#FF0033" stopOpacity={0.25} />
                            <stop offset="100%" stopColor="#FF0033" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>

                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="time" stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} width={32} />
                        <Tooltip content={<GalaxyTooltip />} />

                        <Area
                          type="monotone"
                          dataKey="attempts"
                          name="Attempts"
                          stroke="#0066FF"
                          strokeWidth={2}
                          fill="url(#gradBlue)"
                          dot={false}
                          activeDot={{ r: 5, fill: '#0066FF', stroke: 'rgba(0,102,255,0.4)', strokeWidth: 4 }}
                        />
                        <Area
                          type="monotone"
                          dataKey="submissions"
                          name="Submissions"
                          stroke="#FF0033"
                          strokeWidth={2}
                          fill="url(#gradRed)"
                          dot={false}
                          activeDot={{ r: 4, fill: '#FF0033', stroke: 'rgba(255,0,51,0.4)', strokeWidth: 4 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>

                <div className="flex items-center justify-center gap-6 pt-2.5 border-t border-[rgba(255,255,255,0.06)] mt-auto">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-[2px] rounded-sm bg-[#0066FF]" />
                    <span className="font-[family-name:var(--font-body)] text-xs text-[#94A3B8] font-light">Attempts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-[2px] rounded-sm bg-[#FF0033]" />
                    <span className="font-[family-name:var(--font-body)] text-xs text-[#94A3B8] font-light">Submissions</span>
                  </div>
                </div>
              </GlassCard>
            </div>

            {/* D2: STATUS DONUT */}
            <div className="lg:col-span-4">
              <GlassCard
                variant="elevated"
                radius={28}
                hover={false}
                noHover
                className="!p-7 border border-[rgba(255,255,255,0.12)] h-[380px] flex flex-col justify-between relative overflow-hidden"
                style={{ boxShadow: cleanShadow, background: '#000000' }}
              >
                <div>
                  <h3 className="font-[family-name:var(--font-display)] font-bold text-lg text-[#FFFFFF]">
                    Status Breakdown
                  </h3>
                  <p className="font-[family-name:var(--font-body)] text-xs text-[#94A3B8] font-light mt-0.5">
                    Current attempt distribution
                  </p>
                </div>

                {/* Donut Chart with Stable Height (200px) */}
                <div className="relative w-full h-[200px] my-auto flex items-center justify-center">
                  {!mounted ? (
                    <ChartSkeleton />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={donutData}
                          cx="50%"
                          cy="50%"
                          innerRadius="54%"
                          outerRadius="76%"
                          paddingAngle={5}
                          dataKey="value"
                          stroke="none"
                        >
                          {donutData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<GalaxyTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}

                  {/* Center Text Overlay */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="font-[family-name:var(--font-mono)] font-bold text-2xl md:text-3xl text-[#FFFFFF]">
                      {mounted ? (
                        <CountUp end={stats.totalParticipants ?? 0} duration={2} />
                      ) : (
                        <span>{stats.totalParticipants ?? 0}</span>
                      )}
                    </span>
                    <span className="font-[family-name:var(--font-mono)] text-[10px] text-[#94A3B8] uppercase tracking-wider mt-0.5">
                      Total
                    </span>
                  </div>
                </div>

                {/* 2x2 Legend Grid Below */}
                <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-[rgba(255,255,255,0.06)] mt-auto">
                  {donutData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-[3px] flex-shrink-0"
                          style={{ background: item.color }}
                        />
                        <span className="font-[family-name:var(--font-body)] text-xs text-[#94A3B8] font-light truncate">
                          {item.name}
                        </span>
                      </div>
                      <span className="font-[family-name:var(--font-mono)] font-semibold text-xs ml-auto text-[#FFFFFF]">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>

          </div>
        </FadeIn>

        {/* ═══ SECTION E — CHARTS ROW 2 (5 COL + 3 COL + 4 COL) ═══ */}
        <FadeIn delay={0.24}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

            {/* E1: ROUND PERFORMANCE BAR */}
            <div className="lg:col-span-5">
              <GlassCard
                variant="elevated"
                radius={28}
                hover={false}
                noHover
                className="!p-7 border border-[rgba(255,255,255,0.12)] h-[360px] flex flex-col justify-between relative overflow-hidden"
                style={{ boxShadow: cleanShadow, background: '#000000' }}
              >
                <div className="mb-2">
                  <h3 className="font-[family-name:var(--font-display)] font-bold text-lg text-[#FFFFFF]">
                    Round Performance
                  </h3>
                  <p className="font-[family-name:var(--font-body)] text-xs text-[#94A3B8] font-light mt-0.5">
                    Participants per round
                  </p>
                </div>

                <div className="w-full h-[230px] my-auto">
                  {!mounted ? (
                    <ChartSkeleton />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={roundBarData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                        <defs>
                          <linearGradient id="barBlue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#1565C0" stopOpacity={1} />
                            <stop offset="100%" stopColor="#0066FF" stopOpacity={0.35} />
                          </linearGradient>
                          <linearGradient id="barRed" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#C62828" stopOpacity={1} />
                            <stop offset="100%" stopColor="#FF1744" stopOpacity={0.35} />
                          </linearGradient>
                        </defs>

                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="name" stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} width={32} />
                        <Tooltip content={<GalaxyTooltip />} />

                        <Bar dataKey="participants" name="Enrolled" fill="url(#barBlue)" radius={[5, 5, 0, 0]} maxBarSize={28} />
                        <Bar dataKey="submissions" name="Submissions" fill="url(#barRed)" radius={[5, 5, 0, 0]} maxBarSize={28} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </GlassCard>
            </div>

            {/* E2: COMPLETION RADIAL GAUGE */}
            <div className="lg:col-span-3">
              <GlassCard
                variant="elevated"
                radius={28}
                hover={false}
                noHover
                className="!p-7 border border-[rgba(255,255,255,0.12)] h-[360px] flex flex-col justify-between relative overflow-hidden"
                style={{ boxShadow: cleanShadow, background: '#000000' }}
              >
                <div className="mb-2">
                  <h3 className="font-[family-name:var(--font-display)] font-bold text-lg text-[#FFFFFF]">
                    Completion Rate
                  </h3>
                  <p className="font-[family-name:var(--font-body)] text-xs text-[#94A3B8] font-light mt-0.5">
                    Submitted vs total
                  </p>
                </div>

                <div className="relative w-full h-[220px] my-auto flex items-center justify-center">
                  {!mounted ? (
                    <ChartSkeleton />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <RadialBarChart
                        cx="50%"
                        cy="44%"
                        innerRadius="48%"
                        outerRadius="88%"
                        startAngle={210}
                        endAngle={-30}
                        barSize={10}
                        data={radialData}
                      >
                        <RadialBar
                          background={{ fill: 'rgba(255,255,255,0.04)' }}
                          dataKey="value"
                          cornerRadius={4}
                        />
                      </RadialBarChart>
                    </ResponsiveContainer>
                  )}

                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-6">
                    <span className="font-[family-name:var(--font-mono)] font-extrabold text-2xl md:text-3xl text-[#FFFFFF]">
                      {mounted ? (
                        <CountUp end={completionRate} suffix="%" duration={2.5} />
                      ) : (
                        <span>{completionRate}%</span>
                      )}
                    </span>
                    <span className="font-[family-name:var(--font-mono)] text-[10px] text-[#94A3B8] uppercase tracking-wider mt-0.5">
                      Completion
                    </span>
                  </div>
                </div>
              </GlassCard>
            </div>

            {/* E3: LIVE ACTIVITY FEED */}
            <div className="lg:col-span-4">
              <GlassCard
                variant="solid"
                radius={28}
                hover={false}
                noHover
                className="!p-0 border border-[rgba(255,255,255,0.12)] h-[360px] flex flex-col overflow-hidden"
                style={{ boxShadow: cleanShadow, background: '#000000' }}
              >
                <div className="p-4 px-5 flex items-center justify-between border-b border-[rgba(255,255,255,0.06)]">
                  <div>
                    <h3 className="font-[family-name:var(--font-display)] font-bold text-base text-[#FFFFFF]">
                      Live Activity
                    </h3>
                    <p className="font-[family-name:var(--font-body)] text-xs text-[#94A3B8] font-light">
                      Real-time events
                    </p>
                  </div>

                  <span
                    className="px-2.5 py-1 rounded-full text-[10px] font-[family-name:var(--font-heading)] font-bold uppercase text-[var(--red-core)] flex items-center gap-1.5"
                    style={{
                      background: 'rgba(255,0,51,0.16)',
                      border: '1px solid rgba(255,0,51,0.32)',
                    }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--red-core)]" /> LIVE
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1.5 no-scrollbar">
                  {(activities ?? []).length === 0 ? (
                    <div className="text-center py-12 text-[#94A3B8] font-[family-name:var(--font-body)] text-xs font-light">
                      No recent activity recorded.
                    </div>
                  ) : (
                    activities.map((act) => (
                      <div
                        key={act.id}
                        className="p-2.5 px-3 rounded-xl border border-transparent hover:bg-[rgba(255,255,255,0.03)] transition-all flex items-start gap-3"
                      >
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                          style={{
                            background: getDotColor(act.type),
                          }}
                        />

                        <div className="flex-1 min-w-0">
                          <p className="font-[family-name:var(--font-body)] text-xs text-[#FFFFFF] font-normal truncate">
                            {act.title}
                          </p>
                          <p className="font-[family-name:var(--font-body)] text-[11px] text-[#94A3B8] font-light truncate mt-0.5">
                            {act.subtitle}
                          </p>
                        </div>

                        <span className="font-[family-name:var(--font-mono)] text-[10px] text-[#64748B] flex-shrink-0">
                          {formatDateIST(act.timestamp).split(',')[1] || 'Just now'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </GlassCard>
            </div>

          </div>
        </FadeIn>

        {/* ═══ SECTION F — ROUNDS OVERVIEW TABLE ═══ */}
        <FadeIn delay={0.30}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-[family-name:var(--font-display)] font-bold text-xl text-[#FFFFFF]">
                  Rounds Overview
                </h2>
                <p className="font-[family-name:var(--font-body)] text-xs text-[#94A3B8] font-light mt-0.5">
                  {rounds?.length ?? 0} rounds total · {rounds?.filter(r => r.status === 'live').length ?? 0} live
                </p>
              </div>

              <Link href="/admin/rounds/create">
                <GalaxyButton variant="primary" size="sm">+ Create Round</GalaxyButton>
              </Link>
            </div>

            <GlassCard
              variant="solid"
              radius={26}
              hover={false}
              noHover
              className="!p-0 overflow-hidden border border-[rgba(255,255,255,0.12)]"
              style={{ boxShadow: cleanShadow, background: '#000000' }}
            >
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr
                      className="border-b border-[rgba(255,255,255,0.12)]"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                      }}
                    >
                      <th className="px-5 py-4 text-center font-[family-name:var(--font-heading)] font-medium text-[11px] tracking-[0.12em] uppercase text-[#FFFFFF] w-10">#</th>
                      <th className="px-5 py-4 text-left font-[family-name:var(--font-heading)] font-medium text-[11px] tracking-[0.12em] uppercase text-[#FFFFFF]">Round Name</th>
                      <th className="px-5 py-4 text-left font-[family-name:var(--font-heading)] font-medium text-[11px] tracking-[0.12em] uppercase text-[#FFFFFF]">Status</th>
                      <th className="px-5 py-4 text-left font-[family-name:var(--font-heading)] font-medium text-[11px] tracking-[0.12em] uppercase text-[#FFFFFF]">Start Time</th>
                      <th className="px-5 py-4 text-left font-[family-name:var(--font-heading)] font-medium text-[11px] tracking-[0.12em] uppercase text-[#FFFFFF]">Duration</th>
                      <th className="px-5 py-4 text-center font-[family-name:var(--font-heading)] font-medium text-[11px] tracking-[0.12em] uppercase text-[#FFFFFF]">Participants</th>
                      <th className="px-5 py-4 text-center font-[family-name:var(--font-heading)] font-medium text-[11px] tracking-[0.12em] uppercase text-[#FFFFFF]">Questions</th>
                      <th className="px-5 py-4 text-right font-[family-name:var(--font-heading)] font-medium text-[11px] tracking-[0.12em] uppercase text-[#FFFFFF]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(rounds ?? []).length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-20 text-center">
                          <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
                            <Trophy size={56} className="mx-auto text-[#64748B] opacity-40" />
                          </motion.div>
                          <p className="font-[family-name:var(--font-display)] font-semibold text-lg text-[#FFFFFF] mt-4">
                            No rounds created yet ✦
                          </p>
                          <p className="font-[family-name:var(--font-body)] text-sm text-[#94A3B8] mt-1.5 font-light">
                            Create your first round to begin setting up the competition.
                          </p>
                          <Link href="/admin/rounds/create">
                            <GalaxyButton variant="primary" size="sm" className="mt-5">+ Create Round</GalaxyButton>
                          </Link>
                        </td>
                      </tr>
                    ) : (
                      rounds.map((round) => {
                        const isLive = round.status === 'live';
                        return (
                          <tr
                            key={round.id}
                            className={`border-b border-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.04)] transition-colors ${
                              isLive ? 'border-l-4 border-l-[#00B0FF] bg-[rgba(0,176,255,0.05)]' : ''
                            }`}
                          >
                            <td className="px-5 py-4 font-[family-name:var(--font-mono)] font-semibold text-sm text-[#94A3B8] text-center">
                              #{round.round_number}
                            </td>
                            <td className="px-5 py-4">
                              <span className="font-[family-name:var(--font-display)] font-semibold text-sm text-[#FFFFFF] block">
                                {round.title}
                              </span>
                              <div className="flex items-center gap-1.5 mt-1">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-[family-name:var(--font-heading)] font-normal bg-[rgba(255,255,255,0.1)] text-[#FFFFFF] border border-[rgba(255,255,255,0.2)]">
                                  MCQ
                                </span>
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <StatusBadge status={round.status} />
                            </td>
                            <td className="px-5 py-4 font-[family-name:var(--font-mono)] text-xs text-[#94A3B8]">
                              {formatDateIST(round.start_time)}
                            </td>
                            <td className="px-5 py-4 font-[family-name:var(--font-mono)] text-xs text-[#FFFFFF] font-medium">
                              ⏱️ {round.duration_minutes} min
                            </td>
                            <td className="px-5 py-4 font-[family-name:var(--font-mono)] font-bold text-sm text-[#FFFFFF] text-center">
                              {round.participants_count || 0}
                            </td>
                            <td className="px-5 py-4 font-[family-name:var(--font-mono)] font-semibold text-sm text-[#E2E8F0] text-center">
                              {round.questions_count || 0}
                            </td>
                            <td className="px-5 py-4 text-right">
                              <div className="inline-flex items-center gap-2">
                                <Link href={`/admin/rounds/${round.id}`}>
                                  <button className="w-8 h-8 rounded-lg bg-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.18)] border border-[rgba(255,255,255,0.2)] flex items-center justify-center text-[#FFFFFF] transition-colors cursor-pointer">
                                    <Eye size={14} />
                                  </button>
                                </Link>
                                <Link href={`/admin/rounds/${round.id}/questions`}>
                                  <button className="w-8 h-8 rounded-lg bg-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,109,0,0.2)] border border-[rgba(255,255,255,0.2)] flex items-center justify-center text-[#FF6D00] transition-colors cursor-pointer">
                                    <Pencil size={14} />
                                  </button>
                                </Link>
                                {isLive && (
                                  <Link href={`/admin/rounds/${round.id}/monitoring`}>
                                    <button className="w-8 h-8 rounded-lg bg-[rgba(255,0,51,0.14)] border border-[rgba(255,0,51,0.3)] flex items-center justify-center text-[var(--red-core)] transition-colors cursor-pointer">
                                      <Activity size={14} />
                                    </button>
                                  </Link>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          </div>
        </FadeIn>

        {/* ═══ SECTION G — BOTTOM ROW (PARTICIPANTS + QUICK ACTIONS) ═══ */}
        <FadeIn delay={0.36}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

            {/* G1: LATEST REGISTRATIONS (7 COL) */}
            <div className="lg:col-span-7">
              <GlassCard
                variant="elevated"
                radius={26}
                hover={false}
                noHover
                className="!p-6 md:!p-7 border border-[rgba(255,255,255,0.12)]"
                style={{ boxShadow: cleanShadow, background: '#000000' }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-[family-name:var(--font-display)] font-bold text-lg text-[#FFFFFF]">
                    Latest Registrations
                  </h3>
                  <Link href="/admin/participants" className="font-[family-name:var(--font-heading)] text-xs text-[#FFFFFF] hover:underline">
                    View All →
                  </Link>
                </div>

                <div className="space-y-3 max-h-[320px] overflow-y-auto no-scrollbar">
                  {(latestParticipants ?? []).length === 0 ? (
                    <div className="text-center py-10 text-[#94A3B8] font-[family-name:var(--font-body)] text-xs font-light">
                      No participants registered yet.
                    </div>
                  ) : (
                    latestParticipants.map((p) => (
                      <div
                        key={p.id}
                        className="p-3.5 px-4 rounded-[16px] bg-[#000000] border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.25)] hover:bg-[rgba(255,255,255,0.04)] transition-all flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center font-[family-name:var(--font-mono)] font-bold text-xs text-white flex-shrink-0"
                            style={{
                              background: getDeptGradient(p.department),
                              border: '1.5px solid rgba(255,255,255,0.2)',
                            }}
                          >
                            {getInitials(p.display_name)}
                          </div>

                          <div className="min-w-0">
                            <h4 className="font-[family-name:var(--font-body)] font-semibold text-sm text-[#FFFFFF] truncate">
                              {p.display_name}
                            </h4>
                            <p className="font-[family-name:var(--font-body)] text-xs text-[#94A3B8] font-light truncate mt-0.5">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-[family-name:var(--font-heading)] bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.15)] text-[#FFFFFF]">
                                {p.department || 'ECE'}
                              </span>
                              {' · '}
                              {p.year || '3rd Year'}
                              {' · '}
                              <span className="font-[family-name:var(--font-mono)]">{p.register_number || '22EC000'}</span>
                            </p>
                          </div>
                        </div>

                        <span className="font-[family-name:var(--font-mono)] text-[11px] text-[#64748B] flex-shrink-0">
                          {formatDateIST(p.created_at).split(',')[0]}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </GlassCard>
            </div>

            {/* G2: QUICK STATS + NAVIGATION (5 COL) */}
            <div className="lg:col-span-5 flex flex-col gap-4">

              {/* 4 Mini Stat Boxes */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: GraduationCap, val: '78%', label: 'Avg Score' },
                  { icon: Award, val: '98', label: 'High Score' },
                  { icon: Wifi, val: `${stats.liveAttempts ?? 0}`, label: 'Online Now', isLive: true },
                  { icon: FileCheck, val: `${stats.totalSubmissions ?? 0}`, label: 'Certs Issued' },
                ].map((box, idx) => (
                  <GlassCard
                    key={idx}
                    variant="solid"
                    radius={18}
                    hover={false}
                    noHover
                    className="!p-4 border border-[rgba(255,255,255,0.12)]"
                    style={{ background: '#000000' }}
                  >
                    <div className="flex flex-col items-center justify-center text-center space-y-1.5 w-full h-full">
                      <box.icon size={18} className="text-[#FFFFFF]" />
                      <div className="font-[family-name:var(--font-mono)] font-bold text-xl text-[#FFFFFF] flex items-center justify-center gap-1.5 leading-none">
                        {box.isLive && <span className="w-2 h-2 rounded-full bg-[#00B0FF] animate-pulse" />}
                        {box.val}
                      </div>
                      <div className="font-[family-name:var(--font-heading)] text-[10px] text-[#94A3B8] uppercase tracking-wider block">
                        {box.label}
                      </div>
                    </div>
                  </GlassCard>
                ))}
              </div>

              {/* Quick Navigation Shortcuts */}
              <div className="space-y-2">
                <div className="font-[family-name:var(--font-heading)] text-[10px] text-[#64748B] uppercase tracking-[0.2em] mb-1">
                  QUICK ACCESS
                </div>

                {[
                  { label: 'Live Monitor', href: '/admin/rounds', icon: Activity, color: '#FF0033' },
                  { label: 'Participants Directory', href: '/admin/participants', icon: Users, color: '#FFFFFF' },
                  { label: 'Leaderboard Rankings', href: '/admin/leaderboard', icon: BarChart3, color: '#FFFFFF' },
                  { label: 'Certificate Generator', href: '/admin/certificates', icon: Award, color: '#FFFFFF' },
                ].map((s) => (
                  <Link key={s.label} href={s.href}>
                    <div className="p-3 px-3.5 rounded-xl bg-[#000000] border border-[rgba(255,255,255,0.1)] hover:border-[rgba(255,255,255,0.3)] hover:bg-[rgba(255,255,255,0.05)] transition-all flex items-center justify-between gap-3 group cursor-pointer mb-1.5">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-7 h-7 rounded-[9px] flex items-center justify-center flex-shrink-0"
                          style={{ background: 'rgba(255,255,255,0.08)' }}
                        >
                          <s.icon size={13} style={{ color: '#FFFFFF' }} />
                        </div>
                        <span className="font-[family-name:var(--font-heading)] text-xs text-[#E2E8F0] font-medium group-hover:text-[#FFFFFF]">
                          {s.label}
                        </span>
                      </div>
                      <ChevronRight size={11} className="text-[#64748B] group-hover:text-[#FFFFFF] transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>

          </div>
        </FadeIn>

        {/* ═══ SECTION H — BOTTOM CTA STRIP ═══ */}
        <FadeIn delay={0.42}>
          <GlassCard
            variant="elevated"
            radius={26}
            hover={false}
            noHover
            className="!p-6 !px-8 border border-[rgba(255,255,255,0.16)] flex flex-col md:flex-row items-center justify-between gap-4"
            style={{
              background: '#000000',
              boxShadow: cleanShadow,
            }}
          >
            <div>
              <h3 className="font-[family-name:var(--font-display)] font-bold text-xl text-[#FFFFFF]">
                Everything under control ✦
              </h3>
              <p className="font-[family-name:var(--font-body)] text-xs md:text-sm text-[#94A3B8] mt-1 font-light max-w-md">
                Monitor live rounds, manage participants, and issue certificates — all from here.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/admin/rounds">
                <GalaxyButton variant="secondary" size="sm">View All Rounds</GalaxyButton>
              </Link>
              <Link href="/admin/rounds/create">
                <GalaxyButton variant="primary" size="sm">+ Create Round</GalaxyButton>
              </Link>
            </div>
          </GlassCard>
        </FadeIn>

      </div>
    </div>
  );
}
