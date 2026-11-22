<script lang="ts">
  import { onMount } from 'svelte';
  import {
    cancelWikiSync, getUploadRuntimeStatus, importWikiWorks, listWikiProfiles, loadWikiWorks,
    openWiki, removeLocalWikiWorks, syncWikiWorks, type WikiWorks,
  } from './studio';

  let { onAccountSettings }: { onAccountSettings: () => void } = $props();
  let profiles = $state<string[]>([]);
  let profile = $state('mac-dinh');
  let address = $state('');
  let account = $state('');
  let view = $state<WikiWorks | null>(null);
  let busy = $state<'load' | 'import' | 'sync' | 'remove' | 'open' | null>(null);
  let stopping = $state(false);
  let error = $state('');
  let notice = $state('');
  let scope = $state<'all' | 'local'>('all');
  let query = $state('');
  let page = $state(0);
  let selected = $state(new Set<string>());
  let confirm: HTMLDialogElement;

  const active = $derived(view?.account === account.trim() ? view : null);
  const local = $derived(active?.rows.filter((row) => row.local_only) ?? []);
  const matches = $derived((scope === 'local' ? local : active?.rows ?? []).filter((row) => {
    const search = query.trim().toLocaleLowerCase();
    return row.title.toLocaleLowerCase().includes(search) || row.id.toLocaleLowerCase().includes(search);
  }));
  const pageSize = 40;
  const pages = $derived(Math.max(1, Math.ceil(matches.length / pageSize)));
  const displayed = $derived(matches.slice(page * pageSize, (page + 1) * pageSize));
  const removal = $derived(local.filter((row) => selected.has(row.id)));

  onMount(() => {
    void listWikiProfiles().then((items) => { profiles = items; }).catch((cause) => { error = String(cause); });
    void getUploadRuntimeStatus().then(async (status) => {
      if (!account && !busy && status.verifiedAccount) {
        account = status.verifiedAccount;
        await refresh();
      }
    }).catch(() => {});
  });

  function resetFilter() {
    selected = new Set();
    page = 0;
    query = '';
    scope = 'all';
  }

  async function run(operation: NonNullable<typeof busy>, action: () => Promise<void>) {
    if (busy) return;
    busy = operation;
    error = '';
    notice = '';
    try { await action(); }
    catch (cause) { error = String(cause); }
    finally { busy = null; stopping = false; }
  }

  function refresh() {
    return run('load', async () => {
      view = await loadWikiWorks(account.trim());
      resetFilter();
    });
  }

  function importCache() {
    return run('import', async () => {
      const next = await importWikiWorks();
      if (!next) return;
      view = next;
      account = next.account;
      resetFilter();
      notice = 'Đã nhập bản sao danh sách. Tải toàn bộ Works để đối chiếu truyện local.';
    });
  }

  function fullSync() {
    return run('sync', async () => {
      const next = await syncWikiWorks(account.trim());
      view = next;
      resetFilter();
      const extra = next.rows.filter((row) => row.local_only).length;
      scope = extra ? 'local' : 'all';
      notice = extra
        ? `Đã tải đủ ${next.server_count} truyện từ Works. Có ${extra} truyện chỉ còn trên máy.`
        : `Đã tải đủ ${next.server_count} truyện từ Works.`;
    });
  }

  async function cancel() {
    stopping = true;
    try { await cancelWikiSync(); }
    catch (cause) { stopping = false; error = String(cause); }
  }

  function toggle(id: string, checked: boolean) {
    const next = new Set(selected);
    if (checked) next.add(id);
    else next.delete(id);
    selected = next;
  }

  function remove() {
    confirm.close();
    const ids = removal.map((row) => row.id);
    return run('remove', async () => {
      view = await removeLocalWikiWorks(account.trim(), ids);
      resetFilter();
      notice = `Đã xóa ${ids.length} truyện khỏi danh sách trên máy.`;
    });
  }

  function open(link = address) {
    return run('open', async () => {
      await openWiki(profile.trim(), link);
      profiles = await listWikiProfiles();
      notice = `Đã mở Wikidich cho hồ sơ ${profile.trim()}.`;
    });
  }
</script>

<section class="heading">
  <div>
    <h1>Wikidich</h1>
    <p>Quản lý danh sách tác phẩm và đối chiếu với Works.</p>
  </div>
  <button class="button" type="button" disabled={busy !== null} onclick={onAccountSettings}>Cài đặt tài khoản</button>
</section>

