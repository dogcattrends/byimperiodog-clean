"use client";
import { useMemo, useRef, useState } from 'react';

import { useToast } from '@/components/ui/toast';
import { adminFetch } from '@/lib/adminFetch';
import { formatCentsToBRL, parseBRLToCents } from '@/lib/price';
import type { PuppyDTO, RawPuppy} from '@/types/puppy';
import { normalizePuppy } from '@/types/puppy';

type AnyPuppyInput = RawPuppy | (RawPuppy & { nome?: string|null; name?: string|null });

export interface UsePuppyFormOptions {
 mode: 'create' | 'edit';
 record?: AnyPuppyInput; // required para edit; aceita shape proveniente do backend
 onSuccess?: (data: unknown) => void;
}

export function usePuppyForm({ mode, record, onSuccess }: UsePuppyFormOptions){
 const isEdit = mode === 'edit';
 const { push } = useToast();
 const normalized: PuppyDTO | null = record ? normalizePuppy(record) : null;

 const [values, setValues] = useState(()=> {
 if(normalized){
 return {
 codigo: normalized.codigo || '',
 nome: String(normalized.nome ?? ''),
 gender: (String(normalized.gender ?? 'female') as 'female'|'male'),
 status: (String(normalized.status ?? 'disponivel') as 'disponivel'|'reservado'|'vendido'),
 color: String(normalized.color ?? ''),
 price_display: typeof normalized.price_cents === 'number' && normalized.price_cents > 0 ? formatCentsToBRL(normalized.price_cents) : '',
 nascimento: String(normalized.nascimento ?? ''),
 image_url: String(normalized.image_url ?? ''),
 descricao: String(normalized.descricao ?? ''),
 notes: String(normalized.notes ?? ''),
 video_url: String(normalized.video_url ?? ''),
 midia: Array.isArray(normalized.midia) ? normalized.midia.filter((u): u is string => typeof u === 'string' && u.length > 0) : ([] as string[]),
 };
 }
 return { codigo:'', nome:'', gender:'female' as 'female'|'male', status:'disponivel' as 'disponivel'|'reservado'|'vendido', color:'', price_display:'', nascimento:'', image_url:'', descricao:'', notes:'', video_url:'', midia:[] as string[] };
 });
 const [errors, setErrors] = useState<Record<string,string>>({});
 const [submitting, setSubmitting] = useState(false);
 const [showSummary, setShowSummary] = useState(false);
 const summaryRef = useRef<HTMLDivElement|null>(null);
 const firstErrorRef = useRef<HTMLInputElement|null>(null);

 const priceCents = useMemo(()=> parseBRLToCents(values.price_display), [values.price_display]);

 function set<K extends keyof typeof values>(k:K, v: unknown){ setValues(s=> ({ ...s, [k]: v as any })); }
 function setMedia(list:string[]){
 setValues(s=>{ let next = list; const cover = s.image_url || list[0]; if(cover){ next = [cover, ...list.filter(u=> u!==cover)]; } return { ...s, midia: next }; });
 }
 function setCover(url:string){
 setValues(s=> ({ ...s, image_url: url, midia: [url, ...s.midia.filter((m:string)=> m!==url)] }));
 }

 function validate(){
 const e:Record<string,string> = {};
 if(!values.nome.trim()) e.nome = 'Obrigatório';
 if(priceCents <= 0) e.price_display = '> 0';
 if(!values.color.trim()) e.color = 'Obrigatório';
 if(values.image_url && !/^https?:\/\//.test(values.image_url)) e.image_url = 'URL inválida';
 if(values.video_url && values.video_url.trim() && !/^https?:\/\//.test(values.video_url)) e.video_url = 'URL inválida';
 if(values.nascimento && !/^\d{4}-\d{2}-\d{2}$/.test(values.nascimento)) e.nascimento = 'AAAA-MM-DD';
 setErrors(e);
 return e;
 }

 async function submit(){
 const e = validate();
 if(Object.keys(e).length){
 setShowSummary(true);
 requestAnimationFrame(()=>{
 if(summaryRef.current){ summaryRef.current.scrollIntoView({ behavior:'smooth', block:'start' }); }
 if(e.nome && firstErrorRef.current){ firstErrorRef.current.focus(); }
 });
 push({ type:'error', message:'Corrija os campos.' });
 return;
 }
 try {
 setSubmitting(true);
 const payload: Record<string, unknown> = {
 codigo: values.codigo || undefined,
 nome: values.nome.trim(),
 gender: values.gender,
 status: values.status,
 color: values.color.trim(),
 price_cents: priceCents,
 nascimento: values.nascimento || null,
 image_url: values.image_url || null,
 descricao: values.descricao || null,
 notes: values.notes || null,
 video_url: values.video_url || null,
 midia: values.midia,
 };
 // Use the centralized manage endpoint for create/update operations
 const url = '/api/admin/puppies/manage';
 let method: 'POST'|'PUT' = 'POST';
 if(isEdit){ method='PUT'; payload.id = record?.id; }
 const r = await adminFetch(url,{ method, headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)});
 let j: any = null;
 // Be defensive: tests/mocks may return a plain object without headers/text helpers.
 const ct = r && r.headers && typeof r.headers.get === 'function' ? (r.headers.get('content-type') || '') : '';
 if (ct.includes('application/json') && typeof r.json === 'function') {
 j = await r.json().catch(() => null);
 } else if (typeof r.text === 'function') {
 const txt = await r.text().catch(() => null);
 j = txt ? { error: String(txt) } : null;
 } else if (typeof r.json === 'function') {
 // Fallback: if mock provides json() but no headers
 j = await r.json().catch(() => null);
 }
 if (!r.ok) throw new Error((j && (String(j.error || j.message))) || `Erro (${r.status})`);
 push({ type:'success', message: isEdit? 'Filhote atualizado.' : `Filhote cadastrado${values.codigo? ' (#'+values.codigo+')':''}.` });
 onSuccess && onSuccess(j);
 if(!isEdit){
 setValues({ codigo:'', nome:'', gender:'female', status:'disponivel', color:'', price_display:'', nascimento:'', image_url:'', descricao:'', notes:'', video_url:'', midia:[] });
 setErrors({});
 setShowSummary(false);
 }
 } catch(err: unknown){
 const message = err instanceof Error ? err.message : String(err ?? 'Erro ao salvar');
 push({ type:'error', message });
 }
 finally { setSubmitting(false); }
 }

 return {
 isEdit,
 values, set, setMedia, setCover,
 errors, submitting, submit, priceCents,
 showSummary, setShowSummary,
 firstErrorRef, summaryRef,
 };
}
