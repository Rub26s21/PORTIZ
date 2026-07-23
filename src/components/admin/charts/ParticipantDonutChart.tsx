'use client';

import GlassCard from '@/components/shared/GlassCard';
import CountUp from 'react-countup';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface DonutDataProps {
  inProgress?: number;
  submitted?: number;
  disqualified?: number;
  notStarted?: number;
}

export default function ParticipantDonutChart({
  inProgress = 0,
  submitted = 0,
  disqualified = 0,
  notStarted = 0,
}: DonutDataProps) {
  const data = [
    { name: 'In Progress', value: inProgress || 1, color: '#06B6D4' },
    { name: 'Submitted', value: submitted || 1, color: '#10B981' },
    { name: 'Disqualified', value: disqualified || 0, color: '#F43F5E' },
    { name: 'Not Started', value: notStarted || 0, color: '#4C3F70' },
  ].filter(item => item.value >= 0);

  const total = inProgress + submitted + disqualified + notStarted;

  const GalaxyTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const dataItem = payload[0];
      return (
        <div
          className="p-3 rounded-xl border border-[rgba(6,182,212,0.3)] shadow-[0_0_20px_rgba(6,182,212,0.15)] text-xs font-[family-name:var(--font-body)]"
          style={{ background: 'rgba(10,1,24,0.92)', backdropFilter: 'blur(16px)' }}
        >
          <div className="flex items-center gap-2 font-[family-name:var(--font-mono)]">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: dataItem.payload.color }} />
            <span className="text-[var(--text-muted)]">{dataItem.name}:</span>
            <span className="font-bold" style={{ color: dataItem.payload.color }}>{dataItem.value}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <GlassCard
      variant="elevated"
      radius={24}
      hover={false}
      noHover
      className="!p-6 border border-[rgba(6,182,212,0.15)] flex flex-col justify-between h-[340px] relative overflow-hidden"
      style={{
        boxShadow: '0 0 40px rgba(6,182,212,0.06), inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -1px 0 rgba(0,0,0,0.2)',
      }}
    >
      {/* HEADER */}
      <div className="mb-2">
        <h3 className="font-[family-name:var(--font-display)] font-bold text-lg gradient-text">
          Status Breakdown
        </h3>
        <p className="font-[family-name:var(--font-body)] text-xs text-[var(--text-muted)] font-light mt-0.5">
          Attempt status distribution
        </p>
      </div>

      {/* RECHARTS PIE CHART WITH CENTER HOLE */}
      <div className="relative flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <defs>
              <filter id="glowFilter">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <Pie
              data={data}
              cx="50%"
              cy="48%"
              innerRadius="52%"
              outerRadius="72%"
              paddingAngle={4}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} filter="url(#glowFilter)" />
              ))}
            </Pie>
            <Tooltip content={<GalaxyTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* CENTER HOLE OVERLAY */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-4">
          <span className="font-[family-name:var(--font-mono)] font-extrabold text-2xl md:text-3xl text-[var(--aurora-cyan)]">
            <CountUp end={total} duration={2} />
          </span>
          <span className="font-[family-name:var(--font-mono)] text-[10px] text-[var(--text-dim)] uppercase tracking-wider">
            Total
          </span>
        </div>
      </div>

      {/* LEGEND 2x2 GRID BELOW CHART */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[rgba(255,255,255,0.04)]">
        {data.map((item) => (
          <div key={item.name} className="flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <span
                className="w-2.5 h-2.5 rounded-[3px] flex-shrink-0"
                style={{ background: item.color, boxShadow: `0 0 6px ${item.color}` }}
              />
              <span className="font-[family-name:var(--font-body)] text-[11px] text-[var(--text-muted)] truncate">
                {item.name}
              </span>
            </div>
            <span className="font-[family-name:var(--font-mono)] font-semibold text-xs" style={{ color: item.color }}>
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
