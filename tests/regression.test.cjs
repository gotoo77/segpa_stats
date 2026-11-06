const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { stripTypeScriptTypes } = require('node:module');
const XLSX = require('xlsx');

function loadTs(file, mocks = {}) {
  let source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const exported = [...source.matchAll(/export function (\w+)/g)].map((m) => m[1]);
  source = source.replace(/^import type [^\n]+;\s*$/gm, '');
  source = source.replace(/^import \{[^\n]+\} from '\.\.\/types';\s*$/gm, '');
  source = source.replace("import * as XLSX from 'xlsx';", "const XLSX = require('xlsx');");
  source = source.replace("import { computeDnb, computeCfg } from './calculations';", "const { computeDnb, computeCfg } = require('./calculations');");
  source = source.replace(/^import \{ ([^}]+) \} from '([^']+)';\s*$/gm, (_, names, id) => `const { ${names} } = require('${id}');`);
  source = source.replace(/export function /g, 'function ');
  const stripped = stripTypeScriptTypes(source, { mode: 'strip' });
  const output = stripped + '\nmodule.exports = { ' + exported.join(', ') + ' };';
  const module = { exports: {} };
  const localRequire = (id) => Object.hasOwn(mocks, id) ? mocks[id] : require(id);
  new Function('require', 'module', 'exports', output)(localRequire, module, module.exports);
  return module.exports;
}
const calculations = loadTs('src/utils/calculations.ts');
const excel = loadTs('src/utils/excel.ts', { './calculations': calculations });

function item(overrides = {}) {
  return {
    id: 'segpa-1', name: 'Collège Test', city: 'Douai', bassin: 'Cambrésis', color: '#2563eb', effectifClasse: 14,
    dnb: { inscrits: 12, presents: 11, admis: 9, refuses: 2, mentions: { ab: 2, b: 1, tb: 1 } },
    cfg: { inscrits: 14, presents: 13, admis: 12, refuses: 1 },
    ...overrides,
  };
}

test('DNB : zéro présents explicites est conservé', () => {
  const v = calculations.computeDnb({ inscrits: 12, presents: 0, admis: 0, refuses: 0, mentions: { ab: 0, b: 0, tb: 0 } }, 14);
  assert.equal(v.presents, 0);
  assert.equal(v.absents, 12);
});

test('CFG : nombre admis impossible déclenche une erreur', () => {
  const v = calculations.computeCfg({ inscrits: 10, presents: 5, admis: 8, refuses: 0 }, 10);
  assert.ok(v.errors.some(e => e.includes('Admis + Refusés')));
});

test('DNB : mentions ne peuvent dépasser les admis', () => {
  const v = calculations.computeDnb({ inscrits: 10, admis: 3, refuses: 7, mentions: { ab: 3, b: 2, tb: 0 } }, 10);
  assert.ok(v.errors.some(e => e.includes('mentions')));
});

test('les taux bassin sont pondérés par le nombre de présents', () => {
  const first = item({ effectifClasse: 10, dnb: { inscrits: 10, admis: 10, refuses: 0, mentions: { ab: 0, b: 0, tb: 0 } }, cfg: { inscrits: 10, admis: 10, refuses: 0 } });
  const second = item({ id: 'segpa-2', effectifClasse: 30, dnb: { inscrits: 30, admis: 0, refuses: 30, mentions: { ab: 0, b: 0, tb: 0 } }, cfg: { inscrits: 30, admis: 0, refuses: 30 } });
  assert.equal(calculations.calculateBassinStats([first, second]).dnb.tauxMoyenPresents, 25);
});

test('aller-retour Excel préserve toutes les colonnes de données utiles', () => {
  const initial = [
    item(),
    item({ id: 'segpa-2', name: 'Collège Deux', bassin: 'Douaisis', dnb: { inscrits: 0, presents: 0, admis: 0, refuses: 0, mentions: { ab: 0, b: 0, tb: 0 } }, cfg: { inscrits: 14, admis: 0, refuses: 0 } }),
  ];
  const session = { id: '2026', year: 'Session 2026', bassinName: 'Test', establishments: initial, lastUpdated: '' };
  const buf = XLSX.write(excel.createSessionWorkbook(session), { type: 'buffer', bookType: 'xlsx' });
  const actual = excel.parseWorkbook(XLSX.read(buf, { type: 'buffer' }));
  assert.deepEqual(actual, initial);
});

