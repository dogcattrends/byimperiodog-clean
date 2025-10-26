#!/usr/bin/env node

import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const targets = process.argv.slice(2);

const files =
  targets.length > 0
    ? targets
    : execSync("git ls-files", { encoding: "utf8" })
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

const bannedPattern = /\b(ado[cç]ão|doa[cç]ão|boutique)\b/i;
const breedPattern = /Spitz\s+Alem[aã]o(?:\s+An[aã]o)?/gi;
const requiredPhrase = /Lulu da Pomer[aâ]nia/i;

const violations = [];

for (const file of files) {
  if (!file.match(/\.(ts|tsx|md|mdx)$/)) continue;

  const content = readFileSync(resolve(process.cwd(), file), "utf8");

  if (bannedPattern.test(content)) {
    violations.push(`${file}: contém termos proibidos (adoção/doação/boutique).`);
  }

  const matches = [...content.matchAll(breedPattern)];
  for (const match of matches) {
    const start = Math.max(0, (match.index ?? 0) - 100);
    const end = (match.index ?? 0) + match[0].length + 100;
    const window = content.slice(start, end);
    if (!requiredPhrase.test(window)) {
      violations.push(`${file}: menciona "${match[0]}" sem "Lulu da Pomerânia" no mesmo contexto.`);
    }
  }
}

if (violations.length) {
  console.error("❌ Content guard falhou:\n" + violations.map((v) => ` - ${v}`).join("\n"));
  process.exit(1);
}

console.log("✅ Content guard aprovado.");
