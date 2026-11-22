<script lang="ts">
  import { onMount } from 'svelte';
  import {
    vbookAddRepo,
    vbookAiChat,
    vbookChap,
    vbookDetail,
    vbookGetSnapshot,
    vbookInstallFromUrl,
    vbookPickAndInstallLocalZip,
    vbookRefreshRepos,
    vbookRemoveRepo,
    vbookResolveTrack,
    vbookRunnerStatus,
    vbookSaveChapterToLibrary,
    vbookSaveExtensionConfig,
    vbookSearch,
    vbookToc,
    vbookTogglePinExtension,
    vbookToggleRepo,
    vbookTranslateMeta,
    vbookTranslateText,
    vbookTtsSynthesize,
    vbookTtsVoices,
    vbookUninstallExtension,
    vbookUpdateAll,
    vbookUpdateExtension,
    type CatalogExtensionView,
    type ExtensionRepo,
    type ExtensionUpdate,
    type InstalledExtension,
    type VBookAiReply,
    type VBookChapterContent,
    type VBookDetail,
    type VBookResolvedTrack,
    type VBookRunnerStatus,
    type VBookSearchItem,
    type VBookTocItem,
    type VBookTranslateMeta,
    type VBookTranslateResult,
    type VBookTtsAudio,
    type VBookTtsVoice,
    type VBookWorkspaceSnapshot,
  } from './studio';

  type Props = {
    parentBusy?: boolean;
  };

  type TabId = 'updates' | 'installed' | 'catalog';

  const CATALOG_PAGE_SIZE = 40;

  let { parentBusy = false }: Props = $props();

  let snapshot = $state<VBookWorkspaceSnapshot | null>(null);
  let runnerStatus = $state<VBookRunnerStatus | null>(null);
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

  // Modal Khám phá (novel / chinese_novel / comic / video / audio / forum / news)
  let exploreDialog = $state<HTMLDialogElement | undefined>(undefined);
  let exploreTarget = $state<InstalledExtension | null>(null);
  let exploreQuery = $state('');
  let exploreResults = $state<VBookSearchItem[]>([]);
  let exploreNext = $state<string | null>(null);
  let exploreDetail = $state<VBookDetail | null>(null);
  let exploreToc = $state<VBookTocItem[]>([]);
  let exploreChap = $state<VBookChapterContent | null>(null);
  let exploreChapTitle = $state('');
  let exploreSavedNotice = $state('');
  let resolvedTrack = $state<VBookResolvedTrack | null>(null);
  let exploreError = $state('');
  let exploreBusy = $state(false);

  // Modal Thử Engine (tts / translate / ai)
  let engineDialog = $state<HTMLDialogElement | undefined>(undefined);
  let engineTarget = $state<InstalledExtension | null>(null);
  let engineError = $state('');
  let engineBusy = $state(false);
  // TTS
  let ttsVoices = $state<VBookTtsVoice[]>([]);
  let ttsVoiceId = $state('');
  let ttsInput = $state('Xin chào đạo hữu, đây là đoạn đọc thử nghiệm từ Novel Studio.');
  let ttsResult = $state<VBookTtsAudio | null>(null);
  // Translate
  let translateMeta = $state<VBookTranslateMeta | null>(null);
  let trFrom = $state('');
  let trTo = $state('vi');
  let trModel = $state('');
  let trStyle = $state('');
  let trInput = $state('你好，道友！');
  let trResult = $state<VBookTranslateResult | null>(null);
  // AI
  let aiModels = $state<string[]>([]);
  let aiModel = $state('');
  let aiPrompt = $state('Tóm tắt ngắn vai trò của nguồn mở rộng VBook.');
  let aiReply = $state<VBookAiReply | null>(null);

  let isBusy = $derived(parentBusy || busy !== null);
  let repos: ExtensionRepo[] = $derived(snapshot?.repos ?? []);
  let updates: ExtensionUpdate[] = $derived(snapshot?.updates ?? []);
  let installed: InstalledExtension[] = $derived(snapshot?.installed ?? []);
  let catalog: CatalogExtensionView[] = $derived(snapshot?.catalog ?? []);

  let updateByInstalledId = $derived(new Map(updates.map((u) => [u.installed_id, u])));

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
      new Set([...Object.keys(schema), ...Object.keys(configTarget.user_config ?? {})]),
    );
    return keys
      .map((key) => {
        const raw = schema[key];
        const obj =
          raw && typeof raw === 'object' && !Array.isArray(raw)
            ? (raw as Record<string, unknown>)
            : null;
        const modeRaw = obj ? String(obj.mode ?? '').toLowerCase() : '';
        if (modeRaw === 'database') return null;

        const formatRaw = obj ? String(obj.format ?? obj.type ?? 'text').toLowerCase() : typeof raw;
        const label = obj ? String(obj.title ?? obj.prompt ?? obj.name ?? key) : key;
        const subtitle = obj && obj.subtitle ? String(obj.subtitle) : '';
        const options =
          obj && Array.isArray(obj.values)
            ? obj.values.map((item) => String(item))
            : obj && Array.isArray(obj.items)
              ? obj.items.map((item) => String(item))
              : obj && Array.isArray(obj.options)
                ? obj.options.map((item) => String(item))
                : null;
        const defaultValue = obj ? (obj.default ?? '') : (raw ?? '');
        const fieldKind =
          modeRaw === 'toggle' || formatRaw === 'switch' || formatRaw === 'boolean' || formatRaw === 'bool'
            ? ('boolean' as const)
            : modeRaw === 'select' || (options !== null && modeRaw !== 'list')
              ? ('select' as const)
              : modeRaw === 'list'
                ? ('list' as const)
                : formatRaw === 'number'
                  ? ('number' as const)
                  : ('text' as const);
        return {
          key,
          label,
          subtitle,
          format: fieldKind,
          options,
          defaultValue,
        };
      })
      .filter((f): f is NonNullable<typeof f> => f !== null);
  });

  function typeLabel(raw: string): string {
    switch (raw) {
      case 'novel':
        return 'Tiểu thuyết';
      case 'chinese_novel':
        return 'Tiểu thuyết Trung';
      case 'comic':
        return 'Truyện tranh';
      case 'video':
        return 'Video';
      case 'audio':
        return 'Âm thanh / Podcast';
      case 'tts':
        return 'TTS';
      case 'translate':
        return 'Dịch thuật';
      case 'ai':
        return 'Trợ lý AI';
      case 'forum':
        return 'Diễn đàn';
      case 'news':
        return 'Tin tức';
      default:
        return 'Khác';
    }
  }

  function isEngineType(raw: string): boolean {
    return raw === 'tts' || raw === 'translate' || raw === 'ai';
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
      const [snap, status] = await Promise.all([vbookGetSnapshot(), vbookRunnerStatus()]);
      snapshot = snap;
      runnerStatus = status;
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
      const ext = await vbookInstallFromUrl(view.remote.path, view.installed_id ?? null);
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

  function parseListDraft(raw: unknown): string {
    if (Array.isArray(raw)) return raw.map((x) => String(x)).join('\n');
    if (typeof raw === 'string') {
      const trimmed = raw.trim();
      if (trimmed.startsWith('[')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) return parsed.map((x) => String(x)).join('\n');
        } catch {
          // fallback raw lines
        }
      }
      return raw;
    }
    return '';
  }

  function openConfigDialog(ext: InstalledExtension) {
    configTarget = ext;
    const nextDraft: Record<string, string | number | boolean> = {};
    const schema = ext.config_schema ?? {};
    const keys = Array.from(new Set([...Object.keys(schema), ...Object.keys(ext.user_config ?? {})]));
    for (const key of keys) {
      const userVal = ext.user_config?.[key];
      const raw = schema[key];
      const schemaObj =
        raw && typeof raw === 'object' && !Array.isArray(raw)
          ? (raw as Record<string, unknown>)
          : null;
      const modeRaw = schemaObj ? String(schemaObj.mode ?? '').toLowerCase() : '';
      const val = userVal !== undefined ? userVal : schemaObj ? (schemaObj.default ?? '') : (raw ?? '');
      if (modeRaw === 'list') {
        nextDraft[key] = parseListDraft(val);
      } else if (modeRaw === 'toggle') {
        nextDraft[key] = val === true || String(val).toLowerCase() === 'true';
      } else if (typeof val === 'boolean' || typeof val === 'number' || typeof val === 'string') {
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
        if (field.format === 'boolean') {
          payload[field.key] = val ? 'true' : 'false';
        } else if (field.format === 'list') {
          const rows = String(val ?? '')
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean);
          payload[field.key] = JSON.stringify(rows);
        } else if (field.format === 'number') {
          const num = Number(val);
          payload[field.key] = Number.isFinite(num) ? String(num) : String(val ?? '0');
        } else {
          payload[field.key] = String(val ?? '');
        }
      }
      const updated = await vbookSaveExtensionConfig(configTarget.id, JSON.stringify(payload));
      snapshot = await vbookGetSnapshot();
      configDialog?.close();
      notice = `Đã lưu cấu hình cho ${updated.name}.`;
    } catch (cause) {
      error = String(cause);
    } finally {
      busy = null;
    }
  }

  function openExploreDialog(ext: InstalledExtension) {
    exploreTarget = ext;
    exploreQuery = '';
    exploreResults = [];
    exploreNext = null;
    exploreDetail = null;
    exploreToc = [];
    exploreChap = null;
    exploreChapTitle = '';
    exploreSavedNotice = '';
    resolvedTrack = null;
    exploreError = '';
    exploreDialog?.showModal();
  }

  async function runExploreSearch(pageToken: string | null = null) {
    if (!exploreTarget || exploreBusy) return;
    exploreBusy = true;
    exploreError = '';
    try {
      const res = await vbookSearch(exploreTarget.id, exploreQuery, pageToken);
      exploreResults = pageToken ? [...exploreResults, ...res.items] : res.items;
      exploreNext = res.next;
    } catch (cause) {
      exploreError = String(cause);
    } finally {
      exploreBusy = false;
    }
  }

  async function openExploreItem(item: VBookSearchItem) {
    if (!exploreTarget || exploreBusy) return;
    exploreBusy = true;
    exploreError = '';
    exploreDetail = null;
    exploreToc = [];
    exploreChap = null;
    exploreChapTitle = '';
    exploreSavedNotice = '';
    resolvedTrack = null;
    try {
      const [detail, toc] = await Promise.all([
        vbookDetail(exploreTarget.id, item.link),
        vbookToc(exploreTarget.id, item.link),
      ]);
      exploreDetail = detail;
      exploreToc = toc;
    } catch (cause) {
      exploreError = String(cause);
    } finally {
      exploreBusy = false;
    }
  }

  async function openExploreChap(entry: VBookTocItem) {
    if (!exploreTarget || exploreBusy || entry.item_type === 'section') return;
    exploreBusy = true;
    exploreError = '';
    exploreChap = null;
    exploreChapTitle = entry.name;
    exploreSavedNotice = '';
    resolvedTrack = null;
    try {
      const hint = exploreDetail?.detail_type || exploreTarget.ext_type;
      exploreChap = await vbookChap(exploreTarget.id, entry.url, hint);
    } catch (cause) {
      exploreError = String(cause);
    } finally {
      exploreBusy = false;
    }
  }

  async function saveExploreChapterToLibrary() {
    if (!exploreChap || exploreChap.kind !== 'novel' || exploreBusy) return;
    exploreBusy = true;
    exploreError = '';
    exploreSavedNotice = '';
    try {
      const bookTitle = exploreDetail?.name || exploreTarget?.name || 'VBook';
      const chapTitle = exploreChapTitle || exploreChap.title || 'Chương 1';
      await vbookSaveChapterToLibrary(bookTitle, chapTitle, exploreChap.text);
      exploreSavedNotice = `Đã lưu "${bookTitle} - ${chapTitle}" vào Thư viện.`;
      window.dispatchEvent(new CustomEvent('novel-studio-library-changed'));
    } catch (cause) {
      exploreError = String(cause);
    } finally {
      exploreBusy = false;
    }
  }

  async function runResolveTrack(trackData: string) {
    if (!exploreTarget || exploreBusy) return;
    exploreBusy = true;
    exploreError = '';
    resolvedTrack = null;
    try {
      resolvedTrack = await vbookResolveTrack(exploreTarget.id, trackData);
    } catch (cause) {
      exploreError = String(cause);
    } finally {
      exploreBusy = false;
    }
  }

  async function openEngineDialog(ext: InstalledExtension) {
    engineTarget = ext;
    engineError = '';
    ttsVoices = [];
    ttsVoiceId = '';
    ttsResult = null;
    translateMeta = null;
    trResult = null;
    aiModels = [];
    aiModel = '';
    aiReply = null;
    engineDialog?.showModal();

    if (ext.ext_type === 'tts') {
      await loadTtsVoices();
    } else if (ext.ext_type === 'translate') {
      await loadTranslateMeta();
    } else if (ext.ext_type === 'ai') {
      const modelSchema = ext.config_schema?.model as Record<string, unknown> | undefined;
      const vals = Array.isArray(modelSchema?.values) ? modelSchema.values.map(String) : [];
      aiModels = vals;
      aiModel = String(ext.user_config?.model ?? modelSchema?.default ?? vals[0] ?? '');
    }
  }

  async function loadTtsVoices() {
    if (!engineTarget || engineBusy) return;
    engineBusy = true;
    engineError = '';
    try {
      ttsVoices = await vbookTtsVoices(engineTarget.id);
      if (ttsVoices.length > 0 && !ttsVoiceId) {
        ttsVoiceId = ttsVoices[0].id;
      }
    } catch (cause) {
      engineError = String(cause);
    } finally {
      engineBusy = false;
    }
  }

  async function runTtsSynthesize() {
    if (!engineTarget || engineBusy || !ttsVoiceId) return;
    engineBusy = true;
    engineError = '';
    ttsResult = null;
    try {
      ttsResult = await vbookTtsSynthesize(engineTarget.id, ttsInput, ttsVoiceId);
    } catch (cause) {
      engineError = String(cause);
    } finally {
      engineBusy = false;
    }
  }

  async function loadTranslateMeta() {
    if (!engineTarget || engineBusy) return;
    engineBusy = true;
    engineError = '';
    try {
      translateMeta = await vbookTranslateMeta(engineTarget.id);
      const fromLang = translateMeta.languages.find((l) => l.direction === 'from' || l.direction === '');
      const toLang = translateMeta.languages.find((l) => l.id === 'vi' || l.direction === 'to' || l.direction === '');
      trFrom = fromLang?.id ?? '';
      trTo = toLang?.id ?? 'vi';
      trModel = translateMeta.models[0]?.id ?? '';
      trStyle = translateMeta.styles[0]?.id ?? '';
    } catch (cause) {
      engineError = String(cause);
    } finally {
      engineBusy = false;
    }
  }

  async function runTranslateTest() {
    if (!engineTarget || engineBusy) return;
    engineBusy = true;
    engineError = '';
    trResult = null;
    try {
      trResult = await vbookTranslateText(
        engineTarget.id,
        trInput,
        trFrom,
        trTo,
        'chapterContent',
        trModel,
        trStyle,
      );
    } catch (cause) {
      engineError = String(cause);
    } finally {
      engineBusy = false;
    }
  }

  async function runAiTest() {
    if (!engineTarget || engineBusy || !aiPrompt.trim()) return;
    engineBusy = true;
    engineError = '';
    aiReply = null;
    try {
      aiReply = await vbookAiChat(
        engineTarget.id,
        [{ role: 'user', content: aiPrompt.trim() }],
        aiModel,
      );
    } catch (cause) {
      engineError = String(cause);
    } finally {
      engineBusy = false;
    }
  }
