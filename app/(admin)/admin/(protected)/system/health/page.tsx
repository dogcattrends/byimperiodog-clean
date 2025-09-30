import { Header } from '@/components/dashboard/Header';
import { Main } from '@/components/dashboard/Main';

export default function SystemHealth(){
  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)]">
      <Header />
      <Main>
        <h1 className="text-xl font-semibold">Saúde do Sistema</h1>
        <p className="text-sm text-[var(--text-muted)]">CWV, erros e uptime (UI mock).</p>
      </Main>
    </div>
  );
}
