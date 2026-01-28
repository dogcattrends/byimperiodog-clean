'use client';
import { useEffect } from "react";

export default function ThemeToggle() {
 // Dark mode desativado: n�o renderiza nada
 useEffect(() => {
 const root = window.document.documentElement;
 root.classList.remove('dark');
 }, []);
 return null;
}
