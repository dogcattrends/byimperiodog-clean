import { Client } from 'pg';

const DB_URL = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

async function inspect() {
  const c = new Client({ connectionString: DB_URL });
  await c.connect();
  console.log('Conectando em', DB_URL);

  const tables = ['puppies','catalog_ranking','leads'];
  for (const t of tables) {
    try {
      const cols = await c.query(`SELECT column_name, data_type, is_nullable
        FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position`, [t]);
      console.log('\n== Tabela', t, '==\nColunas:');
      if (cols.rows.length === 0) console.log('  (não existe ou vazio)');
      cols.rows.forEach((r) => console.log(' ', r.column_name, r.data_type, r.is_nullable));

      const fk = await c.query(`SELECT tc.constraint_name, kcu.column_name, ccu.table_name AS foreign_table_name, ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
        WHERE constraint_type = 'FOREIGN KEY' AND tc.table_name=$1;`, [t]);
      console.log('Foreign keys:');
      if (fk.rows.length===0) console.log('  (nenhuma)');
      fk.rows.forEach((r) => console.log(' ', r.constraint_name, r.column_name, '->', r.foreign_table_name + '(' + r.foreign_column_name + ')'));

      const cnt = await c.query(`SELECT count(*) FROM ${t}`);
      console.log('Rows:', (cnt.rows[0] && cnt.rows[0].count) || 0);
    } catch (e) {
      console.log('Erro ao inspecionar', t, e.message || e);
    }
  }

  await c.end();
}

inspect().catch((e)=>{console.error(e); process.exit(1);});
