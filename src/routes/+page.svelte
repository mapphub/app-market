<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { MiniApp, whenReady } from '$lib/MiniApp.js';
  import AppMenu from '$lib/AppMenu.svelte';
  import { canShareApp, setAsHome, startShare, removeApp } from '$lib/appActions.js';

  let installed = {};
  let err = '';
  let toast = '';
  let menu = { open: false, id: '', name: '', canShare: false, x: 0, y: 0 };
  let longPressTimer = null;
  let suppressClick = false;

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
    } catch {
      /* */
    }
  }

  function openRun(id, a) {
    if (suppressClick) {
      suppressClick = false;
      return;
    }
    const q = new URLSearchParams({
      id,
      name: a?.name || id,
      mode: 'run'
    });
    goto('/browser?' + q.toString());
  }

  function openMenu(id, a, clientX, clientY) {
    menu = {
      open: true,
      id,
      name: a?.name || id,
      canShare: canShareApp(a),
      x: Math.max(8, clientX - 20),
      y: Math.max(8, clientY - 8)
    };
  }

  function onPointerDown(e, id, a) {
    if (e.button != null && e.button !== 0) return;
    const cx = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    const cy = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
    clearTimeout(longPressTimer);
    longPressTimer = setTimeout(() => {
      suppressClick = true;
      openMenu(id, a, cx, cy);
      try {
        navigator.vibrate?.(12);
      } catch {
        /* */
      }
    }, 480);
  }

  function onPointerUp() {
    clearTimeout(longPressTimer);
    longPressTimer = null;
  }

  async function doHome() {
    err = '';
    try {
      const r = await setAsHome(menu.id, menu.name);
      if (r?.cancelled) return;
      toast = '«' + menu.name + '» — домашний экран';
      setTimeout(() => (toast = ''), 2500);
    } catch (e) {
      err = e.message || String(e);
    }
  }

  async function doShare() {
    err = '';
    try {
      const r = await startShare(menu.id);
      toast = r?.url ? 'Раздача: ' + r.url : 'Сервер запущен';
      setTimeout(() => (toast = ''), 4000);
    } catch (e) {
      err = e.message || String(e);
    }
  }

  async function doRemove() {
    err = '';
    if (!confirm('Удалить «' + menu.name + '»?')) return;
    try {
      await removeApp(menu.id);
      await refresh();
      toast = 'Удалено';
      setTimeout(() => (toast = ''), 2000);
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
    <button
      type="button"
      class="tile"
      on:click={() => openRun(id, a)}
      on:pointerdown={(e) => onPointerDown(e, id, a)}
      on:pointerup={onPointerUp}
      on:pointerleave={onPointerUp}
      on:pointercancel={onPointerUp}
      on:contextmenu|preventDefault={(e) => openMenu(id, a, e.clientX, e.clientY)}
    >
      <span class="avatar">{letter(a.name || id)}</span>
      <span class="label">{a.name || id}</span>
    </button>
  {/each}
</div>

{#if err}<p class="err">{err}</p>{/if}
{#if toast}<p class="toast">{toast}</p>{/if}

<AppMenu
  open={menu.open}
  canShare={menu.canShare}
  x={menu.x}
  y={menu.y}
  onHome={doHome}
  onShare={doShare}
  onRemove={doRemove}
  onClose={() => (menu = { ...menu, open: false })}
/>
