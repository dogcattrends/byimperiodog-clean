import Link from "next/link";

type Entry = { term: string; definition: string; href?: string };

const DEFAULT_ENTRIES: Entry[] = [
  { term: "Socialização", definition: "Processo de acostumar o filhote a pessoas e outros animais.", href: "/guia" },
  { term: "Pedigree", definition: "Documento que atesta a linhagem do filhote.", href: "/sobre" },
  { term: "Vacinação", definition: "Plano básico de vacinas para filhotes.", href: "/guia" },
];

export default function Glossary({ entries }: { entries?: Entry[] | null }) {
  const list = entries && entries.length ? entries : DEFAULT_ENTRIES;
  return (
    <aside aria-labelledby="glossary-heading" className="prose my-6">
      <h3 id="glossary-heading" className="text-sm font-semibold">Glossário rápido</h3>
      <dl className="mt-2 space-y-2 text-sm">
        {list.map((e, i) => (
          <div key={i}>
            <dt className="font-medium">{e.term}</dt>
            <dd className="text-gray-700">{e.definition} {e.href && <Link href={e.href} className="text-primary-600 underline">Ler mais</Link>}</dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}
