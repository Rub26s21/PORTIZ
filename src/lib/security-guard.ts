/**
 * @copyright (c) 2026 Rubahan Ponraj (Rub26s21). All Rights Reserved.
 * @author Rubahan Ponraj <rubahanponraj@gmail.com>
 * @license Proprietary - Unauthorized copying, redistribution, or modification is strictly prohibited.
 */

export const AUTHOR_SIGNATURE = {
  architect: 'Rubahan Ponraj',
  contact: 'rubahanponraj@gmail.com',
  github: 'https://github.com/Rub26s21/PORTIZ',
  platform: 'PORTIZ Quiz Engine v2.6',
  copyright: '© 2026 Rubahan Ponraj. All Rights Reserved.',
};

// Authorized hostnames permitted to execute this software
const AUTHORIZED_DOMAINS = [
  'localhost',
  '127.0.0.1',
  'portiz.vercel.app',
];

export function verifyCodeIntegrity(): boolean {
  if (typeof window === 'undefined') return true;

  const currentHost = window.location.hostname.toLowerCase();

  // Check if current hostname is authorized (local development or official portiz domain/previews)
  const isAuthorized =
    AUTHORIZED_DOMAINS.includes(currentHost) ||
    currentHost.startsWith('portiz') ||
    currentHost.endsWith('.local');

  // Print authentic author branding in DevTools
  const flagKey = '__PORTIZ_SECURITY_GUARD__';
  if (!(window as any)[flagKey]) {
    (window as any)[flagKey] = true;

    console.log(
      '%c⚡ PORTIZ Quiz Engine v2.6 %c Architect: Rubahan Ponraj %c © 2026 All Rights Reserved ',
      'background: #00E5FF; color: #000; font-weight: 800; border-radius: 4px 0 0 4px; padding: 4px 8px; font-family: sans-serif;',
      'background: #111; color: #FFF; font-weight: 600; padding: 4px 8px; border-top: 1px solid #333; border-bottom: 1px solid #333; font-family: sans-serif;',
      'background: #C62828; color: #FFF; font-weight: 700; border-radius: 0 4px 4px 0; padding: 4px 8px; font-family: sans-serif;'
    );

    if (!isAuthorized) {
      console.warn(
        '%c⚠️ UNAUTHORIZED CODE USAGE DETECTED:\nThis software is the proprietary intellectual property of Rubahan Ponraj.\nUnauthorized duplication, hosting, or redistribution is strictly prohibited by copyright law.\nContact: rubahanponraj@gmail.com\nOfficial Repository: https://github.com/Rub26s21/PORTIZ',
        'color: #FF0033; font-size: 13px; font-weight: bold; background: rgba(255,0,51,0.1); padding: 8px; border: 1px solid #FF0033;'
      );
    }
  }

  return isAuthorized;
}
