<script lang="ts">
  import { tick } from 'svelte';
  import ArchiveWorkbench from './ArchiveWorkbench.svelte';
  import LibraryWorkbench from './LibraryWorkbench.svelte';
  import MergeWorkbench from './MergeWorkbench.svelte';
  import SettingsServices from './SettingsServices.svelte';
  import SplitWorkbench from './SplitWorkbench.svelte';
  import TextToolsWorkbench from './TextToolsWorkbench.svelte';
  import UploadWorkbench from './UploadWorkbench.svelte';
  import VBookExtensionsWorkbench from './VBookExtensionsWorkbench.svelte';
  import WikiWorkbench from './WikiWorkbench.svelte';
  import {
    applyFirstLine, applyRename, chooseFolder, choosePython, previewFirstLine, previewRename, rowStatus,
    undoFirstLine, vbookGetRuntimeConfig, vbookPickCustomJavaPath, vbookRunnerStatus, vbookSetCustomJavaPath,
    type LinePreview, type LineResult, type Outcome, type Preview, type Row, type VBookRunnerStatus,
  } from './studio';
  import {
    applyUiPrefs, DEFAULT_UI_PREFS, loadUiPrefs, resolveTheme,
    type AccentPreset, type AppLocale, type DensityMode, type MotionMode, type SurfaceStyle, type ThemeMode, type UiPrefs,
  } from './ui-prefs';
  import { SUPPORTED_LOCALES, translate, type I18nKey } from './i18n';

  const defaultFormat = '第{num}章 {title}.txt';
  const areas = [
    { id: 'library', labelKey: 'nav.library' as I18nKey },
    { id: 'edit', labelKey: 'nav.edit' as I18nKey },
    { id: 'files', labelKey: 'nav.files' as I18nKey },
    { id: 'upload', labelKey: 'nav.upload' as I18nKey },
    { id: 'settings', labelKey: 'topbar.settings' as I18nKey },
  ] as const;
  const editTools = [
    { id: 'rename', labelKey: 'subnav.rename' as I18nKey },
    { id: 'line', labelKey: 'subnav.line' as I18nKey },
    { id: 'split', labelKey: 'subnav.split' as I18nKey },
    { id: 'text', labelKey: 'subnav.text' as I18nKey },
  ] as const;
  const fileTools = [
    { id: 'archive', labelKey: 'subnav.archive' as I18nKey },
    { id: 'merge', labelKey: 'subnav.merge' as I18nKey },
  ] as const;
  type Area = typeof areas[number]['id'];
  type EditTool = typeof editTools[number]['id'];
  type FileTool = typeof fileTools[number]['id'];
  type LibraryTool = 'library' | 'vbook' | 'wiki';
  type Mode = EditTool | FileTool | LibraryTool | 'upload' | 'settings';
  let folder = $state('');
  let area = $state<Area>('edit');
  let editTool = $state<EditTool>('rename');
  let fileTool = $state<FileTool>('archive');
  let libraryTool = $state<LibraryTool>('library');
  let mode: Mode = $derived(
    area === 'edit' ? editTool : area === 'files' ? fileTool : area === 'library' ? libraryTool : area,
  );
  let visited = $state(new Set<Mode>());
  let lastRenameTool: 'rename' | 'line' = 'rename';
  let python = $state('');
  let nameFormat = $state(defaultFormat);
  let strategy = $state('content_first');
  let sortBy = $state('content');
  let filenameRegexes = $state('');
  let contentRegexes = $state('');
  let customTitles = $state('');
  let query = $state('');
  let preview = $state<Preview | null>(null);
  let selected = $state(new Set<string>());
  let outcome = $state<Outcome | null>(null);
  let drafts = $state(new Map<string, string>());
  let lineReview = $state<LinePreview | null>(null);
  let lineOutcome = $state<{ result: LineResult; undone: boolean } | null>(null);
  let undoRevision = $state<number | null>(null);
  let busy = $state<'folder' | 'python' | 'preview' | 'apply' | 'review' | 'save' | 'undo' | null>(null);
  let error = $state('');
  let needsPreview = $state(false);
  let uiPrefs = $state<UiPrefs>(loadUiPrefs());
  let dark = $derived(resolveTheme(uiPrefs.theme) === 'dark');
  let formatInput = $state<HTMLInputElement | undefined>(undefined);
  let confirmation = $state<HTMLDialogElement | undefined>(undefined);
  let lineConfirmation = $state<HTMLDialogElement | undefined>(undefined);
  const settingsGroups = ['general', 'appearance', 'account', 'translation', 'runtime'] as const;
  type SettingsGroup = typeof settingsGroups[number];
  let settingsGroup = $state<SettingsGroup>('general');
  let runtimeStatus = $state<VBookRunnerStatus | null>(null);
  let customJavaDraft = $state('');
  let settingsNotice = $state('');
  let settingsError = $state('');
  let settingsBusy = $state(false);

  const t = (key: I18nKey, params?: Record<string, string | number>) =>
    translate(uiPrefs.locale, key, params);

  const eligible = $derived(new Set(mode === 'line' ? preview?.rows.map((row) => row.filename) : preview?.eligible));
  const search = $derived(query.trim().toLowerCase());
  const visible = $derived((preview?.rows ?? []).filter((row) =>
    row.filename.toLowerCase().includes(search) || (mode === 'rename' && row.proposed_name?.toLowerCase().includes(search))
  ));
  const eligibleVisible = $derived(visible.filter((row) => eligible.has(row.filename)));
  const checkedVisible = $derived(eligibleVisible.length > 0 && eligibleVisible.every((row) => selected.has(row.filename)));
  const selectedRows = $derived((preview?.rows ?? []).filter((row) => selected.has(row.filename)));
  const reviewedChanges = $derived(lineReview?.rows.filter((row) => row.current_line !== row.replacement) ?? []);
  const warnings = $derived((preview?.rows ?? []).filter((row) =>
    row.issues.length > 0 || row.status === 'missing_number' || (row.status === 'proposed' && !eligible.has(row.filename))
  ).length);

  $effect(() => {
    applyUiPrefs(uiPrefs);
  });

  function toggleTheme() {
    uiPrefs = { ...uiPrefs, theme: dark ? 'light' : 'dark' };
  }

  async function loadRuntimeSettings() {
    settingsNotice = '';
    settingsError = '';
    settingsBusy = true;
    try {
      const [status, cfg] = await Promise.all([vbookRunnerStatus(), vbookGetRuntimeConfig()]);
      runtimeStatus = status;
      customJavaDraft = cfg.custom_java_path ?? '';
    } catch (cause) {
      settingsError = String(cause);
    } finally {
      settingsBusy = false;
    }
  }

  async function pickCustomJava() {
    if (settingsBusy) return;
    settingsBusy = true;
    settingsError = '';
    settingsNotice = '';
    try {
      const next = await vbookPickCustomJavaPath();
      if (next) {
        runtimeStatus = next;
        const cfg = await vbookGetRuntimeConfig();
        customJavaDraft = cfg.custom_java_path ?? '';
        settingsNotice = t('settings.java_saved');
      }
    } catch (cause) {
      settingsError = String(cause);
    } finally {
      settingsBusy = false;
    }
  }

  async function saveCustomJava(pathOverride?: string | null) {
    if (settingsBusy) return;
    settingsBusy = true;
    settingsError = '';
    settingsNotice = '';
    try {
      const value = pathOverride === undefined ? (customJavaDraft.trim() || null) : pathOverride;
      const next = await vbookSetCustomJavaPath(value);
      runtimeStatus = next;
      if (value === null) customJavaDraft = '';
      settingsNotice = t('settings.java_saved');
    } catch (cause) {
      settingsError = String(cause);
    } finally {
      settingsBusy = false;
    }
  }

  function chooseSettingsGroup(group: SettingsGroup) {
    settingsGroup = group;
    if (group === 'runtime' && !settingsBusy) void loadRuntimeSettings();
  }

  function showSettings(group: SettingsGroup) {
    changeArea('settings');
    if (area === 'settings') chooseSettingsGroup(group);
  }

  function clearPreview() {
    preview = null;
    selected = new Set();
    drafts = new Map();
    lineReview = null;
    query = '';
  }

  function changeArea(next: Area) {
    if (area === next || busy) return;
    area = next;
    if (next !== 'edit') visited = new Set(visited).add(next === 'files' ? fileTool : next === 'library' ? libraryTool : next);
    window.scrollTo(0, 0);
  }

  function changeLibraryTool(next: LibraryTool) {
    if (libraryTool === next || busy) return;
    libraryTool = next;
    visited = new Set(visited).add(next);
    window.scrollTo(0, 0);
  }

  function changeFileTool(next: FileTool) {
    if (fileTool === next || busy) return;
    fileTool = next;
    visited = new Set(visited).add(next);
    window.scrollTo(0, 0);
  }

  function changeEditTool(next: EditTool) {
    if (editTool === next || busy) return;
    editTool = next;
    if (next === 'text' || next === 'split') {
      visited = new Set(visited).add(next);
    } else if (next !== lastRenameTool) {
      lastRenameTool = next;
      clearPreview();
      error = '';
      needsPreview = false;
    }
    window.scrollTo(0, 0);
  }

  function changedRules() {
    if (preview) needsPreview = true;
    clearPreview();
    error = '';
  }

  function insertToken(token: string) {
    if (!formatInput) return;
    const start = formatInput.selectionStart ?? nameFormat.length;
    const end = formatInput.selectionEnd ?? start;
    nameFormat = nameFormat.slice(0, start) + token + nameFormat.slice(end);
    changedRules();
    requestAnimationFrame(() => {
      formatInput?.focus();
      formatInput?.setSelectionRange(start + token.length, start + token.length);
    });
  }

  async function pickFolder() {
    if (busy) return;
    busy = 'folder';
    error = '';
    try {
      const path = await chooseFolder();
      if (path) {
        folder = path;
        clearPreview();
        outcome = null;
        lineOutcome = null;
        undoRevision = null;
        needsPreview = false;
      }
    } catch (cause) {
      error = String(cause);
    } finally {
      busy = null;
    }
  }

  async function pickPython() {
    if (busy) return;
    busy = 'python';
    error = '';
    try {
      const executable = await choosePython();
      if (executable) {
        python = executable;
        changedRules();
      }
    } catch (cause) {
      error = String(cause);
    } finally {
      busy = null;
    }
  }

  async function scan() {
    if (!folder || busy) return;
    busy = 'preview';
    error = '';
    outcome = null;
    clearPreview();
    try {
      preview = await previewRename({
        name_format: nameFormat,
        strategy,
        sort_by: sortBy,
        filename_regexes: filenameRegexes.split('\n').filter((item) => item.trim()),
        content_regexes: contentRegexes.split('\n').filter((item) => item.trim()),
        custom_titles: customTitles.trim() ? customTitles.trim().split('\n') : null,
        include_first_line: mode === 'line',
      });
      selected = new Set(mode === 'line'
        ? preview.rows.filter((row) => row.first_line !== undefined && !row.error).map((row) => row.filename)
        : preview.eligible);
      needsPreview = false;
    } catch (cause) {
      error = String(cause);
    } finally {
      busy = null;
    }
  }

  function draftFor(row: Row) {
    return drafts.get(row.filename) ?? row.first_line ?? '';
  }

  function editDraft(file: string, replacement: string) {
    drafts = new Map(drafts).set(file, replacement);
  }

  async function reviewLines() {
    if (!preview || !selectedRows.length || busy) return;
    error = '';
    busy = 'review';
    try {
      lineReview = await previewFirstLine(preview.revision, selectedRows.map((row) => ({
        file: row.filename,
        replacement: draftFor(row),
      })));
      await tick();
      lineConfirmation?.showModal();
    } catch (cause) {
      error = String(cause);
    } finally {
      busy = null;
    }
  }

  async function saveLines() {
    if (!lineReview || !reviewedChanges.length || busy) return;
    const revision = lineReview.revision;
    lineConfirmation?.close();
    await writeLines('save', revision);
  }

  async function writeLines(action: 'save' | 'undo', revision: number) {
    if (busy) return;
    busy = action;
    error = '';
    try {
      const result = await (action === 'save' ? applyFirstLine(revision) : undoFirstLine(revision));
      lineOutcome = { result, undone: action === 'undo' };
      undoRevision = result.undo_revision;
    } catch (cause) {
      error = String(cause);
    } finally {
      clearPreview();
      needsPreview = true;
      busy = null;
    }
  }

  function check(names: string[], checked: boolean) {
    const next = new Set(selected);
    for (const name of names) {
      if (checked) next.add(name);
      else next.delete(name);
    }
    selected = next;
  }

  async function confirmApply() {
    confirmation?.close();
    if (!preview || !selected.size || busy) return;
    const revision = preview.revision;
    const selection = Array.from(selected);
    busy = 'apply';
    error = '';
    outcome = null;
    try {
      outcome = await applyRename(revision, selection);
    } catch (cause) {
      error = String(cause);
    } finally {
      clearPreview();
      needsPreview = true;
      busy = null;
    }
  }
