import * as XLSX from 'xlsx';
import { Establishment, SessionData } from '../types';
import { computeDnb, computeCfg } from './calculations';

export function exportSessionToExcel(session: SessionData) {
  const wb = XLSX.utils.book_new();

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

  const filename = `StatSEGPA_${session.year.replace(/\s+/g, '_')}.xlsx`;
  XLSX.writeFile(wb, filename);
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
      'DNB_Refuses': 4,
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

export function parseExcelOrCsvFile(file: File): Promise<Establishment[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet);

        const establishments: Establishment[] = json.map((row, index) => {
          const name =
            row['Établissement'] ||
            row['Etablissement'] ||
            row['etablissement'] ||
            row['Collège'] ||
            row['College'] ||
            row['Nom'] ||
            `Collège ${index + 1}`;

          const effectif = Number(row['Effectif_Classe'] || row['Effectif Classe'] || row['Effectif'] || 14);

          const dnbInscrits = Number(row['DNB_Inscrits'] || row['Candidats Inscrits'] || row['DNB Inscrits'] || 0);
          const dnbAdmis = Number(row['DNB_Admis'] || row['Candidats Admis'] || row['DNB Admis'] || 0);
          const dnbRefuses = Number(row['DNB_Refuses'] || row['Candidats Refusés'] || row['DNB Refusés'] || 0);

          const tb = Number(row['DNB_Mention_TB'] || row['Mention Très Bien'] || row['TB'] || 0);
          const b = Number(row['DNB_Mention_B'] || row['Mention Bien'] || row['B'] || 0);
          const ab = Number(row['DNB_Mention_AB'] || row['Mention Assez Bien'] || row['AB'] || 0);

          const cfgInscrits = Number(row['CFG_Inscrits'] || row['CFG Candidats Inscrits'] || row['CFG Inscrits'] || effectif);
          const cfgAdmis = Number(row['CFG_Admis'] || row['CFG Candidats Admis'] || row['CFG Admis'] || 0);
          const cfgRefuses = Number(row['CFG_Refuses'] || row['CFG Candidats Refusés'] || row['CFG Refusés'] || 0);

          return {
            id: `imported-${Date.now()}-${index}`,
            name: String(name).trim(),
            city: row['Secteur / Ville'] || row['Ville'] || '',
            effectifClasse: effectif,
            dnb: {
              inscrits: dnbInscrits,
              admis: dnbAdmis,
              refuses: dnbRefuses,
              mentions: { tb, b, ab },
            },
            cfg: {
              inscrits: cfgInscrits,
              admis: cfgAdmis,
              refuses: cfgRefuses,
            },
          };
        });

        resolve(establishments);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}
