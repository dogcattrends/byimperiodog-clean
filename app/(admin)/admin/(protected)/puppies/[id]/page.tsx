"use client";
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { AdminShell } from '@/components/admin/AdminShell';

interface Puppy { id:string; name?:string|null; description?:string|null; gender?:string|null; status?:string|null; color?:string|null; created_at?:string; }

export default function PuppyDetail(){
	const params = useParams();
	const id = String(params?.id||'');
	const [data,setData]=useState<Puppy|null>(null);
	const [loading,setLoading]=useState(true);
	const [error,setError]=useState<string|null>(null);
	useEffect(()=>{ (async()=>{ try { const r = await fetch('/api/diag/puppies'); const j = await r.json(); const list: Puppy[] = Array.isArray(j)?j:j?.data||[]; setData(list.find(p=>String(p.id)===id)||null); } catch(e:any){ setError(String(e?.message||e)); } finally { setLoading(false); } })(); },[id]);
	return (
		<AdminShell>
		<div className="p-6 space-y-4">
			<Link href="/admin/puppies" className="text-sm underline">← Voltar</Link>
			{loading && <div>Carregando...</div>}
			{error && <div className="text-red-600 text-sm">{error}</div>}
			{(!loading && !error && !data) && <div className="text-sm">Filhote não encontrado.</div>}
			{data && (
				<div className="space-y-2">
					<h1 className="text-2xl font-bold">{data.name||'Sem nome'} <span className="text-sm font-normal text-zinc-500">#{data.id.slice(0,8)}</span></h1>
					<div className="text-sm text-zinc-600">Status: <strong>{data.status||'—'}</strong> • Sexo: <strong>{data.gender||'—'}</strong> • Cor: <strong>{data.color||'—'}</strong></div>
					{data.description && <p className="text-sm whitespace-pre-line">{data.description}</p>}
					<div className="text-xs text-zinc-500">Criado: {data.created_at? new Date(data.created_at).toLocaleString('pt-BR'):'—'}</div>
				</div>
			)}
		</div>
		</AdminShell>
	);
}

