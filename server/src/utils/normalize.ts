export function normalizeCompanyName(name: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\b(sh\.?p\.?k\.?|sh\.?a\.?|ntp|ojq|llc|inc|ltd)\b/gi, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function generateOrderNumber(seq: number): string {
  const year = new Date().getFullYear();
  return `KI-${year}-${String(seq).padStart(4, '0')}`;
}

import crypto from 'crypto';
export function hashPII(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}
