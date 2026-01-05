import Link from "next/link";

type Props = {
  /** Texto curto (2-4 linhas). Pode conter quebras. */
  text?: string | null;
  /** Pequena etiqueta de confiança, opcional */
  trustLabel?: string | null;
  /** Link interno sugerido (ex: guia, filhotes) */
  ctaHref?: string | null;
  ctaLabel?: string | null;
};

export default function AnswerBlock({ text, trustLabel, ctaHref, ctaLabel }: Props) {
  if (!text) return null;

  return (
    <section aria-labelledby="quick-answer-heading" className="prose my-6">
      <h2 id="quick-answer-heading" className="text-lg font-semibold">Resposta rápida</h2>
      <div className="mt-2 text-sm leading-snug">{text.split('\n').slice(0, 4).map((line, i) => (
        <p key={i}>{line}</p>
      ))}</div>
      {(trustLabel || (ctaHref && ctaLabel)) && (
        <div className="mt-3 flex items-center gap-4 text-xs">
          {trustLabel && <span className="text-gray-600">{trustLabel}</span>}
          {ctaHref && ctaLabel && (
            <Link href={ctaHref} className="text-primary-600 underline">{ctaLabel}</Link>
          )}
        </div>
      )}
    </section>
  );
}
