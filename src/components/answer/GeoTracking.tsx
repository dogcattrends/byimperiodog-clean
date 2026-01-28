"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { getCurrentConsent } from "@/lib/consent";
import track from "@/lib/track";

const ANSWER_SELECTOR = "[data-geo-answer]";
const FAQ_SELECTOR = "[data-geo-faq]";

function canTrack() {
 try {
 return getCurrentConsent().analytics;
 } catch {
 return false;
 }
}

export default function GeoTracking() {
 const pathname = usePathname();

 useEffect(() => {
 if (typeof document === "undefined") return;

 const cleanup: Array<() => void> = [];
 let initialized = false;

 const init = () => {
 if (initialized || !canTrack()) return;
 initialized = true;

 const seen = new WeakSet<Element>();
 const answerElements = Array.from(document.querySelectorAll<HTMLElement>(ANSWER_SELECTOR));
 if (answerElements.length) {
 const observer = new IntersectionObserver(
 (entries) => {
 entries.forEach((entry) => {
 const target = entry.target as HTMLElement;
 if (!entry.isIntersecting || seen.has(target)) return;
 seen.add(target);
 observer.unobserve(target);
 track.event?.("answer_visible", {
 path: pathname,
 answer_id: target.dataset.geoAnswer || null,
 });
 });
 },
 { rootMargin: "0px 0px -25% 0px", threshold: 0.25 }
 );
 answerElements.forEach((el) => observer.observe(el));
 cleanup.push(() => observer.disconnect());
 }

 const faqElements = Array.from(document.querySelectorAll<HTMLDetailsElement>(FAQ_SELECTOR));
 if (faqElements.length) {
 const onToggle = (event: Event) => {
 if (!canTrack()) return;
 const target = event.currentTarget as HTMLDetailsElement | null;
 if (!target || !target.open) return;
 track.event?.("faq_expand", {
 path: pathname,
 question: target.dataset.geoQuestion || null,
 });
 };
 faqElements.forEach((el) => el.addEventListener("toggle", onToggle));
 cleanup.push(() => faqElements.forEach((el) => el.removeEventListener("toggle", onToggle)));
 }
 };

 init();

 const onConsent = () => init();
 window.addEventListener("consentUpdated", onConsent as EventListener);
 cleanup.push(() => window.removeEventListener("consentUpdated", onConsent as EventListener));

 return () => cleanup.forEach((fn) => fn());
 }, [pathname]);

 return null;
}
