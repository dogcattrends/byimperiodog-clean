import { Client } from 'pg';
import { randomInt } from 'crypto';

const DB_URL = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

async function run() {
  const c = new Client({ connectionString: DB_URL });
  await c.connect();
  console.log('Conectando em', DB_URL);

  // Insert sample leads if table empty
  const leadsCountRes = await c.query('SELECT count(*)::int as c FROM leads');
  const leadsCount = leadsCountRes.rows[0].c;
  console.log('Leads count =', leadsCount);
  if (leadsCount < 5) {
    console.log('Inserindo leads demo...');
    await c.query(`INSERT INTO leads (id, created_at, nome, telefone, origem, status)
      VALUES
      (gen_random_uuid(), now()- interval '2 days', 'Maria Silva', '+55 11 99999-0001','site','novo'),
      (gen_random_uuid(), now()- interval '1 day', 'João Souza', '+55 11 99999-0002','site','novo'),
      (gen_random_uuid(), now()- interval '12 hours', 'Ana Pereira', '+55 21 99999-0003','whatsapp','novo')
    `);
    console.log('Leads inseridos');
  } else {
    console.log('Pular inserção de leads (já existem)');
  }

  // Upsert catalog_ranking for each puppy
  const puppiesRes = await c.query('SELECT id, created_at, price_cents, status FROM puppies');
  const puppies = puppiesRes.rows;
  console.log('Puppies found:', puppies.length);

  for (let i = 0; i < puppies.length; i++) {
    const p = puppies[i];
    const score = Math.max(0, Math.min(100, Math.round((randomInt(40, 90) + (p.price_cents ? Math.min(30, p.price_cents/30000) : 0)))));
    const flag = score >= 75 ? 'hot' : score < 40 ? 'slow' : 'normal';
    const reason = flag === 'hot' ? 'Demanda alta' : flag === 'slow' ? 'Poco interesse' : 'Normal';
    const rank_order = i + 1;

    await c.query(`INSERT INTO catalog_ranking (puppy_id, score, flag, reason, rank_order)
      VALUES ($1,$2,$3,$4,$5)
      ON CONFLICT (puppy_id) DO UPDATE SET score=EXCLUDED.score, flag=EXCLUDED.flag, reason=EXCLUDED.reason, rank_order=EXCLUDED.rank_order`,
      [p.id, score, flag, reason, rank_order]);
  }

  console.log('catalog_ranking upsert complete');
  await c.end();
}

run().catch((e)=>{console.error(e); process.exit(1);});
