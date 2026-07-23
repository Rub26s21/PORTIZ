'use client';

import { useState } from 'react';
import GlassCard from '@/components/shared/GlassCard';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';

interface TimelineDataPoint {
  time: string;
  attempts: number;
  submissions: number;
}

interface SubmissionTimelineChartProps {
  data?: TimelineDataPoint[];
}

// Synthetic 24H data if not provided
const defaultTimelineData: TimelineDataPoint[] = [
  { time: '00:00', attempts: 12, submissions: 8 },
  { time: '02:00', attempts: 18, submissions: 14 },
  { time: '04:00', attempts: 8,  submissions: 5 },
  { time: '06:00', attempts: 15, submissions: 10 },
  { time: '08:00', attempts: 35, submissions: 28 },
  { time: '10:00', attempts: 68, submissions: 52 },
  { time: '12:00', attempts: 120, submissions: 95 },
  { time: '14:00', attempts: 145, submissions: 118 },
  { time: '16:00', attempts: 110, submissions: 92 },
  { time: '18:00', attempts: 160, submissions: 135 },
  { time: '20:00', attempts: 190, submissions: 165 },
  { time: '22:00', attempts: 95,  submissions: 78 },
];

const GalaxyTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="p-3 rounded-xl border border-[rgba(168,85,247,0.3)] shadow-[0_0_20px_rgba(168,85,247,0.15)] text-xs font-[family-name:var(--font-body)]"
        style={{ background: 'rgba(10,1,24,0.92)', backdropFilter: 'blur(16px)' }}
      >
        <p className="font-[family-name:var(--font-mono)] text-[var(--text-muted)] mb-2 font-medium">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center gap-2 font-[family-name:var(--font-mono)] my-1">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: entry.color }} />
            <span className="text-[var(--text-muted)] font-light">{entry.name}:</span>
            <span className="font-bold" style={{ color: entry.color }}>{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function SubmissionTimelineChart({ data = defaultTimelineData }: SubmissionTimelineChartProps) {
  const [timeFilter, setTimeFilter] = useState<'1H' | '6H' | '24H'>('24H');

  return (
    <GlassCard
      variant="elevated"
      radius={24}
      hover={false}
      noHover
      className="!p-6 border border-[rgba(168,85,247,0.15)] flex flex-col justify-between h-[340px] relative overflow-hidden"
      style={{
        boxShadow: '0 0 40px rgba(168,85,247,0.08), inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -1px 0 rgba(0,0,0,0.2)',
      }}
    >
      {/* HEADER */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <h3 className="font-[family-name:var(--font-display)] font-bold text-lg gradient-text">
            Submission Timeline
          </h3>
          <p className="font-[family-name:var(--font-body)] text-xs text-[var(--text-muted)] font-light mt-0.5">
            Answers submitted over time
          </p>
        </div>

        {/* 3 FILTER PILLS */}
        <div className="flex items-center gap-1.5 bg-[var(--glass-white)] p-1 rounded-full border border-[var(--glass-border)]">
          {(['1H', '6H', '24H'] as const).map((filter) => {
            const isActive = timeFilter === filter;
            return (
              <button
                key={filter}
                onClick={() => setTimeFilter(filter)}
                className={`px-3 py-1 rounded-full font-[family-name:var(--font-heading)] text-xs transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[var(--glass-purple)] border border-[rgba(168,85,247,0.4)] text-[var(--aurora-purple)] font-semibold shadow-sm'
                    : 'text-[var(--text-dim)] hover:text-[var(--text-secondary)] font-normal'
                }`}
              >
                {filter}
              </button>
            );
          })}
        </div>
      </div>

      {/* RECHARTS AREA CHART */}
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="attemptGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#A855F7" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#A855F7" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="submissionGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="time" stroke="#7C6FA0" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="#7C6FA0" fontSize={11} tickLine={false} axisLine={false} width={30} />
            <Tooltip content={<GalaxyTooltip />} />

            <Area
              type="monotone"
              dataKey="attempts"
              name="Attempts"
              stroke="#A855F7"
              strokeWidth={2}
              fill="url(#attemptGradient)"
              activeDot={{ r: 5, fill: '#A855F7', stroke: 'rgba(168,85,247,0.3)', strokeWidth: 8 }}
            />
            <Area
              type="monotone"
              dataKey="submissions"
              name="Submissions"
              stroke="#06B6D4"
              strokeWidth={2}
              fill="url(#submissionGradient)"
              activeDot={{ r: 5, fill: '#06B6D4', stroke: 'rgba(6,182,212,0.3)', strokeWidth: 8 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* LEGEND BELOW CHART */}
      <div className="flex items-center justify-center gap-6 pt-2 border-t border-[rgba(255,255,255,0.04)]">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--aurora-purple)] shadow-[0_0_6px_rgba(168,85,247,0.6)]" />
          <span className="font-[family-name:var(--font-body)] text-xs text-[var(--text-muted)] font-light">Attempts</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--aurora-cyan)] shadow-[0_0_6px_rgba(6,182,212,0.6)]" />
          <span className="font-[family-name:var(--font-body)] text-xs text-[var(--text-muted)] font-light">Submissions</span>
        </div>
      </div>
    </GlassCard>
  );
}
