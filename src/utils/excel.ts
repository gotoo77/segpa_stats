import * as XLSX from 'xlsx';
import { Establishment, SessionData } from '../types';
import { computeDnb, computeCfg } from './calculations';

export function exportSessionToExcel(session: SessionData) {
  const wb = createSessionWorkbook(session);
  XLSX.writeFile(wb, 'StatSEGPA_' + session.year.replace(/\s+/g, '_') + '.xlsx');
}

export function createSessionWorkbook(session: SessionData): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();
  const sourceRows = session.establishments.map((e) => ({
    Identifiant: e.id, 'Établissement': e.name, Ville: e.city || '',
    Bassin: e.bassin || '', Couleur: e.color || '',
    Effectif_Classe: e.effectifClasse,
    DNB_Inscrits: e.dnb.inscrits, DNB_Presents: e.dnb.presents ?? '',
    DNB_Admis: e.dnb.admis, DNB_Refuses: e.dnb.refuses,
    DNB_Mention_AB: e.dnb.mentions.ab, DNB_Mention_B: e.dnb.mentions.b,
    DNB_Mention_TB: e.dnb.mentions.tb,
    CFG_Inscrits: e.cfg.inscrits, CFG_Presents: e.cfg.presents ?? '',
    CFG_Admis: e.cfg.admis, CFG_Refuses: e.cfg.refuses,
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sourceRows), 'Donnees_StatSEGPA');

  // 1. Feuille DNB PRO
  const dnbRows = session.establishments.map((e) => {
    const c = computeDnb(e.dnb, e.effectifClasse);
    return {
      'Établissement': e.name,
      'Secteur / Ville': e.city || '',
      'Effectif Classe 3e': e.effectifClasse,
      'Candidats Inscrits': e.dnb.inscrits,
      'Candidats Admis': e.dnb.admis,
      'Candidats Refusés': e.dnb.refuses,
      'Mention Assez Bien': e.dnb.mentions.ab,
      'Mention Bien': e.dnb.mentions.b,
      'Mention Très Bien': e.dnb.mentions.tb,
      'Total Mentions': c.totalMentions,
      'Sans Mention': c.sansMention,
      '% Présentation DNB (/ Classe)': `${c.tauxPresentation}%`,
      '% Réussite / Inscrits': `${c.tauxInscrits}%`,
      '% Réussite / Présents': `${c.tauxPresents}%`,
      '% Mentions / Admis': `${c.tauxMentions}%`,
    };
  });
  const wsDnb = XLSX.utils.json_to_sheet(dnbRows);
  XLSX.utils.book_append_sheet(wb, wsDnb, 'DNB Professionnel');

  // 2. Feuille CFG
  const cfgRows = session.establishments.map((e) => {
    const c = computeCfg(e.cfg, e.effectifClasse);
    return {
      'Établissement': e.name,
      'Secteur / Ville': e.city || '',
      'Effectif Classe 3e': e.effectifClasse,
      'Candidats Inscrits': e.cfg.inscrits,
      'Candidats Admis': e.cfg.admis,
      'Candidats Refusés': e.cfg.refuses,
      '% Réussite / Inscrits': `${c.tauxInscrits}%`,
      '% Réussite / Présents': `${c.tauxPresents}%`,
    };
  });
  const wsCfg = XLSX.utils.json_to_sheet(cfgRows);
  XLSX.utils.book_append_sheet(wb, wsCfg, 'CFG');

  // 3. Feuille Synthèse Combinée
  const combinedRows = session.establishments.map((e) => {
    const dnbC = computeDnb(e.dnb, e.effectifClasse);
    const cfgC = computeCfg(e.cfg, e.effectifClasse);
    return {
      'Établissement': e.name,
      'Effectif Classe 3e': e.effectifClasse,
      'DNB Inscrits': e.dnb.inscrits,
      'DNB % Présentation': `${dnbC.tauxPresentation}%`,
      'DNB % Réussite': `${dnbC.tauxPresents}%`,
      'CFG Inscrits': e.cfg.inscrits,
      'CFG % Réussite': `${cfgC.tauxPresents}%`,
    };
  });
  const wsCombined = XLSX.utils.json_to_sheet(combinedRows);
  XLSX.utils.book_append_sheet(wb, wsCombined, 'Synthèse Réseau');

  return wb;
}

