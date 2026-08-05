/**
 * Module resolution hook for the standalone scripts.
 *
 * Metro resolves extensionless imports and the `@/` alias for the app; plain Node does
 * not. Rather than litter the app source with `.ts` extensions to suit the test runner,
 * this teaches Node the same two rules. Node's own type stripping handles the rest, so
 * the scripts need no build step and no test framework.
 */

import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'src');
const EXTENSIONS = ['.ts', '.tsx', '.mts'];

function isFile(candidate) {
  return existsSync(candidate) && statSync(candidate).isFile();
}

function resolveFile(base) {
  if (path.extname(base) && isFile(base)) return base;
  for (const ext of EXTENSIONS) {
    if (isFile(base + ext)) return base + ext;
  }
  for (const ext of EXTENSIONS) {
    const index = path.join(base, `index${ext}`);
    if (isFile(index)) return index;
  }
  return null;
}

export async function resolve(specifier, context, next) {
  let base = null;

  if (specifier.startsWith('@/')) {
    base = path.join(SRC, specifier.slice(2));
  } else if (specifier.startsWith('.') && context.parentURL?.startsWith('file:')) {
    base = path.resolve(path.dirname(fileURLToPath(context.parentURL)), specifier);
  }

  if (base) {
    const resolved = resolveFile(base);
    if (resolved) {
      return { url: pathToFileURL(resolved).href, shortCircuit: true };
    }
  }

  return next(specifier, context);
}
