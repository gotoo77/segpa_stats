import type { SessionData, DnbData, CfgData } from '../types';

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
function optionalString(value: unknown): boolean {
  return value === undefined || typeof value === 'string';
}
function validCfg(value: unknown): value is CfgData {
  return object(value) && natural(value.inscrits) && natural(value.admis) &&
    natural(value.refuses) && (value.presents === undefined || natural(value.presents));
}
function validDnb(value: unknown): value is DnbData {
  const mentions = object(value) ? value.mentions : undefined;
  return validCfg(value) && object(mentions) &&
    natural(mentions.ab) && natural(mentions.b) && natural(mentions.tb);
}
export function validateSession(value: unknown): value is SessionData {
  if (!object(value) || typeof value.id !== 'string' || typeof value.year !== 'string' ||
      typeof value.bassinName !== 'string' || typeof value.lastUpdated !== 'string' ||
      !Array.isArray(value.establishments) || !optionalString(value.notes) ||
      (value.dataOrigin !== undefined && value.dataOrigin !== 'demo' && value.dataOrigin !== 'user'))
    return false;

  if (value.regions !== undefined && (!Array.isArray(value.regions) ||
      !value.regions.every(r => object(r) && typeof r.id === 'string' &&
        typeof r.name === 'string' && typeof r.color === 'string'))) return false;
  const ids = new Set<string>();
  for (const est of value.establishments) {
    if (!object(est) || typeof est.id !== 'string' || !est.id.trim() ||
        ids.has(est.id) || typeof est.name !== 'string' || !est.name.trim() ||
        !natural(est.effectifClasse) || !optionalString(est.city) ||
        !optionalString(est.bassin) || !optionalString(est.color) ||
        !validDnb(est.dnb) || !validCfg(est.cfg) ||
        (est.dnbComplete !== undefined && typeof est.dnbComplete !== 'boolean') ||
        (est.cfgComplete !== undefined && typeof est.cfgComplete !== 'boolean')) return false;
    ids.add(est.id);
  }

  if (value.submissions !== undefined) {
    if (!Array.isArray(value.submissions)) return false;
    const submissionIds = new Set<string>();
    for (const sub of value.submissions) {
      if (!object(sub) || typeof sub.id !== 'string' || !sub.id.trim() ||
          submissionIds.has(sub.id) ||
          typeof sub.establishmentName !== 'string' || !sub.establishmentName.trim() ||
          typeof sub.submittedBy !== 'string' || !sub.submittedBy.trim() ||
          typeof sub.submittedAt !== 'string' ||
          !['pending', 'approved', 'modified'].includes(String(sub.status)) ||
          !optionalString(sub.city) || !optionalString(sub.bassin) ||
          !optionalString(sub.color) || !optionalString(sub.teacherComment) ||
          !optionalString(sub.directorNotes) || !natural(sub.effectifClasse) ||
          !validDnb(sub.dnb) || !validCfg(sub.cfg)) return false;
      submissionIds.add(sub.id);
    }
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
