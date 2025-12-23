// Wrapper central para chamadas a endpoints admin garantindo header x-admin-pass.
export async function adminFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const compiledPass = process.env.NEXT_PUBLIC_ADMIN_PASS; // substituído em build
  const headers = new Headers(init.headers || {});
  // 1) Usa variável de build
  if (compiledPass && !headers.has('x-admin-pass')) headers.set('x-admin-pass', compiledPass);
  // 2) Fallback localStorage (runtime)
  if (typeof window !== 'undefined' && !headers.has('x-admin-pass')) {
    const stored = localStorage.getItem('adminPass');
    if (stored) headers.set('x-admin-pass', stored);
  }

  let res = await fetch(input, { ...init, headers });
  // 3) Se 401 no browser: perguntar uma vez e refazer
  if (typeof window !== 'undefined' && res.status === 401) {
    try {
      const win = window as unknown as Record<string, unknown>;
      const trying = (win.__adminPassRetrying as boolean) || false;
      if (!trying) {
        (win.__adminPassRetrying as unknown) = true;
        const entered = window.prompt('Senha admin (x-admin-pass):');
        if (entered) {
          localStorage.setItem('adminPass', entered);
          headers.set('x-admin-pass', entered);
          res = await fetch(input, { ...init, headers });
        }
        (win.__adminPassRetrying as unknown) = false;
      }
    } catch { /* ignore */ }
  }
  return res;
}
export async function adminPostJSON<T = unknown>(url: string, data: unknown, extraInit: RequestInit = {}): Promise<T> {
  const res = await adminFetch(url, { method: 'POST', body: JSON.stringify(data), headers: { 'Content-Type': 'application/json', ...(extraInit.headers || {}) }, ...extraInit });
  const json = (await res.json().catch(() => null)) as unknown;
  const jsObj = json as Record<string, unknown> | null;
  if (!res.ok) throw new Error((jsObj && (String(jsObj.error || jsObj.message) || 'Erro')) || 'Erro');
  return json as T;
}
