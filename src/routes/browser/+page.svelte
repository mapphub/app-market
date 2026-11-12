<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { MiniApp, whenReady } from '$lib/MiniApp.js';
  import AppMenu from '$lib/AppMenu.svelte';
  import {
    canShareApp,
    pkgRunUrl,
    setAsHome,
    startShare,
    removeApp,
    installApp
  } from '$lib/appActions.js';

  let title = '…';
  let url = '';
  let packageUrl = '';
  let appId = '';
  /** catalog web preview vs installed package run */
  let mode = 'web';
  let installed = false;
  let busy = false;
  /** idle | installed-flash */
  let installFlash = false;
  let err = '';
  let toast = '';
  let fullscreen = false;
  let menuOpen = false;
  let menuX = 0;
  let menuY = 0;
  let canShare = false;
  let manifest = null;

  function actionLabel() {
    if (busy && !installed) return '…';
    if (busy && installed) return '…';
    if (installFlash) return 'Установлено';
    if (installed) return 'Удалить';
    return 'Установить';
  }

  async function checkInstalled() {
    if (!appId) return;
    try {
      const res = await MiniApp.apps('list', {});
      const list = res?.apps || res || [];
      const hit =
        Array.isArray(list) && list.find((a) => (a.id || a.appId) === appId);
      installed = !!hit;
      if (hit) {
        manifest = hit;
        canShare = canShareApp(hit);
        if (!title || title === '…') title = hit.name || appId;
      }
    } catch {
      installed = false;
    }
  }

  async function onInstallAction() {
    if (!appId || busy || installFlash) return;
    busy = true;
    err = '';
    try {
      if (installed) {
        if (!confirm('Удалить «' + title + '»?')) {
          busy = false;
          return;
        }
        await removeApp(appId);
        installed = false;
        installFlash = false;
        if (mode === 'run') goto('/');
      } else {
        if (!packageUrl) throw new Error('Нет packageUrl');
        await installApp(appId, packageUrl);
        installed = true;
        installFlash = true;
        await checkInstalled();
        setTimeout(() => {
          installFlash = false;
        }, 1600);
      }
    } catch (e) {
      err = e.message || String(e);
    } finally {
      busy = false;
    }
  }

  function openDots(e) {
    const r = e.currentTarget.getBoundingClientRect();
    menuX = Math.min(r.left, window.innerWidth - 200);
    menuY = r.bottom + 4;
    menuOpen = true;
  }

  async function doHome() {
    err = '';
    try {
      const r = await setAsHome(appId, title);
      if (r?.cancelled) return;
      toast = 'Назначено домашним';
      setTimeout(() => (toast = ''), 2500);
    } catch (e) {
      err = e.message || String(e);
    }
  }

  async function doShare() {
    err = '';
    try {
      const r = await startShare(appId);
      toast = r?.url ? 'Раздача: ' + r.url : 'Сервер запущен';
      setTimeout(() => (toast = ''), 4000);
    } catch (e) {
      err = e.message || String(e);
    }
  }

  async function doRemove() {
    err = '';
    if (!confirm('Удалить «' + title + '»?')) return;
    try {
      await removeApp(appId);
      installed = false;
      if (mode === 'run') goto('/');
      else toast = 'Удалено';
      setTimeout(() => (toast = ''), 2000);
    } catch (e) {
      err = e.message || String(e);
    }
  }

  function goBack() {
    if (mode === 'run') goto('/');
    else goto('/market');
  }

  onMount(async () => {
    const q = $page.url.searchParams;
    appId = q.get('id') || '';
    title = q.get('name') || appId || '…';
    packageUrl = q.get('packageUrl') || '';
    mode = q.get('mode') === 'run' ? 'run' : 'web';
    const web = q.get('url') || '';
    await whenReady(2000);
    await checkInstalled();
    if (mode === 'run' && appId) {
      url = pkgRunUrl(appId);
    } else {
      url = web;
    }
  });
</script>

<div class="browser-wrap" class:fs={fullscreen}>
  {#if !fullscreen}
    <header class="top browser-top">
      <button type="button" class="icon-btn" on:click={goBack} aria-label="Назад">←</button>
      <h1>{title}</h1>
      {#if mode === 'run'}
        <button
          type="button"
          class="icon-btn"
          title="На весь экран"
          aria-label="На весь экран"
          on:click={() => (fullscreen = true)}
        >⛶</button>
        <button
          type="button"
          class="icon-btn"
          title="Меню"
          aria-label="Меню"
          on:click={openDots}
        >⋮</button>
      {:else}
        <button
          type="button"
          class="action-btn"
          class:danger={installed && !installFlash}
          class:ok={installFlash}
          disabled={busy || installFlash}
          on:click={onInstallAction}
        >
          {actionLabel()}
        </button>
      {/if}
    </header>
  {:else}
    <button
      type="button"
      class="fs-collapse"
      title="Свернуть"
      aria-label="Свернуть"
      on:click={() => (fullscreen = false)}
    >⛶</button>
  {/if}

  {#if err}<p class="err">{err}</p>{/if}
  {#if toast}<p class="toast">{toast}</p>{/if}

  {#if url}
    <iframe
      title={title}
      src={url}
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"
    ></iframe>
  {:else}
    <p class="muted" style="padding:24px">
      {#if mode === 'run'}
        Нет точки входа пакета.
      {:else}
        Нет webUrl. Можно установить пакет, если packageUrl задан.
      {/if}
    </p>
  {/if}
</div>

<AppMenu
  open={menuOpen}
  canShare={canShare}
  x={menuX}
  y={menuY}
  onHome={doHome}
  onShare={doShare}
  onRemove={doRemove}
  onClose={() => (menuOpen = false)}
/>
