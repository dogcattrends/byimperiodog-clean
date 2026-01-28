"use client";

import { Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import type { ComponentProps } from "react";
import { useEffect, useState } from "react";

import { adminFetch } from "@/lib/adminFetch";
import type { RawPuppy } from "@/types/puppy";

import { AdminPageLayout } from "../../components/AdminPageLayout";
import { AdminErrorState } from "../../ui/AdminErrorState";

import PuppyForm from "./PuppyForm";

type Props = {
 basePath: string;
};

export function PuppyEditShell({ basePath }: Props) {
 const params = useParams<{ id: string }>();
 const router = useRouter();

 const idParam = Array.isArray(params?.id) ? params.id[0] : params?.id;

 const [loading, setLoading] = useState(true);
 const [record, setRecord] = useState<ComponentProps<typeof PuppyForm>["record"]>(null);
 const [error, setError] = useState<string | null>(null);

 useEffect(() => {
 if (!idParam) return;
 let mounted = true;
 async function load() {
 try {
 setLoading(true);
 const response = await adminFetch(`/api/admin/puppies?id=${idParam}`);
 const json = await response.json();
 if (!mounted) return;
 if (!response.ok) throw new Error(json?.error || "Falha ao carregar filhote");
 const found = json?.puppy as RawPuppy | undefined;
 if (!found) setError("Filhote não encontrado.");
 else {
 const normalized: RawPuppy = { ...found, slug: found.slug ?? "" };
 setRecord(normalized as ComponentProps<typeof PuppyForm>["record"]);
 }
 } catch (err) {
 const message = err instanceof Error ? err.message : String(err);
 setError(message);
 } finally {
 if (mounted) setLoading(false);
 }
 }
 load();
 return () => {
 mounted = false;
 };
 }, [idParam]);

 const renderBackButton = (key: string) => (
 <button
 key={key}
 type="button"
 onClick={() => router.push(basePath)}
 className="admin-btn admin-btn-secondary"
 >
 Voltar para lista
 </button>
 );

 return (
 <AdminPageLayout
 title="Editar filhote"
 description="Atualize informações, preço, status e mídias mantendo a base sincronizada com o Supabase."
 secondaryActions={[renderBackButton("secondary")]}
 >
 {loading ? (
 <div className="admin-glass-card px-4 py-10 text-center text-sm admin-text-muted">
 <Loader2 className="mx-auto h-5 w-5 animate-spin" aria-hidden />
 <span className="mt-2 block">Carregando dados...</span>
 </div>
 ) : error ? (
 <AdminErrorState title="Não foi possível carregar" message={error} actionHref={basePath} actionLabel="Voltar para lista" />
 ) : record ? (
 <PuppyForm
 mode="edit"
 record={record}
 onCompleted={() => {
 router.replace(basePath);
 setTimeout(() => {
 router.refresh();
 }, 0);
 }}
 />
 ) : null}
 </AdminPageLayout>
 );
}
