'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface NeonGlowProps {
  children: ReactNode;
  color?: 'blue' | 'green' | 'gold' | 'purple' | 'red';
  className?: string;
  intensity?: 'low' | 'medium' | 'high';
}

export default function NeonGlow({
  children,
  className,
}: NeonGlowProps) {
  return (
    <div
      className={cn('transition-shadow duration-300', className)}
      style={{ boxShadow: '0 2px 6px rgba(0,0,0,0.4)' }}
    >
      {children}
    </div>
  );
}
