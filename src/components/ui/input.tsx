import * as React from 'react';
import { cn } from '../../lib/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement>{}
export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input({ className, ...props }, ref){
  return <input ref={ref} className={cn('flex h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg)] disabled:cursor-not-allowed disabled:opacity-50', className)} {...props}/>;
});
