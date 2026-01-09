type Props = {
  title?: string;
  message?: string;
  actionHref?: string;
  actionLabel?: string;
};

export function AdminErrorState({ title = "Falha ao carregar", message = "Ocorreu um erro inesperado.", actionHref = "/admin", actionLabel = "Tentar novamente" }: Props) {
  return (
    <div className="admin-glass-card admin-stagger-item text-center" style={{ borderColor: 'rgba(239, 68, 68, 0.3)' }}>
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
        <svg className="h-6 w-6" style={{ color: 'rgb(var(--admin-danger))' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <p className="admin-card-title" style={{ color: 'rgb(var(--admin-danger))' }}>{title}</p>
      <p className="mt-2 admin-card-subtitle">{message}</p>
      <div className="mt-6">
        <a
          href={actionHref}
          className="admin-btn-primary admin-interactive admin-focus-ring"
          style={{ background: 'rgb(var(--admin-danger))', borderColor: 'rgb(var(--admin-danger))' }}
        >
          {actionLabel}
        </a>
      </div>
    </div>
  );
}
