'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import Logo from '@/components/shared/Logo';
import GlassCard from '@/components/shared/GlassCard';
import { LayoutDashboard, Award, Trophy, ListOrdered, LogOut, Radio } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ParticipantLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [userName, setUserName] = useState('');
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      // 1. Check local participant session (no password flow)
      const localSessionRaw = localStorage.getItem('participant_session');
      if (localSessionRaw) {
        try {
          const parsed = JSON.parse(localSessionRaw);
          if (parsed.displayName) {
            setUserName(parsed.displayName);
            return;
          }
        } catch {
          // fallback
        }
      }

      // 2. Check Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/quiz');
        return;
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', session.user.id)
        .single();
      setUserName(profile?.display_name || 'Participant');
    };
    fetchUser();
  }, [router]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    localStorage.removeItem('participant_session');
    await supabase.auth.signOut();
    toast.success('Logged out successfully');
    router.push('/quiz');
  };

  const navItems = [
    { label: 'Dashboard', href: '/participant/dashboard', icon: LayoutDashboard },
    { label: 'Rounds', href: '/participant/rounds', icon: ListOrdered },
    { label: 'My Results', href: '/participant/results', icon: Trophy },
    { label: 'Leaderboard', href: '/participant/leaderboard', icon: Radio },
    { label: 'Certificates', href: '/participant/certificate', icon: Award },
  ];

  return (
    <div className="flex min-h-screen text-[var(--text-primary)]">
      {/* Sidebar */}
      <aside
        className="w-64 fixed left-0 top-0 h-full flex flex-col z-40"
        style={{
          background: 'rgba(10, 1, 24, 0.85)',
          borderRight: '1px solid var(--glass-border)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          boxShadow: '4px 0 40px rgba(0,0,0,0.4)',
        }}
      >
        <div className="p-6 border-b border-[var(--glass-border)] flex items-center justify-between">
          <Logo size="sm" />
          <GlassCard variant="purple" radius={9999} hover={false} noHover className="!p-0 px-2.5 py-0.5">
            <span className="font-[family-name:var(--font-heading)] text-[10px] font-bold text-[var(--aurora-purple)] tracking-wider uppercase">
              STUDENT
            </span>
          </GlassCard>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto no-scrollbar">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-link flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-[family-name:var(--font-heading)] font-medium ${
                  isActive
                    ? 'active text-[var(--text-primary)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--aurora-purple)]'
                }`}
              >
                <item.icon size={18} className={isActive ? 'text-[var(--aurora-purple)]' : ''} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[var(--glass-border)]">
          <button
            onClick={handleLogout}
            className="sidebar-link flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-[family-name:var(--font-heading)] font-medium text-[var(--aurora-rose)] w-full hover:bg-[rgba(244,63,94,0.1)] transition-colors cursor-pointer"
          >
            <LogOut size={18} /> Exit Session
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 ml-64 min-h-screen">
        {/* Top Header */}
        <header
          className="sticky top-0 z-30 flex items-center justify-between px-8 py-4 border-b border-[var(--glass-border)]"
          style={{
            background: 'rgba(10, 1, 24, 0.75)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
        >
          <h2 className="font-[family-name:var(--font-display)] font-extrabold text-xl text-[var(--text-primary)]">
            Hello, <span className="gradient-text">{userName}</span> ⚡
          </h2>
          <div className="font-[family-name:var(--font-mono)] text-sm text-[var(--aurora-cyan)] font-medium bg-[var(--glass-purple)] px-4 py-1.5 rounded-full border border-[rgba(168,85,247,0.25)]">
            🕐 {currentTime} IST
          </div>
        </header>

        <div className="p-8 md:p-10 max-w-7xl mx-auto">{children}</div>
      </div>
    </div>
  );
}
