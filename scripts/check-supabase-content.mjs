import { promises as fs } from "fs";
import path from "path";

const root = process.cwd();
const directoriesToScan = ["supabase", "sql"];
const fieldPattern = /(content|body|portabletext|mdx|html)/i;
const postContext = /(post|blog|article|postagem|postagens)/i;
const allowedExtensions = new Set([".js", ".ts", ".mjs", ".sql", ".ps1", ".json", ".md"]);
const whitelist = new Set([
 path.normalize("sql/blog_search_functions.sql"),
 path.normalize("sql/migration_add_seo_score.sql"),
 path.normalize("sql/seed_blog_demo.sql"),
]);

async function listFiles(dir) {
 const entries = await fs.readdir(dir, { withFileTypes: true });
 const files = [];
 for (const entry of entries) {
 if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
 const fullPath = path.join(dir, entry.name);
 if (entry.isDirectory()) {
 files.push(...(await listFiles(fullPath)));
 } else {
 const ext = path.extname(entry.name);
 if (allowedExtensions.has(ext)) {
 files.push(fullPath);
 }
 }
 }
 return files;
}

async function run() {
 const offenders = [];

 for (const dir of directoriesToScan) {
 const fullDir = path.join(root, dir);
 try {
 const stats = await fs.stat(fullDir);
 if (!stats.isDirectory()) continue;
 } catch {
 continue;
 }

 const files = await listFiles(fullDir);
 for (const file of files) {
 const relativePath = path.relative(root, file);
 if (whitelist.has(path.normalize(relativePath))) continue;
 const content = await fs.readFile(file, "utf8");
 const lines = content.split(/\r?\n/);
 for (let idx = 0; idx < lines.length; idx += 1) {
 const line = lines[idx];
 if (fieldPattern.test(line) && postContext.test(line)) {
 offenders.push({ file, lineNumber: idx + 1, snippet: line.trim() });
 }
 }
 }
 }

 if (offenders.length > 0) {
 console.error("Não duplicar conteúdo editorial no Supabase:");
 offenders.forEach(({ file, lineNumber, snippet }) => {
 console.error(` ${path.relative(root, file)}:${lineNumber} → ${snippet}`);
 });
 process.exit(1);
 }

 console.log("Supabase content guard: ok");
}

run().catch((error) => {
 console.error("check-supabase-content failed:", error);
 process.exit(1);
});
