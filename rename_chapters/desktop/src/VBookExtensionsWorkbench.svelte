<script lang="ts">
  import { onMount } from 'svelte';
  import {
    vbookAddRepo,
    vbookGetSnapshot,
    vbookInstallFromUrl,
    vbookPickAndInstallLocalZip,
    vbookRefreshRepos,
    vbookRemoveRepo,
    vbookSaveExtensionConfig,
    vbookTogglePinExtension,
    vbookToggleRepo,
    vbookUninstallExtension,
    vbookUpdateAll,
    vbookUpdateExtension,
    type CatalogExtensionView,
    type ExtensionRepo,
    type ExtensionUpdate,
    type InstalledExtension,
    type VBookWorkspaceSnapshot,
  } from './studio';

  type Props = {
    parentBusy?: boolean;
  };

  type TabId = 'updates' | 'installed' | 'catalog';

  const CATALOG_PAGE_SIZE = 40;

  let { parentBusy = false }: Props = $props();

  let snapshot = $state<VBookWorkspaceSnapshot | null>(null);
  let activeTab = $state<TabId>('installed');
  let busy = $state<string | null>(null);
  let error = $state('');
  let notice = $state('');

  let installedSearch = $state('');
  let catalogSearch = $state('');
  let filterType = $state('all');
  let filterLang = $state('all');
  let filterAuthor = $state('all');
  let showNsfw = $state(false);
  let catalogPage = $state(1);

  let reposDialog = $state<HTMLDialogElement | undefined>(undefined);
  let repoInputUrl = $state('');
  let directZipUrl = $state('');

  let configDialog = $state<HTMLDialogElement | undefined>(undefined);
  let configTarget = $state<InstalledExtension | null>(null);
  let configDraft = $state<Record<string, string | number | boolean>>({});

  let isBusy = $derived(parentBusy || busy !== null);
  let repos: ExtensionRepo[] = $derived(snapshot?.repos ?? []);
  let updates: ExtensionUpdate[] = $derived(snapshot?.updates ?? []);
  let installed: InstalledExtension[] = $derived(snapshot?.installed ?? []);
  let catalog: CatalogExtensionView[] = $derived(snapshot?.catalog ?? []);

  let updateByInstalledId = $derived(
    new Map(updates.map((u) => [u.installed_id, u])),
  );

  let filteredInstalled = $derived.by(() => {
    const q = installedSearch.trim().toLowerCase();
    if (!q) return installed;
    return installed.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.author.toLowerCase().includes(q) ||
        item.host.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q),
    );
  });

  let filteredCatalog = $derived.by(() => {
    const q = catalogSearch.trim().toLowerCase();
    return catalog.filter((entry) => {
      const r = entry.remote;
      if (!showNsfw && r.is_nsfw) return false;
      if (filterType !== 'all' && r.ext_type !== filterType) return false;
      if (filterLang !== 'all' && r.language !== filterLang) return false;
      if (filterAuthor !== 'all' && r.author !== filterAuthor) return false;
      if (!q) return true;
      return (
        r.name.toLowerCase().includes(q) ||
        r.author.toLowerCase().includes(q) ||
        r.host.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q)
      );
    });
  });

  let totalCatalogPages = $derived(
    Math.max(1, Math.ceil(filteredCatalog.length / CATALOG_PAGE_SIZE)),
  );
  let safeCatalogPage = $derived(Math.min(catalogPage, totalCatalogPages));
  let pagedCatalog = $derived(
    filteredCatalog.slice(
      (safeCatalogPage - 1) * CATALOG_PAGE_SIZE,
      safeCatalogPage * CATALOG_PAGE_SIZE,
    ),
  );

  let configFields = $derived.by(() => {
    if (!configTarget) return [];
    const schema = configTarget.config_schema ?? {};
    const keys = Array.from(
      new Set([
        ...Object.keys(schema),
        ...Object.keys(configTarget.user_config ?? {}),
      ]),
    );
    return keys.map((key) => {
      const raw = schema[key];
      const obj =
        raw && typeof raw === 'object' && !Array.isArray(raw)
          ? (raw as Record<string, unknown>)
          : {};
      const formatRaw = String(obj.format ?? obj.type ?? 'text').toLowerCase();
      const label = String(obj.prompt ?? obj.title ?? obj.name ?? key);
      const options = Array.isArray(obj.items)
        ? obj.items.map((item) => String(item))
        : Array.isArray(obj.options)
          ? obj.options.map((item) => String(item))
          : null;
      const defaultValue = obj.default ?? '';
      return {
        key,
        label,
        format: options
          ? ('select' as const)
          : formatRaw === 'switch' || formatRaw === 'boolean' || formatRaw === 'bool'
            ? ('boolean' as const)
            : formatRaw === 'number'
              ? ('number' as const)
              : ('text' as const),
        options,
        defaultValue,
      };
    });
  });

  function typeLabel(raw: string): string {
    switch (raw) {
      case 'novel':
        return 'Tiểu thuyết';
      case 'comic':
        return 'Truyện tranh';
      case 'chinese_novel':
        return 'Tiểu thuyết Trung';
      case 'video':
        return 'Video';
      case 'translate':
        return 'Dịch thuật';
      case 'ai':
        return 'AI';
      default:
        return 'Khác';
    }
  }

  function initials(name: string): string {
    const words = name.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return 'VB';
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
  }

  function hasConfig(ext: InstalledExtension): boolean {
    return (
      Object.keys(ext.config_schema ?? {}).length > 0 ||
      Object.keys(ext.user_config ?? {}).length > 0
    );
  }

  async function loadSnapshot() {
    busy = 'load';
    error = '';
    try {
      snapshot = await vbookGetSnapshot();
    } catch (cause) {
      error = String(cause);
    } finally {
      busy = null;
    }
  }

  onMount(() => {
    void loadSnapshot();
  });

  async function refreshAllRepos() {
    if (isBusy) return;
    busy = 'refresh';
    error = '';
    notice = '';
    try {
      const res = await vbookRefreshRepos();
      snapshot = res.snapshot;
      if (res.errors.length > 0) {
        error = res.errors.map((e) => `${e.repo_url}: ${e.message}`).join(' · ');
      }
      notice = `Đã đồng bộ ${res.fetched_repos} kho (${res.total_remote} nguồn · ${res.snapshot.updates.length} bản cập nhật mới).`;
    } catch (cause) {
      error = String(cause);
    } finally {
      busy = null;
    }
  }

  async function installFromCatalog(view: CatalogExtensionView) {
    if (isBusy) return;
    busy = `install:${view.remote.id}`;
    error = '';
    notice = '';
    try {
      const ext = await vbookInstallFromUrl(
        view.remote.path,
        view.installed_id ?? null,
      );
      snapshot = await vbookGetSnapshot();
      notice = view.update_available
        ? `Đã cập nhật ${ext.name} lên v${ext.version} (giữ nguyên cấu hình).`
        : `Đã cài đặt ${ext.name} (v${ext.version}).`;
    } catch (cause) {
      error = String(cause);
    } finally {
      busy = null;
    }
  }

  async function updateSingle(installedId: string, name: string) {
    if (isBusy) return;
    busy = `update:${installedId}`;
    error = '';
    notice = '';
    try {
      const ext = await vbookUpdateExtension(installedId);
      snapshot = await vbookGetSnapshot();
      notice = `Đã cập nhật ${name} lên v${ext.version}.`;
    } catch (cause) {
      error = String(cause);
    } finally {
      busy = null;
    }
  }

  async function updateAll() {
    if (isBusy || updates.length === 0) return;
    busy = 'update-all';
    error = '';
    notice = '';
    try {
      const res = await vbookUpdateAll();
      snapshot = res.snapshot;
      if (res.failed.length > 0) {
        error = res.failed.map((f) => f.message).join(' · ');
      }
      notice = `Đã cập nhật ${res.updated_ids.length} nguồn mở rộng (giữ nguyên cấu hình & ghim).`;
    } catch (cause) {
      error = String(cause);
    } finally {
      busy = null;
    }
  }

  async function pickLocalZip() {
    if (isBusy) return;
    busy = 'local';
    error = '';
    notice = '';
    try {
      const ext = await vbookPickAndInstallLocalZip();
      if (!ext) return;
      snapshot = await vbookGetSnapshot();
      activeTab = 'installed';
      notice = `Đã cài nguồn cục bộ ${ext.name} (v${ext.version}).`;
    } catch (cause) {
      error = String(cause);
    } finally {
      busy = null;
    }
  }

  async function togglePin(ext: InstalledExtension) {
    if (isBusy) return;
    busy = `pin:${ext.id}`;
    error = '';
    try {
      snapshot = await vbookTogglePinExtension(ext.id, !ext.pinned);
    } catch (cause) {
      error = String(cause);
    } finally {
      busy = null;
    }
  }

  async function uninstall(ext: InstalledExtension) {
    if (isBusy) return;
    busy = `remove:${ext.id}`;
    error = '';
    notice = '';
    try {
      snapshot = await vbookUninstallExtension(ext.id);
      notice = `Đã gỡ nguồn ${ext.name}.`;
    } catch (cause) {
      error = String(cause);
    } finally {
      busy = null;
    }
  }

  function openReposDialog() {
    error = '';
    reposDialog?.showModal();
  }

  async function addRepoSubmit() {
    const url = repoInputUrl.trim();
    if (!url || isBusy) return;
    busy = 'add-repo';
    error = '';
    try {
      snapshot = await vbookAddRepo(url);
      repoInputUrl = '';
      notice = `Đã thêm kho nguồn ${url}. Bấm Làm mới kho để tải danh sách.`;
    } catch (cause) {
      error = String(cause);
    } finally {
      busy = null;
    }
  }

  async function toggleRepo(repo: ExtensionRepo) {
    if (isBusy) return;
    busy = `repo:${repo.url}`;
    error = '';
    try {
      snapshot = await vbookToggleRepo(repo.url, !repo.enabled);
    } catch (cause) {
      error = String(cause);
    } finally {
      busy = null;
    }
  }

  async function removeRepo(repo: ExtensionRepo) {
    if (isBusy || repo.locked) return;
    busy = `del-repo:${repo.url}`;
    error = '';
    try {
      snapshot = await vbookRemoveRepo(repo.url);
    } catch (cause) {
      error = String(cause);
    } finally {
      busy = null;
    }
  }

  async function installDirectZipUrl() {
    const url = directZipUrl.trim();
    if (!url || isBusy) return;
    busy = 'direct-zip';
    error = '';
    notice = '';
    try {
      const ext = await vbookInstallFromUrl(url, null);
      snapshot = await vbookGetSnapshot();
      directZipUrl = '';
      reposDialog?.close();
      activeTab = 'installed';
      notice = `Đã cài đặt ${ext.name} (v${ext.version}) từ URL.`;
    } catch (cause) {
      error = String(cause);
    } finally {
      busy = null;
    }
  }

  function openConfigDialog(ext: InstalledExtension) {
    configTarget = ext;
    const nextDraft: Record<string, string | number | boolean> = {};
    const schema = ext.config_schema ?? {};
    const keys = Array.from(
      new Set([...Object.keys(schema), ...Object.keys(ext.user_config ?? {})]),
    );
    for (const key of keys) {
      const userVal = ext.user_config?.[key];
      const raw = schema[key];
      const schemaObj =
        raw && typeof raw === 'object' && !Array.isArray(raw)
          ? (raw as Record<string, unknown>)
          : {};
      const val = userVal !== undefined ? userVal : (schemaObj.default ?? '');
      if (typeof val === 'boolean' || typeof val === 'number' || typeof val === 'string') {
        nextDraft[key] = val;
      } else {
        nextDraft[key] = JSON.stringify(val ?? '');
      }
    }
    configDraft = nextDraft;
    configDialog?.showModal();
  }

  async function saveConfigSubmit() {
    if (!configTarget || isBusy) return;
    busy = 'save-config';
    error = '';
    try {
      const payload: Record<string, unknown> = {};
      for (const field of configFields) {
        const val = configDraft[field.key];
        if (field.format === 'number') {
          const num = Number(val);
          payload[field.key] = Number.isFinite(num) ? num : 0;
        } else if (field.format === 'boolean') {
          payload[field.key] = Boolean(val);
        } else {
          payload[field.key] = String(val ?? '');
        }
      }
      const updated = await vbookSaveExtensionConfig(
        configTarget.id,
        JSON.stringify(payload),
      );
      snapshot = await vbookGetSnapshot();
      configDialog?.close();
      notice = `Đã lưu cấu hình cho ${updated.name}.`;
    } catch (cause) {
      error = String(cause);
    } finally {
      busy = null;
    }
  }
