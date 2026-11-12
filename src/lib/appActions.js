import { MiniApp } from './MiniApp.js';

export function canShareApp(app) {
  if (!app) return false;
  const perms = app.permissions || [];
  if (perms.includes('*') || perms.includes('share') || perms.includes('net')) return true;
  if (app.server && app.server.client === true) return true;
  if (app.server && app.server.client === false) return false;
  return false;
}

export function pkgRunUrl(appId) {
  return `/__mapp/pkg/${encodeURIComponent(appId)}/`;
}

export async function setAsHome(appId, name) {
  return MiniApp.hub('setHome', { appId, name, force: false });
}

export async function startShare(appId) {
  return MiniApp.share('start', { appId });
}

export async function removeApp(appId) {
  return MiniApp.apps('remove', { appId });
}

export async function installApp(appId, packageUrl) {
  return MiniApp.apps('installUpdate', { appId, packageUrl });
}
