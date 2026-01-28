"use client";

import { useRouter } from "next/navigation";

import { AdminPageLayout } from "../../components/AdminPageLayout";

import PuppyForm from "./PuppyForm";

type Props = {
 basePath: string;
};

export function PuppyCreateShell({ basePath }: Props) {
 const router = useRouter();

 return (
 <AdminPageLayout
 title="Cadastrar novo filhote"
 description="Preencha os campos que já existem no catálogo Supabase e mantenha a mídia organizada para publicação."
 secondaryActions={[
 <button
 key="back"
 type="button"
 onClick={() => router.push(basePath)}
 className="admin-btn admin-btn-secondary"
 >
 Voltar para lista
 </button>,
 ]}
 >
 <PuppyForm
 mode="create"
 onCompleted={() => {
 router.push(basePath);
 router.refresh();
 }}
 />
 </AdminPageLayout>
 );
}
