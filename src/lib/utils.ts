// Utility functions

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format date to IST display string
export function formatDateIST(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

// Get current IST time string
export function getCurrentIST(): string {
  return new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

// Format duration in seconds to MM:SS or HH:MM:SS
export function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${seconds
    .toString()
    .padStart(2, '0')}`;
}

// Calculate time remaining in seconds
export function getTimeRemaining(
  startedAt: string,
  durationMinutes: number,
  endTime: string
): number {
  const now = new Date().getTime();
  const started = new Date(startedAt).getTime();
  const roundEnd = new Date(endTime).getTime();
  const durationEnd = started + durationMinutes * 60 * 1000;
  const effectiveEnd = Math.min(durationEnd, roundEnd);
  const remaining = Math.max(0, Math.floor((effectiveEnd - now) / 1000));
  return remaining;
}

// Check if a round is currently live
export function isRoundLive(startTime: string, endTime: string): boolean {
  const now = new Date().getTime();
  return now >= new Date(startTime).getTime() && now <= new Date(endTime).getTime();
}

// Ordinal suffix for numbers
export function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// Truncate text
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

// Generate initials from name
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Delay helper
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Format and transform Google Drive or standard image URLs into direct display URLs
export function formatImageUrl(url: string | null | undefined): string {
  if (!url) return '';
  const trimmed = url.trim();

  // Convert Google Drive view/open/share links to direct CDN viewable links
  // Examples:
  // https://drive.google.com/file/d/1ABC123/view?usp=sharing
  // https://drive.google.com/open?id=1ABC123
  // https://drive.google.com/uc?id=1ABC123
  const driveFileIdMatch =
    trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
    trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/) ||
    trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);

  if (driveFileIdMatch && driveFileIdMatch[1]) {
    const fileId = driveFileIdMatch[1];
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }

  return trimmed;
}
