'use client';

const ORB_COLORS = ['#A855F7', '#EC4899', '#06B6D4', '#7C3AED', '#F43F5E', '#3B82F6'];

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

export default function FloatingOrbs() {
  const orbs = Array.from({ length: 30 }, (_, i) => {
    const color = ORB_COLORS[i % ORB_COLORS.length];
    const size = randomBetween(4, 24);
    const opacity = randomBetween(0.15, 0.45);
    const duration = randomBetween(12, 28);
    const delay = randomBetween(0, 15);
    const left = randomBetween(0, 100);

    return { color, size, opacity, duration, delay, left, key: i };
  });

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      {orbs.map((orb) => (
        <div
          key={orb.key}
          className="absolute rounded-full"
          style={{
            width: orb.size,
            height: orb.size,
            left: `${orb.left}%`,
            bottom: '-5%',
            background: orb.color,
            opacity: 0,
            border: `1px solid ${orb.color}4D`,
            boxShadow: `0 0 6px ${orb.color}66`,
            animation: `orbFloat ${orb.duration}s ${orb.delay}s linear infinite`,
            ['--orb-opacity' as string]: orb.opacity,
          }}
        />
      ))}
    </div>
  );
}
