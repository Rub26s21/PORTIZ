'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

interface Logo3DSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

const sizeMap = {
  xs: { img: 20, ring: 32 },
  sm: { img: 28, ring: 44 },
  md: { img: 48, ring: 70 },
  lg: { img: 80, ring: 110 },
  xl: { img: 120, ring: 160 },
};

export default function Logo3DSpinner({ size = 'md', showText = false, className = '' }: Logo3DSpinnerProps) {
  const { img, ring } = sizeMap[size];

  return (
    <div className={`relative inline-flex flex-col items-center justify-center ${className}`}>

      {/* 3D Perspective Wrapper */}
      <div
        className="relative flex items-center justify-center"
        style={{
          width: ring,
          height: ring,
          perspective: 800,
        }}
      >
        {/* Outer Orbiting Buffering Ring 1 */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-t-cyan-400 border-r-transparent border-b-yellow-400 border-l-transparent"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
          style={{
            boxShadow: '0 0 15px rgba(0, 229, 255, 0.4), inset 0 0 15px rgba(255, 215, 0, 0.3)',
          }}
        />

        {/* Outer Orbiting Buffering Ring 2 (Reverse) */}
        <motion.div
          className="absolute rounded-full border border-dashed border-cyan-300 opacity-60"
          style={{ width: ring - 8, height: ring - 8 }}
          animate={{ rotate: -360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />

        {/* 3D Rotating Logo Core */}
        <motion.div
          className="relative flex items-center justify-center"
          animate={{
            rotateY: [0, 180, 360],
            rotateX: [0, 15, 0, -15, 0],
          }}
          transition={{
            rotateY: { duration: 3, repeat: Infinity, ease: 'linear' },
            rotateX: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
          }}
          style={{
            transformStyle: 'preserve-3d',
            filter: 'drop-shadow(0 4px 12px rgba(0, 229, 255, 0.5))',
          }}
        >
          <Image
            src="/logo.png"
            alt="Electronics Club Logo"
            width={img}
            height={img}
            className="object-contain"
            priority
          />
        </motion.div>

        {/* Pulsing Backlight Glow */}
        <motion.div
          className="absolute inset-2 rounded-full pointer-events-none"
          animate={{
            scale: [0.95, 1.1, 0.95],
            opacity: [0.3, 0.7, 0.3],
          }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            background: 'radial-gradient(circle, rgba(0, 229, 255, 0.35) 0%, rgba(255, 215, 0, 0.15) 60%, transparent 100%)',
          }}
        />
      </div>

      {showText && (
        <span className="font-[family-name:var(--font-heading)] font-semibold text-xs text-[#00E5FF] tracking-widest uppercase mt-2 animate-pulse">
          BUFFING / LOADING...
        </span>
      )}
    </div>
  );
}
