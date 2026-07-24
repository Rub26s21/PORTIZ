'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ArrowRight, Shield, Award, HelpCircle, Trophy } from 'lucide-react';
import GlassCard from '@/components/shared/GlassCard';
import GalaxyButton from '@/components/shared/GalaxyButton';

interface HeaderNavbarProps {
  activeTab?: string;
}

export default function HeaderNavbar({ activeTab }: HeaderNavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'About', href: '/about' },
    { label: 'Rounds', href: '/#rounds' },
    { label: 'Rules', href: '/rules' },
    { label: 'FAQ', href: '/#faq' },
    { label: 'Contributors', href: '/#contributors' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      <div className="mx-3 sm:mx-6 mt-3.5">
        <div
          className="relative px-5 sm:px-7 py-3 rounded-full border border-white/15 select-none"
          style={{
            background: 'rgba(8, 8, 14, 0.25)',
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
          }}
        >
          <div className="flex items-center justify-between max-w-7xl mx-auto gap-4 sm:gap-6 relative z-10">

            {/* ═══ LEFTMOST: COLLEGE LOGO & V.S.B ENGINEERING COLLEGE (TIMES NEW ROMAN) ═══ */}
            <Link href="/" className="flex items-center gap-3 flex-shrink-0 group cursor-pointer">
              <div className="relative w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center overflow-hidden">
                <Image
                  src="/college-logo.png"
                  alt="V.S.B Engineering College Logo"
                  width={34}
                  height={34}
                  className="object-contain"
                  priority
                />
              </div>
              <span
                className="font-bold text-sm sm:text-base text-[#FFFFFF] tracking-normal whitespace-nowrap group-hover:text-white/80 transition-colors"
                style={{ fontFamily: '"Times New Roman", Times, serif' }}
              >
                V.S.B Engineering College
              </span>
            </Link>

            {/* ═══ CENTER: NAV LINKS ═══ */}
            <div className="hidden lg:flex items-center justify-center gap-8 flex-1 mx-2">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-sm font-medium text-[#94A3B8] hover:text-[#FFFFFF] transition-colors whitespace-nowrap px-2 py-1"
                  style={{ fontFamily: '"Times New Roman", Times, serif' }}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* ═══ RIGHT: ELECTRONICS CLUB LOGO & TEXT ═══ */}
            <div className="hidden md:flex items-center gap-2.5 flex-shrink-0">
              <Image
                src="/logo.png"
                alt="Electronics Club Logo"
                width={22}
                height={22}
                className="object-contain"
                priority
              />
              <span 
                className="font-bold text-xs tracking-wider text-[#FFFFFF] uppercase"
                style={{ fontFamily: '"Times New Roman", Times, serif' }}
              >
                ELECTRONICS CLUB
              </span>
            </div>

            {/* ═══ RIGHTMOST: RED ADMIN BUTTON ═══ */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <Link href="/admin/login">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-5 py-2 rounded-full font-bold text-xs text-white bg-gradient-to-r from-[#FF0033] via-[#E6002E] to-[#C62828] border border-[#FF6680]/40 shadow-none cursor-pointer whitespace-nowrap transition-all flex items-center justify-center"
                  style={{ fontFamily: '"Times New Roman", Times, serif' }}
                >
                  Admin Button
                </motion.button>
              </Link>

              {/* Mobile Menu Toggle Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-xl bg-white/10 border border-white/15 text-white"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* ═══ MOBILE DROPDOWN ═══ */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.18 }}
            className="mx-3 sm:mx-6 mt-2 p-5 rounded-2xl flex flex-col gap-4 lg:hidden border border-white/20 shadow-2xl"
            style={{
              background: 'rgba(10, 10, 18, 0.75)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
            }}
          >
            {/* College & Club Info Header on Mobile */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Image src="/college-logo.png" alt="V.S.B Logo" width={24} height={24} className="object-contain" />
                <span className="text-xs font-bold text-white" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
                  V.S.B Engineering College
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10">
                <Image src="/logo.png" alt="Club Logo" width={16} height={16} className="object-contain" />
                <span className="text-[10px] font-bold text-white uppercase" style={{ fontFamily: '"Times New Roman", Times, serif' }}>Electronics Club</span>
              </div>
            </div>

            {/* Mobile Nav Links */}
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm font-medium text-[#94A3B8] hover:text-white px-3 py-2 rounded-xl hover:bg-white/10 transition-colors"
                  style={{ fontFamily: '"Times New Roman", Times, serif' }}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Mobile Action Buttons */}
            <div className="pt-2 border-t border-white/10">
              <Link href="/admin/login" onClick={() => setMobileMenuOpen(false)} className="w-full">
                <button 
                  className="w-full py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-[#FF0033] to-[#C62828] border border-[#FF6680]/50 shadow-[0_0_16px_rgba(255,0,51,0.5)]"
                  style={{ fontFamily: '"Times New Roman", Times, serif' }}
                >
                  Admin Button
                </button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
