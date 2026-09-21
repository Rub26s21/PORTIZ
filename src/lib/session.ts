/**
 * Cryptographically secure session management for PORTIZ Admin
 * Uses Web Crypto API HMAC-SHA256 compatible with both Next.js Edge Runtime and Node.js.
 */

export interface AdminSessionPayload {
  userId: string;
  email: string;
  role: 'admin';
  displayName: string;
  exp: number; // Unix timestamp in ms
}

const SESSION_SECRET =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.PORTIZ_AUTH_SECRET ||
  'portiz-2026-rubahan-secure-auth-secret-key-982103';

const COOKIE_NAME = 'portiz_admin_token';
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

// Helper: Convert string to Uint8Array
function stringToUint8(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

// Helper: Convert Uint8Array to base64url
function uint8ToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Helper: Convert base64url to Uint8Array
function base64UrlToUint8(base64url: string): Uint8Array {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Get CryptoKey for HMAC-SHA256
async function getSigningKey(): Promise<CryptoKey> {
  const keyData = stringToUint8(SESSION_SECRET);
  return crypto.subtle.importKey(
    'raw',
    keyData as any,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

/**
 * Sign an admin session payload and return a compact token: `${payloadB64}.${signatureB64}`
 */
export async function signAdminSession(
  user: { id: string; email: string; displayName?: string }
): Promise<string> {
  const payload: AdminSessionPayload = {
    userId: user.id,
    email: user.email,
    role: 'admin',
    displayName: user.displayName || 'Admin',
    exp: Date.now() + SESSION_DURATION_MS,
  };

  const payloadStr = JSON.stringify(payload);
  const payloadB64 = uint8ToBase64Url(stringToUint8(payloadStr));

  const key = await getSigningKey();
  const signatureBytes = await crypto.subtle.sign(
    'HMAC',
    key,
    stringToUint8(payloadB64) as any
  );
  const signatureB64 = uint8ToBase64Url(new Uint8Array(signatureBytes));

  return `${payloadB64}.${signatureB64}`;
}

/**
 * Verify a token's HMAC signature and return the payload if valid and unexpired.
 */
export async function verifyAdminSession(
  token: string
): Promise<AdminSessionPayload | null> {
  try {
    if (!token || typeof token !== 'string') return null;

    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const [payloadB64, signatureB64] = parts;
    const key = await getSigningKey();
    const signatureBytes = base64UrlToUint8(signatureB64);

    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBytes as any,
      stringToUint8(payloadB64) as any
    );

    if (!isValid) return null;

    const payloadJson = new TextDecoder().decode(base64UrlToUint8(payloadB64));
    const payload: AdminSessionPayload = JSON.parse(payloadJson);

    if (Date.now() > payload.exp) {
      return null; // Expired
    }

    if (payload.role !== 'admin') {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export { COOKIE_NAME };
