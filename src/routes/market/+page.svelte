<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { MiniApp, whenReady } from '$lib/MiniApp.js';
  import { loadCatalog, webUrlFor } from '$lib/catalog.js';

  let apps = [];
  let installed = {};
  let loading = true;
  let err = '';

  function letter(n) {
    return String(n || '?').trim().charAt(0).toUpperCase() || '?';
  }

  async function refreshInstalled() {
    try {
      const res = await MiniApp.apps('list', {});
      const list = res?.apps || res || [];
      const map = {};
      if (Array.isArray(list)) {
        for (const a of list) {
          const id = a.id || a.appId;
          if (id) map[id] = a;
        }
      }
      installed = map;
    } catch {
      /* */
    }
  }

  async function load() {
    loading = true;
    err = '';
    try {
      await refreshInstalled();
      const data = await loadCatalog();
      apps = (data.apps || []).filter((a) => a && a.id && a.id !== 'market');
    } catch (e) {
      err = e.message || String(e);
      apps = [];
    } finally {
      loading = false;
    }
  }

  function openApp(app) {
    const q = new URLSearchParams({
      id: app.id || '',
      name: app.name || app.id || '',
      url: webUrlFor(app) || '',
      packageUrl: app.packageUrl || app.releaseUrl || ''
    });
    goto('/browser?' + q.toString());
  }

  onMount(async () => {
    await whenReady(2000);
    await load();
  });
</script>

<header class="top">
  <button type="button" class="icon-btn" on:click={() => goto('/')}>←</button>
  <h1>Маркет</h1>
  <button type="button" class="icon-btn" on:click={load}>↻</button>
</header>

<p class="muted">Каталог из настроек оболочки (catalogUrl). Тап — веб-версия.</p>

{#if loading}
  <p class="muted">Загрузка…</p>
{:else if err}
  <p class="err">{err}</p>
{:else}
  <div class="cards">
    {#each apps as app}
      <button type="button" class="card" on:click={() => openApp(app)}>
        <span class="avatar">{letter(app.name || app.id)}</span>
        <span class="meta">
          <strong>{app.name || app.id}</strong>
          <small>{app.description || app.author || ''}{app.version ? ` · v${app.version}` : ''}</small>
        </span>
        <span class="badge" class:on={!!installed[app.id]}>
          {installed[app.id] ? 'установлено' : 'веб'}
        </span>
      </button>
    {/each}
  </div>
{/if}
