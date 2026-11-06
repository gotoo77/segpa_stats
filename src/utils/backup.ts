import type { SessionData } from '../types';

export interface CompleteBackup {
  format: 'statsegpa-backup';
  version: 1;
  exportedAt: string;
  activeYear: string;
  sessions: Record<string, SessionData>;
}

function object(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
function natural(value: unknown): boolean {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}
export function validateSession(value: unknown): value is SessionData {
  if (!object(value) || typeof value.id !== 'string' || typeof value.year !== 'string' ||
      typeof value.bassinName !== 'string' || typeof value.lastUpdated !== 'string' ||
      !Array.isArray(value.establishments)) return false;
  if (value.regions !== undefined && (!Array.isArray(value.regions) ||
      !value.regions.every(r => object(r) && typeof r.id === 'string' && typeof r.name === 'string' && typeof r.color === 'string'))) return false;
  if (value.submissions !== undefined && !Array.isArray(value.submissions)) return false;
  const ids = new Set<string>();
  for (const e of value.establishments) {
    if (!object(e) || typeof e.id !== 'string' || !e.id.trim() ||
        ids.has(e.id) || typeof e.name !== 'string' || !e.name.trim() ||
        !natural(e.effectifClasse) || !object(e.dnb) || !object(e.cfg)) return false;
    ids.add(e.id);
    for (const item of [e.dnb, e.cfg]) {
      if (!natural(item.inscrits) || !natural(item.admis) || !natural(item.refuses) ||
          (item.presents !== undefined && !natural(item.presents))) return false;
    }
    if (!object(e.dnb.mentions) || !natural(e.dnb.mentions.ab) ||
        !natural(e.dnb.mentions.b) || !natural(e.dnb.mentions.tb)) return false;
    if (e.dnbComplete !== undefined && typeof e.dnbComplete !== 'boolean') return false;
    if (e.cfgComplete !== undefined && typeof e.cfgComplete !== 'boolean') return false;
  }
  return true;
}

export function createCompleteBackup(sessions: Record<string, SessionData>, activeYear: string): CompleteBackup {
  return { format: 'statsegpa-backup', version: 1, exportedAt: new Date().toISOString(), activeYear, sessions };
}

export function parseCompleteBackup(value: unknown): CompleteBackup {
  if (!object(value) || value.format !== 'statsegpa-backup' || value.version !== 1 ||
      typeof value.exportedAt !== 'string' || typeof value.activeYear !== 'string' ||
      !object(value.sessions)) throw new Error('Sauvegarde complète inconnue ou invalide.');
  const entries = Object.entries(value.sessions);
  if (!entries.length || !entries.every(([year, data]) =>
    /^20\d{2}$/.test(year) && validateSession(data) && data.year.includes(year))) {
    throw new Error('Sessions absentes ou mal formées dans la sauvegarde.');
  }
  if (!value.sessions[value.activeYear]) throw new Error('Année active absente de la sauvegarde.');
  return value as unknown as CompleteBackup;
}
