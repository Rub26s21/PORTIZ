'use client';

import { useEffect, useState, ReactNode, Component, ErrorInfo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase/client';
import Logo from '@/components/shared/Logo';
import GlassCard from '@/components/shared/GlassCard';
import { getInitials } from '@/lib/utils';
import {
  LayoutDashboard, Trophy, Users2, BarChart3, Award, Settings2, LogOut, Activity, Globe, ExternalLink, Search, Bell, ChevronRight, HelpCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

// ── ERROR BOUNDARY FOR RESILIENT RENDERING ──
interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class AdminErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('AdminPortalLayout catch:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          background: '#000000',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px',
          fontFamily: 'DM Mono, monospace'
        }}>
          <div style={{
            background: 'rgba(255,0,51,0.08)',
            border: '1px solid rgba(255,0,51,0.3)',
            borderRadius: '16px',
            padding: '32px 40px',
            maxWidth: '560px',
            width: '100%',
            backdropFilter: 'blur(20px)'
          }}>
            <div style={{ color: '#FF0033', fontSize: '1.5rem', fontFamily: 'Syne, sans-serif', fontWeight: 800 }}>
              ⚠ Dashboard Layout Error
            </div>
            <div style={{ color: '#5A6A99', fontSize: '0.875rem', marginTop: '12px' }}>
              {this.state.error?.message || 'An unexpected rendering error occurred.'}
            </div>
            <div style={{ color: '#2A3555', fontSize: '0.75rem', marginTop: '8px' }}>
              Check browser console for full stack trace.
            </div>
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: '20px',
                padding: '10px 24px',
                background: 'linear-gradient(135deg, #C62828, #FF0033)',
                border: 'none',
                borderRadius: '9999px',
                color: 'white',
                cursor: 'pointer',
                fontFamily: 'Kanit, sans-serif',
                fontSize: '0.875rem'
              }}>
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function AdminLayoutShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [userName, setUserName] = useState('');
  const [hasLiveRound, setHasLiveRound] = useState(false);
  const [liveRoundId, setLiveRoundId] = useState<string | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const localAdminSession = typeof window !== 'undefined' ? localStorage.getItem('admin_session') : null;
      if (localAdminSession) {
        try {
          const parsed = JSON.parse(localAdminSession);
          if (parsed.role === 'admin') {
            setUserName(parsed.displayName || 'Demo Admin');
            return;
          }
        } catch {}
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, role')
            .eq('id', session.user.id)
            .single();

          if (profile?.role === 'admin') {
            setUserName(profile?.display_name || 'Admin');
          } else {
            setUserName('Admin Host');
          }
        } else {
          setUserName('Admin Host');
        }

        const { data: liveRound } = await supabase
          .from('rounds')
          .select('id')
          .eq('status', 'live')
          .limit(1)
          .single();

        if (liveRound) {
          setHasLiveRound(true);
          setLiveRoundId(liveRound.id);
        } else {
          setHasLiveRound(false);
          setLiveRoundId(null);
        }
      } catch (err) {
        console.warn('Auth check fallback:', err);
        setUserName('Admin Host');
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    localStorage.removeItem('admin_session');
    await supabase.auth.signOut();
    toast.success('Logged out successfully');
    router.push('/admin/login');
  };

  const navItems: { label: string; href: string; icon: any; isLive?: boolean }[] = [
    { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Rounds', href: '/admin/rounds', icon: Trophy },
    { label: 'Questions Bank', href: '/admin/questions', icon: HelpCircle },
    { label: 'Participants', href: '/admin/participants', icon: Users2 },
    { label: 'Leaderboard', href: '/admin/leaderboard', icon: BarChart3 },
    { label: 'Certificates', href: '/admin/certificates', icon: Award },
    { label: 'Settings', href: '/admin/settings', icon: Settings2 },
  ];

  const getBreadcrumbName = () => {
    if (pathname.includes('/admin/dashboard')) return 'Dashboard';
    if (pathname.includes('/admin/rounds/create')) return 'Create Round';
    if (pathname.includes('/admin/rounds') && pathname.includes('/questions')) return 'Question Bank';
    if (pathname.includes('/admin/rounds') && pathname.includes('/results')) return 'Round Results';
    if (pathname.includes('/admin/rounds') && pathname.includes('/monitoring')) return 'Live Monitor';
    if (pathname.includes('/admin/rounds')) return 'Rounds Management';
    if (pathname.includes('/admin/participants')) return 'Participants Directory';
    if (pathname.includes('/admin/leaderboard')) return 'Leaderboard';
    if (pathname.includes('/admin/certificates')) return 'Certificates';
    if (pathname.includes('/admin/settings')) return 'Settings';
    return 'Admin Portal';
  };

  return (
    <div style={{ minHeight: '100vh', background: '#000000', color: '#FFFFFF', position: 'relative', overflowX: 'hidden' }}>

      {/* ═══ TOP BAR (FULL WIDTH 100%) ═══ */}
      <header
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          right: 0,
          height: '64px',
          zIndex: 40,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 28px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.8)',
        }}
      >
        {/* Brand & Breadcrumb Left */}
        <div className="flex items-center gap-4">
          <Link href="/admin/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.2)] flex items-center justify-center">
              <Logo size="sm" showText={false} />
            </div>
            <span className="font-[family-name:var(--font-heading)] font-bold text-sm text-[#FFFFFF] group-hover:text-[#94A3B8] transition-colors">
              Electronic Club
            </span>
          </Link>

          <ChevronRight size={14} className="text-[#64748B]" />

          <div className="flex items-center gap-2 text-sm font-[family-name:var(--font-body)]">
            <span className="font-[family-name:var(--font-display)] font-semibold text-[0.95rem] text-[#FFFFFF]">
              {getBreadcrumbName()}
            </span>
          </div>
        </div>

        {/* Search Bar Center */}
        <div className="hidden xl:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.12)] w-[260px] focus-within:border-[rgba(255,255,255,0.3)] transition-all">
          <Search size={13} className="text-[#94A3B8] flex-shrink-0" />
          <input
            type="text"
            placeholder="Search anything..."
            className="bg-transparent border-none outline-none text-xs text-[#FFFFFF] placeholder:text-[#64748B] font-[family-name:var(--font-body)] w-full"
          />
        </div>

        {/* Right Status & Admin Identity */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.12)]">
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center font-[family-name:var(--font-mono)] font-bold text-[10px] text-white"
              style={{ background: 'linear-gradient(135deg, #1565C0 0%, #FF0033 100%)' }}
            >
              {getInitials(userName || 'Admin')}
            </div>
            <span className="font-[family-name:var(--font-body)] text-xs font-medium text-[#FFFFFF]">
              {userName || 'Admin'}
            </span>
          </div>

          <div className="h-[18px] w-[1px] bg-[rgba(255,255,255,0.15)]" />

          <button
            onClick={handleLogout}
            title="Sign Out"
            className="p-2 rounded-lg bg-[rgba(255,0,51,0.12)] border border-[rgba(255,0,51,0.25)] text-[#FF4569] hover:bg-[rgba(255,0,51,0.2)] transition-colors cursor-pointer"
          >
            <LogOut size={15} />
          </button>
        </div>
      </header>

      {/* ═══ MAIN CONTENT AREA (FULL WIDTH, NO LEFT SIDEBAR OFFSET) ═══ */}
      <main
        style={{
          paddingTop: '64px',
          paddingBottom: '110px',
          minHeight: '100vh',
          background: 'transparent',
          position: 'relative',
          zIndex: 1,
          width: '100%',
        }}
      >
        {children}
      </main>

      {/* ═══ MINIMAL LIQUID GLASS FLOATING BOTTOM DOCK ═══ */}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50">
        <motion.nav
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 24 }}
          className="flex items-center gap-1.5 p-1.5 px-3 rounded-full relative border border-[rgba(255,255,255,0.15)] select-none"
          style={{
            background: 'rgba(8, 8, 12, 0.78)',
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.85), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
          }}
        >
          {navItems.map((item, index) => {
            const isActive = pathname === item.href || (item.href !== '/admin/dashboard' && pathname.startsWith(item.href));
            const isHovered = hoveredIndex === index;
            const isSettings = item.label === 'Settings';

            return (
              <div key={item.label} className="flex items-center">
                {/* Minimal Divider before Settings */}
                {isSettings && (
                  <div className="h-5 w-[1px] bg-[rgba(255,255,255,0.15)] mx-1 self-center pointer-events-none" />
                )}

                <div
                  className="relative flex flex-col items-center"
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  {/* Floating Glass Tooltip */}
                  <AnimatePresence>
                    {isHovered && (
                      <motion.div
                        initial={{ opacity: 0, y: 4, scale: 0.9 }}
                        animate={{ opacity: 1, y: -40, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.9 }}
                        transition={{ duration: 0.12 }}
                        className="absolute top-0 px-2.5 py-1 rounded-lg bg-[#000000] border border-[rgba(255,255,255,0.2)] text-white text-[11px] font-[family-name:var(--font-heading)] font-medium tracking-wide shadow-lg whitespace-nowrap pointer-events-none z-20 flex items-center gap-1.5"
                      >
                        {item.label}
                        {item.isLive && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#FF0033] animate-pulse" />
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Minimal Dock Icon Button */}
                  <Link href={item.href}>
                    <motion.div
                      whileHover={{ scale: 1.16, y: -3 }}
                      whileTap={{ scale: 0.94 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer relative ${
                        isActive
                          ? 'bg-[rgba(255,255,255,0.16)] border border-[rgba(255,255,255,0.32)] shadow-[0_2px_8px_rgba(0,0,0,0.5)]'
                          : 'bg-transparent border border-transparent hover:bg-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.18)]'
                      }`}
                    >
                      <item.icon size={17} className="text-[#FFFFFF]" />

                      {/* Live indicator pulse badge */}
                      {item.isLive && (
                        <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#FF0033] border border-black animate-pulse z-10" />
                      )}
                    </motion.div>
                  </Link>

                  {/* Minimal Active Dot Indicator */}
                  <div className="h-1 flex items-center justify-center mt-0.5">
                    {isActive && (
                      <motion.span
                        layoutId="activeDot"
                        className="w-1 h-1 rounded-full bg-white opacity-90"
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </motion.nav>
      </div>

    </div>
  );
}

export default function AdminPortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminErrorBoundary>
      <AdminLayoutShell>{children}</AdminLayoutShell>
    </AdminErrorBoundary>
  );
}
