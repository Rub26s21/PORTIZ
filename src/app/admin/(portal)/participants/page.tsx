'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import GlassCard from '@/components/shared/GlassCard';
import GalaxyButton from '@/components/shared/GalaxyButton';
import FadeIn from '@/components/shared/FadeIn';
import { getInitials, formatDateIST } from '@/lib/utils';
import { Users, Search, Download, FileSpreadsheet } from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

export default function ParticipantsPage() {
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchParticipants = useCallback(async () => {
    // Fetch participants with their attempts count and max score
    const { data: partData, error } = await supabase
      .from('participants')
      .select('id, name, register_no, email, phone, created_at')
      .order('created_at', { ascending: false });

    if (error || !partData) {
      setLoading(false);
      return;
    }

    const enriched = await Promise.all(
      partData.map(async (p) => {
        const { data: attempts } = await supabase
          .from('attempts')
          .select('score, status')
          .eq('participant_id', p.id);

        const attemptsCount = (attempts || []).length;
        const bestScore = (attempts || []).reduce((max, a) => Math.max(max, a.score || 0), 0);

        return {
          ...p,
          attempts_count: attemptsCount,
          best_score: bestScore,
        };
      })
    );

    setParticipants(enriched);
    setLoading(false);
  }, []);

  useEffect(() => { fetchParticipants(); }, [fetchParticipants]);

  // CSV EXPORT
  const handleExportCSV = () => {
    if (participants.length === 0) {
      toast.error('No participant data to export');
      return;
    }
    const headers = ['Full Name,Register Number,Email,Phone,Registered At,Rounds Attempted,Best Score'];
    const rows = participants.map((p) =>
      `"${p.name || ''}","${p.register_no || ''}","${p.email || '—'}","${p.phone || ''}","${p.created_at || ''}","${p.attempts_count || 0}","${p.best_score || 0}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `participants_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    toast.success('CSV Exported! 📊');
  };

  // EXCEL EXPORT (XLSX)
  const handleExportExcel = () => {
    if (participants.length === 0) {
      toast.error('No participant data to export');
      return;
    }

    const excelData = participants.map((p, idx) => ({
      '#': idx + 1,
      'Full Name': p.name || 'N/A',
      'Register Number': p.register_no || 'N/A',
      'Email ID': p.email || '—',
      'Phone Number': p.phone || 'N/A',
      'Registered Date': formatDateIST(p.created_at),
      'Rounds Attempted': p.attempts_count || 0,
      'Best Score': p.best_score || 0,
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Auto Column Widths
    worksheet['!cols'] = [
      { wch: 6 },
      { wch: 24 },
      { wch: 16 },
      { wch: 28 },
      { wch: 16 },
      { wch: 22 },
      { wch: 18 },
      { wch: 14 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Participants');
    XLSX.writeFile(workbook, `participants_${new Date().toISOString().slice(0, 10)}.xlsx`);

    toast.success('Excel Sheet Exported! 📗');
  };

  const filtered = participants.filter(
    (p) =>
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.register_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.phone?.includes(searchTerm)
  );

  const cleanShadow = '0 4px 20px rgba(0,0,0,0.8)';

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto relative z-10" style={{ background: '#000000', minHeight: '100vh', color: '#FFFFFF' }}>

      {/* HEADER */}
      <FadeIn delay={0}>
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.2)] w-fit mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FFFFFF] animate-pulse" />
              <span className="font-[family-name:var(--font-heading)] text-[10px] font-semibold tracking-widest text-[#FFFFFF] uppercase">
                STUDENT DIRECTORY
              </span>
            </div>
            <h1 className="font-[family-name:var(--font-display)] font-extrabold text-2xl md:text-3xl text-[#FFFFFF]">
              Participant Data View
            </h1>
            <p className="font-[family-name:var(--font-body)] text-xs md:text-sm text-[#94A3B8] font-light mt-0.5">
              {participants.length} registered students (Name, Register No, Phone)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <GalaxyButton variant="secondary" size="sm" onClick={handleExportCSV}>
              <Download size={14} /> Export CSV
            </GalaxyButton>
            <GalaxyButton variant="gold" size="sm" onClick={handleExportExcel}>
              <FileSpreadsheet size={14} /> Export Excel
            </GalaxyButton>
          </div>
        </div>

        <div className="h-[1px] w-full mt-4 bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.2)] to-transparent" />
      </FadeIn>

      {/* SEARCH INPUT */}
      <FadeIn delay={0.06}>
        <div className="flex items-center gap-2 bg-[#000000] p-2.5 px-4 rounded-xl border border-[rgba(255,255,255,0.12)] max-w-md">
          <Search size={14} className="text-[#94A3B8]" />
          <input
            type="text"
            placeholder="Search by name, register number, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-none outline-none text-xs text-[#FFFFFF] placeholder:text-[#64748B] font-[family-name:var(--font-body)] w-full"
          />
        </div>
      </FadeIn>

      {/* PARTICIPANTS TABLE */}
      <FadeIn delay={0.12}>
        <GlassCard variant="solid" radius={22} hover={false} noHover className="!p-0 border border-[rgba(255,255,255,0.12)] overflow-hidden" style={{ boxShadow: cleanShadow, background: '#000000' }}>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.04)] font-[family-name:var(--font-heading)] text-xs text-[#FFFFFF] uppercase tracking-wider">
                  <th className="px-5 py-3.5 w-12 text-center">#</th>
                  <th className="px-5 py-3.5">Full Name</th>
                  <th className="px-5 py-3.5">Register Number</th>
                  <th className="px-5 py-3.5">Email</th>
                  <th className="px-5 py-3.5">Phone Number</th>
                  <th className="px-5 py-3.5">Registered At</th>
                  <th className="px-5 py-3.5 text-center">Attempts</th>
                  <th className="px-5 py-3.5 text-center">Best Score</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="py-16 text-center text-xs text-[#94A3B8]">Loading participants...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={8} className="py-16 text-center text-xs text-[#64748B]">No participants match your search query.</td></tr>
                ) : (
                  filtered.map((p, idx) => (
                    <tr key={p.id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.04)] transition-colors">
                      <td className="px-5 py-4 font-[family-name:var(--font-mono)] text-xs text-[#94A3B8] text-center font-semibold">
                        {idx + 1}
                      </td>
                      <td className="px-5 py-4 font-[family-name:var(--font-body)] font-semibold text-xs text-[#FFFFFF]">
                        {p.name || 'Participant'}
                      </td>
                      <td className="px-5 py-4 font-[family-name:var(--font-mono)] font-bold text-xs text-[#FFFFFF]">
                        {p.register_no}
                      </td>
                      <td className="px-5 py-4 font-[family-name:var(--font-body)] text-xs text-[#94A3B8] font-light">
                        {p.email || '—'}
                      </td>
                      <td className="px-5 py-4 font-[family-name:var(--font-mono)] text-xs text-[#E2E8F0]">
                        {p.phone}
                      </td>
                      <td className="px-5 py-4 font-[family-name:var(--font-mono)] text-[11px] text-[#64748B]">
                        {formatDateIST(p.created_at)}
                      </td>
                      <td className="px-5 py-4 font-[family-name:var(--font-mono)] font-semibold text-xs text-[#00B0FF] text-center">
                        {p.attempts_count || 0}
                      </td>
                      <td className="px-5 py-4 font-[family-name:var(--font-mono)] font-extrabold text-xs text-[#FFFFFF] text-center">
                        {p.best_score || 0} pts
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
