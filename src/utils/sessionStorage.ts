import type { SessionData } from '../types';

/** The persisted set is authoritative; defaults are for first use only. */
export function loadStoredSessions(
  saved: string | null,
  legacy: string | null,
  examples: Record<string, SessionData>,
): Record<string, SessionData> {
  if (saved !== null) {
    const parsed: unknown = JSON.parse(saved);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
      throw new Error('Stockage multiannuel invalide');
    const entries = Object.entries(parsed);
    if (!entries.length || !entries.every(([year, value]) =>
      /^20\d{2}$/.test(year) &&
      value && typeof value === 'object' && !Array.isArray(value) &&
      Array.isArray((value as SessionData).establishments) &&
      typeof (value as SessionData).year === 'string' &&
      (value as SessionData).year.includes(year)))
      throw new Error('Sessions locales mal formées');
    return parsed as Record<string, SessionData>;
  }

  if (legacy) {
    const older: unknown = JSON.parse(legacy);
    if (!older || typeof older !== 'object' || !Array.isArray((older as SessionData).establishments) ||
        typeof (older as SessionData).year !== 'string') throw new Error('Ancienne session illisible');
    const data = older as SessionData;
    const year = data.year.match(/20\d{2}/)?.[0] || '2026';
    return { ...examples, [year]: data };
  }
  return { ...examples };
}
