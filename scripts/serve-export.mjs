/**
 * Serves `dist/` the way GitHub Pages serves it.
 *
 * The static export is a genuinely different code path from the dev server — it
 * renders each route at build time, then hydrates — and that difference has hidden
 * real bugs. The empty `<title>` shipped for days because nothing ever loaded a
 * built page and looked at it.
 *
 * Playwright can point at this instead of `expo start` to run the whole suite
 * against the artifact that actually gets deployed. See `E2E_TARGET` in
 * playwright.config.ts.
 *
 * Two things this reproduces that a plain static server does not:
 *
 * 1. **The base path.** `experiments.baseUrl` is `/eventr`, so every asset URL in
 *    the built HTML is `/eventr/_expo/...`. Serving `dist/` at the root 404s all of
 *    them, the bundle never runs, and nothing hydrates. Requests without the prefix
 *    are redirected onto it, so the browser sits at the same URL shape production
 *    uses and the router sees the pathname it will really get.
 *
 * 2. **Pages' resolution rules.** Extensionless paths resolve by appending `.html`,
 *    directories resolve to `index.html`, and anything unmatched gets `404.html`
 *    with a 404 status. That last rule is what lets `/eventr/event/<unknown-id>`
 *    boot the app and let the router explain itself, instead of showing GitHub's
 *    own 404 page.
 *
 * Usage: node scripts/serve-export.mjs [port] [dir]
 */
import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';

const port = Number(process.argv[2] ?? 8124);
const root = resolve(process.argv[3] ?? 'dist');

/** The prefix the export was built for. Read from source so the two cannot drift. */
const base = (
  JSON.parse(readFileSync(new URL('../app.json', import.meta.url), 'utf8')).expo.experiments
    ?.baseUrl ?? ''
).replace(/\/$/, '');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.woff2': 'font/woff2',
  '.map': 'application/json; charset=utf-8',
};

const isFile = (p) => existsSync(p) && statSync(p).isFile();

/** Returns the file Pages would serve for a path below the base, or null for a 404. */
function resolveFile(relPath) {
  // normalize() collapses `..`, so a request cannot climb out of the export.
  const rel = normalize(decodeURIComponent(relPath)).replace(/^(\.\.[/\\])+/, '');
  const target = join(root, rel);
  if (!target.startsWith(root)) return null;

  if (isFile(target)) return target;
  if (isFile(`${target}.html`)) return `${target}.html`;
  if (isFile(join(target, 'index.html'))) return join(target, 'index.html');
  return null;
}

const server = createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const path = url.pathname;

  const underBase = base === '' || path === base || path.startsWith(`${base}/`);
  if (!underBase) {
    // Land the browser on the same URL shape production serves, so a test that
    // navigates to `/event/<id>` still exercises `/eventr/event/<id>`.
    res.writeHead(302, { location: `${base}${path}${url.search}` }).end();
    return;
  }

  const found = resolveFile(path.slice(base.length) || '/');
  const file = found ?? join(root, '404.html');
  const status = found ? 200 : 404;

  if (!isFile(file)) {
    res.writeHead(404, { 'content-type': 'text/plain' }).end('Not found');
    return;
  }

  res.writeHead(status, {
    'content-type': TYPES[extname(file)] ?? 'application/octet-stream',
    // The suite reloads pages constantly and every build changes the hashed
    // filenames anyway; caching here would only serve stale bytes.
    'cache-control': 'no-store',
  });
  createReadStream(file).pipe(res);
});

server.listen(port, () => {
  console.log(`serving ${root} at http://localhost:${port}${base}/`);
});
