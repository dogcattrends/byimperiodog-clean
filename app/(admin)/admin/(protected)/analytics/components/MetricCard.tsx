type Props = {
  label: string;
  value: string | number;
  description?: string;
};

export function MetricCard({ label, value, description }: Props) {
  return (
    <div className="admin-glass-card admin-interactive admin-stagger-item text-center">
      <p className="admin-card-subtitle uppercase tracking-wide">{label}</p>
      <p className="admin-kpi-value mt-2">{value}</p>
      {description && <p className="mt-2 text-xs" style={{ color: 'rgb(var(--admin-text-soft))' }}>{description}</p>}
    </div>
  );
}
