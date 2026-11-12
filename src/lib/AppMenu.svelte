<script>
  export let open = false;
  export let canShare = false;
  export let x = 0;
  export let y = 0;
  export let onHome = () => {};
  export let onShare = () => {};
  export let onRemove = () => {};
  export let onClose = () => {};

  function stop(e) {
    e.stopPropagation();
  }
</script>

{#if open}
  <button type="button" class="menu-backdrop" aria-label="Закрыть" on:click={onClose}></button>
  <div
    class="menu-pop"
    style="left:{Math.min(x, typeof window !== 'undefined' ? window.innerWidth - 200 : x)}px;top:{y}px"
    role="menu"
    on:click={stop}
    on:keydown={stop}
  >
    <button type="button" role="menuitem" on:click={() => { onHome(); onClose(); }}>
      На домашний экран
    </button>
    {#if canShare}
      <button type="button" role="menuitem" on:click={() => { onShare(); onClose(); }}>
        Раздать
      </button>
    {/if}
    <button type="button" role="menuitem" class="danger" on:click={() => { onRemove(); onClose(); }}>
      Удалить
    </button>
  </div>
{/if}
