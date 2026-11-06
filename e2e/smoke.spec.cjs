const { test, expect } = require('@playwright/test');
const XLSX = require('xlsx');

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
    await test.info().attach('rapport-papier-' + label + '.png', {
      body: await page.locator('.report-paper').screenshot(), contentType: 'image/png',
    });

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
