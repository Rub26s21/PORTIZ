'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import Logo3DSpinner from './Logo3DSpinner';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'cyan' | 'gold' | 'ghost';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

interface GlowButtonProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  fullWidth?: boolean;
  loading?: boolean;
}

const variantMap: Record<ButtonVariant, {
  bg: string; hoverBg: string; text: string;
  border: string; shadow: string; hoverShadow: string;
}> = {
  primary: {
    bg: 'linear-gradient(135deg, #C62828 0%, #FF0033 45%, #FF1744 100%)',
    hoverBg: 'linear-gradient(135deg, #B71C1C 0%, #F50057 45%, #FF4569 100%)',
    text: '#ffffff',
    border: '1px solid rgba(255,255,255,0.2)',
    shadow: '0 4px 14px rgba(0,0,0,0.5)',
    hoverShadow: '0 6px 20px rgba(0,0,0,0.7)',
  },
  secondary: {
    bg: 'rgba(0, 102, 255, 0.08)',
    hoverBg: 'rgba(0, 102, 255, 0.16)',
    text: 'var(--text-primary)',
    border: '1px solid rgba(0, 102, 255, 0.35)',
    shadow: '0 4px 14px rgba(0,0,0,0.4)',
    hoverShadow: '0 6px 18px rgba(0,0,0,0.6)',
  },
  danger: {
    bg: 'linear-gradient(135deg, #7F0019, #FF0033)',
    hoverBg: 'linear-gradient(135deg, #A80022, #FF1744)',
    text: '#ffffff',
    border: '1px solid rgba(255,255,255,0.15)',
    shadow: '0 4px 14px rgba(0,0,0,0.5)',
    hoverShadow: '0 6px 20px rgba(0,0,0,0.7)',
  },
  cyan: {
    bg: 'linear-gradient(135deg, #0D47A1, #0066FF)',
    hoverBg: 'linear-gradient(135deg, #1565C0, #2979FF)',
    text: '#ffffff',
    border: '1px solid rgba(255,255,255,0.15)',
    shadow: '0 4px 14px rgba(0,0,0,0.5)',
    hoverShadow: '0 6px 20px rgba(0,0,0,0.7)',
  },
  gold: {
    bg: 'linear-gradient(135deg, #BF360C, #FF6D00)',
    hoverBg: 'linear-gradient(135deg, #D84315, #FF8A65)',
    text: '#FFF3E0',
    border: '1px solid rgba(255,255,255,0.2)',
    shadow: '0 4px 14px rgba(0,0,0,0.5)',
    hoverShadow: '0 6px 20px rgba(0,0,0,0.7)',
  },
  ghost: {
    bg: 'transparent',
    hoverBg: 'rgba(255,255,255,0.05)',
    text: 'var(--text-muted)',
    border: '1px solid transparent',
    shadow: 'none',
    hoverShadow: 'none',
  },
};

const sizeMap: Record<ButtonSize, string> = {
  xs: 'px-3.5 py-1 text-[11px]',
  sm: 'px-5 py-2 text-xs',
  md: 'px-7 py-2.5 text-sm',
  lg: 'px-10 py-3.5 text-base',
};

export default function GlowButton({
  children,
  className,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  fullWidth = false,
  loading = false,
}: GlowButtonProps) {
  const v = variantMap[variant] || variantMap.primary;
  const isDisabled = disabled || loading;

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={cn(
        'relative rounded-full font-[family-name:var(--font-heading)] font-medium uppercase tracking-wider',
        'flex items-center justify-center gap-2 select-none cursor-pointer transition-all duration-200',
        sizeMap[size],
        fullWidth && 'w-full',
        isDisabled && 'opacity-40 cursor-not-allowed',
        className
      )}
      style={{
        background: v.bg,
        border: v.border,
        color: v.text,
        boxShadow: v.shadow,
        backdropFilter: variant === 'secondary' ? 'blur(12px)' : undefined,
        WebkitBackdropFilter: variant === 'secondary' ? 'blur(12px)' : undefined,
      }}
      whileHover={
        isDisabled
          ? undefined
          : {
              scale: 1.03,
              boxShadow: v.hoverShadow,
            }
      }
      whileTap={isDisabled ? undefined : { scale: 0.97 }}
      transition={{ duration: 0.2 }}
    >
      {loading ? <Logo3DSpinner size="xs" /> : children}
    </motion.button>
  );
}
