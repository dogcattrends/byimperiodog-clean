import type { BlogPost } from "@/lib/blog";
import Link from "next/link";

// Simple, dependency-free blog content using JSX.
// To add a new post: copy one of the objects below and adjust fields.

export const posts: BlogPost[] = [
  {
    slug: "como-cuidar-do-seu-spitz-alemao-anao",
    title: "Como cuidar do seu Spitz Alemão Anão",
    subtitle: "Dicas práticas para os primeiros meses",
    excerpt:
      "Guia rápido e carinhoso para alimentação, higiene, vacinas e rotina do seu Spitz Alemão Anão (Lulu da Pomerânia).",
    coverUrl: "/spitz-hero-desktop.webp",
    publishedAt: "2024-08-20T08:00:00.000Z",
    updatedAt: "2024-08-20T08:00:00.000Z",
    author: { name: "Equipe By Império Dog" },
    tags: ["cuidados", "spitz", "filhote"],
    seo: {
      title: "Como cuidar do seu Spitz Alemão Anão | Dicas essenciais",
      description:
        "Alimentação, higiene, vacinas e rotina: tudo que você precisa para os primeiros meses do seu Spitz Alemão Anão.",
      ogImage: "/spitz-hero-desktop.webp",
    },
    Content: function Content() {
      return (
        <article className="max-w-none text-zinc-800">
          <p>
            O Spitz Alemão Anão (também chamado de Lulu da Pomerânia) é um companheiro
            carinhoso e esperto. Nos primeiros meses, uma rotina simples e consistente
            ajuda muito na adaptação.
          </p>
          <h2>Alimentação</h2>
          <ul>
            <li>Ofereça ração de qualidade, específica para filhotes.</li>
            <li>Divida em 3 a 4 pequenas refeições diárias.</li>
            <li>Água fresca sempre disponível.</li>
          </ul>
          <h2>Higiene e escovação</h2>
          <p>
            Escove os pelos de 2 a 3 vezes por semana para evitar nós e manter o brilho.
            Banhos podem ser quinzenais, sempre com produtos próprios para pets.
          </p>
          <h2>Vacinas e vermífugos</h2>
          <p>
            Siga o protocolo recomendado pelo veterinário e mantenha a carteirinha em dia.
            Vermifugação e antipulgas/anticarrapatos são essenciais para a saúde.
          </p>
          <h2>Rotina e enriquecimento</h2>
          <p>
            Passeios curtos, brinquedos interativos e reforço positivo ajudam no gasto de energia
            e no bem-estar mental. Lembre-se: estímulo com carinho vale ouro.
          </p>
          <p>
            Quer ver nossos filhotes disponíveis? Visite a página de{' '}
            <Link href="/filhotes">Filhotes</Link>.
          </p>
        </article>
      );
    },
  },
  {
    slug: "spitz-alemao-anao-personalidade-e-convivio",
    title: "Spitz Alemão Anão: personalidade e convívio",
    excerpt:
      "Temperamento, socialização e dicas para conviver bem com crianças, idosos e outros pets.",
    coverUrl: "/spitz-hero-mobile.png",
    publishedAt: "2024-07-10T08:00:00.000Z",
    author: { name: "Equipe By Império Dog" },
    tags: ["personalidade", "convivio"],
    Content: function Content() {
      return (
        <article className="max-w-none text-zinc-800">
          <p>
            O Spitz é alegre, atento e muito apegado à família. Com socialização adequada,
            convive super bem com crianças e outros animais.
          </p>
          <h2>Personalidade</h2>
          <p>
            São dóceis, curiosos e comunicativos. Reforço positivo e paciência são a chave para
            um filhote confiante.
          </p>
          <h2>Convívio com a família</h2>
          <p>
            Adoram participar da rotina e estar por perto. Estabelecer horários para alimentação,
            sonecas e brincadeiras ajuda bastante.
          </p>
        </article>
      );
    },
  },
];

export default posts;

