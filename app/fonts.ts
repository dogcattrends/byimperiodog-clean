import { DM_Sans, Inter } from "next/font/google";

/**
 * DM Sans - Primary font for body text
 * Weights: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)
 * @see https://fonts.google.com/specimen/DM+Sans
 */
export const dmSans = DM_Sans({
  subsets: ["latin", "latin-ext"], // PT-BR support
  weight: ["400", "500", "600", "700"],
  display: "swap", // Evita FOIT (Flash of Invisible Text)
  variable: "--font-dm-sans",
  preload: true,
  fallback: ["Inter", "Segoe UI", "system-ui", "-apple-system", "sans-serif"],
});

/**
 * Inter - Fallback/complementary font
 * Weights: 400 (regular), 600 (semibold), 700 (bold)
 * @see https://fonts.google.com/specimen/Inter
 */
export const inter = Inter({
  subsets: ["latin", "latin-ext"], // PT-BR support
  weight: ["400", "600", "700"],
  display: "swap",
  variable: "--font-inter",
  preload: false, // Não preload pois é secundária
  fallback: ["Segoe UI", "system-ui", "-apple-system", "sans-serif"],
});
