'use client';

import { ReactNode, CSSProperties } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export type GlassCardVariant =
  | 'default'
  | 'elevated'
  | 'purple'
  | 'blue'
  | 'pink'
  | 'red'
  | 'cyan'
  | 'solid';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  variant?: GlassCardVariant;
  glowColor?: string;
  hover?: boolean;
  radius?: number | string;
  padding?: string;
  onClick?: () => void;
  noHover?: boolean;
  style?: CSSProperties;
}

const variantStyles: Record<GlassCardVariant, { bg: string; blur: string; border: string }> = {
  default: {
    bg: 'rgba(255, 255, 255, 0.04)',
    blur: 'blur(20px)',
    border: 'rgba(255, 255, 255, 0.08)',
  },
  elevated: {
    bg: 'rgba(255, 255, 255, 0.06)',
    blur: 'blur(28px)',
    border: 'rgba(0, 102, 255, 0.25)',
  },
  blue: {
    bg: 'rgba(0, 102, 255, 0.10)',
    blur: 'blur(24px)',
    border: 'rgba(0, 102, 255, 0.22)',
  },
  purple: {
    bg: 'rgba(0, 102, 255, 0.10)',
    blur: 'blur(24px)',
    border: 'rgba(0, 102, 255, 0.22)',
  },
  red: {
    bg: 'rgba(255, 0, 51, 0.10)',
    blur: 'blur(24px)',
    border: 'rgba(255, 0, 51, 0.22)',
  },
  pink: {
    bg: 'rgba(255, 0, 51, 0.10)',
    blur: 'blur(24px)',
    border: 'rgba(255, 0, 51, 0.22)',
  },
  cyan: {
    bg: 'rgba(0, 176, 255, 0.10)',
    blur: 'blur(24px)',
    border: 'rgba(0, 176, 255, 0.22)',
  },
  solid: {
    bg: '#000000',
    blur: 'blur(0px)',
    border: 'rgba(255, 255, 255, 0.06)',
  },
};

export default function GlassCard({
  children,
  className,
  variant = 'default',
  hover = true,
  radius = 24,
  padding,
  onClick,
  noHover = false,
  style,
}: GlassCardProps) {
  const v = variantStyles[variant] || variantStyles.default;
  const shouldHover = hover && !noHover;

  const borderRadiusVal = typeof radius === 'number' ? `${radius}px` : radius;

  return (
    <motion.div
      className={cn(
        'relative overflow-hidden p-6',
        onClick && 'cursor-pointer',
        className
      )}
      style={{
        background: v.bg,
        backdropFilter: v.blur,
        WebkitBackdropFilter: v.blur,
        border: `1px solid ${v.border}`,
        borderRadius: borderRadiusVal,
        padding: padding || undefined,
        boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
        ...style,
      }}
      whileHover={
        shouldHover
          ? {
              scale: 1.01,
              boxShadow: '0 6px 24px rgba(0,0,0,0.8)',
            }
          : undefined
      }
      whileTap={onClick ? { scale: 0.99 } : undefined}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      onClick={onClick}
    >
      {/* Inner subtle shimmer layer */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 50%, rgba(255,255,255,0.01) 100%)',
          borderRadius: 'inherit',
        }}
      />
      <div className="relative z-10 h-full w-full flex flex-col flex-1">{children}</div>
    </motion.div>
  );
}