test('import Excel invalide est rejeté', () => {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([{ Établissement: 'Test', Effectif_Classe: 10, DNB_Inscrits: 10, DNB_Admis: 12, DNB_Refuses: 0, CFG_Inscrits: 10, CFG_Admis: 9, CFG_Refuses: 1 }]), 'Donnees_StatSEGPA');
  assert.throws(() => excel.parseWorkbook(wb), /Admis|Présents/);
});

test('classeur sans colonnes connues est rejeté', () => {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([{ Établissement: 'Test', Autre: 1 }]), 'Feuille1');
  assert.throws(() => excel.parseWorkbook(wb), /colonnes de résultats/);
});

test('statistiques : les établissements non renseignés ne faussent pas les taux', () => {
  const valid = item({ effectifClasse: 10, dnb: { inscrits: 10, admis: 10, refuses: 0, mentions: { ab: 0, b: 0, tb: 0 } }, cfg: { inscrits: 10, admis: 10, refuses: 0 } });
  const pending = item({ id: 'pending', effectifClasse: 30, dnbComplete: false, cfgComplete: false, dnb: { inscrits: 0, admis: 0, refuses: 0, mentions: { ab: 0, b: 0, tb: 0 } }, cfg: { inscrits: 0, admis: 0, refuses: 0 } });
  const stats = calculations.calculateBassinStats([valid, pending]);
  assert.equal(stats.totalEtablissements, 2);
  assert.equal(stats.dnbRenseignes, 1);
  assert.equal(stats.cfgRenseignes, 1);
  assert.equal(stats.dnb.tauxMoyenPresents, 100);
  assert.equal(stats.cfg.tauxMoyenPresents, 100);
  assert.equal(stats.tauxMoyenPresentationDnb, 100);
});

test('Excel : état non renseigné préservé après export puis import', () => {
  const pending = item({ dnbComplete: false, cfgComplete: false });
  const session = { id: '2027', year: 'Session 2027', bassinName: 'Test', establishments: [pending], lastUpdated: '' };
  const buf = XLSX.write(excel.createSessionWorkbook(session), { type: 'buffer', bookType: 'xlsx' });
  assert.deepEqual(excel.parseWorkbook(XLSX.read(buf, { type: 'buffer' })), [pending]);
});

const dataIntegrity = loadTs('src/utils/dataIntegrity.ts', { './calculations': calculations });
const backup = loadTs('src/utils/backup.ts', { './calculations': calculations, './dataIntegrity': dataIntegrity });
const sessionStorage = loadTs('src/utils/sessionStorage.ts');
const submissionMatching = loadTs('src/utils/submissionMatching.ts');

test('JSON : sauvegarde de toutes les sessions sans perte et avec année active', () => {
  const data = {
    '2024': { id: '2024', year: 'Session 2024', bassinName: 'Réseau', establishments: [item()], submissions: [], lastUpdated: '2026-11-06' },
    '2025': { id: '2025', year: 'Session 2025', bassinName: 'Réseau', establishments: [], submissions: [], lastUpdated: '2026-11-06' },
  };
  const serialized = JSON.stringify(backup.createCompleteBackup(data, '2025'));
  const restored = backup.parseCompleteBackup(JSON.parse(serialized));
  assert.equal(restored.activeYear, '2025');
  assert.deepEqual(restored.sessions, data);
});

test('JSON : restauration refuse un jeu de sessions mal formé', () => {
  assert.throws(() => backup.parseCompleteBackup({
    format: 'statsegpa-backup', version: 1, exportedAt: '2026-11-06', activeYear: '2024',
    sessions: { '2024': { id: 'malformed', establishments: [{ name: '' }] } },
  }), /mal formées/);
});


test('restauration multiannuelle : les exemples supprimés ne réapparaissent pas au redémarrage', () => {
  const examples = {
    '2024': { id: 'a', year: 'Session 2024', establishments: [] },
    '2025': { id: 'b', year: 'Session 2025', establishments: [] },
    '2026': { id: 'c', year: 'Session 2026', establishments: [] },
  };
  const restored = { '2024': examples['2024'] };
  assert.deepEqual(sessionStorage.loadStoredSessions(JSON.stringify(restored), null, examples), restored);
  assert.deepEqual(Object.keys(sessionStorage.loadStoredSessions(null, null, examples)), ['2024', '2025', '2026']);
});

test('stockage local illisible : aucune substitution silencieuse par les exemples', () => {
  assert.throws(() => sessionStorage.loadStoredSessions('{invalid', null, { '2026': {} }));
  assert.throws(() => sessionStorage.loadStoredSessions('[]', null, { '2026': {} }));
});

