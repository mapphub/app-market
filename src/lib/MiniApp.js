/**
 * Bridge wrapper — waits for host MiniApp proxy.
 * Usage: import { MiniApp, whenReady } from '$lib/MiniApp.js'
 */
export function getMiniApp() {
  return typeof window !== 'undefined' ? window.MiniApp || null : null;
}

export function whenReady(timeoutMs = 8000) {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(null);
    if (window.MiniApp) return resolve(window.MiniApp);
    const t = setTimeout(() => resolve(window.MiniApp || null), timeoutMs);
    window.addEventListener(
      'miniapp-ready',
      () => {
        clearTimeout(t);
        resolve(window.MiniApp || null);
      },
      { once: true }
    );
  });
}

export const MiniApp = new Proxy(
  {},
  {
    get(_t, cat) {
      if (cat === 'then') return undefined;
      return (action, params) => {
        const M = getMiniApp();
        if (!M) return Promise.reject(new Error('MiniApp unavailable'));
        if (typeof M[cat] === 'function') return M[cat](action, params || {});
        return Promise.reject(new Error('Unknown category: ' + String(cat)));
      };
    }
  }
);

export default MiniApp;
