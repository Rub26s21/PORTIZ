'use client';

import dynamic from 'next/dynamic';

const AuroraBackground = dynamic(() => import('./AuroraBackground'), { ssr: false });
const StarField = dynamic(() => import('./StarField'), { ssr: false });
const FloatingOrbs = dynamic(() => import('./FloatingOrbs'), { ssr: false });

export default function GlobalEffects() {
  return (
    <>
      <AuroraBackground />
      <StarField />
      <FloatingOrbs />
    </>
  );
}
