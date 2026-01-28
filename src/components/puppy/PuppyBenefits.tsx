/**
 * PuppyBenefits v2.0 - Design System Refactor
 * Lista de benefÃ­cios e diferenciais do criador
 * UX: Visual claro com Ã­cones, hierarquia de informaÃ§Ã£o
 * A11y: Lista semÃ¢ntica, Ã­cones decorativos
 * 
 * Migrado para usar componentes do Design System:
 * - Card para cada benefÃ­cio
 */

import { Award, Heart, Shield, Sparkles, Stethoscope, Video } from "lucide-react";

import { Card, CardContent } from "@/components/ui";

export function PuppyBenefits() {
 const benefits = [
 {
 icon: Stethoscope,
 title: "Acompanhamento veterinÃ¡rio completo",
 description: "Exames genÃ©ticos, cardiolÃ³gicos e protocolo de vacinaÃ§Ã£o com laudos digitais.",
 },
 {
 icon: Heart,
 title: "SocializaÃ§Ã£o guiada desde o nascimento",
 description: "ExposiÃ§Ã£o controlada a estÃ­mulos, pessoas e ambientes para filhote equilibrado.",
 },
 {
 icon: Sparkles,
 title: "Mentoria vitalÃ­cia para tutores",
 description: "Suporte contÃ­nuo via WhatsApp com orientaÃ§Ãµes sobre rotina, nutriÃ§Ã£o e comportamento.",
 },
 {
 icon: Shield,
 title: "Garantia de saÃºde e procedÃªncia",
 description: "Contrato detalhado, pedigree Pedigree e rastreabilidade completa da linhagem.",
 },
 {
 icon: Video,
 title: "Chamadas de vÃ­deo antes da adoÃ§Ã£o",
 description: "ConheÃ§a o filhote, veja sua personalidade e tire todas as dÃºvidas online.",
 },
 {
 icon: Award,
 title: "Entrega segura e humanizada",
 description: "Transporte especializado ou retirada presencial com orientaÃ§Ã£o completa.",
 },
 ];

 return (
 <section aria-labelledby="benefits-heading" className="space-y-6">
 <div>
 <h2 id="benefits-heading" className="text-2xl font-bold text-zinc-900">
 O que vocÃª recebe
 </h2>
 <p className="mt-2 text-base text-zinc-600">
 Muito mais que um filhote: um processo completo pensado para famílias responsáveis
 </p>
 </div>

 <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
 {benefits.map((benefit, index) => {
 const Icon = benefit.icon;
 return (
 <li key={index}>
 <Card 
 variant="outline" 
 interactive
 className="h-full overflow-hidden transition hover:border-emerald-200"
 >
 <CardContent className="p-5">
 <div className="flex items-start gap-4">
 <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-emerald-50 transition group-hover:bg-emerald-100">
 <Icon className="h-6 w-6 text-emerald-600" aria-hidden="true" />
 </div>
 <div className="min-w-0 flex-1">
 <h3 className="text-base font-semibold text-zinc-900">{benefit.title}</h3>
 <p className="mt-1 text-sm leading-relaxed text-zinc-600">{benefit.description}</p>
 </div>
 </div>
 </CardContent>
 </Card>
 </li>
 );
 })}
 </ul>
 </section>
 );
}