export function downloadEmptyTemplate() {
  const wb = XLSX.utils.book_new();

  const templateRows = [
    {
      'Établissement': 'Collège Dutilleul',
      'Effectif_Classe': 17,
      'DNB_Inscrits': 14,
      'DNB_Admis': 12,
      'DNB_Refuses': 2,
      'DNB_Mention_AB': 3,
      'DNB_Mention_B': 1,
      'DNB_Mention_TB': 0,
      'CFG_Inscrits': 17,
      'CFG_Admis': 16,
      'CFG_Refuses': 1,
    },
    {
      'Établissement': 'Collège Cremaillel',
      'Effectif_Classe': 14,
      'DNB_Inscrits': 13,
      'DNB_Admis': 10,
      'DNB_Refuses': 3,
      'DNB_Mention_AB': 4,
      'DNB_Mention_B': 0,
      'DNB_Mention_TB': 0,
      'CFG_Inscrits': 14,
      'CFG_Admis': 14,
      'CFG_Refuses': 0,
    },
    {
      'Établissement': 'Collège Richtbeurg',
      'Effectif_Classe': 12,
      'DNB_Inscrits': 8,
      'DNB_Admis': 5,
      'DNB_Refuses': 3,
      'DNB_Mention_AB': 0,
      'DNB_Mention_B': 0,
      'DNB_Mention_TB': 0,
      'CFG_Inscrits': 12,
      'CFG_Admis': 10,
      'CFG_Refuses': 2,
    },
  ];

  const ws = XLSX.utils.json_to_sheet(templateRows);
  XLSX.utils.book_append_sheet(wb, ws, 'Modele_Saisie_SEGPA');
  XLSX.writeFile(wb, 'Modele_Saisie_StatSEGPA.xlsx');
}

