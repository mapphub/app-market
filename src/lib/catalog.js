const FALLBACK = 'https://mapphub.github.io/catalog.json';

export async function resolveCatalogUrl() {
  try {
    const M = typeof window !== 'undefined' ? window.MiniApp : null;
    if (M?.settings) {
      const r = await M.settings('get', {});
      const u = r?.settings?.catalogUrl || r?.catalogUrl;
      if (u) return u;
    }
  } catch {
    /* */
  }
  return FALLBACK;
}

export async function loadCatalog() {
  const url = await resolveCatalogUrl();
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('catalog HTTP ' + res.status);
  return res.json();
}

export function webUrlFor(app) {
  if (app.webUrl) return app.webUrl;
  if (app.repo) {
    const m = String(app.repo).match(/github\.com\/([^/]+)\/([^/]+)/);
    if (m) return `https://${m[1]}.github.io/${m[2].replace(/\.git$/, '')}/`;
  }
  if (app.id) return `https://mapphub.github.io/app-${app.id}/`;
  return null;
}
