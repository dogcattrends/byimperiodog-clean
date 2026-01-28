"use client";

import { saveLead } from "@/lib/data/supabase";
import track from "@/lib/track";
import { buildWhatsAppLink, WHATSAPP_NUMBER } from "@/lib/whatsapp";

import { PuppyActions } from "./PuppyActions";

type Props = {
 whatsappLink: string;
 puppyName: string;
 puppySlug: string;
 puppyStatus?: string | null;
 mode?: "product" | "modal";
};

const openLink = (url: string) => {
 const popup = window.open(url, "_blank", "noopener,noreferrer");
 if (!popup) window.location.assign(url);
};

const normalizeStatus = (status?: string | null) => {
 const normalized = (status ?? "available").toLowerCase();
 if (["pending", "em-breve", "coming-soon"].includes(normalized)) return "pending";
 if (["sold", "vendido"].includes(normalized)) return "sold";
 if (["reserved", "reservado"].includes(normalized)) return "reserved";
 if (["unavailable", "indisponivel"].includes(normalized)) return "unavailable";
 return "available";
};

export function PuppyActionsClient({ whatsappLink, puppyName, puppySlug, puppyStatus, mode = "product" }: Props) {
 const normalizedStatus = normalizeStatus(puppyStatus);
 const utmMedium = mode === "modal" ? "modal" : "product_page";
 const isReservable = !["sold", "unavailable", "pending"].includes(normalizedStatus);
 const reserveAction = isReservable ? "reserve" : "waitlist";

 const handleReserve = () => {
 const url = buildWhatsAppLink({
 message:
 reserveAction === "reserve"
 ? `Ola! Quero reservar o filhote ${puppyName}. Pode me enviar os proximos passos?`
 : `Ola! Tenho interesse em entrar na lista para o filhote ${puppyName}. Pode me avisar quando houver disponibilidade?`,
 utmSource: "site",
 utmMedium,
 utmCampaign: reserveAction,
 utmContent: puppySlug,
 });

 void saveLead({ puppy_id: puppySlug, action: reserveAction, status: normalizedStatus, source: mode }).catch(() => {});
 track.event?.("cta_click_whatsapp", { puppy_id: puppySlug, context: mode, action: reserveAction });
 openLink(url);
 };

 const handleWhatsApp = () => {
 track.event?.("cta_click_whatsapp", { puppy_id: puppySlug, context: mode, action: "chat" });
 openLink(whatsappLink);
 };

 const handleVideoCall = () => {
 const url = buildWhatsAppLink({
 message: "Olá! Quero agendar uma videochamada para conhecer o " + puppyName + ".",
 utmSource: "site",
 utmMedium,
 utmCampaign: "video_call",
 utmContent: puppySlug + "-video",
 });
 track.event?.("cta_video_call", { puppy_id: puppySlug });
 openLink(url);
 };

 const handleCall = () => {
 const telUrl = "tel:+" + WHATSAPP_NUMBER;
 track.event?.("cta_call", { puppy_id: puppySlug });
 window.location.href = telUrl;
 };

 const handleRequestPhotos = () => {
 const url = buildWhatsAppLink({
 message: "Olá! Gostaria de receber mais fotos e vídeos do " + puppyName + ".",
 utmSource: "site",
 utmMedium,
 utmCampaign: "request_photos",
 utmContent: puppySlug,
 });
 track.event?.("cta_request_photos", { puppy_id: puppySlug });
 openLink(url);
 };

 const handleScheduleVisit = () => {
 const url = buildWhatsAppLink({
 message: `Ola! Gostaria de agendar uma visita (online ou presencial) para conhecer o filhote ${puppyName}.`,
 utmSource: "site",
 utmMedium,
 utmCampaign: "schedule_visit",
 utmContent: puppySlug,
 });
 track.event?.("cta_schedule_visit", { puppy_id: puppySlug });
 openLink(url);
 };

 return (
 <PuppyActions
 puppyName={puppyName}
 mode={mode}
 onWhatsApp={handleWhatsApp}
 onReserve={handleReserve}
 onRequestPhotos={handleRequestPhotos}
 onScheduleVisit={handleScheduleVisit}
 onVideoCall={mode === "modal" ? handleVideoCall : undefined}
 onCall={mode === "modal" ? handleCall : undefined}
 />
 );
}
