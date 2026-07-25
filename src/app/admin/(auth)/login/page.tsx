'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { loginSchema, LoginFormData } from '@/lib/validators';
import { supabase } from '@/lib/supabase/client';
import { Eye, EyeOff, Lock, Mail, ShieldCheck, Zap } from 'lucide-react';
import GalaxyButton from '@/components/shared/GalaxyButton';
import Logo3DSpinner from '@/components/shared/Logo3DSpinner';

export default function CleanAdminLoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const autofillAndLoginDemo = async () => {
    setValue('email', 'admin@electronicclub.edu');
    setValue('password', 'ElectronicClub@2026');
    toast.success('Demo credentials loaded. Signing in...');
    await onSubmit({ email: 'admin@electronicclub.edu', password: 'ElectronicClub@2026' });
  };

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email, password: data.password }),
      });

      const resData = await res.json();
      if (!res.ok || resData.error) {
        const msg = resData.error || 'Authentication failed. Please check your credentials.';
        setErrorMessage(msg);
        toast.error(msg);
        setIsLoading(false);
        return;
      }

      if (resData.role !== 'admin') {
        const msg = 'Admin access required. This account does not have staff privileges.';
        setErrorMessage(msg);
        toast.error(msg);
        setIsLoading(false);
        return;
      }

      if (resData.session) {
        try {
          await supabase.auth.setSession(resData.session);
        } catch {
          // fallback
        }
      }

      localStorage.setItem('admin_session', JSON.stringify({
        displayName: resData.user?.display_name || 'Admin',
        email: data.email,
        role: 'admin',
      }));

      toast.success('Admin authorization granted 🛡️');
      router.push('/admin/dashboard');
    } catch (err: any) {
      const msg = err?.message || 'Unable to connect to authentication server.';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen relative flex flex-col justify-between p-6 md:p-10 select-none overflow-hidden"
      style={{
        background: '#000000',
        color: '#FFFFFF',
        fontFamily: '"Times New Roman", Times, serif',
      }}
    >
      {/* ═══ TOP BAR ═══ */}
      <header className="w-full flex items-center justify-between z-20">
        {/* Top Left: Logo & Club Name */}
        <div className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="Electronics Club Logo"
            width={42}
            height={42}
            className="object-contain"
            priority
          />
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-wide text-[#FFFFFF]" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
              ELECTRONICS CLUB
            </span>
            <span className="text-xs text-[#94A3B8] tracking-widest uppercase">
              Master Control Portal
            </span>
          </div>
        </div>

        {/* Top Right: Completely Empty */}
        <div />
      </header>

      {/* ═══ MAIN CENTER LOGIN CARD (APPLE MAC FROSTED GLASS STYLE) ═══ */}
      <main className="flex-1 flex items-center justify-center my-8 z-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md"
        >
          <div
            className="p-8 md:p-10 rounded-3xl relative overflow-hidden"
            style={{
              background: 'rgba(18, 18, 18, 0.75)',
              backdropFilter: 'blur(28px)',
              WebkitBackdropFilter: 'blur(28px)',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.95), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            }}
          >
            {/* Top Mac Card Header */}
            <div className="text-center space-y-2 mb-6">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.18)] flex items-center justify-center text-white mb-3">
                <ShieldCheck size={28} />
              </div>

              <h1 className="text-3xl font-bold text-[#FFFFFF]" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
                Administrator Sign In
              </h1>

              {/* 2-Line Greeting Message in Times New Roman */}
              <div className="space-y-1 text-sm text-[#CCCCCC] font-normal leading-snug pt-1" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
                <p>Welcome to the Electronics Club Master Control Portal.</p>
                <p>Please sign in with your administrative credentials to manage competition rounds.</p>
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#E2E8F0] mb-1.5 uppercase tracking-wider" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
                  Admin Email Address
                </label>
                <input
                  {...register('email')}
                  type="email"
                  placeholder="rubahanponraj@gmail.com"
                  className="w-full bg-[#000000] border border-[rgba(255,255,255,0.2)] rounded-xl px-4 py-3 text-sm text-[#FFFFFF] outline-none focus:border-white transition-all"
                  style={{ fontFamily: '"Times New Roman", Times, serif' }}
                />
                {errors.email && <p className="text-xs text-[#FF4569] mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#E2E8F0] mb-1.5 uppercase tracking-wider" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
                  Password
                </label>
                <div className="relative">
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    className="w-full bg-[#000000] border border-[rgba(255,255,255,0.2)] rounded-xl px-4 py-3 text-sm text-[#FFFFFF] outline-none focus:border-white transition-all pr-12"
                    style={{ fontFamily: '"Times New Roman", Times, serif' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-white cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-[#FF4569] mt-1">{errors.password.message}</p>}
              </div>

              {/* Error Banner */}
              <AnimatePresence>
                {errorMessage && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-3 rounded-xl bg-[rgba(255,0,51,0.15)] border border-[rgba(255,0,51,0.3)] text-[#FF4569] text-xs text-center"
                    style={{ fontFamily: '"Times New Roman", Times, serif' }}
                  >
                    {errorMessage}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-6 rounded-xl bg-[#FFFFFF] hover:bg-[#E2E8F0] text-[#000000] font-bold text-sm uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ fontFamily: '"Times New Roman", Times, serif' }}
              >
                {isLoading ? <Logo3DSpinner size="xs" /> : 'SIGN IN TO DASHBOARD'}
              </button>
            </form>
          </div>
        </motion.div>
      </main>

      {/* ═══ FOOTER ═══ */}
      <footer className="w-full text-center text-xs text-[#64748B] z-20" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
        © 2026 Electronics Club Quiz Championship · Authorized Staff Access Only
      </footer>
    </div>
  );
}
