import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <h1 className="mb-2 text-2xl font-bold text-text">Filhote não encontrado</h1>
      <p className="mb-6 text-textMuted">
        Ele pode ter sido removido ou já está indisponível.
      </p>
      <a
        href="/#filhotes"
        className="rounded-2xl bg-brand px-5 py-3 font-semibold text-on-brand hover:brightness-110 focus-visible:focus-ring"
      >
        Ver outros filhotes
      </a>
    </div>
  );
}
