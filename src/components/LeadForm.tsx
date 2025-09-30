'use client';
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const schema = z.object({
  nome: z.string().min(2),
  telefone: z.string().min(8),
  cidade: z.string().min(2),
  preferencia: z.string().optional(),
  mensagem: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function LeadForm() {
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormValues>({
    resolver: zodResolver(schema)
  });

  const onSubmit = async (data: FormValues) => {
    await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    alert("Recebemos seu contato! Em instantes falamos com você pelo WhatsApp.");
    reset();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 mt-4">
      <input {...register("nome")} placeholder="Seu nome" className="w-full border rounded-lg px-3 py-2"/>
      {errors.nome && <p className="text-red-600 text-sm">Informe seu nome</p>}
      <input {...register("telefone")} placeholder="WhatsApp" className="w-full border rounded-lg px-3 py-2"/>
      <input {...register("cidade")} placeholder="Cidade/UF" className="w-full border rounded-lg px-3 py-2"/>
      <input {...register("preferencia")} placeholder="Prefere macho ou fêmea? Cor?" className="w-full border rounded-lg px-3 py-2"/>
      <textarea {...register("mensagem")} placeholder="Sua mensagem (opcional)" className="w-full border rounded-lg px-3 py-2" rows={4} />
      <button disabled={isSubmitting} className="btn-primary">{isSubmitting ? "Enviando..." : "Enviar"}</button>
    </form>
  );
}
