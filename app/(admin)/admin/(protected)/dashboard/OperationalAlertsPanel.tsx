type AlertItem = {
  id: string;
  title: string;
  description: string;
  resolveHref?: string;
};

export type OperationalAlerts = {
  critical: AlertItem[];
  attention: AlertItem[];
  low: AlertItem[];
};

const categories: { key: keyof OperationalAlerts; label: string; tone: string }[] = [
  {
    key: "critical",
    label: "Críticos",
    tone: "border-rose-200 bg-rose-50 text-rose-900",
  },
  {
    key: "attention",
    label: "Atenção",
    tone: "border-amber-200 bg-amber-50 text-amber-900",
  },
  {
    key: "low",
    label: "Baixo impacto",
    tone: "border-emerald-200 bg-emerald-50 text-emerald-900",
  },
];

export function OperationalAlertsPanel({ alerts }: { alerts: OperationalAlerts }) {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text)]">Alertas operacionais</h2>
          <p className="text-sm text-[var(--text-muted)]">
            Monitoramento rápido do que precisa de atenção.
          </p>
        </div>
      </header>
      <div className="grid gap-3 md:grid-cols-3">
        {categories.map((category) => {
          const items = alerts[category.key];
          return (
            <div key={category.key} className={`rounded-xl border px-3 py-3 ${category.tone}`}>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold uppercase tracking-wide">{category.label}</p>
                <span className="text-xs font-semibold">{items.length}</span>
              </div>
              {items.length ? (
                <ul className="space-y-3">
                  {items.map((item) => (
                    <li
                      key={item.id}
                      className="rounded-lg border border-white/40 bg-white/40 px-3 py-2 text-[var(--text)] shadow-sm"
                    >
                      <p className="font-semibold">{item.title}</p>
                      <p className="text-sm text-[var(--text-muted)]">{item.description}</p>
                      {item.resolveHref ? (
                        <a
                          href={item.resolveHref}
                          className="mt-2 inline-flex items-center gap-1 rounded-full border border-current px-3 py-1 text-xs font-semibold uppercase tracking-wide"
                        >
                          Resolver
                        </a>
                      ) : (
                        <button
                          type="button"
                          className="mt-2 inline-flex items-center gap-1 rounded-full border border-current px-3 py-1 text-xs font-semibold uppercase tracking-wide"
                        >
                          Resolver
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-[var(--text-muted)] opacity-80">Sem alertas.</p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
