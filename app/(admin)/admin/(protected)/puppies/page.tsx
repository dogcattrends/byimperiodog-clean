"use client";
// Gerenciamento de Filhotes (mínimo) – lista de registros com link.
// TODO: Reaplicar UI rica (filtros avançados, modais) posteriormente.
import React, { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import { parseBRLToCents } from '@/lib/price';
import MediaGallery from '@/components/puppies/MediaGallery';
import { usePuppyForm } from '@/components/puppies/usePuppyForm';
import { Modal } from '@/components/dashboard/Modal';
import { useToast } from '@/components/ui/toast';
import Link from 'next/link';
import { adminFetch } from '@/lib/adminFetch';
import { AdminShell } from '@/components/admin/AdminShell';
import { FormCard } from './_components/FormCard';
import { StatusToggleGroup } from './_components/StatusToggleGroup';
import { ColorSelector } from './_components/ColorSelector';
import { PriceInputMasked } from './_components/PriceInputMasked';
import { CoverPreview } from './_components/CoverPreview';
import PuppyForm from 'src/app/admin/puppies/PuppyForm';

interface Puppy { id:string; codigo?:string|null; name?:string|null; nome?:string|null; gender?:string|null; sexo?:string|null; status?:string|null; color?:string|null; cor?:string|null; created_at?:string; updated_at?:string; price_cents?:number|null; preco?:string|number|null; image_url?:string|null; imageUrl?:string|null; descricao?:string|null; description?:string|null; notes?:string|null; midia?:string[]|null; media?:string[]|null; nascimento?:string|null; reserved_at?:string|null; sold_at?:string|null; customer_id?:string|null; video_url?:string|null; }

function StatusPill({ value }:{ value:string }){
	const map:Record<string,{label:string;className:string}>={
		disponivel:{ label:'Disponível', className:'bg-emerald-100 text-emerald-700 border-emerald-300'},
		reservado:{ label:'Reservado', className:'bg-amber-100 text-amber-700 border-amber-300'},
		vendido:{ label:'Vendido', className:'bg-zinc-800 text-white border-zinc-700'},
	};
	const meta = map[value] || { label:value, className:'bg-zinc-100 text-zinc-700 border-zinc-300'};
	return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium tracking-wide ${meta.className}`}>{meta.label}</span>;
}

export default function PuppiesAdmin(){
	const { push } = useToast();
	const [items,setItems]=useState<Puppy[]>([]);
	const [offline,setOffline]=useState(false);
	const [loading,setLoading]=useState(true);
	const [error,setError]=useState<string|null>(null);
	const [modal,setModal] = useState<{ mode:'delete'|'sell'|'edit'|null; puppy?:Puppy }>(()=>({mode:null}));
	const [pending,setPending] = useState(false);
	// Filtros / ordenação / paginação
	const [filterStatus,setFilterStatus] = useState<'all'|'disponivel'|'reservado'|'vendido'>('all');
	const [search,setSearch] = useState('');
	const [filterColor,setFilterColor] = useState<string>('all');
	const [priceMin,setPriceMin] = useState('');
	const [priceMax,setPriceMax] = useState('');
	const [sort,setSort] = useState<'created_desc'|'name_asc'|'name_desc'|'price_asc'|'price_desc'>('created_desc');
	const [page,setPage] = useState(1);
	const PAGE_SIZE = 25;

	async function loadItems(){
		try {
			setLoading(true);
			const r = await adminFetch('/api/admin/puppies');
			const j = await r.json();
			if(!r.ok && !Array.isArray(j?.items)) throw new Error(j?.error||'Falha');
			const arr = Array.isArray(j?.items)? j.items: [];
			setItems(arr as any);
			setOffline(!!j?.offline);
		}catch(e:any){ setError(String(e?.message||e)); }
		finally { setLoading(false); }
	}
	useEffect(()=>{ loadItems(); },[]);

	const colorOptions = useMemo(()=> ['all', ...Array.from(new Set(items.map(i=> i.color||i.cor).filter(Boolean))) as string[] ], [items]);
	const filtered = useMemo(()=>{
		let arr = items;
		if(filterStatus!=='all') arr = arr.filter(p=> p.status===filterStatus);
		if(filterColor!=='all') arr = arr.filter(p=> ((p.color||p.cor)||'').toLowerCase()===filterColor.toLowerCase());
		if(search.trim()){
			const s = search.trim().toLowerCase();
			arr = arr.filter(p=> ((p.name||p.nome)||'').toLowerCase().includes(s));
		}
		const min = priceMin? parseInt(priceMin.replace(/\D/g,''),10):null;
		const max = priceMax? parseInt(priceMax.replace(/\D/g,''),10):null;
		if(min!==null) arr = arr.filter(p=> (p.price_cents??0) >= min);
		if(max!==null) arr = arr.filter(p=> (p.price_cents??0) <= max);
		switch(sort){
			case 'name_asc': arr = [...arr].sort((a,b)=> ((a.name||a.nome)||'').localeCompare((b.name||b.nome)||'')); break;
			case 'name_desc': arr = [...arr].sort((a,b)=> ((b.name||b.nome)||'').localeCompare((a.name||a.nome)||'')); break;
			case 'price_asc': arr = [...arr].sort((a,b)=> (a.price_cents??0)-(b.price_cents??0)); break;
			case 'price_desc': arr = [...arr].sort((a,b)=> (b.price_cents??0)-(a.price_cents??0)); break;
			case 'created_desc': default: arr = [...arr].sort((a,b)=> new Date(b.created_at||'').getTime() - new Date(a.created_at||'').getTime());
		}
		return arr;
	},[items, filterStatus, filterColor, search, priceMin, priceMax, sort]);

	const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
	const pageClamped = Math.min(page, totalPages);
	const paginated = useMemo(()=> filtered.slice((pageClamped-1)*PAGE_SIZE, pageClamped*PAGE_SIZE), [filtered, pageClamped]);

	return (
		<AdminShell>
		<div className="p-6 space-y-4">
			<h1 className="text-2xl font-bold">Filhotes</h1>
			{offline && (
				<div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-[12px] text-amber-800 flex gap-2">
					<span className="font-semibold">Modo offline:</span>
					<span>Dados não persistidos (Supabase ausente). Cadastros aparecerão somente nesta sessão.</span>
				</div>
			)}
			{/* Toolbar de filtros */}
			<div className="flex flex-wrap gap-3 items-end">
				<div className="flex flex-col gap-1">
					<label className="text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">Status</label>
					<div className="flex gap-1 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-1">
						{['all','disponivel','reservado','vendido'].map(st=> (
							<button key={st} type="button" onClick={()=> setFilterStatus(st as any)} className={`px-2 py-1 rounded-md text-[11px] font-medium transition border ${filterStatus===st? 'bg-[var(--accent)] text-[var(--accent-contrast)] border-[var(--accent)]':'bg-transparent border-transparent hover:bg-[var(--surface)]'}`}>{st==='all'?'Todos': (st==='disponivel'?'Disponível': st.charAt(0).toUpperCase()+st.slice(1))}</button>
						))}
					</div>
				</div>
				<div className="flex flex-col gap-1 min-w-[220px]">
					<label className="text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">Busca</label>
					<input value={search} onChange={e=> setSearch(e.target.value)} placeholder="Buscar por nome" className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm" />
				</div>
				<div className="flex flex-col gap-1 min-w-[160px]">
					<label className="text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">Cor</label>
					<select value={filterColor} onChange={e=> { setFilterColor(e.target.value); setPage(1);} } className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-2 py-2 text-sm">
						{colorOptions.map(c=> <option key={c} value={c}>{c==='all'? 'Todas':c}</option>)}
					</select>
				</div>
				<div className="flex flex-col gap-1 w-[140px]">
					<label className="text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">Preço mín (¢)</label>
					<input value={priceMin} onChange={e=> { setPriceMin(e.target.value); setPage(1);} } placeholder="0" className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-2 py-2 text-sm" />
				</div>
				<div className="flex flex-col gap-1 w-[140px]">
					<label className="text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">Preço máx (¢)</label>
					<input value={priceMax} onChange={e=> { setPriceMax(e.target.value); setPage(1);} } placeholder="500000" className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-2 py-2 text-sm" />
				</div>
				<div className="flex flex-col gap-1 min-w-[180px]">
					<label className="text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">Ordenar</label>
					<select value={sort} onChange={e=> setSort(e.target.value as any)} className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-2 py-2 text-sm">
						<option value="created_desc">Recentes</option>
						<option value="name_asc">Nome A→Z</option>
						<option value="name_desc">Nome Z→A</option>
						<option value="price_asc">Preço ↑</option>
						<option value="price_desc">Preço ↓</option>
					</select>
				</div>
				<div className="ml-auto text-[11px] text-[var(--text-muted)]">Exibindo {filtered.length} / {items.length}</div>
			</div>
			{loading && <div>Carregando...</div>}
			{error && <div className="text-red-600 text-sm">{error}</div>}
			{!loading && !error && (
				<>
				<div className="mb-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
					<div className="flex items-start justify-between gap-4">
						<h2 className="text-sm font-semibold tracking-tight">Cadastrar novo filhote</h2>
						<span className="text-[11px] text-[var(--text-muted)]">Campos essenciais para vitrine e contrato.</span>
					</div>
					<PuppyForm onCreated={loadItems} colorPresets={COLOR_PRESETS} />
				</div>
				<table className="w-full text-sm border-collapse rounded-2xl overflow-hidden border border-[var(--border)] bg-[var(--surface)]" aria-describedby="puppies-desc">
					<caption id="puppies-desc" className="sr-only">Lista de filhotes com ações de editar, vender ou excluir</caption>
					<thead>
						<tr className="bg-zinc-100 text-left">
							<th className="p-2 border">Nome</th>
							<th className="p-2 border">Sexo</th>
							<th className="p-2 border">Status</th>
							<th className="p-2 border">Cor</th>
							<th className="p-2 border" />
						</tr>
					</thead>
					<tbody>
						{/* Paginação + janela */}
						{paginated.map(p=> {
							const displayName = p.name || p.nome || '—';
							const displayColor = p.color || p.cor || '—';
							return (
							<tr key={p.id} className="odd:bg-[var(--surface)] even:bg-[var(--surface-2)]">
								<td className="p-2 border">{displayName}</td>
								<td className="p-2 border capitalize">{p.gender||'—'}</td>
								<td className="p-2 border">{p.status? <StatusPill value={p.status} /> :'—'}</td>
								<td className="p-2 border">{displayColor}</td>
								<td className="p-2 border space-x-2">
									<button onClick={()=> setModal({ mode:'edit', puppy:p })} className="underline text-blue-700">Editar</button>
									<button onClick={()=> setModal({ mode:'delete', puppy:p })} className="text-red-600 underline">Excluir</button>
									<button onClick={()=> setModal({ mode:'sell', puppy:p })} className="text-emerald-700 underline">Vender</button>
								</td>
							</tr>
						);})}
						{filtered.length===0 && <tr><td className="p-3 text-center text-[var(--text-muted)]" colSpan={5}>Nenhum filhote.</td></tr>}
					</tbody>
				</table>
				{totalPages>1 && (
					<div className="mt-3 flex items-center justify-between gap-4 text-[11px]">
						<div>Página {pageClamped} de {totalPages}</div>
						<div className="flex gap-1">
							<button disabled={pageClamped===1} onClick={()=> setPage(p=> Math.max(1,p-1))} className="px-2 py-1 rounded border border-[var(--border)] disabled:opacity-40">‹</button>
							<button disabled={pageClamped===totalPages} onClick={()=> setPage(p=> Math.min(totalPages,p+1))} className="px-2 py-1 rounded border border-[var(--border)] disabled:opacity-40">›</button>
						</div>
					</div>
				)}
				</>
			)}
		</div>
		{/* Modais */}
		<Modal open={modal.mode==='delete'} onOpenChange={(o)=> !o && setModal({mode:null})} title="Excluir filhote" description={`Tem certeza que deseja excluir '${modal.puppy?.name||'sem nome'}'? Esta ação é irreversível.`} destructive footer={<>
			<button onClick={()=> setModal({mode:null})} className="inline-flex items-center rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm hover:bg-[var(--surface-2)]">Cancelar</button>
			<button disabled={pending} onClick={async()=>{ if(!modal.puppy) return; try{ setPending(true); const r= await adminFetch(`/api/admin/puppies?id=${modal.puppy.id}`,{ method:'DELETE' }); const j= await r.json(); if(!r.ok) throw new Error(j?.error||'Erro'); push({ type:'success', message:'Filhote excluído.' }); setItems(prev=> prev.filter(p=> p.id!==modal.puppy!.id)); setModal({mode:null}); }catch(e:any){ push({ type:'error', message:e?.message||'Erro ao excluir' }); } finally { setPending(false);} }} className="inline-flex items-center rounded-lg bg-[var(--error)] px-3 py-2 text-sm font-medium text-white hover:brightness-110 disabled:opacity-60">{pending? 'Excluindo...':'Excluir'}</button>
		</>}>
			<p className="text-[13px] text-[var(--text-muted)]">Essa remoção apagará permanentemente o registro.</p>
		</Modal>
		<Modal open={modal.mode==='sell'} onOpenChange={(o)=> !o && setModal({mode:null})} title="Registrar venda" description={`Marcar filhote '${modal.puppy?.name||'sem nome'}' como vendido.`}>
			<SellForm puppy={modal.puppy} onDone={(updated)=> { if(updated){ setItems(prev=> prev.map(p=> p.id===updated.id? {...p, status:'vendido'}:p)); } setModal({mode:null}); }} onCancel={()=> setModal({mode:null})} />
		</Modal>
		<Modal open={modal.mode==='edit'} onOpenChange={(o)=> !o && setModal({mode:null})} title="Editar filhote" description={`Atualizar dados de '${modal.puppy?.name||modal.puppy?.nome||'sem nome'}'.`}>
			{modal.puppy && <EditPuppyForm puppy={modal.puppy} onCancel={()=> setModal({mode:null})} onSaved={(updated)=> { setItems(prev=> prev.map(p=> p.id===updated.id? { ...p, ...updated }: p)); setModal({mode:null}); }} />}
		</Modal>
	</AdminShell>
	);
}

function SellForm({ puppy, onDone, onCancel }:{ puppy?:Puppy; onDone:(p?:Puppy)=>void; onCancel:()=>void }){
	const { push } = useToast();
	const [pending,setPending] = useState(false);
	return (
		<form onSubmit={async(e)=>{ e.preventDefault(); if(!puppy) return; const fd=new FormData(e.currentTarget); const payload={ puppy_id:puppy.id, client_name:fd.get('client_name'), client_phone:fd.get('client_phone'), client_email:fd.get('client_email') }; try{ setPending(true); const r= await adminFetch('/api/admin/puppies/sell',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)}); const j= await r.json(); if(!r.ok) throw new Error(j?.error||'Erro'); push({ type:'success', message:'Venda registrada.' }); onDone(puppy); }catch(err:any){ push({ type:'error', message: err?.message||'Erro ao vender'});} finally { setPending(false);} }} className="flex flex-col gap-2 text-sm w-full">
			<div className="grid grid-cols-2 gap-2 w-full">
				<input required name="client_name" placeholder="Cliente" className="col-span-2 rounded border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2" />
				<input name="client_phone" placeholder="WhatsApp" className="rounded border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2" />
				<input type="email" name="client_email" placeholder="Email" className="rounded border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2" />
			</div>
			<div className="flex flex-wrap justify-end gap-2 pt-2">
				<button type="button" onClick={onCancel} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 hover:bg-[var(--surface-2)]">Cancelar</button>
				<button disabled={pending} className="rounded-lg bg-[var(--accent)] px-3 py-2 font-medium text-[var(--accent-contrast)] hover:brightness-110 disabled:opacity-60">{pending? 'Salvando...':'Confirmar venda'}</button>
			</div>
		</form>
	);
}

const COLOR_PRESETS = ['Branco','Preto','Laranja','Creme','Chocolate','Parti','Merle','Fogo','Bege'];
const STATUS_PRESETS: Array<{value:'disponivel'|'reservado'|'vendido'; label:string; desc:string}> = [
	{ value:'disponivel', label:'Disponível', desc:'Visível para venda' },
	{ value:'reservado', label:'Reservado', desc:'Sinal recebido / aguardando' },
	{ value:'vendido', label:'Vendido', desc:'Contrato fechado' },
];


import type { RawPuppy } from '@/types/puppy';

function EditPuppyForm({ puppy, onSaved, onCancel }:{ puppy: Puppy; onSaved:(p: Puppy)=>void; onCancel:()=>void }){
	const recordForHook: RawPuppy = {
		id: puppy.id,
		codigo: puppy.codigo || undefined,
		nome: (puppy.nome ?? puppy.name) || undefined,
		gender: (puppy.gender === 'male' ? 'male' : 'female'),
		status: (['disponivel','reservado','vendido'].includes(puppy.status as any)? puppy.status as any : 'disponivel'),
		color: (puppy.color || (puppy as unknown as { cor?:string }).cor) || undefined,
		price_cents: (puppy.price_cents ?? 0),
		nascimento: puppy.nascimento || undefined,
		image_url: puppy.image_url || undefined,
		descricao: puppy.descricao || (puppy as unknown as { description?:string }).description || undefined,
		notes: puppy.notes || undefined,
		video_url: (puppy as unknown as { video_url?:string }).video_url || undefined,
		midia: puppy.midia || (puppy as unknown as { media?:string[] }).media || [],
	};
	const { values, set, setMedia, setCover, errors, submitting, submit, showSummary, setShowSummary, firstErrorRef, summaryRef, priceCents } = usePuppyForm({ mode:'edit', record: recordForHook, onSuccess: (resp)=> {
    // resp pode ter data atualizada; fallback para valores locais
    onSaved({ ...puppy, codigo: values.codigo||undefined, name: values.nome.trim(), gender: values.gender, status: values.status, color: values.color.trim(), price_cents: priceCents, image_url: values.image_url||null, descricao: values.descricao||null, notes: values.notes||null, nascimento: values.nascimento||null, video_url: values.video_url||null, midia: values.midia });
  }});
  return (
    <form onSubmit={(e)=>{ e.preventDefault(); submit(); }} className="grid gap-4 text-sm md:grid-cols-12">
      <div className="md:col-span-7 grid gap-4">
        <FormCard title="Básico" asFieldset>
          {showSummary && Object.keys(errors).length>0 && (
            <div ref={summaryRef} role="alert" aria-live="assertive" className="rounded-lg border border-[var(--error)] bg-[var(--error)]/10 p-3 text-[12px] text-[var(--error)]">
              <p className="font-semibold mb-1">Existem {Object.keys(errors).length} erro(s):</p>
              <ul className="list-disc pl-4 space-y-0.5">
                {Object.entries(errors).map(([k,v])=> <li key={k}><span className="font-medium">{k}</span>: {v}</li>)}
              </ul>
              <button type="button" onClick={()=> setShowSummary(false)} className="mt-2 inline-flex text-[11px] underline">Ocultar</button>
            </div>)}
          <div className="grid gap-3 md:grid-cols-3 md:gap-3">
            <div className="grid gap-1">
              <label htmlFor="edit-codigo" className="font-medium">Código</label>
              <input id="edit-codigo" value={values.codigo} onChange={e=> set('codigo', e.target.value.toUpperCase())} placeholder="Opcional" className="rounded-lg border px-3 py-2 bg-[var(--surface-2)] border-[var(--border)]" />
            </div>
            <div className="grid gap-1 md:col-span-2">
              <label htmlFor="edit-nome" className="font-medium">Nome <span className="text-[var(--error)]">*</span></label>
              <input ref={firstErrorRef} id="edit-nome" value={values.nome} onChange={e=> set('nome', e.target.value)} aria-invalid={!!errors.nome} className={`rounded-lg border px-3 py-2 bg-[var(--surface-2)] border-[var(--border)] ${errors.nome?'border-[var(--error)]':''}`} />
              {errors.nome && <p className="text-[11px] text-[var(--error)]">{errors.nome}</p>}
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-5 md:gap-3">
            <div className="grid gap-1 md:col-span-1">
              <label htmlFor="edit-gender" className="font-medium">Sexo</label>
              <select id="edit-gender" value={values.gender} onChange={e=> set('gender', e.target.value)} className="rounded-lg border px-3 py-2 bg-[var(--surface-2)] border-[var(--border)]"><option value="female">Fêmea</option><option value="male">Macho</option></select>
            </div>
            <div className="grid gap-1 md:col-span-2">
              <label className="font-medium" id="edit-status-label">Status</label>
              <StatusToggleGroup value={values.status} onChange={(v)=> set('status', v)} options={STATUS_PRESETS} />
            </div>
            <div className="md:col-span-2">
              <ColorSelector value={values.color} onChange={(v)=> set('color', v)} presets={COLOR_PRESETS} error={errors.color} required />
            </div>
            <div className="md:col-span-2">
              <PriceInputMasked value={values.price_display} onChange={(v)=> set('price_display', v)} error={errors.price_display} required />
            </div>
            <div className="grid gap-1 md:col-span-1">
              <label htmlFor="edit-nascimento" className="font-medium">Nascimento</label>
              <input id="edit-nascimento" type="date" value={values.nascimento} onChange={e=> set('nascimento', e.target.value)} className="rounded-lg border px-3 py-2 bg-[var(--surface-2)] border-[var(--border)]" />
            </div>
          </div>
        </FormCard>
        <FormCard title="Descrição" asFieldset>
          <div className="grid gap-1">
            <label htmlFor="edit-descricao" className="font-medium">Descrição</label>
            <textarea id="edit-descricao" value={values.descricao} onChange={e=> set('descricao', e.target.value)} rows={3} placeholder="Resumo público: temperamento, socialização..." className="resize-none rounded-lg border px-3 py-2 bg-[var(--surface-2)] border-[var(--border)]" />
            <p className="text-[11px] text-[var(--text-muted)]">Texto curto público (opcional).</p>
          </div>
          <div className="grid gap-1">
            <label htmlFor="edit-notes" className="font-medium">Notes (interno)</label>
            <textarea id="edit-notes" value={values.notes} onChange={e=> set('notes', e.target.value)} rows={2} placeholder="Anotações internas (não público)" className="resize-none rounded-lg border px-3 py-2 bg-[var(--surface-2)] border-[var(--border)]" />
            <p className="text-[11px] text-[var(--text-muted)]">Visível apenas no painel.</p>
          </div>
          <div className="grid gap-1">
            <label htmlFor="edit-video-url" className="font-medium">Vídeo (URL)</label>
            <input id="edit-video-url" value={values.video_url} onChange={e=> set('video_url', e.target.value)} placeholder="https://... (opcional)" aria-invalid={!!errors.video_url} className={`rounded-lg border px-3 py-2 bg-[var(--surface-2)] border-[var(--border)] ${errors.video_url?'border-[var(--error)]':''}`} />
            {errors.video_url && <p className="text-[11px] text-[var(--error)]">{errors.video_url}</p>}
          </div>
        </FormCard>
        <FormCard title="Ações" asFieldset>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onCancel} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 hover:bg-[var(--surface-2)]">Cancelar</button>
            <button disabled={submitting} className="rounded-lg bg-[var(--accent)] px-4 py-2 font-medium text-[var(--accent-contrast)] hover:brightness-110 disabled:opacity-60">{submitting? 'Salvando...':'Salvar alterações'}</button>
          </div>
        </FormCard>
      </div>
      <div className="md:col-span-5 grid gap-4">
        <FormCard title="Imagens" asFieldset>
          <CoverPreview value={values.image_url} onChange={(v)=> setCover(v)} />
          <MediaGallery media={values.midia} cover={values.image_url} onSelectCover={(u)=> setCover(u)} onChange={(m)=> setMedia(m)} />
        </FormCard>
      </div>
    </form>
  );
}

