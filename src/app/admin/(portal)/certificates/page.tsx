'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import GlassCard from '@/components/shared/GlassCard';
import GalaxyButton from '@/components/shared/GalaxyButton';
import FadeIn from '@/components/shared/FadeIn';
import { Award, Download, Sparkles, CheckCircle, Search, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CertificatesPage() {
  const [rounds, setRounds] = useState<any[]>([]);
  const [selectedRoundId, setSelectedRoundId] = useState('');
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [issuing, setIssuing] = useState(false);

  const fetchParticipants = useCallback(async (rId: string) => {
    setLoading(true);
    const { data: attempts } = await supabase
      .from('attempts')
      .select('id, score, status, profiles(id, display_name, register_number, dept)')
      .eq('round_id', rId)
      .eq('status', 'submitted')
      .order('score', { ascending: false });

    setParticipants(attempts || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    const fetchRounds = async () => {
      const { data } = await supabase.from('rounds').select('id, title, round_number').order('round_number', { ascending: true });
      if (data && data.length > 0) {
        setRounds(data);
        setSelectedRoundId(data[0].id);
        fetchParticipants(data[0].id);
      }
    };
    fetchRounds();
  }, [fetchParticipants]);

  const handleRoundChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const rId = e.target.value;
    setSelectedRoundId(rId);
    fetchParticipants(rId);
  };

  const handleIssueAllCertificates = async () => {
    if (participants.length === 0) {
      toast.error('No participants eligible for certificates');
      return;
    }

    setIssuing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch('/api/admin/certificates/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ roundId: selectedRoundId }),
      });

      if (res.ok) {
        toast.success(`Certificates generated for ${participants.length} participants! 🎓`);
      } else {
        toast.error('Failed to generate certificates');
      }
    } catch {
      toast.error('Error generating certificates');
    } finally {
      setIssuing(false);
    }
  };

  const cleanShadow = '0 4px 20px rgba(0,0,0,0.8)';

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto relative z-10" style={{ background: '#000000', minHeight: '100vh', color: '#FFFFFF' }}>

      {/* HEADER */}
      <FadeIn delay={0}>
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.2)] w-fit mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FFFFFF] animate-pulse" />
              <span className="font-[family-name:var(--font-heading)] text-[10px] font-semibold tracking-widest text-[#FFFFFF] uppercase">
                OFFICIAL ISSUANCE
              </span>
            </div>
            <h1 className="font-[family-name:var(--font-display)] font-extrabold text-2xl md:text-3xl text-[#FFFFFF]">
              Certificates Generator
            </h1>
            <p className="font-[family-name:var(--font-body)] text-xs md:text-sm text-[#94A3B8] font-light mt-0.5">
              Issue verified digital certificates of completion and achievement
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select value={selectedRoundId} onChange={handleRoundChange} className="form-input bg-[#000000] text-[#FFFFFF] font-[family-name:var(--font-heading)] text-xs border border-[rgba(255,255,255,0.2)]">
              {rounds.map(r => (
                <option key={r.id} value={r.id}>Round {r.round_number}: {r.title}</option>
              ))}
            </select>

            <GalaxyButton variant="gold" size="sm" onClick={handleIssueAllCertificates} loading={issuing} disabled={issuing || participants.length === 0}>
              <Award size={14} /> Issue All Certificates ({participants.length})
            </GalaxyButton>
          </div>
        </div>

        <div className="h-[1px] w-full mt-4 bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.2)] to-transparent" />
      </FadeIn>

      {/* LIVE HOLOGRAPHIC CERTIFICATE PREVIEW CARD */}
      <FadeIn delay={0.06}>
        <GlassCard variant="elevated" radius={24} hover={false} noHover className="!p-8 border border-[rgba(255,255,255,0.2)] relative overflow-hidden text-center space-y-4" style={{ boxShadow: cleanShadow, background: '#000000' }}>
          <Award size={48} className="mx-auto text-[#FFFFFF]" />
          <div>
            <span className="font-[family-name:var(--font-heading)] font-semibold text-xs tracking-widest text-[#94A3B8] uppercase block">
              ELECTRONIC CLUB QUIZ CHAMPIONSHIP 2026
            </span>
            <h2 className="font-[family-name:var(--font-display)] font-extrabold text-2xl text-[#FFFFFF] mt-1">
              Certificate of Excellence
            </h2>
            <p className="font-[family-name:var(--font-body)] text-xs text-[#94A3B8] mt-2 font-light max-w-lg mx-auto">
              This certifies that student participants completing this round are granted official digitally verifiable credentials from the Electronic Club.
            </p>
          </div>
        </GlassCard>
      </FadeIn>

      {/* ELIGIBLE PARTICIPANTS TABLE */}
      <FadeIn delay={0.12}>
        <GlassCard variant="solid" radius={24} hover={false} noHover className="!p-0 border border-[rgba(255,255,255,0.12)] overflow-hidden" style={{ boxShadow: cleanShadow, background: '#000000' }}>
          <div className="p-4 border-b border-[rgba(255,255,255,0.08)] font-[family-name:var(--font-display)] font-bold text-sm text-[#FFFFFF]">
            Eligible Participants for Certificate Generation ({participants.length})
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.04)] font-[family-name:var(--font-heading)] text-xs text-[#FFFFFF] uppercase tracking-wider">
                  <th className="px-4 py-3.5 text-left">Participant Name</th>
                  <th className="px-4 py-3.5 text-center">Register No</th>
                  <th className="px-4 py-3.5 text-center">Score</th>
                  <th className="px-4 py-3.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4} className="py-12 text-center text-xs text-[#94A3B8]">Loading participants...</td></tr>
                ) : participants.length === 0 ? (
                  <tr><td colSpan={4} className="py-12 text-center text-xs text-[#64748B]">No eligible completed attempts found.</td></tr>
                ) : (
                  participants.map((p) => (
                    <tr key={p.id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.04)] transition-colors">
                      <td className="px-4 py-3.5 font-[family-name:var(--font-body)] font-semibold text-xs text-[#FFFFFF]">
                        {p.profiles?.display_name || 'Student'}
                      </td>
                      <td className="px-4 py-3.5 font-[family-name:var(--font-mono)] text-xs text-[#94A3B8] text-center">
                        {p.profiles?.register_number || '22EC000'}
                      </td>
                      <td className="px-4 py-3.5 font-[family-name:var(--font-mono)] font-bold text-xs text-[#00B0FF] text-center">
                        {p.score} pts
                      </td>
                      <td className="px-4 py-3.5 text-right font-[family-name:var(--font-heading)] text-xs text-[#FFFFFF] font-semibold">
                        READY TO ISSUE ✦
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
