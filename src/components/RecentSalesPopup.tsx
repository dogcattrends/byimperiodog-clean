'use client';
import { useEffect, useState } from 'react';

export default function RecentSalesPopup() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const show = () => setVisible(true);
    const hide = () => setVisible(false);

    // aparece a cada 30s por 8s
    const interval = setInterval(() => {
      show();
      setTimeout(hide, 8000);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-20 left-5 rounded-xl border border-emerald-500 bg-white  px-4 py-3 shadow-lg text-sm text-zinc-700  z-40 flex items-center gap-2">
      Alguem de Sao Paulo acabou de reservar um filhote ! 
      <button
        onClick={() => setVisible(false)}
        className="ml-2 text-xs text-red-500 hover:underline"
      >
        Fechar
      </button>
    </div>
  );
}

