import * as React from 'react';
import { cn } from '../../lib/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>{ variant?:'default'|'outline'|'success'|'warning'|'error'; }
export function Badge({ className, variant='default', ...props }:BadgeProps){
  const base='inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium';
  const styles:Record<string,string>={
    default:'bg-[var(--surface-2)] text-[var(--text)]',
    outline:'border border-[var(--border)] text-[var(--text-muted)]',
    success:'bg-[var(--success)]/15 text-[var(--success)]',
    warning:'bg-[var(--warning)]/15 text-[var(--warning)]',
    error:'bg-[var(--error)]/15 text-[var(--error)]',
  };
  return <span className={cn(base, styles[variant], className)} {...props}/>;
}