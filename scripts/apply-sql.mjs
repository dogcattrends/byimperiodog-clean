import fs from 'fs';
import path from 'path';
import { Client } from 'pg';

const DB_URL = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
const sqlDir = path.resolve(process.cwd(), 'sql');

const files = [
 'admin_config.sql',
 'site_settings.sql',
 'media.sql',
 'puppies_normalize_phase1.sql',
 'leads.sql',
 'catalog_ranking.sql',
 'seed_demo_pt.sql',
 'seed_blog_demo.sql'
].map((f) => path.join(sqlDir, f));

async function run() {
 console.log('Conectando em', DB_URL);
 const client = new Client({ connectionString: DB_URL });
 await client.connect();
 for (const file of files) {
 if (!fs.existsSync(file)) {
 console.log('Ignorando (não existe):', file);
 continue;
 }
 console.log('Executando:', path.basename(file));
 let sql = fs.readFileSync(file, 'utf8');
 // Split statements safely (respecting dollar-quoted $$...$$ and single quotes)
 const parts = [];
 let buf = '';
 let inSingle = false;
 let inDollar = false;
 let dollarTag = null;
 for (let i = 0; i < sql.length; i++) {
 const ch = sql[i];
 const next = sql.slice(i, i + 2);
 // detect start/end of dollar-quote like $$ or $tag$
 if (!inSingle) {
 if (!inDollar && ch === '$') {
 // read tag
 const m = sql.slice(i).match(/^\$[A-Za-z0-9_]*\$/);
 if (m) {
 inDollar = true;
 dollarTag = m[0];
 buf += m[0];
 i += m[0].length - 1;
 continue;
 }
 } else if (inDollar && sql.slice(i, i + dollarTag.length) === dollarTag) {
 inDollar = false;
 buf += dollarTag;
 i += dollarTag.length - 1;
 continue;
 }
 }
 if (!inDollar) {
 if (ch === "'") {
 inSingle = !inSingle;
 }
 if (ch === ';' && !inSingle) {
 if (buf.trim()) parts.push(buf.trim());
 buf = '';
 continue;
 }
 }
 buf += ch;
 }
 if (buf.trim()) parts.push(buf.trim());
 try {
 for (const part of parts) {
 await client.query(part);
 }
 console.log('OK:', path.basename(file));
 } catch (err) {
 console.error('Erro ao executar', path.basename(file), err.message || err);
 }
 }
 await client.end();
 console.log('Concluído.');
}

run().catch((err) => {
 console.error(err);
 process.exit(1);
});
