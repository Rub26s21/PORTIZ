'use client';

type StatusType = 'DRAFT' | 'PUBLISHED' | 'LIVE' | 'CLOSED' | string;

interface StatusBadgeProps {
  status: StatusType;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const normalized = (status || '').toUpperCase();

  const config: Record<string, { bg: string; border: string; color: string; isLive?: boolean }> = {
    DRAFT: {
      bg: 'rgba(90, 106, 153, 0.15)',
      border: 'rgba(90, 106, 153, 0.3)',
      color: '#5A6A99',
    },
    PUBLISHED: {
      bg: 'rgba(0, 102, 255, 0.15)',
      border: 'rgba(0, 102, 255, 0.3)',
      color: '#2979FF',
    },
    LIVE: {
      bg: 'rgba(0, 176, 255, 0.15)',
      border: 'rgba(0, 176, 255, 0.3)',
      color: '#00B0FF',
      isLive: true,
    },
    CLOSED: {
      bg: 'rgba(42, 53, 85, 0.15)',
      border: 'rgba(42, 53, 85, 0.3)',
      color: '#2A3555',
    },
  };

  const style = config[normalized] || config.DRAFT;

  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-[family-name:var(--font-heading)] font-normal tracking-[0.08em] select-none"
      style={{
        background: style.bg,
        border: `1px solid ${style.border}`,
        color: style.color,
      }}
    >
      {style.isLive && (
        <span className="w-1.5 h-1.5 rounded-full bg-[#00B0FF] animate-pulse" />
      )}
      {normalized}
    </span>
  );
}