<div class="workspace">
  <aside aria-label="Nguồn tác phẩm Wikidich">
    <h2>Works</h2>
    <form onsubmit={(event) => { event.preventDefault(); void refresh(); }}>
      <label for="wiki-account">ID tài khoản</label>
      <input id="wiki-account" bind:value={account} oninput={resetFilter} disabled={busy !== null} maxlength="120" autocomplete="off" />
      <div class="wiki-controls">
        <button class="button" type="submit" disabled={busy !== null || !account.trim()}>Mở danh sách trên máy</button>
        {#if busy === 'sync'}
          <button class="button" type="button" disabled={stopping} onclick={cancel}>{stopping ? 'Đang dừng…' : 'Dừng tải'}</button>
        {:else}
          <button class="button primary" type="button" disabled={busy !== null || !account.trim()} onclick={fullSync}>Tải toàn bộ Works</button>
        {/if}
      </div>
    </form>
    <button class="button subtle wiki-import" type="button" disabled={busy !== null} onclick={importCache}>Nhập cache Python…</button>
    <details>
      <summary>Trình duyệt Wikidich</summary>
      <form onsubmit={(event) => { event.preventDefault(); void open(); }}>
        <label for="wiki-profile">Hồ sơ trình duyệt</label>
        <input id="wiki-profile" list="wiki-profiles" bind:value={profile} disabled={busy !== null} maxlength="32" autocomplete="off" />
        <datalist id="wiki-profiles">
          {#each profiles as item (item)}<option value={item}></option>{/each}
        </datalist>
        <label for="wiki-address">Địa chỉ Wikidich</label>
        <input id="wiki-address" type="url" bind:value={address} placeholder="https://wikicv.org/" disabled={busy !== null} />
        <button class="button wiki-import" type="submit" disabled={busy !== null || !profile.trim()}>Mở Wikidich</button>
      </form>
    </details>
  </aside>

  <section class="proof" aria-label="Danh sách tác phẩm" aria-busy={busy !== null}>
    <header class="proof-head">
      <h2>Danh sách tác phẩm</h2>
      {#if active}
        <span class="field-help">{active.rows.length} trên máy{active.server_count === null ? '' : ` · ${active.server_count} trong Works`}</span>
      {/if}
    </header>
    {#if error}<p class="notice error" role="alert">{error}</p>{/if}
    {#if notice || busy === 'sync'}<p class="notice" role="status">{busy === 'sync' ? 'Đang tải từng trang Works…' : notice}</p>{/if}
    {#if active}
      <div class="wiki-filters">
        <label>
          <span class="visually-hidden">Tìm truyện</span>
          <input type="search" placeholder="Tìm theo tên hoặc ID" bind:value={query} oninput={() => { page = 0; }} />
        </label>
        {#if active.server_count !== null}
          <label class="wiki-check"><input type="checkbox" checked={scope === 'local'} onchange={(event) => {
            scope = event.currentTarget.checked ? 'local' : 'all'; page = 0;
          }} /> Chỉ trên máy ({local.length})</label>
        {/if}
      </div>
      <div class="proof-body wiki-list">
        {#each displayed as row (row.id)}
          <div class="wiki-row">
            {#if row.local_only}
              <input type="checkbox" aria-label={`Chọn ${row.title} (${row.id})`} checked={selected.has(row.id)}
                disabled={busy !== null} onchange={(event) => toggle(row.id, event.currentTarget.checked)} />
            {/if}
            <div class="wiki-book">
              <strong>{row.title}</strong>
              <small>ID {row.id}{row.chapter_count === null ? '' : ` · ${row.chapter_count} chương`}{row.local_only ? ' · Chỉ trên máy' : ''}</small>
            </div>
            {#if row.url}
              <button class="button subtle" type="button" disabled={busy !== null || !profile.trim()} onclick={() => void open(row.url ?? '')}>Mở truyện</button>
            {/if}
          </div>
        {:else}
          <div class="empty"><h3>{scope === 'local' ? 'Không có truyện dư trên máy' : 'Không có truyện để hiển thị'}</h3></div>
        {/each}
      </div>
      <footer class="proof-footer">
        {#if pages > 1}
          <div class="proof-actions">
            <button class="button" type="button" disabled={page === 0} onclick={() => (page -= 1)}>Trước</button>
            <span>{page + 1} / {pages}</span>
            <button class="button" type="button" disabled={page + 1 >= pages} onclick={() => (page += 1)}>Sau</button>
          </div>
        {:else}<span>{matches.length} truyện</span>{/if}
        {#if local.length}
          <button class="button" type="button" disabled={busy !== null || !removal.length} onclick={() => confirm.showModal()}>
            Xóa khỏi máy{removal.length ? ` (${removal.length})` : ''}
          </button>
        {/if}
      </footer>
    {:else}
      <div class="proof-body empty"><h3>Mở danh sách đã lưu hoặc tải Works</h3></div>
    {/if}
  </section>
</div>

<dialog bind:this={confirm} aria-labelledby="wiki-remove-title">
  <h2 id="wiki-remove-title">Xóa {removal.length} truyện khỏi danh sách trên máy?</h2>
  <p>Thao tác áp dụng cho cache Wikidich của Novel Studio.</p>
  <ul class="wiki-remove-list">
    {#each removal as row (row.id)}<li>{row.title} <small>({row.id})</small></li>{/each}
  </ul>
  <div class="dialog-actions">
    <button class="button" type="button" onclick={() => confirm.close()}>Hủy</button>
    <button class="button primary" type="button" onclick={remove}>Xác nhận xóa</button>
  </div>
</dialog>

<style>
  .wiki-controls { display: grid; gap: 8px; margin-top: 12px; }
  .wiki-import { margin-top: 10px; width: 100%; }
  details { margin-top: 16px; padding-top: 12px; border-top: 1px solid var(--line); }
  summary { cursor: pointer; color: var(--accent); padding-block: 6px; }
  .wiki-filters, .wiki-row { display: flex; gap: 12px; align-items: center; padding: 10px var(--space-panel); border-bottom: 1px solid var(--line); }
  .wiki-filters { flex-wrap: wrap; }
  .wiki-filters label, .wiki-check { margin: 0; }
  .wiki-check { display: flex; gap: 6px; align-items: center; }
  .wiki-book { flex: 1; min-width: 0; overflow-wrap: anywhere; }
  .wiki-book small { display: block; margin-top: 3px; color: var(--muted); }
  .wiki-list { min-height: 180px; }
  .wiki-remove-list { max-height: 30vh; overflow: auto; overflow-wrap: anywhere; }
  .visually-hidden { position: absolute; clip-path: inset(50%); width: 1px; height: 1px; overflow: hidden; }
</style>
