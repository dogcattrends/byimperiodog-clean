"use client";
import { useEffect } from "react";

import { trackPageView } from "@/lib/tracking";

export default function PageViewPing(props: Record<string, any>) {
  useEffect(() => {
    trackPageView(props || {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
