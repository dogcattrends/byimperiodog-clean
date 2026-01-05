import SeoJsonLd from "@/components/SeoJsonLd";
import { buildFAQPageLD } from "@/lib/schema";

export type FAQItem = { question: string; answer: string };

export default function FAQBlock({ items }: { items?: FAQItem[] | null }) {
  const faqs = Array.isArray(items) ? items.filter((f) => f?.question && f?.answer) : [];
  if (!faqs.length) return null;

  return (
    <section aria-labelledby="faq-heading" className="prose my-6">
      <h2 id="faq-heading" className="text-lg font-semibold">Perguntas frequentes</h2>
      <div className="mt-3 space-y-2">
        {faqs.map((f, i) => (
          <details
            key={i}
            className="bg-gray-50 p-3 rounded"
            data-geo-faq
            data-geo-question={f.question}
          >
            <summary className="font-medium cursor-pointer">{f.question}</summary>
            <div className="mt-2 text-sm">{f.answer}</div>
          </details>
        ))}
      </div>

      {/* Emitir FAQPage JSON-LD apenas quando houver 3 ou mais itens válidos */}
      {faqs.length >= 3 && <SeoJsonLd data={buildFAQPageLD(faqs)} />}
    </section>
  );
}
