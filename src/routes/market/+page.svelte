<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { MiniApp, whenReady } from '$lib/MiniApp.js';
  import { loadCatalog, webUrlFor } from '$lib/catalog.js';
  import { installApp, removeApp } from '$lib/appActions.js';

  let apps = [];
  let installed = {};
  let loading = true;
  let err = '';
  let toast = '';
  let busyId = '';
  let inShell = false;

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
      inShell = true;
    } catch {
      installed = {};
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

  function openPreview(app) {
    const web = webUrlFor(app);
    if (!web) {
      err = 'Net webUrl';
      return;
    }
    try {
      if (window.parent && window.parent !== window) {
        const q = new URLSearchParams({
          id: app.id || '',
          name: app.name || app.id || '',
          url: web,
          packageUrl: app.packageUrl || app.releaseUrl || '',
          mode: 'web'
        });
        window.parent.postMessage({ type: 'mapp-nav', path: '/browser?' + q.toString() }, '*');
        return;
      }
    } catch {}
    if (!inShell) window.open(web, '_blank');
  }

  async function onInstallToggle(app) {
    const id = app.id;
    if (!id || busyId) return;
    if (!inShell) {
      err = 'Ustanovka tolko vnutri obolochki MiniApp';
      return;
    }
    busyId = id;
    err = '';
    try {
      if (installed[id]) {
        if (!confirm('Udalit ' + (app.name || id) + '?')) {
          busyId = '';
          return;
        }
        await removeApp(id);
        toast = 'Udaleno';
      } else {
        const packageUrl = app.packageUrl || app.releaseUrl || '';
        if (!packageUrl) throw new Error('Net packageUrl');
        await installApp(id, packageUrl);
        toast = 'Ustanovleno';
      }
      await refreshInstalled();
      setTimeout(() => (toast = ''), 2200);
    } catch (e) {
      err = e.message || String(e);
    } finally {
      busyId = '';
    }
  }

  onMount(async () => {
    await whenReady(2500);
    try {
      await MiniApp.shell('setChrome', { title: 'Market', topBar: false, bottomBar: false });
    } catch {}
    inShell = !!(window.MiniApp || window.MiniApps);
    await load();
  });
</script>

<header class="top">
  <button type="button" class="icon-btn" on:click={() => goto('/')} aria-label="Back">&larr;</button>
  <h1>Market</h1>
  <button type="button" class="icon-btn" on:click={load} aria-label="Refresh">&#8635;</button>
</header>

<p class="muted">
  Online catalog. {inShell ? 'Shell bridge active.' : 'Open from shell to install apps.'}
</p>

{#if loading}
  <p class="muted">Loading...</p>
{:else if err}
  <p class="err">{err}</p>
{:else}
  <div class="cards">
    {#each apps as app}
      <div class="card-row">
        <button type="button" class="card" on:click={() => openPreview(app)}>
          <span class="avatar" class:installed={!!installed[app.id]}>{letter(app.name || app.id)}</span>
          <span class="meta">
            <strong>
              {app.name || app.id}
              {#if installed[app.id]}<span class="dot-on" title="installed"></span>{/if}
            </strong>
            <small>{app.description || app.author || ''}{app.version ? ` · v${app.version}` : ''}</small>
          </span>
          <span class="badge" class:on={!!installed[app.id]}>
            {installed[app.id] ? 'installed' : 'web'}
          </span>
        </button>
        <button
          type="button"
          class="action-btn card-action"
          class:danger={!!installed[app.id]}
          disabled={busyId === app.id}
          on:click={() => onInstallToggle(app)}
        >
          {#if busyId === app.id}...{:else if installed[app.id]}Remove{:else}Install{/if}
        </button>
      </div>
    {/each}
  </div>
{/if}

{#if toast}<p class="toast">{toast}</p>{/if}

<style>
  .card-row {
    display: flex;
    gap: 8px;
    align-items: stretch;
    padding: 0 12px 10px;
  }
  .card-row .card {
    flex: 1;
    margin: 0;
  }
  .card-action {
    flex-shrink: 0;
    align-self: center;
    min-width: 6.5rem;
  }
  .avatar.installed {
    box-shadow: 0 0 0 2px #3fb950;
  }
  .dot-on {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #3fb950;
    margin-left: 6px;
    vertical-align: middle;
  }
  .cards {
    padding: 0;
  }
</style>
