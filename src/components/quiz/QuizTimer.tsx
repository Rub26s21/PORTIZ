'use client';

import { useEffect, useState, useRef } from 'react';

interface QuizTimerProps {
  totalDurationMinutes: number;
  startedAtIso: string;
  onTimeUp: () => void;
  /** If true, renders as inline compact text (for mobile header). Otherwise renders full SVG ring. */
  compact?: boolean;
}

export default function QuizTimer({ totalDurationMinutes, startedAtIso, onTimeUp, compact = false }: QuizTimerProps) {
  const totalSeconds = totalDurationMinutes * 60;

  const calculateRemaining = () => {
    try {
      const startMs = new Date(startedAtIso).getTime();
      if (isNaN(startMs)) return totalSeconds;

      const endMs = startMs + totalSeconds * 1000;
      const nowMs = Date.now();

      // Guard: If client machine clock is skewed into the past before start time
      if (nowMs < startMs) {
        return totalSeconds;
      }

      const diff = Math.floor((endMs - nowMs) / 1000);
      // Guard: Capped between 0 and totalSeconds
      return Math.min(totalSeconds, Math.max(0, diff));
    } catch {
      return totalSeconds;
    }
  };

  const [remaining, setRemaining] = useState<number>(calculateRemaining);
  const onTimeUpRef = useRef(onTimeUp);
  onTimeUpRef.current = onTimeUp;
  const hasCalledTimeUp = useRef(false);

  useEffect(() => {
    // Reset guard when props change (e.g. new quiz session)
    hasCalledTimeUp.current = false;

    const timer = setInterval(() => {
      const rem = calculateRemaining();
      setRemaining(rem);
      if (rem <= 0 && !hasCalledTimeUp.current) {
        hasCalledTimeUp.current = true;
        clearInterval(timer);
        onTimeUpRef.current();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [startedAtIso, totalSeconds]);

  // Color calculation
  const percent = totalSeconds > 0 ? (remaining / totalSeconds) * 100 : 0;
  let strokeColor = '#06B6D4'; // > 50% cyan
  if (percent <= 10) strokeColor = '#F43F5E'; // < 10% rose
  else if (percent <= 25) strokeColor = '#F59E0B'; // 10-25% gold
  else if (percent <= 50) strokeColor = '#A855F7'; // 25-50% purple

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const isCritical = percent <= 10;

  // ── COMPACT MODE: Inline text for mobile header bar ──
  if (compact) {
    return (
      <span
        className={`font-[family-name:var(--font-mono)] font-bold text-xs tracking-wider ${isCritical ? 'animate-pulse' : ''}`}
        style={{ color: strokeColor, textShadow: `0 0 8px ${strokeColor}66` }}
      >
        {formattedTime}
      </span>
    );
  }

  // ── FULL MODE: SVG ring with center text ──
  // SVG Ring values
  const radius = 62;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - (totalSeconds > 0 ? remaining / totalSeconds : 0));

  return (
    <div className="flex flex-col items-center justify-center space-y-2 select-none">
      {isCritical && (
        <span className="font-[family-name:var(--font-heading)] font-semibold text-xs text-[var(--aurora-rose)] animate-pulse">
          ⚠️ Hurry! Time ending!
        </span>
      )}

      <div className="relative w-[140px] h-[140px] flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90">
          {/* Track */}
          <circle
            cx="70"
            cy="70"
            r={radius}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="6"
            fill="none"
          />
          {/* Arc */}
          <circle
            cx="70"
            cy="70"
            r={radius}
            stroke={strokeColor}
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{
              transition: 'stroke-dashoffset 1s linear, stroke 0.5s ease',
              filter: `drop-shadow(0 0 6px ${strokeColor})`,
            }}
          />
        </svg>

        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span
            className={`font-[family-name:var(--font-mono)] font-extrabold text-2xl tracking-wider ${
              isCritical ? 'animate-pulse' : ''
            }`}
            style={{
              color: strokeColor,
              textShadow: `0 0 16px ${strokeColor}99`,
            }}
          >
            {formattedTime}
          </span>
          <span className="font-[family-name:var(--font-mono)] text-[9px] text-[var(--text-dim)] uppercase tracking-widest mt-0.5">
            remaining
          </span>
        </div>
      </div>
    </div>
  );
}