test('JSON : un brouillon incohérent exporté se restaure sans perdre les chiffres', () => {
  const e = item({ cfg: { inscrits: 10, presents: 5, admis: 8, refuses: 0 } });
  const session = { id: '2024', year: 'Session 2024', bassinName: 'Réseau',
    establishments: [e], lastUpdated: '2026-11-06' };
  const serialized = JSON.stringify(backup.createCompleteBackup({ '2024': session }, '2024'));
  const restored = backup.parseCompleteBackup(JSON.parse(serialized));
  assert.deepEqual(restored.sessions['2024'], session);
  assert.ok(dataIntegrity.collectDataIssues(restored.sessions['2024'].establishments).length > 0);
});

test('JSON : refuser les déclarations malformées ou incohérentes', () => {
  const session = { id: '2024', year: 'Session 2024', bassinName: 'Réseau', establishments: [item()],
    submissions: [{ id: 'sub-1', status: 'pending', submittedBy: 'X' }], lastUpdated: '2026-11-06' };
  assert.equal(backup.validateSession(session), false);
});

test('JSON : les résultats explicitement non renseignés restent restaurables', () => {
  const incomplete = item({ dnbComplete: false, cfgComplete: false,
    dnb: { inscrits: 10, presents: 0, admis: 8, refuses: 0, mentions: { ab: 0, b: 0, tb: 0 } },
    cfg: { inscrits: 10, presents: 0, admis: 8, refuses: 0 } });
  assert.equal(backup.validateSession({
    id: '2024', year: 'Session 2024', bassinName: 'Test', establishments: [incomplete], lastUpdated: '2026-11-06'
  }), true);
});

test('incohérences des examens renseignés : détectées avant édition du rapport', () => {
  assert.ok(dataIntegrity.collectDataIssues([item({ dnb: { inscrits: 10, admis: 12, refuses: 0,
    mentions: { ab: 0, b: 0, tb: 0 } } })]).some(x => x.includes('DNB')));
});


// Scénarios adversariaux : homonymes et fichier incomplet.
test('déclaration : deux collèges homonymes dans des bassins différents ne se confondent pas', () => {
  const ests = [item({ id: 'A', name: 'Collège Victor Hugo', bassin: 'Douaisis' }),
    item({ id: 'B', name: 'Collège Victor Hugo', bassin: 'Cambrésis' })];
  assert.deepEqual(submissionMatching.resolveSubmissionTarget({
    establishmentName: 'Collège Victor Hugo', bassin: 'Cambrésis'
  }, ests), { kind: 'existing', index: 1 });
  assert.deepEqual(submissionMatching.resolveSubmissionTarget({
    establishmentName: 'Collège Victor Hugo'
  }, ests), { kind: 'ambiguous' });
});

test('déclaration : deux homonymes du même bassin restent ambigus sans ville', () => {
  const ests = [item({ id: 'A', name: 'Collège Test', bassin: 'Douaisis', city: 'A' }),
    item({ id: 'B', name: 'Collège Test', bassin: 'Douaisis', city: 'B' })];
  assert.equal(submissionMatching.resolveSubmissionTarget({
    establishmentName: 'Collège Test', bassin: 'Douaisis',
  }, ests).kind, 'ambiguous');
  assert.deepEqual(submissionMatching.resolveSubmissionTarget({
    establishmentName: 'Collège Test', bassin: 'Douaisis', city: 'B',
  }, ests), { kind: 'existing', index: 1 });
});

test('Excel : résultats renseignés exigent les colonnes admis/refusés', () => {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([{
    Établissement: 'Collège Incomplet', Effectif_Classe: 10, DNB_Inscrits: 10, CFG_Inscrits: 10,
  }]), 'Donnees_StatSEGPA');
  assert.throws(() => excel.parseWorkbook(wb), /champ manquant/);
});

test('Excel : données incomplètes expressément N.R. ne deviennent pas des taux officiels à zéro', () => {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([{
    Établissement: 'Collège Incomplet', Effectif_Classe: 10,
    DNB_Inscrits: 10, CFG_Inscrits: 10, DNB_Renseigne: 'NON', CFG_Renseigne: 'NON',
  }]), 'Donnees_StatSEGPA');
  const [e] = excel.parseWorkbook(wb);
  assert.equal(e.dnbComplete, false);
  assert.equal(e.cfgComplete, false);
});
