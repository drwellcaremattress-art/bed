import 'dotenv/config';
import dotenv from 'dotenv';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';

dotenv.config({ path: '.env.local', override: true });

const COOKIE_NAME = 'alder_admin_token';
const JWT_EXPIRY_SECONDS = 60 * 60 * 24 * 7; // 7 days

const RUNTIME_JWT_SECRET =
  process.env.JWT_SECRET && process.env.JWT_SECRET.trim().length >= 16
    ? process.env.JWT_SECRET.trim()
    : crypto.randomBytes(32).toString('hex');

export interface AdminTokenPayload {
  sub: string;
  role: 'admin';
}

export interface AuthenticatedRequest extends Request {
  auth?: AdminTokenPayload;
  authMethod?: 'bearer' | 'cookie';
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!password || !hash) return false;
  return bcrypt.compare(password, hash);
}

export function signAuthToken(payload: AdminTokenPayload): string {
  return jwt.sign(payload, RUNTIME_JWT_SECRET, {
    expiresIn: JWT_EXPIRY_SECONDS,
    algorithm: 'HS256',
  });
}

export function verifyAuthToken(token: string): AdminTokenPayload | null {
  try {
    const decoded = jwt.verify(token, RUNTIME_JWT_SECRET) as jwt.JwtPayload;
    if (typeof decoded.sub === 'string' && decoded.role === 'admin') {
      return { sub: decoded.sub, role: 'admin' };
    }
    return null;
  } catch {
    return null;
  }
}

export function parseCookieHeader(cookieHeader?: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (!cookieHeader) return result;
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx <= 0) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (key) {
      try {
        result[key] = decodeURIComponent(val);
      } catch {
        result[key] = val;
      }
    }
  }
  return result;
}

export function setAuthCookie(res: Response, token: string): void {
  const isProd = process.env.NODE_ENV === 'production';
  const cookieAttrs = [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    `Max-Age=${JWT_EXPIRY_SECONDS}`,
    'HttpOnly',
    'SameSite=Lax',
    ...(isProd ? ['Secure'] : []),
  ];
  res.setHeader('Set-Cookie', cookieAttrs.join('; '));
}

export function clearAuthCookie(res: Response): void {
  const isProd = process.env.NODE_ENV === 'production';
  const cookieAttrs = [
    `${COOKIE_NAME}=`,
    'Path=/',
    'Max-Age=0',
    'HttpOnly',
    'SameSite=Lax',
    ...(isProd ? ['Secure'] : []),
  ];
  res.setHeader('Set-Cookie', cookieAttrs.join('; '));
}

export function extractAuthFromRequest(req: Request): {
  payload: AdminTokenPayload | null;
  method: 'bearer' | 'cookie' | null;
} {
  const authHeader = req.headers.authorization;
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    const bearerToken = authHeader.slice(7).trim();
    if (bearerToken) {
      const verified = verifyAuthToken(bearerToken);
      if (verified) return { payload: verified, method: 'bearer' };
    }
  }

  const cookies = parseCookieHeader(req.headers.cookie);
  const cookieToken = cookies[COOKIE_NAME];
  if (cookieToken) {
    const verified = verifyAuthToken(cookieToken);
    if (verified) return { payload: verified, method: 'cookie' };
  }

  return { payload: null, method: null };
}

function isSameOriginOrCustomHeader(req: Request): boolean {
  const xRequestedWith = req.headers['x-requested-with'];
  if (typeof xRequestedWith === 'string' && xRequestedWith.toLowerCase() === 'xmlhttprequest') {
    return true;
  }
  const host = req.headers.host;
  const origin = req.headers.origin;
  if (typeof origin === 'string' && typeof host === 'string') {
    try {
      return new URL(origin).host === host;
    } catch {
      return false;
    }
  }
  return false;
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const { payload, method } = extractAuthFromRequest(req);
  if (!payload || !method || payload.role !== 'admin') {
    res.status(401).json({ error: 'Admin authentication required.' });
    return;
  }

  const isMutating = !['GET', 'HEAD', 'OPTIONS'].includes(req.method.toUpperCase());
  if (isMutating && method === 'cookie' && !isSameOriginOrCustomHeader(req)) {
    res.status(403).json({ error: 'Cross-site request verification failed.' });
    return;
  }

  req.auth = payload;
  req.authMethod = method;
  next();
}

export function asSafeString(val: unknown, maxLen = 500): string {
  if (typeof val !== 'string') return '';
  return val.trim().slice(0, maxLen);
}

export function asSafeNumber(val: unknown, fallback = 0, min = 0, max = 100000000): number {
  const n = typeof val === 'number' ? val : typeof val === 'string' ? Number(val) : NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

export function sanitizeUrl(val: unknown): string {
  if (typeof val !== 'string') return '';
  const trimmed = val.trim().slice(0, 1000);
  if (!trimmed) return '';
  if (trimmed.startsWith('/')) return trimmed;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return trimmed;
    }
    return '';
  } catch {
    return '';
  }
}

export function timingSafeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}
