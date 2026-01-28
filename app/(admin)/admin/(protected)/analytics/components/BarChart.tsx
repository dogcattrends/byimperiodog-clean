"use client";

type Item = { label: string; value: number };

export function BarChart({ data, title }: { data: Item[]; title: string }) {
 const max = Math.max(...data.map((d) => d.value), 1);

 return (
 <figure className="admin-glass-card admin-interactive admin-stagger-item">
 <figcaption className="admin-card-title text-sm mb-3">{title}</figcaption>
 <div className="flex items-end gap-3" role="img" aria-label={title}>
 {data.map((item) => (
 <div key={item.label} className="flex flex-col items-center gap-1">
 <div
 className="w-10 rounded-t text-center text-xs font-semibold admin-scale-hover"
 style={{ 
 height: `${(item.value / max) * 140}px`,
 background: 'linear-gradient(180deg, rgb(var(--admin-brand-bright)), rgb(var(--admin-brand)))',
 color: 'rgb(var(--admin-bg))'
 }}
 aria-hidden
 />
 <span className="text-[11px] admin-card-subtitle">{item.label}</span>
 <span className="text-xs font-semibold">{item.value}</span>
 </div>
 ))}
 </div>
 <div className="sr-only">
 {data.map((d) => (
 <div key={d.label}>
 {d.label}: {d.value}
 </div>
 ))}
 </div>
 </figure>
 );
}
