import { initShell } from "../site_common.js?v=20260215-vb01";
import { buildParagraphNodes, normalizeDisplayTitle, normalizeReaderText } from "../reader_text.js?v=20260215-vb01";

const refs = {
  readerBookTitle: document.getElementById("reader-book-title"),
  readerChapterSub: document.getElementById("reader-chapter-sub"),
  readerViewport: document.getElementById("reader-viewport"),
  readerContentScroll: document.getElementById("reader-content-scroll"),
  readerContentBody: document.getElementById("reader-content-body"),
  readerScrollHint: document.getElementById("reader-scroll-hint"),
  readerChapterCounter: document.getElementById("reader-chapter-counter"),
  readerPageCounter: document.getElementById("reader-page-counter"),
  readerBookPercent: document.getElementById("reader-book-percent"),
  readerMiniHead: document.getElementById("reader-mini-head"),
  readerMiniFoot: document.getElementById("reader-mini-foot"),
  readerMiniChapterTitle: document.getElementById("reader-mini-chapter-title"),
  readerMiniChapterCounter: document.getElementById("reader-mini-chapter-counter"),
  readerMiniPageCounter: document.getElementById("reader-mini-page-counter"),
  readerMiniBookPercent: document.getElementById("reader-mini-book-percent"),

  btnReaderToc: document.getElementById("btn-reader-toc"),
  btnOpenSettingsInline: document.getElementById("btn-open-settings-inline"),
  btnModeRaw: document.getElementById("btn-mode-raw"),
  btnModeTrans: document.getElementById("btn-mode-trans"),
  btnTranslateMode: document.getElementById("btn-translate-mode"),
  btnReloadChapter: document.getElementById("btn-reload-chapter"),
  btnOpenNameEditor: document.getElementById("btn-open-name-editor"),
  btnFullscreen: document.getElementById("btn-fullscreen"),
  btnPrev: document.getElementById("btn-prev"),
  btnFooterToc: document.getElementById("btn-footer-toc"),
  btnNext: document.getElementById("btn-next"),

  readerTocDrawer: document.getElementById("reader-toc-drawer"),
  readerTocList: document.getElementById("reader-toc-list"),
  btnCloseReaderToc: document.getElementById("btn-close-reader-toc"),
  readerTocTitle: document.getElementById("reader-toc-title"),

  nameEditorDialog: document.getElementById("name-editor-dialog"),
  nameEditorTitle: document.getElementById("name-editor-title"),
  btnCloseNameEditor: document.getElementById("btn-close-name-editor"),
  btnRefreshNamePreview: document.getElementById("btn-refresh-name-preview"),
  btnAddNameSet: document.getElementById("btn-add-name-set"),
  btnDeleteNameSet: document.getElementById("btn-delete-name-set"),
  btnExportNameSet: document.getElementById("btn-export-name-set"),
  btnImportNameSet: document.getElementById("btn-import-name-set"),
  nameSetImportFile: document.getElementById("name-set-import-file"),
  nameSetLabel: document.getElementById("name-set-label"),
  nameSetSelect: document.getElementById("name-set-select"),
  nameEntryForm: document.getElementById("name-entry-form"),
  nameSourceLabel: document.getElementById("name-source-label"),
  nameTargetLabel: document.getElementById("name-target-label"),
  nameSourceInput: document.getElementById("name-source-input"),
  nameSourceSuggest: document.getElementById("name-source-suggestions"),
  nameTargetInput: document.getElementById("name-target-input"),
  btnOpenNameSuggest: document.getElementById("btn-open-name-suggest"),
  btnAddNameEntry: document.getElementById("btn-add-name-entry"),
  namePreviewHint: document.getElementById("name-preview-hint"),
  namePreviewBody: document.getElementById("name-preview-body"),
  nameColSource: document.getElementById("name-col-source"),
  nameColTarget: document.getElementById("name-col-target"),
  nameColCount: document.getElementById("name-col-count"),
  nameColAction: document.getElementById("name-col-action"),
  nameSuggestDialog: document.getElementById("name-suggest-dialog"),
  nameSuggestTitle: document.getElementById("name-suggest-title"),
  btnCloseNameSuggest: document.getElementById("btn-close-name-suggest"),
  nameSuggestHint: document.getElementById("name-suggest-hint"),
  nameSuggestColIndex: document.getElementById("name-suggest-col-index"),
  nameSuggestColSource: document.getElementById("name-suggest-col-source"),
  nameSuggestColHv: document.getElementById("name-suggest-col-hv"),
  nameSuggestColTarget: document.getElementById("name-suggest-col-target"),
  nameSuggestColAction: document.getElementById("name-suggest-col-action"),
  nameSuggestLeftBody: document.getElementById("name-suggest-left-body"),
  nameSuggestRightBody: document.getElementById("name-suggest-right-body"),

  selectionNameBtn: document.getElementById("selection-name-btn"),
  readerHead: document.querySelector(".reader-head"),
  readerFooter: document.querySelector(".reader-footer"),
};

const state = {
  shell: null,
  bookId: "",
  chapterId: "",
  book: null,
  mode: "trans",
  translateMode: "server",
  nameSets: { "Mặc định": {} },
  activeNameSet: "Mặc định",
  saveTimer: null,
  chapterText: "",
  flipPages: [],
  flipPageIndex: 0,
  chapterCache: new Map(),
  chapterPending: new Map(),
  prefetchControllers: new Map(),
  activeChapterController: null,
  chapterLoadSeq: 0,
  fullscreenUiTimer: null,
  fullscreenFallback: false,
  chapterVirtualPages: 1,
  virtualPageIndex: 0,
  bookPercent: 0,
  scrollHintTimer: null,
  infiniteScrollProgressPx: 0,
  infiniteScrollDirection: 0,
  chapterTransitioning: false,
  runtimeMode: "hybrid",
  chapterContentType: "text",
  chapterImages: [],
};

function supportsTranslation(book) {
  if (!book) return false;
  if (typeof book.translation_supported === "boolean") return book.translation_supported;
  const sourceType = String(book.source_type || "").toLowerCase();
  if (sourceType === "vbook_comic" || sourceType === "comic") return false;
  const lang = String(book.lang_source || "").toLowerCase();
  return lang === "zh" || lang.startsWith("zh-");
}

function effectiveMode() {
  if (!supportsTranslation(state.book)) return "raw";
  return state.mode === "trans" ? "trans" : "raw";
}

function selectedReadingMode() {
  if (!state.shell) return "vertical";
  return state.shell.getReadingMode();
}

function runtimeReadingMode() {
  if (state.chapterContentType === "images") return "vertical";
  const selected = selectedReadingMode();
  if (selected === "hybrid") return "hybrid";
  if (isFullscreenActive()) return selected;
  return "hybrid";
}

function applyReaderModeClass() {
  const mode = runtimeReadingMode();
  state.runtimeMode = mode;
  refs.readerViewport.classList.remove("reading-flip", "reading-horizontal", "reading-vertical", "reading-hybrid");
  refs.readerViewport.classList.add(`reading-${mode}`);
  document.body.classList.remove("reader-mode-flip", "reader-mode-horizontal", "reader-mode-vertical", "reader-mode-hybrid");
  document.body.classList.add(`reader-mode-${mode}`);
  document.body.setAttribute("data-runtime-reading-mode", mode);
}

function findChapterIndex() {
  const list = (state.book && state.book.chapters) || [];
  return list.findIndex((x) => x.chapter_id === state.chapterId);
}

function findChapterAt(index) {
  const list = (state.book && state.book.chapters) || [];
  if (index < 0 || index >= list.length) return null;
  return list[index];
}

function chapterCacheKey(chapterId, mode = effectiveMode(), translationMode = state.translateMode) {
  return `${String(chapterId || "")}::${String(mode || "raw")}::${String(translationMode || "server")}`;
}

function isAbortError(error) {
  if (!error) return false;
  const name = String(error.name || "");
  const message = String(error.message || "");
  return name === "AbortError" || /abort/i.test(message);
}

function clearChapterCache() {
  state.chapterCache.clear();
  state.chapterPending.clear();
}

function dropChapterCacheById(chapterId) {
  const keyPrefix = `${String(chapterId || "")}::`;
  if (!keyPrefix.trim()) return;
  for (const key of Array.from(state.chapterCache.keys())) {
    if (key.startsWith(keyPrefix)) state.chapterCache.delete(key);
  }
  for (const key of Array.from(state.chapterPending.keys())) {
    if (key.startsWith(keyPrefix)) state.chapterPending.delete(key);
  }
  for (const [key, controller] of Array.from(state.prefetchControllers.entries())) {
    if (!key.startsWith(keyPrefix)) continue;
    try {
      controller.abort();
    } catch {
      // ignore
    }
    state.prefetchControllers.delete(key);
  }
}

function cancelPrefetch(exceptKeys = new Set()) {
  for (const [key, controller] of state.prefetchControllers.entries()) {
    if (exceptKeys.has(key)) continue;
    try {
      controller.abort();
    } catch {
      // ignore
    }
    state.prefetchControllers.delete(key);
  }
}

async function fetchChapterContent(chapterId, { mode = effectiveMode(), translationMode = state.translateMode, signal = null } = {}) {
  const key = chapterCacheKey(chapterId, mode, translationMode);
  if (state.chapterCache.has(key)) {
    return state.chapterCache.get(key);
  }
  if (state.chapterPending.has(key)) {
    return state.chapterPending.get(key);
  }

  const req = state.shell.api(
    `/api/library/chapter/${encodeURIComponent(chapterId)}?mode=${encodeURIComponent(mode)}&translation_mode=${encodeURIComponent(translationMode)}`,
    signal ? { signal } : undefined,
  )
    .then((chapter) => {
      const safe = chapter || { content: "" };
      state.chapterCache.set(key, safe);
      return safe;
    })
    .finally(() => {
      if (state.chapterPending.get(key) === req) {
        state.chapterPending.delete(key);
      }
    });

  state.chapterPending.set(key, req);
  return req;
}

