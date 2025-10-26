#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
// Scope guard to public-facing content only for now
// We intentionally exclude admin, api and docs to avoid false positives in code and documentation.
const GLOB_DIRS = [
  'app', 'content'
];
const EXTS = ['.ts', '.tsx', '.md', '.mdx', '.js', '.jsx', '.html', '.txt'];

const banned = /(\badoç[aã]o\b|\bdoaç[aã]o\b|\bboutique\b)/i;
// Spitz rule (phase 1): when mentioning "Spitz Alemão Anão", require "Lulu da Pomerânia" in same or next line
// This avoids flagging generic mentions like just "Spitz Alemão" and focuses on the specific variant we use in site copy.
const spitzPattern = /(spitz\s+alem[aã]o\s+an[aã]o)/i;
const luluPattern = /(lulu\s+da\s+pomer[aâ]nia)/i;

let violations = [];

function isIgnoredPath(p) {
  const normalized = p.replace(/\\/g, '/');
  // Ignore admin and API routes and documentation
  if (/\/\(admin\)\//.test(normalized)) return true;
  if (/\/api\//.test(normalized)) return true;
  if (/\/docs\//.test(normalized)) return true;
  if (/\/tests?\//.test(normalized)) return true;
  if (/\/test-results\//.test(normalized)) return true;
  if (/\/archive_routes\//.test(normalized)) return true;
  return false;
}

function scanFile(file) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split(/\r?\n/);
  // Detect and mark YAML frontmatter boundaries for md/mdx to avoid flagging tags/metadata
  let inFrontmatter = false;
  lines.forEach((line, idx) => {
    const ext = path.extname(file).toLowerCase();
    if ((ext === '.md' || ext === '.mdx') && line.trim() === '---') {
      inFrontmatter = !inFrontmatter;
    }

    if (banned.test(line)) {
      violations.push({ file, line: idx + 1, msg: 'Termo proibido encontrado (adoção|doação|boutique).', excerpt: line.trim() });
    }
    // Skip pairing checks within frontmatter blocks to avoid flagging tag arrays/metadata
    if (inFrontmatter) return;

    const hasSpitz = spitzPattern.test(line);
    if (hasSpitz) {
      if (!luluPattern.test(line)) {
        // try a small window (same paragraph) by joining next 1 line
        const next = lines[idx + 1] || '';
        if (!luluPattern.test(next)) {
          violations.push({ file, line: idx + 1, msg: 'Uso de "Spitz Alemão" deve acompanhar "Lulu da Pomerânia" no mesmo bloco.', excerpt: line.trim() });
        }
      }
    }
  });
}

function walk(dir) {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) return;
  for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
    const p = path.join(abs, entry.name);
    if (entry.isDirectory()) {
      walk(path.join(dir, entry.name));
    } else if (EXTS.includes(path.extname(entry.name).toLowerCase())) {
      if (!isIgnoredPath(p)) scanFile(p);
    }
  }
}

for (const d of GLOB_DIRS) walk(d);

if (violations.length) {
  // eslint-disable-next-line no-console
  console.error('\
[content-guard] Violations found:');
  for (const v of violations) {
    // eslint-disable-next-line no-console
    console.error(`- ${v.file}:${v.line} — ${v.msg}\n  ${v.excerpt}`);
  }
  process.exit(1);
} else {
  // eslint-disable-next-line no-console
  console.log('[content-guard] OK');
}
