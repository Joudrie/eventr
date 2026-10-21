// Expo's web export makes a favicon but no apple-touch-icon, which iPhones need
// for the home-screen icon. Copy the icon into dist and link it from every page.
import { readFileSync, writeFileSync, copyFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const app = JSON.parse(readFileSync('app.json', 'utf8')).expo;
const base = (app.experiments?.baseUrl ?? '').replace(/\/$/, '');
copyFileSync('assets/apple-touch-icon.png', 'dist/apple-touch-icon.png');
const tag = `<link rel="apple-touch-icon" href="${base}/apple-touch-icon.png">`;

function walk(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (p.endsWith('.html')) {
      const s = readFileSync(p, 'utf8');
      if (!s.includes('apple-touch-icon')) writeFileSync(p, s.replace('<head>', `<head>${tag}`));
    }
  }
}
walk('dist');
