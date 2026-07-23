'use client';

interface TooltipPayloadItem {
  name: string;
  value: number | string;
  color: string;
  payload?: any;
}

interface GalaxyTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

export default function GalaxyTooltip({ active, payload, label }: GalaxyTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div
        className="p-3 px-3.5 rounded-xl border border-[rgba(0,102,255,0.32)] text-xs select-none"
        style={{
          background: 'rgba(0, 0, 10, 0.94)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          boxShadow: '0 0 20px rgba(0,102,255,0.18), inset 0 1px 0 rgba(255,255,255,0.06)',
        }}
      >
        {label && (
          <p className="font-[family-name:var(--font-body)] text-xs text-[var(--text-dim)] font-light mb-2">
            {label}
          </p>
        )}
        <div className="space-y-1.5">
          {payload.map((item, index) => (
            <div key={`tooltip-item-${index}`} className="flex items-center gap-2 font-[family-name:var(--font-mono)]">
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{
                  background: item.color || '#0066FF',
                  boxShadow: `0 0 6px ${item.color || '#0066FF'}`,
                }}
              />
              <span className="font-[family-name:var(--font-body)] text-xs text-[var(--text-muted)] font-light">
                {item.name}:
              </span>
              <span
                className="font-semibold text-xs ml-auto pl-2"
                style={{ color: item.color || 'var(--text-primary)' }}
              >
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
}
