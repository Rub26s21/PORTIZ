'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/lib/supabase/client';
import GlassCard from '@/components/shared/GlassCard';
import GalaxyButton from '@/components/shared/GalaxyButton';
import FadeIn from '@/components/shared/FadeIn';
import { roundSchema, RoundFormData } from '@/lib/validators';
import { ArrowLeft, Check, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CreateRoundPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(roundSchema),
    defaultValues: {
      round_number: 1,
      title: '',
      description: '',
      start_time: '',
      end_time: '',
      duration_minutes: 30,
      randomize_questions: true,
      randomize_options: true,
      negative_marking: false,
      negative_marks_per_wrong: 0.25,
      requires_promotion: false,
      show_results: false,
      show_leaderboard: true,
      status: 'draft' as const,
    },
  });

  const negativeMarking = watch('negative_marking');
  const status = watch('status');

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Authentication required');
        router.push('/admin/login');
        return;
      }

      const res = await fetch('/api/admin/rounds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create round');
      }

      toast.success('Round created successfully! ⚡');
      router.push('/admin/rounds');
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const skeuomorphicShadow = '0 0 0 1px rgba(255,255,255,0.04), 0 4px 24px rgba(0,0,0,0.45), 0 1px 60px rgba(168,85,247,0.04), inset 0 1px 0 rgba(255,255,255,0.09), inset 0 -1px 0 rgba(0,0,0,0.25), inset 1px 0 0 rgba(255,255,255,0.03), inset -1px 0 0 rgba(0,0,0,0.08)';

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-4xl mx-auto relative z-10">

      {/* HEADER */}
      <FadeIn delay={0}>
        <div className="flex items-center gap-4 mb-2">
          <Link href="/admin/rounds">
            <button className="w-10 h-10 rounded-xl bg-[var(--glass-white)] hover:bg-[var(--glass-purple)] border border-[var(--glass-border)] flex items-center justify-center text-[var(--text-muted)] hover:text-white transition-colors cursor-pointer">
              <ArrowLeft size={18} />
            </button>
          </Link>
          <div>
            <h1 className="font-[family-name:var(--font-display)] font-bold text-2xl md:text-3xl gradient-text">
              Create Competition Round
            </h1>
            <p className="font-[family-name:var(--font-body)] text-xs md:text-sm text-[var(--text-muted)] font-light">
              Configure parameters, rules, timing, and security for the new round
            </p>
          </div>
        </div>
      </FadeIn>

      {/* FORM CARD */}
      <FadeIn delay={0.06}>
        <GlassCard variant="elevated" radius={24} hover={false} noHover className="!p-8 border border-white/15" style={{ boxShadow: skeuomorphicShadow, background: '#000000' }}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

            {/* 1. ROUND TITLE (Preset selector & Custom Input) */}
            <div className="space-y-3">
              <h3 className="font-[family-name:var(--font-display)] font-bold text-base text-white flex items-center gap-2">
                <Sparkles size={16} className="text-[#FF0033]" /> 1. Round Title Selection
              </h3>

              <div className="flex flex-wrap gap-2 mb-2">
                {['First Round', 'Second Round', 'Third Round', 'Qualifier Round', 'Grand Finale'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setValue('title', preset)}
                    className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/15 text-xs text-white font-medium transition-all cursor-pointer"
                  >
                    + {preset}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="form-label text-xs text-[#CBD5E1]">Round Number</label>
                  <input
                    type="number"
                    {...register('round_number', { valueAsNumber: true })}
                    className="form-input font-[family-name:var(--font-mono)] bg-black text-white border border-white/15"
                    min={1}
                  />
                  {errors.round_number && <p className="form-error text-xs">{errors.round_number.message}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="form-label text-xs text-[#CBD5E1]">Round Title <span className="text-[#FF0033]">*</span></label>
                  <input
                    type="text"
                    {...register('title')}
                    placeholder="e.g. First Round / Second Round / Grand Finale"
                    className="form-input bg-black text-white border border-white/15 font-semibold"
                  />
                  {errors.title && <p className="form-error text-xs">{errors.title.message}</p>}
                </div>
              </div>
            </div>

            <div className="h-[1px] bg-white/10" />

            {/* 2. TIMING & DURATION */}
            <div className="space-y-4">
              <h3 className="font-[family-name:var(--font-display)] font-bold text-base text-white flex items-center gap-2">
                <Sparkles size={16} className="text-[#FF0033]" /> 2. Round Duration (Minutes Active)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label text-xs text-[#CBD5E1]">Total Minutes Active (Duration) <span className="text-[#FF0033]">*</span></label>
                  <input
                    type="number"
                    {...register('duration_minutes', { valueAsNumber: true })}
                    placeholder="e.g. 30, 45, 60"
                    className="form-input font-[family-name:var(--font-mono)] font-bold text-base bg-black text-white border border-white/15"
                    min={1}
                  />
                  {errors.duration_minutes && <p className="form-error text-xs">{errors.duration_minutes.message}</p>}
                </div>
              </div>
            </div>

            <div className="h-[1px] bg-white/10" />

            {/* 3. NUMBER OF PARTICIPANTS ALLOWED */}
            <div className="space-y-3">
              <h3 className="font-[family-name:var(--font-display)] font-bold text-base text-white flex items-center gap-2">
                <Sparkles size={16} className="text-[#FF0033]" /> 3. Participant Limit & Capacity
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label text-xs text-[#CBD5E1]">Max Number of Participants Allowed</label>
                  <input
                    type="number"
                    placeholder="e.g. 100, 500 (or leave 0 for Unlimited)"
                    className="form-input font-[family-name:var(--font-mono)] bg-black text-white border border-white/15"
                    min={0}
                    defaultValue={100}
                  />
                  <p className="text-[11px] text-[#94A3B8] font-light mt-1">
                    Set a maximum capacity for student entries or set to 0 for unlimited entries.
                  </p>
                </div>
              </div>
            </div>

            <div className="h-[1px] bg-white/10" />

            {/* 4. SHUFFLING QUESTIONS & CUSTOMIZATION OPTIONS */}
            <div className="space-y-4">
              <h3 className="font-[family-name:var(--font-display)] font-bold text-base text-white flex items-center gap-2">
                <Sparkles size={16} className="text-[#FF0033]" /> 4. Shuffling & Customization Options
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { id: 'randomize_questions', label: "Shuffle Questions for Each Participant", sub: "Randomize question order per student attempt" },
                  { id: 'randomize_options', label: "Shuffle MCQ Options", sub: "Randomize choice order (A, B, C, D) per student" },
                  { id: 'requires_promotion', label: "Requires Promotion", sub: "Only students promoted from prior rounds can attempt" },
                  { id: 'negative_marking', label: "Negative Marking", sub: "Deduct marks for incorrect attempts" },
                  { id: 'show_results', label: "Show Results Immediately", sub: "Display score right after test submission" },
                  { id: 'show_leaderboard', label: "Public Leaderboard", sub: "Publish round rankings publicly" },
                ].map((item) => (
                  <div key={item.id} className="p-4 rounded-xl bg-black/60 border border-white/12 flex items-center justify-between">
                    <div>
                      <span className="font-[family-name:var(--font-heading)] font-bold text-xs text-white block">
                        {item.label}
                      </span>
                      <span className="font-[family-name:var(--font-body)] text-[11px] text-[#94A3B8] font-light block">
                        {item.sub}
                      </span>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        {...register(item.id as any)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF0033]" />
                    </label>
                  </div>
                ))}
              </div>

              {/* Round Scope Description */}
              <div>
                <label className="form-label text-xs text-[#CBD5E1]">Additional Customization Scope & Instructions</label>
                <textarea
                  {...register('description')}
                  rows={2}
                  placeholder="Enter round scope, rules, or custom instructions..."
                  className="form-input bg-black text-white border border-white/15 resize-none text-xs"
                />
              </div>
            </div>

            <div className="h-[1px] bg-white/10" />

            {/* STATUS SELECT */}
            <div>
              <label className="form-label text-xs mb-2 text-[#CBD5E1]">Initial Round Status</label>
              <div className="grid grid-cols-4 gap-3">
                {['draft', 'published', 'live', 'closed'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setValue('status', st as any)}
                    className={`py-2.5 rounded-xl font-[family-name:var(--font-heading)] text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      status === st
                        ? 'bg-[#FF0033] border border-white/40 text-white shadow-sm'
                        : 'bg-black/60 border border-white/15 text-[#94A3B8] hover:text-white'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* SUBMIT BUTTON */}
            <div className="pt-4 flex justify-end gap-3">
              <Link href="/admin/rounds">
                <GalaxyButton variant="secondary" size="md">Cancel</GalaxyButton>
              </Link>
              <GalaxyButton variant="primary" size="md" type="submit" loading={loading} disabled={loading}>
                <Check size={16} /> Save Competition Round
              </GalaxyButton>
            </div>

          </form>
        </GlassCard>
      </FadeIn>

    </div>
  );
}
