#!/usr/bin/env node
/*
  scripts/migrate-normalize.js
  One-off migration script to normalize `media`/`midia` fields and populate `cover_url`.
  Usage: set env SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, then run:
    node scripts/migrate-normalize.js

  This script writes a backup to ./tmp/puppies-backup-<timestamp>.json before updating.
*/

(async () => {
  try {
    const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
    if (!SUPABASE_URL || !SERVICE_KEY) {
      console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env');
      process.exit(1);
    }

    const { createClient } = await import('@supabase/supabase-js');
    const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

    console.log('Selecting puppies rows...');
    const { data: rows, error: selErr } = await sb.from('puppies').select('*');
    if (selErr) throw selErr;
    if (!rows || rows.length === 0) {
      console.log('No rows found.');
      return;
    }

    const fs = await import('fs');
    const path = await import('path');
    const backupDir = path.join(process.cwd(), 'tmp');
    fs.mkdirSync(backupDir, { recursive: true });
    const backupFile = path.join(backupDir, `puppies-backup-${new Date().toISOString().replace(/[:.]/g,'-')}.json`);
    fs.writeFileSync(backupFile, JSON.stringify(rows, null, 2), 'utf8');
    console.log('Backup written to', backupFile);

    let updated = 0;
    const errors = [];

    for (const r of rows) {
      try {
        const id = r.id;
        if (!id) continue;

        // derive existingPhotoUrls
        let existingPhotoUrls = [];
        if (Array.isArray(r.images)) existingPhotoUrls = r.images.filter(u => typeof u === 'string');
        else if (typeof r.media === 'string') {
          try { const parsed = JSON.parse(r.media); if (Array.isArray(parsed)) existingPhotoUrls = parsed.map(String).filter(Boolean); } catch {}
        } else if (Array.isArray(r.media)) existingPhotoUrls = r.media.map(String).filter(Boolean);

        // build mediaPayload
        let mediaPayload = [];
        if (typeof r.midia === 'string') {
          try { const parsed = JSON.parse(r.midia); if (Array.isArray(parsed)) mediaPayload = parsed; } catch {}
        } else if (Array.isArray(r.midia)) mediaPayload = r.midia;
        else if (existingPhotoUrls.length) mediaPayload = existingPhotoUrls.map(u => ({ url: u, type: 'image' }));

        const normalizedMedia = JSON.stringify(existingPhotoUrls);
        const normalizedMidia = JSON.stringify(mediaPayload);

        const updates = {};
        if (r.media !== normalizedMedia) updates.media = normalizedMedia;
        if (r.midia !== normalizedMidia) updates.midia = normalizedMidia;
        if (!r.cover_url && r.image_url) updates.cover_url = r.image_url;
        if (Object.keys(updates).length === 0) continue;
        updates.updated_at = new Date().toISOString();

        const { error: upErr } = await sb.from('puppies').update(updates).eq('id', id);
        if (upErr) {
          errors.push({ id, error: upErr.message });
        } else {
          updated++;
        }
      } catch (e) {
        errors.push({ error: String(e) });
      }
    }

    console.log(`Completed. updated=${updated}, errors=${errors.length}`);
    if (errors.length) console.error('Errors:', errors.slice(0, 10));
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
})();
