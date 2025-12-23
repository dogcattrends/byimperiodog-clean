"use client";
import { useEffect } from "react";

import { trackPageView } from "@/lib/tracking";

export default function PageViewPing(props?: Record<string, unknown>) {
  useEffect(() => {
    trackPageView((props ?? {}) as Record<string, unknown>);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
