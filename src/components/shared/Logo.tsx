'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
  animate?: boolean;
}

const sizes = {
  sm: { img: 28, text: 'text-sm' },
  md: { img: 38, text: 'text-xl' },
  lg: { img: 56, text: 'text-3xl' },
};

export default function Logo({ size = 'md', showText = true, className, animate = true }: LogoProps) {
  const s = sizes[size];

  return (
    <motion.div
      className={cn('flex items-center gap-2.5 select-none flex-shrink-0 pr-2', className)}
      whileHover={animate ? { scale: 1.04 } : undefined}
      transition={{ duration: 0.2 }}
    >
      {/* Official Electronics Club Logo Image */}
      <div className="relative flex items-center justify-center">
        <Image
          src="/logo.png"
          alt="Electronics Club Logo"
          width={s.img}
          height={s.img}
          className="object-contain filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
          priority
        />
      </div>

      {showText && (
        <div className="flex flex-col">
          <span
            className={cn(
              'font-[family-name:var(--font-display)] font-extrabold tracking-tight text-[#FFFFFF]',
              s.text
            )}
          >
            ELECTRONICS CLUB
          </span>
          {size !== 'sm' && (
            <span className="text-[10px] text-[#94A3B8] tracking-[0.2em] uppercase font-[family-name:var(--font-heading)] font-semibold">
              Quiz Championship Portal
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
}
