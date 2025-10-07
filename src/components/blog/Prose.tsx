import clsx from 'classnames';
import React from 'react';

interface ProseProps extends React.HTMLAttributes<HTMLDivElement> {
  spacious?: boolean;
}

export default function Prose({ className, children, spacious = false, ...rest }: ProseProps){
  return (
    <div
      className={clsx(
        'prose prose-sm md:prose-base max-w-none dark:prose-invert',
        'prose-headings:font-semibold prose-h1:tracking-tight prose-h2:tracking-tight',
        'prose-img:rounded-lg prose-img:border prose-img:border-[var(--border)]',
        'prose-a:text-emerald-600 dark:prose-a:text-emerald-400 prose-a:no-underline hover:prose-a:underline',
        'prose-blockquote:border-l-emerald-600 dark:prose-blockquote:border-l-emerald-400',
        'prose-code:rounded prose-code:bg-emerald-500/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:text-emerald-600 dark:prose-code:text-emerald-300',
        spacious && 'prose-p:my-5 prose-ul:my-5 prose-ol:my-5',
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
