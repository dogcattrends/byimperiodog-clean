"use client";
// Página de Configuração (placeholder)
// TODO: Restaurar formulário completo original se existia; atualmente só mostra algumas variáveis expostas.
import React from 'react';
import { AdminShell } from '@/components/admin/AdminShell';

const safeEnv = {
	GA4: process.env.NEXT_PUBLIC_GA4_ID || '—',
	ADS: process.env.NEXT_PUBLIC_ADS_ID || '—',
};

export default function AdminConfig(){
	return (
		<AdminShell>
		<div className="p-6 space-y-4 max-w-2xl">
			<h1 className="text-2xl font-bold">Configuração</h1>
			<p className="text-sm text-zinc-600">Versão mínima — exibe variáveis públicas atuais.</p>
			<div className="rounded border bg-white divide-y">
				{Object.entries(safeEnv).map(([k,v])=> (
					<div key={k} className="p-3 flex justify-between gap-4 text-sm">
						<span className="font-medium">{k}</span>
						<span className="text-zinc-600 break-all">{v}</span>
					</div>
				))}
			</div>
			<p className="text-xs text-zinc-500">Para alterar valores, ajuste variáveis de ambiente e faça novo deploy.</p>
	</div>
	</AdminShell>
	);
}

