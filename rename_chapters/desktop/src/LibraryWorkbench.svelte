<script lang="ts">
  import { getCurrentWindow } from '@tauri-apps/api/window';
  import { defaultReaderPrefs, loadReaderPrefs, saveReaderPrefs } from './reader-preferences';
  import { onMount } from 'svelte';
  import {
    clearReaderTranslationCache,
    exportReaderNameSetText,
    getLibraryStats,
    getReaderBookVpSet,
    getReaderGlobalDicts,
    getReaderNameSets,
    getReaderTranslationCacheStats,
    importLibrary,
    importReaderNameSetText,
    listLibrary,
    listLibraryChapters,
    listReaderNameHistory,
    mapReaderSelectionToName,
    readLibrary,
    readLibraryChapter,
    reloadReaderChapterTranslation,
    removeLibrary,
    saveReaderGlobalDicts,
    saveReaderNameSets,
    suggestReaderName,
    translateLibraryChapter,
    updateReaderBookVpEntry,
    updateReaderNameEntry,
    type BookNameHistoryRow,
    type GlobalDictsState,
    type LibraryChapterContent,
    type LibraryChapterList,
    type LibraryItem,
    type LibraryPage,
    type LibraryStats,
    type NameRightSuggestion,
    type NameSetState,
    type NameSuggestItem,
    type ReadingCursor,
    type SelectionNameMapResult,
    type TranslatedChapterView,
    type TranslationCacheStats,
    type TranslationMode,
  } from './studio';
  import { translate, type I18nKey } from './i18n';
  import type { AppLocale } from './ui-prefs';

  let { locale = 'vi', active, onFullscreenChange, onTranslationSettings }: {
    locale?: AppLocale; active: boolean; onFullscreenChange: (enabled: boolean) => void;
    onTranslationSettings: () => void;
  } = $props();
  const t = (key: I18nKey, params?: Record<string, string | number>) => translate(locale, key, params);

  let books = $state<LibraryItem[]>([]);
  let selected = $state<number | null>(null);
  let query = $state('');
  let readMode = $state<'chapter' | 'page'>('chapter');
  let viewLang = $state<'raw' | 'trans'>('raw');
  let translateMode = $state<TranslationMode>('server');

  // Chapter reader state
  let toc = $state<LibraryChapterList | null>(null);
  let chapter = $state<LibraryChapterContent | null>(null);
  let translatedView = $state<TranslatedChapterView | null>(null);
  let tocOpen = $state(false);
  let tocQuery = $state('');

  // Stream page reader state (for plain TXT without chapters or user toggle)
  let page = $state<LibraryPage | null>(null);
  let cursors = $state<Array<ReadingCursor | null>>([null]);

  // Selection & Edit Name V3 state
  let selectionSnapshot = $state<{
    text: string;
    startOffset: number;
    endOffset: number;
  } | null>(null);
  let selectionMapped = $state<SelectionNameMapResult | null>(null);
  let selectionSourceInput = $state('');
  let selectionTargetInput = $state('');
  let mappingBusy = $state(false);

  // Name & Dictionary Dialog state
  let dictType = $state<'name' | 'vp'>('name');
  let dictScope = $state<'book' | 'global'>('book');
  let nameSetState = $state<NameSetState>({
    sets: { 'Mặc định': {} },
    active_set: 'Mặc định',
    version: 1,
  });
  let bookVpEntries = $state<Record<string, string>>({});
  let globalDicts = $state<GlobalDictsState>({ name: {}, vp: {}, version: 1 });
  let nameHistory = $state<BookNameHistoryRow[]>([]);
  let nameTab = $state<'entries' | 'bulk' | 'history' | 'server'>('entries');
  let entryFilter = $state('');
  let formSource = $state('');
  let formTarget = $state('');
  let bulkText = $state('');
  let bulkReplace = $state(false);
  let newSetName = $state('');

  // Hán-Việt & Dictionary Suggestion state
  let suggestOrigin = $state<'selection' | 'manager'>('selection');
  let suggestSource = $state('');
  let suggestHvRaw = $state('');
  let suggestLeftItems = $state<NameSuggestItem[]>([]);
  let suggestRightItems = $state<NameRightSuggestion[]>([]);
  let suggestBusy = $state(false);

  // Server Config & Cache Stats
  let cacheStats = $state<TranslationCacheStats>({
    translation_memory_count: 0,
    translation_unit_map_count: 0,
    chapter_cache_count: 0,
  });

  let pending = $state<'load' | 'import' | 'read' | 'translate' | 'remove' | 'save' | null>('load');
  let catalogError = $state('');
  let readError = $state('');
  let message = $state('');

  let reader: HTMLDivElement;
  let readingOptions: HTMLDialogElement;
  let fullscreen = $state(false);
  let fullscreenBusy = $state(false);
  let readerPrefs = $state(loadReaderPrefs());
  $effect(() => saveReaderPrefs(readerPrefs));

  async function toggleFullscreen() {
    if (fullscreenBusy || !current) return;
    const ratio = currentScrollRatio();
    try {
      fullscreenBusy = true;
      await getCurrentWindow().setFullscreen(!fullscreen);
      fullscreen = !fullscreen;
      onFullscreenChange(fullscreen);
      restoreScrollRatio(ratio);
      reader?.focus({ preventScroll: true });
    } catch (cause) {
      readError = `Không đổi được chế độ toàn màn hình. ${String(cause)}`;
    } finally {
      fullscreenBusy = false;
    }
  }
  let chapterTextNode = $state<HTMLDivElement | null>(null);
  let removeDialog: HTMLDialogElement;
  let selectionNameDialog: HTMLDialogElement;
  let nameManagerDialog: HTMLDialogElement;
  let nameSuggestDialog: HTMLDialogElement;
  let statsDialog: HTMLDialogElement;

  let libraryStats = $state<LibraryStats | null>(null);
  let statsBusy = $state(false);
  let statsError = $state('');

  const current = $derived(books.find((book) => book.id === selected));
  const visible = $derived(
    books.filter((book) => book.title.toLowerCase().includes(query.trim().toLowerCase())),
  );
  const filteredChapters = $derived.by(() => {
    const list = toc?.chapters ?? [];
    const q = tocQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter((ch) => ch.title.toLowerCase().includes(q) || String(ch.index + 1) === q);
  });
  const hasChapters = $derived((toc?.chapters.length ?? 0) > 0);
  const displayedChapterTitle = $derived.by(() => {
    if (!chapter) return '';
    if (viewLang === 'trans' && translatedView && translatedView.chapter_index === chapter.index) {
      return translatedView.title_translated || chapter.title;
    }
    return chapter.title;
  });
  const displayedChapterText = $derived.by(() => {
    if (!chapter) return '';
    if (viewLang === 'trans' && translatedView && translatedView.chapter_index === chapter.index) {
      return translatedView.translated_text || chapter.text;
    }
    return chapter.text;
  });

  const titleIsFirstLine = $derived(
    displayedChapterText.trimStart().split('\n', 1)[0]?.trim() === displayedChapterTitle.trim(),
  );

  const activeDictEntries = $derived.by((): Record<string, string> => {
    if (dictScope === 'global') {
      return dictType === 'vp' ? globalDicts.vp : globalDicts.name;
    }
    if (dictType === 'vp') {
      return bookVpEntries;
    }
    return nameSetState.sets[nameSetState.active_set] ?? {};
  });

  const filteredDictRows = $derived.by(() => {
    const entries = Object.entries(activeDictEntries);
    const q = entryFilter.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(
      ([src, tgt]) => src.toLowerCase().includes(q) || tgt.toLowerCase().includes(q),
    );
  });

  const selectionExistingMeta = $derived.by(() => {
    const src = selectionSourceInput.trim();
    if (!src) return null;
    const bookMap = nameSetState.sets[nameSetState.active_set] ?? {};
    if (Object.prototype.hasOwnProperty.call(bookMap, src)) {
      return { scope: 'book' as const, setName: nameSetState.active_set, target: bookMap[src] };
    }
    if (Object.prototype.hasOwnProperty.call(globalDicts.name, src)) {
      return { scope: 'global' as const, setName: 'Name chung', target: globalDicts.name[src] };
    }
    return null;
  });

  onMount(() => {
    void reload();
    const onLibraryChanged = () => {
      void reload();
    };
    window.addEventListener('novel-studio-library-changed', onLibraryChanged);
    return () => {
      window.removeEventListener('novel-studio-library-changed', onLibraryChanged);
    };
  });

  function formatSize(bytes: number): string {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function savedChapterIndex(bookId: number): number {
    const fromCatalog = books.find((b) => b.id === bookId)?.last_chapter;
    if (typeof fromCatalog === 'number' && fromCatalog >= 0) return fromCatalog;
    try {
      const raw = localStorage.getItem(`novel-studio-lib-ch-${bookId}`);
      const parsed = raw ? Number(raw) : 0;
      return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0;
    } catch {
      return 0;
    }
  }

  function persistChapterIndex(bookId: number, idx: number) {
    books = books.map((b) => (b.id === bookId ? { ...b, last_chapter: idx } : b));
    try {
      localStorage.setItem(`novel-studio-lib-ch-${bookId}`, String(idx));
    } catch {
      // ignore storage errors
    }
  }

  function currentScrollRatio(): number {
    if (!reader) return 0;
    const max = reader.scrollHeight - reader.clientHeight;
    if (max <= 0) return 0;
    return Math.max(0, Math.min(1, reader.scrollTop / max));
  }

  function restoreScrollRatio(ratio: number) {
    if (!reader) return;
    const bounded = Math.max(0, Math.min(1, Number.isFinite(ratio) ? ratio : 0));
    requestAnimationFrame(() => {
      if (!reader) return;
      const max = Math.max(0, reader.scrollHeight - reader.clientHeight);
      reader.scrollTop = Math.round(max * bounded);
    });
  }

  function countUnicodeChars(str: string): number {
    return Array.from(str).length;
  }

  function captureChapterSelection() {
    if (!chapterTextNode || readMode !== 'chapter' || !chapter) {
      selectionSnapshot = null;
      return;
    }
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
      selectionSnapshot = null;
      return;
    }
    const range = sel.getRangeAt(0);
    if (!chapterTextNode.contains(range.commonAncestorContainer)) {
      selectionSnapshot = null;
      return;
    }
    const rawSelected = sel.toString().trim();
    if (!rawSelected || rawSelected.length > 360) {
      selectionSnapshot = null;
      return;
    }
    try {
      const preRange = document.createRange();
      preRange.selectNodeContents(chapterTextNode);
      preRange.setEnd(range.startContainer, range.startOffset);
      const startOffset = countUnicodeChars(preRange.toString());
      const selectedChars = countUnicodeChars(range.toString());
      const endOffset = startOffset + Math.max(1, selectedChars);
      selectionSnapshot = {
        text: rawSelected,
        startOffset,
        endOffset,
      };
    } catch {
      selectionSnapshot = {
        text: rawSelected,
        startOffset: 0,
        endOffset: countUnicodeChars(rawSelected),
      };
    }
  }

  function onReaderKeydown(event: KeyboardEvent) {
    if (!active || selected === null || event.defaultPrevented || document.querySelector('dialog[open]')) return;
    if ((event.key === 'Escape' && fullscreen) || event.key === 'F11') {
      event.preventDefault();
      void toggleFullscreen();
      return;
    }
    if (pending !== null) return;
    if (event.altKey && event.key === 'ArrowLeft') {
      event.preventDefault();
      if (readMode === 'chapter' && chapter && chapter.index > 0) {
        void openChapter(chapter.index - 1);
      } else if (readMode === 'page' && cursors.length >= 2) {
        void loadPage(cursors.slice(0, -1));
      }
    } else if (event.altKey && event.key === 'ArrowRight') {
      event.preventDefault();
      if (readMode === 'chapter' && chapter && chapter.index + 1 < chapter.total_chapters) {
        void openChapter(chapter.index + 1);
      } else if (readMode === 'page' && page?.next) {
        void loadPage([...cursors, page.next]);
      }
    } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'g' && hasChapters) {
      event.preventDefault();
      tocOpen = !tocOpen;
    }
  }

  async function reload() {
    pending = 'load';
    catalogError = '';
    try {
      books = await listLibrary();
    } catch (cause) {
      catalogError = String(cause);
    } finally {
      pending = null;
    }
  }

  async function addBooks() {
    if (pending) return;
    pending = 'import';
    catalogError = '';
    message = '';
    try {
      const result = await importLibrary();
      if (result) {
        books = result.entries;
        if (result.added) query = '';
        message = result.added ? `Đã thêm ${result.added} tệp.` : 'Các tệp đã có trong thư viện.';
      }
    } catch (cause) {
      catalogError = String(cause);
    } finally {
      pending = null;
    }
  }

  async function refreshBookDictionaries(bookId: number | null) {
    try {
      const [ns, gd, stats] = await Promise.all([
        getReaderNameSets(bookId),
        getReaderGlobalDicts(),
        getReaderTranslationCacheStats(),
      ]);
      nameSetState = ns;
      globalDicts = gd;
      cacheStats = stats;
      if (bookId !== null) {
        const [vp, hist] = await Promise.all([
          getReaderBookVpSet(bookId),
          listReaderNameHistory(bookId, 80),
        ]);
        bookVpEntries = vp.entries;
        nameHistory = hist;
      } else {
        bookVpEntries = {};
        nameHistory = [];
      }
    } catch {
      // ignore dictionary preload failure
    }
  }

  async function openBook(id: number) {
    if (pending) return;
    selected = id;
    toc = null;
    chapter = null;
    translatedView = null;
    selectionSnapshot = null;
    page = null;
    cursors = [null];
    tocOpen = false;
    tocQuery = '';
    readError = '';
    pending = 'read';
    try {
      await refreshBookDictionaries(id);
      const list = await listLibraryChapters(id);
      toc = list;
      if (list.chapters.length > 0) {
        readMode = 'chapter';
        const target = Math.min(savedChapterIndex(id), list.chapters.length - 1);
        chapter = await readLibraryChapter(id, target);
        persistChapterIndex(id, target);
        if (viewLang === 'trans') {
          translatedView = await translateLibraryChapter(id, target, translateMode, false);
          cacheStats = await getReaderTranslationCacheStats();
        }
        if (reader) reader.scrollTop = 0;
      } else if (list.kind === 'zip') {
        readMode = 'chapter';
        readError = 'Tệp ZIP không có tệp .txt hợp lệ nào để đọc.';
      } else {
        readMode = 'page';
        page = await readLibrary(id, null);
        cursors = [null];
        if (reader) reader.scrollTop = 0;
      }
    } catch (cause) {
      readError = String(cause);
    } finally {
      pending = null;
    }
  }

  async function openChapter(index: number, preserveRatio = 0) {
    if (selected === null || pending) return;
    pending = 'read';
    readError = '';
    selectionSnapshot = null;
    try {
      chapter = await readLibraryChapter(selected, index);
      readMode = 'chapter';
      persistChapterIndex(selected, index);
      tocOpen = false;
      if (viewLang === 'trans') {
        translatedView = await translateLibraryChapter(selected, index, translateMode, false);
        cacheStats = await getReaderTranslationCacheStats();
      }
      restoreScrollRatio(preserveRatio);
    } catch (cause) {
      readError = String(cause);
    } finally {
      pending = null;
    }
  }

  async function switchViewLang(nextLang: 'raw' | 'trans') {
    if (pending !== null || !chapter || selected === null) return;
    const ratio = currentScrollRatio();
    viewLang = nextLang;
    selectionSnapshot = null;
    if (nextLang === 'trans') {
      if (!translatedView || translatedView.chapter_index !== chapter.index || translatedView.translation_mode !== translateMode) {
        pending = 'translate';
        readError = '';
        try {
          translatedView = await translateLibraryChapter(selected, chapter.index, translateMode, false);
          cacheStats = await getReaderTranslationCacheStats();
        } catch (cause) {
          readError = String(cause);
        } finally {
          pending = null;
        }
      }
    }
    restoreScrollRatio(ratio);
  }

  async function onTranslateModeChange() {
    if (viewLang === 'trans' && selected !== null && chapter && pending === null) {
      const ratio = currentScrollRatio();
      pending = 'translate';
      readError = '';
      try {
        translatedView = await translateLibraryChapter(selected, chapter.index, translateMode, false);
        cacheStats = await getReaderTranslationCacheStats();
        restoreScrollRatio(ratio);
      } catch (cause) {
        readError = String(cause);
      } finally {
        pending = null;
      }
    }
  }

  async function reloadCurrentChapterTranslation() {
    if (selected === null || !chapter || pending !== null) return;
    const ratio = currentScrollRatio();
    pending = 'translate';
    readError = '';
    try {
      viewLang = 'trans';
      translatedView = await reloadReaderChapterTranslation(selected, chapter.index, translateMode);
      cacheStats = await getReaderTranslationCacheStats();
      restoreScrollRatio(ratio);
    } catch (cause) {
      readError = String(cause);
    } finally {
      pending = null;
    }
  }

  async function retranslatePreservingRatio() {
    if (selected === null || !chapter) return;
    const ratio = currentScrollRatio();
    if (viewLang === 'trans') {
      translatedView = await translateLibraryChapter(selected, chapter.index, translateMode, false);
      cacheStats = await getReaderTranslationCacheStats();
      restoreScrollRatio(ratio);
    }
  }

  async function openSelectionEditNameModal() {
    if (selected === null || !chapter) return;
    const snap = selectionSnapshot;
    selectionMapped = null;
    selectionSourceInput = '';
    selectionTargetInput = snap?.text ?? '';
    selectionNameDialog.showModal();

    if (!snap || !snap.text) return;
    mappingBusy = true;
    try {
      const mapped = await mapReaderSelectionToName({
        book_id: selected,
        chapter_index: chapter.index,
        selected_text: snap.text,
        start_offset: snap.startOffset,
        end_offset: snap.endOffset,
        translation_mode: translateMode,
        translated_text: viewLang === 'trans' ? displayedChapterText : chapter.text,
      });
      selectionMapped = mapped;
      if (mapped.source_candidate) {
        selectionSourceInput = mapped.source_candidate;
      }
      if (mapped.target_candidate) {
        selectionTargetInput = mapped.target_candidate;
      }
    } catch (cause) {
      readError = String(cause);
    } finally {
      mappingBusy = false;
    }
  }

  async function saveSelectionName(event: SubmitEvent) {
    event.preventDefault();
    if (selected === null || !chapter || pending !== null) return;
    const src = selectionSourceInput.trim();
    const tgt = selectionTargetInput.trim();
    if (!src || !tgt) return;

    pending = 'save';
    readError = '';
    try {
      const meta = selectionExistingMeta;
      if (meta && meta.scope === 'global') {
        const nextGlobal = { ...globalDicts.name, [src]: tgt };
        globalDicts = await saveReaderGlobalDicts(nextGlobal, null);
      } else {
        nameSetState = await updateReaderNameEntry({
          book_id: selected,
          source: src,
          target: tgt,
          set_name: nameSetState.active_set,
          delete: false,
          chapter_index: chapter.index,
          origin: 'reader_selection',
        });
      }
      selectionNameDialog.close();
      selectionSnapshot = null;
      await refreshBookDictionaries(selected);
      await retranslatePreservingRatio();
    } catch (cause) {
      readError = String(cause);
    } finally {
      pending = null;
    }
  }

  async function deleteSelectionName() {
    if (selected === null || !chapter || pending !== null) return;
    const src = selectionSourceInput.trim();
    if (!src) return;
    pending = 'save';
    readError = '';
    try {
      const meta = selectionExistingMeta;
      if (meta && meta.scope === 'global') {
        const nextGlobal = { ...globalDicts.name };
        delete nextGlobal[src];
        globalDicts = await saveReaderGlobalDicts(nextGlobal, null);
      } else {
        nameSetState = await updateReaderNameEntry({
          book_id: selected,
          source: src,
          target: '',
          set_name: nameSetState.active_set,
          delete: true,
          chapter_index: chapter.index,
          origin: 'reader_selection',
        });
      }
      selectionNameDialog.close();
      selectionSnapshot = null;
      await refreshBookDictionaries(selected);
      await retranslatePreservingRatio();
    } catch (cause) {
      readError = String(cause);
    } finally {
      pending = null;
    }
  }

  async function openNameManager() {
    await refreshBookDictionaries(selected);
    bulkText = await exportReaderNameSetText(
      dictScope === 'book' ? selected : null,
      nameSetState.active_set,
    ).catch(() => '');
    nameManagerDialog.showModal();
  }

  async function saveManagerSingleEntry(event: SubmitEvent) {
    event.preventDefault();
    const src = formSource.trim();
    const tgt = formTarget.trim();
    if (!src || !tgt || pending !== null) return;
    pending = 'save';
    readError = '';
    try {
      if (dictScope === 'global') {
        if (dictType === 'vp') {
          globalDicts = await saveReaderGlobalDicts(null, { ...globalDicts.vp, [src]: tgt });
        } else {
          globalDicts = await saveReaderGlobalDicts({ ...globalDicts.name, [src]: tgt }, null);
        }
      } else if (dictType === 'vp' && selected !== null) {
        const vp = await updateReaderBookVpEntry(selected, src, tgt, false);
        bookVpEntries = vp.entries;
      } else {
        nameSetState = await updateReaderNameEntry({
          book_id: selected,
          source: src,
          target: tgt,
          set_name: nameSetState.active_set,
          delete: false,
          chapter_index: chapter?.index ?? null,
          origin: 'reader_edit',
        });
      }
      formSource = '';
      formTarget = '';
      await refreshBookDictionaries(selected);
      await retranslatePreservingRatio();
    } catch (cause) {
      readError = String(cause);
    } finally {
      pending = null;
    }
  }

  async function removeManagerEntry(src: string) {
    if (pending !== null) return;
    pending = 'save';
    readError = '';
    try {
      if (dictScope === 'global') {
        if (dictType === 'vp') {
          const next = { ...globalDicts.vp };
          delete next[src];
          globalDicts = await saveReaderGlobalDicts(null, next);
        } else {
          const next = { ...globalDicts.name };
          delete next[src];
          globalDicts = await saveReaderGlobalDicts(next, null);
        }
      } else if (dictType === 'vp' && selected !== null) {
        const vp = await updateReaderBookVpEntry(selected, src, '', true);
        bookVpEntries = vp.entries;
      } else {
        nameSetState = await updateReaderNameEntry({
          book_id: selected,
          source: src,
          target: '',
          set_name: nameSetState.active_set,
          delete: true,
          chapter_index: chapter?.index ?? null,
          origin: 'reader_edit',
        });
      }
      await refreshBookDictionaries(selected);
      await retranslatePreservingRatio();
    } catch (cause) {
      readError = String(cause);
    } finally {
      pending = null;
    }
  }

  async function switchActiveNameSet(nextSet: string) {
    if (pending !== null) return;
    pending = 'save';
    try {
      nameSetState = await saveReaderNameSets({
        book_id: selected,
        sets: nameSetState.sets,
        active_set: nextSet,
        bump_version: false,
        origin: 'reader_set_switch',
        chapter_index: chapter?.index ?? null,
      });
      await refreshBookDictionaries(selected);
      await retranslatePreservingRatio();
    } catch (cause) {
      readError = String(cause);
    } finally {
      pending = null;
    }
  }

  async function createNewNameSet() {
    const trimmed = newSetName.trim();
    if (!trimmed || pending !== null) return;
    if (nameSetState.sets[trimmed]) {
      newSetName = '';
      return;
    }
    pending = 'save';
    try {
      const nextSets = { ...nameSetState.sets, [trimmed]: {} };
      nameSetState = await saveReaderNameSets({
        book_id: selected,
        sets: nextSets,
        active_set: trimmed,
        bump_version: false,
        origin: 'reader_set_add',
        chapter_index: chapter?.index ?? null,
      });
      newSetName = '';
      await refreshBookDictionaries(selected);
      await retranslatePreservingRatio();
    } catch (cause) {
      readError = String(cause);
    } finally {
      pending = null;
    }
  }

  async function deleteCurrentNameSet() {
    const keys = Object.keys(nameSetState.sets);
    if (keys.length <= 1 || pending !== null) return;
    pending = 'save';
    try {
      const nextSets = { ...nameSetState.sets };
      delete nextSets[nameSetState.active_set];
      const nextActive = Object.keys(nextSets)[0] || 'Mặc định';
      nameSetState = await saveReaderNameSets({
        book_id: selected,
        sets: nextSets,
        active_set: nextActive,
        bump_version: false,
        origin: 'reader_set_delete',
        chapter_index: chapter?.index ?? null,
      });
      await refreshBookDictionaries(selected);
      await retranslatePreservingRatio();
    } catch (cause) {
      readError = String(cause);
    } finally {
      pending = null;
    }
  }

  async function applyBulkNameText(event: SubmitEvent) {
    event.preventDefault();
    if (!bulkText.trim() || pending !== null) return;
    pending = 'save';
    readError = '';
    try {
      nameSetState = await importReaderNameSetText(
        selected,
        nameSetState.active_set,
        bulkText,
        bulkReplace,
      );
      await refreshBookDictionaries(selected);
      await retranslatePreservingRatio();
      nameTab = 'entries';
    } catch (cause) {
      readError = String(cause);
    } finally {
      pending = null;
    }
  }

  async function clearAllTranslationMemory() {
    if (pending !== null) return;
    pending = 'save';
    try {
      await clearReaderTranslationCache();
      cacheStats = await getReaderTranslationCacheStats();
      translatedView = null;
    } catch (cause) {
      readError = String(cause);
    } finally {
      pending = null;
    }
  }

  async function openNameSuggestFrom(origin: 'selection' | 'manager') {
    const src = (origin === 'selection' ? selectionSourceInput : formSource).trim();
    if (!src) return;
    suggestOrigin = origin;
    suggestSource = src;
    suggestLeftItems = [];
    suggestRightItems = [];
    suggestHvRaw = '';
    suggestBusy = true;
    nameSuggestDialog.showModal();
    try {
      const res = await suggestReaderName({
        source_text: src,
        book_id: selected,
        set_name: nameSetState.active_set,
        dict_type: dictType,
        scope: dictScope,
      });
      suggestHvRaw = res.han_viet_raw;
      suggestLeftItems = res.items;
      suggestRightItems = res.right_items;
    } catch (cause) {
      readError = String(cause);
    } finally {
      suggestBusy = false;
    }
  }

  function pickSuggestion(sourceText: string, targetText: string) {
    if (suggestOrigin === 'selection') {
      if (sourceText) selectionSourceInput = sourceText;
      if (targetText) selectionTargetInput = targetText;
    } else {
      if (sourceText) formSource = sourceText;
      if (targetText) formTarget = targetText;
    }
    nameSuggestDialog.close();
  }

  async function loadPage(nextCursors: Array<ReadingCursor | null>) {
    if (selected === null || pending) return;
    pending = 'read';
    readError = '';
    try {
      page = await readLibrary(selected, nextCursors.at(-1) ?? null);
      cursors = nextCursors;
      readMode = 'page';
      if (reader) reader.scrollTop = 0;
    } catch (cause) {
      readError = String(cause);
    } finally {
      pending = null;
    }
  }

  async function toggleReadMode() {
    if (!current || current.kind === 'zip' || pending) return;
    if (readMode === 'chapter') {
      await loadPage([null]);
    } else if (hasChapters) {
      const target = Math.min(savedChapterIndex(current.id), (toc?.chapters.length ?? 1) - 1);
      await openChapter(target);
    }
  }

  async function removeBook() {
    removeDialog.close();
    if (selected === null || pending) return;
    pending = 'remove';
    catalogError = '';
    message = '';
    try {
      books = await removeLibrary(selected);
      selected = null;
      toc = null;
      chapter = null;
      translatedView = null;
      page = null;
      tocOpen = false;
      readError = '';
      message = 'Đã bỏ tệp khỏi thư viện.';
    } catch (cause) {
      catalogError = String(cause);
    } finally {
      pending = null;
    }
  }

  async function loadStatsData(refreshStale: boolean) {
    statsBusy = true;
    statsError = '';
    try {
      libraryStats = await getLibraryStats(refreshStale);
    } catch (cause) {
      statsError = String(cause);
    } finally {
      statsBusy = false;
    }
  }

  async function openStatsModal() {
    statsDialog.showModal();
    await loadStatsData(false);
  }
