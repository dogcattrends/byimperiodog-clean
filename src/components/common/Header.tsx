import HeaderClient from "@/components/common/HeaderClient";
import { BRAND } from "@/domain/config";
import { getSiteSettings } from "@/lib/getSettings";
import { buildWhatsAppLink } from "@/lib/whatsapp";

const sanitizeNumber = (value?: string) => {
 if (!value) return null;
 const digits = value.replace(/\D+/g, "");
 if (!digits) return null;
 return digits.startsWith("55") ? digits : `55${digits}`;
};

const formatTelHref = (digits: string | null) => (digits ? `tel:+${digits}` : undefined);

export default async function Header() {
 const settings = await getSiteSettings();
 const officialPhone = BRAND.contact.phone;
 const preferredPhone =
 settings.contact_phone ?? process.env.NEXT_PUBLIC_PHONE ?? process.env.NEXT_PUBLIC_CONTACT_PHONE ?? officialPhone;
 const sanitizedPreferred = sanitizeNumber(preferredPhone);
 const sanitizedFallback = sanitizeNumber(officialPhone);
 const phoneDigits = sanitizedPreferred ?? sanitizedFallback ?? "";
 const whatsappLink = buildWhatsAppLink({
  message: "Ola! Vim pelo menu do site By Imperio Dog e quero falar sobre filhotes disponiveis.",
  utmSource: "site",
  utmMedium: "navbar",
  utmCampaign: "whatsapp",
  utmContent: "navbar",
 });
 return (
 <HeaderClient
 phone={phoneDigits || officialPhone}
 phoneLink={formatTelHref(phoneDigits)}
 whatsappLink={whatsappLink}
 />
 );
}
