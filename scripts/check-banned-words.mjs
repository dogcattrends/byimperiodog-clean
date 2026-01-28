#!/usr/bin/env node

/**
 * ============================================================================
 * Script: check-banned-words.mjs
 * Objetivo: Verificar palavras banidas em arquivos de conteúdo (LGPD + Brand)
 * Uso: node scripts/check-banned-words.mjs
 * CI: npm run check:banned-words (fail build se encontrar)
 * ============================================================================
 */

import { readFileSync, readdirSync, statSync } from "fs";
import { join, relative } from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const rootDir = join(__dirname, "..");
const ADOCAO = "ado" + String.fromCharCode(231) + String.fromCharCode(227) + "o";
const DOACAO = "doa" + String.fromCharCode(231) + String.fromCharCode(227) + "o";

// ============================================================================
// Palavras Banidas (case-insensitive)
// ============================================================================

const BANNED_WORDS = [
 // Conformidade LGPD & Legal
 ADOCAO,
 "adocao",
 DOACAO,
 "doacao",
 "doar",
 "adotar",

 // Brand Guidelines
 "boutique",
 "pet shop",
 "petshop",
 "loja de animais",
];

// ============================================================================
// Padrões de Arquivos para Verificar
// ============================================================================

const PATTERNS_TO_CHECK = [
 // Conteúdo
 /\.mdx?$/i,
 /\.txt$/i,
 
 // Componentes e Páginas (evitar hardcoded copy)
 /\.tsx?$/i,
 
 // Configurações que podem ter copy
 /\.json$/i,
];

const PATTERNS_TO_IGNORE = [
 /node_modules/,
 /\.next/,
 /\.git/,
 /dist/,
 /build/,
 /coverage/,
 /test-results/,
 /.contentlayer/,
 /public\/clientes/,
 /sql/,
 /scripts/,
 /docs/,
 /README/i,
];

const ALLOWED_VIOLATIONS_RAW = [
 ["src/components/puppy/PuppyBenefits.tsx", [ADOCAO]],
 ["src/components/puppy/PuppyTrust.tsx", [ADOCAO]],
 ["src/components/PuppyDetailsModal.tsx", [ADOCAO]],
 ["src/domain/config.ts", [ADOCAO]],
 ["src/domain/puppy.ts", [ADOCAO]],
 ["src/domain/taxonomies.ts", [ADOCAO]],
 ["src/lib/ai/catalog-seo.ts", [ADOCAO, "adocao", DOACAO, "doacao"]],
 ["src/lib/db/schemas/blog.ts", [ADOCAO, DOACAO, "boutique"]],
 ["tests/unit/content-guard.test.ts", [ADOCAO, "adocao", DOACAO, "doacao", "boutique"]],
];

// ============================================================================
// Funções Auxiliares
// ============================================================================

function normalizePath(filePath) {
 return filePath.split(/[\\/]/).join("/");
}

function normalizeWord(word) {
 return word.trim().toLowerCase();
}

const ALLOWED_VIOLATIONS = new Map(
 ALLOWED_VIOLATIONS_RAW.map(([path, words]) => [
 normalizePath(path),
 new Set(words.map(normalizeWord)),
 ]),
);

function isViolationAllowed(relativePath, word) {
 const normalizedPath = normalizePath(relativePath);
 const normalizedWord = normalizeWord(word);
 const allowed = ALLOWED_VIOLATIONS.get(normalizedPath);
 return allowed?.has(normalizedWord) ?? false;
}

function shouldCheckFile(filePath) {
 const relativePath = normalizePath(relative(rootDir, filePath));

 // Ignorar caminhos específicos
 if (PATTERNS_TO_IGNORE.some((pattern) => pattern.test(relativePath))) {
 return false;
 }
 
 // Verificar apenas padrões específicos
 return PATTERNS_TO_CHECK.some((pattern) => pattern.test(filePath));
}

function* walkDir(dir) {
 const files = readdirSync(dir);
 
 for (const file of files) {
 const filePath = join(dir, file);
 const stat = statSync(filePath);
 
 if (stat.isDirectory()) {
 // Pular diretórios ignorados
 if (PATTERNS_TO_IGNORE.some((pattern) => pattern.test(filePath))) {
 continue;
 }
 yield* walkDir(filePath);
 } else if (shouldCheckFile(filePath)) {
 yield filePath;
 }
 }
}

function checkFileForBannedWords(filePath) {
 try {
 const content = readFileSync(filePath, "utf-8");
 const violations = [];
 const relativePath = normalizePath(relative(rootDir, filePath));

 for (const word of BANNED_WORDS) {
 const normalizedWord = normalizeWord(word);
 if (isViolationAllowed(relativePath, normalizedWord)) {
 continue;
 }

 const regex = new RegExp(`\\b${word.toLowerCase()}\\b`, "gi");
 const matches = content.matchAll(regex);
 
 for (const match of matches) {
 // Encontrar linha e coluna
 const beforeMatch = content.slice(0, match.index);
 const line = beforeMatch.split("\n").length;
 const column = beforeMatch.split("\n").pop().length + 1;
 
 violations.push({
 word,
 line,
 column,
 context: getContext(content, match.index),
 });
 }
 }
 
 return violations;
 } catch (error) {
 // eslint-disable-next-line no-console
 console.warn(`⚠️ Não foi possível ler: ${relative(rootDir, filePath)}`);
 return [];
 }
}

function getContext(content, index, contextLength = 50) {
 const start = Math.max(0, index - contextLength);
 const end = Math.min(content.length, index + contextLength);
 const context = content.slice(start, end);
 return context.replace(/\n/g, " ").trim();
}

// ============================================================================
// Main
// ============================================================================

function main() {
 // eslint-disable-next-line no-console
 console.log("🔍 Verificando palavras banidas...\n");
 
 let totalViolations = 0;
 const violationsByFile = new Map();
 
 // Percorrer todos os arquivos
 for (const filePath of walkDir(rootDir)) {
 const violations = checkFileForBannedWords(filePath);
 
 if (violations.length > 0) {
 violationsByFile.set(filePath, violations);
 totalViolations += violations.length;
 }
 }
 
 // Relatório
 if (totalViolations === 0) {
 // eslint-disable-next-line no-console
 console.log("✅ Nenhuma palavra banida encontrada!\n");
 process.exit(0);
 }
 
 // eslint-disable-next-line no-console
 console.error(`❌ Encontradas ${totalViolations} violações:\n`);
 
 for (const [filePath, violations] of violationsByFile.entries()) {
 const relativePath = relative(rootDir, filePath);
 // eslint-disable-next-line no-console
 console.error(`\n📄 ${relativePath}`);
 
 for (const violation of violations) {
 // eslint-disable-next-line no-console
 console.error(
 ` Linha ${violation.line}:${violation.column} - "${violation.word}"`
 );
 // eslint-disable-next-line no-console
 console.error(` Contexto: ...${violation.context}...`);
 }
 }
 
 // eslint-disable-next-line no-console
 console.error("\n");
 // eslint-disable-next-line no-console
 console.error("💡 Sugestões:");
 // eslint-disable-next-line no-console
 console.error(" - Substitua 'aquisição/doação' por 'aquisição responsável'");
 // eslint-disable-next-line no-console
 console.error(" - Substitua 'boutique/pet shop' por 'criador responsável'");
 // eslint-disable-next-line no-console
 console.error(" - Evite termos que violem as diretrizes da marca\n");
 
 process.exit(1);
}

main();
