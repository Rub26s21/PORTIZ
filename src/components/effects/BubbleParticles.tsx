'use client';

import { useEffect, useRef } from 'react';

interface Bubble {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  opacity: number;
  color: string;
  phase: number;
}

export default function BubbleParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bubblesRef = useRef<Bubble[]>([]);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const colors = [
      'rgba(37, 99, 235, VAR)',
      'rgba(59, 130, 246, VAR)',
      'rgba(96, 165, 250, VAR)',
      'rgba(147, 197, 253, VAR)',
      'rgba(219, 234, 254, VAR)',
    ];

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const createBubble = (): Bubble => ({
      x: Math.random() * canvas.width,
      y: canvas.height + Math.random() * 100,
      size: 8 + Math.random() * 32,
      speedY: 0.2 + Math.random() * 0.8,
      speedX: (Math.random() - 0.5) * 0.3,
      opacity: 0.03 + Math.random() * 0.12,
      color: colors[Math.floor(Math.random() * colors.length)],
      phase: Math.random() * Math.PI * 2,
    });

    const initBubbles = () => {
      bubblesRef.current = [];
      for (let i = 0; i < 60; i++) {
        const bubble = createBubble();
        bubble.y = Math.random() * canvas.height;
        bubblesRef.current.push(bubble);
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      bubblesRef.current.forEach((bubble, index) => {
        bubble.y -= bubble.speedY;
        bubble.x += Math.sin(bubble.phase + Date.now() * 0.001) * bubble.speedX;
        bubble.phase += 0.01;

        if (bubble.y + bubble.size < 0) {
          bubblesRef.current[index] = createBubble();
          return;
        }

        const gradient = ctx.createRadialGradient(
          bubble.x,
          bubble.y,
          0,
          bubble.x,
          bubble.y,
          bubble.size
        );

        const colorWithOpacity = bubble.color.replace('VAR', String(bubble.opacity));
        const colorTransparent = bubble.color.replace('VAR', '0');

        gradient.addColorStop(0, colorWithOpacity);
        gradient.addColorStop(0.5, colorWithOpacity.replace(String(bubble.opacity), String(bubble.opacity * 0.5)));
        gradient.addColorStop(1, colorTransparent);

        ctx.beginPath();
        ctx.arc(bubble.x, bubble.y, bubble.size, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    resizeCanvas();
    initBubbles();
    animate();

    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[1]"
      style={{ opacity: 0.8 }}
    />
  );
}
