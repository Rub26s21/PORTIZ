'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase/client';
import GlassCard from '@/components/shared/GlassCard';
import GalaxyButton from '@/components/shared/GalaxyButton';
import FadeIn from '@/components/shared/FadeIn';
import { getInitials, formatDateIST } from '@/lib/utils';
import {
  Users, Search, Download, FileSpreadsheet, CheckCircle2, XCircle,
  Clock, Award, Layers, Sparkles, Filter, ChevronRight, BarChart3,
  TrendingUp, AlertCircle, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

interface SectionStats {
  total: number;
  present: number;
  absent: number;
  attendanceRate: number;
  avgScore: number;
  topScore: number;
}

interface ParticipantRecord {
  id: string;
  name: string;
  register_no: string;
  email: string;
  phone: string;
  department?: string;
  year?: string;
  section: 'A' | 'B' | 'C' | 'D';
  attempts_count: number;
  best_score: number;
  attendance_status: 'present' | 'absent';
  latest_round_title?: string | null;
  latest_score?: number | null;
  latest_total_marks?: number;
  time_taken_seconds?: number | null;
  submitted_at?: string | null;
  created_at: string;
}

export default function ParticipantsPage() {
  const [participants, setParticipants] = useState<ParticipantRecord[]>([]);
  const [sectionStats, setSectionStats] = useState<Record<string, SectionStats>>({
    A: { total: 0, present: 0, absent: 0, attendanceRate: 0, avgScore: 0, topScore: 0 },
    B: { total: 0, present: 0, absent: 0, attendanceRate: 0, avgScore: 0, topScore: 0 },
    C: { total: 0, present: 0, absent: 0, attendanceRate: 0, avgScore: 0, topScore: 0 },
    D: { total: 0, present: 0, absent: 0, attendanceRate: 0, avgScore: 0, topScore: 0 },
    overall: { total: 0, present: 0, absent: 0, attendanceRate: 0, avgScore: 0, topScore: 0 },
  });
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSection, setSelectedSection] = useState<'all' | 'A' | 'B' | 'C' | 'D'>('all');
  const [attendanceFilter, setAttendanceFilter] = useState<'all' | 'present' | 'absent'>('all');

  // Selected Student Modal State
  const [inspectStudent, setInspectStudent] = useState<ParticipantRecord | null>(null);

  const fetchParticipants = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || 'admin';

      const res = await fetch('/api/admin/participants', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setParticipants(data.participants || []);
        if (data.sectionStats) {
          setSectionStats(data.sectionStats);
        }
      }
    } catch {
      toast.error('Failed to load participants directory');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants]);

  // Section Color Tokens
  const getSectionTheme = (sec: string) => {
    switch (sec) {
      case 'A':
        return {
          border: 'border-[#00E5FF]/40',
          bg: 'bg-[#00E5FF]/10',
          text: 'text-[#00E5FF]',
          glow: 'shadow-[0_0_15px_rgba(0,229,255,0.15)]',
          badge: 'bg-[#00E5FF]/20 text-[#00E5FF] border-[#00E5FF]/40',
        };
      case 'B':
        return {
          border: 'border-emerald-500/40',
          bg: 'bg-emerald-500/10',
          text: 'text-emerald-400',
          glow: 'shadow-[0_0_15px_rgba(16,185,129,0.15)]',
          badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        };
      case 'C':
        return {
          border: 'border-purple-500/40',
          bg: 'bg-purple-500/10',
          text: 'text-purple-300',
          glow: 'shadow-[0_0_15px_rgba(168,85,247,0.15)]',
          badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
        };
      case 'D':
        return {
          border: 'border-amber-500/40',
          bg: 'bg-amber-500/10',
          text: 'text-amber-400',
          glow: 'shadow-[0_0_15px_rgba(245,158,11,0.15)]',
          badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        };
      default:
        return {
          border: 'border-white/20',
          bg: 'bg-white/5',
          text: 'text-white',
          glow: '',
          badge: 'bg-white/10 text-white border-white/20',
        };
    }
  };

  // CSV EXPORT
  const handleExportCSV = () => {
    if (filtered.length === 0) {
      toast.error('No participant data to export');
      return;
    }
    const headers = ['Full Name,Register Number,Section,Email,Phone,Attendance Status,Latest Round,Score,Accuracy,Registered At'];
    const rows = filtered.map((p) => {
      const accuracy = p.latest_score !== null && p.latest_score !== undefined
        ? `${Math.round((p.latest_score / (p.latest_total_marks || 100)) * 100)}%`
        : 'N/A';
      return `"${p.name || ''}","${p.register_no || ''}","Section ${p.section || ''}","${p.email || '—'}","${p.phone || ''}","${p.attendance_status.toUpperCase()}","${p.latest_round_title || 'N/A'}","${p.latest_score ?? 'N/A'}","${accuracy}","${p.created_at || ''}"`;
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Section_Wise_Attendance_${selectedSection.toUpperCase()}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    toast.success('Section-Wise CSV Exported! 📊');
  };

  // EXCEL EXPORT (MULTI-SHEET / COMPREHENSIVE XLSX)
  const handleExportExcel = () => {
    if (participants.length === 0) {
      toast.error('No participant data to export');
      return;
    }

    const workbook = XLSX.utils.book_new();

    // 1. Overall Summary Sheet
    const summaryRows = [
      { 'Section': 'Section A', 'Total Enrolled': sectionStats.A.total, 'Present (Attended)': sectionStats.A.present, 'Absent': sectionStats.A.absent, 'Attendance Rate': `${sectionStats.A.attendanceRate}%`, 'Average Score': sectionStats.A.avgScore, 'Top Score': sectionStats.A.topScore },
      { 'Section': 'Section B', 'Total Enrolled': sectionStats.B.total, 'Present (Attended)': sectionStats.B.present, 'Absent': sectionStats.B.absent, 'Attendance Rate': `${sectionStats.B.attendanceRate}%`, 'Average Score': sectionStats.B.avgScore, 'Top Score': sectionStats.B.topScore },
      { 'Section': 'Section C', 'Total Enrolled': sectionStats.C.total, 'Present (Attended)': sectionStats.C.present, 'Absent': sectionStats.C.absent, 'Attendance Rate': `${sectionStats.C.attendanceRate}%`, 'Average Score': sectionStats.C.avgScore, 'Top Score': sectionStats.C.topScore },
      { 'Section': 'Section D', 'Total Enrolled': sectionStats.D.total, 'Present (Attended)': sectionStats.D.present, 'Absent': sectionStats.D.absent, 'Attendance Rate': `${sectionStats.D.attendanceRate}%`, 'Average Score': sectionStats.D.avgScore, 'Top Score': sectionStats.D.topScore },
      { 'Section': 'OVERALL TOTAL', 'Total Enrolled': sectionStats.overall.total, 'Present (Attended)': sectionStats.overall.present, 'Absent': sectionStats.overall.absent, 'Attendance Rate': `${sectionStats.overall.attendanceRate}%`, 'Average Score': '—', 'Top Score': '—' },
    ];
    const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
    summarySheet['!cols'] = [{ wch: 18 }, { wch: 16 }, { wch: 20 }, { wch: 12 }, { wch: 18 }, { wch: 16 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Section_Summary');

    // 2. Individual Sheets for Each Section (A, B, C, D)
    const sections = ['A', 'B', 'C', 'D'] as const;
    sections.forEach((sec) => {
      const secData = participants
        .filter((p) => p.section === sec)
        .map((p, idx) => ({
          '#': idx + 1,
          'Full Name': p.name || 'N/A',
          'Register Number': p.register_no || 'N/A',
          'Section': `Section ${p.section}`,
          'Attendance': p.attendance_status === 'present' ? 'PRESENT' : 'ABSENT',
          'Assigned Round': p.latest_round_title || 'N/A',
          'Score': p.latest_score !== null && p.latest_score !== undefined ? `${p.latest_score}/${p.latest_total_marks || 100}` : 'N/A',
          'Accuracy': p.latest_score !== null && p.latest_score !== undefined ? `${Math.round((p.latest_score / (p.latest_total_marks || 100)) * 100)}%` : 'N/A',
          'Email': p.email || '—',
          'Phone': p.phone || 'N/A',
          'Submitted Time': p.submitted_at ? formatDateIST(p.submitted_at) : 'Not Submitted',
        }));

      const sheet = XLSX.utils.json_to_sheet(secData);
      sheet['!cols'] = [
        { wch: 6 }, { wch: 24 }, { wch: 16 }, { wch: 12 }, { wch: 14 },
        { wch: 32 }, { wch: 12 }, { wch: 12 }, { wch: 28 }, { wch: 16 }, { wch: 22 }
      ];
      XLSX.utils.book_append_sheet(workbook, sheet, `Section_${sec}`);
    });

    XLSX.writeFile(workbook, `Department_Section_Wise_Attendance_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success('Section-Wise Multi-Tab Excel Exported! 📗');
  };

  // Filtered List
  const filtered = useMemo(() => {
    return participants.filter((p) => {
      // Search
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matches =
          p.name?.toLowerCase().includes(query) ||
          p.register_no?.toLowerCase().includes(query) ||
          p.email?.toLowerCase().includes(query) ||
          p.phone?.includes(query);
        if (!matches) return false;
      }

      // Section Filter
      if (selectedSection !== 'all' && p.section !== selectedSection) {
        return false;
      }

      // Attendance Filter
      if (attendanceFilter !== 'all' && p.attendance_status !== attendanceFilter) {
        return false;
      }

      return true;
    });
  }, [participants, searchTerm, selectedSection, attendanceFilter]);

  const cleanShadow = '0 4px 20px rgba(0,0,0,0.8)';

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto relative z-10" style={{ background: '#000000', minHeight: '100vh', color: '#FFFFFF' }}>

      {/* ═══ 1. HEADER & EXPORT ACTIONS ═══ */}
      <FadeIn delay={0}>
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.2)] w-fit mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF] animate-pulse" />
              <span className="font-[family-name:var(--font-heading)] text-[10px] font-semibold tracking-widest text-[#00E5FF] uppercase">
                ATTENDANCE & SECTION ANALYTICS
              </span>
            </div>
            <h1 className="font-[family-name:var(--font-display)] font-extrabold text-2xl md:text-3xl text-[#FFFFFF]">
              Participant Data View
            </h1>
            <p className="font-[family-name:var(--font-body)] text-xs md:text-sm text-[#94A3B8] font-light mt-0.5">
              Live section-wise attendance tracking, 50-Q batch test records, and performance results across Sections A, B, C, & D.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchParticipants}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
              title="Refresh Attendance Data"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
            <GalaxyButton variant="secondary" size="sm" onClick={handleExportCSV}>
              <Download size={14} /> Export CSV
            </GalaxyButton>
            <GalaxyButton variant="cyan" size="sm" onClick={handleExportExcel}>
              <FileSpreadsheet size={14} /> Export Section-Wise Excel
            </GalaxyButton>
          </div>
        </div>

        <div className="h-[1px] w-full mt-4 bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.2)] to-transparent" />
      </FadeIn>

      {/* ═══ 2. SECTION-WISE ATTENDANCE CARDS (SECTIONS A, B, C, D) ═══ */}
      <FadeIn delay={0.06}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(['A', 'B', 'C', 'D'] as const).map((sec) => {
            const stats = sectionStats[sec] || { total: 0, present: 0, absent: 0, attendanceRate: 0, avgScore: 0, topScore: 0 };
            const theme = getSectionTheme(sec);
            const isSelected = selectedSection === sec;

            return (
              <div
                key={sec}
                onClick={() => setSelectedSection(isSelected ? 'all' : sec)}
                className={`p-5 rounded-3xl border transition-all cursor-pointer relative overflow-hidden group ${
                  isSelected
                    ? `${theme.bg} ${theme.border} ${theme.glow} ring-2 ring-white/20`
                    : 'bg-white/[0.03] border-white/10 hover:border-white/25 hover:bg-white/[0.05]'
                }`}
              >
                {/* Header Badge */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🏛️</span>
                    <span className={`font-[family-name:var(--font-display)] font-extrabold text-sm ${theme.text}`}>
                      Section {sec}
                    </span>
                  </div>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${theme.badge}`}>
                    {stats.attendanceRate}% Present
                  </span>
                </div>

                {/* Main Metric */}
                <div className="flex items-baseline justify-between mb-2">
                  <div>
                    <div className="text-2xl font-[family-name:var(--font-mono)] font-extrabold text-white">
                      {stats.present} <span className="text-xs text-[#94A3B8] font-normal">/ {stats.total} Enrolled</span>
                    </div>
                    <div className="text-[11px] font-mono text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                      {stats.present} Attended ({stats.absent} Absent)
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-mono font-bold text-[#E2E8F0]">Avg: {stats.avgScore} pts</div>
                    <div className="text-[10px] font-mono text-[#94A3B8]">Top: {stats.topScore} pts</div>
                  </div>
                </div>

                {/* Animated Attendance Progress Bar */}
                <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden mt-3">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      sec === 'A'
                        ? 'bg-[#00E5FF]'
                        : sec === 'B'
                        ? 'bg-emerald-400'
                        : sec === 'C'
                        ? 'bg-purple-400'
                        : 'bg-amber-400'
                    }`}
                    style={{ width: `${stats.attendanceRate}%` }}
                  />
                </div>

                {isSelected && (
                  <div className="absolute top-2 right-2 text-[8px] font-mono uppercase bg-white/15 px-1.5 py-0.2 rounded text-white">
                    Filtered
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </FadeIn>

      {/* ═══ 3. INNOVATIVE COMPARATIVE ATTENDANCE BANNER ═══ */}
      <FadeIn delay={0.1}>
        <div className="p-4 rounded-2xl bg-gradient-to-r from-white/[0.04] via-purple-950/20 to-white/[0.04] border border-white/10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
              <BarChart3 size={20} />
            </div>
            <div>
              <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span>Department Attendance Overview</span>
                <span className="px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono">
                  {sectionStats.overall.attendanceRate}% Overall Attendance
                </span>
              </div>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                Total {sectionStats.overall.present} Students Present · {sectionStats.overall.absent} Students Absent across all 4 Sections.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-[#00E5FF]">Sec A: {sectionStats.A.attendanceRate}%</span>
            <span className="text-white/30">•</span>
            <span className="text-emerald-400">Sec B: {sectionStats.B.attendanceRate}%</span>
            <span className="text-white/30">•</span>
            <span className="text-purple-300">Sec C: {sectionStats.C.attendanceRate}%</span>
            <span className="text-white/30">•</span>
            <span className="text-amber-400">Sec D: {sectionStats.D.attendanceRate}%</span>
          </div>
        </div>
      </FadeIn>

      {/* ═══ 4. FILTER CONTROLS (SECTION TABS + STATUS TABS + SEARCH) ═══ */}
      <FadeIn delay={0.14}>
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2">
          {/* Section Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/[0.04] border border-white/10 overflow-x-auto">
            <button
              onClick={() => setSelectedSection('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedSection === 'all'
                  ? 'bg-white text-black shadow-md'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              All Sections ({participants.length})
            </button>
            {(['A', 'B', 'C', 'D'] as const).map((sec) => (
              <button
                key={sec}
                onClick={() => setSelectedSection(sec)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  selectedSection === sec
                    ? 'bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white shadow-md'
                    : 'text-[#94A3B8] hover:text-white'
                }`}
              >
                <span>Section {sec}</span>
                <span className="text-[10px] opacity-70 font-mono">({sectionStats[sec]?.total || 0})</span>
              </button>
            ))}
          </div>

          {/* Attendance Status Filter & Search */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Status Pills */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/10 text-xs">
              <button
                onClick={() => setAttendanceFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  attendanceFilter === 'all' ? 'bg-white/20 text-white' : 'text-[#94A3B8] hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setAttendanceFilter('present')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                  attendanceFilter === 'present' ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40' : 'text-[#94A3B8] hover:text-white'
                }`}
              >
                <CheckCircle2 size={12} className="text-emerald-400" />
                <span>Present ({participants.filter((p) => p.attendance_status === 'present').length})</span>
              </button>
              <button
                onClick={() => setAttendanceFilter('absent')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                  attendanceFilter === 'absent' ? 'bg-red-500/30 text-red-300 border border-red-500/40' : 'text-[#94A3B8] hover:text-white'
                }`}
              >
                <XCircle size={12} className="text-red-400" />
                <span>Absent ({participants.filter((p) => p.attendance_status === 'absent').length})</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="flex items-center gap-2 bg-[#000000] p-2 px-3.5 rounded-xl border border-white/15 min-w-[220px]">
              <Search size={14} className="text-[#94A3B8]" />
              <input
                type="text"
                placeholder="Search student or register no..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent border-none outline-none text-xs text-white placeholder:text-[#64748B] w-full"
              />
            </div>
          </div>
        </div>
      </FadeIn>

      {/* ═══ 5. SECTION-WISE PARTICIPANTS ATTENDANCE TABLE ═══ */}
      <FadeIn delay={0.18}>
        <GlassCard
          variant="solid"
          radius={22}
          hover={false}
          noHover
          className="!p-0 border border-white/12 overflow-hidden"
          style={{ boxShadow: cleanShadow, background: '#000000' }}
        >
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-white/12 bg-white/[0.04] font-[family-name:var(--font-heading)] text-xs text-white uppercase tracking-wider">
                  <th className="px-5 py-4 w-12 text-center">#</th>
                  <th className="px-5 py-4">Student & Register No</th>
                  <th className="px-5 py-4 text-center">Section</th>
                  <th className="px-5 py-4 text-center">Attendance Status</th>
                  <th className="px-5 py-4">Assigned Test Round</th>
                  <th className="px-5 py-4 text-center">Score & Performance</th>
                  <th className="px-5 py-4 text-center">Time Spent</th>
                  <th className="px-5 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-20 text-center text-xs text-[#94A3B8]">
                      <div className="flex flex-col items-center gap-2">
                        <RefreshCw size={24} className="animate-spin text-[#00E5FF]" />
                        <span>Loading section attendance data...</span>
                      </div>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-20 text-center text-xs text-[#64748B]">
                      No students found matching the selected section and attendance filters.
                    </td>
                  </tr>
                ) : (
                  filtered.map((p, idx) => {
                    const theme = getSectionTheme(p.section);
                    const isPresent = p.attendance_status === 'present';
                    const accuracy = p.latest_score !== null && p.latest_score !== undefined
                      ? Math.round((p.latest_score / (p.latest_total_marks || 100)) * 100)
                      : null;

                    return (
                      <tr
                        key={p.id}
                        className="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors group"
                      >
                        {/* 1. Index */}
                        <td className="px-5 py-4 font-[family-name:var(--font-mono)] text-xs text-[#94A3B8] text-center font-semibold">
                          {idx + 1}
                        </td>

                        {/* 2. Student Info */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-mono border ${theme.badge}`}>
                              {getInitials(p.name || 'S')}
                            </div>
                            <div>
                              <div className="font-semibold text-xs text-white group-hover:text-[#00E5FF] transition-colors">
                                {p.name}
                              </div>
                              <div className="text-[11px] font-mono text-[#94A3B8] flex items-center gap-1.5 mt-0.5">
                                <span className="font-bold text-[#CBD5E1]">{p.register_no}</span>
                                <span className="text-white/30">•</span>
                                <span>{p.email || 'No email'}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 3. Section Badge */}
                        <td className="px-5 py-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold font-mono border ${theme.badge}`}>
                            🏛️ Section {p.section}
                          </span>
                        </td>

                        {/* 4. Attendance Status */}
                        <td className="px-5 py-4 text-center">
                          {isPresent ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold font-mono">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              Present ✅
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono">
                              <XCircle size={12} />
                              Absent (Pending)
                            </span>
                          )}
                        </td>

                        {/* 5. Assigned Round */}
                        <td className="px-5 py-4">
                          {p.latest_round_title ? (
                            <div className="max-w-[220px]">
                              <div className="text-xs text-white font-semibold truncate" title={p.latest_round_title}>
                                {p.latest_round_title}
                              </div>
                              {p.submitted_at && (
                                <div className="text-[10px] font-mono text-[#64748B] mt-0.5">
                                  Submitted: {formatDateIST(p.submitted_at)}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-[#64748B] font-mono italic">Not assigned yet</span>
                          )}
                        </td>

                        {/* 6. Score & Performance */}
                        <td className="px-5 py-4 text-center">
                          {p.latest_score !== null && p.latest_score !== undefined ? (
                            <div className="inline-block text-center">
                              <div className="text-xs font-mono font-extrabold text-white">
                                {p.latest_score} <span className="text-[#94A3B8] font-normal">/ {p.latest_total_marks || 100}</span>
                              </div>
                              <div className="w-16 h-1 rounded-full bg-white/10 overflow-hidden mx-auto mt-1">
                                <div
                                  className="h-full bg-gradient-to-r from-emerald-400 to-[#00E5FF] rounded-full"
                                  style={{ width: `${accuracy || 0}%` }}
                                />
                              </div>
                              <div className="text-[9px] font-mono text-emerald-400 font-bold mt-0.5">
                                {accuracy}% Accuracy
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs font-mono text-[#64748B]">—</span>
                          )}
                        </td>

                        {/* 7. Time Spent */}
                        <td className="px-5 py-4 text-center font-[family-name:var(--font-mono)] text-xs text-[#E2E8F0]">
                          {p.time_taken_seconds ? (
                            <div className="flex items-center justify-center gap-1 text-xs">
                              <Clock size={12} className="text-[#94A3B8]" />
                              <span>{Math.floor(p.time_taken_seconds / 60)}m {p.time_taken_seconds % 60}s</span>
                            </div>
                          ) : (
                            <span className="text-[#64748B]">—</span>
                          )}
                        </td>

                        {/* 8. Action */}
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => setInspectStudent(p)}
                            className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-white text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                          >
                            <span>Inspect</span>
                            <ChevronRight size={12} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </FadeIn>

      {/* ═══ 6. STUDENT INSPECTION DETAIL MODAL ═══ */}
      {inspectStudent && (
        <div className="fixed inset-0 z-[99999] overflow-y-auto bg-black/90 backdrop-blur-md p-3 sm:p-6 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/80" onClick={() => setInspectStudent(null)} />

          <div className="relative z-10 w-full max-w-lg bg-[#08080C] border border-white/20 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.9)] overflow-hidden my-auto p-6 md:p-8 space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-bold font-mono border ${getSectionTheme(inspectStudent.section).badge}`}>
                  {getInitials(inspectStudent.name)}
                </div>
                <div>
                  <h3 className="font-[family-name:var(--font-display)] font-extrabold text-base text-white">
                    {inspectStudent.name}
                  </h3>
                  <div className="text-xs font-mono text-[#94A3B8]">
                    {inspectStudent.register_no} · <span className="text-white font-bold">Section {inspectStudent.section}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setInspectStudent(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center transition-all cursor-pointer text-xs"
              >
                ✕
              </button>
            </div>

            {/* Attendance & Test Details */}
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-1">
                  <div className="text-[10px] font-mono text-[#94A3B8] uppercase">Attendance Status</div>
                  <div className="font-bold text-sm">
                    {inspectStudent.attendance_status === 'present' ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 size={14} /> Present (Attended)
                      </span>
                    ) : (
                      <span className="text-red-400 flex items-center gap-1">
                        <XCircle size={14} /> Absent (Pending)
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-1">
                  <div className="text-[10px] font-mono text-[#94A3B8] uppercase">Best Score</div>
                  <div className="font-bold text-sm font-mono text-white">
                    {inspectStudent.best_score} Points
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
                <div className="text-[10px] font-mono text-[#94A3B8] uppercase">Test Assessment History</div>
                <div className="font-bold text-white">
                  {inspectStudent.latest_round_title || 'No completed assessment record'}
                </div>
                {inspectStudent.submitted_at && (
                  <div className="text-[11px] font-mono text-[#94A3B8]">
                    Submission Timestamp: {formatDateIST(inspectStudent.submitted_at)}
                  </div>
                )}
                {inspectStudent.time_taken_seconds && (
                  <div className="text-[11px] font-mono text-[#00E5FF]">
                    Time Taken: {Math.floor(inspectStudent.time_taken_seconds / 60)} minutes {inspectStudent.time_taken_seconds % 60} seconds
                  </div>
                )}
              </div>

              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-1">
                <div className="text-[10px] font-mono text-[#94A3B8] uppercase">Contact Details</div>
                <div className="text-white">Email: {inspectStudent.email || '—'}</div>
                <div className="text-white">Phone: {inspectStudent.phone || '—'}</div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <GalaxyButton variant="secondary" size="sm" onClick={() => setInspectStudent(null)}>
                Close
              </GalaxyButton>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