function prefetchNearbyChapters() {
  if (!state.book || !state.chapterId) return;
  const idx = findChapterIndex();
  if (idx < 0) return;

  const mode = effectiveMode();
  const translationMode = state.translateMode;
  const chapters = [findChapterAt(idx - 1), findChapterAt(idx + 1)].filter(Boolean);
  const keepKeys = new Set(chapters.map((ch) => chapterCacheKey(ch.chapter_id, mode, translationMode)));
  cancelPrefetch(keepKeys);

  for (const chapter of chapters) {
    const cid = chapter.chapter_id;
    if (!cid) continue;
    const key = chapterCacheKey(cid, mode, translationMode);
    if (state.chapterCache.has(key) || state.chapterPending.has(key) || state.prefetchControllers.has(key)) continue;

    const controller = new AbortController();
    state.prefetchControllers.set(key, controller);
    fetchChapterContent(cid, { mode, translationMode, signal: controller.signal })
      .catch(() => {
        // prefetch fail không chặn UI
      })
      .finally(() => {
        if (state.prefetchControllers.get(key) === controller) {
          state.prefetchControllers.delete(key);
        }
      });
  }
}

function chapterTitle(ch) {
  if (!ch) return "";
  if (effectiveMode() === "trans" && ch.title_vi) return normalizeDisplayTitle(ch.title_vi);
  return normalizeDisplayTitle(ch.title_raw || ch.title_display || `Chương ${ch.chapter_order || "?"}`);
}

function updateHeader() {
  if (!state.book) {
    refs.readerBookTitle.textContent = state.shell.t("noBookSelected");
    refs.readerChapterSub.textContent = "";
    refs.readerChapterCounter.textContent = state.shell.t("chapterCounter", { current: 0, total: 0 });
    refs.readerPageCounter.textContent = state.shell.t("pageCounter", { current: 0, total: 0 });
    refs.readerBookPercent.textContent = state.shell.t("bookPercent", { percent: "0.0" });
    if (refs.readerMiniChapterTitle) refs.readerMiniChapterTitle.textContent = "";
    return;
  }
  const ch = (state.book.chapters || []).find((x) => x.chapter_id === state.chapterId);
  const chapterName = chapterTitle(ch) || state.shell.t("readerEmpty");
  const bookName = effectiveMode() === "trans"
    ? normalizeDisplayTitle(state.book.title_vi || state.book.title_display || state.book.title)
    : normalizeDisplayTitle(state.book.title || state.book.title_display);
  // Bỏ title chương "cứng" ở phần head lớn: head lớn dùng tên truyện,
  // mini header overlay sẽ hiển thị tên chương khi user cuộn vào content.
  refs.readerBookTitle.textContent = bookName;
  refs.readerChapterSub.textContent = `${state.book.author_display || state.book.author || "Khuyết danh"}`;
  if (refs.readerMiniChapterTitle) refs.readerMiniChapterTitle.textContent = chapterName;
}

function updateMiniInfoVisibility() {
  // Mini bars là "info overlay" nhỏ: khi đã load chương thì luôn hiện,
  // không phụ thuộc việc user đã scroll hay chưa (tránh cảm giác "không thấy gì").
  const enabled = !(state.shell && state.shell.settings && state.shell.settings.miniBarsEnabled === false);
  const active = Boolean(state.chapterId) && enabled;
  if (refs.readerViewport) {
    refs.readerViewport.classList.toggle("mini-info-visible", active);
  }
  if (refs.readerMiniHead) refs.readerMiniHead.hidden = !active;
  if (refs.readerMiniFoot) refs.readerMiniFoot.hidden = !active;
  syncMiniBarLayout();
}

function syncMiniBarLayout() {
  if (!refs.readerContentScroll || !refs.readerMiniHead || refs.readerMiniHead.hidden) return;
  const rect = refs.readerContentScroll.getBoundingClientRect();
  // Mặc định sát mép khung content (không khe hở).
  if (!Number.isFinite(rect.left) || rect.width <= 10) return;
  const left = Math.max(0, Math.round(rect.left));
  const width = Math.max(240, Math.round(rect.width));
  const top = Math.max(0, Math.round(rect.top));
  const bottom = Math.max(0, Math.round(window.innerHeight - rect.bottom));

  const root = document.documentElement;
  root.style.setProperty("--mini-left", `${left}px`);
  root.style.setProperty("--mini-width", `${width}px`);
  root.style.setProperty("--mini-head-top", `${top}px`);
  root.style.setProperty("--mini-foot-bottom", `${bottom}px`);
}

