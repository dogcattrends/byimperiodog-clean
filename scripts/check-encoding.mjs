#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Verifica se há padrões de mojibake (UTF-8 mal interpretado) no código fonte.
 * Falha (exit 1) se encontrar.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const exts = new Set(['.ts', '.tsx', '.md', '.mdx', '.sql', '.js', '.mjs', '.cjs']);
const root = process.cwd();
const ignored = new Set([
  'docs/FIX_ENCODING_BLOG.md',
  'src/lib/tracking/examples.ts',
  'tests/encoding.test.ts',
]);

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    if (
      d.name.startsWith('.') ||
      d.name === 'node_modules' ||
      d.name === 'coverage' ||
      d.name === 'playwright-report' ||
      d.name === '.next'
    ) {
      return [];
    }
    const full = join(dir, d.name);
    if (d.isDirectory()) return walk(full);
    const ext = d.name.slice(d.name.lastIndexOf('.'));
    if (!exts.has(ext)) return [];
    return [full];
  });
}

const offenders = [];

for (const file of walk(root)) {
  const relative = file.slice(root.length + 1).split(/[\\/]/).join('/');
  if (ignored.has(relative)) {
    continue;
  }
  const txt = readFileSync(file, 'utf8');
  for (let i = 0; i < txt.length - 1; i += 1) {
    const first = txt.charCodeAt(i);
    if (first !== 0x00c2 && first !== 0x00c3) {
      continue;
    }
    const second = txt.charCodeAt(i + 1);
    if (second >= 0x0080 && second <= 0x00bf) {
      const snippet = `${txt[i]}${txt[i + 1]}`;
      offenders.push({ file, snippet });
    }
  }
}

if (offenders.length) {
  console.error('\n[encoding-check] Encontradas sequências potencialmente corrompidas:');
  for (const issue of offenders) {
    console.error(` - ${issue.file}: contém '${issue.snippet}'`);
  }
  console.error(`Total: ${offenders.length} ocorrências. Execute: npm run fix:encoding:dry`);
  process.exit(1);
}

console.log('[encoding-check] OK: nenhum padrão de mojibake encontrado.');
