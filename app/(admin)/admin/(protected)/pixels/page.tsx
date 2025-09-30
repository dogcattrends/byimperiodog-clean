"use client";
import React, { useEffect, useState } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';

export default function PixelsPage(){
  const [ga4,setGa4] = useState<string>(process.env.NEXT_PUBLIC_GA4_ID || '');
  const [fb,setFb] = useState<string>('');
  const [tt,setTt] = useState<string>('');
  const [saving,setSaving] = useState(false);
  const [msg,setMsg] = useState<string>('');

  useEffect(()=>{
    (async ()=>{
      try{
        const r = await fetch('/api/admin/settings',{ cache:'no-store' });
        const j = await r.json();
        const s = j?.settings || {};
        if (s.ga4_id) setGa4(s.ga4_id);
        if (s.meta_pixel_id) setFb(s.meta_pixel_id);
        if (s.tiktok_pixel_id) setTt(s.tiktok_pixel_id);
      }catch{}
    })();
  },[]);

  async function save(){
    try{
      setSaving(true); setMsg('');
      const r = await fetch('/api/admin/settings/pixels',{
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ ga4:ga4.trim(), meta_pixel_id: fb.trim(), tiktok_pixel_id: tt.trim() })
      });
      const j = await r.json().catch(()=> ({}));
      if(!r.ok) throw new Error(j?.error||'Falha ao salvar');
      setMsg('Salvo. Publicação pode levar até 1 min.');
    }catch(e:any){ setMsg(String(e?.message||e)); }
    finally{ setSaving(false); }
  }

  return (
    <AdminShell>
      <div className="mx-auto max-w-2xl p-6 space-y-6">
        <header>
          <h1 className="text-2xl font-bold tracking-tight">Pixels e Medição</h1>
          <p className="text-[13px] text-[var(--text-muted)]">Configure IDs para GA4, Meta e TikTok. Ambientes: prefira variáveis (.env) em produção.</p>
        </header>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-4">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">GA4 Measurement ID</label>
            <input value={ga4} onChange={e=> setGa4(e.target.value)} placeholder="G-XXXXXXX" className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">Meta Pixel ID</label>
            <input value={fb} onChange={e=> setFb(e.target.value)} placeholder="1234567890" className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">TikTok Pixel ID</label>
            <input value={tt} onChange={e=> setTt(e.target.value)} placeholder="ABCDEF1234567890" className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm" />
          </div>
          <div className="flex items-center gap-2">
            <button onClick={save} disabled={saving} className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm hover:bg-[var(--surface)] disabled:opacity-50">{saving? 'Salvando...':'Salvar'}</button>
            {msg && <span className="text-[12px] text-[var(--text-muted)]">{msg}</span>}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