function clamp01(value) {
  if (Number.isNaN(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function verticalScrollState() {
  const wrap = refs.readerContentScroll;
  if (!wrap) {
    return { pos: 0, max: 0, view: Math.max(1, window.innerHeight), topDoc: 0, useWindow: true };
  }
  const internalMax = wrap.scrollHeight - wrap.clientHeight;
  if (internalMax > 2) {
    return { pos: wrap.scrollTop, max: internalMax, view: Math.max(1, wrap.clientHeight), topDoc: 0, useWindow: false };
  }
  const rect = wrap.getBoundingClientRect();
  const topDoc = rect.top + window.scrollY;
  const view = Math.max(1, window.innerHeight);
  const contentHeight = Math.max(1, wrap.scrollHeight);
  const max = Math.max(0, contentHeight - view);
  const pos = Math.max(0, Math.min(max, window.scrollY - topDoc));
  return { pos, max, view, topDoc, useWindow: true };
}

function chapterRatioByMode(mode) {
  if (mode === "flip") {
    const totalPages = Math.max(1, state.flipPages.length);
    return totalPages <= 1 ? 0 : clamp01(state.flipPageIndex / (totalPages - 1));
  }
  const wrap = refs.readerContentScroll;
  if (!wrap) return 0;
  if (mode === "horizontal") {
    const maxX = Math.max(1, wrap.scrollWidth - wrap.clientWidth);
    return clamp01(wrap.scrollLeft / maxX);
  }
  const st = verticalScrollState();
  if (st.max <= 0) return 0;
  return clamp01(st.pos / st.max);
}

function currentChapterRatio() {
  return chapterRatioByMode(runtimeReadingMode());
}

function virtualPagingByViewport() {
  const mode = runtimeReadingMode();
  if (state.chapterContentType === "images") {
    const total = Math.max(1, (state.chapterImages || []).length || 1);
    const ratio = currentChapterRatio();
    const current = total <= 1 ? 1 : Math.max(1, Math.min(total, Math.floor(ratio * (total - 1)) + 1));
    return { current, total };
  }
  if (mode === "flip") {
    const total = Math.max(1, state.flipPages.length);
    const current = Math.max(1, Math.min(total, state.flipPageIndex + 1));
    return { current, total };
  }
  const content = normalizeReaderText(state.chapterText || "");
  if (!content) return { current: 1, total: 1 };
  const budget = estimateFlipCharBudget();
  const total = Math.max(1, Math.ceil(content.length / Math.max(200, budget)));
  const ratio = currentChapterRatio();
  const current = total <= 1 ? 1 : Math.max(1, Math.min(total, Math.floor(ratio * (total - 1)) + 1));
  return { current, total };
}

function applyPositionFromRatio(ratio) {
  const bounded = clamp01(Number(ratio) || 0);
  const wrap = refs.readerContentScroll;
  const mode = runtimeReadingMode();
  if (mode === "flip") {
    const totalPages = Math.max(1, state.flipPages.length);
    state.flipPageIndex = Math.max(0, Math.min(totalPages - 1, Math.round(bounded * Math.max(0, totalPages - 1))));
    renderFlipPage();
    return;
  }
  if (!wrap) return;
  if (mode === "horizontal") {
    const maxX = Math.max(0, wrap.scrollWidth - wrap.clientWidth);
    wrap.scrollLeft = maxX * bounded;
    return;
  }
  const st = verticalScrollState();
  if (st.useWindow) {
    window.scrollTo({ top: Math.round(st.topDoc + st.max * bounded), left: 0, behavior: "auto" });
    return;
  }
  const maxY = Math.max(0, wrap.scrollHeight - wrap.clientHeight);
  wrap.scrollTop = maxY * bounded;
}

function clearScrollHint() {
  state.infiniteScrollDirection = 0;
  state.infiniteScrollProgressPx = 0;
  if (!refs.readerScrollHint) return;
  refs.readerScrollHint.classList.add("hidden");
  refs.readerScrollHint.classList.remove("active", "edge");
  refs.readerScrollHint.textContent = "";
  if (state.scrollHintTimer) {
    window.clearTimeout(state.scrollHintTimer);
    state.scrollHintTimer = null;
  }
}

function showScrollHint(text, { edge = false, autoHideMs = 900 } = {}) {
  if (!refs.readerScrollHint) return;
  if (!text) {
    clearScrollHint();
    return;
  }
  refs.readerScrollHint.textContent = String(text);
  refs.readerScrollHint.classList.remove("hidden");
  refs.readerScrollHint.classList.add("active");
  refs.readerScrollHint.classList.toggle("edge", Boolean(edge));
  if (state.scrollHintTimer) {
    window.clearTimeout(state.scrollHintTimer);
    state.scrollHintTimer = null;
  }
  if (autoHideMs > 0 && !edge) {
    state.scrollHintTimer = window.setTimeout(() => {
      state.scrollHintTimer = null;
      refs.readerScrollHint.classList.remove("active");
      refs.readerScrollHint.classList.add("hidden");
    }, autoHideMs);
  }
}

function hasChapterByStep(step) {
  const idx = findChapterIndex();
  if (idx < 0 || !state.book || !Array.isArray(state.book.chapters)) return false;
  const next = idx + step;
  return next >= 0 && next < state.book.chapters.length;
}

async function handleInfiniteChapterTransition(step) {
  if (state.chapterTransitioning) return;
  if (!hasChapterByStep(step)) {
    showScrollHint(step > 0 ? state.shell.t("atLastChapter") : state.shell.t("atFirstChapter"), { edge: true, autoHideMs: 1300 });
    return;
  }
  clearScrollHint();
  await goChapter(step);
}

async function openChapterById(chapterId, { updateHistory = true, fromToc = false, resetFlip = true } = {}) {
  if (!chapterId) return;
  state.chapterId = chapterId;
  if (updateHistory) {
    const params = new URLSearchParams({
      book_id: state.bookId,
      chapter_id: state.chapterId,
      mode: state.mode,
      translation_mode: state.translateMode,
    });
    window.history.replaceState({}, "", `/reader?${params.toString()}`);
  }
  await loadChapter({ resetFlip });
  if (fromToc) closeToc();
}

function renderToc() {
  refs.readerTocList.innerHTML = "";
  const list = (state.book && state.book.chapters) || [];
  for (const chapter of list) {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "reader-toc-item";
    if (chapter.chapter_id === state.chapterId) btn.classList.add("active");

    const title = document.createElement("div");
    title.className = "reader-toc-item-title";
    title.textContent = `${chapter.chapter_order}. ${chapterTitle(chapter)}`;

    btn.appendChild(title);
    btn.addEventListener("click", () => {
      openChapterById(chapter.chapter_id, { fromToc: true }).catch((error) => {
        state.shell.showToast(error.message || state.shell.t("toastError"));
      });
    });
    li.appendChild(btn);
    refs.readerTocList.appendChild(li);
  }
}

function estimateFlipCharBudget() {
  const style = window.getComputedStyle(refs.readerContentBody);
  const fontSize = Math.max(14, parseFloat(style.fontSize || "21") || 21);
  let lineHeight = parseFloat(style.lineHeight || "") || fontSize * 1.9;
  if (lineHeight < 8) lineHeight *= fontSize;

  let width = Math.max(320, refs.readerContentScroll.clientWidth - 36);
  let height = Math.max(280, refs.readerContentScroll.clientHeight - 44);
  // Non-fullscreen layout đôi khi để content auto-height -> clientHeight cực lớn, làm budget bị "phình".
  // Clamp về kích thước viewport để trang ảo vẫn hợp lý theo máy user.
  if (height > window.innerHeight * 1.2) height = Math.max(280, window.innerHeight - 160);
  if (width > window.innerWidth * 1.2) width = Math.max(320, window.innerWidth - 40);
  const charsPerLine = Math.max(16, Math.floor(width / (fontSize * 0.56)));
  const linesPerPage = Math.max(8, Math.floor(height / Math.max(18, lineHeight)));
  return Math.max(320, Math.floor(charsPerLine * linesPerPage * 0.9));
}

function splitLongChunk(text, budget) {
  const parts = [];
  let rest = text || "";
  while (rest.length > budget) {
    const around = Math.min(rest.length, budget + 120);
    const slice = rest.slice(0, around);
    let cut = -1;
    for (const ch of ["。", "！", "？", ".", "!", "?", ";", "；", ",", "，", " "]) {
      const idx = slice.lastIndexOf(ch, budget + 40);
      if (idx > Math.floor(budget * 0.6)) {
        cut = Math.max(cut, idx + 1);
      }
    }
    if (cut < 0) cut = budget;
    parts.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  if (rest) parts.push(rest);
  return parts.filter(Boolean);
}

function buildFlipPages(text) {
  const content = normalizeReaderText(text || "");
  if (!content) return [""];
  const budget = estimateFlipCharBudget();
  const paragraphs = content.split(/\n{2,}/g).map((x) => x.trim()).filter(Boolean);

  const pages = [];
  let pageText = "";
  let pageCount = 0;

  const flushPage = () => {
    if (!pageText.trim()) return;
    pages.push(pageText.trim());
    pageText = "";
    pageCount = 0;
  };

  for (const para of paragraphs) {
    const chunks = para.length > budget ? splitLongChunk(para, budget) : [para];
    for (const chunk of chunks) {
      const chunkLen = chunk.length + 2;
      if (!pageText) {
        pageText = chunk;
        pageCount = chunkLen;
        continue;
      }
      if (pageCount + chunkLen > budget) {
        flushPage();
        pageText = chunk;
        pageCount = chunkLen;
      } else {
        pageText = `${pageText}\n\n${chunk}`;
        pageCount += chunkLen;
      }
    }
  }
  flushPage();
  return pages.length ? pages : [content];
}

function renderFlipPage() {
  const total = Math.max(1, state.flipPages.length);
  state.flipPageIndex = Math.max(0, Math.min(state.flipPageIndex, total - 1));
  const content = state.flipPages[state.flipPageIndex] || "";

  refs.readerContentBody.innerHTML = "";
  refs.readerContentBody.appendChild(buildParagraphNodes(content, state.shell.t("readerEmpty")));
  refs.readerContentBody.classList.remove("flip-page-anim");
  void refs.readerContentBody.offsetHeight;
  refs.readerContentBody.classList.add("flip-page-anim");

  refs.readerContentScroll.scrollTop = 0;
  refs.readerContentScroll.scrollLeft = 0;
  updateProgress();
}

function renderImageChapter(preserveRatio = null) {
  refs.readerContentBody.innerHTML = "";
  const images = Array.isArray(state.chapterImages) ? state.chapterImages : [];
  if (!images.length) {
    refs.readerContentBody.appendChild(buildParagraphNodes("", state.shell.t("readerEmpty")));
  } else {
    const wrap = document.createElement("div");
    wrap.className = "reader-comic-wrap";
    for (let i = 0; i < images.length; i += 1) {
      const src = String(images[i] || "").trim();
      if (!src) continue;
      const img = document.createElement("img");
      img.className = "reader-comic-image";
      img.loading = "lazy";
      img.decoding = "async";
      img.src = src;
      img.alt = `Ảnh trang ${i + 1}`;
      wrap.appendChild(img);
    }
    refs.readerContentBody.appendChild(wrap);
  }
  refs.readerContentScroll.scrollLeft = 0;
  if (preserveRatio == null) {
    refs.readerContentScroll.scrollTop = 0;
  } else {
    window.requestAnimationFrame(() => {
      applyPositionFromRatio(clamp01(preserveRatio));
      updateProgress();
    });
  }
}

function renderChapterContent(resetFlip = true, preserveRatio = null) {
  if (state.chapterContentType === "images") {
    state.flipPages = [];
    state.flipPageIndex = 0;
    renderImageChapter(preserveRatio);
    updateProgress();
    updateMiniInfoVisibility();
    return;
  }
  const runtimeMode = runtimeReadingMode();
  if (runtimeMode === "flip") {
    if (resetFlip || !state.flipPages.length) {
      state.flipPages = buildFlipPages(state.chapterText || "");
      if (preserveRatio == null) {
        state.flipPageIndex = 0;
      } else {
        const totalPages = Math.max(1, state.flipPages.length);
        state.flipPageIndex = Math.max(0, Math.min(totalPages - 1, Math.round(clamp01(preserveRatio) * Math.max(0, totalPages - 1))));
      }
    } else {
      state.flipPageIndex = Math.max(0, Math.min(state.flipPageIndex, Math.max(0, state.flipPages.length - 1)));
    }
    renderFlipPage();
  } else {
    state.flipPages = [];
    state.flipPageIndex = 0;
    refs.readerContentBody.innerHTML = "";
    refs.readerContentBody.appendChild(buildParagraphNodes(state.chapterText || "", state.shell.t("readerEmpty")));
    if (preserveRatio == null) {
      refs.readerContentScroll.scrollTop = 0;
      refs.readerContentScroll.scrollLeft = 0;
    } else {
      // Apply sau 1 frame để đảm bảo scrollHeight/clientHeight ổn định sau khi render.
      // Tránh case áp name xong bị bật về đầu chương do layout chưa kịp tính.
      const ratio = clamp01(preserveRatio);
      refs.readerContentScroll.scrollTop = 0;
      refs.readerContentScroll.scrollLeft = 0;
      window.requestAnimationFrame(() => {
        applyPositionFromRatio(ratio);
        updateProgress();
      });
    }
  }
  // Chỉ scroll cửa sổ về đầu khi vào chương mới. Khi preserveRatio (đổi mode/apply name)
  // thì giữ nguyên vị trí viewport để tránh cảm giác "nhảy về đầu trang".
  if (preserveRatio == null) {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }
  updateProgress();
  updateMiniInfoVisibility();
}

function updateProgress() {
  if (!state.book || !state.chapterId) {
    refs.readerChapterCounter.textContent = state.shell.t("chapterCounter", { current: 0, total: 0 });
    refs.readerPageCounter.textContent = state.shell.t("pageCounter", { current: 0, total: 0 });
    refs.readerBookPercent.textContent = state.shell.t("bookPercent", { percent: "0.0" });
    if (refs.readerMiniChapterCounter) refs.readerMiniChapterCounter.textContent = state.shell.t("chapterCounter", { current: 0, total: 0 });
    if (refs.readerMiniPageCounter) refs.readerMiniPageCounter.textContent = state.shell.t("pageCounter", { current: 0, total: 0 });
    if (refs.readerMiniBookPercent) refs.readerMiniBookPercent.textContent = state.shell.t("bookPercent", { percent: "0.0" });
    return;
  }

  const idx = findChapterIndex();
  const chapterCurrent = Math.max(1, idx + 1);
  const chapterTotal = Math.max(1, state.book.chapter_count || (state.book.chapters && state.book.chapters.length) || 1);
  const ratio = currentChapterRatio();
  const paging = virtualPagingByViewport();
  const pageTotal = paging.total;
  const pageCurrent = paging.current;
  state.chapterVirtualPages = pageTotal;
  state.virtualPageIndex = pageCurrent - 1;
  state.bookPercent = clamp01(((chapterCurrent - 1) + ratio) / chapterTotal) * 100;

  refs.readerChapterCounter.textContent = state.shell.t("chapterCounter", { current: chapterCurrent, total: chapterTotal });
  refs.readerPageCounter.textContent = state.shell.t("pageCounter", { current: pageCurrent, total: pageTotal });
  refs.readerBookPercent.textContent = state.shell.t("bookPercent", { percent: state.bookPercent.toFixed(1) });

  // Mini footer: trái = chương/tổng; phải = trang x/y + % tổng.
  if (refs.readerMiniChapterCounter) refs.readerMiniChapterCounter.textContent = state.shell.t("chapterCounter", { current: chapterCurrent, total: chapterTotal });
  if (refs.readerMiniPageCounter) refs.readerMiniPageCounter.textContent = state.shell.t("pageCounter", { current: pageCurrent, total: pageTotal });
  if (refs.readerMiniBookPercent) refs.readerMiniBookPercent.textContent = state.shell.t("bookPercent", { percent: state.bookPercent.toFixed(1) });
  updateMiniInfoVisibility();
}

async function saveProgress() {
  if (!state.bookId || !state.chapterId) return;
  const ratio = currentChapterRatio();

  try {
    await state.shell.api(`/api/library/book/${encodeURIComponent(state.bookId)}/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chapter_id: state.chapterId, ratio, mode: state.mode }),
    });
  } catch {
    // ignore
  }
}

async function loadBook() {
  if (!state.bookId) return;
  const detail = await state.shell.api(`/api/library/book/${encodeURIComponent(state.bookId)}?mode=${encodeURIComponent(state.mode)}&translation_mode=${encodeURIComponent(state.translateMode)}`);
  state.book = detail;
  if (!supportsTranslation(detail)) {
    state.mode = "raw";
  }
  if (!state.chapterId) {
    state.chapterId = detail.last_read_chapter_id || ((detail.chapters && detail.chapters[0] && detail.chapters[0].chapter_id) || "");
  }
  const canTranslate = supportsTranslation(detail);
  refs.btnModeTrans.classList.toggle("hidden", !canTranslate);
  refs.btnTranslateMode.classList.toggle("hidden", !canTranslate);
  refs.btnOpenNameEditor.classList.toggle("hidden", !canTranslate);
  refs.btnModeRaw.classList.toggle("active", state.mode === "raw");
  refs.btnModeTrans.classList.toggle("active", state.mode === "trans");
  refs.btnTranslateMode.textContent = state.translateMode === "local" ? state.shell.t("modeLocal") : state.shell.t("modeServer");
}

async function loadChapter({ resetFlip = true, preserveRatio = null } = {}) {
  if (!state.chapterId) return;
  if (state.activeChapterController) {
    try {
      state.activeChapterController.abort();
    } catch {
      // ignore
    }
  }
  const requestSeq = ++state.chapterLoadSeq;
  const targetChapterId = state.chapterId;
  const mode = effectiveMode();
  const translationMode = state.translateMode;
  const controller = new AbortController();
  state.activeChapterController = controller;

  state.shell.showStatus(state.shell.t("statusLoadingChapter"));
  try {
    const chapter = await fetchChapterContent(targetChapterId, {
      mode,
      translationMode,
      signal: controller.signal,
    });
    if (requestSeq !== state.chapterLoadSeq || targetChapterId !== state.chapterId) return;
    state.chapterContentType = String(chapter.content_type || "text").toLowerCase() === "images" ? "images" : "text";
    state.chapterImages = Array.isArray(chapter.images) ? chapter.images.map((x) => String(x || "").trim()).filter(Boolean) : [];
    state.chapterText = chapter.content || "";
    if (state.chapterContentType !== "images" && state.book && state.book.is_comic && state.chapterText) {
      const urlRows = state.chapterText
        .split(/\r?\n/g)
        .map((x) => String(x || "").trim())
        .filter((x) => /^https?:\/\//i.test(x));
      if (urlRows.length >= 2) {
        state.chapterContentType = "images";
        state.chapterImages = urlRows;
        state.chapterText = "";
      }
    }
    applyReaderModeClass();
    clearScrollHint();
    renderChapterContent(resetFlip, preserveRatio);
    updateHeader();
    renderToc();
    updateProgress();
    prefetchNearbyChapters();
    if (isFullscreenActive()) {
      setFullscreenUiVisible(true, { autoHideMs: 1800 });
    }
  } catch (error) {
    if (isAbortError(error)) return;
    state.shell.showToast(error.message || state.shell.t("toastError"));
  } finally {
    if (requestSeq === state.chapterLoadSeq) {
      state.shell.hideStatus();
    }
    if (state.activeChapterController === controller) {
      state.activeChapterController = null;
    }
  }
}

function openToc() {
  refs.readerTocDrawer.classList.add("open");
  refs.readerTocDrawer.setAttribute("aria-hidden", "false");
  const backdrop = document.getElementById("settings-backdrop");
  if (backdrop) {
    backdrop.hidden = false;
    backdrop.classList.add("open");
  }
}

function closeToc() {
  refs.readerTocDrawer.classList.remove("open");
  refs.readerTocDrawer.setAttribute("aria-hidden", "true");
  const backdrop = document.getElementById("settings-backdrop");
  const settingsDrawer = document.getElementById("settings-drawer");
  if (backdrop && (!settingsDrawer || !settingsDrawer.classList.contains("open"))) {
    backdrop.hidden = true;
    backdrop.classList.remove("open");
  }
}

function getActiveSetEntries() {
  const active = state.activeNameSet || Object.keys(state.nameSets)[0] || "Mặc định";
  return state.nameSets[active] || {};
}

function renderNameEntriesTable() {
  refs.namePreviewBody.innerHTML = "";
  const entries = Object.entries(getActiveSetEntries()).sort((a, b) => a[0].localeCompare(b[0], "zh-Hans-CN"));
  if (!entries.length) {
    refs.namePreviewHint.textContent = state.shell.t("namePreviewEmpty");
    return;
  }
  refs.namePreviewHint.textContent = state.shell.t("namePreviewCount", { count: entries.length });

  for (const [source, target] of entries) {
    const tr = document.createElement("tr");
    const sourceCell = document.createElement("td");
    sourceCell.textContent = source;

    const targetCell = document.createElement("td");
    const targetInput = document.createElement("input");
    targetInput.type = "text";
    targetInput.value = target || "";
    targetInput.className = "name-target-inline";
    targetCell.appendChild(targetInput);

    const countCell = document.createElement("td");
    countCell.textContent = "Name";

    const actionCell = document.createElement("td");
    const saveBtn = document.createElement("button");
    saveBtn.type = "button";
    saveBtn.className = "btn btn-small";
    saveBtn.textContent = state.shell.t("saveNameEntry");
    saveBtn.addEventListener("click", async () => {
      const nextTarget = targetInput.value.trim();
      if (!nextTarget) {
        state.shell.showToast(state.shell.t("nameTargetRequired"));
        return;
      }
      await applyNameEntry(source, nextTarget);
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "btn btn-small";
    deleteBtn.textContent = state.shell.t("deleteNameEntry");
    deleteBtn.addEventListener("click", async () => {
      await deleteNameEntry(source);
    });

    actionCell.append(saveBtn, deleteBtn);
    tr.append(sourceCell, targetCell, countCell, actionCell);
    refs.namePreviewBody.appendChild(tr);
  }
}

async function loadNameSets() {
  const data = await state.shell.api(`/api/name-sets?book_id=${encodeURIComponent(state.bookId || "")}`);
  state.nameSets = data.sets || { "Mặc định": {} };
  state.activeNameSet = data.active_set || Object.keys(state.nameSets)[0] || "Mặc định";
  refs.nameSetSelect.innerHTML = "";
  for (const name of Object.keys(state.nameSets)) {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    refs.nameSetSelect.appendChild(opt);
  }
  refs.nameSetSelect.value = state.activeNameSet;
  renderNameEntriesTable();
}

function updateNameSourceSuggestions(items) {
  if (!refs.nameSourceSuggest) return;
  refs.nameSourceSuggest.innerHTML = "";
  const list = Array.isArray(items) ? items : [];
  for (const raw of list) {
    const value = String(raw || "").trim();
    if (!value) continue;
    const opt = document.createElement("option");
    opt.value = value;
    refs.nameSourceSuggest.appendChild(opt);
  }
}

function buildNameSetExportData() {
  const active = state.activeNameSet || "Mặc định";
  const activeEntries = getActiveSetEntries();
  return {
    type: "reader_name_set",
    version: 1,
    book_id: state.bookId,
    active_set: active,
    sets: { [active]: activeEntries },
    exported_at: new Date().toISOString(),
  };
}

function downloadNameSetJson(data, filenameBase = "name_set") {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filenameBase}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function normalizeImportedNameSet(payload) {
  if (!payload || typeof payload !== "object") return null;
  if (payload.sets && typeof payload.sets === "object") {
    const activeSet = String(payload.active_set || Object.keys(payload.sets)[0] || "Mặc định");
    return {
      sets: payload.sets,
      active_set: activeSet,
      bump_version: true,
      book_id: state.bookId,
    };
  }
  if (payload.entries && typeof payload.entries === "object") {
    const setName = String(payload.set_name || state.activeNameSet || "Mặc định");
    return {
      sets: { [setName]: payload.entries },
      active_set: setName,
      bump_version: true,
      book_id: state.bookId,
    };
  }
  const plainEntries = payload;
  if (plainEntries && typeof plainEntries === "object") {
    const setName = String(state.activeNameSet || "Mặc định");
    return {
      sets: { [setName]: plainEntries },
      active_set: setName,
      bump_version: true,
      book_id: state.bookId,
    };
  }
  return null;
}

async function refreshNamePreview() {
  state.shell.showStatus(state.shell.t("statusLoadingNamePreview"));
  try {
    await loadNameSets();
  } catch (error) {
    state.shell.showToast(error.message || state.shell.t("toastError"));
  } finally {
    state.shell.hideStatus();
  }
}

async function applyNameEntry(source, target) {
  state.shell.showStatus(state.shell.t("statusApplyingNameEntry"));
  const preserveRatio = currentChapterRatio();
  try {
    await state.shell.api("/api/name-sets/entry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source, target, set_name: state.activeNameSet, book_id: state.bookId }),
    });
    state.shell.showToast(state.shell.t("nameEntryApplied"));
    clearChapterCache();
    cancelPrefetch();
    await loadNameSets();
    await loadBook();
    await loadChapter({ resetFlip: true, preserveRatio });
  } catch (error) {
    state.shell.showToast(error.message || state.shell.t("toastError"));
  } finally {
    state.shell.hideStatus();
  }
}

async function deleteNameEntry(source) {
  state.shell.showStatus(state.shell.t("statusApplyingNameEntry"));
  const preserveRatio = currentChapterRatio();
  try {
    await state.shell.api("/api/name-sets/entry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source, target: "", delete: true, set_name: state.activeNameSet, book_id: state.bookId }),
    });
    clearChapterCache();
    cancelPrefetch();
    await loadNameSets();
    await loadBook();
    await loadChapter({ resetFlip: true, preserveRatio });
  } catch (error) {
    state.shell.showToast(error.message || state.shell.t("toastError"));
  } finally {
    state.shell.hideStatus();
  }
}

function openNameEditor(prefill = {}) {
  const sourcePrefill = (prefill && prefill.source) || "";
  const targetPrefill = (prefill && prefill.target) || "";
  if (!refs.nameEditorDialog.open) {
    refs.nameEditorDialog.showModal();
  }
  if (sourcePrefill) {
    refs.nameSourceInput.value = sourcePrefill;
  }
  if (targetPrefill) {
    refs.nameTargetInput.value = targetPrefill;
  }
  if (sourcePrefill || targetPrefill) {
    if (sourcePrefill) refs.nameTargetInput.focus();
    else refs.nameSourceInput.focus();
  }
  updateNameSourceSuggestions((prefill && prefill.suggestions) || []);
  loadNameSets().catch((error) => state.shell.showToast(error.message || state.shell.t("toastError")));
}

async function addNameSet() {
  const setName = window.prompt(state.shell.t("promptNameSetNew"), "");
  const trimmed = String(setName || "").trim();
  if (!trimmed) return;
  if (state.nameSets[trimmed]) {
    state.shell.showToast(state.shell.t("nameSetExists"));
    return;
  }
  const sets = { ...state.nameSets, [trimmed]: {} };
  state.shell.showStatus(state.shell.t("statusSwitchingNameSet"));
  try {
    await state.shell.api("/api/name-sets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sets, active_set: trimmed, bump_version: false, book_id: state.bookId }),
    });
    await loadNameSets();
  } catch (error) {
    state.shell.showToast(error.message || state.shell.t("toastError"));
  } finally {
    state.shell.hideStatus();
  }
}

async function deleteActiveNameSet() {
  const names = Object.keys(state.nameSets || {});
  if (names.length <= 1) {
    state.shell.showToast(state.shell.t("nameSetNeedOne"));
    return;
  }
  if (!window.confirm(state.shell.t("confirmDeleteNameSet"))) {
    return;
  }
  const nextSets = { ...state.nameSets };
  delete nextSets[state.activeNameSet];
  const nextActive = Object.keys(nextSets)[0] || "Mặc định";
  state.shell.showStatus(state.shell.t("statusSwitchingNameSet"));
  try {
    await state.shell.api("/api/name-sets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sets: nextSets, active_set: nextActive, bump_version: false, book_id: state.bookId }),
    });
    await loadNameSets();
  } catch (error) {
    state.shell.showToast(error.message || state.shell.t("toastError"));
  } finally {
    state.shell.hideStatus();
  }
}

function exportActiveNameSet() {
  const active = state.activeNameSet || "Mặc định";
  const fileName = `name_set_${active}`.replace(/[^\w\-]+/g, "_");
  downloadNameSetJson(buildNameSetExportData(), fileName);
}

async function importNameSetFromFile(file) {
  if (!file) return;
  state.shell.showStatus(state.shell.t("statusLoadingNamePreview"));
  try {
    const raw = await file.text();
    const parsed = JSON.parse(raw);
    const payload = normalizeImportedNameSet(parsed);
    if (!payload) {
      throw new Error(state.shell.t("nameSetImportInvalid"));
    }
    await state.shell.api("/api/name-sets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    await loadNameSets();
    state.shell.showToast(state.shell.t("nameSetImported"));
  } catch (error) {
    state.shell.showToast(error.message || state.shell.t("toastError"));
  } finally {
    state.shell.hideStatus();
  }
}

function renderNameSuggestRows(items) {
  refs.nameSuggestLeftBody.innerHTML = "";
  refs.nameSuggestRightBody.innerHTML = "";
  const list = Array.isArray(items) ? items : [];
  if (!list.length) {
    refs.nameSuggestHint.textContent = state.shell.t("nameSuggestEmpty");
    const trEmpty = document.createElement("tr");
    const tdEmpty = document.createElement("td");
    tdEmpty.colSpan = 2;
    tdEmpty.className = "empty-text";
    tdEmpty.textContent = state.shell.t("nameSuggestRightPending");
    trEmpty.appendChild(tdEmpty);
    refs.nameSuggestRightBody.appendChild(trEmpty);
    return;
  }
  refs.nameSuggestHint.textContent = state.shell.t("nameSuggestCount", { count: list.length });

  let selectedIndex = -1;
  const selectRow = (idx) => {
    selectedIndex = idx;
    const row = list[idx];
    if (!row) return;
    refs.nameSourceInput.value = String(row.source_text || "").trim();
    refs.nameTargetInput.value = String(row.han_viet || "").trim();
    const rows = refs.nameSuggestLeftBody.querySelectorAll("tr");
    rows.forEach((el, i) => el.classList.toggle("active", i === idx));
  };

  for (const row of list) {
    const trLeft = document.createElement("tr");
    trLeft.className = "name-suggest-row";
    const tdIdx = document.createElement("td");
    tdIdx.textContent = String(row.index || "");
    const tdSource = document.createElement("td");
    tdSource.textContent = row.source_text || "";
    const tdHv = document.createElement("td");
    tdHv.textContent = row.han_viet || "";
    trLeft.append(tdIdx, tdSource, tdHv);
    trLeft.addEventListener("click", () => {
      const idx = list.indexOf(row);
      selectRow(idx);
      refs.nameSuggestDialog.close();
      refs.nameTargetInput.focus();
    });
    refs.nameSuggestLeftBody.appendChild(trLeft);
  }

  const trPending = document.createElement("tr");
  const tdPending = document.createElement("td");
  tdPending.colSpan = 2;
  tdPending.className = "empty-text";
  tdPending.textContent = state.shell.t("nameSuggestRightPending");
  trPending.appendChild(tdPending);
  refs.nameSuggestRightBody.appendChild(trPending);

  if (selectedIndex < 0 && list.length) {
    selectRow(0);
  }
}

async function openNameSuggestDialog() {
  const sourceText = String(refs.nameSourceInput.value || "").trim();
  if (!sourceText) {
    state.shell.showToast(state.shell.t("nameSourceTargetRequired"));
    refs.nameSourceInput.focus();
    return;
  }
  state.shell.showStatus(state.shell.t("statusLoadingNameSuggest"));
  try {
    const data = await state.shell.api("/api/name-suggest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source_text: sourceText }),
    });
    renderNameSuggestRows(data.items || []);
    refs.nameSuggestDialog.showModal();
  } catch (error) {
    state.shell.showToast(error.message || state.shell.t("toastError"));
  } finally {
    state.shell.hideStatus();
  }
}

function hideSelectionBtn() {
  refs.selectionNameBtn.classList.add("hidden");
  delete refs.selectionNameBtn.dataset.text;
  delete refs.selectionNameBtn.dataset.startOffset;
  delete refs.selectionNameBtn.dataset.endOffset;
}

function renderedTextLength(node) {
  if (!node) return 0;
  if (node.nodeType === Node.TEXT_NODE) {
    return String(node.nodeValue || "").length;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return 0;
  const tag = node.tagName ? node.tagName.toLowerCase() : "";
  if (tag === "br") return 1;
  let total = 0;
  for (const child of node.childNodes) {
    total += renderedTextLength(child);
  }
  return total;
}

function offsetInsideNode(root, targetNode, targetOffset) {
  if (!root) return null;
  if (root === targetNode) {
    if (root.nodeType === Node.TEXT_NODE) {
      return Math.max(0, Math.min(Number(targetOffset) || 0, String(root.nodeValue || "").length));
    }
    if (root.nodeType === Node.ELEMENT_NODE) {
      let sum = 0;
      const limit = Math.max(0, Math.min(Number(targetOffset) || 0, root.childNodes.length));
      for (let i = 0; i < limit; i += 1) {
        sum += renderedTextLength(root.childNodes[i]);
      }
      return sum;
    }
    return 0;
  }
  if (!root.childNodes || !root.childNodes.length) return null;
  let acc = 0;
  for (const child of root.childNodes) {
    const inner = offsetInsideNode(child, targetNode, targetOffset);
    if (inner != null) return acc + inner;
    acc += renderedTextLength(child);
  }
  return null;
}

function computeRenderedOffset(containerNode, nodeOffset) {
  const body = refs.readerContentBody;
  if (!body || !containerNode) return 0;
  if (!body.contains(containerNode) && containerNode !== body) return 0;

  if (containerNode === body) {
    let sum = 0;
    const limit = Math.max(0, Math.min(Number(nodeOffset) || 0, body.childNodes.length));
    for (let i = 0; i < limit; i += 1) {
      const node = body.childNodes[i];
      if (node.nodeType === Node.ELEMENT_NODE && node.tagName && node.tagName.toLowerCase() === "p" && i > 0) {
        sum += 2;
      }
      sum += renderedTextLength(node);
    }
    return sum;
  }

  const paragraphs = Array.from(body.children || []).filter((el) => el.tagName && el.tagName.toLowerCase() === "p");
  let total = 0;
  for (let i = 0; i < paragraphs.length; i += 1) {
    const p = paragraphs[i];
    if (i > 0) total += 2;
    const inside = offsetInsideNode(p, containerNode, nodeOffset);
    if (inside != null) {
      return total + inside;
    }
    total += renderedTextLength(p);
  }
  return total;
}

function selectionPayloadFromRange(range) {
  const chapterText = normalizeReaderText(state.chapterText || "");
  const startRaw = computeRenderedOffset(range.startContainer, range.startOffset);
  const endRaw = computeRenderedOffset(range.endContainer, range.endOffset);
  let start = Math.min(startRaw, endRaw);
  let end = Math.max(startRaw, endRaw);
  start = Math.max(0, Math.min(chapterText.length, start));
  end = Math.max(0, Math.min(chapterText.length, end));
  let selected = chapterText.slice(start, end).trim();
  if (!selected) {
    selected = normalizeReaderText(String(window.getSelection()?.toString() || "")).trim();
  }
  return { selected, start, end };
}

function handleSelectionButton() {
  if (!supportsTranslation(state.book)) {
    hideSelectionBtn();
    return;
  }
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) {
    hideSelectionBtn();
    return;
  }
  const text = String(sel.toString() || "").trim();
  if (!text || text.length > 80 || text.includes("\n")) {
    hideSelectionBtn();
    return;
  }
  const range = sel.getRangeAt(0);
  const ancestor = range.commonAncestorContainer;
  const rangeContainer = ancestor && ancestor.nodeType === 3 ? ancestor.parentElement : ancestor;
  if (!rangeContainer || !refs.readerContentBody.contains(rangeContainer)) {
    hideSelectionBtn();
    return;
  }
  const rect = range.getBoundingClientRect();
  if (!rect || !rect.width) {
    hideSelectionBtn();
    return;
  }
  const payload = selectionPayloadFromRange(range);
  if (!payload.selected) {
    hideSelectionBtn();
    return;
  }
  refs.selectionNameBtn.dataset.text = payload.selected;
  refs.selectionNameBtn.dataset.startOffset = String(payload.start);
  refs.selectionNameBtn.dataset.endOffset = String(payload.end);
  refs.selectionNameBtn.style.left = `${Math.max(12, rect.left + window.scrollX)}px`;
  refs.selectionNameBtn.style.top = `${Math.max(12, rect.top + window.scrollY - 42)}px`;
  refs.selectionNameBtn.classList.remove("hidden");
}

function bindNameEditor() {
  refs.nameEditorTitle.textContent = state.shell.t("nameEditorTitle");
  refs.btnCloseNameEditor.textContent = state.shell.t("close");
  refs.btnRefreshNamePreview.textContent = state.shell.t("refreshNamePreview");
  refs.btnAddNameSet.textContent = state.shell.t("nameSetAdd");
  refs.btnDeleteNameSet.textContent = state.shell.t("nameSetDelete");
  refs.btnExportNameSet.textContent = state.shell.t("nameSetExport");
  refs.btnImportNameSet.textContent = state.shell.t("nameSetImport");
  refs.nameSetLabel.textContent = state.shell.t("nameSetLabel");
  refs.nameSourceLabel.textContent = state.shell.t("nameSourceLabel");
  refs.nameTargetLabel.textContent = state.shell.t("nameTargetLabel");
  refs.btnOpenNameSuggest.textContent = state.shell.t("nameSuggestButton");
  refs.btnAddNameEntry.textContent = state.shell.t("addNameEntry");
  refs.nameColSource.textContent = state.shell.t("nameColSource");
  refs.nameColTarget.textContent = state.shell.t("nameColTarget");
  refs.nameColCount.textContent = state.shell.t("nameColType");
  refs.nameColAction.textContent = state.shell.t("nameColAction");
  refs.namePreviewHint.textContent = state.shell.t("namePreviewEmpty");
  refs.nameSuggestTitle.textContent = state.shell.t("nameSuggestTitle");
  refs.btnCloseNameSuggest.textContent = state.shell.t("close");
  refs.nameSuggestHint.textContent = state.shell.t("nameSuggestHint");
  refs.nameSuggestColIndex.textContent = state.shell.t("nameSuggestColIndex");
  refs.nameSuggestColSource.textContent = state.shell.t("nameSuggestColSource");
  refs.nameSuggestColHv.textContent = state.shell.t("nameSuggestColHv");
  refs.nameSuggestColTarget.textContent = state.shell.t("nameSuggestColTarget");
  refs.nameSuggestColAction.textContent = state.shell.t("nameSuggestColAction");

  refs.btnOpenNameEditor.addEventListener("click", () => openNameEditor({}));
  refs.btnCloseNameEditor.addEventListener("click", () => refs.nameEditorDialog.close());
  refs.btnCloseNameSuggest.addEventListener("click", () => refs.nameSuggestDialog.close());
  refs.btnRefreshNamePreview.addEventListener("click", refreshNamePreview);
  refs.btnAddNameSet.addEventListener("click", addNameSet);
  refs.btnDeleteNameSet.addEventListener("click", deleteActiveNameSet);
  refs.btnExportNameSet.addEventListener("click", exportActiveNameSet);
  refs.btnImportNameSet.addEventListener("click", () => refs.nameSetImportFile.click());
  refs.nameSetImportFile.addEventListener("change", async () => {
    const file = refs.nameSetImportFile.files && refs.nameSetImportFile.files[0];
    refs.nameSetImportFile.value = "";
    if (!file) return;
    await importNameSetFromFile(file);
  });
  refs.btnOpenNameSuggest.addEventListener("click", openNameSuggestDialog);

  refs.nameSetSelect.addEventListener("change", async () => {
    const chosen = refs.nameSetSelect.value;
    state.shell.showStatus(state.shell.t("statusSwitchingNameSet"));
    try {
      const data = await state.shell.api("/api/name-sets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active_set: chosen, bump_version: false, book_id: state.bookId }),
      });
      state.activeNameSet = data.active_set || chosen;
      await refreshNamePreview();
    } catch (error) {
      state.shell.showToast(error.message || state.shell.t("toastError"));
    } finally {
      state.shell.hideStatus();
    }
  });

  refs.nameEntryForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const source = refs.nameSourceInput.value.trim();
    const target = refs.nameTargetInput.value.trim();
    if (!source || !target) {
      state.shell.showToast(state.shell.t("nameSourceTargetRequired"));
      return;
    }
    await applyNameEntry(source, target);
    refs.nameEntryForm.reset();
  });

  refs.selectionNameBtn.textContent = state.shell.t("selectionEditName");
  refs.selectionNameBtn.addEventListener("click", async () => {
    const text = refs.selectionNameBtn.dataset.text || "";
    const startOffset = Number.parseInt(refs.selectionNameBtn.dataset.startOffset || "", 10);
    const endOffset = Number.parseInt(refs.selectionNameBtn.dataset.endOffset || "", 10);
    hideSelectionBtn();
    if (!text || !state.chapterId || Number.isNaN(startOffset) || Number.isNaN(endOffset)) {
      openNameEditor({ target: text, source: "" });
      return;
    }
    state.shell.showStatus(state.shell.t("statusMappingSelection"));
    try {
      const mapped = await state.shell.api(`/api/library/chapter/${encodeURIComponent(state.chapterId)}/selection-map`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selected_text: text,
          start_offset: startOffset,
          end_offset: endOffset,
          translation_mode: state.translateMode,
        }),
      });
      if (!mapped.source_candidate) {
        state.shell.showToast(state.shell.t("selectionMapNoSource"));
      }
      openNameEditor({
        source: mapped.source_candidate || "",
        target: mapped.target_candidate || text,
        suggestions: mapped.name_suggestions || [],
      });
    } catch (error) {
      state.shell.showToast(error.message || state.shell.t("toastError"));
      openNameEditor({ target: text, source: "" });
    } finally {
      state.shell.hideStatus();
    }
  });
}

async function switchMode(nextMode) {
  if (!state.book) return;
  if (nextMode === "trans" && !supportsTranslation(state.book)) {
    state.shell.showToast(state.shell.t("sourceNoTrans"));
    return;
  }
  state.mode = nextMode;
  clearChapterCache();
  cancelPrefetch();
  refs.btnModeRaw.classList.toggle("active", state.mode === "raw");
  refs.btnModeTrans.classList.toggle("active", state.mode === "trans");
  await loadBook();
  await loadChapter();
}

async function goChapter(step) {
  if (!state.book || state.chapterTransitioning) return false;
  const idx = findChapterIndex();
  if (idx < 0) return false;
  const next = idx + step;
  if (next < 0 || next >= state.book.chapters.length) return false;
  state.chapterTransitioning = true;
  try {
    await openChapterById(state.book.chapters[next].chapter_id, { updateHistory: true, resetFlip: true });
    return true;
  } finally {
    state.chapterTransitioning = false;
  }
}

async function reloadCurrentChapter() {
  if (!state.chapterId) return;
  state.shell.showStatus(state.shell.t("statusReloadingChapter"));
  try {
    if (state.activeChapterController) {
      try {
        state.activeChapterController.abort();
      } catch {
        // ignore
      }
    }
    await state.shell.api(`/api/library/chapter/${encodeURIComponent(state.chapterId)}/reload`, {
      method: "POST",
    });
    dropChapterCacheById(state.chapterId);
    await loadChapter({ resetFlip: true });
    state.shell.showToast(state.shell.t("toastChapterReloaded"));
  } catch (error) {
    state.shell.showToast(error.message || state.shell.t("toastError"));
  } finally {
    state.shell.hideStatus();
  }
}

async function goPrevAction() {
  if (runtimeReadingMode() !== "flip") return;
  if (!(state.flipPages.length > 1 && state.flipPageIndex > 0)) return;
  state.flipPageIndex -= 1;
  renderFlipPage();
  updateProgress();
  await saveProgress();
}

async function goNextAction() {
  if (runtimeReadingMode() !== "flip") return;
  if (!(state.flipPages.length > 1 && state.flipPageIndex < state.flipPages.length - 1)) return;
  state.flipPageIndex += 1;
  renderFlipPage();
  updateProgress();
  await saveProgress();
}

function resetFlipDragVisual() {
  refs.readerContentScroll.classList.remove("dragging");
  refs.readerContentBody.classList.remove("flip-dragging");
  refs.readerContentBody.style.removeProperty("--flip-drag-x");
  refs.readerContentBody.style.removeProperty("--flip-drag-y");
}

function bindFlipDragGesture() {
  let drag = null;

  const onPointerMove = (event) => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    drag.dx = dx;
    drag.dy = dy;
    refs.readerContentBody.style.setProperty("--flip-drag-x", `${dx.toFixed(2)}`);
    refs.readerContentBody.style.setProperty("--flip-drag-y", `${dy.toFixed(2)}`);
  };

  const finishDrag = () => {
    if (!drag) return;
    const { dx, dy } = drag;
    drag = null;
    resetFlipDragVisual();

    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    if (absX < 64 && absY < 76) return;
    if (absX >= absY) {
      if (dx < 0) goNextAction().catch((error) => state.shell.showToast(error.message || state.shell.t("toastError")));
      else goPrevAction().catch((error) => state.shell.showToast(error.message || state.shell.t("toastError")));
      return;
    }
    if (dy < 0) goNextAction().catch((error) => state.shell.showToast(error.message || state.shell.t("toastError")));
    else goPrevAction().catch((error) => state.shell.showToast(error.message || state.shell.t("toastError")));
  };

  refs.readerContentScroll.addEventListener("pointerdown", (event) => {
    if (runtimeReadingMode() !== "flip") return;
    if (event.button !== 0) return;
    if (event.target && event.target.closest && event.target.closest("a,button,input,textarea,select,label")) return;

    drag = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      dx: 0,
      dy: 0,
    };
    refs.readerContentScroll.classList.add("dragging");
    refs.readerContentBody.classList.add("flip-dragging");
    refs.readerContentBody.style.setProperty("--flip-drag-x", "0");
    refs.readerContentBody.style.setProperty("--flip-drag-y", "0");
    try {
      refs.readerContentScroll.setPointerCapture(event.pointerId);
    } catch {
      // ignore
    }
    event.preventDefault();
  });

  refs.readerContentScroll.addEventListener("pointermove", onPointerMove);
  refs.readerContentScroll.addEventListener("pointerup", finishDrag);
  refs.readerContentScroll.addEventListener("pointercancel", finishDrag);
  refs.readerContentScroll.addEventListener("lostpointercapture", finishDrag);
}

function bindReaderHotkeys() {
  document.addEventListener("keydown", (event) => {
    if (event.defaultPrevented) return;
    const active = document.activeElement;
    if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA" || active.tagName === "SELECT")) return;
    if (refs.nameEditorDialog.open) return;

    const mode = runtimeReadingMode();
    const key = String(event.key || "");
    if (mode !== "flip") return;
    if (key === "ArrowLeft" || key === "PageUp") {
      event.preventDefault();
      goPrevAction().catch((error) => state.shell.showToast(error.message || state.shell.t("toastError")));
      return;
    }
    if (key === "ArrowRight" || key === "PageDown") {
      event.preventDefault();
      goNextAction().catch((error) => state.shell.showToast(error.message || state.shell.t("toastError")));
      return;
    }
    if (key === "ArrowUp") {
      event.preventDefault();
      goPrevAction().catch((error) => state.shell.showToast(error.message || state.shell.t("toastError")));
    }
  });
}

function clearFullscreenUiTimer() {
  if (!state.fullscreenUiTimer) return;
  window.clearTimeout(state.fullscreenUiTimer);
  state.fullscreenUiTimer = null;
}

function isFullscreenActive() {
  return Boolean(document.fullscreenElement) || state.fullscreenFallback;
}

function setFullscreenUiVisible(visible, { autoHideMs = 0 } = {}) {
  clearFullscreenUiTimer();
  document.body.classList.toggle("fullscreen-ui-visible", Boolean(visible));
  const top = refs.readerHead;
  const bottom = refs.readerFooter;
  if (isFullscreenActive() && top && bottom) {
    const applyVisible = Boolean(visible);
    top.style.opacity = applyVisible ? "1" : "0";
    top.style.transform = applyVisible ? "translateY(0)" : "translateY(-12px)";
    top.style.pointerEvents = applyVisible ? "auto" : "none";
    bottom.style.opacity = applyVisible ? "1" : "0";
    bottom.style.transform = applyVisible ? "translateY(0)" : "translateY(12px)";
    bottom.style.pointerEvents = applyVisible ? "auto" : "none";
  } else {
    if (top) {
      top.style.opacity = "";
      top.style.transform = "";
      top.style.pointerEvents = "";
    }
    if (bottom) {
      bottom.style.opacity = "";
      bottom.style.transform = "";
      bottom.style.pointerEvents = "";
    }
  }
  if (visible && autoHideMs > 0) {
    state.fullscreenUiTimer = window.setTimeout(() => {
      state.fullscreenUiTimer = null;
      if (!isFullscreenActive()) return;
      document.body.classList.remove("fullscreen-ui-visible");
      if (top && bottom) {
        top.style.opacity = "0";
        top.style.transform = "translateY(-12px)";
        top.style.pointerEvents = "none";
        bottom.style.opacity = "0";
        bottom.style.transform = "translateY(12px)";
        bottom.style.pointerEvents = "none";
      }
    }, autoHideMs);
  }
}

function refreshFullscreenMode() {
  const prevMode = state.runtimeMode || runtimeReadingMode();
  const preserveRatio = chapterRatioByMode(prevMode);
  if (document.fullscreenElement) state.fullscreenFallback = false;
  const isFs = isFullscreenActive();
  document.body.classList.toggle("fullscreen-reading", isFs);
  applyReaderModeClass();
  if (state.chapterText && prevMode !== state.runtimeMode) {
    renderChapterContent(true, preserveRatio);
  }
  clearScrollHint();
  if (isFs) {
    refs.btnFullscreen.textContent = state.shell.t("fullscreenExit");
    setFullscreenUiVisible(true, { autoHideMs: 2200 });
  } else {
    refs.btnFullscreen.textContent = state.shell.t("fullscreen");
    setFullscreenUiVisible(false);
  }
}

async function toggleFullscreenMode() {
  if (isFullscreenActive()) {
    state.fullscreenFallback = false;
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch {
        // ignore
      }
    }
    refreshFullscreenMode();
    return;
  }

  try {
    await document.documentElement.requestFullscreen();
  } catch {
    // ignore
  }
  if (!document.fullscreenElement) {
    await new Promise((resolve) => window.setTimeout(resolve, 80));
  }
  if (document.fullscreenElement) {
    state.fullscreenFallback = false;
    refreshFullscreenMode();
    return;
  }

  // Fallback cho môi trường chặn Fullscreen API (hoặc browser từ chối).
  state.fullscreenFallback = true;
  refreshFullscreenMode();
}

function exitFullscreenFallback() {
  if (!state.fullscreenFallback || document.fullscreenElement) return;
  state.fullscreenFallback = false;
  refreshFullscreenMode();
}

function revealFullscreenUiFromEvent(event, autoHideMs = 2200) {
  if (!isFullscreenActive()) return;
  setFullscreenUiVisible(true, { autoHideMs });
}

function onFullscreenContentClick(event) {
  if (!isFullscreenActive()) return;

  // Prevent toggle if text selected
  const sel = window.getSelection();
  if (sel && sel.toString().trim().length > 0) return;

  // Toggle visibility instead of always showing
  const body = document.body;
  const isVisible = body.classList.contains("fullscreen-ui-visible");
  setFullscreenUiVisible(!isVisible, { autoHideMs: isVisible ? 0 : 2200 });
}

function onFullscreenPointerDown(event) {
  revealFullscreenUiFromEvent(event, 2200);
}

function onFullscreenPointerUp(event) {
  revealFullscreenUiFromEvent(event, 2200);
}

function onFullscreenKeydown(event) {
  const key = String(event.key || "");
  if (key !== "Escape") return;
  exitFullscreenFallback();
}

function onReaderWheel(event) {
  const mode = runtimeReadingMode();
  const wrap = refs.readerContentScroll;
  if (!wrap) return;

  if (mode === "flip") {
    const delta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
    if (Math.abs(delta) < 1.5) return;
    event.preventDefault();
    if (delta > 0) {
      goNextAction().catch((error) => state.shell.showToast(error.message || state.shell.t("toastError")));
    } else {
      goPrevAction().catch((error) => state.shell.showToast(error.message || state.shell.t("toastError")));
    }
    return;
  }

  if (mode === "horizontal") {
    const delta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
    if (Math.abs(delta) < 0.5) return;
    const maxX = Math.max(0, wrap.scrollWidth - wrap.clientWidth);
    const canScrollX = maxX > 2;
    const atStart = wrap.scrollLeft <= 1;
    const atEnd = wrap.scrollLeft >= maxX - 1;
    const dir = delta > 0 ? 1 : -1;

    if (isFullscreenActive() && ((dir > 0 && atEnd) || (dir < 0 && atStart))) {
      event.preventDefault();
      if (state.infiniteScrollDirection !== dir) {
        state.infiniteScrollDirection = dir;
        state.infiniteScrollProgressPx = 0;
      }
      const threshold = Math.max(56, wrap.clientWidth * 0.35);
      state.infiniteScrollProgressPx += Math.abs(delta);
      if (!hasChapterByStep(dir)) {
        showScrollHint(dir > 0 ? state.shell.t("atLastChapter") : state.shell.t("atFirstChapter"), { edge: true, autoHideMs: 1400 });
        return;
      }
      showScrollHint(
        dir > 0 ? state.shell.t("scrollHintNext") : state.shell.t("scrollHintPrev"),
        { autoHideMs: 0 },
      );
      if (state.infiniteScrollProgressPx >= threshold) {
        handleInfiniteChapterTransition(dir).catch((error) => state.shell.showToast(error.message || state.shell.t("toastError")));
      }
      return;
    }

    if (state.infiniteScrollProgressPx > 0) clearScrollHint();
    if (!canScrollX) {
      return;
    }
    event.preventDefault();
    wrap.scrollLeft += delta;
    updateProgress();
    clearTimeout(state.saveTimer);
    state.saveTimer = window.setTimeout(() => saveProgress(), 280);
    return;
  }

  if (mode === "vertical" && isFullscreenActive()) {
    const delta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
    if (Math.abs(delta) < 0.5) return;
    const maxY = Math.max(0, wrap.scrollHeight - wrap.clientHeight);
    const atTop = wrap.scrollTop <= 1;
    const atBottom = wrap.scrollTop >= maxY - 1;
    const dir = delta > 0 ? 1 : -1;

    if ((dir > 0 && atBottom) || (dir < 0 && atTop)) {
      event.preventDefault();
      if (state.infiniteScrollDirection !== dir) {
        state.infiniteScrollDirection = dir;
        state.infiniteScrollProgressPx = 0;
      }
      const threshold = Math.max(56, wrap.clientHeight * 0.35);
      state.infiniteScrollProgressPx += Math.abs(delta);
      if (!hasChapterByStep(dir)) {
        showScrollHint(dir > 0 ? state.shell.t("atLastChapter") : state.shell.t("atFirstChapter"), { edge: true, autoHideMs: 1400 });
        return;
      }
      showScrollHint(
        dir > 0 ? state.shell.t("scrollHintNext") : state.shell.t("scrollHintPrev"),
        { autoHideMs: 0 },
      );
      if (state.infiniteScrollProgressPx >= threshold) {
        handleInfiniteChapterTransition(dir).catch((error) => state.shell.showToast(error.message || state.shell.t("toastError")));
      }
      return;
    }

    if (state.infiniteScrollProgressPx > 0) clearScrollHint();
    showScrollHint(state.shell.t("scrollingIndicator"), { autoHideMs: 240 });
    return;
  }

  if (state.infiniteScrollProgressPx > 0) clearScrollHint();
}

async function init() {
  if ("scrollRestoration" in window.history) {
    window.history.scrollRestoration = "manual";
  }

  state.shell = await initShell({
    page: "reader",
    onSearchSubmit: (q) => state.shell.goSearchPage(q),
    onImported: (data) => {
      const bid = data && data.book && data.book.book_id;
      if (bid) {
        window.location.href = `/reader?book_id=${encodeURIComponent(bid)}`;
      }
    },
  });

  if (state.shell && state.shell.hideStatus) state.shell.hideStatus();

  refs.readerTocTitle.textContent = state.shell.t("tocTitle");
  refs.btnCloseReaderToc.textContent = state.shell.t("close");
  refs.btnReaderToc.textContent = state.shell.t("readerToc");
  if (refs.btnFooterToc) refs.btnFooterToc.textContent = state.shell.t("readerToc");
  if (refs.btnOpenSettingsInline) refs.btnOpenSettingsInline.textContent = state.shell.t("openSettings");
  refs.btnModeRaw.textContent = state.shell.t("raw");
  refs.btnModeTrans.textContent = state.shell.t("trans");
  refs.btnTranslateMode.textContent = state.shell.t("modeServer");
  if (refs.btnReloadChapter) refs.btnReloadChapter.textContent = state.shell.t("reloadChapter");
  refs.btnOpenNameEditor.textContent = state.shell.t("bookPrivateNames");
  refs.btnFullscreen.textContent = state.shell.t("fullscreen");
  refs.btnPrev.textContent = state.shell.t("prev");
  refs.btnNext.textContent = state.shell.t("next");

  applyReaderModeClass();
  window.addEventListener("reader-settings-changed", () => {
    const preserveRatio = currentChapterRatio();
    applyReaderModeClass();
    resetFlipDragVisual();
    renderChapterContent(true, preserveRatio);
    updateProgress();
  });

  bindNameEditor();
  bindFlipDragGesture();
  bindReaderHotkeys();
  document.addEventListener("fullscreenchange", refreshFullscreenMode);
  refreshFullscreenMode();

  const query = state.shell.parseQuery();
  state.bookId = (query.book_id || "").trim();
  state.chapterId = (query.chapter_id || "").trim();
  state.mode = (query.mode || "trans").toLowerCase() === "raw" ? "raw" : "trans";
  state.translateMode = (query.translation_mode || "server").toLowerCase() === "local" ? "local" : "server";

  if (!state.bookId) {
    refs.readerBookTitle.textContent = state.shell.t("noBookSelected");
    refs.readerChapterSub.textContent = "";
    updateProgress();
    return;
  }

  await loadBook();
  // Khi vào reader bằng `book_id` (không chỉ định `chapter_id`), ưu tiên khôi phục vị trí đọc cũ.
  const explicitChapterId = Boolean(state.shell.parseQuery().chapter_id);
  let initialRatio = null;
  if (
    !explicitChapterId
    && state.book
    && state.book.last_read_chapter_id
    && state.chapterId === state.book.last_read_chapter_id
    && typeof state.book.last_read_ratio === "number"
  ) {
    initialRatio = state.book.last_read_ratio;
  }
  await loadChapter({ preserveRatio: initialRatio });

  refs.btnReaderToc.addEventListener("click", openToc);
  if (refs.btnFooterToc) refs.btnFooterToc.addEventListener("click", openToc);
  if (refs.btnOpenSettingsInline) {
    refs.btnOpenSettingsInline.addEventListener("click", () => {
      const topSettingsBtn = document.getElementById("btn-open-settings");
      if (topSettingsBtn) topSettingsBtn.click();
    });
  }
  refs.btnCloseReaderToc.addEventListener("click", closeToc);
  const backdrop = document.getElementById("settings-backdrop");
  const settingsDrawer = document.getElementById("settings-drawer");
  if (settingsDrawer) {
    settingsDrawer.classList.remove("open");
    settingsDrawer.setAttribute("aria-hidden", "true");
  }
  refs.readerTocDrawer.classList.remove("open");
  refs.readerTocDrawer.setAttribute("aria-hidden", "true");
  if (backdrop) {
    backdrop.hidden = true;
    backdrop.classList.remove("open");
  }
  if (backdrop) backdrop.addEventListener("click", closeToc);

  refs.btnModeRaw.addEventListener("click", () => switchMode("raw"));
  refs.btnModeTrans.addEventListener("click", () => switchMode("trans"));
  refs.btnTranslateMode.addEventListener("click", async () => {
    state.translateMode = state.translateMode === "local" ? "server" : "local";
    clearChapterCache();
    cancelPrefetch();
    refs.btnTranslateMode.textContent = state.translateMode === "local" ? state.shell.t("modeLocal") : state.shell.t("modeServer");
    await loadBook();
    await loadChapter();
  });
  if (refs.btnReloadChapter) {
    refs.btnReloadChapter.addEventListener("click", () => {
      reloadCurrentChapter().catch((error) => {
        state.shell.showToast(error.message || state.shell.t("toastError"));
      });
    });
  }

  refs.btnPrev.addEventListener("click", () => {
    goChapter(-1).catch((error) => state.shell.showToast(error.message || state.shell.t("toastError")));
  });
  refs.btnNext.addEventListener("click", () => {
    goChapter(1).catch((error) => state.shell.showToast(error.message || state.shell.t("toastError")));
  });

  refs.btnFullscreen.addEventListener("click", () => {
    toggleFullscreenMode().catch((error) => {
      state.shell.showToast(error.message || state.shell.t("toastError"));
    });
  });

  refs.readerContentScroll.addEventListener("scroll", () => {
    hideSelectionBtn();
    if (runtimeReadingMode() === "flip") return;
    updateProgress();
    updateMiniInfoVisibility();
    clearTimeout(state.saveTimer);
    state.saveTimer = window.setTimeout(() => saveProgress(), 280);
  });

  // Nếu trang đang scroll theo window (không phải scroll nội bộ), vẫn phải cập nhật tiến độ + lưu vị trí.
  window.addEventListener("scroll", () => {
    hideSelectionBtn();
    if (runtimeReadingMode() === "flip") return;
    updateProgress();
    updateMiniInfoVisibility();
    clearTimeout(state.saveTimer);
    state.saveTimer = window.setTimeout(() => saveProgress(), 280);
  }, { passive: true });

  // Chỉ bắt sự kiện click vào vùng nội dung để toggle UI
  refs.readerContentScroll.addEventListener("click", onFullscreenContentClick);
  refs.readerContentBody.addEventListener("click", onFullscreenContentClick);
  refs.readerViewport.addEventListener("click", onFullscreenContentClick);

  // Wheel: passive false để có thể preventDefault ở mode flip/horizontal
  refs.readerContentScroll.addEventListener("wheel", onReaderWheel, { passive: false });

  // Keydown: chỉ để exit fullscreen fallback
  document.addEventListener("keydown", onFullscreenKeydown, true);

  document.addEventListener("mouseup", () => window.setTimeout(handleSelectionButton, 10));
  document.addEventListener("touchend", () => window.setTimeout(handleSelectionButton, 10));
  document.addEventListener("click", (event) => {
    if (!refs.selectionNameBtn.contains(event.target)) {
      hideSelectionBtn();
    }
  });

  // Nếu body/window scroll (một số layout) thì vẫn canh lại vị trí mini bars.
  window.addEventListener("scroll", () => syncMiniBarLayout(), { passive: true });
  window.addEventListener("resize", () => {
    syncMiniBarLayout();
    updateProgress();
    updateMiniInfoVisibility();
  }, { passive: true });
}

init();
