const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const XLSX = require('xlsx');

function loadTs(file, mocks = {}) {
  const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
  const module = { exports: {} };
  const localRequire = (id) => Object.hasOwn(mocks, id) ? mocks[id] : require(id);
  new Function('require', 'module', 'exports', compiled.outputText)(localRequire, module, module.exports);
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
