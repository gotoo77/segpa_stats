import { copyFileSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

const source = resolve('dist/index.html');
const destination = resolve('StatSEGPA_Portable.html');
const html = readFileSync(source, 'utf8');
if (!html.includes('<div id="root"></div>')) throw new Error('Application React introuvable dans le build.');
if (/<script[^>]+src=["'](?!data:)/i.test(html)) throw new Error('JavaScript externe détecté dans le HTML portable.');
if (/<link[^>]+rel=["']stylesheet["'][^>]+href=["'](?!data:)/i.test(html)) throw new Error('Feuille CSS externe détectée.');
if (/(<script\b[^>]*type=["']module["'][^>]*>)/i.test(html) && !html.includes('</script>')) throw new Error('Bundle JS manquant.');
copyFileSync(source, destination);
console.log('Version portable synchronisée : ' + destination + ' (' + statSync(destination).size + ' octets).');
