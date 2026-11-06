const { test, expect } = require('@playwright/test');
const XLSX = require('xlsx');
const fs = require('node:fs');
const JSZip = require('jszip');

for (const [label, url] of [
  ['React compilé', 'http://127.0.0.1:4173'],
  ['HTML portable', 'http://127.0.0.1:4174'],
]) {
  test(label + ': rapport papier lisible, sessions annuelles et diaporama', async ({ page }) => {
    await page.goto(url);
    await expect(page.getByRole('heading', { name: 'StatSEGPA' })).toBeVisible();
    await expect(page.getByLabel('Version de StatSEGPA')).toContainText('0.2.0');
    await page.getByRole('combobox', { name: 'Choisir une session annuelle' }).selectOption('2024');
    await expect(page.getByRole('combobox', { name: 'Choisir une session annuelle' })).toHaveValue('2024');
    await page.getByRole('combobox', { name: 'Choisir une session annuelle' }).selectOption('2026');

    await page.getByRole('button', { name: 'Rapport', exact: true }).click();
    await expect(page.getByText('Rapport Récapitulatif Imprimable')).toBeVisible();
    await expect(page.locator('.report-paper table tbody tr').first()).toHaveCSS('color', 'rgb(15, 23, 42)');
    fs.mkdirSync('test-results', { recursive: true });
    const slug = label.startsWith('React') ? 'vite' : 'portable';
    await page.locator('.report-paper').screenshot({ path: 'test-results/rapport-papier-' + slug + '.png' });
    await page.getByRole('button', { name: 'Passer en mode sombre' }).click();
    await expect(page.locator('.report-paper table tbody tr').first()).toHaveCSS('color', 'rgb(15, 23, 42)');
    await page.getByRole('button', { name: 'Mode Sombre', exact: true }).click();
    await page.locator('table tbody tr').first().screenshot({ path: 'test-results/rapport-sombre-' + slug + '.png' });
    await page.getByRole('button', { name: 'Feuille Papier A4' }).click();
    await expect(page.locator('.report-paper table tbody tr').first()).toHaveCSS('color', 'rgb(15, 23, 42)');

    await page.getByRole('button', { name: 'Présentation', exact: true }).click();
    await page.getByRole('button', { name: /Paramétrer/ }).click();
    await expect(page.getByRole('heading', { name: 'Réglages de la présentation' })).toBeVisible();
    await page.getByRole('textbox', { name: 'Titre', exact: true }).fill('Diaporama personnalisé');
    await expect(page.getByRole('heading', { name: 'Diaporama personnalisé' })).toBeVisible();
  });

  test(label + ': importer Excel affiche un aperçu avant toute modification', async ({ page }) => {
    await page.goto(url);
    await page.getByRole('button', { name: 'Ouvrir les options d\'import et export Excel' }).click();
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([{
      Établissement: 'Collège Test Prévisualisation',
      Bassin: 'Douaisis',
      Effectif_Classe: 10,
      DNB_Inscrits: 10, DNB_Admis: 9, DNB_Refuses: 1,
      DNB_Mention_AB: 1, DNB_Mention_B: 2, DNB_Mention_TB: 1,
      CFG_Inscrits: 10, CFG_Admis: 10, CFG_Refuses: 0,
    }]), 'Donnees_StatSEGPA');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    await page.locator('input[accept*=".xlsx"]').setInputFiles({
      name: 'test.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', buffer,
    });
    await expect(page.getByRole('region', { name: 'Prévisualisation de l\'import Excel' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Confirmer le remplacement' })).toBeVisible();
    await page.getByRole('button', { name: 'Annuler', exact: true }).click();
    await expect(page.getByRole('region', { name: 'Prévisualisation de l\'import Excel' })).toHaveCount(0);
  });
}

for (const [label, url] of [
  ['React compilé', 'http://127.0.0.1:4173'],
  ['HTML portable', 'http://127.0.0.1:4174'],
]) {
  test(label + ': un résultat incohérent bloque les rapports et exports', async ({ page }) => {
    await page.goto(url);
    await page.getByRole('button', { name: 'Saisie Tableur' }).click();
    await page.getByRole('spinbutton', { name: /Candidats admis DNB pour/ }).first().fill('999');
    await page.getByRole('button', { name: 'Rapport', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('Rapport non validé');
    await expect(page.getByRole('button', { name: 'Imprimer ou Enregistrer en PDF' })).toBeDisabled();
    await page.getByRole('button', { name: 'Présentation', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('Présentation non validée');
    await expect(page.getByRole('button', { name: /Exporter Présentation LibreOffice/ })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Capturer slide (PNG)' })).toBeDisabled();
  });
}

for (const [label, url] of [
  ['React compilé', 'http://127.0.0.1:4173'],
  ['HTML portable', 'http://127.0.0.1:4174'],
]) {
  test(label + ': restaurer 2024 seul reste exclusif après rechargement', async ({ page }) => {
    await page.goto(url);
    await page.getByRole('button', { name: "Ouvrir les options d'import et export Excel" }).click();
    page.on('dialog', dialog => dialog.accept());
    const record = { id: 'session-2024', year: 'Session 2024',
      bassinName: 'Réseau de test', establishments: [], regions: [], submissions: [],
      lastUpdated: '2026-11-06T00:00:00.000Z' };
    const backup = { format: 'statsegpa-backup', version: 1, activeYear: '2024',
      exportedAt: '2026-11-06T00:00:00.000Z', sessions: { '2024': record } };
    await page.locator('input[accept=".json"]').setInputFiles({
      name: 'backup.json', mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(backup), 'utf8'),
    });
    const select = page.getByRole('combobox', { name: 'Choisir une session annuelle' });
    await expect(select.locator('option')).toHaveCount(1);
    await expect(select).toHaveValue('2024');
    await expect.poll(async () => page.evaluate(() =>
      Object.keys(JSON.parse(localStorage.getItem('statsegpa_sessions_v1') || '{}')).join(',')
    )).toBe('2024');
    await page.reload();
    await expect(page.getByRole('combobox', { name: 'Choisir une session annuelle' }).locator('option')).toHaveCount(1);
    await expect(page.getByRole('combobox', { name: 'Choisir une session annuelle' })).toHaveValue('2024');
  });

  test(label + ': importer un nouveau bassin le rend sélectionnable', async ({ page }) => {
    await page.goto(url);
    await page.getByRole('button', { name: "Ouvrir les options d'import et export Excel" }).click();
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([{
      Établissement: 'Collège du bassin importé', Bassin: 'Valenciennois', Effectif_Classe: 10,
      DNB_Inscrits: 10, DNB_Admis: 8, DNB_Refuses: 2,
      DNB_Mention_AB: 0, DNB_Mention_B: 0, DNB_Mention_TB: 0,
      CFG_Inscrits: 10, CFG_Admis: 9, CFG_Refuses: 1,
    }]), 'Donnees_StatSEGPA');
    page.on('dialog', dialog => dialog.accept());
    await page.locator('input[accept*=".xlsx"]').setInputFiles({
      name: 'bassin.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer: XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }),
    });
    await expect(page.getByRole('region', { name: "Prévisualisation de l'import Excel" })).toBeVisible();
    await page.getByRole('button', { name: 'Confirmer le remplacement' }).click();
    await page.getByRole('button', { name: 'Fermer', exact: true }).click();
    const basin = page.getByRole('button', { name: /Valenciennois \(1\)/ });
    await expect(basin).toBeVisible();
    await basin.click();
    await page.getByRole('button', { name: 'Saisie Tableur' }).click();
    await expect(page.locator('input[value="Collège du bassin importé"]').first()).toBeVisible();
  });

  test(label + ': une panne de stockage local provoque une alerte visible', async ({ page }) => {
    await page.addInitScript(() => {
      const original = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key, value) {
        if (key === 'statsegpa_sessions_v1') throw new Error('Quota dépassé (simulation)');
        return original.call(this, key, value);
      };
    });
    await page.goto(url);
    await expect(page.getByRole('alert')).toContainText('Sauvegarde locale impossible');
  });
}

for (const [label, url] of [
  ['React compilé', 'http://127.0.0.1:4173'],
  ['HTML portable', 'http://127.0.0.1:4174'],
]) {
  test(label + ': fractions et pourcentages DNB cohérents avec des résultats manquants', async ({ page }) => {
    await page.goto(url);
    const fraction = await page.evaluate(() => {
      const key = 'statsegpa_sessions_v1';
      const sessions = JSON.parse(localStorage.getItem(key));
      const schools = sessions['2026'].establishments;
      const relevant = schools.filter(e => e.bassin === 'Douaisis');
      relevant[1].dnbComplete = false;
      localStorage.setItem(key, JSON.stringify(sessions));
      const known = relevant.filter(e => e.dnbComplete !== false);
      return known.reduce((sum, e) => sum + e.dnb.inscrits, 0) + ' inscrits / ' +
        known.reduce((sum, e) => sum + e.effectifClasse, 0) + ' élèves';
    });
    await page.reload();
    await page.getByRole('button', { name: 'Rapport', exact: true }).click();
    await expect(page.locator('.report-paper')).toContainText(fraction);
  });
}


for (const [label, url] of [
  ['React compilé', 'http://127.0.0.1:4173'],
  ['HTML portable', 'http://127.0.0.1:4174'],
]) {
  test(label + ': les brouillons N.R. sont masqués dans le rapport et le PPTX, mais restent récupérables', async ({ page }) => {
    await page.goto(url);
    const schoolName = await page.evaluate(() => {
      const key = 'statsegpa_sessions_v1';
      const sessions = JSON.parse(localStorage.getItem(key));
      const est = sessions['2026'].establishments.find(e => e.bassin === 'Douaisis');
      est.dnbComplete = false;
      est.cfgComplete = false;
      est.dnb.admis = 987;
      est.dnb.inscrits = 976;
      est.dnb.mentions.ab = 975;
      est.cfg.admis = 986;
      est.cfg.inscrits = 974;
      localStorage.setItem(key, JSON.stringify(sessions));
      return est.name;
    });
    await page.reload();
    await page.getByRole('button', { name: 'Rapport', exact: true }).click();
    const rows = page.locator('.report-paper table tbody tr').filter({ hasText: schoolName });
    await expect(rows).toHaveCount(2);
    for (const row of await rows.all()) {
      await expect(row).toContainText('N.R.');
      await expect(row).not.toContainText('987');
      await expect(row).not.toContainText('986');
      await expect(row).not.toContainText('976');
      await expect(row).not.toContainText('974');
    }
    await page.getByRole('button', { name: 'Présentation', exact: true }).click();
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /Exporter Présentation LibreOffice/ }).click();
    const download = await downloadPromise;
    const archive = await JSZip.loadAsync(fs.readFileSync(await download.path()));
    const slideFiles = Object.keys(archive.files).filter(n => /^ppt\/slides\/slide\d+\.xml$/.test(n));
    expect(slideFiles.length).toBeGreaterThan(0);
    const slideXml = (await Promise.all(slideFiles.map(n => archive.file(n).async('string')))).join('\n');
    for (const draftNumber of ['987','986','976','974','975']) {
      expect(slideXml).not.toContain('<a:t>' + draftNumber + '</a:t>');
    }
    expect(slideXml).toContain('N.R.');
    const stored = await page.evaluate(() => {
      const e = JSON.parse(localStorage.getItem('statsegpa_sessions_v1'))['2026'].establishments.find(e => e.dnbComplete === false);
      return { dnbAdmis: e.dnb.admis, cfgAdmis: e.cfg.admis };
    });
    expect(stored).toEqual({ dnbAdmis: 987, cfgAdmis: 986 });
  });
}
