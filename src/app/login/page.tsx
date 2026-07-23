'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import toast from 'react-hot-toast';
import Logo from '@/components/shared/Logo';
import GalaxyButton from '@/components/shared/GalaxyButton';
import GlassCard from '@/components/shared/GlassCard';
import { loginSchema, LoginFormData } from '@/lib/validators';
import { supabase } from '@/lib/supabase/client';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      let sessionData: any = null;
      let userRole: string = 'participant';

      try {
        const { data: authData, error } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });

        if (error) {
          setErrorMessage(error.message);
          toast.error(error.message);
          setIsLoading(false);
          return;
        }

        if (authData.session) {
          sessionData = authData.session;
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', authData.user.id)
            .single();

          userRole = profile?.role || 'participant';
        }
      } catch (clientErr) {
        // Fallback to API route if direct Supabase fetch failed
        console.warn('Client Supabase fetch failed, attempting API route fallback:', clientErr);
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: data.email, password: data.password }),
        });

        const resData = await res.json();
        if (!res.ok || resData.error) {
          const msg = resData.error || 'Failed to connect to authentication server.';
          setErrorMessage(msg);
          toast.error(msg);
          setIsLoading(false);
          return;
        }

        if (resData.session) {
          await supabase.auth.setSession(resData.session);
          sessionData = resData.session;
          userRole = resData.role || 'participant';
        }
      }

      if (!sessionData) {
        setErrorMessage('Login failed. Please check your credentials.');
        toast.error('Login failed.');
        setIsLoading(false);
        return;
      }

      toast.success('Welcome back! ⚡');
      router.push(userRole === 'admin' ? '/admin/dashboard' : '/participant/dashboard');
    } catch (err: any) {
      const msg = err?.message || 'Unable to connect to authentication server.';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.94, filter: 'blur(10px)' }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md"
      >
        <GlassCard
          variant="elevated"
          radius={28}
          className="!p-10 md:!p-12 relative overflow-hidden"
          style={{
            border: '1px solid rgba(168,85,247,0.25)',
            boxShadow: '0 0 60px rgba(168,85,247,0.15), 0 0 120px rgba(236,72,153,0.06)',
          }}
          hover={false}
          noHover
        >
          {/* 1. Back link */}
          <div className="mb-6">
            <Link
              href="/"
              className="font-[family-name:var(--font-body)] text-sm text-[var(--text-muted)] hover:text-[var(--aurora-purple)] transition-colors inline-flex items-center gap-1 font-light"
            >
              ← Home
            </Link>
          </div>

          {/* 2. Logo */}
          <div className="flex justify-center mb-4">
            <Link href="/">
              <div style={{ filter: 'drop-shadow(0 0 20px rgba(168,85,247,0.6))' }}>
                <Logo size="md" />
              </div>
            </Link>
          </div>

          {/* 3. Heading & Subtitle */}
          <div className="text-center">
            <h1
              className="font-[family-name:var(--font-display)] font-extrabold text-2xl md:text-3xl"
              style={{
                background: 'linear-gradient(135deg, #F8F4FF 0%, #C4B5FD 50%, #A855F7 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Welcome Back ✦
            </h1>
            <p className="font-[family-name:var(--font-body)] text-xs md:text-sm text-[var(--text-muted)] mt-1.5 font-light">
              Enter your credentials to access the portal
            </p>
          </div>

          {/* 5. Gradient Divider */}
          <hr
            className="border-none h-[1px] my-6"
            style={{
              background: 'linear-gradient(to right, rgba(168,85,247,0.5), rgba(236,72,153,0.3), transparent)',
            }}
          />

          {/* 6. Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="form-label">
                Email Address
              </label>
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                className="form-input"
                placeholder="your@email.com"
              />
              {errors.email && (
                <p className="font-[family-name:var(--font-body)] text-xs text-[var(--aurora-rose)] mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label className="form-label">
                Password
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="form-input pr-12"
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--aurora-purple)] transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="font-[family-name:var(--font-body)] text-xs text-[var(--aurora-rose)] mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Error banner */}
            <AnimatePresence>
              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="flex items-center gap-2 p-3 rounded-xl bg-[rgba(244,63,94,0.12)] border border-[rgba(244,63,94,0.3)] text-[var(--aurora-rose)] text-xs font-[family-name:var(--font-body)]"
                >
                  <AlertCircle size={14} className="flex-shrink-0" />
                  <span>{errorMessage}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="pt-2">
              <GalaxyButton
                type="submit"
                variant="primary"
                fullWidth
                disabled={isLoading}
                loading={isLoading}
                className="!py-3.5"
              >
                Login to Portal →
              </GalaxyButton>
            </div>
          </form>

          {/* 7. Divider */}
          <div className="flex items-center my-5">
            <div className="flex-1 border-t border-[var(--glass-border)] opacity-40" />
            <span className="px-3 font-[family-name:var(--font-body)] text-xs text-[var(--text-dim)] font-light">or</span>
            <div className="flex-1 border-t border-[var(--glass-border)] opacity-40" />
          </div>

          {/* 8. Register link */}
          <p className="text-center font-[family-name:var(--font-body)] text-xs text-[var(--text-muted)]">
            Don&apos;t have an account?{' '}
            <Link
              href="/register"
              className="font-[family-name:var(--font-heading)] font-medium text-[var(--aurora-purple)] hover:underline hover:text-shadow-[0_0_12px_rgba(168,85,247,0.8)] transition-all"
            >
              Register here →
            </Link>
          </p>

          {/* 9. Bottom subtle note for Admin */}
          <p className="text-center font-[family-name:var(--font-body)] text-[11px] text-[var(--text-dim)] mt-4 font-light">
            Staff & Admin?{' '}
            <Link href="/admin/login" className="text-[var(--text-muted)] hover:text-[var(--aurora-purple)] transition-colors">
              Login here →
            </Link>
          </p>
        </GlassCard>
      </motion.div>
    </div>
  );
}
