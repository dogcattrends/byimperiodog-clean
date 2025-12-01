"use client";

import type { Puppy } from "@/domain/puppy";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { PuppiesTable } from "./PuppiesTable";

type Props = {
  items: Puppy[];
  leadCounts: Record<string, number>;
};

export function PuppiesPageClient({ items, leadCounts }: Props) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async (id: string, status: string) => {
    setIsUpdating(true);
    try {
      const response = await fetch("/api/admin/puppies/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });

      if (!response.ok) {
        throw new Error("Erro ao atualizar status");
      }

      router.refresh();
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao atualizar status do filhote");
    } finally {
      setIsUpdating(false);
    }
  };

  return <PuppiesTable items={items} leadCounts={leadCounts} onStatusChange={handleStatusChange} />;
}
