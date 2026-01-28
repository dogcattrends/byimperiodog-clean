import FAQBlock from "@/components/answer/FAQBlock";
import ContractForm from "@/components/ContractForm";

const CONTRACT_SNIPPET =
 "Esta página coleta os dados necessários para formalizar o contrato do filhote. Informe seu código, revise os dados e envie os anexos solicitados. O objetivo é garantir que todas as informações estejam corretas antes da conclusão do processo. Se tiver dúvidas, fale com a equipe antes de enviar.";

const CONTRACT_FAQ = [
 { question: "Para que serve o código?", answer: "Ele identifica sua reserva e libera o formulário correto." },
 { question: "Quais anexos são exigidos?", answer: "Documentos solicitados no atendimento, como comprovante e dados básicos." },
 { question: "Posso corrigir dados depois?", answer: "Sim, avise a equipe caso precise ajustar informações." },
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




