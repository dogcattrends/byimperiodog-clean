import FAQBlock from "@/components/answer/FAQBlock";

export const revalidate = 0;

const OBRIGADO_SNIPPET =
 "Página de confirmação de interesse enviada para a By Império Dog. Reforça os canais oficiais, prazos de retorno e próximos passos para seguir com a reserva. Use esta tela para salvar as informações e aguardar o contato direto da equipe.";

const OBRIGADO_FAQ = [
 { question: "Quando serei contatado?", answer: "Em até 24h úteis pela equipe oficial." },
 { question: "Quais canais oficiais são usados?", answer: "WhatsApp e Instagram @byimperiodog." },
 { question: "Posso enviar uma nova mensagem?", answer: "Sim, use o WhatsApp informado para complementar seu pedido." },
];
export default function ObrigadoPage() {
 return (
 <main className="container mx-auto px-4 py-16">
 <h1 className="text-3xl font-bold">Obrigado! Recebemos seu interesse</h1>
 <p className="mt-3 text-muted-foreground">Em breve a By Império Dog entrará em contato para continuar seu atendimento.</p>
 <section className="mt-6 rounded-2xl border border-border bg-surface p-4">
 <h2 className="text-lg font-semibold">Resposta curta</h2>
 <p className="mt-2 text-sm text-muted-foreground">{OBRIGADO_SNIPPET}</p>
 </section>

 <FAQBlock items={OBRIGADO_FAQ} />

 <div className="mt-6 space-y-2 text-sm text-muted-foreground">
 <p>Prazo de contato: em até 24h úteis.</p>
 <p>Canais oficiais: WhatsApp e Instagram @byimperiodog.</p>
 <p>Fique de olho no seu WhatsApp para nossa mensagem inicial.</p>
 </div>
 <div className="mt-8">
 <a className="inline-block rounded bg-black px-4 py-2 text-white" href="/filhotes">Voltar aos filhotes</a>
 </div>
 </main>
 );
}


