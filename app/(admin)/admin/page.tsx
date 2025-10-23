export default function AdminDashboardPage() {
  return (
    <section aria-labelledby="dash-title" className="space-y-6">
      <div>
        <h1 id="dash-title" className="text-xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-600">Bem-vindo ao painel administrativo. Use Cmd/Ctrl+K para a busca rápida.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <article className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm" aria-labelledby="card1-title">
          <h2 id="card1-title" className="text-sm font-semibold">Atalhos</h2>
          <ul className="mt-2 list-disc pl-5 text-sm text-zinc-700">
            <li><kbd className="rounded bg-zinc-100 px-1">N</kbd> novo cadastro</li>
            <li><kbd className="rounded bg-zinc-100 px-1">/</kbd> buscar</li>
            <li><kbd className="rounded bg-zinc-100 px-1">?</kbd> ajuda</li>
          </ul>
        </article>
      </div>
    </section>
  );
}
