import type { Request } from 'express';

/** Client IP behind reverse proxy (Vite/nginx) */
export function clientIp(req: Request): string | undefined {
  const xf = req.headers['x-forwarded-for'];
  if (typeof xf === 'string') return xf.split(',')[0]?.trim() || undefined;
  if (Array.isArray(xf) && xf[0]) return xf[0].split(',')[0]?.trim();
  return req.ip || undefined;
}

export function clientUserAgent(req: Request): string | undefined {
  const ua = req.headers['user-agent'];
  return typeof ua === 'string' ? ua.slice(0, 512) : undefined;
}
