/**
 * PuppyActions
 * - `mode="product"` (default): CTA primÃ¡rio + secundÃ¡rios
 * - `mode="modal"`: CTAs extras + barra sticky no mobile
 */

"use client";

import { Calendar, Camera, MessageCircle, Phone, Video } from "lucide-react";

import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { Button, Card, CardContent } from "@/components/ui";

type Props = {
 puppyName: string;
 mode?: "product" | "modal";
 onWhatsApp?: () => void;
 onReserve?: () => void;
 onVideoCall?: () => void;
 onCall?: () => void;
 onRequestPhotos?: () => void;
 onScheduleVisit?: () => void;
};

export function PuppyActions({
 puppyName,
 mode = "product",
 onWhatsApp,
 onReserve,
 onVideoCall,
 onCall,
 onRequestPhotos,
 onScheduleVisit,
}: Props) {
 return (
 <section aria-labelledby="actions-heading" className="space-y-6">
 <h2 id="actions-heading" className="sr-only">
 Ações disponíveis
 </h2>

 {/* Barra sticky no mobile */}
 <div className="sticky bottom-0 left-0 right-0 z-10 border-t border-zinc-200 bg-white p-4 shadow-lg sm:relative sm:border-0 sm:p-0 sm:shadow-none">
 {mode === "modal" ? (
 <div className="space-y-2">
 <div className="grid grid-cols-2 gap-2">
 {onReserve ? (
 <Button
 type="button"
 variant="solid"
 size="lg"
 className="w-full gap-2 rounded-full"
 onClick={onReserve}
 aria-label={`Reservar ${puppyName}`}
 >
 <WhatsAppIcon className="h-5 w-5" aria-hidden="true" />
 Reservar
 </Button>
 ) : (
 <div aria-hidden />
 )}

 {onWhatsApp ? (
 <Button
 type="button"
 variant="outline"
 size="lg"
 className="w-full gap-2 rounded-full"
 onClick={onWhatsApp}
 aria-label={`Atendimento via WhatsApp sobre ${puppyName}`}
 >
 <MessageCircle className="h-4 w-4" aria-hidden="true" />
 WhatsApp
 </Button>
 ) : (
 <div aria-hidden />
 )}

 {onVideoCall ? (
 <Button
 type="button"
 variant="outline"
 size="lg"
 className="w-full gap-2 rounded-full"
 onClick={onVideoCall}
 aria-label={`Agendar videochamada para ${puppyName}`}
 >
 <Video className="h-4 w-4" aria-hidden="true" />
 Videochamada
 </Button>
 ) : (
 <div aria-hidden />
 )}

 {onCall ? (
 <Button
 type="button"
 variant="outline"
 size="lg"
 className="w-full gap-2 rounded-full"
 onClick={onCall}
 aria-label="Ligar agora"
 >
 <Phone className="h-4 w-4" aria-hidden="true" />
 Ligar
 </Button>
 ) : (
 <div aria-hidden />
 )}
 </div>
 <p className="text-center text-xs text-zinc-500">Atendimento 7 dias por semana • Resposta rápida</p>
 </div>
 ) : (
 <>
 <Button
 type="button"
 variant="solid"
 size="lg"
 className="w-full gap-2 rounded-full"
 onClick={onWhatsApp}
 aria-label={`Quero o ${puppyName} - Atendimento via WhatsApp`}
 >
 <WhatsAppIcon className="h-5 w-5" aria-hidden="true" />
 Quero esse filhote
 </Button>
 <p className="mt-2 text-center text-xs text-zinc-500">Resposta em até 1 hora • Atendimento 7 dias por semana</p>
 </>
 )}
 </div>

 {/* CTAs secundÃ¡rias */}
 {(onRequestPhotos || onScheduleVisit) && (
 <div className="grid gap-3 sm:grid-cols-2">
 {onRequestPhotos && (
 <Button
 variant="outline"
 size="lg"
 onClick={onRequestPhotos}
 className="gap-2 rounded-full"
 aria-label="Solicitar mais fotos e vídeos"
 >
 <Camera className="h-4 w-4" aria-hidden="true" />
 Quero mais fotos/vídeos
 </Button>
 )}

 {onScheduleVisit && (
 <Button
 variant="outline"
 size="lg"
 onClick={onScheduleVisit}
 className="gap-2 rounded-full"
 aria-label="Agendar visita online ou presencial"
 >
 <Calendar className="h-4 w-4" aria-hidden="true" />
 Agendar visita
 </Button>
 )}
 </div>
 )}

 <Card variant="outline" className="bg-zinc-50">
 <CardContent className="p-4 text-center">
 <p className="text-sm font-medium text-zinc-900">Ainda tem dúvidas?</p>
 <p className="mt-1 text-sm text-zinc-600">Nossa equipe está pronta para ajudar você a tomar a melhor decisão</p>
 <Button
 type="button"
 variant="ghost"
 size="md"
 onClick={onWhatsApp}
 className="mt-3 gap-2 rounded-full text-emerald-700 hover:text-emerald-800"
 aria-label="Tirar dÃºvidas no WhatsApp"
 >
 <MessageCircle className="h-4 w-4" aria-hidden="true" />
 Conversar no WhatsApp
 </Button>
 </CardContent>
 </Card>
 </section>
 );
}

