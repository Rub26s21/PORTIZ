'use client';

import GlassCard from '@/components/shared/GlassCard';
import CountUp from 'react-countup';
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';

interface AttemptRadialChartProps {
  totalSubmissions?: number;
  totalAttempts?: number;
  liveAttempts?: number;
  disqualified?: number;
}

export default function AttemptRadialChart({
  totalSubmissions = 0,
  totalAttempts = 0,
  liveAttempts = 0,
  disqualified = 0,
}: AttemptRadialChartProps) {
  const baseCount = totalAttempts || (totalSubmissions + liveAttempts + disqualified) || 1;
  const completionRate = Math.min(100, Math.round((totalSubmissions / baseCount) * 100)) || 0;
  const inProgressRate = Math.min(100, Math.round((liveAttempts / baseCount) * 100)) || 0;
  const disqualRate = Math.min(100, Math.round((disqualified / baseCount) * 100)) || 0;

  const data = [
    { name: 'Disqualified', value: disqualRate || 5, fill: '#F43F5E' },
    { name: 'In Progress',  value: inProgressRate || 15, fill: '#06B6D4' },
    { name: 'Submitted',    value: completionRate || 80, fill: '#10B981' },
  ];

  return (
    <GlassCard
      variant="elevated"
      radius={24}
      hover={false}
      noHover
      className="!p-6 border border-[rgba(16,185,129,0.15)] flex flex-col justify-between h-[320px] relative overflow-hidden"
      style={{
        boxShadow: '0 0 40px rgba(16,185,129,0.06), inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -1px 0 rgba(0,0,0,0.2)',
      }}
    >
      {/* HEADER */}
      <div className="mb-2">
        <h3 className="font-[family-name:var(--font-display)] font-bold text-lg gradient-text">
          Completion Rate
        </h3>
        <p className="font-[family-name:var(--font-body)] text-xs text-[var(--text-muted)] font-light mt-0.5">
          Submitted vs total attempts
        </p>
      </div>

      {/* RECHARTS RADIAL BAR GAUGE */}
      <div className="relative flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%"
            cy="55%"
            innerRadius="35%"
            outerRadius="85%"
            barSize={10}
            data={data}
            startAngle={225}
            endAngle={-45}
          >
            <RadialBar
              background={{ fill: 'rgba(255,255,255,0.04)' }}
              dataKey="value"
              cornerRadius={6}
            />
          </RadialBarChart>
        </ResponsiveContainer>

        {/* CENTER PERCENTAGE OVERLAY */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pt-4">
          <span
            className="font-[family-name:var(--font-mono)] font-extrabold text-3xl md:text-4xl text-[var(--aurora-green)]"
            style={{ textShadow: '0 0 20px rgba(16,185,129,0.5)' }}
          >
            <CountUp end={completionRate} suffix="%" duration={2} />
          </span>
          <span className="font-[family-name:var(--font-mono)] text-[10px] text-[var(--text-dim)] uppercase tracking-wider mt-0.5">
            Completion
          </span>
        </div>
      </div>

      {/* LEGEND 3 ITEMS BELOW CHART */}
      <div className="flex items-center justify-center gap-4 pt-2 border-t border-[rgba(255,255,255,0.04)]">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--aurora-green)]" />
          <span className="font-[family-name:var(--font-body)] text-[11px] text-[var(--text-muted)]">Submitted</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--aurora-cyan)]" />
          <span className="font-[family-name:var(--font-body)] text-[11px] text-[var(--text-muted)]">In Progress</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--aurora-rose)]" />
          <span className="font-[family-name:var(--font-body)] text-[11px] text-[var(--text-muted)]">DQ</span>
        </div>
      </div>
    </GlassCard>
  );
}
