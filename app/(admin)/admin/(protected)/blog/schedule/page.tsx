"use client";
// Agenda de Publicações (mínimo funcional)
// Usa endpoints: /api/admin/blog/schedule/events (GET/POST) e /api/admin/blog/schedule/run-due (POST)
// TODO: Restaurar UI original rica (calendário completo) se necessário.
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminShell } from '@/components/admin/AdminShell';
import { BlogSubnav } from '@/components/admin/BlogSubnav';
import ReindexEmbeddingsButton from '@/components/admin/ReindexEmbeddingsButton';

interface ScheduleEvent { id:string; post_id:string; run_at:string; action:string; executed_at?:string|null; }

export default function BlogSchedulePage(){
	const [month,setMonth]=useState(()=> new Date().toISOString().slice(0,7)); // YYYY-MM
	const [events,setEvents]=useState<ScheduleEvent[]>([]);
	const [loading,setLoading]=useState(false);
	const [message,setMessage]=useState<string|null>(null);

	async function load(){
		try { setLoading(true); setMessage(null); const res= await fetch(`/api/admin/blog/schedule/events?month=${month}`); const json= await res.json(); if(!res.ok) throw new Error(json?.error||'Erro'); setEvents(Array.isArray(json)?json:json?.data||[]); } catch(e:any){ setMessage(String(e?.message||e)); } finally { setLoading(false); }
	}

	useEffect(()=>{ load(); // eslint-disable-next-line react-hooks/exhaustive-deps
	},[month]);

	async function create(ev: { post_id:string; run_at:string; action:string }){
		try { setLoading(true); const res = await fetch('/api/admin/blog/schedule/events',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(ev)}); const json = await res.json(); if(!res.ok) throw new Error(json?.error||'Falha ao criar'); setMessage('Evento criado'); load(); } catch(e:any){ setMessage(String(e?.message||e)); } finally { setLoading(false); }
	}

	async function runDue(){
		try { setLoading(true); const res = await fetch('/api/admin/blog/schedule/run-due',{ method:'POST'}); const json = await res.json(); if(!res.ok) throw new Error(json?.error||'Falha'); setMessage('Execução disparada'); load(); } catch(e:any){ setMessage(String(e?.message||e)); } finally { setLoading(false); }
	}

	return (
		<AdminShell>
			<BlogSubnav />
			<div className="p-6 space-y-6">
				<header className="space-y-2">
					<div className="flex items-center justify-between gap-3">
						<h1 className="text-2xl font-bold">Agenda de Publicações</h1>
						<ReindexEmbeddingsButton />
					</div>
					<p className="text-sm text-zinc-600">Gerencie execuções (publish) de posts agendados. Versão reduzida.</p>
				</header>
				<div className="flex flex-wrap gap-3 items-end">
					<label className="text-sm">Mês
						<input type="month" value={month} onChange={e=>setMonth(e.target.value)} className="ml-2 rounded border px-2 py-1" />
					</label>
					<button onClick={load} disabled={loading} className="rounded border px-3 py-1 text-sm disabled:opacity-50">Atualizar</button>
					<button onClick={runDue} disabled={loading} className="rounded border px-3 py-1 text-sm disabled:opacity-50 bg-emerald-50 text-emerald-700">Executar vencidos</button>
				</div>
				<NewEventForm onCreate={create} loading={loading} />
				{message && <div className="text-sm" role="status">{message}</div>}
				<table className="w-full text-sm border-collapse">
					<thead>
						<tr className="bg-zinc-100 text-left">
							<th className="p-2 border">Post</th>
							<th className="p-2 border">Executar em</th>
							<th className="p-2 border">Ação</th>
							<th className="p-2 border">Executado</th>
						</tr>
					</thead>
					<tbody>
						{events.map(ev=> (
							<tr key={ev.id} className="odd:bg-white even:bg-zinc-50">
								<td className="p-2 border"><Link className="underline" href={`/admin/blog/editor?id=${ev.post_id}`}>{ev.post_id.slice(0,6)}</Link></td>
								<td className="p-2 border whitespace-nowrap">{new Date(ev.run_at).toLocaleString('pt-BR')}</td>
								<td className="p-2 border">{ev.action}</td>
								<td className="p-2 border whitespace-nowrap">{ev.executed_at? new Date(ev.executed_at).toLocaleString('pt-BR') : '—'}</td>
						</tr>
					))}
					{events.length===0 && <tr><td colSpan={4} className="p-3 text-center text-zinc-500">Nenhum evento.</td></tr>}
				</tbody>
				</table>
			</div>
		</AdminShell>
	);
}

function NewEventForm({ onCreate, loading }:{ onCreate:(ev:{post_id:string; run_at:string; action:string})=>void; loading:boolean }){
	const [postId,setPostId]=useState('');
	const [runAt,setRunAt]=useState('');
	const [action,setAction]=useState('publish');
	return (
		<form onSubmit={e=>{ e.preventDefault(); if(!postId||!runAt) return; onCreate({ post_id:postId, run_at:runAt, action }); setPostId(''); }} className="flex flex-wrap gap-2 items-end bg-white border rounded p-3">
			<div className="flex flex-col">
				<label className="text-xs">Post ID</label>
				<input value={postId} onChange={e=>setPostId(e.target.value)} className="rounded border px-2 py-1 text-sm" placeholder="id" required />
			</div>
			<div className="flex flex-col">
				<label className="text-xs">Executar em</label>
				<input type="datetime-local" value={runAt} onChange={e=>setRunAt(e.target.value)} className="rounded border px-2 py-1 text-sm" required />
			</div>
			<div className="flex flex-col">
				<label className="text-xs">Ação</label>
				<select value={action} onChange={e=>setAction(e.target.value)} className="rounded border px-2 py-1 text-sm">
					<option value="publish">Publicar</option>
				</select>
			</div>
			<button disabled={loading} className="rounded border px-3 py-1 text-sm disabled:opacity-50">Agendar</button>
		</form>
	);
}

