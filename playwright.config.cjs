const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './e2e',
  timeout: 30000,
  retries: 0,
  use: { browserName: 'chromium', screenshot: 'only-on-failure', headless: true },
  webServer: [
    { command: 'npm run preview -- --host 127.0.0.1 --port 4173',
      url: 'http://127.0.0.1:4173', reuseExistingServer: false, timeout: 60000 },
    { command: 'node scripts/serve-portable.mjs',
      url: 'http://127.0.0.1:4174', reuseExistingServer: false, timeout: 15000 },
  ],
});
