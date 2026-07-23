'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import GlassCard from '@/components/shared/GlassCard';
import GalaxyButton from '@/components/shared/GalaxyButton';
import FadeIn from '@/components/shared/FadeIn';
import { Trophy, Medal, Eye, EyeOff, Award, Search, Radio } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LeaderboardPage() {
  const [rounds, setRounds] = useState<any[]>([]);
  const [selectedRoundId, setSelectedRoundId] = useState('');
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isVisibleToStudents, setIsVisibleToStudents] = useState(true);

  const fetchLeaderboard = useCallback(async (roundId: string) => {
    setLoading(true);
    const { data: attempts } = await supabase
      .from('attempts')
      .select('id, score, time_taken_seconds, status, created_at, profiles(display_name, register_number, dept)')
      .eq('round_id', roundId)
      .eq('status', 'submitted')
      .order('score', { ascending: false })
      .order('time_taken_seconds', { ascending: true });

    setLeaderboard(attempts || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    const fetchRounds = async () => {
      const { data } = await supabase.from('rounds').select('id, title, round_number, show_leaderboard').order('round_number', { ascending: true });
      if (data && data.length > 0) {
        setRounds(data);
        setSelectedRoundId(data[0].id);
        setIsVisibleToStudents(data[0].show_leaderboard);
        fetchLeaderboard(data[0].id);
      }
    };
    fetchRounds();
  }, [fetchLeaderboard]);

  const handleRoundChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const rId = e.target.value;
    setSelectedRoundId(rId);
    const selected = rounds.find(r => r.id === rId);
    if (selected) setIsVisibleToStudents(selected.show_leaderboard);
    fetchLeaderboard(rId);
  };

  const handleToggleVisibility = async () => {
    const nextVal = !isVisibleToStudents;
    setIsVisibleToStudents(nextVal);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const res = await fetch(`/api/admin/rounds/${selectedRoundId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ show_leaderboard: nextVal }),
    });

    if (res.ok) {
      toast.success(`Leaderboard visibility ${nextVal ? 'enabled' : 'hidden'} for participants`);
    } else {
      toast.error('Failed to update visibility');
    }
  };

  const cleanShadow = '0 4px 20px rgba(0,0,0,0.8)';

  const top3 = leaderboard.slice(0, 3);

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto relative z-10" style={{ background: '#000000', minHeight: '100vh', color: '#FFFFFF' }}>

      {/* HEADER */}
      <FadeIn delay={0}>
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.2)] w-fit mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FFFFFF] animate-pulse" />
              <span className="font-[family-name:var(--font-heading)] text-[10px] font-semibold tracking-widest text-[#FFFFFF] uppercase">
                RANKINGS & STANDINGS
              </span>
            </div>
            <h1 className="font-[family-name:var(--font-display)] font-extrabold text-2xl md:text-3xl text-[#FFFFFF]">
              Leaderboard Management
            </h1>
            <p className="font-[family-name:var(--font-body)] text-xs md:text-sm text-[#94A3B8] font-light mt-0.5">
              Live standings, top 3 podium, and student visibility master controls
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select value={selectedRoundId} onChange={handleRoundChange} className="form-input bg-[#000000] text-[#FFFFFF] font-[family-name:var(--font-heading)] text-xs border border-[rgba(255,255,255,0.2)]">
              {rounds.map(r => (
                <option key={r.id} value={r.id}>Round {r.round_number}: {r.title}</option>
              ))}
            </select>

            <GalaxyButton variant={isVisibleToStudents ? "primary" : "secondary"} size="sm" onClick={handleToggleVisibility}>
              {isVisibleToStudents ? <Eye size={14} /> : <EyeOff size={14} />}
              {isVisibleToStudents ? 'Visible to Students' : 'Hidden from Students'}
            </GalaxyButton>
          </div>
        </div>

        <div className="h-[1px] w-full mt-4 bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.2)] to-transparent" />
      </FadeIn>

      {/* TOP 3 PODIUM SECTION */}
      {top3.length > 0 && (
        <FadeIn delay={0.06}>
          <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto pt-4 items-end">
            {/* 2ND PLACE */}
            {top3[1] && (
              <GlassCard variant="elevated" radius={20} hover={false} noHover className="!p-5 text-center flex flex-col items-center border border-[rgba(255,255,255,0.2)] h-48 justify-end" style={{ boxShadow: cleanShadow, background: '#000000' }}>
                <span className="text-3xl mb-1">🥈</span>
                <span className="font-[family-name:var(--font-body)] font-bold text-sm text-white block truncate w-full">
                  {top3[1].profiles?.display_name}
                </span>
                <span className="font-[family-name:var(--font-mono)] font-bold text-base text-[#FFFFFF] mt-1">
                  {top3[1].score} pts
                </span>
                <span className="font-[family-name:var(--font-heading)] text-[10px] text-[#94A3B8] uppercase mt-0.5">2ND PLACE</span>
              </GlassCard>
            )}

            {/* 1ST PLACE */}
            {top3[0] && (
              <GlassCard variant="elevated" radius={22} hover={false} noHover className="!p-6 text-center flex flex-col items-center border border-[rgba(255,255,255,0.3)] h-56 justify-end" style={{ boxShadow: cleanShadow, background: '#000000' }}>
                <span className="text-4xl mb-1">🥇</span>
                <span className="font-[family-name:var(--font-body)] font-extrabold text-base text-white block truncate w-full">
                  {top3[0].profiles?.display_name}
                </span>
                <span className="font-[family-name:var(--font-mono)] font-extrabold text-xl text-[#FFFFFF] mt-1">
                  {top3[0].score} pts
                </span>
                <span className="font-[family-name:var(--font-heading)] text-[10px] text-[#FFFFFF] font-bold uppercase mt-0.5">CHAMPION</span>
              </GlassCard>
            )}

            {/* 3RD PLACE */}
            {top3[2] && (
              <GlassCard variant="elevated" radius={20} hover={false} noHover className="!p-5 text-center flex flex-col items-center border border-[rgba(255,255,255,0.2)] h-44 justify-end" style={{ boxShadow: cleanShadow, background: '#000000' }}>
                <span className="text-3xl mb-1">🥉</span>
                <span className="font-[family-name:var(--font-body)] font-bold text-sm text-white block truncate w-full">
                  {top3[2].profiles?.display_name}
                </span>
                <span className="font-[family-name:var(--font-mono)] font-bold text-base text-[#FFFFFF] mt-1">
                  {top3[2].score} pts
                </span>
                <span className="font-[family-name:var(--font-heading)] text-[10px] text-[#94A3B8] uppercase mt-0.5">3RD PLACE</span>
              </GlassCard>
            )}
          </div>
        </FadeIn>
      )}

      {/* FULL RANKINGS TABLE */}
      <FadeIn delay={0.12}>
        <GlassCard variant="solid" radius={24} hover={false} noHover className="!p-0 border border-[rgba(255,255,255,0.12)] overflow-hidden" style={{ boxShadow: cleanShadow, background: '#000000' }}>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.04)] font-[family-name:var(--font-heading)] text-xs text-[#FFFFFF] uppercase tracking-wider">
                  <th className="px-5 py-3.5 text-center w-16">Rank</th>
                  <th className="px-5 py-3.5 text-left">Participant</th>
                  <th className="px-5 py-3.5 text-center">Score</th>
                  <th className="px-5 py-3.5 text-center">Time Taken</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4} className="py-16 text-center text-xs text-[#94A3B8]">Loading leaderboard...</td></tr>
                ) : leaderboard.length === 0 ? (
                  <tr><td colSpan={4} className="py-16 text-center text-xs text-[#64748B]">No submissions recorded for this round.</td></tr>
                ) : (
                  leaderboard.map((item, idx) => (
                    <tr key={item.id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.04)] transition-colors">
                      <td className="px-5 py-4 font-[family-name:var(--font-mono)] font-bold text-sm text-center text-[#FFFFFF]">
                        #{idx + 1}
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-[family-name:var(--font-body)] font-semibold text-xs text-[#FFFFFF] block">
                          {item.profiles?.display_name || 'Student'}
                        </span>
                        <span className="font-[family-name:var(--font-mono)] text-[10px] text-[#64748B] font-light">
                          {item.profiles?.register_number || '22EC000'} · {item.profiles?.dept || 'ECE'}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-[family-name:var(--font-mono)] font-extrabold text-sm text-[#00B0FF] text-center">
                        {item.score} pts
                      </td>
                      <td className="px-5 py-4 font-[family-name:var(--font-mono)] text-xs text-[#94A3B8] text-center">
                        ⏱️ {item.time_taken_seconds ? `${Math.floor(item.time_taken_seconds / 60)}m ${item.time_taken_seconds % 60}s` : 'N/A'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </FadeIn>

    </div>
  );
}
