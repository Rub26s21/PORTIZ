'use client';

import GlassCard from '@/components/shared/GlassCard';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';

interface RoundBarData {
  title: string;
  participants: number;
  submissions: number;
}

interface RoundComparisonChartProps {
  data?: RoundBarData[];
}

const defaultRoundData: RoundBarData[] = [
  { title: 'R1: Qualifier', participants: 450, submissions: 390 },
  { title: 'R2: Advanced',  participants: 180, submissions: 155 },
  { title: 'R3: Finale',    participants: 40,  submissions: 38 },
];

const GalaxyTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="p-3 rounded-xl border border-[rgba(245,158,11,0.3)] shadow-[0_0_20px_rgba(245,158,11,0.15)] text-xs font-[family-name:var(--font-body)]"
        style={{ background: 'rgba(10,1,24,0.92)', backdropFilter: 'blur(16px)' }}
      >
        <p className="font-[family-name:var(--font-mono)] text-[var(--text-muted)] mb-2 font-medium">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center gap-2 font-[family-name:var(--font-mono)] my-1">
            <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: entry.color }} />
            <span className="text-[var(--text-muted)] font-light">{entry.name}:</span>
            <span className="font-bold" style={{ color: entry.color }}>{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function RoundComparisonChart({ data = defaultRoundData }: RoundComparisonChartProps) {
  return (
    <GlassCard
      variant="elevated"
      radius={24}
      hover={false}
      noHover
      className="!p-6 border border-[rgba(245,158,11,0.15)] flex flex-col justify-between h-[320px] relative overflow-hidden"
      style={{
        boxShadow: '0 0 40px rgba(245,158,11,0.06), inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -1px 0 rgba(0,0,0,0.2)',
      }}
    >
      {/* HEADER */}
      <div className="mb-2">
        <h3 className="font-[family-name:var(--font-display)] font-bold text-lg gradient-text">
          Round Performance
        </h3>
        <p className="font-[family-name:var(--font-body)] text-xs text-[var(--text-muted)] font-light mt-0.5">
          Participants vs submissions per round
        </p>
      </div>

      {/* RECHARTS BAR CHART */}
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="purpleBarGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7C3AED" />
                <stop offset="100%" stopColor="#A855F7" stopOpacity={0.4} />
              </linearGradient>
              <linearGradient id="cyanBarGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0891B2" />
                <stop offset="100%" stopColor="#06B6D4" stopOpacity={0.4} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="title" stroke="#7C6FA0" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="#7C6FA0" fontSize={11} tickLine={false} axisLine={false} width={30} />
            <Tooltip content={<GalaxyTooltip />} />

            <Bar dataKey="participants" name="Participants" fill="url(#purpleBarGrad)" radius={[4, 4, 0, 0]} maxBarSize={32} />
            <Bar dataKey="submissions" name="Submissions" fill="url(#cyanBarGrad)" radius={[4, 4, 0, 0]} maxBarSize={32} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* LEGEND BELOW CHART */}
      <div className="flex items-center justify-center gap-6 pt-2 border-t border-[rgba(255,255,255,0.04)]">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-sm bg-[var(--aurora-purple)]" />
          <span className="font-[family-name:var(--font-body)] text-xs text-[var(--text-muted)] font-light">Enrolled</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-sm bg-[var(--aurora-cyan)]" />
          <span className="font-[family-name:var(--font-body)] text-xs text-[var(--text-muted)] font-light">Submissions</span>
        </div>
      </div>
    </GlassCard>
  );
}