</script>

<section class="heading">
  <div>
    <h1>Nguồn mở rộng VBook</h1>
    <p>
      Hỗ trợ đầy đủ Tiểu thuyết, Truyện tranh, Video, Âm thanh, TTS, Dịch thuật, Trợ lý AI, Diễn đàn &amp; Tin tức theo chuẩn vbook-beta.
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
  <div class="tabbar-end">
    {#if runnerStatus}
      <span
        class={runnerStatus.ready ? 'badge accent runner-badge' : 'badge warn runner-badge'}
        title={`${runnerStatus.message}${runnerStatus.browser_bridge_ready ? ' · WebView2 Browser Bridge sẵn sàng' : ''}`}
      >
        {runnerStatus.mock_mode
          ? 'Runner Mock'
          : runnerStatus.ready
            ? runnerStatus.browser_bridge_ready
              ? 'Runner + Bridge'
              : 'Runner sẵn sàng'
            : 'Chưa có Java 21 / runner'}
      </span>
    {/if}
    {#if activeTab === 'updates' && updates.length > 0}
      <button class="button primary" type="button" onclick={updateAll} disabled={isBusy}>
        {busy === 'update-all' ? 'Đang cập nhật…' : `Cập nhật tất cả (${updates.length})`}
      </button>
    {/if}
  </div>
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
              {#if isEngineType(ext.ext_type)}
                <button class="mini-btn accent-btn" type="button" onclick={() => openEngineDialog(ext)} disabled={isBusy}>
                  Thử Engine
                </button>
              {:else}
                <button class="mini-btn accent-btn" type="button" onclick={() => openExploreDialog(ext)} disabled={isBusy}>
                  Khám phá
                </button>
              {/if}
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
        {#if field.subtitle}
          <span class="field-sub">{field.subtitle}</span>
        {/if}
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
        {:else if field.format === 'list'}
          <textarea
            id={`cfg-${field.key}`}
            class="cfg-textarea"
            rows="3"
            value={String(configDraft[field.key] ?? '')}
            oninput={(e) => {
              configDraft = { ...configDraft, [field.key]: (e.currentTarget as HTMLTextAreaElement).value };
            }}
          ></textarea>
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

<dialog id="vbook-explore-dialog" class="vbook-dialog wide-dialog" bind:this={exploreDialog}>
  <h3>
    Khám phá: {exploreTarget?.name ?? ''}
    {#if exploreTarget}
      <span class="badge muted">{typeLabel(exploreTarget.ext_type)}</span>
    {/if}
  </h3>

  <div class="repo-form-row">
    <input
      id="vbook-explore-query"
      type="search"
      bind:value={exploreQuery}
      placeholder="Nhập từ khóa tìm kiếm trên nguồn…"
      aria-label="Từ khóa tìm kiếm trên nguồn"
    />
    <button class="button primary" type="button" onclick={() => runExploreSearch(null)} disabled={exploreBusy}>
      {exploreBusy ? 'Đang chạy…' : 'Tìm kiếm'}
    </button>
  </div>

  {#if exploreError}
    <div class="vbook-banner warn runner-err" role="alert">{exploreError}</div>
  {/if}

  <div class="explore-grid">
    <div class="explore-col">
      <h4>Kết quả (<span class="num">{exploreResults.length}</span>)</h4>
      {#if exploreResults.length === 0}
        <p class="muted-hint">Bấm Tìm kiếm để chạy script <code>search.js</code> trên nguồn.</p>
      {:else}
        <ul class="explore-list">
          {#each exploreResults as item (item.link)}
            <li>
              <button type="button" class="explore-item-btn" onclick={() => openExploreItem(item)} disabled={exploreBusy}>
                <strong>{item.name}</strong>
                <span>{item.description || item.link}</span>
              </button>
            </li>
          {/each}
        </ul>
        {#if exploreNext}
          <button class="mini-btn" type="button" onclick={() => runExploreSearch(exploreNext)} disabled={exploreBusy}>
            Tải thêm…
          </button>
        {/if}
      {/if}
    </div>

    <div class="explore-col">
      {#if exploreDetail}
        <div class="detail-box">
          <strong>{exploreDetail.name}</strong>
          <div class="ext-meta">
            {#if exploreDetail.author}<span>{exploreDetail.author}</span>{/if}
            {#if exploreDetail.genres.length > 0}<span>· {exploreDetail.genres.join(', ')}</span>{/if}
          </div>
          {#if exploreDetail.detail_text}
            <p class="ext-desc">{exploreDetail.detail_text}</p>
          {/if}
        </div>
      {/if}

      <h4>Mục lục (<span class="num">{exploreToc.length}</span>)</h4>
      {#if exploreToc.length === 0}
        <p class="muted-hint">Chọn một mục kết quả để nạp <code>detail.js</code> và <code>toc.js</code>.</p>
      {:else}
        <ul class="explore-list">
          {#each exploreToc as ch (ch.index)}
            <li>
              <button
                type="button"
                class="explore-item-btn"
                onclick={() => openExploreChap(ch)}
                disabled={exploreBusy || ch.item_type === 'section'}
              >
                <strong>{ch.name}</strong>
                <span>{ch.url}</span>
              </button>
            </li>
          {/each}
        </ul>
      {/if}

      {#if exploreChap}
        <div class="chap-preview">
          <div class="chap-preview-head">
            <h4>{exploreChapTitle || 'Nội dung chương / tập'}</h4>
            {#if exploreChap.kind === 'novel' && exploreChap.text.trim().length > 0}
              <button
                id="vbook-save-to-library-btn"
                class="button primary mini-action"
                type="button"
                onclick={saveExploreChapterToLibrary}
                disabled={exploreBusy}
              >
                Lưu vào Thư viện
              </button>
            {/if}
          </div>
          {#if exploreSavedNotice}
            <div class="vbook-banner" role="status">{exploreSavedNotice}</div>
          {/if}
          {#if exploreChap.kind === 'novel'}
            <pre class="chap-text">{exploreChap.text}</pre>
          {:else if exploreChap.kind === 'comic'}
            <p class="muted-hint num">Truyện tranh gồm {exploreChap.images.length} khung ảnh:</p>
            <ul class="explore-list">
              {#each exploreChap.images as img, idx (idx)}
                <li>
                  <span class="repo-url num">{idx + 1}. {img.url}</span>
                </li>
              {/each}
            </ul>
          {:else if exploreChap.kind === 'media_tracks'}
            <p class="muted-hint">Chọn nguồn phát để chạy <code>track.js</code>:</p>
            <div class="track-list">
              {#each exploreChap.tracks as tr (tr.data)}
                <div class="track-row">
                  <span>{tr.title} {#if tr.quality}({tr.quality}){/if}</span>
                  <button
                    class="button primary mini-action"
                    type="button"
                    onclick={() => runResolveTrack(tr.data)}
                    disabled={exploreBusy}
                  >
                    Giải mã phát
                  </button>
                </div>
              {/each}
            </div>
            {#if resolvedTrack}
              <div class="resolved-box">
                <div class="ext-name-row">
                  <span class="badge accent">{resolvedTrack.track_type}</span>
                  {#if resolvedTrack.mime_type}<span class="badge muted">{resolvedTrack.mime_type}</span>{/if}
                </div>
                <p class="repo-url">{resolvedTrack.data}</p>
                {#if resolvedTrack.subtitles.length > 0}
                  <p class="muted-hint num">Phụ đề: {resolvedTrack.subtitles.length} kênh</p>
                {/if}
              </div>
            {/if}
          {:else}
            <pre class="chap-text">{JSON.stringify(exploreChap.data, null, 2)}</pre>
          {/if}
        </div>
      {/if}
    </div>
  </div>

  <div class="dialog-actions">
    <button class="button" type="button" onclick={() => exploreDialog?.close()}>Đóng</button>
  </div>
</dialog>

<dialog id="vbook-engine-dialog" class="vbook-dialog" bind:this={engineDialog}>
  <h3>
    Thử Engine: {engineTarget?.name ?? ''}
    {#if engineTarget}
      <span class="badge muted">{typeLabel(engineTarget.ext_type)}</span>
    {/if}
  </h3>

  {#if engineError}
    <div class="vbook-banner warn runner-err" role="alert">{engineError}</div>
  {/if}

  {#if engineTarget?.ext_type === 'tts'}
    <div class="config-fields">
      <div class="config-row">
        <label for="tts-voice-select">Giọng đọc (<span class="num">{ttsVoices.length}</span>)</label>
        <div class="repo-form-row">
          <select id="tts-voice-select" bind:value={ttsVoiceId} disabled={engineBusy}>
            {#each ttsVoices as v (v.id)}
              <option value={v.id}>{v.name} ({v.language})</option>
            {/each}
          </select>
          <button class="button" type="button" onclick={loadTtsVoices} disabled={engineBusy}>Nạp giọng</button>
        </div>
      </div>
      <div class="config-row">
        <label for="tts-text-input">Đoạn văn tổng hợp</label>
        <textarea id="tts-text-input" class="cfg-textarea" rows="3" bind:value={ttsInput}></textarea>
      </div>
      {#if ttsResult}
        <div class="resolved-box">
          <div class="ext-name-row">
            <span class="badge accent">{ttsResult.mime_type}</span>
            <span class="badge num">{ttsResult.byte_len} bytes</span>
          </div>
          <p class="muted-hint">Base64 đầu ra sẵn sàng phát: {ttsResult.base64_data.slice(0, 48)}…</p>
        </div>
      {/if}
    </div>
    <div class="dialog-actions">
      <button class="button" type="button" onclick={() => engineDialog?.close()}>Đóng</button>
      <button class="button primary" type="button" onclick={runTtsSynthesize} disabled={engineBusy || !ttsVoiceId}>
        {engineBusy ? 'Đang chạy…' : 'Tổng hợp giọng nói'}
      </button>
    </div>
  {:else if engineTarget?.ext_type === 'translate'}
    <div class="config-fields">
      <div class="repo-form-row">
        <select bind:value={trFrom} aria-label="Ngôn ngữ nguồn" disabled={engineBusy}>
          <option value="">Tự nhận diện</option>
          {#each translateMeta?.languages ?? [] as lang (lang.id)}
            <option value={lang.id}>{lang.name}</option>
          {/each}
        </select>
        <select bind:value={trTo} aria-label="Ngôn ngữ đích" disabled={engineBusy}>
          {#each translateMeta?.languages ?? [] as lang (lang.id)}
            <option value={lang.id}>{lang.name}</option>
          {/each}
        </select>
      </div>
      {#if (translateMeta?.models.length ?? 0) > 0 || (translateMeta?.styles.length ?? 0) > 0}
        <div class="repo-form-row">
          {#if (translateMeta?.models.length ?? 0) > 0}
            <select bind:value={trModel} aria-label="Model dịch" disabled={engineBusy}>
              {#each translateMeta?.models ?? [] as m (m.id)}
                <option value={m.id}>{m.name}</option>
              {/each}
            </select>
          {/if}
          {#if (translateMeta?.styles.length ?? 0) > 0}
            <select bind:value={trStyle} aria-label="Phong cách dịch" disabled={engineBusy}>
              {#each translateMeta?.styles ?? [] as s (s.id)}
                <option value={s.id}>{s.name}</option>
              {/each}
            </select>
          {/if}
        </div>
      {/if}
      <div class="config-row">
        <label for="tr-input">Văn bản thử nghiệm</label>
        <textarea id="tr-input" class="cfg-textarea" rows="3" bind:value={trInput}></textarea>
      </div>
      {#if trResult}
        <div class="resolved-box">
          <strong>Kết quả dịch</strong>
          <p class="chap-text">{trResult.text}</p>
        </div>
      {/if}
    </div>
    <div class="dialog-actions">
      <button class="button" type="button" onclick={() => engineDialog?.close()}>Đóng</button>
      <button class="button primary" type="button" onclick={runTranslateTest} disabled={engineBusy || !trInput.trim()}>
        {engineBusy ? 'Đang dịch…' : 'Dịch thử'}
      </button>
    </div>
  {:else if engineTarget?.ext_type === 'ai'}
    <div class="config-fields">
      {#if aiModels.length > 0}
        <div class="config-row">
          <label for="ai-model-select">Model</label>
          <select id="ai-model-select" bind:value={aiModel} disabled={engineBusy}>
            {#each aiModels as m (m)}
              <option value={m}>{m}</option>
            {/each}
          </select>
        </div>
      {/if}
      <div class="config-row">
        <label for="ai-prompt-input">Câu hỏi thử nghiệm</label>
        <textarea id="ai-prompt-input" class="cfg-textarea" rows="3" bind:value={aiPrompt}></textarea>
      </div>
      {#if aiReply}
        <div class="resolved-box">
          <strong>Phản hồi AI</strong>
          <p class="chap-text">{aiReply.text}</p>
        </div>
      {/if}
    </div>
    <div class="dialog-actions">
      <button class="button" type="button" onclick={() => engineDialog?.close()}>Đóng</button>
      <button class="button primary" type="button" onclick={runAiTest} disabled={engineBusy || !aiPrompt.trim()}>
        {engineBusy ? 'Đang gửi…' : 'Gửi AI'}
      </button>
    </div>
  {:else}
    <div class="dialog-actions">
      <button class="button" type="button" onclick={() => engineDialog?.close()}>Đóng</button>
    </div>
  {/if}
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

  .runner-err {
    margin-top: 12px;
    margin-bottom: 0;
  }

  .vbook-tabbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 14px;
  }

  .tabbar-end {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }

  .runner-badge {
    padding: 4px 10px;
    font-size: 12px;
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
    max-width: 190px;
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
    max-height: calc(100vh - 36px);
    overflow: auto;
  }

  .vbook-dialog.wide-dialog {
    width: min(860px, calc(100vw - 24px));
  }

  .vbook-dialog h3 {
    margin: 0;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    font: 600 18px/1.3 Cambria, "Times New Roman", serif;
  }

  .repo-form-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 12px;
  }

  .repo-form-row input,
  .repo-form-row select {
    width: auto;
    flex: 1 1 180px;
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

  .chap-preview-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    flex-wrap: wrap;
    margin-bottom: 8px;
  }

  .chap-preview-head h4 {
    margin: 0;
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
    gap: 4px;
  }

  .config-row label {
    font-size: 13px;
    font-weight: 600;
  }

  .field-sub,
  .muted-hint {
    font-size: 12px;
    color: var(--muted);
    margin: 0;
  }

  .cfg-input,
  .cfg-textarea,
  .config-row select {
    min-height: 36px;
    padding: 6px 10px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--line);
    background: var(--inset);
    color: var(--ink);
  }

  .explore-grid {
    display: grid;
    grid-template-columns: minmax(220px, 0.9fr) minmax(0, 1.3fr);
    gap: 14px;
    margin-top: 14px;
  }

  .explore-col {
    display: grid;
    align-content: start;
    gap: 10px;
    padding: 12px;
    border-radius: var(--radius-md);
    border: 1px solid var(--line);
    background: var(--inset);
    min-width: 0;
  }

  .explore-col h4 {
    margin: 0;
    font-size: 13.5px;
    font-weight: 650;
  }

  .explore-list {
    margin: 0;
    padding: 0;
    list-style: none;
    max-height: 190px;
    overflow: auto;
    display: grid;
    gap: 6px;
  }

  .explore-list li {
    border: none;
    padding: 0;
  }

  .explore-item-btn {
    width: 100%;
    text-align: left;
    display: grid;
    gap: 2px;
    padding: 8px 10px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--line);
    background: var(--sheet-elevated);
    color: var(--ink);
  }

  .explore-item-btn:hover:not(:disabled) {
    background: var(--selection);
    border-color: var(--line-strong);
  }

  .explore-item-btn span {
    font-size: 11.5px;
    color: var(--muted);
    overflow-wrap: anywhere;
  }

  .detail-box,
  .chap-preview,
  .resolved-box {
    display: grid;
    gap: 6px;
    padding: 10px 12px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--line);
    background: var(--sheet);
  }

  .chap-text {
    margin: 0;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    font-family: inherit;
    font-size: 13px;
    line-height: 1.5;
    max-height: 180px;
    overflow: auto;
  }

  .track-list {
    display: grid;
    gap: 6px;
  }

  .track-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 6px 8px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--line);
    background: var(--inset);
    font-size: 12.5px;
  }

  @media (max-width: 720px) {
    .ext-grid {
      grid-template-columns: 1fr;
    }
    .explore-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
