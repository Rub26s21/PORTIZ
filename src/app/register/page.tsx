'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import Link from 'next/link';
import toast from 'react-hot-toast';
import Logo from '@/components/shared/Logo';
import GlowButton from '@/components/shared/GlowButton';
import GlassCard from '@/components/shared/GlassCard';
import { registerSchema, RegisterFormData } from '@/lib/validators';
import { DEPARTMENTS, YEARS } from '@/types/user';
import { Eye, EyeOff, ShieldCheck, Mail, Lock, User, Hash, School, Calendar, CheckSquare } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormData>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const result = await res.json();
      if (!res.ok) { toast.error(result.error || 'Registration failed'); return; }
      toast.success('Registration successful! Please login.');
      router.push('/login');
    } catch { toast.error('Something went wrong.'); }
    finally { setIsLoading(false); }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 40, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} className="relative z-10 w-full max-w-lg">
        <GlassCard variant="elevated" radius={28} className="!p-10" noHover hover={false}>
          <div className="flex justify-center mb-6"><Link href="/"><Logo size="md" /></Link></div>
          <div className="text-center mb-6">
            <span className="font-[family-name:var(--font-heading)] text-[10px] font-medium text-[var(--aurora-purple)] tracking-widest uppercase flex items-center justify-center gap-1.5">
              <ShieldCheck size={12} /> Competition Portal
            </span>
            <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold text-[var(--text-primary)] mt-2">Join the Challenge ✦</h1>
            <p className="font-[family-name:var(--font-body)] text-[var(--text-muted)] text-xs mt-1">Register to participate in the quiz tournament</p>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="form-label flex items-center gap-1.5"><User size={12} className="text-[var(--aurora-purple)]" /> Full Name</label>
              <input {...register('display_name')} className="form-input" placeholder="As printed on certificate" />
              {errors.display_name && <p className="form-error">{errors.display_name.message}</p>}
            </div>
            <div>
              <label className="form-label flex items-center gap-1.5"><Mail size={12} className="text-[var(--aurora-purple)]" /> Email</label>
              <input {...register('email')} type="email" className="form-input" placeholder="your.email@college.edu" />
              {errors.email && <p className="form-error">{errors.email.message}</p>}
            </div>
            <div>
              <label className="form-label flex items-center gap-1.5"><Hash size={12} className="text-[var(--aurora-purple)]" /> Register Number</label>
              <input {...register('register_number')} className="form-input" placeholder="e.g. 2021XXXXX" />
              {errors.register_number && <p className="form-error">{errors.register_number.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label flex items-center gap-1.5"><School size={12} className="text-[var(--aurora-purple)]" /> Department</label>
                <select {...register('department')} className="form-select"><option value="">Select</option>{DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}</select>
                {errors.department && <p className="form-error">{errors.department.message}</p>}
              </div>
              <div>
                <label className="form-label flex items-center gap-1.5"><Calendar size={12} className="text-[var(--aurora-purple)]" /> Year</label>
                <select {...register('year')} className="form-select"><option value="">Select</option>{YEARS.map(y => <option key={y} value={y}>{y}</option>)}</select>
                {errors.year && <p className="form-error">{errors.year.message}</p>}
              </div>
            </div>
            <div>
              <label className="form-label flex items-center gap-1.5"><Lock size={12} className="text-[var(--aurora-purple)]" /> Password</label>
              <div className="relative">
                <input {...register('password')} type={showPassword ? 'text' : 'password'} className="form-input pr-12" placeholder="Minimum 6 characters" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--aurora-purple)]">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="form-error">{errors.password.message}</p>}
            </div>
            <div>
              <label className="form-label flex items-center gap-1.5"><CheckSquare size={12} className="text-[var(--aurora-purple)]" /> Confirm Password</label>
              <div className="relative">
                <input {...register('confirmPassword')} type={showConfirmPassword ? 'text' : 'password'} className="form-input pr-12" placeholder="Re-enter password" />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--aurora-purple)]">
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.confirmPassword && <p className="form-error">{errors.confirmPassword.message}</p>}
            </div>
            <GlowButton type="submit" fullWidth disabled={isLoading} className="!mt-6 !py-3.5">
              {isLoading ? 'Registering...' : 'Complete Registration ⚡'}
            </GlowButton>
          </form>
          <p className="text-center text-[var(--text-muted)] text-xs mt-6 font-[family-name:var(--font-body)]">
            Already registered? <Link href="/login" className="text-[var(--aurora-purple)] hover:underline font-medium">Login here</Link>
          </p>
        </GlassCard>
      </motion.div>
    </div>
  );
}
