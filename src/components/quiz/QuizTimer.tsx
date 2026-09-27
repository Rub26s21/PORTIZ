'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

interface QuizTimerProps {
  totalDurationMinutes: number;
  startedAtIso: string;
  onTimeUp: () => void;
  /** If true, renders as inline compact text (for mobile header). Otherwise renders full SVG ring. */
  compact?: boolean;
  attemptId?: string;
}

/**
 * Robust ISO date parser that handles:
 * - Full ISO strings: "2026-09-27T17:05:00.000Z"
 * - Space-separated SQL timestamps: "2026-09-27 17:05:00"
 * - Strings with or without explicit UTC timezone offsets
 */
function parseIsoDate(isoStr: string | null | undefined): number {
  if (!isoStr) return Date.now();
  try {
    let clean = String(isoStr).trim().replace(' ', 'T');
    // If no timezone offset is present, treat as UTC by appending 'Z'
    if (!clean.endsWith('Z') && !/[+-]\d{2}(:\d{2})?$/.test(clean)) {
      clean += 'Z';
    }
    const ms = new Date(clean).getTime();
    return isNaN(ms) ? Date.now() : ms;
  } catch {
    return Date.now();
  }
}

export default function QuizTimer({
  totalDurationMinutes,
  startedAtIso,
  onTimeUp,
  compact = false,
  attemptId,
}: QuizTimerProps) {
  const totalSeconds = Math.max(60, (totalDurationMinutes || 30) * 60);

  // Local storage key for persistent countdown target
  const storageKey = attemptId
    ? `quiz_target_end_${attemptId}`
    : `quiz_target_end_${startedAtIso?.slice(0, 19) || 'default'}`;

  // Calculate the target end timestamp in local client milliseconds
  const getTargetEndTime = useCallback((): number => {
    const clientNow = Date.now();

    // 1. Try reading existing saved target from localStorage
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed = parseInt(saved, 10);
          // Sanity check: must be a reasonable timestamp (not years in past/future)
          if (!isNaN(parsed) && parsed > clientNow - 600000 && parsed <= clientNow + (totalSeconds + 600) * 1000) {
            return parsed;
          }
        }
      } catch {
        /* storage disabled */
      }
    }

    // 2. Compute from server startedAt timestamp
    const serverStartMs = parseIsoDate(startedAtIso);
    const rawElapsedSeconds = Math.floor((clientNow - serverStartMs) / 1000);

    // If client clock is skewed into the past or future relative to server,
    // clamp safe elapsed between 0 and totalSeconds
    const safeElapsed = rawElapsedSeconds >= 0 && rawElapsedSeconds < totalSeconds ? rawElapsedSeconds : 0;
    const initialRemaining = Math.max(0, totalSeconds - safeElapsed);

    const calculatedTarget = clientNow + initialRemaining * 1000;

    // Cache to localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(storageKey, String(calculatedTarget));
      } catch {
        /* ignore */
      }
    }

    return calculatedTarget;
  }, [storageKey, startedAtIso, totalSeconds]);

  // Target end timestamp in client machine local time domain
  const targetEndMsRef = useRef<number>(0);
  if (targetEndMsRef.current === 0) {
    targetEndMsRef.current = getTargetEndTime();
  }

  // Calculate remaining seconds based on the client-anchored target timestamp
  const computeRemaining = useCallback((): number => {
    const now = Date.now();
    const diff = Math.round((targetEndMsRef.current - now) / 1000);
    return Math.max(0, Math.min(totalSeconds, diff));
  }, [totalSeconds]);

  const [remaining, setRemaining] = useState<number>(computeRemaining);
  const onTimeUpRef = useRef(onTimeUp);
  onTimeUpRef.current = onTimeUp;
  const hasCalledTimeUp = useRef(false);

  // Recalculate target when startedAtIso or totalDurationMinutes changes meaningfully
  useEffect(() => {
    targetEndMsRef.current = getTargetEndTime();
    hasCalledTimeUp.current = false;
    setRemaining(computeRemaining());
  }, [startedAtIso, totalDurationMinutes, getTargetEndTime, computeRemaining]);

  // Main countdown engine + background tab wakeup handler
  useEffect(() => {
    const tick = () => {
      const rem = computeRemaining();
      setRemaining(rem);

      if (rem <= 0 && !hasCalledTimeUp.current) {
        hasCalledTimeUp.current = true;
        if (typeof window !== 'undefined') {
          try {
            localStorage.removeItem(storageKey);
          } catch {}
        }
        onTimeUpRef.current();
      }
    };

    // Run immediately
    tick();

    // High-precision interval (every 1,000ms)
    const intervalId = setInterval(tick, 1000);

    // Visibility / Focus listener: when student switches back to this tab or wakes laptop,
    // instantly update the timer without waiting for the next setInterval tick!
    const handleWakeup = () => {
      tick();
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleWakeup);
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', handleWakeup);
    }

    return () => {
      clearInterval(intervalId);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleWakeup);
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', handleWakeup);
      }
    };
  }, [computeRemaining, storageKey]);

  // Percentage & Dynamic Colors
  const percent = totalSeconds > 0 ? (remaining / totalSeconds) * 100 : 0;
  let strokeColor = '#00E5FF'; // Cyan (> 50%)
  let glowColor = 'rgba(0, 229, 255, 0.4)';
  let statusBadge = '● LIVE';
  let statusColor = '#10B981'; // Emerald

  if (percent <= 10 || remaining <= 300) {
    strokeColor = '#F43F5E'; // Red / Rose (< 10% or < 5m)
    glowColor = 'rgba(244, 63, 94, 0.6)';
    statusBadge = '● CRITICAL';
    statusColor = '#F43F5E';
  } else if (percent <= 25) {
    strokeColor = '#F59E0B'; // Amber
    glowColor = 'rgba(245, 158, 11, 0.4)';
    statusBadge = '● WARNING';
    statusColor = '#F59E0B';
  } else if (percent <= 50) {
    strokeColor = '#A855F7'; // Purple
    glowColor = 'rgba(168, 85, 247, 0.4)';
    statusBadge = '● LIVE';
    statusColor = '#A855F7';
  }

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const isCritical = percent <= 10 || remaining <= 300;

  // ── COMPACT MODE: Inline badge for mobile header ──
  if (compact) {
    return (
      <span
        className={`font-[family-name:var(--font-mono)] font-bold text-xs tracking-wider tabular-nums ${
          isCritical ? 'animate-pulse text-[#F43F5E]' : ''
        }`}
        style={{
          color: isCritical ? '#F43F5E' : strokeColor,
          textShadow: `0 0 10px ${glowColor}`,
        }}
      >
        {formattedTime}
      </span>
    );
  }

  // ── FULL MODE: Reconstructed Circular Neon Dial ──
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - (totalSeconds > 0 ? remaining / totalSeconds : 0));

  return (
    <div className="flex flex-col items-center justify-center space-y-2 select-none w-full">
      {/* Live Status Pill */}
      <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.08]">
        <span
          className={`w-1.5 h-1.5 rounded-full ${isCritical ? 'animate-ping' : ''}`}
          style={{ backgroundColor: statusColor }}
        />
        <span
          className="text-[9px] font-[family-name:var(--font-mono)] font-semibold tracking-wider uppercase"
          style={{ color: statusColor }}
        >
          {statusBadge}
        </span>
      </div>

      {/* Circular Gauge */}
      <div className="relative w-[150px] h-[150px] flex items-center justify-center my-1">
        <svg className="w-full h-full transform -rotate-90">
          <defs>
            <filter id={`glow-${attemptId || 'dial'}`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background Ring Track */}
          <circle
            cx="75"
            cy="75"
            r={radius}
            stroke="rgba(255, 255, 255, 0.07)"
            strokeWidth="7"
            fill="none"
          />

          {/* Active Countdown Arc */}
          <circle
            cx="75"
            cy="75"
            r={radius}
            stroke={strokeColor}
            strokeWidth="7"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            filter={`url(#glow-${attemptId || 'dial'})`}
            style={{
              transition: 'stroke-dashoffset 0.8s ease-out, stroke 0.5s ease',
            }}
          />
        </svg>

        {/* Center Digital Readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span
            className={`font-[family-name:var(--font-mono)] font-black text-[28px] leading-none tracking-tight tabular-nums ${
              isCritical ? 'animate-pulse' : ''
            }`}
            style={{
              color: strokeColor,
              textShadow: `0 0 18px ${glowColor}`,
            }}
          >
            {formattedTime}
          </span>
          <span className="font-[family-name:var(--font-mono)] text-[9px] font-semibold text-slate-400 uppercase tracking-widest mt-1.5">
            REMAINING
          </span>
        </div>
      </div>

      {/* Critical Countdown Warning */}
      {isCritical && (
        <span className="font-[family-name:var(--font-heading)] font-semibold text-[11px] text-[#F43F5E] animate-pulse">
          ⚠️ Final minutes! Review & submit
        </span>
      )}
    </div>
  );
}
