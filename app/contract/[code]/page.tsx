import FAQBlock from "@/components/answer/FAQBlock";
import ContractForm from "@/components/ContractForm";

const CONTRACT_SNIPPET =
  "Esta pagina coleta os dados necessarios para formalizar o contrato do filhote. Informe seu codigo, revise os dados e envie os anexos solicitados. O objetivo e garantir que todas as informacoes estejam corretas antes da conclusao do processo. Se tiver duvidas, fale com a equipe antes de enviar.";

const CONTRACT_FAQ = [
  { question: "Para que serve o codigo?", answer: "Ele identifica sua reserva e libera o formulario correto." },
  { question: "Quais anexos sao exigidos?", answer: "Documentos solicitados no atendimento, como comprovante e dados basicos." },
  { question: "Posso corrigir dados depois?", answer: "Sim, avise a equipe caso precise ajustar informacoes." },
];

export default function ContractPage({ params }: { params: { code: string }}) {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Dados para Contrato</h1>
      <p className="text-sm text-zinc-600 mb-6">Insira seus dados e anexos. Código: <strong>{params.code}</strong></p>
      <section className="mb-6 rounded-2xl border border-zinc-200 bg-white p-4">
        <h2 className="text-lg font-semibold">Resposta curta</h2>
        <p className="mt-2 text-sm text-zinc-600">{CONTRACT_SNIPPET}</p>
      </section>

      <FAQBlock items={CONTRACT_FAQ} />

      <ContractForm code={params.code} />
    </div>
  );
}




