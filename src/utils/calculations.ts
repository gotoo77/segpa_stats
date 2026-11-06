import { DnbData, CfgData, ComputedDnb, ComputedCfg, Establishment, BassinStats } from '../types';

export function computeDnb(data: DnbData, effectifClasse: number = 0): ComputedDnb {
  const effectif = Number(effectifClasse) || 0;
  const inscrits = Number(data.inscrits) || 0;
  const admis = Number(data.admis) || 0;
  const refuses = Number(data.refuses) || 0;
  const ab = Number(data.mentions?.ab) || 0;
  const b = Number(data.mentions?.b) || 0;
  const tb = Number(data.mentions?.tb) || 0;

  // Présents = soit spécifié explicitement, soit la somme des admis + refusés
  const presents = data.presents !== undefined 
    ? Number(data.presents) 
    : (admis + refuses > 0 ? admis + refuses : inscrits);

  const totalMentions = ab + b + tb;
  const sansMention = Math.max(0, admis - totalMentions);
  const absents = Math.max(0, inscrits - presents);

  const tauxPresentation = effectif > 0 ? (inscrits / effectif) * 100 : 0;
  const tauxInscrits = inscrits > 0 ? (admis / inscrits) * 100 : 0;
  const tauxPresents = presents > 0 ? (admis / presents) * 100 : 0;
  const tauxClasse = effectif > 0 ? (admis / effectif) * 100 : 0;
  const tauxMentions = admis > 0 ? (totalMentions / admis) * 100 : 0;

  const errors: string[] = [];
  if (effectif > 0 && inscrits > effectif) {
    errors.push(`Inscrits (${inscrits}) > Effectif classe (${effectif})`);
  }
  for (const [label, value] of Object.entries({ effectif, inscrits, presents, admis, refuses, ab, b, tb })) {
    if (!Number.isInteger(value) || value < 0) errors.push(`${label} doit être un entier positif ou nul`);
  }
  if (effectif === 0 && inscrits > 0) errors.push('Effectif de classe manquant');
  if (admis + refuses > presents) errors.push(`Admis + Refusés (${admis + refuses}) > Présents (${presents})`);
  if (admis > inscrits) errors.push(`Admis (${admis}) > Inscrits (${inscrits})`);
  if (totalMentions > admis) {
    errors.push(`Total mentions (${totalMentions}) > Admis (${admis})`);
  }
  if (presents > inscrits) {
    errors.push(`Présents (${presents}) > Inscrits (${inscrits})`);
  }

  return {
    presents,
    absents,
    totalMentions,
    sansMention,
    tauxPresentation: Number(tauxPresentation.toFixed(1)),
    tauxInscrits: Number(tauxInscrits.toFixed(1)),
    tauxPresents: Number(tauxPresents.toFixed(1)),
    tauxClasse: Number(tauxClasse.toFixed(1)),
    tauxMentions: Number(tauxMentions.toFixed(1)),
    errors,
  };
}

export function computeCfg(data: CfgData, effectifClasse: number = 0): ComputedCfg {
  const effectif = Number(effectifClasse) || 0;
  const inscrits = Number(data.inscrits) || 0;
  const admis = Number(data.admis) || 0;
  const refuses = Number(data.refuses) || 0;

  const presents = data.presents !== undefined
    ? Number(data.presents)
    : (admis + refuses > 0 ? admis + refuses : inscrits);

  const absents = Math.max(0, inscrits - presents);
  const tauxInscrits = inscrits > 0 ? (admis / inscrits) * 100 : 0;
  const tauxPresents = presents > 0 ? (admis / presents) * 100 : 0;
  const tauxClasse = effectif > 0 ? (admis / effectif) * 100 : 0;

  const errors: string[] = [];
  for (const [label, value] of Object.entries({ effectif, inscrits, presents, admis, refuses })) {
    if (!Number.isInteger(value) || value < 0) errors.push(`${label} doit être un entier positif ou nul`);
  }
  if (effectif === 0 && inscrits > 0) errors.push('Effectif de classe manquant');
  if (effectif > 0 && inscrits > effectif) {
    errors.push(`Inscrits CFG (${inscrits}) > Effectif classe (${effectif})`);
  }
  if (admis + refuses > presents) errors.push(`Admis + Refusés (${admis + refuses}) > Présents (${presents})`);
  if (admis > inscrits) errors.push(`Admis (${admis}) > Inscrits (${inscrits})`);
  if (presents > inscrits) {
    errors.push(`Présents (${presents}) > Inscrits (${inscrits})`);
  }

  return {
    presents,
    absents,
    tauxInscrits: Number(tauxInscrits.toFixed(1)),
    tauxPresents: Number(tauxPresents.toFixed(1)),
    tauxClasse: Number(tauxClasse.toFixed(1)),
    errors,
  };
}

