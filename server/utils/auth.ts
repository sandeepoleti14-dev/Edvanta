import crypto from 'crypto';
import { CookieOptions, NextFunction, Request, Response } from 'express';
import { UserRole } from '../../shared/types';

// In-memory random fallback when SESSION_SECRET env var is not configured
const EPHEMERAL_SECRET = crypto.randomBytes(32).toString('hex');

function getSigningSecret(): string {
  const envSecret = process.env.SESSION_SECRET?.trim();
  return envSecret && envSecret.length >= 16 ? envSecret : EPHEMERAL_SECRET;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, originalHex] = parts;
  if (!salt || !originalHex) return false;
  const derived = crypto.scryptSync(password, salt, 64);
  const original = Buffer.from(originalHex, 'hex');
  if (derived.length !== original.length) return false;
  return crypto.timingSafeEqual(derived, original);
}

export interface SessionPayload {
  userId: number;
  role: UserRole;
  exp: number;
}

export function signSessionToken(userId: number, role: UserRole): string {
  const payload: SessionPayload = {
    userId,
    role,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
  };
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', getSigningSecret()).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [encoded, sig] = parts;
  if (!encoded || !sig) return null;

  const expectedSig = crypto.createHmac('sha256', getSigningSecret()).update(encoded).digest('base64url');
  const sigBuf = Buffer.from(sig, 'utf8');
  const expectedBuf = Buffer.from(expectedSig, 'utf8');
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as SessionPayload;
    if (typeof parsed.userId !== 'number' || (parsed.role !== 'student' && parsed.role !== 'teacher')) {
      return null;
    }
    if (typeof parsed.exp !== 'number' || parsed.exp < Date.now()) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const result: Record<string, string> = {};
  if (!cookieHeader) return result;
  const pairs = cookieHeader.split(';');
  for (const pair of pairs) {
    const idx = pair.indexOf('=');
    if (idx === -1) continue;
    const key = pair.slice(0, idx).trim();
    const val = pair.slice(idx + 1).trim();
    if (key) {
      result[key] = decodeURIComponent(val);
    }
  }
  return result;
}

export const SESSION_COOKIE_NAME = 'adaptix_session';

export function setSessionCookie(res: Response, token: string): void {
  const opts: CookieOptions & { partitioned?: boolean } = {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    partitioned: true,
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
  res.cookie(SESSION_COOKIE_NAME, token, opts);
}

export function clearSessionCookie(res: Response): void {
  const opts: CookieOptions & { partitioned?: boolean } = {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    partitioned: true,
    path: '/',
  };
  res.clearCookie(SESSION_COOKIE_NAME, opts);
}

export interface AuthenticatedRequest extends Request {
  authUser?: {
    id: number;
    name: string;
    email: string;
    role: UserRole;
    classId: number | null;
    gradeLevel: string;
    streakDays: number;
  };
}

export function extractTokenFromRequest(req: Request): { token: string | null; viaCookie: boolean } {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice('Bearer '.length).trim();
    if (token) return { token, viaCookie: false };
  }
  const cookies = parseCookies(req.headers.cookie);
  const cookieToken = cookies[SESSION_COOKIE_NAME];
  if (cookieToken) {
    return { token: cookieToken, viaCookie: true };
  }
  return { token: null, viaCookie: false };
}

export function verifyCookieMutationOrigin(req: Request, res: Response, next: NextFunction): void {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    next();
    return;
  }
  const { viaCookie } = extractTokenFromRequest(req);
  if (!viaCookie) {
    next();
    return;
  }
  const customHeader = req.headers['x-requested-with'];
  if (customHeader === 'XMLHttpRequest' || customHeader === 'ADAPTIX-SPA') {
    next();
    return;
  }
  const origin = req.headers.origin;
  const host = (req.headers['x-forwarded-host'] as string | undefined) || req.headers.host;
  if (origin && host) {
    try {
      const originHost = new URL(origin).host;
      if (originHost === host) {
        next();
        return;
      }
    } catch {
      // fall through to 403
    }
  }
  res.status(403).json({ error: 'Invalid request origin for session action.' });
}