function pick(row: Record<string, unknown>, names: string[]): unknown {
  for (const name of names) {
    const value = row[name];
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return undefined;
}

function numeric(row: Record<string, unknown>, names: string[], fallback: number, label: string): number {
  const raw = pick(row, names);
  const value = raw === undefined ? fallback : Number(raw);
  if (!Number.isInteger(value) || value < 0) throw new Error(label + ' : entier positif ou nul attendu');
  return value;
}

function optionalNumber(row: Record<string, unknown>, names: string[], label: string): number | undefined {
  return pick(row, names) === undefined ? undefined : numeric(row, names, 0, label);
}

export function parseWorkbook(workbook: XLSX.WorkBook, defaultBassin = 'Douaisis'): Establishment[] {
  const sheetName = workbook.Sheets.Donnees_StatSEGPA ? 'Donnees_StatSEGPA' : workbook.SheetNames[0];
  if (!sheetName) throw new Error('Classeur vide');
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[sheetName], { defval: null });
  if (rows.length === 0) throw new Error('Aucune ligne dans le classeur');
  const legacy = sheetName === 'DNB Professionnel';
  if (legacy && !workbook.Sheets.CFG) throw new Error('Ancien export incomplet : feuille CFG manquante');
  const cfgRows = new Map<string, Record<string, unknown>>();
  if (legacy) for (const row of XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets.CFG, { defval: null })) {
    const key = String(pick(row, ['Établissement', 'Etablissement']) || '').trim().toLowerCase();
    if (key) cfgRows.set(key, row);
  }
  const establishments = rows.map((row, index) => {
    const line = 'Ligne ' + (index + 2);
    if (pick(row, ['DNB_Inscrits', 'Candidats Inscrits', 'DNB Inscrits', 'CFG_Inscrits']) === undefined)
      throw new Error(line + ' : colonnes de résultats non reconnues');
    const name = String(pick(row, ['Établissement', 'Etablissement', 'etablissement', 'Collège', 'College', 'Nom']) || '').trim();
    if (!name) throw new Error(line + ' : nom établissement manquant');
    const cfgRow = legacy ? cfgRows.get(name.toLowerCase()) : row;
    if (!cfgRow) throw new Error(line + ' : résultats CFG introuvables pour ' + name);
    const effectif = numeric(row, ['Effectif_Classe', 'Effectif Classe 3e', 'Effectif Classe', 'Effectif'],
      numeric(cfgRow, ['CFG_Inscrits', 'Candidats Inscrits'], 0, line + ' CFG inscrits'), line + ' effectif classe');
    const dnbPresents = optionalNumber(row, ['DNB_Presents'], line + ' DNB présents');
    const cfgPresents = optionalNumber(cfgRow, ['CFG_Presents'], line + ' CFG présents');
    const dnb = {
      inscrits: numeric(row, ['DNB_Inscrits', 'Candidats Inscrits', 'DNB Inscrits'], 0, line + ' DNB inscrits'),
      ...(dnbPresents !== undefined ? { presents: dnbPresents } : {}),
      admis: numeric(row, ['DNB_Admis', 'Candidats Admis', 'DNB Admis'], 0, line + ' DNB admis'),
      refuses: numeric(row, ['DNB_Refuses', 'Candidats Refusés', 'DNB Refusés'], 0, line + ' DNB refusés'),
      mentions: {
        ab: numeric(row, ['DNB_Mention_AB', 'Mention Assez Bien', 'AB'], 0, line + ' mention AB'),
        b: numeric(row, ['DNB_Mention_B', 'Mention Bien', 'B'], 0, line + ' mention B'),
        tb: numeric(row, ['DNB_Mention_TB', 'Mention Très Bien', 'TB'], 0, line + ' mention TB'),
      },
    };
    const cfg = {
      inscrits: numeric(cfgRow, ['CFG_Inscrits', 'CFG Candidats Inscrits', 'Candidats Inscrits'], effectif, line + ' CFG inscrits'),
      ...(cfgPresents !== undefined ? { presents: cfgPresents } : {}),
      admis: numeric(cfgRow, ['CFG_Admis', 'CFG Candidats Admis', 'Candidats Admis'], 0, line + ' CFG admis'),
      refuses: numeric(cfgRow, ['CFG_Refuses', 'CFG Candidats Refusés', 'Candidats Refusés'], 0, line + ' CFG refusés'),
    };
    const errors = [...computeDnb(dnb, effectif).errors, ...computeCfg(cfg, effectif).errors];
    if (errors.length) throw new Error(line + ' (' + name + ') : ' + errors.join('; '));
    const color = String(pick(row, ['Couleur']) || '').trim();
    return {
      id: String(pick(row, ['Identifiant']) || ('imported-' + Date.now() + '-' + index)),
      name, city: String(pick(row, ['Ville', 'Secteur / Ville']) || '').trim(),
      bassin: String(pick(row, ['Bassin']) || defaultBassin).trim(),
      ...(color ? { color } : {}),
      effectifClasse: effectif, dnb, cfg,
    };
  });
  const ids = new Set(establishments.map((item) => item.id));
  if (ids.size !== establishments.length) throw new Error('Identifiants établissement dupliqués');
  return establishments;
}

export function parseExcelOrCsvFile(file: File, defaultBassin = 'Douaisis'): Promise<Establishment[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        resolve(parseWorkbook(XLSX.read(data, { type: 'array' }), defaultBassin));
      } catch (err) { reject(err); }
    };
    reader.onerror = () => reject(new Error('Lecture du fichier impossible'));
    reader.readAsArrayBuffer(file);
  });
}
