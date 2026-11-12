/**
 * Bridge wrapper — host injects window.MiniApps (and optionally MiniApp).
 * Usage: import { MiniApp, whenReady } from '$lib/MiniApp.js'
 */
export function getMiniApp() {
  if (typeof window === 'undefined') return null;
  return window.MiniApp || window.MiniApps || null;
}

export function whenReady(timeoutMs = 8000) {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(null);
    const existing = getMiniApp();
    if (existing) return resolve(existing);
    const t = setTimeout(() => resolve(getMiniApp()), timeoutMs);
    const done = () => {
      clearTimeout(t);
      resolve(getMiniApp());
    };
    window.addEventListener('miniapp-ready', done, { once: true });
    window.addEventListener('miniapps-ready', done, { once: true });
  });
}

function callCategory(M, cat, action, params) {
  if (!M) return Promise.reject(new Error('MiniApp unavailable — нет моста оболочки'));
  if (typeof M[cat] === 'function') return M[cat](action, params || {});
  if (M[cat] && typeof M[cat][action] === 'function') return M[cat][action](params || {});
  if (typeof M.call === 'function') return M.call(cat, action, params || {});
  return Promise.reject(new Error('Unknown category: ' + String(cat)));
}

export const MiniApp = new Proxy(
  {},
  {
    get(_t, cat) {
      if (cat === 'then') return undefined;
      return (action, params) => callCategory(getMiniApp(), cat, action, params);
    }
  }
);

export default MiniApp;
