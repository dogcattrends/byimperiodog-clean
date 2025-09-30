import { Header } from '@/components/dashboard/Header';
import { Main } from '@/components/dashboard/Main';

export default function MediaLibrary(){
  return (
  <>
  <Header />
  <Main>
        <h1 className="text-xl font-semibold">Biblioteca de Mídia</h1>
        <p className="text-sm text-[var(--text-muted)]">Uploads, compressão e recortes (UI mock).</p>
  </Main>
  </>
  );
}
