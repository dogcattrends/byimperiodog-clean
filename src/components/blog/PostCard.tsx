import Link from 'next/link';
import Image from 'next/image';

export type PostCardProps = {
  href: string;
  title: string;
  coverUrl?: string | null;
  excerpt?: string | null;
  date?: string | null;
  readingTime?: number | null;
};

export function PostCard({ href, title, coverUrl, excerpt, date, readingTime }: PostCardProps) {
  return (
  <li className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
      <Link href={href} className="block">
        {coverUrl ? (
          <Image src={coverUrl} alt={title} width={800} height={450} className="h-40 w-full object-cover" />
        ) : (
          <div className="h-40 w-full bg-[var(--surface-2)] flex items-center justify-center text-xs placeholder-strong border border-[var(--border)] text-[var(--text-muted)]">
            Sem capa
          </div>
        )}
        <div className="p-4">
          <h3 className="font-semibold line-clamp-2 text-[var(--text)]">{title}</h3>
          {excerpt ? (
            <p className="mt-1 line-clamp-3 text-sm text-[var(--text-muted)]">{excerpt}</p>
          ) : (
            <p className="mt-1 text-xs placeholder-strong italic text-[var(--text-muted)]">Sem resumo</p>
          )}
          <div className="mt-2 flex items-center justify-between text-[11px] text-[var(--text-muted)]">
            <span>{date ? new Date(date).toLocaleDateString('pt-BR') : '—'}</span>
            <span>{readingTime || Math.max(1, Math.round(((excerpt?.split(/\s+/).length || 120)) / 200))} min</span>
          </div>
        </div>
      </Link>
    </li>
  );
}

export default PostCard;
