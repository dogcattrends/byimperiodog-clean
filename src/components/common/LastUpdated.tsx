import React from "react";

type Props = {
  date: string; // ISO string or yyyy-mm-dd
  className?: string;
};

export function LastUpdated({ date, className }: Props) {
  const d = new Date(date);
  const formatted = isNaN(d.getTime()) ? date : d.toLocaleDateString("pt-BR");
  return (
    <p className={className ?? "text-sm text-textMuted"}>Última atualização: {formatted}</p>
  );
}

export default LastUpdated;
