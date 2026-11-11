<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { MiniApp, whenReady } from '$lib/MiniApp.js';

  let title = '…';
  let url = '';
  let packageUrl = '';
  let appId = '';
  let installed = false;
  let busy = false;
  let err = '';

  async function checkInstalled() {
    if (!appId) return;
    try {
      const res = await MiniApp.apps('list', {});
      const list = res?.apps || res || [];
      installed = Array.isArray(list) && list.some((a) => (a.id || a.appId) === appId);
    } catch {
      installed = false;
    }
  }

  async function onAction() {
    if (!appId) return;
    busy = true;
    err = '';
    try {
      if (installed) {
        await MiniApp.apps('remove', { appId });
        installed = false;
      } else {
        if (!packageUrl) throw new Error('Нет packageUrl');
        await MiniApp.apps('installUpdate', { appId, packageUrl });
        installed = true;
      }
    } catch (e) {
      err = e.message || String(e);
    } finally {
      busy = false;
    }
  }

  onMount(async () => {
    const q = $page.url.searchParams;
    appId = q.get('id') || '';
    title = q.get('name') || appId || '…';
    url = q.get('url') || '';
    packageUrl = q.get('packageUrl') || '';
    await whenReady(2000);
    await checkInstalled();
  });
</script>

<div class="browser-wrap">
  <header class="top">
    <button type="button" class="icon-btn" on:click={() => goto('/market')}>←</button>
    <h1>{title}</h1>
    <button
      type="button"
      class="action-btn"
      class:danger={installed}
      disabled={busy}
      on:click={onAction}
    >
      {#if busy}…{:else if installed}Удалить{:else}Установить{/if}
    </button>
  </header>
  {#if err}<p class="err">{err}</p>{/if}
  {#if url}
    <iframe title="web" src={url} sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"></iframe>
  {:else}
    <p class="muted" style="padding:24px">Нет webUrl. Можно установить пакет, если packageUrl задан.</p>
  {/if}
</div>
