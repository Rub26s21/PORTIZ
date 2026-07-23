'use client';

import { cn } from '@/lib/utils';

interface RoundBadgeProps {
  status: string;
  className?: string;
}

const statusConfig: Record<string, { bg: string; text: string; label: string; dot?: string; border: string }> = {
  draft: {
    bg: 'rgba(107, 114, 128, 0.2)',
    text: '#9CA3AF',
    label: 'Draft',
    dot: '#9CA3AF',
    border: 'rgba(107, 114, 128, 0.3)',
  },
  published: {
    bg: 'rgba(59, 130, 246, 0.15)',
    text: '#3B82F6',
    label: 'Published',
    dot: '#3B82F6',
    border: 'rgba(59, 130, 246, 0.3)',
  },
  live: {
    bg: 'rgba(16, 185, 129, 0.15)',
    text: '#10B981',
    label: 'Live',
    dot: '#10B981',
    border: 'rgba(16, 185, 129, 0.3)',
  },
  closed: {
    bg: 'rgba(75, 85, 99, 0.2)',
    text: '#6B7280',
    label: 'Closed',
    dot: '#6B7280',
    border: 'rgba(75, 85, 99, 0.3)',
  },
  upcoming: {
    bg: 'rgba(245, 158, 11, 0.15)',
    text: '#F59E0B',
    label: 'Upcoming',
    dot: '#F59E0B',
    border: 'rgba(245, 158, 11, 0.3)',
  },
  open: {
    bg: 'rgba(16, 185, 129, 0.12)',
    text: '#10B981',
    label: 'Open',
    dot: '#10B981',
    border: 'rgba(16, 185, 129, 0.25)',
  },
  eligible: {
    bg: 'rgba(168, 85, 247, 0.15)',
    text: '#A855F7',
    label: 'Eligible ✅',
    border: 'rgba(168, 85, 247, 0.3)',
  },
  not_eligible: {
    bg: 'rgba(244, 63, 94, 0.12)',
    text: '#F43F5E',
    label: 'Not Promoted',
    border: 'rgba(244, 63, 94, 0.25)',
  },
  submitted: {
    bg: 'rgba(16, 185, 129, 0.12)',
    text: '#10B981',
    label: 'Submitted ✅',
    border: 'rgba(16, 185, 129, 0.25)',
  },
  in_progress: {
    bg: 'rgba(245, 158, 11, 0.12)',
    text: '#F59E0B',
    label: 'In Progress',
    dot: '#F59E0B',
    border: 'rgba(245, 158, 11, 0.25)',
  },
  disqualified: {
    bg: 'rgba(244, 63, 94, 0.15)',
    text: '#F43F5E',
    label: 'Disqualified ⚠️',
    border: 'rgba(244, 63, 94, 0.3)',
  },
};

export default function RoundBadge({ status, className }: RoundBadgeProps) {
  const config = statusConfig[status] || statusConfig.draft;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs select-none',
        'font-[family-name:var(--font-heading)] font-medium tracking-wide',
        className
      )}
      style={{
        background: config.bg,
        color: config.text,
        border: `1px solid ${config.border}`,
      }}
    >
      {config.dot && (
        <span
          className="w-1.5 h-1.5 rounded-full animate-pulse"
          style={{ background: config.dot }}
        />
      )}
      {config.label}
    </span>
  );
}
