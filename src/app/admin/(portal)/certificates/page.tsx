'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import GlassCard from '@/components/shared/GlassCard';
import GalaxyButton from '@/components/shared/GalaxyButton';
import FadeIn from '@/components/shared/FadeIn';
import {
  Trophy, Medal, Award, Printer, Download, Search, Sparkles,
  CheckCircle2, Users, Layers, TrendingUp, RefreshCw, X, FileSpreadsheet,
  Building2, GraduationCap, ChevronRight, Eye, ShieldCheck, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

interface RankHolder {
  id: string;
  name: string;
  register_no: string;
  email: string;
  department: string;
  year: string;
  section: 'A' | 'B' | 'C' | 'D';
  overall_rank: number;
  section_rank: number;
  score: number;
  total_marks: number;
  percentage: number;
  time_taken_seconds: number | null;
  attempts_count: number;
  has_attempted: boolean;
  status: 'submitted' | 'in_progress' | 'enrolled';
  submitted_at: string | null;
  test_title: string;
  is_topper: boolean;
  honor_type?: 'gold' | 'silver' | 'bronze' | null;
}

interface SectionStat {
  totalEnrolled: number;
  assessed: number;
  avgScore: number;
  topScore: number;
}

interface DashboardStats {
  totalEnrolled: number;
  totalAssessed: number;
  highestScore: number;
  avgScore: number;
  sectionAnalytics: Record<string, SectionStat>;
}

export default function RankHoldersPage() {
  const [rankings, setRankings] = useState<RankHolder[]>([]);
  const [toppers, setToppers] = useState<RankHolder[]>([]);
  const [rounds, setRounds] = useState<any[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalEnrolled: 0,
    totalAssessed: 0,
    highestScore: 0,
    avgScore: 0,
    sectionAnalytics: {
      A: { totalEnrolled: 0, assessed: 0, avgScore: 0, topScore: 0 },
      B: { totalEnrolled: 0, assessed: 0, avgScore: 0, topScore: 0 },
      C: { totalEnrolled: 0, assessed: 0, avgScore: 0, topScore: 0 },
      D: { totalEnrolled: 0, assessed: 0, avgScore: 0, topScore: 0 },
    },
  });

  const [loading, setLoading] = useState(true);
  const [selectedSection, setSelectedSection] = useState<'all' | 'A' | 'B' | 'C' | 'D'>('all');
  const [selectedRoundId, setSelectedRoundId] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Offline Certificate Modal & Print States
  const [activeCertificate, setActiveCertificate] = useState<RankHolder | null>(null);
  const [batchPrintMode, setBatchPrintMode] = useState(false);
  const [certConfig, setCertConfig] = useState({
    institution: 'DEPARTMENT OF ELECTRONICS AND COMMUNICATION ENGINEERING',
    eventTitle: 'Undergraduate Technical Assessment & Merit Contest 2026',
    facultyInCharge: 'Faculty Coordinator (ECE)',
    hodName: 'Head of Department (ECE)',
    dateOfIssue: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }),
  });

  const printRef = useRef<HTMLDivElement>(null);

  const fetchRankHolders = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || 'admin';

      const queryParams = new URLSearchParams();
      if (selectedSection !== 'all') queryParams.set('section', selectedSection);
      if (selectedRoundId !== 'all') queryParams.set('roundId', selectedRoundId);
      if (searchQuery) queryParams.set('search', searchQuery);

      const res = await fetch(`/api/admin/rank-holders?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (res.ok) {
        setRankings(data.rankings || []);
        setToppers(data.toppers || []);
        if (data.stats) setStats(data.stats);
        if (data.rounds) setRounds(data.rounds);
      } else {
        toast.error(data.error || 'Failed to load rank list');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error fetching rankings');
    } finally {
      setLoading(false);
    }
  }, [selectedSection, selectedRoundId, searchQuery]);

  useEffect(() => {
    fetchRankHolders();
  }, [fetchRankHolders]);

  const handlePrintCertificate = (student: RankHolder) => {
    setActiveCertificate(student);
    setBatchPrintMode(false);
  };

  const handleBatchPrintToppers = () => {
    if (toppers.length === 0) {
      toast.error('No toppers available to print offline certificates yet.');
      return;
    }
    setBatchPrintMode(true);
    setActiveCertificate(toppers[0]);
  };

  const triggerSystemPrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    if (rankings.length === 0) {
      toast.error('No rank data available to export');
      return;
    }

    const exportRows = rankings.map((r) => ({
      'Overall Rank': r.overall_rank,
      'Section Rank': `Rank ${r.section_rank} (${r.section})`,
      'Register Number': r.register_no,
      'Student Name': r.name,
      'Section': r.section,
      'Department': r.department,
      'Score': r.score,
      'Total Marks': r.total_marks,
      'Percentage (%)': `${r.percentage}%`,
      'Status': r.status.toUpperCase(),
      'Offline Certificate Eligibility': r.is_topper
        ? `Eligible - ${r.honor_type?.toUpperCase()} MEDAL (Top 3)`
        : 'General Merit',
      'Test Title': r.test_title,
    }));

    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Undergraduate Rank List');
    XLSX.writeFile(wb, `ECE_Rank_Holders_${selectedSection}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success('Official Merit List Exported to Excel! 📑');
  };

  const cleanShadow = '0 4px 20px rgba(0,0,0,0.8)';

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto relative z-10" style={{ background: '#000000', minHeight: '100vh', color: '#FFFFFF' }}>

      {/* ── PRINT-ONLY STYLES (PURE OFFLINE CERTIFICATE PRINTER ENGINE) ── */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #offline-print-stage, #offline-print-stage * {
            visibility: visible !important;
          }
          #offline-print-stage {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100vw !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #FFFFFF !important;
            color: #000000 !important;
            z-index: 999999 !important;
          }
          .page-break {
            page-break-after: always !important;
            break-after: page !important;
          }
          @page {
            size: A4 landscape;
            margin: 10mm;
          }
        }
      `}</style>

      {/* ── HEADER BANNER ── */}
      <FadeIn delay={0}>
        <div className="flex flex-wrap justify-between items-start gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.2)] w-fit mb-2.5">
              <Trophy size={14} className="text-[#FFD700] animate-pulse" />
              <span className="font-[family-name:var(--font-heading)] text-[11px] font-semibold tracking-widest text-[#FFFFFF] uppercase">
                OFFICIAL UNDERGRADUATE MERIT LIST · POST-SECTION EVALUATION
              </span>
            </div>
            <h1 className="font-[family-name:var(--font-display)] font-extrabold text-2xl md:text-4xl text-[#FFFFFF] tracking-tight">
              Rank Holders & Honors 🏆
            </h1>
            <p className="font-[family-name:var(--font-body)] text-xs md:text-sm text-[#94A3B8] font-light mt-1 max-w-3xl leading-relaxed">
              Unified cross-section comparison across Sections A, B, C, and D. Every enrolled undergraduate is ranked strictly based on real test scores and response speed. Official offline physical certificates are generated for the Top 3 Toppers.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <GalaxyButton variant="secondary" size="sm" onClick={handleExportExcel} disabled={rankings.length === 0}>
              <FileSpreadsheet size={14} /> Export Merit List (Excel)
            </GalaxyButton>
            <GalaxyButton variant="gold" size="sm" onClick={handleBatchPrintToppers} disabled={toppers.length === 0}>
              <Printer size={14} /> Batch Print Top 3 (Offline)
            </GalaxyButton>
            <button
              onClick={fetchRankHolders}
              className="p-2 rounded-xl bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.12)] border border-[rgba(255,255,255,0.15)] text-[#E2E8F0] transition-colors"
              title="Refresh Standings"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        <div className="h-[1px] w-full mt-5 bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.2)] to-transparent" />
      </FadeIn>

      {/* ── TOP 3 PODIUM & OFFLINE CERTIFICATE SHOWCASE ── */}
      <FadeIn delay={0.06}>
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Award size={18} className="text-[#FFD700]" />
              <h2 className="font-[family-name:var(--font-display)] font-bold text-lg md:text-xl text-[#FFFFFF]">
                Top 3 Department Toppers (Offline Honors Awardees)
              </h2>
            </div>
            <span className="text-[11px] font-[family-name:var(--font-mono)] text-[#94A3B8] uppercase">
              {toppers.length} Toppers Verified
            </span>
          </div>

          {loading ? (
            <GlassCard variant="elevated" radius={20} hover={false} noHover className="!p-8 text-center" style={{ background: '#000000', boxShadow: cleanShadow }}>
              <div className="text-xs text-[#94A3B8] font-[family-name:var(--font-mono)]">Evaluating cross-section topper records...</div>
            </GlassCard>
          ) : toppers.length === 0 ? (
            <GlassCard
              variant="elevated"
              radius={20}
              hover={false}
              noHover
              className="!p-8 border border-[rgba(255,255,255,0.12)] text-center space-y-3"
              style={{ boxShadow: cleanShadow, background: '#000000' }}
            >
              <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center bg-[rgba(255,215,0,0.1)] border border-[rgba(255,215,0,0.3)]">
                <Trophy size={28} className="text-[#FFD700]" />
              </div>
              <h3 className="font-[family-name:var(--font-display)] font-bold text-lg text-[#FFFFFF]">
                No Toppers Recorded Yet
              </h3>
              <p className="font-[family-name:var(--font-body)] text-xs text-[#94A3B8] max-w-lg mx-auto leading-relaxed font-light">
                Once undergraduate students submit their tests across Sections A, B, C, and D, the Top 3 Toppers will automatically appear here with their Gold, Silver, and Bronze honors, unlocking printable offline certificates.
              </p>
            </GlassCard>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {toppers.slice(0, 3).map((topper) => {
                const isGold = topper.overall_rank === 1 || topper.honor_type === 'gold';
                const isSilver = topper.overall_rank === 2 || topper.honor_type === 'silver';
                const isBronze = topper.overall_rank === 3 || topper.honor_type === 'bronze';

                const badgeColor = isGold
                  ? 'from-[#FFD700]/30 via-[#B8860B]/20 to-transparent border-[#FFD700]/60 text-[#FFD700]'
                  : isSilver
                  ? 'from-[#E2E8F0]/30 via-[#94A3B8]/20 to-transparent border-[#E2E8F0]/60 text-[#E2E8F0]'
                  : 'from-[#CD7F32]/30 via-[#8B4513]/20 to-transparent border-[#CD7F32]/60 text-[#CD7F32]';

                const titleLabel = isGold ? '1ST PRIZE · GOLD MEDAL' : isSilver ? '2ND PRIZE · SILVER MEDAL' : '3RD PRIZE · BRONZE MEDAL';

                return (
                  <GlassCard
                    key={topper.id}
                    variant="elevated"
                    radius={20}
                    hover={false}
                    noHover
                    className="!p-6 border relative overflow-hidden flex flex-col justify-between"
                    style={{
                      boxShadow: cleanShadow,
                      background: '#000000',
                      borderColor: isGold ? 'rgba(255, 215, 0, 0.4)' : isSilver ? 'rgba(226, 232, 240, 0.3)' : 'rgba(205, 127, 50, 0.3)',
                    }}
                  >
                    <div
                      className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-2xl pointer-events-none opacity-20"
                      style={{
                        background: isGold ? '#FFD700' : isSilver ? '#FFFFFF' : '#CD7F32',
                      }}
                    />

                    <div>
                      <div className="flex items-center justify-between gap-2 mb-4">
                        <div className={`px-3 py-1 rounded-full border text-[10px] font-[family-name:var(--font-heading)] font-bold tracking-wider uppercase bg-gradient-to-r ${badgeColor}`}>
                          {titleLabel}
                        </div>
                        <span className="font-[family-name:var(--font-mono)] text-xs font-semibold px-2 py-0.5 rounded bg-[rgba(255,255,255,0.08)] text-[#94A3B8]">
                          Rank #{topper.overall_rank}
                        </span>
                      </div>

                      <div className="space-y-1 mb-4">
                        <h3 className="font-[family-name:var(--font-display)] font-extrabold text-xl text-[#FFFFFF] tracking-tight">
                          {topper.name}
                        </h3>
                        <div className="flex items-center gap-3 text-xs font-[family-name:var(--font-mono)] text-[#94A3B8]">
                          <span>{topper.register_no}</span>
                          <span>•</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#00B0FF]/15 text-[#00B0FF] border border-[#00B0FF]/30">
                            Section {topper.section}
                          </span>
                          <span>•</span>
                          <span>{topper.department}</span>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] space-y-2 mb-4">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-[family-name:var(--font-heading)] text-[#94A3B8]">Marks Achieved:</span>
                          <span className="font-[family-name:var(--font-mono)] font-bold text-[#FFFFFF] text-sm">
                            {topper.score} / {topper.total_marks} ({topper.percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-[rgba(255,255,255,0.1)] h-1.5 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(100, topper.percentage)}%`,
                              background: isGold ? '#FFD700' : isSilver ? '#E2E8F0' : '#CD7F32',
                            }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-[family-name:var(--font-mono)] text-[#64748B]">
                          <span>Time: {topper.time_taken_seconds ? `${Math.floor(topper.time_taken_seconds / 60)}m ${topper.time_taken_seconds % 60}s` : 'Standard'}</span>
                          <span>Section Rank: #{topper.section_rank} in Sec {topper.section}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[rgba(255,255,255,0.08)]">
                      <button
                        onClick={() => handlePrintCertificate(topper)}
                        className="w-full py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 font-[family-name:var(--font-heading)] text-xs font-semibold tracking-wide transition-all duration-200 border"
                        style={{
                          background: isGold
                            ? 'linear-gradient(135deg, rgba(255,215,0,0.2), rgba(184,134,11,0.1))'
                            : 'rgba(255,255,255,0.06)',
                          borderColor: isGold ? 'rgba(255,215,0,0.5)' : 'rgba(255,255,255,0.2)',
                          color: isGold ? '#FFD700' : '#FFFFFF',
                        }}
                      >
                        <Printer size={14} /> Print Offline Certificate
                      </button>
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          )}
        </div>
      </FadeIn>

      {/* ── POST-SECTION COMPARATIVE ANALYTICS (CROSS-SECTION COMPARISON) ── */}
      <FadeIn delay={0.1}>
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Layers size={16} className="text-[#00B0FF]" />
            <h3 className="font-[family-name:var(--font-display)] font-bold text-base text-[#FFFFFF]">
              Post-Section Comparative Benchmarks
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {(['A', 'B', 'C', 'D'] as const).map((sec) => {
              const secData = stats.sectionAnalytics[sec] || { totalEnrolled: 0, assessed: 0, avgScore: 0, topScore: 0 };
              const isSelected = selectedSection === sec;

              return (
                <div
                  key={sec}
                  onClick={() => setSelectedSection(isSelected ? 'all' : sec)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[rgba(255,255,255,0.08)] border-[#00B0FF]'
                      : 'bg-[#000000] border-[rgba(255,255,255,0.1)] hover:border-[rgba(255,255,255,0.25)]'
                  }`}
                  style={{ boxShadow: cleanShadow }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-[family-name:var(--font-heading)] font-bold text-sm text-[#FFFFFF]">
                      Section {sec}
                    </span>
                    <span className="text-[10px] font-[family-name:var(--font-mono)] px-2 py-0.5 rounded bg-[rgba(255,255,255,0.06)] text-[#94A3B8]">
                      {secData.assessed} Assessed
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xl font-bold font-[family-name:var(--font-display)] text-[#00B0FF]">
                      {secData.avgScore} <span className="text-xs font-normal text-[#94A3B8]">avg pts</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-[family-name:var(--font-mono)] text-[#64748B]">
                      <span>Top: {secData.topScore} pts</span>
                      <span>Enrolled: {secData.totalEnrolled}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </FadeIn>

      {/* ── FILTER CONTROLS & SEARCH ── */}
      <FadeIn delay={0.14}>
        <div className="p-4 rounded-2xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.1)] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#000000] border border-[rgba(255,255,255,0.1)]">
            {[
              { id: 'all', label: 'All Sections (Unified)' },
              { id: 'A', label: 'Section A' },
              { id: 'B', label: 'Section B' },
              { id: 'C', label: 'Section C' },
              { id: 'D', label: 'Section D' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedSection(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-[family-name:var(--font-heading)] font-semibold transition-all ${
                  selectedSection === tab.id
                    ? 'bg-[#FFFFFF] text-[#000000] shadow-sm'
                    : 'text-[#94A3B8] hover:text-[#FFFFFF]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 flex-grow sm:flex-grow-0">
            {rounds.length > 0 && (
              <select
                value={selectedRoundId}
                onChange={(e) => setSelectedRoundId(e.target.value)}
                className="bg-[#000000] border border-[rgba(255,255,255,0.2)] text-[#FFFFFF] text-xs font-[family-name:var(--font-heading)] rounded-xl px-3 py-2 outline-none"
              >
                <option value="all">All Department Tests (Best Score)</option>
                {rounds.map((r) => (
                  <option key={r.id} value={r.id}>
                    Round {r.round_number}: {r.title}
                  </option>
                ))}
              </select>
            )}

            <div className="relative flex-grow sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search student or reg no..."
                className="w-full bg-[#000000] border border-[rgba(255,255,255,0.2)] text-[#FFFFFF] text-xs font-[family-name:var(--font-body)] rounded-xl pl-8 pr-3 py-2 outline-none placeholder-[#64748B] focus:border-[#FFFFFF]"
              />
            </div>
          </div>
        </div>
      </FadeIn>

      {/* ── COMPREHENSIVE UNDERGRADUATE MERIT & RANK LIST ── */}
      <FadeIn delay={0.18}>
        <GlassCard
          variant="solid"
          radius={24}
          hover={false}
          noHover
          className="!p-0 border border-[rgba(255,255,255,0.12)] overflow-hidden"
          style={{ boxShadow: cleanShadow, background: '#000000' }}
        >
          <div className="p-4 md:p-5 border-b border-[rgba(255,255,255,0.08)] flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-[family-name:var(--font-display)] font-bold text-base text-[#FFFFFF]">
                Undergraduate Merit Standings ({rankings.length} Students)
              </h3>
              <p className="font-[family-name:var(--font-body)] text-xs text-[#94A3B8] font-light">
                Complete comparative roster ordered by score, accuracy, and response speed
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-[family-name:var(--font-mono)] text-[#64748B]">
              <span>Assessed: {stats.totalAssessed}</span>
              <span>•</span>
              <span>Total Enrolled: {stats.totalEnrolled}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.03)] font-[family-name:var(--font-heading)] text-xs text-[#FFFFFF] uppercase tracking-wider">
                  <th className="px-4 py-3.5 text-center w-16">Rank</th>
                  <th className="px-4 py-3.5 text-left">Undergraduate Student</th>
                  <th className="px-4 py-3.5 text-center">Register No</th>
                  <th className="px-4 py-3.5 text-center">Section</th>
                  <th className="px-4 py-3.5 text-center">Section Rank</th>
                  <th className="px-4 py-3.5 text-center">Marks / Score</th>
                  <th className="px-4 py-3.5 text-center">Accuracy</th>
                  <th className="px-4 py-3.5 text-center">Time Taken</th>
                  <th className="px-4 py-3.5 text-right">Offline Honors</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} className="py-16 text-center text-xs text-[#94A3B8]">
                      Loading complete undergraduate rank list...
                    </td>
                  </tr>
                ) : rankings.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-16 text-center text-xs text-[#64748B]">
                      No enrolled undergraduate records found in the database.
                    </td>
                  </tr>
                ) : (
                  rankings.map((student) => {
                    const isTop1 = student.overall_rank === 1 && student.is_topper;
                    const isTop2 = student.overall_rank === 2 && student.is_topper;
                    const isTop3 = student.overall_rank === 3 && student.is_topper;
                    const isTop3Topper = student.is_topper;

                    return (
                      <tr
                        key={student.id}
                        className={`border-b border-[rgba(255,255,255,0.04)] transition-colors ${
                          isTop1
                            ? 'bg-[rgba(255,215,0,0.04)] hover:bg-[rgba(255,215,0,0.08)]'
                            : isTop2
                            ? 'bg-[rgba(226,232,240,0.03)] hover:bg-[rgba(226,232,240,0.06)]'
                            : isTop3
                            ? 'bg-[rgba(205,127,50,0.03)] hover:bg-[rgba(205,127,50,0.06)]'
                            : 'hover:bg-[rgba(255,255,255,0.03)]'
                        }`}
                      >
                        <td className="px-4 py-3.5 text-center">
                          {isTop1 ? (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#FFD700]/20 border border-[#FFD700] text-[#FFD700] font-bold text-xs font-[family-name:var(--font-mono)] shadow-[0_0_10px_rgba(255,215,0,0.3)]">
                              1
                            </span>
                          ) : isTop2 ? (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#E2E8F0]/20 border border-[#E2E8F0] text-[#E2E8F0] font-bold text-xs font-[family-name:var(--font-mono)]">
                              2
                            </span>
                          ) : isTop3 ? (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#CD7F32]/20 border border-[#CD7F32] text-[#CD7F32] font-bold text-xs font-[family-name:var(--font-mono)]">
                              3
                            </span>
                          ) : (
                            <span className="font-[family-name:var(--font-mono)] text-xs text-[#94A3B8]">
                              #{student.overall_rank}
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="font-[family-name:var(--font-body)] font-semibold text-xs text-[#FFFFFF]">
                            {student.name}
                          </div>
                          <div className="text-[10px] font-[family-name:var(--font-mono)] text-[#64748B]">
                            {student.department} · {student.year} Year
                          </div>
                        </td>

                        <td className="px-4 py-3.5 font-[family-name:var(--font-mono)] text-xs text-[#94A3B8] text-center">
                          {student.register_no}
                        </td>

                        <td className="px-4 py-3.5 text-center">
                          <span
                            className="inline-block px-2.5 py-0.5 rounded text-[11px] font-bold font-[family-name:var(--font-mono)] border"
                            style={{
                              background:
                                student.section === 'A'
                                  ? 'rgba(0,176,255,0.1)'
                                  : student.section === 'B'
                                  ? 'rgba(0,230,118,0.1)'
                                  : student.section === 'C'
                                  ? 'rgba(255,145,0,0.1)'
                                  : 'rgba(213,0,249,0.1)',
                              borderColor:
                                student.section === 'A'
                                  ? 'rgba(0,176,255,0.3)'
                                  : student.section === 'B'
                                  ? 'rgba(0,230,118,0.3)'
                                  : student.section === 'C'
                                  ? 'rgba(255,145,0,0.3)'
                                  : 'rgba(213,0,249,0.3)',
                              color:
                                student.section === 'A'
                                  ? '#00B0FF'
                                  : student.section === 'B'
                                  ? '#00E676'
                                  : student.section === 'C'
                                  ? '#FF9100'
                                  : '#D500F9',
                            }}
                          >
                            Sec {student.section}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 font-[family-name:var(--font-mono)] text-xs text-[#94A3B8] text-center">
                          #{student.section_rank} in {student.section}
                        </td>

                        <td className="px-4 py-3.5 text-center">
                          {student.status === 'submitted' ? (
                            <span className="font-[family-name:var(--font-mono)] font-bold text-xs text-[#FFFFFF]">
                              {student.score} / {student.total_marks}
                            </span>
                          ) : (
                            <span className="text-[10px] font-[family-name:var(--font-mono)] text-[#64748B]">
                              {student.status === 'in_progress' ? 'In Progress' : 'Enrolled'}
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3.5 text-center">
                          {student.status === 'submitted' ? (
                            <span
                              className={`font-[family-name:var(--font-mono)] text-xs font-semibold ${
                                student.percentage >= 80
                                  ? 'text-[#00E676]'
                                  : student.percentage >= 50
                                  ? 'text-[#00B0FF]'
                                  : 'text-[#FF5252]'
                              }`}
                            >
                              {student.percentage}%
                            </span>
                          ) : (
                            <span className="text-xs text-[#64748B]">—</span>
                          )}
                        </td>

                        <td className="px-4 py-3.5 font-[family-name:var(--font-mono)] text-xs text-[#94A3B8] text-center">
                          {student.time_taken_seconds
                            ? `${Math.floor(student.time_taken_seconds / 60)}m ${student.time_taken_seconds % 60}s`
                            : '—'}
                        </td>

                        <td className="px-4 py-3.5 text-right">
                          {isTop3Topper ? (
                            <button
                              onClick={() => handlePrintCertificate(student)}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-[family-name:var(--font-heading)] font-semibold border transition-all"
                              style={{
                                background: isTop1
                                  ? 'rgba(255,215,0,0.15)'
                                  : isTop2
                                  ? 'rgba(226,232,240,0.15)'
                                  : 'rgba(205,127,50,0.15)',
                                borderColor: isTop1
                                  ? '#FFD700'
                                  : isTop2
                                  ? '#E2E8F0'
                                  : '#CD7F32',
                                color: isTop1 ? '#FFD700' : isTop2 ? '#FFFFFF' : '#CD7F32',
                              }}
                            >
                              <Printer size={12} /> Print Certificate
                            </button>
                          ) : (
                            <span className="font-[family-name:var(--font-heading)] text-[11px] text-[#64748B]">
                              Undergraduate Record
                            </span>
                          )}
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

      {/* ── OFFLINE CERTIFICATE PRINT MODAL & PREVIEW ── */}
      {activeCertificate && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-4xl my-8 bg-[#111111] border border-[rgba(255,255,255,0.2)] rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.1)] pb-4">
              <div>
                <span className="text-[10px] font-[family-name:var(--font-heading)] font-bold uppercase tracking-widest text-[#FFD700]">
                  OFFLINE PRINTABLE HONORS CERTIFICATE
                </span>
                <h3 className="font-[family-name:var(--font-display)] font-extrabold text-xl text-[#FFFFFF]">
                  {batchPrintMode ? 'Batch Print: Top 3 Toppers (A4 Landscape)' : `Print Certificate for ${activeCertificate.name}`}
                </h3>
              </div>
              <button
                onClick={() => {
                  setActiveCertificate(null);
                  setBatchPrintMode(false);
                }}
                className="p-2 rounded-full hover:bg-[rgba(255,255,255,0.1)] text-[#94A3B8] hover:text-[#FFFFFF]"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] text-xs">
              <div>
                <label className="block text-[10px] text-[#94A3B8] font-[family-name:var(--font-heading)] mb-1 uppercase">
                  Faculty In-Charge
                </label>
                <input
                  type="text"
                  value={certConfig.facultyInCharge}
                  onChange={(e) => setCertConfig({ ...certConfig, facultyInCharge: e.target.value })}
                  className="w-full bg-[#000000] border border-[rgba(255,255,255,0.2)] rounded-lg px-2.5 py-1.5 text-[#FFFFFF] text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#94A3B8] font-[family-name:var(--font-heading)] mb-1 uppercase">
                  Head of Department (HOD)
                </label>
                <input
                  type="text"
                  value={certConfig.hodName}
                  onChange={(e) => setCertConfig({ ...certConfig, hodName: e.target.value })}
                  className="w-full bg-[#000000] border border-[rgba(255,255,255,0.2)] rounded-lg px-2.5 py-1.5 text-[#FFFFFF] text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#94A3B8] font-[family-name:var(--font-heading)] mb-1 uppercase">
                  Date of Issue
                </label>
                <input
                  type="text"
                  value={certConfig.dateOfIssue}
                  onChange={(e) => setCertConfig({ ...certConfig, dateOfIssue: e.target.value })}
                  className="w-full bg-[#000000] border border-[rgba(255,255,255,0.2)] rounded-lg px-2.5 py-1.5 text-[#FFFFFF] text-xs"
                />
              </div>
            </div>

            {/* CERTIFICATE VISUAL CANVAS */}
            <div className="overflow-x-auto max-h-[60vh] p-2 bg-[#050505] rounded-2xl border border-[rgba(255,255,255,0.1)]">
              <div
                className="w-[820px] mx-auto p-10 bg-[#FFFFFF] text-[#000000] rounded-xl shadow-2xl relative select-none"
                style={{
                  minHeight: '560px',
                  fontFamily: 'serif',
                  border: '10px double #B8860B',
                }}
              >
                <div
                  className="w-full h-full p-6 border-2 border-[#B8860B]/70 flex flex-col justify-between text-center relative"
                  style={{ minHeight: '520px' }}
                >
                  <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                    <Award size={340} className="text-[#B8860B]" />
                  </div>

                  <div>
                    <div className="text-[12px] font-sans font-bold tracking-[0.25em] text-[#555555] uppercase">
                      {certConfig.institution}
                    </div>
                    <div className="text-[10px] font-sans font-semibold tracking-widest text-[#888888] uppercase mt-0.5">
                      ELECTRONICS CLUB · MERIT CONTEST 2026
                    </div>
                    <div className="w-24 h-[2px] bg-[#B8860B] mx-auto my-3" />
                    <h2
                      className="text-3xl font-extrabold tracking-tight text-[#1A1A1A] uppercase"
                      style={{ fontFamily: 'Georgia, serif' }}
                    >
                      Certificate of Merit
                    </h2>
                    <p className="text-[12px] italic text-[#666666] mt-1 font-serif">
                      This honors certificate is officially presented offline to
                    </p>
                  </div>

                  <div className="my-3">
                    <h1
                      className="text-3xl md:text-4xl font-black text-[#0B2545] tracking-wide underline decoration-[#B8860B] decoration-2 underline-offset-8"
                      style={{ fontFamily: 'Georgia, serif' }}
                    >
                      {activeCertificate.name}
                    </h1>
                    <p className="text-xs font-sans font-medium text-[#444444] mt-3">
                      Register No: <span className="font-bold">{activeCertificate.register_no}</span> · Section{' '}
                      <span className="font-bold">{activeCertificate.section}</span> · Dept of{' '}
                      <span className="font-bold">{activeCertificate.department}</span>
                    </p>
                  </div>

                  <div className="max-w-xl mx-auto text-xs font-serif text-[#333333] leading-relaxed">
                    For securing{' '}
                    <span className="font-bold text-[#B8860B] uppercase">
                      {activeCertificate.overall_rank === 1
                        ? 'FIRST PLACE (GOLD MEDALIST)'
                        : activeCertificate.overall_rank === 2
                        ? 'SECOND PLACE (SILVER MEDALIST)'
                        : 'THIRD PLACE (BRONZE MEDALIST)'}
                    </span>{' '}
                    in the <span className="font-semibold">{certConfig.eventTitle}</span> with an outstanding score
                    of <span className="font-bold">{activeCertificate.score} / {activeCertificate.total_marks}</span> ({activeCertificate.percentage}%).
                  </div>

                  <div className="pt-6 grid grid-cols-3 items-end text-center">
                    <div>
                      <div className="w-36 h-[1px] bg-[#333333] mx-auto mb-1" />
                      <div className="text-[11px] font-sans font-bold text-[#222222]">
                        {certConfig.facultyInCharge}
                      </div>
                      <div className="text-[9px] font-sans text-[#777777] uppercase">Faculty Coordinator</div>
                    </div>

                    <div className="flex flex-col items-center justify-center">
                      <div className="w-14 h-14 rounded-full border-2 border-[#B8860B] flex items-center justify-center bg-[#FFF8E7] shadow-inner">
                        <Award size={26} className="text-[#B8860B]" />
                      </div>
                      <span className="text-[8px] font-sans font-bold tracking-widest text-[#B8860B] uppercase mt-1">
                        OFFICIAL SEAL
                      </span>
                    </div>

                    <div>
                      <div className="w-36 h-[1px] bg-[#333333] mx-auto mb-1" />
                      <div className="text-[11px] font-sans font-bold text-[#222222]">{certConfig.hodName}</div>
                      <div className="text-[9px] font-sans text-[#777777] uppercase">Head of Department (ECE)</div>
                    </div>
                  </div>

                  <div className="text-[8px] font-mono text-[#999999] pt-2 border-t border-[#E5E5E5] flex justify-between">
                    <span>ISSUE DATE: {certConfig.dateOfIssue}</span>
                    <span>OFFLINE VERIFICATION: ECE-OFFLINE-TOPPER-{activeCertificate.overall_rank}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-[#94A3B8] font-light">
                Ready for physical printing on A4 Cardstock / Certificate Paper.
              </p>
              <div className="flex items-center gap-3">
                <GalaxyButton
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setActiveCertificate(null);
                    setBatchPrintMode(false);
                  }}
                >
                  Close
                </GalaxyButton>
                <GalaxyButton variant="gold" size="sm" onClick={triggerSystemPrint}>
                  <Printer size={14} /> Print Offline (A4 Landscape)
                </GalaxyButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── HIDDEN PRINT-STAGE CONTAINER (ONLY ACCESSED BY BROWSER WINDOW.PRINT) ── */}
      <div id="offline-print-stage" ref={printRef} className="hidden">
        {(batchPrintMode ? toppers.slice(0, 3) : activeCertificate ? [activeCertificate] : []).map(
          (cert, idx) => (
            <div
              key={cert.id || idx}
              className={`w-full p-8 bg-[#FFFFFF] text-[#000000] page-break`}
              style={{ minHeight: '100vh', border: '12px double #B8860B', boxSizing: 'border-box' }}
            >
              <div
                className="w-full h-full p-8 border-2 border-[#B8860B]/70 flex flex-col justify-between text-center relative"
                style={{ minHeight: '85vh' }}
              >
                <div>
                  <div className="text-sm font-sans font-bold tracking-[0.25em] text-[#555555] uppercase">
                    {certConfig.institution}
                  </div>
                  <div className="text-xs font-sans font-semibold tracking-widest text-[#888888] uppercase mt-1">
                    ELECTRONICS CLUB · MERIT CONTEST 2026
                  </div>
                  <div className="w-32 h-[2px] bg-[#B8860B] mx-auto my-4" />
                  <h2
                    className="text-4xl font-extrabold tracking-tight text-[#1A1A1A] uppercase"
                    style={{ fontFamily: 'Georgia, serif' }}
                  >
                    Certificate of Merit
                  </h2>
                  <p className="text-sm italic text-[#666666] mt-2 font-serif">
                    This honors certificate is officially presented offline to
                  </p>
                </div>

                <div className="my-6">
                  <h1
                    className="text-5xl font-black text-[#0B2545] tracking-wide underline decoration-[#B8860B] decoration-2 underline-offset-8"
                    style={{ fontFamily: 'Georgia, serif' }}
                  >
                    {cert.name}
                  </h1>
                  <p className="text-sm font-sans font-medium text-[#444444] mt-4">
                    Register No: <span className="font-bold">{cert.register_no}</span> · Section{' '}
                    <span className="font-bold">{cert.section}</span> · Dept of{' '}
                    <span className="font-bold">{cert.department}</span>
                  </p>
                </div>

                <div className="max-w-2xl mx-auto text-sm font-serif text-[#333333] leading-relaxed">
                  For securing{' '}
                  <span className="font-bold text-[#B8860B] uppercase">
                    {cert.overall_rank === 1
                      ? 'FIRST PLACE (GOLD MEDALIST)'
                      : cert.overall_rank === 2
                      ? 'SECOND PLACE (SILVER MEDALIST)'
                      : 'THIRD PLACE (BRONZE MEDALIST)'}
                  </span>{' '}
                  in the <span className="font-semibold">{certConfig.eventTitle}</span> with an outstanding score of{' '}
                  <span className="font-bold">{cert.score} / {cert.total_marks}</span> ({cert.percentage}%).
                </div>

                <div className="pt-10 grid grid-cols-3 items-end text-center">
                  <div>
                    <div className="w-48 h-[1px] bg-[#333333] mx-auto mb-2" />
                    <div className="text-xs font-sans font-bold text-[#222222]">{certConfig.facultyInCharge}</div>
                    <div className="text-[10px] font-sans text-[#777777] uppercase">Faculty Coordinator</div>
                  </div>

                  <div className="flex flex-col items-center justify-center">
                    <div className="w-16 h-16 rounded-full border-2 border-[#B8860B] flex items-center justify-center bg-[#FFF8E7]">
                      <Award size={32} className="text-[#B8860B]" />
                    </div>
                    <span className="text-[9px] font-sans font-bold tracking-widest text-[#B8860B] uppercase mt-1">
                      OFFICIAL SEAL
                    </span>
                  </div>

                  <div>
                    <div className="w-48 h-[1px] bg-[#333333] mx-auto mb-2" />
                    <div className="text-xs font-sans font-bold text-[#222222]">{certConfig.hodName}</div>
                    <div className="text-[10px] font-sans text-[#777777] uppercase">Head of Department (ECE)</div>
                  </div>
                </div>

                <div className="text-[9px] font-mono text-[#999999] pt-3 border-t border-[#E5E5E5] flex justify-between">
                  <span>ISSUE DATE: {certConfig.dateOfIssue}</span>
                  <span>OFFLINE VERIFICATION: ECE-OFFLINE-TOPPER-{cert.overall_rank}</span>
                </div>
              </div>
            </div>
          )
        )}
      </div>

    </div>
  );
}
