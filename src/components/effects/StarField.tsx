'use client';

import { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  radius: number;
  baseOpacity: number;
  twinkleSpeed: number;
  offset: number;
  drift: boolean;
  dx: number;
  dy: number;
}

interface ShootingStar {
  x: number;
  y: number;
  length: number;
  angle: number;
  speed: number;
  opacity: number;
  active: boolean;
  timer: number;
}

export default function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Generate stars
    const stars: Star[] = [];
    for (let i = 0; i < 200; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: 0.3 + Math.random() * 1.5,
        baseOpacity: 0.3 + Math.random() * 0.7,
        twinkleSpeed: 0.001 + Math.random() * 0.003,
        offset: Math.random() * Math.PI * 2,
        drift: Math.random() < 0.1,
        dx: (Math.random() - 0.5) * 0.04,
        dy: (Math.random() - 0.5) * 0.02,
      });
    }

    // Shooting stars
    const shootingStars: ShootingStar[] = [
      { x: 0, y: 0, length: 120, angle: Math.PI / 4, speed: 8, opacity: 0, active: false, timer: 0 },
      { x: 0, y: 0, length: 100, angle: Math.PI / 5, speed: 10, opacity: 0, active: false, timer: 0 },
      { x: 0, y: 0, length: 80, angle: Math.PI / 3, speed: 6, opacity: 0, active: false, timer: 0 },
    ];

    let lastShootingTime = Date.now();

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const now = Date.now();

      // Draw stars
      for (const star of stars) {
        const twinkle = Math.sin(now * star.twinkleSpeed + star.offset);
        const opacity = star.baseOpacity * (0.5 + 0.5 * twinkle);

        if (star.drift) {
          star.x += star.dx;
          star.y += star.dy;
          if (star.x > canvas.width) star.x = 0;
          if (star.x < 0) star.x = canvas.width;
          if (star.y > canvas.height) star.y = 0;
          if (star.y < 0) star.y = canvas.height;
        }

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.fill();
      }

      // Shooting stars
      if (now - lastShootingTime > 6000 + Math.random() * 6000) {
        const inactive = shootingStars.find(s => !s.active);
        if (inactive) {
          inactive.x = Math.random() * canvas.width * 0.8;
          inactive.y = Math.random() * canvas.height * 0.3;
          inactive.opacity = 1;
          inactive.active = true;
          inactive.timer = 0;
          lastShootingTime = now;
        }
      }

      for (const ss of shootingStars) {
        if (!ss.active) continue;
        ss.timer++;
        ss.x += Math.cos(ss.angle) * ss.speed;
        ss.y += Math.sin(ss.angle) * ss.speed;
        ss.opacity -= 0.02;

        if (ss.opacity <= 0) {
          ss.active = false;
          continue;
        }

        const endX = ss.x - Math.cos(ss.angle) * ss.length;
        const endY = ss.y - Math.sin(ss.angle) * ss.length;

        const gradient = ctx.createLinearGradient(ss.x, ss.y, endX, endY);
        gradient.addColorStop(0, `rgba(255, 255, 255, ${ss.opacity})`);
        gradient.addColorStop(1, `rgba(255, 255, 255, 0)`);

        ctx.beginPath();
        ctx.moveTo(ss.x, ss.y);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ opacity: 0.9 }}
    />
  );
}
