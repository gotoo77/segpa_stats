const { test, expect } = require('@playwright/test');

// Régression Firefox : un caption dans un <table class="sr-only"> pouvait sortir du clip
// et se dessiner directement sur le titre visible du graphique DNB.
test.use({ browserName: 'firefox' });

for (const [label, url, slug] of [
  ['React compilé', 'http://127.0.0.1:4173', 'vite'],
  ['HTML portable', 'http://127.0.0.1:4174', 'portable'],
]) {
  test(label + ' : le titre DNB reste lisible dans Firefox', async ({ page }) => {
    await page.goto(url);

    const heading = page.getByRole('heading', {
      name: 'DNB Pro : inscription et réussite par établissement',
    });
    await expect(heading).toBeVisible();

    // Le conteneur entier doit être masqué, et non le tableau seul.
    const table = page.getByRole('table', { name: 'Données comparatives DNB par établissement' });
    const wrapper = table.locator('xpath=..');
    await expect(wrapper).toHaveClass(/\bsr-only\b/);
    const clip = await wrapper.evaluate((node) => {
      const style = getComputedStyle(node);
      return { position: style.position, overflow: style.overflow };
    });
    expect(clip).toEqual({ position: 'absolute', overflow: 'hidden' });

    // elementFromPoint() travaille dans la zone visible : amener d'abord le titre à l'écran.
    await heading.scrollIntoViewIfNeeded();
    // Le caption ne doit pas intercepter les points situés sur le titre.
    const headingUnobscured = await heading.evaluate((node) => {
      const rect = node.getBoundingClientRect();
      return [20, 100, 230].filter((offset) => offset < rect.width)
        .every((offset) => {
          const hit = document.elementFromPoint(rect.left + offset, rect.top + rect.height / 2);
          return hit === node || node.contains(hit);
        });
    });
    expect(headingUnobscured).toBe(true);

    // Capture du bloc complet pour la revue visuelle du titre et du graphique.
    await page.waitForTimeout(1200);
    const card = heading.locator('xpath=../../..');
    await card.screenshot({ path: 'test-results/firefox-dnb-title-' + slug + '.png' });
  });
}
