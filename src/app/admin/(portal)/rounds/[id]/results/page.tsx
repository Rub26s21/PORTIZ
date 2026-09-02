'use client';

import { useEffect, useState, useCallback, use } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase/client';
import GlassCard from '@/components/shared/GlassCard';
import GalaxyButton from '@/components/shared/GalaxyButton';
import FadeIn from '@/components/shared/FadeIn';
import { ArrowLeft, Trophy, Search, CheckSquare, Download, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import { formatDateIST } from '@/lib/utils';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ResultsPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const roundId = resolvedParams.id;

  const [roundTitle, setRoundTitle] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const fetchResults = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const roundRes = await supabase.from('rounds').select('title').eq('id', roundId).single();
    if (roundRes.data) setRoundTitle(roundRes.data.title);

    const res = await fetch(`/api/admin/rounds/${roundId}/results`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    const data = await res.json();
    setResults(data.results || []);
    setLoading(false);
  }, [roundId]);

  useEffect(() => { fetchResults(); }, [fetchResults]);

  const handleSelectAll = () => {
    if (selectedIds.length === results.length) setSelectedIds([]);
    else setSelectedIds(results.map(r => r.id));
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handlePromoteSelected = async () => {
    if (selectedIds.length === 0) {
      toast.error('No participants selected');
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const res = await fetch(`/api/admin/rounds/${roundId}/promote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ attemptIds: selectedIds }),
    });

    if (res.ok) {
      toast.success(`${selectedIds.length} participants promoted! 🏆`);
      setSelectedIds([]);
      fetchResults();
    } else {
      toast.error('Failed to promote participants');
    }
  };

  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [cutoffRank, setCutoffRank] = useState(10);

  const handlePromoteTopN = async () => {
    const topIds = results.slice(0, cutoffRank).map(r => r.id);
    if (topIds.length === 0) {
      toast.error('No participants eligible for promotion');
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const res = await fetch(`/api/admin/rounds/${roundId}/promote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ attemptIds: topIds }),
    });

    if (res.ok) {
      toast.success(`Top ${topIds.length} rankers promoted successfully! 🏆`);
      setShowPromoteModal(false);
      fetchResults();
    } else {
      toast.error('Failed to promote rankers');
    }
  };

  // EXCEL EXPORT (Multi-Sheet XLSX)
  const handleExportExcel = () => {
    if (results.length === 0) {
      toast.error('No results to export');
      return;
    }

    // Sheet 1: Rankings
    const rankingsData = results.map((r, idx) => ({
      Rank: `#${idx + 1}`,
      'Full Name': r.participants?.name || r.profiles?.display_name || 'N/A',
      'Register Number': r.participants?.register_no || r.profiles?.register_number || 'N/A',
      'Email ID': r.participants?.email || '—',
      'Phone Number': r.participants?.phone || 'N/A',
      Score: r.score || 0,
      'Time Taken (s)': r.time_taken_seconds || 0,
      Status: r.status,
      'Submitted At': formatDateIST(r.submitted_at),
    }));

    const wsRankings = XLSX.utils.json_to_sheet(rankingsData);
    wsRankings['!cols'] = [{ wch: 8 }, { wch: 24 }, { wch: 18 }, { wch: 28 }, { wch: 16 }, { wch: 10 }, { wch: 16 }, { wch: 14 }, { wch: 22 }];

    // Sheet 2: Summary
    const scores = results.map(r => r.score || 0);
    const avgScore = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2) : 0;
    const maxScore = Math.max(...scores, 0);
    const minScore = Math.min(...scores, 0);

    const summaryData = [
      { Metric: 'Round Title', Value: roundTitle },
      { Metric: 'Total Participants', Value: results.length },
      { Metric: 'Highest Score', Value: maxScore },
      { Metric: 'Lowest Score', Value: minScore },
      { Metric: 'Average Score', Value: avgScore },
      { Metric: 'Export Date', Value: new Date().toLocaleDateString() },
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    wsSummary['!cols'] = [{ wch: 22 }, { wch: 30 }];

    // Sheet 3: Disqualified
    const dqData = results.filter(r => r.status === 'disqualified' || r.disqualified).map((r, idx) => ({
      '#': idx + 1,
      'Full Name': r.participants?.name || r.profiles?.display_name || 'N/A',
      'Register Number': r.participants?.register_no || r.profiles?.register_number || 'N/A',
      Reason: r.disq_reason || 'Proctor violation limit exceeded',
    }));
    const wsDq = XLSX.utils.json_to_sheet(dqData.length > 0 ? dqData : [{ Note: 'No disqualified participants recorded.' }]);

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, wsRankings, 'Rankings');
    XLSX.utils.book_append_sheet(workbook, wsSummary, 'Summary');
    XLSX.utils.book_append_sheet(workbook, wsDq, 'Disqualified');

    XLSX.writeFile(workbook, `results_${roundTitle.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success('Multi-sheet Excel Exported! 📗');
  };

  const filteredResults = results.filter(r => {
    const name = r.participants?.name || r.profiles?.display_name || '';
    const reg = r.participants?.register_no || r.profiles?.register_number || '';
    return name.toLowerCase().includes(searchTerm.toLowerCase()) || reg.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const skeuomorphicShadow = '0 0 0 1px rgba(255,255,255,0.04), 0 4px 24px rgba(0,0,0,0.45), 0 1px 60px rgba(168,85,247,0.04), inset 0 1px 0 rgba(255,255,255,0.09), inset 0 -1px 0 rgba(0,0,0,0.25), inset 1px 0 0 rgba(255,255,255,0.03), inset -1px 0 0 rgba(0,0,0,0.08)';

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto relative z-10">

      {/* HEADER */}
      <FadeIn delay={0}>
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <Link href={`/admin/rounds/${roundId}`}>
              <button className="w-10 h-10 rounded-xl bg-[var(--glass-white)] hover:bg-[var(--glass-purple)] border border-[var(--glass-border)] flex items-center justify-center text-[var(--text-muted)] hover:text-white transition-colors cursor-pointer">
                <ArrowLeft size={18} />
              </button>
            </Link>
            <div>
              <h1 className="font-[family-name:var(--font-display)] font-extrabold text-2xl md:text-3xl gradient-text">
                Round Results & Promotion
              </h1>
              <p className="font-[family-name:var(--font-body)] text-xs text-[var(--text-muted)] font-light">
                {roundTitle || 'Round Results'} · {results.length} total attempts recorded
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <GalaxyButton variant="gold" size="sm" onClick={handleExportExcel}>
              <FileSpreadsheet size={14} /> Official Excel Export (.xlsx)
            </GalaxyButton>
            <GalaxyButton variant="primary" size="sm" onClick={handlePromoteSelected} disabled={selectedIds.length === 0}>
              <Trophy size={14} /> Promote Selected ({selectedIds.length})
            </GalaxyButton>
          </div>
        </div>

        <div className="h-[1px] w-full mt-4 bg-gradient-to-r from-transparent via-[rgba(168,85,247,0.4)] to-transparent" />
      </FadeIn>

      {/* FILTER & SEARCH */}
      <FadeIn delay={0.06}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 bg-[var(--glass-white)] p-2 px-4 rounded-xl border border-[var(--glass-border)] w-full md:w-80">
            <Search size={14} className="text-[var(--text-dim)]" />
            <input
              type="text"
              placeholder="Search by student name or reg no..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none outline-none text-xs text-[var(--text-primary)] placeholder:text-[var(--text-dim)] font-[family-name:var(--font-body)] w-full"
            />
          </div>

          <button onClick={handleSelectAll} className="font-[family-name:var(--font-heading)] text-xs text-[var(--aurora-purple)] hover:underline flex items-center gap-1 cursor-pointer">
            <CheckSquare size={14} /> {selectedIds.length === results.length ? 'Deselect All' : 'Select All'}
          </button>
        </div>
      </FadeIn>

      {/* RESULTS TABLE */}
      <FadeIn delay={0.12}>
        <GlassCard variant="solid" radius={24} hover={false} noHover className="!p-0 border border-[rgba(255,255,255,0.07)]" style={{ boxShadow: skeuomorphicShadow }}>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[rgba(168,85,247,0.16)] bg-[rgba(124,58,237,0.1)] font-[family-name:var(--font-heading)] text-xs text-[var(--aurora-purple)] uppercase tracking-wider">
                  <th className="px-4 py-3.5 text-center w-10">
                    <input type="checkbox" checked={selectedIds.length === results.length && results.length > 0} onChange={handleSelectAll} />
                  </th>
                  <th className="px-4 py-3.5 text-center w-12">Rank</th>
                  <th className="px-4 py-3.5 text-left">Participant</th>
                  <th className="px-4 py-3.5 text-center">Score</th>
                  <th className="px-4 py-3.5 text-center">Time Taken</th>
                  <th className="px-4 py-3.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="py-16 text-center text-xs text-[var(--text-muted)]">Loading results...</td></tr>
                ) : filteredResults.length === 0 ? (
                  <tr><td colSpan={6} className="py-16 text-center text-xs text-[var(--text-dim)]">No results match search.</td></tr>
                ) : (
                  filteredResults.map((r, idx) => {
                    const isSelected = selectedIds.includes(r.id);
                    const rankEmoji = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;
                    const pName = r.participants?.name || r.profiles?.display_name || 'Participant';
                    const pReg = r.participants?.register_no || r.profiles?.register_number || '22EC000';

                    return (
                      <tr key={r.id} className={`border-b border-[rgba(255,255,255,0.04)] hover:bg-[rgba(168,85,247,0.04)] transition-colors ${isSelected ? 'bg-[rgba(168,85,247,0.1)]' : ''}`}>
                        <td className="px-4 py-4 text-center">
                          <input type="checkbox" checked={isSelected} onChange={() => handleToggleSelect(r.id)} />
                        </td>
                        <td className="px-4 py-4 font-[family-name:var(--font-mono)] font-bold text-sm text-center text-[var(--aurora-gold)]">
                          {rankEmoji}
                        </td>
                        <td className="px-4 py-4">
                          <span className="font-[family-name:var(--font-body)] font-semibold text-xs text-[var(--text-primary)] block">
                            {pName}
                          </span>
                          <span className="font-[family-name:var(--font-mono)] text-[10px] text-[var(--text-dim)] font-light">
                            {pReg}
                          </span>
                        </td>
                        <td className="px-4 py-4 font-[family-name:var(--font-mono)] font-extrabold text-sm text-[var(--aurora-cyan)] text-center">
                          {r.score || 0} pts
                        </td>
                        <td className="px-4 py-4 font-[family-name:var(--font-mono)] text-xs text-[var(--text-muted)] text-center">
                          ⏱️ {r.time_taken_seconds ? `${Math.floor(r.time_taken_seconds / 60)}m ${r.time_taken_seconds % 60}s` : 'N/A'}
                        </td>
                        <td className="px-4 py-4 text-right font-[family-name:var(--font-heading)] text-xs">
                          {r.status === 'disqualified' ? (
                            <span className="text-[var(--aurora-rose)] font-bold">DISQUALIFIED</span>
                          ) : r.promoted ? (
                            <span className="text-[var(--aurora-green)] font-bold">PROMOTED 🏆</span>
                          ) : (
                            <span className="text-[var(--text-dim)]">COMPLETED</span>
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

    </div>
  );
}