</script>

<svelte:window onkeydown={onReaderKeydown} />

<section class="heading" hidden={fullscreen} inert={fullscreen}>
  <h1>Thư viện</h1>
  <div class="heading-actions">
    <button
      id="library-stats-btn"
      class="button"
      type="button"
      disabled={pending !== null}
      onclick={openStatsModal}
    >
      {t('stats.btn')}
    </button>
    {#if !current}
      <button class="button subtle" type="button" disabled={pending !== null} onclick={openNameManager}>Từ điển</button>
    {/if}
    <button class="button primary" type="button" disabled={pending !== null} onclick={addBooks}>
      {pending === 'import' ? 'Đang mở…' : 'Thêm truyện…'}
    </button>
  </div>
</section>

<div class="workspace">
  <aside class="shelf" aria-label="Truyện đã lưu" hidden={fullscreen} inert={fullscreen}>
    <div class="shelf-head">
      <h2>Truyện đã lưu</h2>
      {#if books.length}
        <input
          type="search"
          aria-label="Tìm theo tên truyện"
          placeholder="Tìm theo tên truyện…"
          bind:value={query}
        />
      {/if}
    </div>
    {#if catalogError}
      <div class="notice error">
        <p role="alert">{catalogError}</p>
        <button class="button" type="button" disabled={pending !== null} onclick={reload}>
          Tải lại danh mục
        </button>
      </div>
    {:else if message}
      <p class="notice" role="status">{message}</p>
    {/if}
    {#if visible.length}
      <ul class="shelf-items">
        {#each visible as book (book.id)}
          <li>
            <button
              type="button"
              aria-pressed={selected === book.id}
              title={book.path}
              disabled={pending !== null}
              onclick={() => openBook(book.id)}
            >
              <div class="book-row-top">
                <span class="book-title">{book.title}</span>
                <span class="kind-tag" class:is-zip={book.kind === 'zip'}>
                  {book.kind === 'zip' ? 'ZIP' : 'TXT'}
                </span>
              </div>
              <div class="book-row-meta">
                <small>{selected === book.id ? 'Đang mở' : book.last_chapter !== undefined ? `Chương ${book.last_chapter + 1}` : 'Chưa đọc'}</small>
                <small class="num-stat">
                  {formatSize(book.size)}
                </small>
              </div>
            </button>
          </li>
        {/each}
      </ul>
    {:else if !catalogError}
      <p class="shelf-empty">
        {pending === 'load'
          ? 'Đang mở thư viện…'
          : books.length
            ? 'Không tìm thấy truyện.'
            : 'Thư viện đang trống.'}
      </p>
    {/if}
  </aside>

  <section
    class="proof reader"
    class:reader-fullscreen={fullscreen}
    aria-label="Khung đọc"
    aria-busy={pending === 'read' || pending === 'translate'}
  >
    {#if current}
      <header class="proof-head reader-header">
        <div class="reader-title-group">
          <h2>{current.title}</h2>
        </div>
        <div class="proof-actions">
          {#if readMode === 'chapter' && chapter}
            <div class="lang-segmented" role="group" aria-label="Nội dung truyện">
              <button type="button" class="seg-btn" class:active={viewLang === 'raw'}
                aria-pressed={viewLang === 'raw'} disabled={pending !== null} onclick={() => switchViewLang('raw')}>
                Bản gốc
              </button>
              <button type="button" class="seg-btn" class:active={viewLang === 'trans'}
                aria-pressed={viewLang === 'trans'} disabled={pending !== null} onclick={() => switchViewLang('trans')}>
                {pending === 'translate' ? 'Đang dịch…' : 'Bản dịch'}
              </button>
            </div>
          {/if}
          {#if hasChapters}
            <button class="button subtle" type="button" aria-expanded={tocOpen}
              disabled={pending !== null} onclick={() => (tocOpen = !tocOpen)}>Mục lục</button>
          {/if}
          <button class="button subtle" type="button" onclick={() => readingOptions.showModal()}>Tùy chọn</button>
          <button class="button" type="button" aria-pressed={fullscreen} title="F11"
            disabled={fullscreenBusy} onclick={toggleFullscreen}>
            {fullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'}
          </button>
        </div>
      </header>
    {/if}

    {#if selectionSnapshot && readMode === 'chapter' && chapter}
      <div class="selection-bar" role="region" aria-label="Thao tác đoạn bôi đen">
        <span class="selection-preview">
          Đã bôi đen: <strong>“{selectionSnapshot.text}”</strong>
        </span>
        <div class="selection-actions">
          <button
            type="button"
            class="button primary"
            disabled={pending !== null}
            onclick={openSelectionEditNameModal}
          >
            Sửa tên đã chọn
          </button>
          <button
            type="button"
            class="button subtle"
            onclick={() => (selectionSnapshot = null)}
          >
            Đóng
          </button>
        </div>
      </div>
    {/if}

    {#if readError}
      <div class="notice error">
        <p role="alert">{readError}</p>
        {#if current}
          <button class="button" type="button" disabled={pending !== null} onclick={() => openBook(current.id)}>
            Mở lại từ đầu
          </button>
        {/if}
      </div>
    {/if}

    {#if tocOpen && toc && hasChapters}
      <div class="toc-panel" role="region" aria-label="Mục lục chương">
        <div class="toc-bar">
          <input
            type="search"
            aria-label="Tìm chương trong mục lục"
            placeholder="Tìm tiêu đề hoặc số thứ tự…"
            bind:value={tocQuery}
          />
          <span class="num-stat">{filteredChapters.length} chương</span>
        </div>
        <ul class="toc-list">
          {#each filteredChapters as item (item.index)}
            <li>
              <button
                type="button"
                class:active={chapter?.index === item.index && readMode === 'chapter'}
                disabled={pending !== null}
                onclick={() => openChapter(item.index)}
              >
                <span class="toc-idx num-stat">{item.index + 1}</span>
                <span class="toc-name">{item.title}</span>
              </button>
            </li>
          {/each}
        </ul>
      </div>
    {/if}

    <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions (The scrollable reading region needs keyboard focus and text selection detection.) -->
    <div
      class="proof-body reading-body"
      data-paper={readerPrefs.paper}
      data-spacing={readerPrefs.spacing}
      data-width={readerPrefs.width}
      data-font={readerPrefs.font}
      style:--reader-size={readerPrefs.size + 'px'}
      bind:this={reader}
      role="region"
      tabindex="0"
      aria-label="Nội dung trang"
      onmouseup={captureChapterSelection}
      onkeyup={captureChapterSelection}
    >
      {#if readMode === 'chapter' && chapter}
        {#key `${selected}-${chapter.index}`}
        <article class="reading-page">
          <h3 class="chapter-heading" class:visually-hidden={titleIsFirstLine}>{displayedChapterTitle}</h3>
          {#if chapter.truncated}
            <p class="notice">Chương vượt quá 2 MB, đang hiển thị phần đầu.</p>
          {/if}
          <div class="chapter-text" bind:this={chapterTextNode}>{displayedChapterText}</div>
        </article>
        {/key}
      {:else if readMode === 'page' && page?.text}
        <div class="reading-page reading-plain">{page.text}</div>
      {:else if !readError}
        <div class="empty">
          <div class="paper" aria-hidden="true"><span></span><span></span><span></span></div>
          {#if pending === 'read' || pending === 'translate'}
            <h3>{pending === 'translate' ? 'Đang dịch chương truyện…' : 'Đang mở truyện…'}</h3>
          {:else if page}
            <h3>Tệp không có nội dung</h3>
          {:else}
            <h3>{books.length ? 'Chọn một truyện để đọc' : 'Thêm truyện để bắt đầu đọc'}</h3>
          {/if}
        </div>
      {/if}
    </div>

    {#if readMode === 'chapter' && chapter}
      <footer class="proof-footer">
        <span class="num-stat" aria-live="polite">
          Chương {chapter.index + 1} / {chapter.total_chapters}
        </span>
        <div class="proof-actions">
          <button
            class="button"
            type="button"
            disabled={pending !== null || chapter.index <= 0}
            onclick={() => chapter && openChapter(chapter.index - 1)}
          >
            Chương trước
          </button>
          <button
            class="button primary"
            type="button"
            disabled={pending !== null || chapter.index + 1 >= chapter.total_chapters}
            onclick={() => chapter && openChapter(chapter.index + 1)}
          >
            Chương sau
          </button>
        </div>
      </footer>
    {:else if readMode === 'page' && page}
      <footer class="proof-footer">
        <span class="num-stat" aria-live="polite">Trang {cursors.length}</span>
        <div class="proof-actions">
          <button
            class="button"
            type="button"
            disabled={pending !== null || cursors.length < 2}
            onclick={() => loadPage(cursors.slice(0, -1))}
          >
            Trang trước
          </button>
          <button
            class="button primary"
            type="button"
            disabled={pending !== null || !page.next}
            onclick={() => page?.next && loadPage([...cursors, page.next])}
          >
            Trang sau
          </button>
        </div>
      </footer>
    {/if}
  </section>
</div>

<!-- Dialog 1: Edit Name V3 từ đoạn bôi đen -->
<dialog bind:this={selectionNameDialog} class="modal-box" aria-labelledby="sel-name-title">
  <form onsubmit={saveSelectionName}>
    <header class="modal-head">
      <h2 id="sel-name-title">Sửa Name riêng theo đoạn chọn</h2>
      <button type="button" class="button subtle" onclick={() => selectionNameDialog.close()}>
        Đóng
      </button>
    </header>
    <p class="modal-hint">
      {#if mappingBusy}
        Đang đối chiếu vị trí đoạn chọn với bảng Unit Map…
      {:else if selectionMapped?.source_candidate}
        Đã khớp <strong>{selectionMapped.match_type}</strong> (độ tin cậy {(selectionMapped.score * 100).toFixed(0)}%) · Bộ đang dùng: <strong>{nameSetState.active_set}</strong>
      {:else}
        Nhập hoặc chọn cụm chữ Hán gốc để gán tên tiếng Việt.
      {/if}
    </p>

    {#if selectionMapped?.name_suggestions?.length}
      <div class="chip-row" aria-label="Gợi ý cụm gốc trong câu">
        {#each selectionMapped.name_suggestions as sug (sug)}
          <button
            type="button"
            class="chip-btn"
            class:active={selectionSourceInput === sug}
            onclick={() => (selectionSourceInput = sug)}
          >
            {sug}
          </button>
        {/each}
      </div>
    {/if}

    <div class="field-grid">
      <label class="field-label">
        <span>Tên gốc (Tiếng Trung)</span>
        <input
          type="text"
          required
          placeholder="Ví dụ: 萧炎"
          bind:value={selectionSourceInput}
        />
      </label>
      <label class="field-label">
        <span>Tên dịch (Tiếng Việt)</span>
        <div class="input-with-btn">
          <input
            type="text"
            required
            placeholder="Ví dụ: Tiêu Viêm"
            bind:value={selectionTargetInput}
          />
          <button
            type="button"
            class="button"
            disabled={!selectionSourceInput.trim()}
            onclick={() => openNameSuggestFrom('selection')}
          >
            Gợi ý Hán-Việt
          </button>
        </div>
      </label>
    </div>

    {#if selectionMapped?.source_context}
      <div class="context-card">
        <div><small>Ngữ cảnh gốc:</small> <span>{selectionMapped.source_context}</span></div>
        <div><small>Ngữ cảnh dịch:</small> <span>{selectionMapped.translated_context}</span></div>
      </div>
    {/if}

    <div class="dialog-actions">
      {#if selectionExistingMeta}
        <button
          type="button"
          class="button"
          disabled={pending !== null}
          onclick={deleteSelectionName}
        >
          Xóa khỏi {selectionExistingMeta.setName}
        </button>
      {/if}
      <button type="button" class="button" onclick={() => selectionNameDialog.close()}>Hủy</button>
      <button type="submit" class="button primary" disabled={pending !== null}>
        {selectionExistingMeta ? 'Cập nhật & Dịch lại' : 'Lưu Name & Dịch lại'}
      </button>
    </div>
  </form>
</dialog>

<!-- Dialog 2: Quản lý Name riêng / VP / Lịch sử / Server DichNgay -->
<dialog bind:this={nameManagerDialog} class="modal-box modal-wide" aria-labelledby="name-mgr-title">
  <header class="modal-head">
    <div>
      <h2 id="name-mgr-title">Name riêng &amp; Từ điển dịch thuật</h2>
      <p class="modal-hint">
        Scope hiện tại: <strong>{current ? current.title : 'Toàn cục'}</strong> · Bộ đang áp dụng:
        <strong>{nameSetState.active_set}</strong> (v{nameSetState.version})
      </p>
    </div>
    <button type="button" class="button subtle" onclick={() => nameManagerDialog.close()}>
      Đóng
    </button>
  </header>

  <div class="tab-strip" role="tablist">
    <button
      type="button"
      class="tab-btn"
      class:active={nameTab === 'entries'}
      onclick={() => (nameTab = 'entries')}
    >
      Danh sách từ ({Object.keys(activeDictEntries).length})
    </button>
    <button
      type="button"
      class="tab-btn"
      class:active={nameTab === 'bulk'}
      onclick={() => (nameTab = 'bulk')}
    >
      Nhập / Xuất nhanh
    </button>
    <button
      type="button"
      class="tab-btn"
      class:active={nameTab === 'history'}
      onclick={() => (nameTab = 'history')}
    >
      Lịch sử ({nameHistory.length})
    </button>
    <button
      type="button"
      class="tab-btn"
      class:active={nameTab === 'server'}
      onclick={() => (nameTab = 'server')}
    >
      Bộ nhớ dịch
    </button>
  </div>

  {#if nameTab === 'entries'}
    <div class="dict-toolbar">
      <label class="inline-field">
        <span>Loại từ điển</span>
        <select bind:value={dictType}>
          <option value="name">Name (Tên riêng)</option>
          <option value="vp">VietPhrase (Cụm từ)</option>
        </select>
      </label>
      <label class="inline-field">
        <span>Phạm vi</span>
        <select bind:value={dictScope}>
          <option value="book">Theo truyện đang mở</option>
          <option value="global">Dùng chung toàn cục</option>
        </select>
      </label>
      {#if dictScope === 'book' && dictType === 'name'}
        <label class="inline-field">
          <span>Bộ Name</span>
          <select
            value={nameSetState.active_set}
            onchange={(e) => switchActiveNameSet((e.currentTarget as HTMLSelectElement).value)}
          >
            {#each Object.keys(nameSetState.sets) as sName (sName)}
              <option value={sName}>{sName}</option>
            {/each}
          </select>
        </label>
        <div class="set-add-inline">
          <input
            type="text"
            placeholder="Tên bộ mới…"
            bind:value={newSetName}
          />
          <button
            type="button"
            class="button"
            disabled={!newSetName.trim() || pending !== null}
            onclick={createNewNameSet}
          >
            + Tạo bộ
          </button>
          {#if Object.keys(nameSetState.sets).length > 1}
            <button
              type="button"
              class="button subtle"
              disabled={pending !== null}
              onclick={deleteCurrentNameSet}
            >
              Xóa bộ
            </button>
          {/if}
        </div>
      {/if}
    </div>

    <form class="entry-add-bar" onsubmit={saveManagerSingleEntry}>
      <input
        type="text"
        required
        placeholder="Tên gốc tiếng Trung (VD: 萧炎)"
        bind:value={formSource}
      />
      <input
        type="text"
        required
        placeholder="Tên dịch tiếng Việt (VD: Tiêu Viêm)"
        bind:value={formTarget}
      />
      <button
        type="button"
        class="button"
        disabled={!formSource.trim()}
        onclick={() => openNameSuggestFrom('manager')}
      >
        Gợi ý
      </button>
      <button type="submit" class="button primary" disabled={pending !== null}>
        Lưu mục
      </button>
    </form>

    <div class="table-filter-bar">
      <input
        type="search"
        placeholder="Lọc theo chữ Hán hoặc nghĩa tiếng Việt…"
        bind:value={entryFilter}
      />
      <span class="num-stat">{filteredDictRows.length} mục</span>
    </div>

    <div class="dict-table-wrap">
      <table class="dict-table">
        <thead>
          <tr>
            <th>Tên gốc</th>
            <th>Tên dịch</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {#each filteredDictRows as [src, tgt] (src)}
            <tr>
              <td class="cjk-cell">{src}</td>
              <td>{tgt}</td>
              <td class="action-cell">
                <button
                  type="button"
                  class="button subtle"
                  onclick={() => {
                    formSource = src;
                    formTarget = tgt;
                  }}
                >
                  Sửa
                </button>
                <button
                  type="button"
                  class="button subtle"
                  disabled={pending !== null}
                  onclick={() => removeManagerEntry(src)}
                >
                  Xóa
                </button>
              </td>
            </tr>
          {:else}
            <tr>
              <td colspan="3" class="empty-cell">Chưa có mục nào trong bộ từ điển này.</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {:else if nameTab === 'bulk'}
    <form class="bulk-form" onsubmit={applyBulkNameText}>
      <p class="modal-hint">
        Mỗi dòng một cặp theo định dạng <code>Tên_gốc=Tên_dịch</code> (tương thích hoàn toàn với TM
        Translate và Reader Server).
      </p>
      <textarea
        rows="10"
        placeholder="萧炎=Tiêu Viêm&#10;药老=Dược Lão"
        bind:value={bulkText}
      ></textarea>
      <div class="bulk-controls">
        <label class="checkbox-label">
          <input type="checkbox" bind:checked={bulkReplace} />
          <span>Thay thế toàn bộ bộ hiện tại (bỏ chọn nếu chỉ muốn gộp thêm)</span>
        </label>
        <button type="submit" class="button primary" disabled={pending !== null}>
          Áp dụng danh sách
        </button>
      </div>
    </form>
  {:else if nameTab === 'history'}
    <div class="dict-table-wrap">
      <table class="dict-table">
        <thead>
          <tr>
            <th>Thao tác</th>
            <th>Bộ</th>
            <th>Tên gốc</th>
            <th>Tên dịch mới</th>
            <th>Trước đó</th>
          </tr>
        </thead>
        <tbody>
          {#each nameHistory as item (item.event_id)}
            <tr>
              <td><span class="kind-tag">{item.action_type}</span></td>
              <td>{item.set_name}</td>
              <td class="cjk-cell">{item.source_text || '—'}</td>
              <td>{item.target_text || '—'}</td>
              <td>{item.previous_target_text || '—'}</td>
            </tr>
          {:else}
            <tr>
              <td colspan="5" class="empty-cell">Chưa có lịch sử chỉnh sửa Name riêng cho truyện này.</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {:else if nameTab === 'server'}
    <div class="server-form">
      <div><button type="button" class="button" onclick={async () => {
        nameManagerDialog?.close();
        if (fullscreen) await toggleFullscreen();
        if (!fullscreen) onTranslationSettings();
      }}>Cài đặt dịch thuật</button></div>
      <div class="cache-card">
        <div>
          <strong>Bộ nhớ dịch</strong>
          <p class="modal-hint num-stat">
            {cacheStats.translation_memory_count} câu đã lưu · {cacheStats.chapter_cache_count} chương đã lưu
          </p>
        </div>
        <button
          type="button"
          class="button"
          disabled={pending !== null}
          onclick={clearAllTranslationMemory}
        >
          Xóa bộ nhớ dịch
        </button>
      </div>
    </div>
  {/if}
</dialog>

<!-- Dialog 3: Popup Gợi ý Hán-Việt viết hoa tăng dần & Từ điển (TM Translate flow) -->
<dialog bind:this={nameSuggestDialog} class="modal-box modal-wide" aria-labelledby="suggest-title">
  <header class="modal-head">
    <div>
      <h2 id="suggest-title">Gợi ý Name — {suggestSource}</h2>
      <p class="modal-hint">
        {#if suggestBusy}
          Đang lấy âm Hán-Việt từ DichNgay (tl=hv)…
        {:else}
          Âm Hán-Việt gốc: <strong>{suggestHvRaw}</strong> · Bấm vào 1 dòng để chọn ngay.
        {/if}
      </p>
    </div>
    <button type="button" class="button subtle" onclick={() => nameSuggestDialog.close()}>
      Đóng
    </button>
  </header>

  <div class="suggest-split">
    <div class="suggest-col">
      <h3>Biến thể Hán-Việt viết hoa tăng dần</h3>
      <table class="dict-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Gốc</th>
            <th>Hán-Việt</th>
          </tr>
        </thead>
        <tbody>
          {#each suggestLeftItems as row (row.index)}
            <tr
              class="clickable-row"
              onclick={() => pickSuggestion(row.source_text, row.han_viet)}
            >
              <td class="num-stat">{row.index}</td>
              <td class="cjk-cell">{row.source_text}</td>
              <td><strong>{row.han_viet}</strong></td>
            </tr>
          {:else}
            <tr>
              <td colspan="3" class="empty-cell">
                {suggestBusy ? 'Đang tải…' : 'Không có gợi ý Hán-Việt.'}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <div class="suggest-col">
      <h3>Gợi ý từ Name / VietPhrase</h3>
      <table class="dict-table">
        <thead>
          <tr>
            <th>Tên gợi ý</th>
            <th>Nguồn</th>
            <th>Chọn</th>
          </tr>
        </thead>
        <tbody>
          {#each suggestRightItems as row (row.index)}
            <tr>
              <td><strong>{row.target_text}</strong></td>
              <td><span class="kind-tag">{row.origin}</span></td>
              <td>
                <button
                  type="button"
                  class="button subtle"
                  onclick={() => pickSuggestion(row.source_text, row.target_text)}
                >
                  Dùng
                </button>
              </td>
            </tr>
          {:else}
            <tr>
              <td colspan="3" class="empty-cell">Chưa có mục trùng trong từ điển.</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
</dialog>

<dialog bind:this={readingOptions} class="modal-box" aria-labelledby="reader-options-title">
  <h2 id="reader-options-title">Tùy chọn đọc</h2>
  <div class="settings-grid reader-options">
    <label class="settings-field">Cỡ chữ · {readerPrefs.size}
      <input type="range" min="15" max="32" bind:value={readerPrefs.size} />
    </label>
    <label class="settings-field">Kiểu chữ
      <select bind:value={readerPrefs.font}><option value="serif">Có chân</option><option value="sans">Không chân</option></select>
    </label>
    <label class="settings-field">Giãn dòng
      <select bind:value={readerPrefs.spacing}><option value="normal">Vừa</option><option value="relaxed">Thoáng</option></select>
    </label>
    <label class="settings-field">Khổ đọc
      <select bind:value={readerPrefs.width}><option value="narrow">Hẹp</option><option value="normal">Vừa</option><option value="wide">Rộng</option></select>
    </label>
    <label class="settings-field">Màu trang
      <select bind:value={readerPrefs.paper}><option value="app">Theo ứng dụng</option><option value="sepia">Giấy ấm</option><option value="night">Đọc ban đêm</option></select>
    </label>
    {#if hasChapters}
      <label class="settings-field">Nguồn bản dịch
        <select bind:value={translateMode} disabled={pending !== null} onchange={onTranslateModeChange}>
          <option value="server">Dịch Ngay</option><option value="tm_translate_beta">Bộ nhớ dịch (thử nghiệm)</option>
        </select>
      </label>
    {/if}
  </div>
  <div class="reading-actions">
    <button class="button subtle" type="button" disabled={pending !== null}
      onclick={() => { readingOptions.close(); void openNameManager(); }}>Từ điển</button>
    {#if readMode === 'chapter' && chapter}
      {#if viewLang === 'trans'}
        <button class="button subtle" type="button" disabled={pending !== null}
          onclick={() => { readingOptions.close(); void reloadCurrentChapterTranslation(); }}>Dịch lại chương</button>
      {/if}
    {/if}
    {#if current?.kind === 'txt' && hasChapters && toc?.encoding.startsWith('utf-8')}
      <button class="button subtle" type="button" disabled={pending !== null}
        onclick={() => { readingOptions.close(); void toggleReadMode(); }}>
        {readMode === 'chapter' ? 'Đọc theo trang' : 'Đọc theo chương'}
      </button>
    {/if}
    <button class="button subtle" type="button" disabled={pending !== null}
      onclick={async () => {
        readingOptions.close();
        if (fullscreen) await toggleFullscreen();
        if (!fullscreen) removeDialog.showModal();
      }}>Bỏ khỏi thư viện</button>
  </div>
  <div class="dialog-actions">
    <button class="button" type="button" onclick={() => { readerPrefs = { ...defaultReaderPrefs }; }}>Mặc định</button>
    <button class="button primary" type="button" onclick={() => readingOptions.close()}>Xong</button>
  </div>
</dialog>

<dialog bind:this={removeDialog} aria-labelledby="remove-book-title">
  <h2 id="remove-book-title">Bỏ khỏi thư viện?</h2>
  <p>{current?.title}. Tệp gốc vẫn ở vị trí hiện tại trên máy.</p>
  <div class="dialog-actions">
    <button type="button" class="button" onclick={() => removeDialog.close()}>Hủy</button>
    <button type="button" class="button primary" onclick={removeBook}>Bỏ khỏi thư viện</button>
  </div>
</dialog>

<dialog id="library-stats-dialog" class="modal-box" bind:this={statsDialog} aria-labelledby="library-stats-title">
  <div class="modal-head">
    <div>
      <h2 id="library-stats-title">{t('stats.title')}</h2>
    </div>
    <button
      id="library-stats-refresh-btn"
      type="button"
      class="button primary"
      disabled={statsBusy}
      onclick={() => loadStatsData(true)}
    >
      {statsBusy ? t('stats.refreshing') : t('stats.refresh')}
    </button>
  </div>

  {#if statsError}
    <p class="notice error" role="alert">{statsError}</p>
  {/if}

  {#if libraryStats}
    <div class="stats-grid">
      <div class="stat-kpi-card">
        <span class="stat-kpi-label">{t('stats.books')}</span>
        <strong class="stat-kpi-value">{libraryStats.book_count.toLocaleString()}</strong>
        <span class="stat-kpi-sub">
          {t('stats.books_sub', {
            txt: libraryStats.txt_count,
            zip: libraryStats.zip_count,
            measured: libraryStats.measured_books,
            total: libraryStats.book_count,
          })}
        </span>
      </div>
      <div class="stat-kpi-card">
        <span class="stat-kpi-label">{t('stats.chapters')}</span>
        <strong class="stat-kpi-value">{libraryStats.total_chapters.toLocaleString()}</strong>
        <span class="stat-kpi-sub">{t('stats.chars')}: {libraryStats.total_chars.toLocaleString()}</span>
      </div>
      <div class="stat-kpi-card">
        <span class="stat-kpi-label">{t('stats.words')}</span>
        <strong class="stat-kpi-value">{libraryStats.total_words.toLocaleString()}</strong>
        <span class="stat-kpi-sub">{t('stats.source_size')}: {formatSize(libraryStats.total_source_bytes)}</span>
      </div>
      <div class="stat-kpi-card">
        <span class="stat-kpi-label">{t('stats.compressed_size')}</span>
        <strong class="stat-kpi-value">{formatSize(libraryStats.total_compressed_bytes)}</strong>
        <span class="stat-kpi-sub">
          {t('stats.compression_saved', { pct: libraryStats.compression_ratio_percent })}
        </span>
      </div>
    </div>
  {/if}

  <div class="dialog-actions">
    <button type="button" class="button" onclick={() => statsDialog.close()}>{t('stats.close')}</button>
  </div>
</dialog>

<style>
  .heading[hidden], .shelf[hidden] { display: none; }
  .heading-actions { display: flex; align-items: center; gap: 10px; flex-wrap: nowrap; flex-shrink: 0; }
  .shelf { min-width: 0; padding: 0; overflow: hidden; }
  .shelf-head { display: grid; gap: 12px; padding: 16px; }
  .shelf-items { margin: 0; padding: 0; list-style: none; max-height: 46vh; overflow: auto; }
  .shelf-items button {
    width: 100%; min-height: 58px; display: grid; gap: 5px; padding: 9px 14px;
    text-align: start; border: 0; border-top: 1px solid var(--line);
    background: var(--sheet); color: var(--ink); font-weight: 600;
    transition: background-color var(--motion-fast) var(--ease-out);
  }
  .shelf-items button:focus-visible { outline-offset: -3px; }
  .shelf-items button:hover:not(:disabled) { background: var(--inset); }
  .shelf-items button[aria-pressed="true"] {
    background: var(--selection); color: var(--accent); box-shadow: inset 3px 0 var(--accent);
  }
  .book-row-top, .book-row-meta {
    display: flex; align-items: center; justify-content: space-between; gap: 8px; min-width: 0;
  }
  .book-title, .book-row-meta small:first-child {
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0;
  }
  .book-row-meta small { color: var(--muted); font-size: 11.5px; font-weight: 400; }
  .kind-tag {
    flex-shrink: 0; padding: 1px 6px; border-radius: 4px; font-size: 10.5px; font-weight: 700;
    letter-spacing: 0.03em; background: var(--inset); color: var(--muted); border: 1px solid var(--line);
  }
  .kind-tag.is-zip {
    background: var(--accent-soft); color: var(--accent); border-color: color-mix(in srgb, var(--accent) 32%, var(--line));
  }
  .num-stat { font-variant-numeric: tabular-nums; }
  .shelf-empty { padding: 0 16px 16px; color: var(--muted); font-size: 13px; }

  .reader-title-group { min-width: 0; }
  .reader h2 { overflow-wrap: anywhere; }
  .reader .notice .button, .shelf .notice .button { margin-top: 8px; }

  .lang-segmented {
    display: inline-flex; align-items: center; padding: 2px;
    border-radius: var(--radius-sm); background: var(--inset); border: 1px solid var(--line);
  }
  .seg-btn {
    border: 0; background: transparent; color: var(--muted); font-weight: 600; font-size: 12px;
    padding: 4px 10px; border-radius: calc(var(--radius-sm) - 2px); cursor: pointer;
    transition: background-color var(--motion-fast) var(--ease-out), color var(--motion-fast) var(--ease-out);
  }
  .seg-btn.active {
    background: var(--accent); color: #fff;
  }

  .selection-bar {
    display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;
    padding: 8px 14px; background: var(--selection); border-bottom: 1px solid var(--line);
    font-size: 13px;
  }
  .selection-preview { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .selection-actions { display: flex; align-items: center; gap: 8px; }

  .toc-panel {
    border-bottom: 1px solid var(--line);
    background: var(--inset);
    padding: 10px 14px 12px;
  }
  .toc-bar {
    display: flex; align-items: center; gap: 10px; margin-bottom: 8px;
  }
  .toc-bar input { flex: 1; min-height: 32px !important; }
  .toc-bar span { font-size: 12px; color: var(--muted); white-space: nowrap; }
  .toc-list {
    list-style: none; margin: 0; padding: 0;
    max-height: 220px; overflow: auto;
    border: 1px solid var(--line); border-radius: var(--radius-sm); background: var(--sheet);
  }
  .toc-list button {
    width: 100%; display: grid; grid-template-columns: 40px minmax(0, 1fr);
    align-items: center; gap: 8px; padding: 7px 10px;
    border: 0; border-bottom: 1px solid var(--line);
    background: transparent; color: var(--ink); text-align: start; font-size: 13px;
    transition: background-color var(--motion-fast) var(--ease-out);
  }
  .toc-list li:last-child button { border-bottom: 0; }
  .toc-list button:hover:not(:disabled) { background: var(--inset); }
  .toc-list button.active { background: var(--selection); color: var(--accent); font-weight: 600; }
  .toc-idx { color: var(--muted); font-size: 12px; }
  .toc-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  .reader-header { align-items: center; gap: 10px; }
  .reader-header h2 { margin: 0; font-size: 17px; }
  .reader-header .proof-actions { margin-left: auto; }
  .reader-fullscreen {
    position: fixed; inset: 0; z-index: 30; border: 0; border-radius: 0;
    display: flex; flex-direction: column; background: var(--sheet);
  }
  .reader-fullscreen .proof-head, .reader-fullscreen .proof-footer { padding-inline: clamp(18px, 5vw, 72px); }
  .reader-fullscreen .reading-body { flex: 1 1 auto; min-height: 0; max-height: none; }
  .reader-fullscreen .toc-panel { flex-shrink: 0; }
  .reading-body {
    --reader-ink: var(--ink);
    --reader-page: var(--sheet);
    --reader-rule: var(--line);
    --reader-spacing: 1.72;
    --reader-width: 66ch;
    --reader-font: Cambria, Georgia, serif;
    color: var(--reader-ink); background: var(--reader-page);
    min-height: clamp(320px, 54vh, 760px);
    max-height: clamp(320px, 61vh, 840px);
    transition: background-color var(--motion-fast) var(--ease-out), color var(--motion-fast) var(--ease-out);
  }
  .reading-body[data-paper='sepia'] { --reader-ink: #33261b; --reader-page: #f6ecda; --reader-rule: #d8c4a7; }
  .reading-body[data-paper='night'] { --reader-ink: #e3dfd6; --reader-page: #171b22; --reader-rule: #374151; }
  .reading-body[data-spacing='relaxed'] { --reader-spacing: 1.96; }
  .reading-body[data-width='narrow'] { --reader-width: 53ch; }
  .reading-body[data-width='wide'] { --reader-width: 82ch; }
  .reading-body[data-font='sans'] { --reader-font: system-ui, sans-serif; }
  .reader-options { margin-block: 18px; }
  .reading-actions { display: flex; gap: 8px; flex-wrap: wrap; padding-block: 10px; border-top: 1px solid var(--line); }
  .reading-body:focus-visible {
    outline: 1px solid color-mix(in srgb, var(--accent) 55%, transparent);
    outline-offset: -1px;
  }
  .reading-page {
    box-sizing: content-box;
    max-width: var(--reader-width); margin-inline: auto; padding: 20px clamp(16px, 3vw, 34px) 28px;
    font: 400 var(--reader-size, 20px)/var(--reader-spacing) var(--reader-font);
    overflow-wrap: anywhere;
  }
  .chapter-heading {
    font: 600 1.15em/1.36 var(--reader-font);
    letter-spacing: -0.015em;
    color: var(--reader-ink);
    margin: 0 0 18px;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--reader-rule);
  }
  .chapter-text, .reading-plain { white-space: pre-wrap; }
  .chapter-heading.visually-hidden {
    position: absolute; clip-path: inset(50%); width: 1px; height: 1px;
    overflow: hidden; margin: 0; padding: 0; border: 0;
  }

  .reading-page { animation: page-appear var(--motion-fast) var(--ease-out); }
  @keyframes page-appear { from { opacity: .7; } }

  .modal-box {
    width: min(560px, calc(100vw - 28px));
    max-height: 86vh;
    overflow: auto;
  }
  .modal-box.modal-wide {
    width: min(820px, calc(100vw - 28px));
  }
  .modal-head {
    display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 8px;
  }
  .modal-head h2 { margin: 0; font-size: 18px; }
  .modal-hint { margin: 4px 0 12px; color: var(--muted); font-size: 13px; }

  .chip-row { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }
  .chip-btn {
    border: 1px solid var(--line); background: var(--inset); color: var(--ink);
    border-radius: 999px; padding: 3px 10px; font-size: 12.5px; cursor: pointer;
  }
  .chip-btn.active {
    background: var(--selection); color: var(--accent); border-color: var(--accent); font-weight: 600;
  }

  .field-grid { display: grid; gap: 10px; margin-bottom: 12px; }
  .field-label { display: grid; gap: 4px; font-size: 13px; font-weight: 600; }
  .input-with-btn { display: grid; grid-template-columns: 1fr auto; gap: 8px; }

  .context-card {
    display: grid; gap: 4px; padding: 9px 12px; margin-bottom: 12px;
    border-radius: var(--radius-sm); background: var(--inset); border: 1px solid var(--line);
    font-size: 12.5px;
  }
  .context-card small { color: var(--muted); font-weight: 600; }

  .tab-strip {
    display: flex; gap: 6px; flex-wrap: wrap; border-bottom: 1px solid var(--line);
    padding-bottom: 8px; margin-bottom: 12px;
  }
  .tab-btn {
    border: 1px solid transparent; background: transparent; color: var(--muted);
    padding: 5px 11px; border-radius: var(--radius-sm); font-size: 13px; font-weight: 600; cursor: pointer;
  }
  .tab-btn.active {
    background: var(--selection); color: var(--accent); border-color: color-mix(in srgb, var(--accent) 30%, var(--line));
  }

  .dict-toolbar {
    display: flex; flex-wrap: wrap; align-items: flex-end; gap: 10px; margin-bottom: 10px;
  }
  .inline-field { display: grid; gap: 4px; font-size: 12px; color: var(--muted); }
  .set-add-inline { display: flex; align-items: center; gap: 6px; }
  .set-add-inline input { width: 130px; }

  .entry-add-bar {
    display: grid; grid-template-columns: 1fr 1fr auto auto; gap: 8px; margin-bottom: 10px;
  }
  .table-filter-bar {
    display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 8px;
  }
  .table-filter-bar input { flex: 1; }
  .table-filter-bar span { font-size: 12px; color: var(--muted); }

  .dict-table-wrap {
    max-height: 280px; overflow: auto; border: 1px solid var(--line); border-radius: var(--radius-sm);
  }
  .dict-table { width: 100%; border-collapse: collapse; font-size: 13px; }
  .dict-table th, .dict-table td {
    padding: 7px 10px; border-bottom: 1px solid var(--line); text-align: start;
  }
  .dict-table th { background: var(--inset); font-size: 12px; color: var(--muted); position: sticky; top: 0; }
  .cjk-cell { font-weight: 600; }
  .action-cell { display: flex; gap: 6px; }
  .empty-cell { text-align: center !important; color: var(--muted); padding: 18px !important; }

  .bulk-form, .server-form { display: grid; gap: 10px; }
  .bulk-form textarea { width: 100%; font-family: Consolas, monospace; font-size: 13px; padding: 8px; }
  .bulk-controls { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
  .checkbox-label { display: flex; align-items: center; gap: 6px; font-size: 13px; }

  .cache-card {
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
    padding: 10px 12px; border-radius: var(--radius-sm); background: var(--inset); border: 1px solid var(--line);
  }

  .suggest-split { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .suggest-col h3 { font-size: 13px; margin: 0 0 6px; color: var(--muted); }
  .clickable-row { cursor: pointer; }
  .clickable-row:hover { background: var(--selection); }
</style>