</script>

<header class="masthead">
  <div class="brand">
    <span class="book-mark" aria-hidden="true"></span>
    <span>{t('app.name')}</span>
  </div>
  <nav class="area-nav" aria-label={t('nav.aria')}>
    {#each areas as item (item.id)}
      <button type="button" aria-pressed={area === item.id} disabled={busy !== null}
        onclick={() => changeArea(item.id)}>{t(item.labelKey)}</button>
    {/each}
  </nav>
  <div class="masthead-end">
    <button type="button" class="theme" aria-label={dark ? t('topbar.theme_to_light') : t('topbar.theme_to_dark')}
      onclick={toggleTheme}>{dark ? '☀' : '☾'} <span>{dark ? t('topbar.theme_light') : t('topbar.theme_dark')}</span></button>
  </div>
</header>

<main>
  {#if area === 'library'}
    <nav class="mode-switch" aria-label={t('subnav.library_aria')}>
      <button type="button" aria-pressed={libraryTool === 'library'} disabled={busy !== null}
        onclick={() => changeLibraryTool('library')}>{t('subnav.library')}</button>
      <button type="button" aria-pressed={libraryTool === 'vbook'} disabled={busy !== null}
        onclick={() => changeLibraryTool('vbook')}>{t('subnav.vbook')}</button>
      <button type="button" aria-pressed={libraryTool === 'wiki'} disabled={busy !== null}
        onclick={() => changeLibraryTool('wiki')}>{t('subnav.wiki')}</button>
    </nav>
  {:else if area === 'edit'}
    <nav class="mode-switch" aria-label={t('subnav.edit_aria')}>
      {#each editTools as tool (tool.id)}
        <button type="button" aria-pressed={editTool === tool.id} disabled={busy !== null}
          onclick={() => changeEditTool(tool.id)}>{t(tool.labelKey)}</button>
      {/each}
    </nav>
  {:else if area === 'files'}
    <nav class="mode-switch" aria-label={t('subnav.files_aria')}>
      {#each fileTools as tool (tool.id)}
        <button type="button" aria-pressed={fileTool === tool.id} disabled={busy !== null}
          onclick={() => changeFileTool(tool.id)}>{t(tool.labelKey)}</button>
      {/each}
    </nav>
  {/if}
  {#if visited.has('library')}
    <div hidden={mode !== 'library'}><LibraryWorkbench locale={uiPrefs.locale} onTranslationSettings={() => showSettings('translation')} /></div>
  {/if}
  {#if visited.has('vbook')}
    <div hidden={mode !== 'vbook'}><VBookExtensionsWorkbench parentBusy={busy !== null} /></div>
  {/if}
  {#if visited.has('wiki')}
    <div hidden={mode !== 'wiki'}><WikiWorkbench onAccountSettings={() => showSettings('account')} /></div>
  {/if}
  {#if visited.has('split')}
    <div hidden={mode !== 'split'}><SplitWorkbench {python} onPickPython={pickPython} parentBusy={busy !== null} /></div>
  {/if}
  {#if visited.has('text')}
    <div hidden={mode !== 'text'}><TextToolsWorkbench {python} onPickPython={pickPython} parentBusy={busy !== null} /></div>
  {/if}
  {#if visited.has('archive')}
    <div hidden={mode !== 'archive'}><ArchiveWorkbench {python} onPickPython={pickPython} parentBusy={busy !== null} /></div>
  {/if}
  {#if visited.has('merge')}
    <div hidden={mode !== 'merge'}><MergeWorkbench parentBusy={busy !== null} /></div>
  {/if}
  {#if visited.has('upload')}
    <div hidden={mode !== 'upload'}><UploadWorkbench parentBusy={busy !== null} active={mode === 'upload'} onAccountSettings={() => showSettings('account')} /></div>
  {/if}
  {#if mode === 'settings'}
<section class="settings-page" aria-labelledby="studio-settings-title">
  <header class="heading">
    <h1 id="studio-settings-title">{t('settings.title')}</h1>
  </header>
  <div class="settings-layout">
    <nav class="settings-navigation" aria-label={t('settings.title')}>
      {#each settingsGroups as group (group)}
        <button type="button" class="button" aria-current={settingsGroup === group ? 'page' : undefined}
          onclick={() => chooseSettingsGroup(group)}>{t(`settings.group_${group}`)}</button>
      {/each}
    </nav>
    <div class="settings-content">
      {#key settingsGroup}
      <div class="settings-panel">
  {#if settingsGroup === 'general'}
  <section class="settings-section">
    <h2>{t('settings.group_general')}</h2>
    <div class="settings-field">
      <label for="studio-locale-select">{t('settings.language_label')}</label>
      <select
        id="studio-locale-select"
        value={uiPrefs.locale}
        onchange={(e) => {
          uiPrefs = { ...uiPrefs, locale: e.currentTarget.value as AppLocale };
        }}
      >
        {#each SUPPORTED_LOCALES as item (item.code)}
          <option value={item.code}>{item.nativeLabel} ({item.label})</option>
        {/each}
      </select>
      <p class="field-help">{t('settings.language_hint')}</p>
    </div>

  </section>

  {:else if settingsGroup === 'appearance'}
  <section class="settings-section">
    <h2>{t('settings.section_appearance')}</h2>
    <div class="settings-grid">
      <label class="settings-field">
        <span>{t('settings.theme_label')}</span>
        <select
          value={uiPrefs.theme}
          onchange={(e) => {
            uiPrefs = { ...uiPrefs, theme: e.currentTarget.value as ThemeMode };
          }}
        >
          <option value="system">{t('settings.theme_system')}</option>
          <option value="light">{t('settings.theme_light')}</option>
          <option value="dark">{t('settings.theme_dark')}</option>
        </select>
      </label>
      <label class="settings-field">
        <span>{t('settings.accent_label')}</span>
        <select
          value={uiPrefs.accent}
          onchange={(e) => {
            uiPrefs = { ...uiPrefs, accent: e.currentTarget.value as AccentPreset };
          }}
        >
          <option value="ocean">Ocean Blue</option>
          <option value="forest">Forest</option>
          <option value="indigo">Indigo</option>
          <option value="amber">Amber</option>
          <option value="rose">Rose</option>
        </select>
      </label>
      <label class="settings-field">
        <span>{t('settings.surface_label')}</span>
        <select
          value={uiPrefs.surface}
          onchange={(e) => {
            uiPrefs = { ...uiPrefs, surface: e.currentTarget.value as SurfaceStyle };
          }}
        >
          <option value="editorial">Editorial</option>
          <option value="glass">Glass</option>
          <option value="crisp">Crisp</option>
        </select>
      </label>
      <label class="settings-field">
        <span>{t('settings.density_label')}</span>
        <select
          value={uiPrefs.density}
          onchange={(e) => {
            uiPrefs = { ...uiPrefs, density: e.currentTarget.value as DensityMode };
          }}
        >
          <option value="comfortable">Comfortable</option>
          <option value="compact">Compact</option>
        </select>
      </label>
      <label class="settings-field">
        <span>{t('settings.motion_label')}</span>
        <select
          value={uiPrefs.motion}
          onchange={(e) => {
            uiPrefs = { ...uiPrefs, motion: e.currentTarget.value as MotionMode };
          }}
        >
          <option value="full">Full</option>
          <option value="reduced">Reduced</option>
          <option value="none">None</option>
        </select>
      </label>
    </div>
    <div><button class="button" type="button" onclick={() => {
      const { locale } = uiPrefs;
      uiPrefs = { ...DEFAULT_UI_PREFS, locale };
    }}>{t('settings.appearance_reset')}</button></div>
  </section>

  {:else if settingsGroup === 'runtime'}
  <section class="settings-section">
    <h2>{t('settings.group_runtime')}</h2>
    <div class="settings-field">
      <span>Python</span>
      <div class="settings-path-row">
        <input type="text" aria-label="Python" readonly value={python || t('settings.python_default')} />
        <button class="button" type="button" onclick={pickPython} disabled={busy !== null}>{t('settings.python_pick')}</button>
      </div>
    </div>
    {#if error && busy === null}<p role="alert" class="notice error">{error}</p>{/if}
    {#if settingsError}<p role="alert" class="notice error">{settingsError}</p>
    {:else if settingsNotice}<p role="status" class="notice">{settingsNotice}</p>{/if}
    <div class="settings-runtime-head">
      <h3>{t('settings.section_runtime')}</h3>
      {#if runtimeStatus}
        <span
          class="runtime-status-pill"
          class:is-ready={runtimeStatus.ready}
          class:is-mock={runtimeStatus.mock_mode}
        >
          {runtimeStatus.mock_mode
            ? t('settings.runtime_mock')
            : runtimeStatus.ready
              ? t('settings.runtime_ready')
              : t('settings.runtime_missing')}
        </span>
      {/if}
    </div>
    <p class="field-help">{t('settings.runtime_note')}</p>
    <div class="settings-field">
      <label for="studio-custom-java-input">{t('settings.java_custom_label')}</label>
      <div class="settings-path-row">
        <input
          id="studio-custom-java-input"
          type="text"
          bind:value={customJavaDraft}
          placeholder={t('settings.java_custom_placeholder')}
          disabled={settingsBusy}
        />
        <button type="button" class="button" disabled={settingsBusy} onclick={pickCustomJava}>
          {t('settings.java_pick')}
        </button>
      </div>
      <div class="settings-path-actions">
        <button type="button" class="button primary" disabled={settingsBusy} onclick={() => saveCustomJava()}>
          {t('settings.java_save')}
        </button>
        <button type="button" class="button" disabled={settingsBusy} onclick={() => saveCustomJava(null)}>
          {t('settings.java_clear')}
        </button>
      </div>
    </div>
    {#if runtimeStatus}
      <div class="stat-box">
        <div>
          <span>{t('settings.java_resolved_label')}</span>
          <strong>{runtimeStatus.java_path ?? runtimeStatus.message}</strong>
        </div>
        <div>
          <span>{t('settings.jar_label')}</span>
          <strong>{runtimeStatus.jar_path ?? '—'}</strong>
        </div>
      </div>
    {/if}
  </section>
  {:else}
    <SettingsServices group={settingsGroup} />
  {/if}
      </div>
      {/key}
    </div>
  </div>
</section>
  {/if}
  {#if mode === 'rename' || mode === 'line'}
  <section class="heading">
    <div>
      <h1>{mode === 'rename' ? 'Đổi tên chương' : 'Sửa dòng đầu'}</h1>
      <p>{mode === 'rename' ? 'Đối chiếu tên chương và chọn các file cần đổi.' : 'Chọn chương, chỉnh dòng đề xuất rồi đối chiếu trước khi lưu.'}</p>
    </div>
    <button class="button primary" type="button" onclick={pickFolder} disabled={busy !== null}>
      {busy === 'folder' ? 'Đang mở…' : folder ? 'Đổi thư mục' : 'Chọn thư mục'}
    </button>
  </section>

  <div class="folder-line">
    <span class="folder-label">Thư mục</span>
    <span class="folder-path" title={folder}>{folder || 'Chưa chọn thư mục'}</span>
  </div>

  <div class="workspace">
    <aside aria-label={mode === 'rename' ? 'Quy tắc đặt tên' : 'Quy tắc gợi ý'}>
      <h2>{mode === 'rename' ? 'Quy tắc đặt tên' : 'Quy tắc gợi ý'}</h2>
      <fieldset disabled={busy !== null}>
        <label for="name-format">{mode === 'rename' ? 'Mẫu tên mới' : 'Mẫu gợi ý dòng đầu'}</label>
        <input id="name-format" class="format" bind:this={formatInput} bind:value={nameFormat} oninput={changedRules} />
        <div class="tokens" aria-label="Chèn biến vào mẫu tên">
          <button type="button" onclick={() => insertToken('{num}')}>{'{num}'}</button>
          <button type="button" onclick={() => insertToken('{title}')}>{'{title}'}</button>
        </div>

        <label for="strategy">Ưu tiên lấy số và tiêu đề từ</label>
        <select id="strategy" bind:value={strategy} onchange={changedRules}>
          <option value="content_first">Dòng đầu nội dung</option>
          <option value="filename_first">Tên file</option>
        </select>

        <label for="sort">Sắp xếp theo số trong</label>
        <select id="sort" bind:value={sortBy} onchange={changedRules}>
          <option value="content">Nội dung</option>
          <option value="filename">Tên file</option>
        </select>

        <details>
          <summary>Tuỳ chọn nâng cao</summary>
          <label for="regex-filename">Regex tên file</label>
          <textarea id="regex-filename" rows="2" bind:value={filenameRegexes} oninput={changedRules}
            placeholder="Mỗi dòng một biểu thức"></textarea>
          <label for="regex-content">Regex dòng đầu</label>
          <textarea id="regex-content" rows="2" bind:value={contentRegexes} oninput={changedRules}
            placeholder="Mỗi dòng một biểu thức"></textarea>
          <label for="custom-titles">Tiêu đề tùy chỉnh</label>
          <textarea id="custom-titles" rows="3" bind:value={customTitles} oninput={changedRules}
            placeholder="Mỗi dòng một tiêu đề, theo thứ tự sắp xếp"></textarea>
        </details>
      </fieldset>
      <button class="button preview-button" type="button" onclick={scan} disabled={!folder || busy !== null}>
        {busy === 'preview' ? 'Đang xem trước…' : 'Xem trước'}
      </button>
      <div class="runtime">
        <span>Python · {python || 'Mặc định'}</span>
        <button type="button" class="runtime-button" onclick={pickPython} disabled={busy !== null}>
          {busy === 'python' ? 'Đang mở…' : 'Chọn Python…'}
        </button>
      </div>
    </aside>

    <section class="proof" aria-label="Bản xem trước" aria-busy={busy !== null}>
      <div class="proof-head">
        <div>
          <h2>Bản xem trước</h2>
          {#if preview}
            <p class="summary">{preview.rows.length} file{mode === 'rename' ? ` · ${preview.eligible.length} có thể đổi${warnings ? ` · ${warnings} cần xem lại` : ''}` : ''}</p>
          {/if}
        </div>
        {#if preview?.rows.length}
          <input class="search" type="search" aria-label="Tìm tên chương" placeholder="Tìm tên chương…" bind:value={query} />
        {/if}
      </div>

      {#if error}<p role="alert" class="notice error">{error}</p>{/if}
      {#if mode === 'rename' && outcome}
        <div role="status" class="notice" class:error={outcome.failure !== null}>
          Đã đổi tên {outcome.renamed.length} file.
          {#if outcome.failure}
            Dừng tại <strong>{outcome.failure.operation.source}</strong>. {outcome.failure.error}
          {/if}
        </div>
      {/if}
      {#if mode === 'line' && lineOutcome}
        {@const { result, undone } = lineOutcome}
        <div role="status" class="notice" class:error={result.failure !== null}>
          {undone ? 'Đã hoàn tác' : 'Đã lưu dòng đầu của'} {result.changed.length} file.
          {#if result.failure}
            Dừng tại <strong>{result.failure.file}</strong>. {result.failure.error}
            {#if result.failure.recovery_dir}<p>Thư mục phục hồi · {result.failure.recovery_dir}</p>{/if}
          {/if}
          {#if result.changed.length}
            <details class="backups">
              <summary>Bản sao trước khi {undone ? 'hoàn tác' : 'lưu'}</summary>
              <ul>
                {#each result.changed as change (change.file)}
                  <li>{change.file} · {change.backup}</li>
                {/each}
              </ul>
            </details>
          {/if}
        </div>
      {/if}

      <div class="proof-body">
        {#if preview?.rows.length && visible.length}
          <table>
            <thead>
              <tr>
                <th class="check-cell" scope="col">
                  <input type="checkbox" aria-label="Chọn tất cả file hợp lệ đang hiển thị" checked={checkedVisible}
                    disabled={!eligibleVisible.length || busy !== null}
                    onchange={(event) => check(eligibleVisible.map((row) => row.filename), event.currentTarget.checked)} />
                </th>
                <th scope="col">{mode === 'rename' ? 'Tên hiện tại' : 'File'}</th>
                {#if mode === 'rename'}<th class="direction" scope="col" aria-label="Đổi thành">→</th>{/if}
                <th scope="col">{mode === 'rename' ? 'Tên sau khi đổi' : 'Dòng đầu thay thế'}</th>
              </tr>
            </thead>
            <tbody>
              {#each visible as row (row.filename)}
                {@const available = eligible.has(row.filename)}
                <tr class:chosen={selected.has(row.filename)}>
                  <td class="check-cell">
                    <input type="checkbox" aria-label={`Chọn ${row.filename}`} checked={selected.has(row.filename)}
                      disabled={!available || busy !== null}
                      onchange={(event) => check([row.filename], event.currentTarget.checked)} />
                  </td>
                  <td><span class="filename">{row.filename}</span>
                    {#if row.error}<small class="row-error" title={row.error}>Không đọc được nội dung</small>{/if}
                  </td>
                  {#if mode === 'rename'}
                    <td class="direction" aria-hidden="true">→</td>
                    <td><span class="filename next-name">{row.proposed_name ?? '—'}</span>
                      <small class:row-error={row.issues.length > 0}>{rowStatus(row, available)}</small>
                    </td>
                  {:else}
                    <td><input type="text" aria-label={`Dòng đầu thay thế cho ${row.filename}`} value={draftFor(row)}
                      placeholder={row.first_line === undefined ? 'Nhập dòng thay thế' : undefined} disabled={busy !== null}
                      oninput={(event) => editDraft(row.filename, event.currentTarget.value)} /></td>
                  {/if}
                </tr>
              {/each}
            </tbody>
          </table>
        {:else}
          <div class="empty">
            <div class="paper" aria-hidden="true"><span></span><span></span><span></span></div>
            {#if busy === 'preview'}
              <h3>Đang đọc các chương</h3>
            {:else if busy === 'apply'}
              <h3>Đang đổi tên file</h3>
            {:else if busy === 'save' || busy === 'undo'}
              <h3>{busy === 'save' ? 'Đang lưu dòng đầu' : 'Đang hoàn tác'}</h3>
            {:else if !folder}
              <h3>Chọn thư mục chứa chương</h3>
              <p>Các file .txt sẽ xuất hiện tại đây sau khi xem trước.</p>
            {:else if preview && !preview.rows.length}
              <h3>Thư mục chưa có file .txt</h3>
            {:else if preview}
              <h3>Không tìm thấy tên phù hợp</h3>
            {:else}
              <h3>{needsPreview ? 'Xem trước lại để tiếp tục' : 'Sẵn sàng xem trước'}</h3>
              <p>Chỉnh {mode === 'rename' ? 'mẫu tên' : 'mẫu gợi ý'} bên trái rồi bấm Xem trước.</p>
            {/if}
          </div>
        {/if}
      </div>

      <footer class="proof-footer">
        <span aria-live="polite">{selected.size ? `${selected.size} file đã chọn` : 'Chưa chọn file'}</span>
        {#if mode === 'rename'}
          <button class="button primary" type="button" disabled={busy !== null || !selected.size}
            onclick={() => confirmation?.showModal()}>Đổi tên{selected.size ? ` ${selected.size} file` : ''}</button>
        {:else}
          <div class="proof-actions">
            {#if undoRevision !== null}
              <button class="button" type="button" disabled={busy !== null}
                onclick={() => undoRevision !== null && writeLines('undo', undoRevision)}>Hoàn tác lần sửa</button>
            {/if}
            <button class="button primary" type="button" disabled={busy !== null || !selected.size}
              onclick={reviewLines}>{busy === 'review' ? 'Đang đối chiếu…' : 'Đối chiếu dòng đầu'}</button>
          </div>
        {/if}
      </footer>
    </section>
  </div>
  {/if}
</main>

<dialog bind:this={confirmation} aria-labelledby="confirm-title">
  <h2 id="confirm-title">Đổi tên {selected.size} file?</h2>
  <p title={folder}>{folder}</p>
  <ul>
    {#each selectedRows.slice(0, 5) as row (row.filename)}
      <li><span>{row.filename}</span><strong>{row.proposed_name}</strong></li>
    {/each}
  </ul>
  {#if selected.size > 5}<p>Và {selected.size - 5} file khác trong danh sách đã chọn.</p>{/if}
  <div class="dialog-actions">
    <button type="button" class="button" onclick={() => confirmation?.close()}>Hủy</button>
    <button type="button" class="button primary" onclick={confirmApply}>Xác nhận đổi tên</button>
  </div>
</dialog>

<dialog class="line-confirmation" bind:this={lineConfirmation} aria-labelledby="line-confirm-title">
  <h2 id="line-confirm-title">Đối chiếu dòng đầu</h2>
  {#if reviewedChanges.length}
    <p>{reviewedChanges.length} file sẽ đổi dòng đầu. Bản gốc được lưu cạnh từng file.</p>
    <ul>
      {#each reviewedChanges as row (row.file)}
        <li>
          <strong>{row.file}</strong>
          <dl class="line-comparison">
            <div><dt>Hiện tại</dt><dd>{row.current_line || '(dòng trống)'}</dd></div>
            <div><dt>Thay bằng</dt><dd>{row.replacement || '(dòng trống)'}</dd></div>
          </dl>
        </li>
      {/each}
    </ul>
    {#if lineReview && lineReview.rows.length > reviewedChanges.length}
      <p>{lineReview.rows.length - reviewedChanges.length} file có dòng đầu đã khớp.</p>
    {/if}
  {:else}
    <p>Dòng đầu của các file đã chọn đều khớp.</p>
  {/if}
  <div class="dialog-actions">
    <button type="button" class="button" onclick={() => lineConfirmation?.close()}>{reviewedChanges.length ? 'Hủy' : 'Đóng'}</button>
    {#if reviewedChanges.length}
      <button type="button" class="button primary" onclick={saveLines}>Lưu dòng đầu</button>
    {/if}
  </div>
</dialog>
