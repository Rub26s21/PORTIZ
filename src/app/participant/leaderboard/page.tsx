'use client';

import { useEffect, useState, useCallback } from 'react';
import GlassCard from '@/components/shared/GlassCard';
import FadeIn from '@/components/shared/FadeIn';
import {
  Trophy, Medal, Award, Search, Clock, CheckCircle2,
  Users, Layers, ArrowUpRight, Sparkles, RefreshCw, Star
} from 'lucide-react';
import toast from 'react-hot-toast';

interface LeaderboardStudent {
  attempt_id: string;
  display_name: string;
  register_number: string;
  section: 'A' | 'B' | 'C' | 'D';
  score: number;
  total_marks: number;
  accuracy: number;
  time_taken_seconds: number;
  submitted_at: string;
  rank: number;
  overall_rank: number;
  section_rank: number;
  honor_type?: 'gold' | 'silver' | 'bronze' | null;
  is_current_user?: boolean;
}

interface MyStanding {
  overall_rank: number;
  section_rank: number;
  section: string;
  score: number;
  total_marks: number;
  accuracy: number;
}

export default function ParticipantLeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardStudent[]>([]);
  const [overallToppers, setOverallToppers] = useState<LeaderboardStudent[]>([]);
  const [sectionToppers, setSectionToppers] = useState<Record<string, LeaderboardStudent[]>>({});
  const [myStanding, setMyStanding] = useState<MyStanding | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSection, setSelectedSection] = useState<'ALL' | 'A' | 'B' | 'C' | 'D'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      const url = `/api/participant/leaderboard/latest?section=${selectedSection}`;
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        setLeaderboard(data.leaderboard || []);
        if (data.overallToppers) setOverallToppers(data.overallToppers);
        if (data.sectionToppers) setSectionToppers(data.sectionToppers);
        if (data.myStanding) setMyStanding(data.myStanding);
      } else {
        toast.error(data.error || 'Failed to load leaderboard');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error loading leaderboard');
    } finally {
      setLoading(false);
    }
  }, [selectedSection]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // Section Color Palette
  const getSectionBadgeStyle = (sec: string) => {
    switch (sec) {
      case 'A':
        return 'bg-[#00E5FF]/15 text-[#00E5FF] border-[#00E5FF]/40';
      case 'B':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40';
      case 'C':
        return 'bg-purple-500/15 text-purple-300 border-purple-500/40';
      case 'D':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/40';
      default:
        return 'bg-white/10 text-white border-white/20';
    }
  };

  // Filtered Table Entries
  const filteredList = leaderboard.filter((s) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.display_name.toLowerCase().includes(q) ||
      s.register_number.toLowerCase().includes(q) ||
      s.section.toLowerCase().includes(q)
    );
  });

  // Current podium to show (Overall or Section-specific)
  const currentPodium = selectedSection === 'ALL'
    ? overallToppers
    : (sectionToppers[selectedSection] || []);

  const goldTopper = currentPodium[0];
  const silverTopper = currentPodium[1];
  const bronzeTopper = currentPodium[2];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* ═══ 1. HEADER ═══ */}
      <FadeIn y={-20}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold mb-3 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
              <Trophy size={14} className="text-amber-400" />
              <span>OFFICIAL COMPETITION STANDINGS</span>
            </div>
            <h1 className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl font-black text-white tracking-tight">
              Competition Leaderboard 🏆
            </h1>
            <p className="font-[family-name:var(--font-body)] text-xs sm:text-sm text-[#94A3B8] mt-1 max-w-2xl">
              Consolidated scores and section-segregated rankings. Fully validated with zero negative marks and fair speed tie-breaking.
            </p>
          </div>

          <button
            onClick={fetchLeaderboard}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-white text-xs font-mono font-semibold transition-all flex items-center gap-2 cursor-pointer shrink-0"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-[#00E5FF]' : ''} />
            <span>Refresh Standings</span>
          </button>
        </div>
      </FadeIn>

      {/* ═══ 2. PERSONAL STANDING BANNER (IF SUBMITTED) ═══ */}
      {myStanding && (
        <FadeIn delay={0.06}>
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#00E5FF]/10 via-purple-500/10 to-emerald-500/10 border border-[#00E5FF]/30 shadow-[0_0_25px_rgba(0,229,255,0.1)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#00E5FF]/20 border border-[#00E5FF]/40 flex items-center justify-center text-[#00E5FF] shadow-[0_0_15px_rgba(0,229,255,0.2)]">
                <Star size={24} />
              </div>
              <div>
                <div className="text-[11px] font-mono text-[#00E5FF] font-bold uppercase tracking-wider">
                  Your Official Performance Standing
                </div>
                <div className="font-extrabold text-base sm:text-lg text-white">
                  Overall Rank #{myStanding.overall_rank} · Section {myStanding.section} Rank #{myStanding.section_rank}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 font-mono text-xs self-stretch sm:self-auto justify-between sm:justify-end border-t sm:border-t-0 border-white/10 pt-2 sm:pt-0">
              <div className="text-center px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
                <div className="text-[10px] text-[#94A3B8]">Score</div>
                <div className="font-extrabold text-white text-sm">{myStanding.score} / {myStanding.total_marks}</div>
              </div>
              <div className="text-center px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
                <div className="text-[10px] text-[#94A3B8]">Accuracy</div>
                <div className="font-extrabold text-emerald-400 text-sm">{myStanding.accuracy}%</div>
              </div>
            </div>
          </div>
        </FadeIn>
      )}

      {/* ═══ 3. TOPPER PODIUM (GOLD, SILVER, BRONZE) ═══ */}
      {currentPodium.length > 0 && (
        <FadeIn delay={0.1}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end pt-4">
            {/* 🥈 Silver - Rank #2 */}
            <div className="order-2 md:order-1">
              {silverTopper ? (
                <GlassCard
                  variant="solid"
                  radius={24}
                  hover={false}
                  className="p-5 text-center border border-slate-400/30 bg-gradient-to-b from-slate-400/10 via-black/40 to-black relative overflow-hidden"
                  style={{ boxShadow: '0 0 30px rgba(148,163,184,0.1)' }}
                >
                  <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center text-xl bg-slate-300/20 border border-slate-300/40 text-slate-200">
                    🥈
                  </div>
                  <div className="text-[10px] font-mono font-bold text-slate-300 uppercase tracking-widest">
                    Rank #2 {selectedSection !== 'ALL' ? `(Sec ${selectedSection})` : 'Overall'}
                  </div>
                  <h3 className="font-bold text-sm text-white mt-1 truncate" title={silverTopper.display_name}>
                    {silverTopper.display_name}
                  </h3>
                  <div className="text-[11px] font-mono text-[#94A3B8]">{silverTopper.register_number}</div>

                  <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-around font-mono text-xs">
                    <div>
                      <span className="text-[#94A3B8] text-[10px] block">Score</span>
                      <span className="font-extrabold text-white text-sm">{silverTopper.score}/{silverTopper.total_marks}</span>
                    </div>
                    <div>
                      <span className="text-[#94A3B8] text-[10px] block">Time</span>
                      <span className="font-semibold text-slate-300">
                        {Math.floor(silverTopper.time_taken_seconds / 60)}m {silverTopper.time_taken_seconds % 60}s
                      </span>
                    </div>
                  </div>
                </GlassCard>
              ) : null}
            </div>

            {/* 🥇 Gold - Rank #1 (Elevated) */}
            <div className="order-1 md:order-2 -mt-4">
              {goldTopper ? (
                <GlassCard
                  variant="solid"
                  radius={28}
                  hover={false}
                  className="p-6 text-center border-2 border-yellow-400/50 bg-gradient-to-b from-yellow-500/20 via-amber-500/10 to-black relative overflow-hidden shadow-[0_0_40px_rgba(234,179,8,0.2)]"
                >
                  <div className="absolute top-2 right-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-mono font-extrabold bg-yellow-400 text-black shadow-md">
                      TOPPER
                    </span>
                  </div>

                  <div className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center text-3xl bg-yellow-400/20 border-2 border-yellow-400/50 text-yellow-300 shadow-[0_0_25px_rgba(234,179,8,0.3)]">
                    🥇
                  </div>
                  <div className="text-[11px] font-mono font-extrabold text-yellow-300 uppercase tracking-widest">
                    Rank #1 {selectedSection !== 'ALL' ? `(Sec ${selectedSection})` : 'Overall Winner'}
                  </div>
                  <h3 className="font-extrabold text-base text-white mt-1 truncate" title={goldTopper.display_name}>
                    {goldTopper.display_name}
                  </h3>
                  <div className="text-xs font-mono text-[#CBD5E1]">{goldTopper.register_number}</div>

                  <div className="mt-4 pt-3 border-t border-yellow-400/20 flex items-center justify-around font-mono text-xs">
                    <div>
                      <span className="text-yellow-200/70 text-[10px] block">Score</span>
                      <span className="font-black text-yellow-300 text-base">{goldTopper.score}/{goldTopper.total_marks}</span>
                    </div>
                    <div>
                      <span className="text-yellow-200/70 text-[10px] block">Accuracy</span>
                      <span className="font-bold text-emerald-400 text-sm">{goldTopper.accuracy}%</span>
                    </div>
                    <div>
                      <span className="text-yellow-200/70 text-[10px] block">Time</span>
                      <span className="font-bold text-white text-sm">
                        {Math.floor(goldTopper.time_taken_seconds / 60)}m {goldTopper.time_taken_seconds % 60}s
                      </span>
                    </div>
                  </div>
                </GlassCard>
              ) : null}
            </div>

            {/* 🥉 Bronze - Rank #3 */}
            <div className="order-3">
              {bronzeTopper ? (
                <GlassCard
                  variant="solid"
                  radius={24}
                  hover={false}
                  className="p-5 text-center border border-amber-700/40 bg-gradient-to-b from-amber-800/15 via-black/40 to-black relative overflow-hidden"
                  style={{ boxShadow: '0 0 30px rgba(180,83,9,0.1)' }}
                >
                  <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center text-xl bg-amber-700/20 border border-amber-600/40 text-amber-400">
                    🥉
                  </div>
                  <div className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest">
                    Rank #3 {selectedSection !== 'ALL' ? `(Sec ${selectedSection})` : 'Overall'}
                  </div>
                  <h3 className="font-bold text-sm text-white mt-1 truncate" title={bronzeTopper.display_name}>
                    {bronzeTopper.display_name}
                  </h3>
                  <div className="text-[11px] font-mono text-[#94A3B8]">{bronzeTopper.register_number}</div>

                  <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-around font-mono text-xs">
                    <div>
                      <span className="text-[#94A3B8] text-[10px] block">Score</span>
                      <span className="font-extrabold text-white text-sm">{bronzeTopper.score}/{bronzeTopper.total_marks}</span>
                    </div>
                    <div>
                      <span className="text-[#94A3B8] text-[10px] block">Time</span>
                      <span className="font-semibold text-amber-300">
                        {Math.floor(bronzeTopper.time_taken_seconds / 60)}m {bronzeTopper.time_taken_seconds % 60}s
                      </span>
                    </div>
                  </div>
                </GlassCard>
              ) : null}
            </div>
          </div>
        </FadeIn>
      )}

      {/* ═══ 4. SECTION TABS & SEARCH ═══ */}
      <FadeIn delay={0.14}>
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-4">
          {/* Section Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/[0.04] border border-white/10 overflow-x-auto">
            <button
              onClick={() => setSelectedSection('ALL')}
              className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                selectedSection === 'ALL'
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow-lg font-black'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              <span>🏆 All Sections</span>
            </button>

            {(['A', 'B', 'C', 'D'] as const).map((sec) => (
              <button
                key={sec}
                onClick={() => setSelectedSection(sec)}
                className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  selectedSection === sec
                    ? 'bg-white text-black shadow-lg font-black'
                    : 'text-[#94A3B8] hover:text-white'
                }`}
              >
                <span>Section {sec}</span>
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="flex items-center gap-2 bg-[#000000] p-2 px-3.5 rounded-xl border border-white/15 min-w-[240px]">
            <Search size={14} className="text-[#94A3B8]" />
            <input
              type="text"
              placeholder="Search by student or reg no..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-xs text-white placeholder:text-[#64748B] w-full"
            />
          </div>
        </div>
      </FadeIn>

      {/* ═══ 5. COMPREHENSIVE LEADERBOARD TABLE ═══ */}
      <FadeIn delay={0.18}>
        <GlassCard
          variant="solid"
          radius={22}
          hover={false}
          noHover
          className="!p-0 border border-white/12 overflow-hidden shadow-2xl"
          style={{ background: '#000000' }}
        >
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left min-w-[850px]">
              <thead>
                <tr className="border-b border-white/12 bg-white/[0.04] font-[family-name:var(--font-heading)] text-xs text-white uppercase tracking-wider">
                  <th className="px-4 py-4 w-16 text-center whitespace-nowrap">Rank</th>
                  <th className="px-5 py-4 min-w-[220px] whitespace-nowrap">Participant</th>
                  <th className="px-4 py-4 w-28 text-center whitespace-nowrap">Section</th>
                  <th className="px-4 py-4 w-32 text-center whitespace-nowrap">Section Rank</th>
                  <th className="px-4 py-4 w-36 text-center whitespace-nowrap">Score</th>
                  <th className="px-4 py-4 w-32 text-center whitespace-nowrap">Accuracy</th>
                  <th className="px-4 py-4 w-32 text-center whitespace-nowrap">Time Taken</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-20 text-center text-xs text-[#94A3B8]">
                      <div className="flex flex-col items-center gap-2">
                        <RefreshCw size={24} className="animate-spin text-[#00E5FF]" />
                        <span>Loading official competition standings...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-20 text-center text-xs text-[#64748B]">
                      No participants match the search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredList.map((s, idx) => {
                    const isTop1 = s.overall_rank === 1;
                    const isTop2 = s.overall_rank === 2;
                    const isTop3 = s.overall_rank === 3;
                    const isHighlighted = s.is_current_user;

                    const rankDisplay = isTop1
                      ? '🥇 #1'
                      : isTop2
                      ? '🥈 #2'
                      : isTop3
                      ? '🥉 #3'
                      : `#${selectedSection === 'ALL' ? s.overall_rank : s.section_rank}`;

                    return (
                      <tr
                        key={s.attempt_id || idx}
                        className={`border-b border-white/[0.04] transition-colors ${
                          isHighlighted
                            ? 'bg-[#00E5FF]/10 hover:bg-[#00E5FF]/15 border-l-4 border-l-[#00E5FF]'
                            : 'hover:bg-white/[0.03]'
                        }`}
                      >
                        {/* 1. Rank */}
                        <td className="px-4 py-4 text-center whitespace-nowrap font-mono font-black text-xs">
                          <span
                            className={
                              isTop1
                                ? 'text-yellow-400 text-sm font-black'
                                : isTop2
                                ? 'text-slate-300 text-sm font-black'
                                : isTop3
                                ? 'text-amber-500 text-sm font-black'
                                : 'text-[#94A3B8]'
                            }
                          >
                            {rankDisplay}
                          </span>
                        </td>

                        {/* 2. Participant Info */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <div>
                              <div className="font-semibold text-xs text-white flex items-center gap-2">
                                <span>{s.display_name}</span>
                                {isHighlighted && (
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-[#00E5FF] text-black">
                                    YOU
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] font-mono text-[#94A3B8] mt-0.5">
                                {s.register_number}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 3. Section */}
                        <td className="px-4 py-4 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-mono border whitespace-nowrap shadow-sm ${getSectionBadgeStyle(
                              s.section
                            )}`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
                            Section {s.section}
                          </span>
                        </td>

                        {/* 4. Section Rank */}
                        <td className="px-4 py-4 text-center whitespace-nowrap font-mono text-xs font-bold text-purple-300">
                          Sec #{s.section_rank}
                        </td>

                        {/* 5. Score */}
                        <td className="px-4 py-4 text-center whitespace-nowrap font-mono">
                          <div className="font-black text-white text-xs">
                            {s.score} <span className="text-[#64748B] font-normal">/ {s.total_marks}</span>
                          </div>
                        </td>

                        {/* 6. Accuracy */}
                        <td className="px-4 py-4 text-center whitespace-nowrap font-mono">
                          <div className="inline-flex items-center gap-2">
                            <span className="text-xs font-bold text-emerald-400">{s.accuracy}%</span>
                            <div className="w-12 h-1 rounded-full bg-white/10 overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-emerald-400 to-[#00E5FF] rounded-full"
                                style={{ width: `${Math.min(100, s.accuracy)}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* 7. Time Taken */}
                        <td className="px-4 py-4 text-center font-mono text-xs text-[#CBD5E1] whitespace-nowrap">
                          <div className="inline-flex items-center gap-1 text-xs">
                            <Clock size={12} className="text-[#94A3B8]" />
                            <span>
                              {Math.floor(s.time_taken_seconds / 60)}m {s.time_taken_seconds % 60}s
                            </span>
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
      </FadeIn>

      {/* ═══ 6. TRANSPARENCY & FAIR TIE-BREAKING EXPLANATION ═══ */}
      <FadeIn delay={0.22}>
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 text-xs text-[#94A3B8] font-mono flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[#00E5FF] font-bold">
            <CheckCircle2 size={16} />
            <span>Fair Ranking Standard & Tie-Breaking Hierarchy:</span>
          </div>
          <div className="text-[11px] text-[#CBD5E1] space-x-2">
            <span>1️⃣ Score (Desc)</span>
            <span>→</span>
            <span>2️⃣ Accuracy % (Desc)</span>
            <span>→</span>
            <span>3️⃣ Time Taken (Asc)</span>
            <span>→</span>
            <span>4️⃣ Submission Time (Asc)</span>
          </div>
        </div>
      </FadeIn>
    </div>
  );
}
