"use client";
import { motion, stagger } from "framer-motion";
import { useId } from "react";

/* Wrapper: aplica variantes de stagger aos filhos li usando role=listitem */
export default function BlogRecentStaggerClient({ selector = '#recent-posts' }: { selector?: string }) {
  // Implementation alternative: since list is rendered server-side, we'll rely purely on framer in parent inlined soon.
  return null;
}
