"use client";

import { useMemo, useState } from "react";

type UploadStatus = "idle" | "uploading" | "success" | "error";

type UploadResult = {
  ok?: boolean;
  version?: string;
  bucket?: string;
  path?: string;
  publicUrl?: string | null;
  error?: string;
};

function buildExpectedUrl(version: "v1" | "v2") {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const bucket = process.env.NEXT_PUBLIC_SUPABASE_BUCKET || "media";
  const objectPath = version === "v2" ? "guides/guia-v2.pdf" : "guides/guia.pdf";
  if (!base) return null;
  return `${base.replace(/\/$/, "")}/storage/v1/object/public/${bucket}/${objectPath}`;
}

export default function AdminGuiaPdfPage() {
  const [version, setVersion] = useState<"v1" | "v2">("v1");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [message, setMessage] = useState<string>("");
  const [result, setResult] = useState<UploadResult | null>(null);

  const expectedUrl = useMemo(() => buildExpectedUrl(version), [version]);

  async function handleUpload() {
    if (!file) return;
    setStatus("uploading");
    setMessage("");
    setResult(null);

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("version", version);

      const res = await fetch("/api/admin/guia/upload", {
        method: "POST",
        body: fd,
      });

      const json = (await res.json().catch(() => ({}))) as UploadResult;
      if (!res.ok) {
        setStatus("error");
        setMessage(json?.error || "Falha no upload.");
        return;
      }
      setStatus("success");
      setResult(json);
      setMessage("Upload concluído. O link de download do /guia já aponta para esta versão.");
      setFile(null);
    } catch {
      setStatus("error");
      setMessage("Erro inesperado. Tente novamente.");
    }
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-[var(--text)]">Guia para o Tutor (PDF)</h1>
        <p className="text-sm text-[var(--text-muted)]">
          Faça upload do PDF que será liberado após captura do lead em <strong>/guia</strong>.
        </p>
      </header>

      <section className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="admin-guia-version"
              className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--text-muted)]"
            >
              Versão
            </label>
            <select
              id="admin-guia-version"
              className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm"
              value={version}
              onChange={(e) => setVersion(e.target.value === "v2" ? "v2" : "v1")}
            >
              <option value="v1">v1</option>
              <option value="v2">v2</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="admin-guia-file"
              className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--text-muted)]"
            >
              Arquivo (PDF)
            </label>
            <input
              id="admin-guia-file"
              type="file"
              accept="application/pdf"
              className="mt-2 block w-full text-sm"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleUpload}
            disabled={!file || status === "uploading"}
            className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {status === "uploading" ? "Enviando..." : "Enviar PDF"}
          </button>

          {expectedUrl ? (
            <a
              href={expectedUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-semibold text-emerald-700"
            >
              Abrir URL pública esperada
            </a>
          ) : (
            <span className="text-sm text-[var(--text-muted)]">
              Defina <strong>NEXT_PUBLIC_SUPABASE_URL</strong> para mostrar a URL pública.
            </span>
          )}
        </div>

        {message ? (
          <div
            className={
              status === "error"
                ? "rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"
                : "rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700"
            }
            role="status"
          >
            {message}
          </div>
        ) : null}

        {result?.publicUrl ? (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-sm">
            <div className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--text-muted)]">URL publicada</div>
            <div className="mt-1 break-all text-[var(--text)]">{result.publicUrl}</div>
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm space-y-2">
        <h2 className="text-lg font-semibold text-[var(--text)]">Como funciona</h2>
        <ul className="list-disc pl-5 text-sm text-[var(--text-muted)] space-y-1">
          <li>O formulário em /guia cria um lead e recebe um token de download.</li>
          <li>O link /download/guia valida o token e redireciona para este PDF no Storage.</li>
          <li>Ao enviar um novo PDF aqui, o arquivo é sobrescrito no mesmo caminho (URL estável).</li>
        </ul>
      </section>
    </div>
  );
}
