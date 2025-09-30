import { Header } from '@/components/dashboard/Header';
import { Main } from '@/components/dashboard/Main';

export default function Experiments(){
  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)]">
      <Header />
      <Main>
        <h1 className="text-xl font-semibold">Experimentos A/B</h1>
        <p className="text-sm text-[var(--text-muted)]">Crie e avalie testes (UI mock).</p>
      </Main>
    </div>
  );
}
