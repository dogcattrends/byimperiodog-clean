import { Header } from '@/components/dashboard/Header';
import { Main } from '@/components/dashboard/Main';

export default function SeoHub(){
  return (
  <>
  <Header />
  <Main>
        <h1 className="text-xl font-semibold">SEO Hub</h1>
        <p className="text-sm text-[var(--text-muted)]">Auditoria, Sitemaps, Robots e Redirects (UI mock).</p>
  </Main>
  </>
  );
}