</script>

<section class="heading">
  <div>
    <h1>Nguồn mở rộng VBook</h1>
    <p>
      Cài đặt từ kho hoặc gói ZIP chuẩn vbook-beta, cập nhật khi có phiên bản lớn hơn và giữ nguyên cấu hình người dùng.
    </p>
  </div>
  <div class="proof-actions heading-actions">
    <button class="button" type="button" onclick={openReposDialog} disabled={isBusy}>
      Kho nguồn (<span class="num">{repos.length}</span>)
    </button>
    <button class="button" type="button" onclick={pickLocalZip} disabled={isBusy}>
      {busy === 'local' ? 'Đang cài…' : 'Cài từ ZIP…'}
    </button>
    <button class="button primary" type="button" onclick={refreshAllRepos} disabled={isBusy}>
      {busy === 'refresh' ? 'Đang làm mới…' : 'Làm mới kho'}
    </button>
  </div>
</section>

{#if error}
  <div class="vbook-banner warn" role="alert">{error}</div>
{:else if notice}
  <div class="vbook-banner info" role="status">{notice}</div>
{/if}

<div class="vbook-tabbar">
  <div class="vbook-tabs" role="tablist" aria-label="Danh mục nguồn VBook">
    <button
      type="button"
      role="tab"
      aria-selected={activeTab === 'updates'}
      class:active={activeTab === 'updates'}
      onclick={() => (activeTab = 'updates')}
    >
      Cần cập nhật <span class="tab-count num">{updates.length}</span>
    </button>
    <button
      type="button"
      role="tab"
      aria-selected={activeTab === 'installed'}
      class:active={activeTab === 'installed'}
      onclick={() => (activeTab = 'installed')}
    >
      Đã cài <span class="tab-count num">{installed.length}</span>
    </button>
    <button
      type="button"
      role="tab"
      aria-selected={activeTab === 'catalog'}
      class:active={activeTab === 'catalog'}
      onclick={() => (activeTab = 'catalog')}
    >
      Kho nguồn <span class="tab-count num">{catalog.length}</span>
    </button>
  </div>
  {#if activeTab === 'updates' && updates.length > 0}
    <button class="button primary" type="button" onclick={updateAll} disabled={isBusy}>
      {busy === 'update-all' ? 'Đang cập nhật…' : `Cập nhật tất cả (${updates.length})`}
    </button>
  {/if}
</div>

<section class="vbook-panel">
  {#if activeTab === 'updates'}
    {#if updates.length === 0}
      <div class="empty">
        <div class="paper" aria-hidden="true"><span></span><span></span><span></span></div>
        <h3>Mọi nguồn đã ở phiên bản mới nhất</h3>
        <p>Khi kho có phiên bản lớn hơn bản đã cài, danh sách cần cập nhật sẽ hiển thị tại đây.</p>
        <div class="empty-actions">
          <button class="button" type="button" onclick={refreshAllRepos} disabled={isBusy}>Làm mới kho</button>
          <button class="button" type="button" onclick={() => (activeTab = 'catalog')}>Mở Kho nguồn</button>
        </div>
      </div>
    {:else}
      <div class="ext-grid">
        {#each updates as item (item.installed_id)}
          <article class="ext-card">
            <div class="ext-head">
              <div class="ext-avatar" aria-hidden="true">{initials(item.remote.name)}</div>
              <div class="ext-title-wrap">
                <div class="ext-name-row">
                  <strong class="ext-name">{item.remote.name}</strong>
                  <span class="badge accent num">v{item.installed_version} → v{item.remote_version}</span>
                  <span class="badge muted">{typeLabel(item.remote.ext_type)}</span>
                </div>
                <div class="ext-meta">
                  <span>{item.remote.host || item.remote.source}</span>
                  {#if item.remote.author}<span>· {item.remote.author}</span>{/if}
                  {#if item.remote.locale}<span>· {item.remote.locale}</span>{/if}
                </div>
              </div>
            </div>
            {#if item.remote.description}
              <p class="ext-desc">{item.remote.description}</p>
            {/if}
            <div class="ext-foot">
              <button
                class="button primary mini-action"
                type="button"
                onclick={() => updateSingle(item.installed_id, item.remote.name)}
                disabled={isBusy}
              >
                {busy === `update:${item.installed_id}` ? 'Đang cập nhật…' : 'Cập nhật'}
              </button>
            </div>
          </article>
        {/each}
      </div>
    {/if}
  {:else if activeTab === 'installed'}
    {#if installed.length > 0}
      <div class="vbook-filters">
        <input
          type="search"
          bind:value={installedSearch}
          placeholder="Tìm trong nguồn đã cài…"
          aria-label="Tìm trong nguồn đã cài"
        />
        <span class="filter-count num">{filteredInstalled.length} / {installed.length} nguồn</span>
      </div>
    {/if}
    {#if filteredInstalled.length === 0}
      <div class="empty">
        <div class="paper" aria-hidden="true"><span></span><span></span><span></span></div>
        <h3>{installed.length === 0 ? 'Chưa có nguồn mở rộng nào được cài' : 'Không khớp từ khóa tìm kiếm'}</h3>
        <p>
          {installed.length === 0
            ? 'Bấm Làm mới kho và chọn nguồn trong Kho nguồn, hoặc cài trực tiếp từ gói ZIP.'
            : 'Thử xóa bộ lọc tìm kiếm để xem lại danh sách đã cài.'}
        </p>
        {#if installed.length === 0}
          <div class="empty-actions">
            <button class="button primary" type="button" onclick={() => (activeTab = 'catalog')}>Xem Kho nguồn</button>
            <button class="button" type="button" onclick={pickLocalZip} disabled={isBusy}>Cài từ ZIP…</button>
          </div>
        {/if}
      </div>
    {:else}
      <div class="ext-grid">
        {#each filteredInstalled as ext (ext.id)}
          {@const pendingUpdate = updateByInstalledId.get(ext.id)}
          <article class="ext-card" class:pinned={ext.pinned}>
            <div class="ext-head">
              <div class="ext-avatar" aria-hidden="true">{initials(ext.name)}</div>
              <div class="ext-title-wrap">
                <div class="ext-name-row">
                  <strong class="ext-name">{ext.name}</strong>
                  <span class="badge num">v{ext.version}</span>
                  <span class="badge muted">{typeLabel(ext.ext_type)}</span>
                  {#if ext.pinned}<span class="badge accent">Đã ghim</span>{/if}
                  {#if ext.is_local}<span class="badge muted">Cục bộ</span>{/if}
                  {#if pendingUpdate}
                    <span class="badge warn num">Có bản v{pendingUpdate.remote_version}</span>
                  {/if}
                </div>
                <div class="ext-meta">
                  <span>{ext.host || ext.source}</span>
                  {#if ext.author}<span>· {ext.author}</span>{/if}
                  {#if ext.locale}<span>· {ext.locale}</span>{/if}
                </div>
              </div>
            </div>
            {#if ext.description}
              <p class="ext-desc">{ext.description}</p>
            {/if}
            <div class="ext-foot">
              <button class="mini-btn" type="button" onclick={() => togglePin(ext)} disabled={isBusy}>
                {ext.pinned ? 'Bỏ ghim' : 'Ghim'}
              </button>
              {#if hasConfig(ext)}
                <button class="mini-btn" type="button" onclick={() => openConfigDialog(ext)} disabled={isBusy}>
                  Cấu hình
                </button>
              {/if}
              {#if pendingUpdate}
                <button
                  class="mini-btn accent-btn"
                  type="button"
                  onclick={() => updateSingle(ext.id, ext.name)}
                  disabled={isBusy}
                >
                  Cập nhật v{pendingUpdate.remote_version}
                </button>
              {/if}
              <button class="mini-btn danger" type="button" onclick={() => uninstall(ext)} disabled={isBusy}>
                Gỡ
              </button>
            </div>
          </article>
        {/each}
      </div>
    {/if}
  {:else}
    <div class="vbook-filters">
      <input
        type="search"
        bind:value={catalogSearch}
        oninput={() => (catalogPage = 1)}
        placeholder="Tìm tên nguồn, tác giả, domain…"
        aria-label="Tìm trong kho nguồn"
      />
      <select bind:value={filterType} onchange={() => (catalogPage = 1)} aria-label="Lọc theo loại">
        <option value="all">Mọi loại</option>
        {#each snapshot?.types ?? [] as t (t)}
          <option value={t}>{typeLabel(t)}</option>
        {/each}
      </select>
      <select bind:value={filterLang} onchange={() => (catalogPage = 1)} aria-label="Lọc theo ngôn ngữ">
        <option value="all">Mọi ngôn ngữ</option>
        {#each snapshot?.languages ?? [] as lang (lang)}
          <option value={lang}>{lang.toUpperCase()}</option>
        {/each}
      </select>
      <select bind:value={filterAuthor} onchange={() => (catalogPage = 1)} aria-label="Lọc theo tác giả">
        <option value="all">Mọi tác giả</option>
        {#each snapshot?.authors ?? [] as author (author)}
          <option value={author}>{author}</option>
        {/each}
      </select>
      <label class="nsfw-toggle">
        <input type="checkbox" bind:checked={showNsfw} onchange={() => (catalogPage = 1)} />
        <span>Hiện NSFW</span>
      </label>
      <span class="filter-count num">{filteredCatalog.length} nguồn</span>
    </div>

    {#if pagedCatalog.length === 0}
      <div class="empty">
        <div class="paper" aria-hidden="true"><span></span><span></span><span></span></div>
        <h3>{catalog.length === 0 ? 'Chưa có dữ liệu từ kho nguồn' : 'Không tìm thấy nguồn phù hợp'}</h3>
        <p>
          {catalog.length === 0
            ? 'Bấm Làm mới kho để tải danh sách từ các kho đang bật.'
            : 'Thử nới lỏng bộ lọc hoặc bật Hiện NSFW.'}
        </p>
        {#if catalog.length === 0}
          <button class="button primary" type="button" onclick={refreshAllRepos} disabled={isBusy}>
            Làm mới kho ngay
          </button>
        {/if}
      </div>
    {:else}
      <div class="ext-grid">
        {#each pagedCatalog as entry (entry.remote.id)}
          {@const r = entry.remote}
          <article class="ext-card">
            <div class="ext-head">
              <div class="ext-avatar" aria-hidden="true">{initials(r.name)}</div>
              <div class="ext-title-wrap">
                <div class="ext-name-row">
                  <strong class="ext-name">{r.name}</strong>
                  <span class="badge num">v{r.version}</span>
                  <span class="badge muted">{typeLabel(r.ext_type)}</span>
                  {#if r.is_nsfw}<span class="badge warn">18+</span>{/if}
                </div>
                <div class="ext-meta">
                  <span>{r.host || r.source}</span>
                  {#if r.author}<span>· {r.author}</span>{/if}
                  {#if r.locale}<span>· {r.locale}</span>{/if}
                </div>
              </div>
            </div>
            {#if r.description}
              <p class="ext-desc">{r.description}</p>
            {/if}
            <div class="ext-foot">
              {#if !entry.installed}
                <button
                  class="button primary mini-action"
                  type="button"
                  onclick={() => installFromCatalog(entry)}
                  disabled={isBusy}
                >
                  {busy === `install:${r.id}` ? 'Đang cài…' : 'Cài đặt'}
                </button>
              {:else if entry.update_available}
                <button
                  class="button primary mini-action"
                  type="button"
                  onclick={() => installFromCatalog(entry)}
                  disabled={isBusy}
                >
                  {busy === `install:${r.id}`
                    ? 'Đang cập nhật…'
                    : `Cập nhật v${entry.installed_version} → v${r.version}`}
                </button>
              {:else}
                <span class="badge accent">Đã cài (v{entry.installed_version})</span>
              {/if}
            </div>
          </article>
        {/each}
      </div>

      {#if totalCatalogPages > 1}
        <div class="vbook-pager">
          <button
            class="mini-btn"
            type="button"
            disabled={safeCatalogPage <= 1}
            onclick={() => (catalogPage = Math.max(1, safeCatalogPage - 1))}
          >
            Trang trước
          </button>
          <span class="num">Trang {safeCatalogPage} / {totalCatalogPages}</span>
          <button
            class="mini-btn"
            type="button"
            disabled={safeCatalogPage >= totalCatalogPages}
            onclick={() => (catalogPage = Math.min(totalCatalogPages, safeCatalogPage + 1))}
          >
            Trang sau
          </button>
        </div>
      {/if}
    {/if}
  {/if}
</section>

<dialog id="vbook-repos-dialog" class="vbook-dialog" bind:this={reposDialog}>
  <h3>Quản lý kho nguồn VBook</h3>
  <p>Thêm liên kết tệp <code>plugin.json</code> theo chuẩn repo VBook, hoặc cài nhanh từ một URL gói ZIP.</p>

  <div class="repo-form-row">
    <input
      id="vbook-repo-url-input"
      type="url"
      bind:value={repoInputUrl}
      placeholder="https://.../plugin.json"
      aria-label="URL file plugin.json của kho"
    />
    <button class="button primary" type="button" onclick={addRepoSubmit} disabled={isBusy || !repoInputUrl.trim()}>
      {busy === 'add-repo' ? 'Đang thêm…' : 'Thêm kho'}
    </button>
  </div>

  <ul class="repo-list">
    {#each repos as repo (repo.url)}
      <li>
        <div class="repo-item-row">
          <label class="repo-check">
            <input
              type="checkbox"
              checked={repo.enabled}
              onchange={() => toggleRepo(repo)}
              disabled={isBusy}
            />
            <div>
              <strong>{repo.name}</strong>
              <span class="repo-url">{repo.url}</span>
              <span class="repo-stat num">
                {repo.plugin_count} nguồn
                {#if repo.last_error}· Lỗi: {repo.last_error}{/if}
              </span>
            </div>
          </label>
          {#if !repo.locked}
            <button class="mini-btn danger" type="button" onclick={() => removeRepo(repo)} disabled={isBusy}>
              Xóa
            </button>
          {/if}
        </div>
      </li>
    {/each}
  </ul>

  <div class="direct-zip-box">
    <label for="vbook-direct-zip-input">Cài trực tiếp từ URL gói <code>.zip</code></label>
    <div class="repo-form-row">
      <input
        id="vbook-direct-zip-input"
        type="url"
        bind:value={directZipUrl}
        placeholder="https://.../extension.zip"
      />
      <button class="button" type="button" onclick={installDirectZipUrl} disabled={isBusy || !directZipUrl.trim()}>
        {busy === 'direct-zip' ? 'Đang cài…' : 'Cài URL'}
      </button>
    </div>
  </div>

  <div class="dialog-actions">
    <button class="button" type="button" onclick={() => reposDialog?.close()}>Đóng</button>
  </div>
</dialog>

<dialog id="vbook-config-dialog" class="vbook-dialog" bind:this={configDialog}>
  <h3>Cấu hình nguồn: {configTarget?.name ?? ''}</h3>
  <p>Các thiết lập này được giữ nguyên mỗi khi extension được cập nhật phiên bản mới.</p>

  <div class="config-fields">
    {#each configFields as field (field.key)}
      <div class="config-row">
        <label for={`cfg-${field.key}`}>{field.label}</label>
        {#if field.format === 'boolean'}
          <input
            id={`cfg-${field.key}`}
            type="checkbox"
            checked={Boolean(configDraft[field.key])}
            onchange={(e) => {
              configDraft = { ...configDraft, [field.key]: (e.currentTarget as HTMLInputElement).checked };
            }}
          />
        {:else if field.format === 'select' && field.options}
          <select
            id={`cfg-${field.key}`}
            value={String(configDraft[field.key] ?? '')}
            onchange={(e) => {
              configDraft = { ...configDraft, [field.key]: (e.currentTarget as HTMLSelectElement).value };
            }}
          >
            {#each field.options as opt (opt)}
              <option value={opt}>{opt}</option>
            {/each}
          </select>
        {:else if field.format === 'number'}
          <input
            id={`cfg-${field.key}`}
            class="cfg-input"
            type="number"
            value={String(configDraft[field.key] ?? '')}
            oninput={(e) => {
              configDraft = { ...configDraft, [field.key]: (e.currentTarget as HTMLInputElement).value };
            }}
          />
        {:else}
          <input
            id={`cfg-${field.key}`}
            class="cfg-input"
            type="text"
            value={String(configDraft[field.key] ?? '')}
            oninput={(e) => {
              configDraft = { ...configDraft, [field.key]: (e.currentTarget as HTMLInputElement).value };
            }}
          />
        {/if}
      </div>
    {/each}
  </div>

  <div class="dialog-actions">
    <button class="button" type="button" onclick={() => configDialog?.close()} disabled={isBusy}>Hủy</button>
    <button class="button primary" type="button" onclick={saveConfigSubmit} disabled={isBusy}>
      {busy === 'save-config' ? 'Đang lưu…' : 'Lưu cấu hình'}
    </button>
  </div>
</dialog>

<style>
  .heading-actions {
    flex-shrink: 0;
  }

  .num {
    font-variant-numeric: tabular-nums;
  }

  .vbook-banner {
    margin: 0 0 14px;
    padding: 10px 14px;
    border-radius: var(--radius-md);
    border: 1px solid var(--line);
    font-size: 13px;
    line-height: 1.45;
    overflow-wrap: anywhere;
  }

  .vbook-banner.info {
    background: var(--accent-soft);
    border-color: color-mix(in srgb, var(--accent) 30%, var(--line));
    color: var(--ink);
  }

  .vbook-banner.warn {
    background: var(--warning-bg);
    border-color: var(--warning-border);
    color: var(--warning);
  }

  .vbook-tabbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 14px;
  }

  .vbook-tabs {
    display: inline-flex;
    flex-wrap: wrap;
    gap: 6px;
    padding: 4px;
    border-radius: var(--radius-md);
    border: 1px solid var(--line);
    background: var(--sheet);
  }

  .vbook-tabs button {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    min-height: 32px;
    padding: 4px 12px;
    border: 1px solid transparent;
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--muted);
    font-size: 13px;
    font-weight: 600;
    transition: background-color var(--motion-fast) var(--ease-out), color var(--motion-fast) var(--ease-out);
  }

  .vbook-tabs button.active {
    background: var(--selection);
    color: var(--ink);
    border-color: color-mix(in srgb, var(--accent) 28%, var(--line));
  }

  .tab-count {
    padding: 1px 6px;
    border-radius: 999px;
    font-size: 11.5px;
    background: var(--inset);
    color: var(--ink);
    border: 1px solid var(--line);
  }

  .vbook-panel {
    background: var(--sheet);
    border: 1px solid var(--line);
    border-radius: var(--radius-lg);
    padding: 16px;
    box-shadow: var(--shadow-sm);
  }

  .vbook-filters {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin-bottom: 14px;
  }

  .vbook-filters input[type='search'] {
    width: auto;
    flex: 1 1 220px;
    min-width: 180px;
    min-height: 36px;
    padding: 6px 10px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--line);
    background: var(--inset);
    color: var(--ink);
  }

  .vbook-filters select {
    width: auto;
    flex: 0 1 auto;
    max-width: 180px;
    min-height: 36px;
    padding: 6px 10px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--line);
    background: var(--inset);
    color: var(--ink);
  }

  .nsfw-toggle {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: var(--muted);
    padding: 0 4px;
    cursor: pointer;
  }

  .filter-count {
    margin-left: auto;
    font-size: 12.5px;
    color: var(--muted);
  }

  .ext-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(310px, 1fr));
    gap: 12px;
  }

  .ext-card {
    display: grid;
    grid-template-rows: auto 1fr auto;
    gap: 10px;
    padding: 14px;
    border-radius: var(--radius-md);
    border: 1px solid var(--line);
    background: var(--sheet-elevated);
    transition: border-color var(--motion-fast) var(--ease-out), box-shadow var(--motion-fast) var(--ease-out);
  }

  .ext-card:hover {
    border-color: var(--line-strong);
    box-shadow: var(--shadow-sm);
  }

  .ext-card.pinned {
    border-color: color-mix(in srgb, var(--accent) 42%, var(--line));
  }

  .ext-head {
    display: grid;
    grid-template-columns: 38px minmax(0, 1fr);
    gap: 10px;
    align-items: start;
  }

  .ext-avatar {
    width: 38px;
    height: 38px;
    border-radius: var(--radius-sm);
    display: grid;
    place-items: center;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.02em;
    color: var(--accent);
    background: var(--accent-soft);
    border: 1px solid color-mix(in srgb, var(--accent) 26%, var(--line));
  }

  .ext-title-wrap {
    min-width: 0;
  }

  .ext-name-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
  }

  .ext-name {
    font-size: 14.5px;
    font-weight: 650;
    color: var(--ink);
    overflow-wrap: anywhere;
  }

  .ext-meta {
    margin-top: 3px;
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    font-size: 12px;
    color: var(--muted);
    overflow-wrap: anywhere;
  }

  .ext-desc {
    margin: 0;
    font-size: 12.5px;
    line-height: 1.45;
    color: var(--muted);
    overflow-wrap: anywhere;
  }

  .ext-foot {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-end;
    gap: 6px;
    padding-top: 6px;
    border-top: 1px solid var(--line);
  }

  .mini-action {
    min-height: 30px;
    padding: 4px 12px;
    font-size: 12.5px;
  }

  .accent-btn {
    color: var(--accent);
    border-color: color-mix(in srgb, var(--accent) 36%, var(--line));
    background: var(--accent-soft);
  }

  .empty-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 8px;
  }

  .vbook-pager {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin-top: 14px;
    font-size: 13px;
    color: var(--muted);
  }

  .vbook-dialog {
    width: min(560px, calc(100vw - 24px));
  }

  .vbook-dialog h3 {
    margin: 0;
    font: 600 18px/1.3 Cambria, "Times New Roman", serif;
  }

  .repo-form-row {
    display: flex;
    gap: 8px;
    margin-top: 12px;
  }

  .repo-form-row input {
    flex: 1 1 auto;
    min-width: 0;
    min-height: 36px;
    padding: 6px 10px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--line);
    background: var(--inset);
    color: var(--ink);
  }

  .repo-list {
    margin: 14px 0;
    padding: 0;
    list-style: none;
    max-height: 240px;
    overflow: auto;
  }

  .repo-item-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }

  .repo-check {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    min-width: 0;
    cursor: pointer;
  }

  .repo-check div {
    display: grid;
    gap: 2px;
    min-width: 0;
  }

  .repo-url,
  .repo-stat {
    font-size: 12px;
    color: var(--muted);
    overflow-wrap: anywhere;
  }

  .direct-zip-box {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px dashed var(--line);
  }

  .direct-zip-box label {
    display: block;
    font-size: 12.5px;
    font-weight: 600;
    color: var(--muted);
  }

  .config-fields {
    display: grid;
    gap: 12px;
    margin-top: 14px;
  }

  .config-row {
    display: grid;
    gap: 6px;
  }

  .config-row label {
    font-size: 13px;
    font-weight: 600;
  }

  .cfg-input,
  .config-row select {
    min-height: 36px;
    padding: 6px 10px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--line);
    background: var(--inset);
    color: var(--ink);
  }

  @media (max-width: 680px) {
    .ext-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
