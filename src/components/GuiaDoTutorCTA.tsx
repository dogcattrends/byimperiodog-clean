"use client";
import { BookOpen, Download } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

// Componente CTA para baixar o Guia do Tutor
// O download só é liberado após o preenchimento do formulário de lead
export default function GuiaDoTutorCTA({ className = "" }: { className?: string }) {
  const router = useRouter();

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    // Redireciona para a página do formulário do guia
    router.push("/guia");
  }, [router]);

  return (
    <div className={`rounded-2xl border border-emerald-200 bg-white p-6 shadow-md flex flex-col items-center gap-3 ${className}`}>
      <div className="flex items-center gap-2 mb-1">
        <BookOpen className="w-6 h-6 text-emerald-700" aria-hidden />
        <h3 className="text-lg font-bold text-emerald-900 text-center">Baixe o Guia do Tutor</h3>
      </div>
      <p className="text-sm text-zinc-600 text-center max-w-md">
        Dicas essenciais para quem quer um Spitz Alemão Anão saudável, feliz e bem adaptado.<br />
        O download é liberado após preencher um breve formulário.
      </p>
      <button
        onClick={handleClick}
        className="mt-2 inline-flex items-center justify-center rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        aria-label="Baixar Guia do Tutor"
      >
        <Download className="w-4 h-4 mr-2" aria-hidden />
        Baixar Guia do Tutor (PDF)
      </button>
    </div>
  );
}
