'use client';

import React, { ReactNode } from 'react';

interface AuroraBackgroundProps {
  children?: ReactNode;
  className?: string;
}

export default function AuroraBackground({ children, className = '' }: AuroraBackgroundProps) {
  if (!children) {
    return (
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-50"
        style={{
          background: `
            radial-gradient(ellipse 60% 40% at 20% -10%, rgba(200, 0, 40, 0.28), transparent 70%),
            radial-gradient(ellipse 50% 50% at 80% -10%, rgba(0, 80, 220, 0.25), transparent 70%),
            radial-gradient(ellipse 50% 40% at 10% 90%, rgba(0, 150, 255, 0.18), transparent 70%),
            radial-gradient(ellipse 60% 50% at 90% 110%, rgba(180, 0, 30, 0.16), rgba(0, 60, 180, 0.10) 50%, transparent 70%),
            radial-gradient(ellipse 40% 40% at 50% 50%, rgba(0, 80, 220, 0.07), transparent 70%)
          `,
        }}
      />
    );
  }

  return (
    <div className={`relative w-full overflow-x-hidden bg-[#000000] text-[var(--text-primary)] ${className}`}>
      {/* Red & Blue Deep Space Nebula Mesh Gradients */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-50"
        style={{
          background: `
            radial-gradient(ellipse 60% 40% at 20% -10%, rgba(200, 0, 40, 0.28), transparent 70%),
            radial-gradient(ellipse 50% 50% at 80% -10%, rgba(0, 80, 220, 0.25), transparent 70%),
            radial-gradient(ellipse 50% 40% at 10% 90%, rgba(0, 150, 255, 0.18), transparent 70%),
            radial-gradient(ellipse 60% 50% at 90% 110%, rgba(180, 0, 30, 0.16), rgba(0, 60, 180, 0.10) 50%, transparent 70%),
            radial-gradient(ellipse 40% 40% at 50% 50%, rgba(0, 80, 220, 0.07), transparent 70%)
          `,
        }}
      />
      {/* Content wrapper */}
      <div className="relative z-10 w-full flex flex-col">
        {children}
      </div>
    </div>
  );
}
