'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { verifyCodeIntegrity } from '@/lib/security-guard';

const AuroraBackground = dynamic(() => import('./AuroraBackground'), { ssr: false });
const StarField = dynamic(() => import('./StarField'), { ssr: false });
const FloatingOrbs = dynamic(() => import('./FloatingOrbs'), { ssr: false });

export default function GlobalEffects() {
  const [unauthorized, setUnauthorized] = useState(false);

  useEffect(() => {
    const isAuthorized = verifyCodeIntegrity();
    if (!isAuthorized) {
      setUnauthorized(true);
    }
  }, []);

  return (
    <>
      <AuroraBackground />
      <StarField />
      <FloatingOrbs />

      {/* Anti-Theft Watermark Guard Banner (Only triggered on rogue unauthorized domains) */}
      {unauthorized && (
        <div className="fixed top-0 left-0 right-0 z-[999999] bg-[#C62828] text-white p-3 px-6 text-center text-xs font-mono shadow-2xl flex items-center justify-between gap-4">
          <span>
            ⚠️ <strong>SECURITY ALERT:</strong> Unauthorized code deployment detected. This software is proprietary and copyrighted by <strong>Rubahan Ponraj</strong>. Unauthorized usage is legally prohibited.
          </span>
          <span className="text-[10px] underline opacity-90">
            Contact: rubahanponraj@gmail.com
          </span>
        </div>
      )}
    </>
  );
}
