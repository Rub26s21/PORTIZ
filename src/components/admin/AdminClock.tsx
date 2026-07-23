'use client';

import { useEffect, useState } from 'react';
import GlassCard from '@/components/shared/GlassCard';
import { Clock } from 'lucide-react';

export default function AdminClock() {
  const [dateStr, setDateStr] = useState('');
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      // Date string: "WED, 22 JUL 2026"
      const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

      const dayName = days[now.getDay()];
      const dayNum = String(now.getDate()).padStart(2, '0');
      const monthName = months[now.getMonth()];
      const year = now.getFullYear();

      setDateStr(`${dayName}, ${dayNum} ${monthName} ${year}`);

      // Time string: "12:25:31 AM IST"
      const timePart = now.toLocaleTimeString('en-US', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });

      setTimeStr(`${timePart} IST`);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <GlassCard
      variant="elevated"
      radius={20}
      hover={false}
      noHover
      className="!p-3.5 border border-[rgba(0,176,255,0.25)] flex items-center justify-between gap-6 relative overflow-hidden select-none"
      style={{
        boxShadow: '0 0 20px rgba(0,176,255,0.12), inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(0,0,0,0.3)',
      }}
    >
      {/* Left pulsing blue dot */}
      <div className="flex items-center gap-3">
        <div
          className="w-2 h-2 rounded-full bg-[#00B0FF] animate-pulse flex-shrink-0"
          style={{ boxShadow: '0 0 8px rgba(0,176,255,0.9), 0 0 16px rgba(0,176,255,0.4)' }}
        />

        {/* Date & Time Lines */}
        <div className="flex flex-col">
          <span className="font-[family-name:var(--font-mono)] text-[10px] text-[var(--text-dim)] tracking-[0.1em] font-medium uppercase">
            {dateStr || 'SYNCING DATE...'}
          </span>
          <span
            className="font-[family-name:var(--font-mono)] font-bold text-base text-[#00B0FF] tracking-[0.06em] leading-tight"
            style={{ textShadow: '0 0 20px rgba(0,176,255,0.6)' }}
          >
            {timeStr || '12:00:00 AM IST'}
          </span>
        </div>
      </div>

      {/* Right Clock Icon */}
      <Clock size={18} className="text-[#00B0FF] opacity-60 flex-shrink-0" />
    </GlassCard>
  );
}
