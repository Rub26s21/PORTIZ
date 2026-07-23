'use client';

export default function CircuitBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.04]">
      <svg
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <defs>
          <pattern
            id="circuit-pattern"
            x="0"
            y="0"
            width="200"
            height="200"
            patternUnits="userSpaceOnUse"
          >
            {/* Horizontal lines */}
            <line x1="0" y1="40" x2="60" y2="40" stroke="#2563eb" strokeWidth="1" />
            <line x1="80" y1="40" x2="140" y2="40" stroke="#2563eb" strokeWidth="1" />
            <line x1="160" y1="40" x2="200" y2="40" stroke="#2563eb" strokeWidth="1" />

            {/* Vertical lines */}
            <line x1="60" y1="0" x2="60" y2="40" stroke="#2563eb" strokeWidth="1" />
            <line x1="140" y1="40" x2="140" y2="100" stroke="#2563eb" strokeWidth="1" />
            <line x1="80" y1="100" x2="80" y2="160" stroke="#2563eb" strokeWidth="1" />

            {/* More horizontal */}
            <line x1="20" y1="100" x2="80" y2="100" stroke="#2563eb" strokeWidth="1" />
            <line x1="140" y1="100" x2="180" y2="100" stroke="#2563eb" strokeWidth="1" />
            <line x1="0" y1="160" x2="80" y2="160" stroke="#2563eb" strokeWidth="1" />
            <line x1="120" y1="160" x2="200" y2="160" stroke="#2563eb" strokeWidth="1" />

            {/* Diagonal connectors */}
            <line x1="60" y1="40" x2="80" y2="60" stroke="#2563eb" strokeWidth="1" />
            <line x1="80" y1="60" x2="80" y2="100" stroke="#2563eb" strokeWidth="1" />
            <line x1="140" y1="100" x2="120" y2="120" stroke="#2563eb" strokeWidth="1" />
            <line x1="120" y1="120" x2="120" y2="160" stroke="#2563eb" strokeWidth="1" />

            {/* Circuit nodes / dots */}
            <circle cx="60" cy="40" r="3" fill="#2563eb" />
            <circle cx="140" cy="40" r="2" fill="#3b82f6" />
            <circle cx="80" cy="100" r="3" fill="#2563eb" />
            <circle cx="140" cy="100" r="2" fill="#3b82f6" />
            <circle cx="80" cy="160" r="3" fill="#2563eb" />
            <circle cx="120" cy="160" r="2" fill="#3b82f6" />
            <circle cx="80" cy="60" r="2" fill="#f59e0b" />
            <circle cx="120" cy="120" r="2" fill="#f59e0b" />

            {/* IC chip shapes */}
            <rect x="155" y="130" width="20" height="12" rx="2" fill="none" stroke="#2563eb" strokeWidth="1" />
            <line x1="155" y1="134" x2="150" y2="134" stroke="#2563eb" strokeWidth="1" />
            <line x1="155" y1="138" x2="150" y2="138" stroke="#2563eb" strokeWidth="1" />
            <line x1="175" y1="134" x2="180" y2="134" stroke="#2563eb" strokeWidth="1" />
            <line x1="175" y1="138" x2="180" y2="138" stroke="#2563eb" strokeWidth="1" />

            {/* Small capacitor shape */}
            <line x1="25" y1="60" x2="25" y2="80" stroke="#2563eb" strokeWidth="1" />
            <line x1="20" y1="68" x2="30" y2="68" stroke="#2563eb" strokeWidth="2" />
            <line x1="20" y1="72" x2="30" y2="72" stroke="#2563eb" strokeWidth="2" />

            {/* Resistor zig-zag */}
            <polyline
              points="10,140 15,135 20,145 25,135 30,145 35,135 40,140"
              fill="none"
              stroke="#2563eb"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#circuit-pattern)" />
      </svg>
    </div>
  );
}
