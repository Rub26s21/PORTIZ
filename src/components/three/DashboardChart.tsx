'use client';

import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

interface BarData {
  value: number;
  color: string;
  label: string;
}

function Bar({ position, height, color }: { position: [number, number, number]; height: number; color: string }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.scale.y = THREE.MathUtils.lerp(
        meshRef.current.scale.y,
        height,
        0.05
      );
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <boxGeometry args={[0.4, 1, 0.4]} />
      <meshStandardMaterial
        color={color}
        transparent
        opacity={0.8}
        emissive={color}
        emissiveIntensity={0.3}
      />
    </mesh>
  );
}

interface DashboardChartProps {
  data?: BarData[];
  className?: string;
}

export default function DashboardChart({ data, className }: DashboardChartProps) {
  const defaultData: BarData[] = data || [
    { value: 3, color: '#00cfff', label: 'Participants' },
    { value: 2, color: '#12ff80', label: 'Rounds' },
    { value: 1.5, color: '#f5c518', label: 'Attempts' },
    { value: 1, color: '#7c3aed', label: 'Submitted' },
    { value: 0.5, color: '#ff3b5c', label: 'DQ' },
  ];

  return (
    <div className={className} style={{ width: '100%', height: '100%' }}>
      <Canvas
        camera={{ position: [3, 3, 5], fov: 40 }}
        style={{ background: 'transparent' }}
        gl={{ alpha: true }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[5, 5, 5]} intensity={1} />
        <pointLight position={[-5, 3, -5]} intensity={0.5} color="#00cfff" />

        {/* Grid floor */}
        <gridHelper
          args={[6, 10, '#1a2a4a', '#1a2a4a']}
          position={[0, 0, 0]}
        />

        {defaultData.map((bar, i) => (
          <Bar
            key={i}
            position={[(i - 2) * 0.8, bar.value / 2, 0]}
            height={bar.value}
            color={bar.color}
          />
        ))}

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.5}
          enableRotate={false}
        />
      </Canvas>
    </div>
  );
}
