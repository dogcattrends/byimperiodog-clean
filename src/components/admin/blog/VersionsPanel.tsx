"use client";

import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";

import { adminFetch } from "@/lib/adminFetch";

interface Version {
  id: string;
  created_at: string;
  reason: string | null;
}

interface VersionsPanelProps {
  postId: string | undefined;
}

export function VersionsPanel({ postId }: VersionsPanelProps) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!postId) {
      setVersions([]);
      return;
    }

    setLoading(true);
    setError(null);

    adminFetch(`/api/admin/blog/${postId}/versions?limit=20`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          throw new Error(data.error);
        }
        setVersions(data.versions || []);
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : "Erro ao carregar versões";
        setError(message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [postId]);

  if (!postId) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
        <Clock className="mb-2 inline h-4 w-4" />
        <p>Salve o post para ver o histórico de versões.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Clock className="h-4 w-4 animate-pulse" />
          <span>Carregando versões...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
        <p>❌ {error}</p>
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
        <Clock className="mb-2 inline h-4 w-4" />
        <p>Nenhuma versão anterior encontrada.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-4 py-3">
        <h3 className="flex items-center gap-2 text-sm font-medium text-gray-900">
          <Clock className="h-4 w-4" />
          Histórico ({versions.length})
        </h3>
      </div>
      <div className="max-h-80 overflow-y-auto">
        <ul className="divide-y divide-gray-100">
          {versions.map((version) => (
            <li key={version.id} className="px-4 py-3 hover:bg-gray-50">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900">
                    {version.reason || "Salvamento automático"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {version.created_at
                      ? formatDistanceToNow(new Date(version.created_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })
                      : "Data desconhecida"}
                  </p>
                </div>
                <button
                  type="button"
                  className="flex-shrink-0 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  title="Ver diferenças"
                  aria-label="Ver diferenças desta versão"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
