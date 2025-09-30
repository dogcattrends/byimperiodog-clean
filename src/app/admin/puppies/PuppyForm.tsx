// PATH: src/app/admin/puppies/PuppyForm.tsx
"use client";
import React from "react";
import FormCard from "@/components/ui/FormCard";
import StatusToggle from "@/components/puppies/StatusToggle";
import ColorChips from "@/components/puppies/ColorChips";
import PriceInput from "@/components/puppies/PriceInput";
import CoverPreview from "@/components/puppies/CoverPreview";
import MediaGallery from "@/components/puppies/MediaGallery";
import { usePuppyForm } from "@/components/puppies/usePuppyForm";

interface PuppyFormProps { onCreated: () => void; colorPresets?: string[]; }

const DEFAULT_COLORS = ["Branco","Preto","Laranja","Creme","Chocolate","Parti","Merle","Fogo","Bege"];

export default function PuppyForm({ onCreated, colorPresets = DEFAULT_COLORS }: PuppyFormProps) {
  const { values, set, setMedia, setCover, errors, submitting, submit, priceCents, showSummary, setShowSummary, firstErrorRef, summaryRef } = usePuppyForm({ mode:'create', onSuccess: ()=> onCreated() });

  return (
    <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="mt-4 grid gap-4 md:grid-cols-12 text-sm">
      {/* (A) Informações básicas */}
      <div className="md:col-span-7 grid gap-4">
        <FormCard title="Informações básicas" subtitle="Identificação, status e preço" asFieldset>
          {showSummary && Object.keys(errors).length>0 && (
            <div ref={summaryRef} role="alert" aria-live="assertive" className="mb-3 rounded-lg border border-[var(--error)] bg-[var(--error)]/10 p-3 text-[12px] text-[var(--error)]">
              <p className="font-semibold mb-1">Existem {Object.keys(errors).length} erro(s):</p>
              <ul className="list-disc pl-4 space-y-0.5">
                {Object.entries(errors).map(([k,v])=> <li key={k}><span className="font-medium">{k}</span>: {v}</li>)}
              </ul>
              <button type="button" onClick={()=> setShowSummary(false)} className="mt-2 inline-flex text-[11px] underline">Ocultar</button>
            </div>
          )}
          <div className="grid gap-3 md:grid-cols-3 md:gap-3">
            <div className="grid gap-1">
              <label className="font-medium" htmlFor="codigo">Código</label>
              <input id="codigo" value={values.codigo} onChange={e => set('codigo', e.target.value.toUpperCase())} placeholder="Opcional" className="rounded-lg border px-3 py-2 bg-[var(--surface-2)] border-[var(--border)]" />
            </div>
            <div className="grid gap-1 md:col-span-2" aria-live="polite">
              <label className="font-medium" htmlFor="nome">Nome <span className="text-[var(--error)]">*</span></label>
              <input ref={firstErrorRef} id="nome" value={values.nome} onChange={e => set('nome', e.target.value)} placeholder="Ex: Spitz Alemão" aria-invalid={!!errors.nome} aria-required="true" aria-describedby={errors.nome ? 'nome-error' : undefined} className={`rounded-lg border px-3 py-2 bg-[var(--surface-2)] border-[var(--border)] focus:ring-2 focus:ring-[var(--accent)] ${errors.nome ? 'border-[var(--error)]' : ''}`} />
              {errors.nome && <p id="nome-error" className="text-[11px] text-[var(--error)]">{errors.nome}</p>}
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-5 md:gap-3">
            <div className="grid gap-1 md:col-span-1">
              <label htmlFor="gender" className="font-medium">Sexo</label>
              <select id="gender" value={values.gender} onChange={e => set('gender', e.target.value)} className="rounded-lg border px-3 py-2 bg-[var(--surface-2)] border-[var(--border)]"><option value="female">Fêmea</option><option value="male">Macho</option></select>
            </div>
            <div className="grid gap-1 md:col-span-2">
              <label className="font-medium" id="status-label">Status</label>
              <StatusToggle value={values.status} onChange={(v) => set('status', v)} />
            </div>
            <div className="md:col-span-2" aria-live="polite">
              <ColorChips value={values.color} options={colorPresets} onChange={(v) => set('color', v)} />
              {errors.color && <p className="text-[11px] text-[var(--error)]">{errors.color}</p>}
            </div>
            <div className="md:col-span-2">
              <PriceInput value={values.price_display} onChange={(v) => set('price_display', v)} error={errors.price_display} />
            </div>
            <div className="grid gap-1 md:col-span-1">
              <label htmlFor="nascimento" className="font-medium">Nascimento</label>
              <input id="nascimento" type="date" value={values.nascimento} onChange={e => set('nascimento', e.target.value)} className="rounded-lg border px-3 py-2 bg-[var(--surface-2)] border-[var(--border)]" />
            </div>
          </div>
        </FormCard>

        {/* (C) Descrição + Notes */}
        <FormCard title="Descrição" asFieldset>
          <div className="grid gap-1">
            <label htmlFor="descricao" className="font-medium">Descrição</label>
            <textarea id="descricao" value={values.descricao} onChange={e => set('descricao', e.target.value)} rows={3} placeholder="Resumo público: temperamento, socialização..." className="resize-none rounded-lg border px-3 py-2 bg-[var(--surface-2)] border-[var(--border)]" />
            <p className="text-[11px] text-[var(--text-muted)]">Texto curto público (opcional).</p>
          </div>
          <div className="grid gap-1">
            <label htmlFor="notes" className="font-medium">Notes (interno)</label>
            <textarea id="notes" value={values.notes} onChange={e => set('notes', e.target.value)} rows={2} placeholder="Anotações internas (não público)" className="resize-none rounded-lg border px-3 py-2 bg-[var(--surface-2)] border-[var(--border)]" />
            <p className="text-[11px] text-[var(--text-muted)]">Visível apenas no painel.</p>
          </div>
        </FormCard>

        {/* (D) Ações */}
        <FormCard title="Ações" asFieldset>
          <div className="flex justify-end gap-2">
            <button type="reset" onClick={() => { /* reset é tratado no hook ao sucesso; para reset manual: */ location.reload(); }} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 hover:bg-[var(--surface-2)]">Limpar</button>
            <button disabled={submitting} className="rounded-lg bg-[var(--accent)] px-4 py-2 font-medium text-[var(--accent-contrast)] hover:brightness-110 disabled:opacity-60">{submitting ? 'Salvando...' : 'Salvar'}</button>
          </div>
        </FormCard>
      </div>

      {/* (B) Imagens */}
      <div className="md:col-span-5 grid gap-4">
        <FormCard title="Imagens" asFieldset>
          <CoverPreview url={values.image_url} onChange={(v) => setCover(v)} />
          <MediaGallery media={values.midia} cover={values.image_url} onSelectCover={(u)=> setCover(u)} onChange={(m)=> setMedia(m)} />
          <p className="text-[11px] text-[var(--text-muted)]">Suporte: drag-and-drop, reordenar, definir capa. Uploads via /api/admin/puppies/upload.</p>
        </FormCard>
      </div>
    </form>
  );
}

