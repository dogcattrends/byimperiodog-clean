import HeaderClient from "@/components/common/HeaderClient";
import { BRAND } from "@/domain/config";
import { getSiteSettings } from "@/lib/getSettings";
import { WHATSAPP_LINK } from "@/lib/whatsapp";

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
  const whatsappSetting = settings.whatsapp_number ?? process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  const whatsappCandidates = sanitizeNumber(whatsappSetting ?? "") ?? phoneDigits;
  const whatsappDigits = whatsappCandidates || sanitizeNumber(BRAND.contact.whatsapp) || "";
  const whatsappLink = whatsappDigits ? `https://wa.me/${whatsappDigits}` : WHATSAPP_LINK;
  return (
    <HeaderClient
      phone={phoneDigits || officialPhone}
      phoneLink={formatTelHref(phoneDigits)}
      whatsappLink={whatsappLink}
    />
  );
}
