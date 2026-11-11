<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { MiniApp, whenReady } from '$lib/MiniApp.js';

  let installed = {};
  let err = '';

  function letter(n) {
    return String(n || '?').trim().charAt(0).toUpperCase() || '?';
  }

  async function refresh() {
    try {
      const res = await MiniApp.apps('list', {});
      const apps = res?.apps || res || [];
      const map = {};
      if (Array.isArray(apps)) {
        for (const a of apps) {
          const id = a.id || a.appId;
          if (id && id !== 'market') map[id] = a;
        }
      }
      installed = map;
    } catch (e) {
      /* optional */
    }
  }

  async function openInstalled(id) {
    try {
      await MiniApp.hub('open', { appId: id });
    } catch (e) {
      err = e.message || String(e);
    }
  }

  onMount(async () => {
    await whenReady(3000);
    try {
      await MiniApp.shell('setChrome', { title: 'Рабочий стол', topBar: false, bottomBar: false });
    } catch {
      /* */
    }
    await refresh();
  });
</script>

<header class="top">
  <h1>Рабочий стол</h1>
</header>

<div class="grid">
  <button type="button" class="tile" on:click={() => goto('/market')}>
    <span class="avatar market">M</span>
    <span class="label">Маркет</span>
  </button>
  {#each Object.entries(installed) as [id, a]}
    <button type="button" class="tile" on:click={() => openInstalled(id)}>
      <span class="avatar">{letter(a.name || id)}</span>
      <span class="label">{a.name || id}</span>
    </button>
  {/each}
</div>

{#if err}<p class="err">{err}</p>{/if}
