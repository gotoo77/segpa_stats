import pptxgenjs from 'pptxgenjs';
import { SessionData, PresentationSettings, DEFAULT_PRESENTATION_SETTINGS } from '../types';
import { calculateBassinStats, computeDnb, computeCfg } from './calculations';

export async function exportPresentationToPptx(session: SessionData, settings: PresentationSettings = DEFAULT_PRESENTATION_SETTINGS) {
  const pptx = new pptxgenjs();

  pptx.layout = 'LAYOUT_16x9';
  pptx.author = 'StatSEGPA';
  pptx.company = 'Éducation Nationale - SEGPA';
  pptx.title = `Bilan Examens DNB Pro & CFG - ${session.year}`;

  const stats = calculateBassinStats(session.establishments);
  const yearText = session.year;
  const bassinText = settings.badge.trim() || session.bassinName;

  // --------------------------------------------------------------------------
  // SLIDE 1 : Titre / Page de garde
  // --------------------------------------------------------------------------
  if (settings.enabledSlides.intro) {
  const slide1 = pptx.addSlide();
  slide1.background = { color: '0f172a' }; // Slate 900

  slide1.addText('ÉDUCATION NATIONALE • SEGPA', {
    x: 1.0,
    y: 1.2,
    w: '80%',
    fontSize: 14,
    bold: true,
    color: '38bdf8', // Sky 400
    fontFace: 'Arial',
  });

  slide1.addText(settings.title, {
    x: 1.0,
    y: 1.8,
    w: '80%',
    fontSize: 34,
    bold: true,
    color: 'ffffff',
    fontFace: 'Arial',
  });

  slide1.addText('DNB Professionnel & Certificat de Formation Générale (CFG)', {
    x: 1.0,
    y: 2.6,
    w: '85%',
    fontSize: 20,
    color: '94a3b8',
    fontFace: 'Arial',
  });

  slide1.addText(`${bassinText} • ${yearText}`, {
    x: 1.0,
    y: 3.5,
    w: '80%',
    fontSize: 16,
    bold: true,
    color: '38bdf8',
    fontFace: 'Arial',
  });

  // 3 cartes de synthèse sur la slide 1
  slide1.addShape(pptx.ShapeType.roundRect, {
    x: 1.0,
    y: 4.5,
    w: 3.2,
    h: 1.6,
    fill: { color: '1e293b' },
    line: { color: '334155', width: 1 },
    rectRadius: 0.1,
  });
  slide1.addText(`${stats.totalEtablissements} Collèges`, {
    x: 1.0,
    y: 4.8,
    w: 3.2,
    fontSize: 22,
    bold: true,
    color: 'ffffff',
    align: 'center',
  });
  slide1.addText('Réseau partenarial', {
    x: 1.0,
    y: 5.4,
    w: 3.2,
    fontSize: 12,
    color: '94a3b8',
    align: 'center',
  });

  slide1.addShape(pptx.ShapeType.roundRect, {
    x: 4.6,
    y: 4.5,
    w: 3.2,
    h: 1.6,
    fill: { color: '1e293b' },
    line: { color: '334155', width: 1 },
    rectRadius: 0.1,
  });
  slide1.addText(`${stats.totalEffectifClasse} Élèves`, {
    x: 4.6,
    y: 4.8,
    w: 3.2,
    fontSize: 22,
    bold: true,
    color: '38bdf8',
    align: 'center',
  });
  slide1.addText('Effectif total en 3e SEGPA', {
    x: 4.6,
    y: 5.4,
    w: 3.2,
    fontSize: 12,
    color: '94a3b8',
    align: 'center',
  });

  slide1.addShape(pptx.ShapeType.roundRect, {
    x: 8.2,
    y: 4.5,
    w: 3.2,
    h: 1.6,
    fill: { color: '1e293b' },
    line: { color: '334155', width: 1 },
    rectRadius: 0.1,
  });
  slide1.addText(`${stats.cfg.admis} Diplômés CFG`, {
    x: 8.2,
    y: 4.8,
    w: 3.2,
    fontSize: 22,
    bold: true,
    color: '34d399',
    align: 'center',
  });
  slide1.addText('1er palier du socle commun', {
    x: 8.2,
    y: 5.4,
    w: 3.2,
    fontSize: 12,
    color: '94a3b8',
    align: 'center',
  });

  // --------------------------------------------------------------------------
  // SLIDE 2 : Les Chiffres Clés du Bassin
  // --------------------------------------------------------------------------
  }
  if (settings.enabledSlides.kpis) {

  const slide2 = pptx.addSlide();
  slide2.background = { color: '0f172a' };

  slide2.addText('VUE D’ENSEMBLE', { x: 1.0, y: 0.8, fontSize: 13, bold: true, color: '38bdf8' });
  slide2.addText('Les Chiffres Clés de la Session', { x: 1.0, y: 1.2, fontSize: 26, bold: true, color: 'ffffff' });

  // Encadré DNB Pro
  slide2.addShape(pptx.ShapeType.roundRect, {
    x: 1.0,
    y: 2.0,
    w: 5.2,
    h: 4.5,
    fill: { color: '1e293b' },
    line: { color: '2563eb', width: 2 },
    rectRadius: 0.15,
  });
  slide2.addText('DNB PROFESSIONNEL', { x: 1.3, y: 2.3, fontSize: 16, bold: true, color: '60a5fa' });
  slide2.addText(`${stats.dnb.tauxMoyenPresents}%`, { x: 1.3, y: 2.8, fontSize: 48, bold: true, color: 'ffffff' });
  slide2.addText('de réussite sur les candidats présents', { x: 1.3, y: 3.9, fontSize: 12, color: '94a3b8' });

  slide2.addText([
    { text: `• Taux d'inscription : `, options: { color: 'cbd5e1', bold: false } },
    { text: `${stats.tauxMoyenPresentationDnb}% de la classe\n`, options: { color: '60a5fa', bold: true } },
    { text: `• Candidats admis : `, options: { color: 'cbd5e1', bold: false } },
    { text: `${stats.dnb.admis} / ${stats.dnb.presents} présents\n`, options: { color: 'ffffff', bold: true } },
    { text: `• Mentions décernées : `, options: { color: 'cbd5e1', bold: false } },
    { text: `${stats.dnb.totalMentions} (${stats.dnb.tauxMoyenMentions}% des admis)\n`, options: { color: 'f59e0b', bold: true } },
  ], { x: 1.3, y: 4.4, w: 4.6, fontSize: 13 });

  // Encadré CFG
  slide2.addShape(pptx.ShapeType.roundRect, {
    x: 6.8,
    y: 2.0,
    w: 5.2,
    h: 4.5,
    fill: { color: '1e293b' },
    line: { color: '0d9488', width: 2 },
    rectRadius: 0.15,
  });
  slide2.addText('CERTIFICAT DE FORMATION GÉNÉRALE', { x: 7.1, y: 2.3, fontSize: 16, bold: true, color: '2dd4bf' });
  slide2.addText(`${stats.cfg.tauxMoyenPresents}%`, { x: 7.1, y: 2.8, fontSize: 48, bold: true, color: 'ffffff' });
  slide2.addText('de réussite sur l’ensemble de la promotion', { x: 7.1, y: 3.9, fontSize: 12, color: '94a3b8' });

  slide2.addText([
    { text: `• Inscription : `, options: { color: 'cbd5e1', bold: false } },
    { text: `100% des élèves de 3e SEGPA\n`, options: { color: '34d399', bold: true } },
    { text: `• Candidats admis : `, options: { color: 'cbd5e1', bold: false } },
    { text: `${stats.cfg.admis} / ${stats.cfg.presents} élèves\n`, options: { color: 'ffffff', bold: true } },
    { text: `• Collèges à 100% : `, options: { color: 'cbd5e1', bold: false } },
    { text: `${session.establishments.filter((e) => computeCfg(e.cfg, e.effectifClasse).tauxPresents === 100).length} sur ${session.establishments.length} collèges\n`, options: { color: '2dd4bf', bold: true } },
  ], { x: 7.1, y: 4.4, w: 4.6, fontSize: 13 });

  // --------------------------------------------------------------------------
  // SLIDE 3 : Tableau Comparatif DNB Pro
  // --------------------------------------------------------------------------
  }
  if (settings.enabledSlides.dnb) {

  const slide3 = pptx.addSlide();
  slide3.background = { color: '0f172a' };

  slide3.addText('DNB PROFESSIONNEL', { x: 1.0, y: 0.6, fontSize: 13, bold: true, color: '38bdf8' });
  slide3.addText('Détail des Inscriptions et de la Réussite par Collège', { x: 1.0, y: 1.0, fontSize: 24, bold: true, color: 'ffffff' });

  const dnbTableRows: pptxgenjs.TableRow[] = [
    [
      { text: 'Collège', options: { bold: true, fill: { color: '334155' }, color: 'ffffff' } },
      { text: 'Secteur', options: { bold: true, fill: { color: '334155' }, color: 'ffffff', align: 'center' } },
      { text: 'Effectif', options: { bold: true, fill: { color: '334155' }, color: 'ffffff', align: 'center' } },
      { text: 'Inscrits DNB', options: { bold: true, fill: { color: '334155' }, color: 'ffffff', align: 'center' } },
      { text: '% Présenté', options: { bold: true, fill: { color: '334155' }, color: 'ffffff', align: 'center' } },
      { text: 'Admis', options: { bold: true, fill: { color: '334155' }, color: 'ffffff', align: 'center' } },
      { text: 'Refusés', options: { bold: true, fill: { color: '334155' }, color: 'ffffff', align: 'center' } },
      { text: 'Mentions', options: { bold: true, fill: { color: '334155' }, color: 'ffffff', align: 'center' } },
      { text: '% Réussite', options: { bold: true, fill: { color: '1d4ed8' }, color: 'ffffff', align: 'center' } },
    ],
  ];

  session.establishments.forEach((est) => {
    const comp = computeDnb(est.dnb, est.effectifClasse);
    dnbTableRows.push([
      { text: est.name, options: { color: 'ffffff', fontSize: 10 } },
      { text: est.bassin || 'Douaisis', options: { color: 'cbd5e1', fontSize: 9, align: 'center' } },
      { text: String(est.effectifClasse), options: { color: 'f59e0b', fontSize: 10, align: 'center', bold: true } },
      { text: String(est.dnb.inscrits), options: { color: 'ffffff', fontSize: 10, align: 'center' } },
      { text: `${comp.tauxPresentation}%`, options: { color: '38bdf8', fontSize: 10, align: 'center', bold: true } },
      { text: String(est.dnb.admis), options: { color: '34d399', fontSize: 10, align: 'center', bold: true } },
      { text: String(est.dnb.refuses), options: { color: 'cbd5e1', fontSize: 10, align: 'center' } },
      { text: `${comp.totalMentions}`, options: { color: 'fbbf24', fontSize: 10, align: 'center' } },
      { text: `${comp.tauxPresents}%`, options: { color: '60a5fa', fontSize: 11, align: 'center', bold: true } },
    ]);
  });

  slide3.addTable(dnbTableRows, {
    x: 0.8,
    y: 1.6,
    w: 11.4,
    fontSize: 10,
    border: { pt: 0.5, color: '475569' },
  });

  // --------------------------------------------------------------------------
  // SLIDE 4 : Focus Mentions DNB Pro
  // --------------------------------------------------------------------------
  }
  if (settings.enabledSlides.mentions) {

  const slide4 = pptx.addSlide();
  slide4.background = { color: '0f172a' };

  slide4.addText('VALORISATION DU MÉRITE', { x: 1.0, y: 0.8, fontSize: 13, bold: true, color: 'f59e0b' });
  slide4.addText('La Réussite par les Mentions au Brevet Pro', { x: 1.0, y: 1.2, fontSize: 26, bold: true, color: 'ffffff' });
  slide4.addText(`${stats.dnb.totalMentions} mentions décernées sur le réseau (${stats.dnb.tauxMoyenMentions}% des admis)`, { x: 1.0, y: 1.8, fontSize: 14, color: '94a3b8' });

  // 3 colonnes Mentions
  slide4.addShape(pptx.ShapeType.roundRect, {
    x: 1.0,
    y: 2.6,
    w: 3.3,
    h: 3.5,
    fill: { color: '1e293b' },
    line: { color: '10b981', width: 2 },
    rectRadius: 0.15,
  });
  slide4.addText('MENTION ASSEZ BIEN', { x: 1.2, y: 2.9, fontSize: 14, bold: true, color: '34d399', align: 'center', w: 2.9 });
  slide4.addText(`${stats.dnb.mentionsAB}`, { x: 1.2, y: 3.6, fontSize: 52, bold: true, color: '34d399', align: 'center', w: 2.9 });
  slide4.addText('Élèves ayant solidement validé les objectifs du socle commun', { x: 1.2, y: 4.8, fontSize: 11, color: '94a3b8', align: 'center', w: 2.9 });

  slide4.addShape(pptx.ShapeType.roundRect, {
    x: 4.8,
    y: 2.6,
    w: 3.3,
    h: 3.5,
    fill: { color: '1e293b' },
    line: { color: '3b82f6', width: 2 },
    rectRadius: 0.15,
  });
  slide4.addText('MENTION BIEN', { x: 5.0, y: 2.9, fontSize: 14, bold: true, color: '60a5fa', align: 'center', w: 2.9 });
  slide4.addText(`${stats.dnb.mentionsB}`, { x: 5.0, y: 3.6, fontSize: 52, bold: true, color: '60a5fa', align: 'center', w: 2.9 });
  slide4.addText('Très bon niveau de maîtrise des attendus de fin de cycle 4', { x: 5.0, y: 4.8, fontSize: 11, color: '94a3b8', align: 'center', w: 2.9 });

  slide4.addShape(pptx.ShapeType.roundRect, {
    x: 8.6,
    y: 2.6,
    w: 3.3,
    h: 3.5,
    fill: { color: '1e293b' },
    line: { color: 'f59e0b', width: 2 },
    rectRadius: 0.15,
  });
  slide4.addText('MENTION TRÈS BIEN', { x: 8.8, y: 2.9, fontSize: 14, bold: true, color: 'fbbf24', align: 'center', w: 2.9 });
  slide4.addText(`${stats.dnb.mentionsTB}`, { x: 8.8, y: 3.6, fontSize: 52, bold: true, color: 'fbbf24', align: 'center', w: 2.9 });
  slide4.addText('Parcours d’excellence et engagement exemplaire en SEGPA', { x: 8.8, y: 4.8, fontSize: 11, color: '94a3b8', align: 'center', w: 2.9 });

  // --------------------------------------------------------------------------
  // SLIDE 5 : CFG Détail
  // --------------------------------------------------------------------------
  }
  if (settings.enabledSlides.cfg) {

  const slide5 = pptx.addSlide();
  slide5.background = { color: '0f172a' };

  slide5.addText('CERTIFICAT DE FORMATION GÉNÉRALE', { x: 1.0, y: 0.6, fontSize: 13, bold: true, color: '2dd4bf' });
  slide5.addText('Le Premier Diplôme d’État (100% des élèves inscrits)', { x: 1.0, y: 1.0, fontSize: 24, bold: true, color: 'ffffff' });

  const cfgTableRows: pptxgenjs.TableRow[] = [
    [
      { text: 'Collège', options: { bold: true, fill: { color: '334155' }, color: 'ffffff' } },
      { text: 'Secteur', options: { bold: true, fill: { color: '334155' }, color: 'ffffff', align: 'center' } },
      { text: 'Effectif Classe', options: { bold: true, fill: { color: '334155' }, color: 'ffffff', align: 'center' } },
      { text: 'Inscrits CFG', options: { bold: true, fill: { color: '334155' }, color: 'ffffff', align: 'center' } },
      { text: 'Admis', options: { bold: true, fill: { color: '334155' }, color: 'ffffff', align: 'center' } },
      { text: 'Refusés', options: { bold: true, fill: { color: '334155' }, color: 'ffffff', align: 'center' } },
      { text: '% Réussite', options: { bold: true, fill: { color: '0f766e' }, color: 'ffffff', align: 'center' } },
    ],
  ];

  session.establishments.forEach((est) => {
    const comp = computeCfg(est.cfg, est.effectifClasse);
    cfgTableRows.push([
      { text: est.name, options: { color: 'ffffff', fontSize: 10 } },
      { text: est.bassin || 'Douaisis', options: { color: 'cbd5e1', fontSize: 9, align: 'center' } },
      { text: String(est.effectifClasse), options: { color: 'f59e0b', fontSize: 10, align: 'center', bold: true } },
      { text: String(est.cfg.inscrits), options: { color: 'ffffff', fontSize: 10, align: 'center' } },
      { text: String(est.cfg.admis), options: { color: '34d399', fontSize: 10, align: 'center', bold: true } },
      { text: String(est.cfg.refuses), options: { color: 'cbd5e1', fontSize: 10, align: 'center' } },
      { text: `${comp.tauxPresents}%`, options: { color: '2dd4bf', fontSize: 11, align: 'center', bold: true } },
    ]);
  });

  slide5.addTable(cfgTableRows, {
    x: 0.8,
    y: 1.6,
    w: 11.4,
    fontSize: 10,
    border: { pt: 0.5, color: '475569' },
  });

  // --------------------------------------------------------------------------
  // SLIDE 6 : Synthèse et Perspectives
  // --------------------------------------------------------------------------
  }
  if (settings.enabledSlides.comparison) {

  const slide6 = pptx.addSlide();
  slide6.background = { color: '0f172a' };

  slide6.addText('CONCLUSION & PERSPECTIVES', { x: 1.0, y: 0.8, fontSize: 13, bold: true, color: '38bdf8' });
  slide6.addText('Synthèse Générale du Réseau SEGPA', { x: 1.0, y: 1.2, fontSize: 26, bold: true, color: 'ffffff' });

  slide6.addShape(pptx.ShapeType.roundRect, {
    x: 1.0,
    y: 2.0,
    w: 11.0,
    h: 4.8,
    fill: { color: '1e293b' },
    line: { color: '334155', width: 1 },
    rectRadius: 0.15,
  });

  slide6.addText([
    { text: '1. Une diplomation massive et sécurisante au CFG :\n', options: { fontSize: 16, bold: true, color: '2dd4bf' } },
    { text: `Sur l'ensemble du réseau, ${stats.cfg.admis} élèves sur ${stats.totalEffectifClasse} obtiennent leur diplôme d'État (${stats.cfg.tauxMoyenPresents}% de réussite), validant les compétences du socle commun avant leur orientation en LP ou CFA.\n\n`, options: { fontSize: 13, color: 'cbd5e1' } },

    { text: '2. Un engagement soutenu au DNB Professionnel :\n', options: { fontSize: 16, bold: true, color: '60a5fa' } },
    { text: `Avec un taux moyen d'inscription de ${stats.tauxMoyenPresentationDnb}% et un taux de réussite de ${stats.dnb.tauxMoyenPresents}%, le brevet professionnel confirme la capacité des élèves de SEGPA à réussir des épreuves certificatives nationales.\n\n`, options: { fontSize: 13, color: 'cbd5e1' } },

    { text: '3. La valorisation par les mentions comme levier d’ambition :\n', options: { fontSize: 16, bold: true, color: 'f59e0b' } },
    { text: `${stats.dnb.totalMentions} mentions décernées dont ${stats.dnb.mentionsTB} mentions Très Bien, constituant un tremplin remarquable pour l'estime de soi et la réussite dans la voie professionnelle.`, options: { fontSize: 13, color: 'cbd5e1' } },
  ], {
    x: 1.4,
    y: 2.3,
    w: 10.2,
    h: 4.2,
  });

  }

  // Sauvegarde du fichier .pptx (100% compatible LibreOffice Impress et PowerPoint)
  const filename = `StatSEGPA_Presentation_${session.year.replace(/\s+/g, '_')}.pptx`;
  await pptx.writeFile({ fileName: filename });
}
