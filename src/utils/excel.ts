import * as XLSX from 'xlsx';
import { Establishment, SessionData } from '../types';
import { computeDnb, computeCfg, partMentions } from './calculations';

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
    DNB_Renseigne: e.dnbComplete === false ? 'NON' : 'OUI',
    CFG_Renseigne: e.cfgComplete === false ? 'NON' : 'OUI',
    DNB_Inscrits: e.dnb.inscrits, DNB_Presents: e.dnb.presents ?? '',
    DNB_Admis: e.dnb.admis, DNB_Refuses: e.dnb.refuses,
    DNB_Mention_AB: e.dnb.mentions.ab, DNB_Mention_B: e.dnb.mentions.b,
    DNB_Mention_TB: e.dnb.mentions.tb, DNB_Mention_TBF: e.dnb.mentions.tbf ?? 0,
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
      'Statut': e.dnbComplete === false ? 'N.R.' : 'Renseigné',
      'Candidats Inscrits': e.dnbComplete === false ? 'N.R.' : e.dnb.inscrits,
      'Candidats Admis': e.dnbComplete === false ? 'N.R.' : e.dnb.admis,
      'Candidats Refusés': e.dnbComplete === false ? 'N.R.' : e.dnb.refuses,
      'Mention Assez Bien': e.dnbComplete === false ? 'N.R.' : e.dnb.mentions.ab,
      'Mention Bien': e.dnbComplete === false ? 'N.R.' : e.dnb.mentions.b,
      'Mention Très Bien': e.dnbComplete === false ? 'N.R.' : e.dnb.mentions.tb,
      'Mention Très Bien avec félicitations du jury': e.dnbComplete === false ? 'N.R.' : (e.dnb.mentions.tbf ?? 0),
      '% AB / Mentions': e.dnbComplete === false ? 'N.R.' : `${partMentions(e.dnb.mentions.ab, c.totalMentions)}%`,
      '% B / Mentions': e.dnbComplete === false ? 'N.R.' : `${partMentions(e.dnb.mentions.b, c.totalMentions)}%`,
      '% TB / Mentions': e.dnbComplete === false ? 'N.R.' : `${partMentions(e.dnb.mentions.tb, c.totalMentions)}%`,
      '% TBF / Mentions': e.dnbComplete === false ? 'N.R.' : `${partMentions(e.dnb.mentions.tbf ?? 0, c.totalMentions)}%`,
      'Total Mentions': e.dnbComplete === false ? 'N.R.' : c.totalMentions,
      'Sans Mention': e.dnbComplete === false ? 'N.R.' : c.sansMention,
      '% Présentation DNB (/ Classe)': e.dnbComplete === false ? 'N.R.' : `${c.tauxPresentation}%`,
      '% Réussite / Inscrits': e.dnbComplete === false ? 'N.R.' : `${c.tauxInscrits}%`,
      '% Réussite / Présents': e.dnbComplete === false ? 'N.R.' : `${c.tauxPresents}%`,
      '% Mentions / Admis': e.dnbComplete === false ? 'N.R.' : `${c.tauxMentions}%`,
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
      'Statut': e.cfgComplete === false ? 'N.R.' : 'Renseigné',
      'Candidats Inscrits': e.cfgComplete === false ? 'N.R.' : e.cfg.inscrits,
      'Candidats Admis': e.cfgComplete === false ? 'N.R.' : e.cfg.admis,
      'Candidats Refusés': e.cfgComplete === false ? 'N.R.' : e.cfg.refuses,
      '% Réussite / Inscrits': e.cfgComplete === false ? 'N.R.' : `${c.tauxInscrits}%`,
      '% Réussite / Présents': e.cfgComplete === false ? 'N.R.' : `${c.tauxPresents}%`,
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
      'DNB Inscrits': e.dnbComplete === false ? 'N.R.' : e.dnb.inscrits,
      'DNB % Présentation': e.dnbComplete === false ? 'N.R.' : `${dnbC.tauxPresentation}%`,
      'DNB % Réussite': e.dnbComplete === false ? 'N.R.' : `${dnbC.tauxPresents}%`,
      'CFG Inscrits': e.cfgComplete === false ? 'N.R.' : e.cfg.inscrits,
      'CFG % Réussite': e.cfgComplete === false ? 'N.R.' : `${cfgC.tauxPresents}%`,
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
  if (legacy) {
    for (const row of XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets.CFG, { defval: null })) {
      const key = String(pick(row, ['Établissement', 'Etablissement']) || '').trim().toLocaleLowerCase('fr-FR');
      if (!key) throw new Error('Ancien Excel : un collège sans nom dans la feuille CFG');
      if (cfgRows.has(key)) throw new Error('Ancien Excel ambigu : collège homonyme dans la feuille CFG : ' + key);
      cfgRows.set(key, row);
    }
    const dnbNames = new Set<string>();
    for (const row of rows) {
      const key = String(pick(row, ['Établissement', 'Etablissement']) || '').trim().toLocaleLowerCase('fr-FR');
      if (!key) continue;
      if (dnbNames.has(key)) throw new Error('Ancien Excel ambigu : collège homonyme dans la feuille DNB : ' + key);
      dnbNames.add(key);
    }
  }
  const establishments = rows.map((row, index) => {
    const line = 'Ligne ' + (index + 2);
    if (pick(row, ['DNB_Inscrits', 'Candidats Inscrits', 'DNB Inscrits', 'CFG_Inscrits']) === undefined)
      throw new Error(line + ' : colonnes de résultats non reconnues');
    const name = String(pick(row, ['Établissement', 'Etablissement', 'etablissement', 'Collège', 'College', 'Nom']) || '').trim();
    if (!name) throw new Error(line + ' : nom établissement manquant');
    const cfgRow = legacy ? cfgRows.get(name.toLocaleLowerCase('fr-FR')) : row;
    if (!cfgRow) throw new Error(line + ' : résultats CFG introuvables pour ' + name);
    if (pick(row, ['DNB_Inscrits', 'Candidats Inscrits', 'DNB Inscrits']) === undefined ||
        pick(cfgRow, ['CFG_Inscrits', 'CFG Candidats Inscrits', 'Candidats Inscrits']) === undefined) {
      throw new Error(line + ' : colonnes DNB et CFG requises pour un import fiable');
    }
    const effectif = numeric(row, ['Effectif_Classe', 'Effectif Classe 3e', 'Effectif Classe', 'Effectif'],
      numeric(cfgRow, ['CFG_Inscrits', 'Candidats Inscrits'], 0, line + ' CFG inscrits'), line + ' effectif classe');
    const dnbPresents = optionalNumber(row, ['DNB_Presents'], line + ' DNB présents');
    // Colonne facultative pour conserver la compatibilité avec les anciens classeurs.
    const dnbTbf = optionalNumber(row, ['DNB_Mention_TBF', 'Mention Très Bien avec félicitations du jury', 'TBF'], line + ' mention TBF');
    const statusDnb = String(pick(row, ['DNB_Renseigne']) ?? 'OUI').trim().toUpperCase();
    const statusCfg = String(pick(row, ['CFG_Renseigne']) ?? 'OUI').trim().toUpperCase();
    if (!['OUI', 'NON'].includes(statusDnb) || !['OUI', 'NON'].includes(statusCfg))
      throw new Error(line + ' : statut renseigné attendu : OUI ou NON');
    const dnbComplete = statusDnb === 'OUI';
    const cfgComplete = statusCfg === 'OUI';
    const cfgPresents = optionalNumber(cfgRow, ['CFG_Presents'], line + ' CFG présents');
    // A missing result is never silently converted into a genuine zero.
    // Partial drafts remain allowed only when explicitly flagged as not entered.
    const requireColumns = (source: Record<string, unknown>, columns: string[][], exam: string) => {
      for (const options of columns) {
        if (pick(source, options) === undefined)
          throw new Error(line + ' (' + name + ') : champ manquant pour ' + exam + ' : ' + options[0]);
      }
    };
    if (dnbComplete) requireColumns(row, [
      ['DNB_Admis', 'Candidats Admis', 'DNB Admis'],
      ['DNB_Refuses', 'Candidats Refusés', 'DNB Refusés'],
      ['DNB_Mention_AB', 'Mention Assez Bien', 'AB'],
      ['DNB_Mention_B', 'Mention Bien', 'B'],
      ['DNB_Mention_TB', 'Mention Très Bien', 'TB'],
    ], 'DNB');
    if (cfgComplete) requireColumns(cfgRow, [
      ['CFG_Admis', 'CFG Candidats Admis', 'Candidats Admis'],
      ['CFG_Refuses', 'CFG Candidats Refusés', 'Candidats Refusés'],
    ], 'CFG');

    const dnb = {
      inscrits: numeric(row, ['DNB_Inscrits', 'Candidats Inscrits', 'DNB Inscrits'], 0, line + ' DNB inscrits'),
      ...(dnbPresents !== undefined ? { presents: dnbPresents } : {}),
      admis: numeric(row, ['DNB_Admis', 'Candidats Admis', 'DNB Admis'], 0, line + ' DNB admis'),
      refuses: numeric(row, ['DNB_Refuses', 'Candidats Refusés', 'DNB Refusés'], 0, line + ' DNB refusés'),
      mentions: {
        ab: numeric(row, ['DNB_Mention_AB', 'Mention Assez Bien', 'AB'], 0, line + ' mention AB'),
        b: numeric(row, ['DNB_Mention_B', 'Mention Bien', 'B'], 0, line + ' mention B'),
        tb: numeric(row, ['DNB_Mention_TB', 'Mention Très Bien', 'TB'], 0, line + ' mention TB'),
        ...(dnbTbf ? { tbf: dnbTbf } : {}),
      },
    };
    const cfg = {
      inscrits: numeric(cfgRow, ['CFG_Inscrits', 'CFG Candidats Inscrits', 'Candidats Inscrits'], effectif, line + ' CFG inscrits'),
      ...(cfgPresents !== undefined ? { presents: cfgPresents } : {}),
      admis: numeric(cfgRow, ['CFG_Admis', 'CFG Candidats Admis', 'Candidats Admis'], 0, line + ' CFG admis'),
      refuses: numeric(cfgRow, ['CFG_Refuses', 'CFG Candidats Refusés', 'Candidats Refusés'], 0, line + ' CFG refusés'),
    };
    const errors = [
      ...(dnbComplete ? computeDnb(dnb, effectif).errors : []),
      ...(cfgComplete ? computeCfg(cfg, effectif).errors : []),
    ];
    if (errors.length) throw new Error(line + ' (' + name + ') : ' + errors.join('; '));
    const color = String(pick(row, ['Couleur']) || '').trim();
    return {
      id: String(pick(row, ['Identifiant']) || ('imported-' + Date.now() + '-' + index)),
      name, city: String(pick(row, ['Ville', 'Secteur / Ville']) || '').trim(),
      bassin: String(pick(row, ['Bassin']) || defaultBassin).trim(),
      ...(color ? { color } : {}),
      effectifClasse: effectif, dnb, cfg,
      ...(dnbComplete ? {} : { dnbComplete: false }),
      ...(cfgComplete ? {} : { cfgComplete: false }),
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
