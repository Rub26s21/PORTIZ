'use client';

import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export default function AnimatedCursor() {
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const trailX = useMotionValue(-100);
  const trailY = useMotionValue(-100);

  const springConfig = { damping: 25, stiffness: 700 };
  const trailConfig = { damping: 30, stiffness: 200 };

  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);
  const trailXSpring = useSpring(trailX, trailConfig);
  const trailYSpring = useSpring(trailY, trailConfig);

  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      trailX.set(e.clientX);
      trailY.set(e.clientY);
      if (!isVisible) setIsVisible(true);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        target.closest('button') ||
        target.closest('a') ||
        target.dataset.cursor === 'pointer'
      ) {
        setIsHovering(true);
      }
    };

    const handleMouseOut = () => {
      setIsHovering(false);
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    window.addEventListener('mousemove', moveCursor);
    window.addEventListener('mouseover', handleMouseOver);
    window.addEventListener('mouseout', handleMouseOut);
    document.documentElement.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      window.removeEventListener('mouseover', handleMouseOver);
      window.removeEventListener('mouseout', handleMouseOut);
      document.documentElement.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [cursorX, cursorY, trailX, trailY, isVisible]);

  if (typeof window !== 'undefined' && 'ontouchstart' in window) {
    return null;
  }

  return (
    <>
      <style jsx global>{`
        * {
          cursor: none !important;
        }
      `}</style>

      {/* Trail dot */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9999]"
        style={{
          x: trailXSpring,
          y: trailYSpring,
          translateX: '-50%',
          translateY: '-50%',
        }}
      >
        <motion.div
          animate={{
            width: isHovering ? 40 : 20,
            height: isHovering ? 40 : 20,
            opacity: isVisible ? (isHovering ? 0.15 : 0.2) : 0,
          }}
          transition={{ duration: 0.3 }}
          className="rounded-full"
          style={{
            background: isHovering
              ? 'radial-gradient(circle, rgba(59,130,246,0.5) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(37,99,235,0.3) 0%, transparent 70%)',
          }}
        />
      </motion.div>

      {/* Main cursor orb */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[10000]"
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
          translateX: '-50%',
          translateY: '-50%',
        }}
      >
        <motion.div
          animate={{
            width: isHovering ? 20 : 10,
            height: isHovering ? 20 : 10,
            opacity: isVisible ? 1 : 0,
          }}
          transition={{ duration: 0.2 }}
          className="rounded-full"
          style={{
            background: isHovering
              ? 'radial-gradient(circle, #3b82f6 0%, rgba(59,130,246,0.5) 50%, transparent 100%)'
              : 'radial-gradient(circle, #2563eb 0%, rgba(37,99,235,0.5) 50%, transparent 100%)',
            boxShadow: isHovering
              ? '0 0 15px rgba(59,130,246,0.6), 0 0 30px rgba(59,130,246,0.3)'
              : '0 0 10px rgba(37,99,235,0.6), 0 0 20px rgba(37,99,235,0.3)',
          }}
        />
      </motion.div>
    </>
  );
}
