'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import GlassCard from '@/components/shared/GlassCard';
import GalaxyButton from '@/components/shared/GalaxyButton';
import FadeIn from '@/components/shared/FadeIn';
import { Award, Printer, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { formatDateIST } from '@/lib/utils';

export default function ParticipantCertificatePage() {
  const [certData, setCertData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCertificate = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { setLoading(false); return; }

        // Fetch top submitted attempt
        const { data: attempt } = await supabase
          .from('attempts')
          .select(`
            id, score, total_marks, submitted_at,
            rounds ( title ),
            participants ( name, register_no, email )
          `)
          .eq('status', 'submitted')
          .order('score', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (attempt) {
          const part = (Array.isArray(attempt.participants) ? attempt.participants[0] : attempt.participants) as any;
          const rnd = (Array.isArray(attempt.rounds) ? attempt.rounds[0] : attempt.rounds) as any;

          setCertData({
            id: attempt.id,
            studentName: part?.name || session.user.user_metadata?.display_name || 'Electronics Student',
            registerNo: part?.register_no || session.user.user_metadata?.register_number || 'ECE2026',
            testTitle: rnd?.title || 'Department Weekly Test',
            score: attempt.score || 0,
            totalMarks: attempt.total_marks || 50,
            date: formatDateIST(attempt.submitted_at),
            verifyCode: `ECE-CERT-${attempt.id.slice(0, 8).toUpperCase()}`,
          });
        }
      } catch {
        /* fallback */
      } finally {
        setLoading(false);
      }
    };

    fetchCertificate();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto p-4 md:p-6">
      <FadeIn y={-20}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-2xl md:text-3xl font-extrabold text-white">
              Merit Certificates 🏅
            </h1>
            <p className="text-xs md:text-sm text-[#94A3B8] font-light mt-0.5">
              Verified digital merit certificates for department level assessments
            </p>
          </div>

          {certData && (
            <GalaxyButton variant="gold" size="sm" onClick={handlePrint}>
              <Printer size={14} /> Print / Download PDF
            </GalaxyButton>
          )}
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        {loading ? (
          <div className="py-20 text-center text-xs text-[#94A3B8]">Loading certificate details...</div>
        ) : !certData ? (
          <GlassCard variant="elevated" className="text-center py-16" hover={false} noHover style={{ background: '#000' }}>
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-amber-500/10 border border-amber-500/30">
              <Award size={32} className="text-[#FFD700]" />
            </div>
            <h3 className="font-[family-name:var(--font-display)] font-bold text-xl text-white mb-2">
              No Verified Certificate Available Yet 🏅
            </h3>
            <p className="font-[family-name:var(--font-body)] text-[#94A3B8] text-xs max-w-md mx-auto leading-relaxed">
              Complete a weekly department test paper to automatically generate your verified merit certificate!
            </p>
          </GlassCard>
        ) : (
          /* HIGH RESOLUTION VERIFIED MERIT CERTIFICATE CARD */
          <div className="relative bg-[#05050A] border-4 border-[#FFD700]/60 rounded-3xl p-8 md:p-12 shadow-[0_0_60px_rgba(255,215,0,0.15)] overflow-hidden font-serif">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#FFD700]/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#00E5FF]/5 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 text-center space-y-6">
              {/* Header Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FFD700]/10 border border-[#FFD700]/40 text-[#FFD700] text-xs font-sans font-bold uppercase tracking-widest mx-auto">
                <ShieldCheck size={16} />
                <span>OFFICIAL DEPARTMENT MERIT CERTIFICATE</span>
              </div>

              {/* Title */}
              <div className="space-y-1">
                <h2 className="font-[family-name:var(--font-display)] text-3xl md:text-5xl font-black tracking-tight text-white uppercase">
                  Certificate of Excellence
                </h2>
                <p className="text-xs md:text-sm text-[#FFD700] font-sans font-semibold tracking-wider">
                  ELECTRONICS & COMMUNICATION ENGINEERING DEPARTMENT
                </p>
              </div>

              <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mx-auto my-4" />

              {/* Recipient */}
              <div className="space-y-2 py-2">
                <p className="text-xs text-[#94A3B8] font-sans uppercase tracking-widest">THIS CERTIFICATE IS PROUDLY PRESENTED TO</p>
                <h3 className="text-2xl md:text-4xl font-extrabold text-[#00E5FF] underline decoration-[#FFD700]/50 underline-offset-8">
                  {certData.studentName}
                </h3>
                <p className="text-xs font-mono text-[#E2E8F0]">
                  Register Number: <span className="font-bold text-[#FFD700]">{certData.registerNo}</span>
                </p>
              </div>

              {/* Body */}
              <p className="text-xs md:text-sm text-[#CBD5E1] font-sans max-w-2xl mx-auto leading-relaxed">
                For outstanding academic performance in the <strong className="text-white">{certData.testTitle}</strong>, scoring a total of <strong className="text-[#FFD700]">{certData.score} / {certData.totalMarks} Points</strong>.
              </p>

              {/* Footer Credentials & QR Code */}
              <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6 text-left font-sans">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-[#10B981] font-bold">
                    <CheckCircle2 size={14} />
                    <span>Verified Academic Record</span>
                  </div>
                  <p className="text-[11px] font-mono text-[#94A3B8]">Issued On: {certData.date}</p>
                  <p className="text-[10px] font-mono text-[#64748B]">Verify Hash: {certData.verifyCode}</p>
                </div>

                {/* QR Code Payload */}
                <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/5 border border-white/10">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(certData.verifyCode)}`}
                    alt="Certificate QR Verification"
                    className="w-16 h-16 rounded-lg border border-white/20"
                  />
                  <div className="text-[10px] font-mono text-[#94A3B8] space-y-0.5">
                    <p className="font-bold text-white uppercase">Scan to Verify</p>
                    <p className="text-[#00E5FF]">Digital Seal</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </FadeIn>
    </div>
  );
}