export function calculateBassinStats(establishments: Establishment[]): BassinStats {
  const total = establishments.length;

  let totalEffectif = 0;
  let dnbEffectif = 0;
  let cfgEffectif = 0;
  let dnbRenseignes = 0;
  let cfgRenseignes = 0;
  let dnbInscrits = 0;
  let dnbPresents = 0;
  let dnbAdmis = 0;
  let dnbRefuses = 0;
  let dnbAB = 0;
  let dnbB = 0;
  let dnbTB = 0;

  let cfgInscrits = 0;
  let cfgPresents = 0;
  let cfgAdmis = 0;
  let cfgRefuses = 0;

  establishments.forEach((e) => {
    const eff = Number(e.effectifClasse) || 0;
    totalEffectif += eff;

    if (e.dnbComplete !== false) {
      dnbRenseignes++;
      dnbEffectif += eff;
      const result = computeDnb(e.dnb, eff);
      dnbInscrits += Number(e.dnb.inscrits) || 0;
      dnbPresents += result.presents;
      dnbAdmis += Number(e.dnb.admis) || 0;
      dnbRefuses += Number(e.dnb.refuses) || 0;
      dnbAB += Number(e.dnb.mentions?.ab) || 0;
      dnbB += Number(e.dnb.mentions?.b) || 0;
      dnbTB += Number(e.dnb.mentions?.tb) || 0;
    }
    if (e.cfgComplete !== false) {
      cfgRenseignes++;
      cfgEffectif += eff;
      const result = computeCfg(e.cfg, eff);
      cfgInscrits += Number(e.cfg.inscrits) || 0;
      cfgPresents += result.presents;
      cfgAdmis += Number(e.cfg.admis) || 0;
      cfgRefuses += Number(e.cfg.refuses) || 0;
    }
  });

  const dnbTotalMentions = dnbAB + dnbB + dnbTB;
  const dnbSansMention = Math.max(0, dnbAdmis - dnbTotalMentions);

  return {
    totalEtablissements: total,
    dnbRenseignes,
    cfgRenseignes,
    totalEffectifClasse: totalEffectif,
    dnbEffectifClasse: dnbEffectif,
    cfgEffectifClasse: cfgEffectif,
    tauxMoyenPresentationDnb: dnbEffectif > 0 ? Number(((dnbInscrits / dnbEffectif) * 100).toFixed(1)) : 0,
    dnb: {
      inscrits: dnbInscrits,
      presents: dnbPresents,
      admis: dnbAdmis,
      refuses: dnbRefuses,
      absents: Math.max(0, dnbInscrits - dnbPresents),
      mentionsAB: dnbAB,
      mentionsB: dnbB,
      mentionsTB: dnbTB,
      totalMentions: dnbTotalMentions,
      sansMention: dnbSansMention,
      tauxMoyenInscrits: dnbInscrits > 0 ? Number(((dnbAdmis / dnbInscrits) * 100).toFixed(1)) : 0,
      tauxMoyenPresents: dnbPresents > 0 ? Number(((dnbAdmis / dnbPresents) * 100).toFixed(1)) : 0,
      tauxMoyenMentions: dnbAdmis > 0 ? Number(((dnbTotalMentions / dnbAdmis) * 100).toFixed(1)) : 0,
      tauxMoyenClasse: dnbEffectif > 0 ? Number(((dnbAdmis / dnbEffectif) * 100).toFixed(1)) : 0,
    },
    cfg: {
      inscrits: cfgInscrits,
      presents: cfgPresents,
      admis: cfgAdmis,
      refuses: cfgRefuses,
      absents: Math.max(0, cfgInscrits - cfgPresents),
      tauxMoyenInscrits: cfgInscrits > 0 ? Number(((cfgAdmis / cfgInscrits) * 100).toFixed(1)) : 0,
      tauxMoyenPresents: cfgPresents > 0 ? Number(((cfgAdmis / cfgPresents) * 100).toFixed(1)) : 0,
      tauxMoyenClasse: cfgEffectif > 0 ? Number(((cfgAdmis / cfgEffectif) * 100).toFixed(1)) : 0,
    },
  };
}
