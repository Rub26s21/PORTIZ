'use client';

import HeaderNavbar from '@/components/shared/HeaderNavbar';
import QuizEntryCard from '@/components/quiz/QuizEntryCard';

export default function StudentEntryPage() {
  return (
    <div className="relative min-h-screen text-[var(--text-primary)] overflow-x-hidden">
      {/* Top Glass Header Navbar */}
      <HeaderNavbar />

      {/* Main Centered Quiz Entry Card Container */}
      <main className="pt-32 pb-20 px-4 flex items-center justify-center min-h-[90vh] relative z-10">
        <QuizEntryCard />
      </main>
    </div>
  );
}
