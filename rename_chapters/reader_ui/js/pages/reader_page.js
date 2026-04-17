import { initShell } from "../site_common.js?v=20260417-import2";
import { buildParagraphNodes, normalizeDisplayTitle, normalizeParagraphDisplayText, normalizeReaderText, splitParagraphBlocks } from "../reader_text.js?v=20260408-readerpara2";
import { downloadPlainTextFile, parseNameSetText, serializeNameSetText } from "../name_set_text.js?v=20260405-name1";
import {
  TTS_DEFAULT_SETTINGS,
  buildTtsSegments,
  createTtsFallbackArtworkDataUrl,
  loadTtsSettings,
  normalizeTtsSpeechText,
  normalizeTtsSettings,
  parseTtsReplaceRules,
  saveTtsSettings,
} from "../reader_tts.js?v=20260408-ttsvi1";

const refs = {
  readerBookTitle: document.getElementById("reader-book-title"),
  readerChapterSub: document.getElementById("reader-chapter-sub"),
  readerChapterVipBadge: document.getElementById("reader-chapter-vip-badge"),
  readerTitleWrap: document.querySelector(".reader-title-wrap"),
  readerHeadSkeleton: document.getElementById("reader-head-skeleton"),
  readerViewport: document.getElementById("reader-viewport"),
  readerContentScroll: document.getElementById("reader-content-scroll"),
  readerContentSkeleton: document.getElementById("reader-content-skeleton"),
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
  btnOpenBookInfo: document.getElementById("btn-open-book-info"),
  btnOpenSettingsInline: document.getElementById("btn-open-settings-inline"),
  btnOpenTts: document.getElementById("btn-open-tts"),
  btnOpenRawEditor: document.getElementById("btn-open-raw-editor"),
  btnModeRaw: document.getElementById("btn-mode-raw"),
  btnModeTrans: document.getElementById("btn-mode-trans"),
  btnTranslateMode: document.getElementById("btn-translate-mode"),
  btnReloadChapter: document.getElementById("btn-reload-chapter"),
  btnOpenNameEditor: document.getElementById("btn-open-name-editor"),
  btnOpenReplaceEditor: document.getElementById("btn-open-replace-editor"),
  btnFullscreen: document.getElementById("btn-fullscreen"),
  btnPrev: document.getElementById("btn-prev"),
  btnFooterToc: document.getElementById("btn-footer-toc"),
  btnNext: document.getElementById("btn-next"),

  readerTocDrawer: document.getElementById("reader-toc-drawer"),
  readerTocSkeleton: document.getElementById("reader-toc-skeleton"),
  readerTocList: document.getElementById("reader-toc-list"),
  btnReaderTocPrev: document.getElementById("btn-reader-toc-prev"),
  readerTocPageSelect: document.getElementById("reader-toc-page-select"),
  btnReaderTocNext: document.getElementById("btn-reader-toc-next"),
  btnReaderDownloadBook: document.getElementById("btn-reader-download-book"),
  btnReaderRefreshToc: document.getElementById("btn-reader-refresh-toc"),
  btnCloseReaderToc: document.getElementById("btn-close-reader-toc"),
  readerTocTitle: document.getElementById("reader-toc-title"),

  nameEditorDialog: document.getElementById("name-editor-dialog"),
  nameEditorTitle: document.getElementById("name-editor-title"),
  btnCloseNameEditor: document.getElementById("btn-close-name-editor"),
  btnRefreshNamePreview: document.getElementById("btn-refresh-name-preview"),
  nameSetControls: document.getElementById("name-set-controls"),
  nameDictTypeLabel: document.getElementById("name-dict-type-label"),
  nameDictTypeSelect: document.getElementById("name-dict-type-select"),
  nameDictScopeLabel: document.getElementById("name-dict-scope-label"),
  nameDictScopeSelect: document.getElementById("name-dict-scope-select"),
  btnAddNameSet: document.getElementById("btn-add-name-set"),
  btnDeleteNameSet: document.getElementById("btn-delete-name-set"),
  btnQuickAddNameSet: document.getElementById("btn-quick-add-name-set"),
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
  nameBulkDialog: document.getElementById("name-bulk-dialog"),
  nameBulkTitle: document.getElementById("name-bulk-title"),
  btnCloseNameBulk: document.getElementById("btn-close-name-bulk"),
  nameBulkForm: document.getElementById("name-bulk-form"),
  nameBulkHint: document.getElementById("name-bulk-hint"),
  nameBulkInputLabel: document.getElementById("name-bulk-input-label"),
  nameBulkInput: document.getElementById("name-bulk-input"),
  btnCancelNameBulk: document.getElementById("btn-cancel-name-bulk"),
  btnConfirmNameBulk: document.getElementById("btn-confirm-name-bulk"),
  nameSuggestDialog: document.getElementById("name-suggest-dialog"),
  nameSuggestTitle: document.getElementById("name-suggest-title"),
  btnCloseNameSuggest: document.getElementById("btn-close-name-suggest"),
  nameSuggestHint: document.getElementById("name-suggest-hint"),
  nameSuggestColIndex: document.getElementById("name-suggest-col-index"),
  nameSuggestColSource: document.getElementById("name-suggest-col-source"),
  nameSuggestColHv: document.getElementById("name-suggest-col-hv"),
  nameSuggestColTarget: document.getElementById("name-suggest-col-target"),
  nameSuggestColOrigin: document.getElementById("name-suggest-col-origin"),
  nameSuggestColAction: document.getElementById("name-suggest-col-action"),
  nameSuggestLeftBody: document.getElementById("name-suggest-left-body"),
  nameSuggestRightBody: document.getElementById("name-suggest-right-body"),
  btnNameSuggestGoogleTranslate: document.getElementById("btn-name-suggest-google-translate"),
  btnNameSuggestGoogleSearch: document.getElementById("btn-name-suggest-google-search"),

  selectionActionMenu: document.getElementById("selection-action-menu"),
  selectionSpeakBtn: document.getElementById("selection-speak-btn"),
  selectionNameBtn: document.getElementById("selection-name-btn"),
  selectionReplaceBtn: document.getElementById("selection-replace-btn"),
  selectionCopyBtn: document.getElementById("selection-copy-btn"),
  selectionNameDialog: document.getElementById("selection-name-dialog"),
  selectionNameTitle: document.getElementById("selection-name-title"),
  btnCloseSelectionName: document.getElementById("btn-close-selection-name"),
  selectionNameHint: document.getElementById("selection-name-hint"),
  selectionNameForm: document.getElementById("selection-name-form"),
  selectionNameSourceLabel: document.getElementById("selection-name-source-label"),
  selectionNameSourceInput: document.getElementById("selection-name-source-input"),
  selectionNameTargetLabel: document.getElementById("selection-name-target-label"),
  selectionNameTargetInput: document.getElementById("selection-name-target-input"),
  btnOpenSelectionNameSuggest: document.getElementById("btn-open-selection-name-suggest"),
  btnCancelSelectionName: document.getElementById("btn-cancel-selection-name"),
  btnDeleteSelectionName: document.getElementById("btn-delete-selection-name"),
  btnConfirmSelectionName: document.getElementById("btn-confirm-selection-name"),
  selectionJunkBtn: document.getElementById("selection-junk-btn"),
  selectionJunkDialog: document.getElementById("selection-junk-dialog"),
  selectionJunkTitle: document.getElementById("selection-junk-title"),
  btnCloseSelectionJunk: document.getElementById("btn-close-selection-junk"),
  selectionJunkHint: document.getElementById("selection-junk-hint"),
  selectionJunkForm: document.getElementById("selection-junk-form"),
  selectionJunkInputLabel: document.getElementById("selection-junk-input-label"),
  selectionJunkInput: document.getElementById("selection-junk-input"),
  selectionJunkRegexInput: document.getElementById("selection-junk-regex-input"),
  selectionJunkRegexLabel: document.getElementById("selection-junk-regex-label"),
  selectionJunkIgnoreCaseInput: document.getElementById("selection-junk-ignore-case-input"),
  selectionJunkIgnoreCaseLabel: document.getElementById("selection-junk-ignore-case-label"),
  btnCancelSelectionJunk: document.getElementById("btn-cancel-selection-junk"),
  btnConfirmSelectionJunk: document.getElementById("btn-confirm-selection-junk"),
  selectionReplaceDialog: document.getElementById("selection-replace-dialog"),
  selectionReplaceTitle: document.getElementById("selection-replace-title"),
  btnCloseSelectionReplace: document.getElementById("btn-close-selection-replace"),
  selectionReplaceHint: document.getElementById("selection-replace-hint"),
  selectionReplaceForm: document.getElementById("selection-replace-form"),
  selectionReplaceSourceLabel: document.getElementById("selection-replace-source-label"),
  selectionReplaceSourceInput: document.getElementById("selection-replace-source-input"),
  selectionReplaceTargetLabel: document.getElementById("selection-replace-target-label"),
  selectionReplaceTargetInput: document.getElementById("selection-replace-target-input"),
  selectionReplaceRegexInput: document.getElementById("selection-replace-regex-input"),
  selectionReplaceRegexLabel: document.getElementById("selection-replace-regex-label"),
  selectionReplaceIgnoreCaseInput: document.getElementById("selection-replace-ignore-case-input"),
  selectionReplaceIgnoreCaseLabel: document.getElementById("selection-replace-ignore-case-label"),
  btnCancelSelectionReplace: document.getElementById("btn-cancel-selection-replace"),
  btnConfirmSelectionReplace: document.getElementById("btn-confirm-selection-replace"),
  ttsDialog: document.getElementById("tts-dialog"),
  ttsDialogTitle: document.getElementById("tts-dialog-title"),
  btnCloseTtsDialog: document.getElementById("btn-close-tts-dialog"),
  ttsDialogHint: document.getElementById("tts-dialog-hint"),
  ttsStatusText: document.getElementById("tts-status-text"),
  ttsStatusSub: document.getElementById("tts-status-sub"),
  ttsProgressText: document.getElementById("tts-progress-text"),
  btnTtsPlayChapter: document.getElementById("btn-tts-play-chapter"),
  btnTtsTogglePlay: document.getElementById("btn-tts-toggle-play"),
  btnTtsStop: document.getElementById("btn-tts-stop"),
  btnTtsPrevSegment: document.getElementById("btn-tts-prev-segment"),
  btnTtsNextSegment: document.getElementById("btn-tts-next-segment"),
  ttsProviderLabel: document.getElementById("tts-provider-label"),
  ttsProviderSelect: document.getElementById("tts-provider-select"),
  ttsVoiceLabel: document.getElementById("tts-voice-label"),
  ttsVoiceSelect: document.getElementById("tts-voice-select"),
  ttsRateLabel: document.getElementById("tts-rate-label"),
  ttsRateInput: document.getElementById("tts-rate-input"),
  ttsRateValue: document.getElementById("tts-rate-value"),
  ttsPitchLabel: document.getElementById("tts-pitch-label"),
  ttsPitchInput: document.getElementById("tts-pitch-input"),
  ttsPitchValue: document.getElementById("tts-pitch-value"),
  ttsVolumeLabel: document.getElementById("tts-volume-label"),
  ttsVolumeInput: document.getElementById("tts-volume-input"),
  ttsVolumeValue: document.getElementById("tts-volume-value"),
  ttsMaxCharsLabel: document.getElementById("tts-max-chars-label"),
  ttsMaxCharsInput: document.getElementById("tts-max-chars-input"),
  ttsSegmentDelayLabel: document.getElementById("tts-segment-delay-label"),
  ttsSegmentDelayInput: document.getElementById("tts-segment-delay-input"),
  ttsPrefetchCountLabel: document.getElementById("tts-prefetch-count-label"),
  ttsPrefetchCountInput: document.getElementById("tts-prefetch-count-input"),
  ttsRemoteTimeoutLabel: document.getElementById("tts-remote-timeout-label"),
  ttsRemoteTimeoutInput: document.getElementById("tts-remote-timeout-input"),
  ttsRemoteRetriesLabel: document.getElementById("tts-remote-retries-label"),
  ttsRemoteRetriesInput: document.getElementById("tts-remote-retries-input"),
  ttsRemoteGapLabel: document.getElementById("tts-remote-gap-label"),
  ttsRemoteGapInput: document.getElementById("tts-remote-gap-input"),
  ttsPrefetchEnabledInput: document.getElementById("tts-prefetch-enabled-input"),
  ttsPrefetchEnabledLabel: document.getElementById("tts-prefetch-enabled-label"),
  ttsIncludeTitleInput: document.getElementById("tts-include-title-input"),
  ttsIncludeTitleLabel: document.getElementById("tts-include-title-label"),
  ttsAutoScrollInput: document.getElementById("tts-auto-scroll-input"),
  ttsAutoScrollLabel: document.getElementById("tts-auto-scroll-label"),
  ttsAutoNextInput: document.getElementById("tts-auto-next-input"),
  ttsAutoNextLabel: document.getElementById("tts-auto-next-label"),
  ttsAutoStartNextInput: document.getElementById("tts-auto-start-next-input"),
  ttsAutoStartNextLabel: document.getElementById("tts-auto-start-next-label"),
  ttsReplaceEnabledInput: document.getElementById("tts-replace-enabled-input"),
  ttsReplaceEnabledLabel: document.getElementById("tts-replace-enabled-label"),
  ttsReplaceRulesLabel: document.getElementById("tts-replace-rules-label"),
  ttsReplaceRulesInput: document.getElementById("tts-replace-rules-input"),
  ttsReplaceRulesHint: document.getElementById("tts-replace-rules-hint"),
  ttsSleepLabel: document.getElementById("tts-sleep-label"),
  ttsSleepPresetSelect: document.getElementById("tts-sleep-preset-select"),
  ttsSleepCustomWrap: document.getElementById("tts-sleep-custom-wrap"),
  ttsSleepCustomLabel: document.getElementById("tts-sleep-custom-label"),
  ttsSleepCustomInput: document.getElementById("tts-sleep-custom-input"),
  btnTtsApplySleep: document.getElementById("btn-tts-apply-sleep"),
  btnTtsClearSleep: document.getElementById("btn-tts-clear-sleep"),
  ttsSleepStatus: document.getElementById("tts-sleep-status"),
  btnTtsCloseActions: document.getElementById("btn-tts-close-actions"),
  replaceEditorDialog: document.getElementById("replace-editor-dialog"),
  replaceEditorTitle: document.getElementById("replace-editor-title"),
  btnCloseReplaceEditor: document.getElementById("btn-close-replace-editor"),
  replaceEditorHint: document.getElementById("replace-editor-hint"),
  btnRefreshReplaceEditor: document.getElementById("btn-refresh-replace-editor"),
  replaceEntryForm: document.getElementById("replace-entry-form"),
  replaceSourceLabel: document.getElementById("replace-source-label"),
  replaceSourceInput: document.getElementById("replace-source-input"),
  replaceTargetLabel: document.getElementById("replace-target-label"),
  replaceTargetInput: document.getElementById("replace-target-input"),
  replaceRegexInput: document.getElementById("replace-regex-input"),
  replaceRegexLabel: document.getElementById("replace-regex-label"),
  replaceIgnoreCaseInput: document.getElementById("replace-ignore-case-input"),
  replaceIgnoreCaseLabel: document.getElementById("replace-ignore-case-label"),
  btnAddReplaceEntry: document.getElementById("btn-add-replace-entry"),
  replacePreviewHint: document.getElementById("replace-preview-hint"),
  replaceColSource: document.getElementById("replace-col-source"),
  replaceColTarget: document.getElementById("replace-col-target"),
  replaceColAction: document.getElementById("replace-col-action"),
  replacePreviewBody: document.getElementById("replace-preview-body"),
  rawEditorDialog: document.getElementById("raw-editor-dialog"),
  rawEditorTitle: document.getElementById("raw-editor-title"),
  btnCloseRawEditor: document.getElementById("btn-close-raw-editor"),
  rawEditorForm: document.getElementById("raw-editor-form"),
  rawEditorHint: document.getElementById("raw-editor-hint"),
  rawEditorInputLabel: document.getElementById("raw-editor-input-label"),
  rawEditorInput: document.getElementById("raw-editor-input"),
  rawEditorMeta: document.getElementById("raw-editor-meta"),
  btnCancelRawEditor: document.getElementById("btn-cancel-raw-editor"),
  btnSaveRawEditor: document.getElementById("btn-save-raw-editor"),
  readerHead: document.querySelector(".reader-head"),
  readerFooter: document.querySelector(".reader-footer"),
};

const state = {
  shell: null,
  bookId: "",
  chapterId: "",
  book: null,
  translationSupportedHint: null,
  isComicHint: null,
  mode: "raw",
  translateMode: "server",
  translationEnabled: true,
  globalTranslationMode: "server",
  globalTranslationLocalSig: "{}",
  nameDictType: "name",
  nameDictScope: "book",
  nameSets: { "Mặc định": {} },
  activeNameSet: "Mặc định",
  globalDicts: { name: {}, vp: {} },
  bookVpDict: {},
  saveTimer: null,
  chapterText: "",
  chapterTransSig: "",
  chapterMapVersion: 0,
  chapterUnitCount: 0,
  chapterSourceType: "",
  chapterRemoteUrl: "",
  chapterRawEdited: false,
  chapterRawEditUpdatedAt: "",
  rawEditorChapterId: "",
  rawEditorInitialText: "",
  flipPages: [],
  flipPageIndex: 0,
  chapterCache: new Map(),
  chapterPending: new Map(),
  chapterCacheVersion: 0,
  prefetchControllers: new Map(),
  prefetchTimers: new Map(),
  prefetchRunSeq: 0,
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
  positionApplyRaf: 0,
  readerTocPagination: {
    page: 1,
    page_size: 120,
    total_pages: 1,
    total_items: 0,
  },
  chapterContentType: "text",
  chapterImages: [],
  comicLoadSeq: 0,
  downloadWatchTimer: null,
  downloadEventSource: null,
  downloadWatchReconnectTimer: null,
  downloadWatchBusy: false,
  downloadWatchSig: "",
  downloadWatchHadActive: false,
  downloadWatchIdleTicks: 0,
  selectionRefreshTimer: null,
  selectionMenuPayload: null,
  selectionNameMapSeq: 0,
  pendingSelectionNameRatio: null,
  pendingSelectionJunkRatio: null,
  pendingSelectionReplaceRatio: null,
  dictRefreshQueued: false,
  dictRefreshInFlight: false,
  dictRefreshRatio: null,
  dictRefreshBook: false,
  bookRefreshTimer: 0,
  bookReplaceEntries: [],
  tts: {
    settings: loadTtsSettings(),
    plugins: [],
    voicesByProvider: new Map(),
    browserVoices: [],
    browserVoicesLoaded: false,
    loadingVoices: false,
    activeVoiceItems: [],
    requestId: 0,
    chapterId: "",
    segments: [],
    segmentIndex: -1,
    paragraphCount: 0,
    playing: false,
    paused: false,
    waiting: false,
    providerLabel: "",
    statusMessage: "",
    statusSub: "",
    progressText: "",
    playFromSelectionNext: null,
    audio: null,
    audioCache: new Map(),
    inflight: new Map(),
    delayTimer: 0,
    browserUtterance: null,
    autoAdvancing: false,
    lastRemoteRequestAt: 0,
    sleepDeadlineAt: 0,
    sleepTickTimer: 0,
    sleepVolumeFactor: 1,
  },
};

const TOC_ICON_MARKUP = Object.freeze({
  download: '<svg class="toc-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v10"></path><path d="m8 11 4 4 4-4"></path><path d="M4 18h16"></path></svg>',
  done: '<svg class="toc-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"></circle><path d="m8.5 12 2.4 2.4 4.6-4.8"></path></svg>',
  refresh: '<svg class="toc-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 5v6h-6"></path><path d="M20 11a8 8 0 1 1-2.34-5.66L20 7.66"></path></svg>',
});

const TTS_SLEEP_PRESETS = Object.freeze([
  { value: "off", minutes: 0 },
  { value: "10", minutes: 10 },
  { value: "20", minutes: 20 },
  { value: "30", minutes: 30 },
  { value: "45", minutes: 45 },
  { value: "60", minutes: 60 },
  { value: "90", minutes: 90 },
  { value: "custom", minutes: null },
]);

function setTocIcon(button, kind) {
  if (!button) return;
  button.innerHTML = TOC_ICON_MARKUP[kind] || "";
}

function getErrorMessage(error) {
  if (!error) return state.shell ? state.shell.t("toastError") : "Có lỗi xảy ra.";
  const name = String(error.name || "").trim();
  const message = String(error.displayMessage || error.message || "").trim();
  if (name === "AbortError" || /abort(?:ed)?(?:\s+without\s+reason)?/i.test(message)) {
    return "Yêu cầu đã bị hủy hoặc quá thời gian chờ.";
  }
  return String(error.displayMessage || error.message || (state.shell ? state.shell.t("toastError") : "Có lỗi xảy ra."));
}

function validateRegexPattern(pattern) {
  try {
    new RegExp(String(pattern || ""));
    return "";
  } catch (error) {
    return String(error && error.message || "Regex không hợp lệ.");
  }
}

function ensureValidRegexOrToast(pattern, useRegex) {
  if (!useRegex) return true;
  const message = validateRegexPattern(pattern);
  if (!message) return true;
  state.shell.showToast(state.shell.t("invalidRegexPattern", { message }));
  return false;
}

function populateChapterTitleNode(node, title, isVip = false) {
  if (!node) return;
  node.textContent = "";
  const label = document.createElement("span");
  label.textContent = String(title || "").trim();
  node.appendChild(label);
  if (!isVip) return;
  const badge = document.createElement("span");
  badge.className = "chapter-vip-badge";
  badge.textContent = state.shell.t("vipBadge");
  node.appendChild(badge);
}

function normalizeTranslateMode(raw) {
  const mode = String(raw || "").trim().toLowerCase();
  if (mode === "local") return "local";
  if (mode === "dichngay_local") return "dichngay_local";
  if (mode === "hanviet") return "hanviet";
  return "server";
}

function createSkeletonBlock(className = "") {
  const node = document.createElement("div");
  node.className = `ui-skeleton-block${className ? ` ${className}` : ""}`;
  return node;
}

function renderReaderHeadSkeleton() {
  if (!refs.readerHeadSkeleton) return;
  refs.readerHeadSkeleton.innerHTML = "";
  refs.readerHeadSkeleton.append(
    createSkeletonBlock("reader-head-skeleton-book"),
    createSkeletonBlock("reader-head-skeleton-sub"),
  );
}

function showReaderHeadSkeleton(visible) {
  if (!refs.readerHeadSkeleton || !refs.readerTitleWrap) return;
  if (visible) {
    renderReaderHeadSkeleton();
    refs.readerHeadSkeleton.classList.remove("hidden");
    refs.readerHeadSkeleton.setAttribute("aria-hidden", "false");
    refs.readerTitleWrap.classList.add("is-loading");
    return;
  }
  refs.readerHeadSkeleton.classList.add("hidden");
  refs.readerHeadSkeleton.setAttribute("aria-hidden", "true");
  refs.readerTitleWrap.classList.remove("is-loading");
}

function renderReaderTocSkeleton(count = 10) {
  if (!refs.readerTocSkeleton) return;
  refs.readerTocSkeleton.innerHTML = "";
  const total = Math.max(4, Number(count) || 10);
  for (let index = 0; index < total; index += 1) {
    const row = document.createElement("div");
    row.className = "toc-skeleton-row";
    const main = document.createElement("div");
    main.className = "toc-skeleton-main";
    const title = createSkeletonBlock("toc-skeleton-title");
    if (index % 3 === 1) title.style.width = "66%";
    if (index % 3 === 2) title.style.width = "80%";
    main.append(
      title,
      createSkeletonBlock("toc-skeleton-sub"),
    );
    row.append(
      main,
      createSkeletonBlock("toc-skeleton-action"),
    );
    refs.readerTocSkeleton.appendChild(row);
  }
}

function showReaderTocSkeleton(visible, count = 10) {
  if (!refs.readerTocSkeleton || !refs.readerTocList) return;
  if (visible) {
    renderReaderTocSkeleton(count);
    refs.readerTocSkeleton.classList.remove("hidden");
    refs.readerTocSkeleton.setAttribute("aria-hidden", "false");
    refs.readerTocList.classList.add("hidden");
    refs.readerTocList.setAttribute("aria-busy", "true");
    return;
  }
  refs.readerTocSkeleton.classList.add("hidden");
  refs.readerTocSkeleton.setAttribute("aria-hidden", "true");
  refs.readerTocList.classList.remove("hidden");
  refs.readerTocList.setAttribute("aria-busy", "false");
}

function renderReaderContentSkeleton({ comic = false } = {}) {
  if (!refs.readerContentSkeleton) return;
  refs.readerContentSkeleton.innerHTML = "";
  const wrap = document.createElement("div");
  wrap.className = "reader-chapter-skeleton";
  if (comic) {
    for (let index = 0; index < 3; index += 1) {
      const block = createSkeletonBlock("reader-comic-skeleton-block");
      if (index === 1) block.style.height = "min(46vh, 520px)";
      wrap.appendChild(block);
    }
  } else {
    wrap.appendChild(createSkeletonBlock("reader-chapter-skeleton-title"));
    const lineKinds = [
      "is-wide",
      "is-medium",
      "is-inline",
      "is-wide",
      "is-medium",
      "is-wide",
      "is-short",
      "is-wide",
      "is-medium",
      "is-short",
    ];
    for (const kind of lineKinds) {
      wrap.appendChild(createSkeletonBlock(`reader-chapter-skeleton-line ${kind}`));
    }
  }
  refs.readerContentSkeleton.appendChild(wrap);
}

function showReaderContentSkeleton(visible, { comic = false } = {}) {
  if (!refs.readerContentSkeleton || !refs.readerContentScroll) return;
  if (visible) {
    renderReaderContentSkeleton({ comic });
    refs.readerContentSkeleton.classList.remove("hidden");
    refs.readerContentSkeleton.setAttribute("aria-hidden", "false");
    refs.readerContentScroll.classList.add("reader-loading");
    refs.readerContentScroll.setAttribute("aria-busy", "true");
    return;
  }
  refs.readerContentSkeleton.classList.add("hidden");
  refs.readerContentSkeleton.setAttribute("aria-hidden", "true");
  refs.readerContentScroll.classList.remove("reader-loading");
  refs.readerContentScroll.setAttribute("aria-busy", "false");
}

function localTranslationSettingsSignature(shell) {
  try {
    const data = shell && typeof shell.getTranslationLocalSettings === "function"
      ? shell.getTranslationLocalSettings()
      : {};
    return JSON.stringify(data || {});
  } catch {
    return "{}";
  }
}

function parseRequestedMode(rawMode) {
  const value = String(rawMode || "").trim().toLowerCase();
  if (value === "raw" || value === "trans") return value;
  return "";
}

function parseBooleanLike(value) {
  if (typeof value === "boolean") return value;
  const raw = String(value == null ? "" : value).trim().toLowerCase();
  if (!raw) return null;
  if (["1", "true", "yes", "on"].includes(raw)) return true;
  if (["0", "false", "no", "off"].includes(raw)) return false;
  return null;
}

function supportsTranslation(book) {
  if (!book) return false;
  if (typeof book.translation_supported === "boolean") return book.translation_supported;
  const sourceType = String(book.source_type || "").toLowerCase();
  if (sourceType === "vbook_comic" || sourceType === "vbook_session_comic" || sourceType === "comic") return false;
  const lang = String(book.lang_source || "").toLowerCase();
  return lang === "zh" || lang.startsWith("zh-");
}

function hintedSupportsTranslation() {
  if (state.book) return supportsTranslation(state.book);
  if (typeof state.translationSupportedHint === "boolean") return state.translationSupportedHint;
  return true;
}

function shouldTranslateReaderChrome() {
  return Boolean(state.translationEnabled && supportsTranslation(state.book));
}

function effectiveMode() {
  if (!supportsTranslation(state.book)) return "raw";
  return state.mode === "trans" ? "trans" : "raw";
}

function supportsRawTextReplace(book) {
  if (!book) return false;
  if (supportsTranslation(book)) return false;
  if (Boolean(book.is_comic)) return false;
  const sourceType = String(book.source_type || "").toLowerCase();
  return sourceType !== "vbook_comic" && sourceType !== "comic";
}

function hintedSupportsRawReplace() {
  if (state.book) return supportsRawTextReplace(state.book);
  if (state.translationSupportedHint === false) return state.isComicHint !== true;
  return false;
}

function supportsRawEditor(book) {
  if (!book) return false;
  if (Boolean(book.is_comic)) return false;
  const sourceType = String(book.source_type || "").toLowerCase();
  return sourceType !== "vbook_comic" && sourceType !== "vbook_session_comic" && sourceType !== "comic";
}

function hintedSupportsRawEditor() {
  if (state.book) return supportsRawEditor(state.book);
  return state.isComicHint !== true;
}

function applyReaderUrlHints(params, book) {
  if (!book || typeof book !== "object") return;
  const translationSupported = parseBooleanLike(book.translation_supported);
  const isComic = parseBooleanLike(book.is_comic);
  if (translationSupported !== null) params.set("translation_supported", translationSupported ? "1" : "0");
  if (isComic !== null) params.set("is_comic", isComic ? "1" : "0");
}

function buildReaderUrl(bookOrId, chapterId = "", mode = state.mode || "raw") {
  const book = bookOrId && typeof bookOrId === "object" ? bookOrId : null;
  const bookId = book ? String(book.book_id || "").trim() : String(bookOrId || "").trim();
  const params = new URLSearchParams();
  params.set("book_id", bookId);
  const chapter = String(chapterId || "").trim();
  if (chapter) params.set("chapter_id", chapter);
  params.set("mode", mode);
  if (mode === "trans") params.set("translation_mode", state.translateMode);
  applyReaderUrlHints(params, book);
  return `/reader?${params.toString()}`;
}

function buildBookUrl(bookOrId, mode = effectiveMode()) {
  const book = bookOrId && typeof bookOrId === "object" ? bookOrId : null;
  const bookId = book ? String(book.book_id || "").trim() : String(bookOrId || "").trim();
  const params = new URLSearchParams();
  params.set("book_id", bookId);
  params.set("mode", mode === "trans" ? "trans" : "raw");
  applyReaderUrlHints(params, book);
  return `/book?${params.toString()}`;
}

function isCurrentChapterRemoteSource() {
  const sourceType = String(state.chapterSourceType || ((state.book || {}).source_type) || "").trim().toLowerCase();
  return sourceType.startsWith("vbook") && Boolean(String(state.chapterRemoteUrl || "").trim());
}

function syncModeButtons() {
  const canTranslate = hintedSupportsTranslation();
  const canReplace = hintedSupportsRawReplace();
  const canEditRaw = hintedSupportsRawEditor();
  const canListen = (state.chapterContentType !== "images") && (state.isComicHint !== true);
  if (refs.btnModeTrans) refs.btnModeTrans.classList.toggle("hidden", !canTranslate);
  if (refs.btnTranslateMode) refs.btnTranslateMode.classList.toggle("hidden", !canTranslate);
  if (refs.btnOpenBookInfo) refs.btnOpenBookInfo.classList.toggle("hidden", !state.bookId);
  if (refs.btnOpenNameEditor) refs.btnOpenNameEditor.classList.toggle("hidden", !canTranslate);
  if (refs.btnOpenReplaceEditor) refs.btnOpenReplaceEditor.classList.toggle("hidden", !canReplace);
  if (refs.btnOpenRawEditor) refs.btnOpenRawEditor.classList.toggle("hidden", !canEditRaw);
  if (refs.btnOpenTts) refs.btnOpenTts.classList.toggle("hidden", !canListen);
  if (refs.btnModeRaw) refs.btnModeRaw.classList.toggle("active", state.mode === "raw");
  if (refs.btnModeTrans) refs.btnModeTrans.classList.toggle("active", state.mode === "trans");
  if (refs.btnTranslateMode && state.shell) {
    if (state.translateMode === "local") refs.btnTranslateMode.textContent = state.shell.t("modeLocal");
    else if (state.translateMode === "dichngay_local") refs.btnTranslateMode.textContent = state.shell.t("modeDichNgayLocal");
    else if (state.translateMode === "hanviet") refs.btnTranslateMode.textContent = state.shell.t("modeHanviet");
    else refs.btnTranslateMode.textContent = state.shell.t("modeServer");
  }
}

function canListenCurrentChapter() {
  if (!state.chapterId) return false;
  if (state.chapterContentType === "images") return false;
  if (state.isComicHint === true) return false;
  return true;
}

function ensureTtsSettings() {
  state.tts.settings = normalizeTtsSettings(state.tts.settings || TTS_DEFAULT_SETTINGS);
  return state.tts.settings;
}

function saveTtsSettingsState() {
  state.tts.settings = saveTtsSettings(state.tts.settings || TTS_DEFAULT_SETTINGS);
  renderTtsDialogState();
  return state.tts.settings;
}

function getTtsProviderId() {
  return String((state.tts.settings && state.tts.settings.provider) || "browser").trim() || "browser";
}

function isTtsBrowserProvider(providerId = getTtsProviderId()) {
  return String(providerId || "").trim() === "browser";
}

function currentTtsSleepMinutes() {
  const settings = ensureTtsSettings();
  const preset = String(settings.sleepPreset || "off").trim().toLowerCase();
  if (!preset || preset === "off") return 0;
  if (preset === "custom") {
    return Math.max(1, Number.parseInt(String(settings.sleepCustomMinutes || "0"), 10) || 0);
  }
  return Math.max(0, Number.parseInt(preset, 10) || 0);
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
  refs.readerViewport.classList.remove("reading-flip", "reading-horizontal", "reading-vertical", "reading-hybrid", "reading-comic");
  refs.readerViewport.classList.add(`reading-${mode}`);
  if (state.chapterContentType === "images") {
    refs.readerViewport.classList.add("reading-comic");
  }
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
  state.chapterCacheVersion += 1;
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
  for (const [key, timer] of Array.from(state.prefetchTimers.entries())) {
    if (!key.startsWith(keyPrefix)) continue;
    window.clearTimeout(timer);
    state.prefetchTimers.delete(key);
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
  state.prefetchRunSeq += 1;
  for (const [key, timer] of state.prefetchTimers.entries()) {
    if (exceptKeys.has(key)) continue;
    window.clearTimeout(timer);
    state.prefetchTimers.delete(key);
  }
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
  const cacheVersion = state.chapterCacheVersion;

  const req = state.shell.api(
    `/api/library/chapter/${encodeURIComponent(chapterId)}?mode=${encodeURIComponent(mode)}&translation_mode=${encodeURIComponent(translationMode)}`,
    signal ? { signal } : undefined,
  )
    .then((chapter) => {
      const safe = chapter || { content: "" };
      if (cacheVersion === state.chapterCacheVersion) {
        state.chapterCache.set(key, safe);
      }
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

async function fetchRawEditorContent(chapterId) {
  return state.shell.api(`/api/library/chapter/${encodeURIComponent(chapterId)}/raw`);
}

function resetRawEditorState() {
  state.rawEditorChapterId = "";
  state.rawEditorInitialText = "";
  if (refs.rawEditorForm) refs.rawEditorForm.reset();
  if (refs.rawEditorMeta) refs.rawEditorMeta.textContent = "";
}

function syncRawEditorHint(payload = null) {
  const data = (payload && typeof payload === "object") ? payload : {};
  const remoteUrl = String(data.remote_url || state.chapterRemoteUrl || "").trim();
  const rawEdited = Boolean(
    Object.prototype.hasOwnProperty.call(data, "raw_edited")
      ? data.raw_edited
      : state.chapterRawEdited,
  );
  if (refs.rawEditorHint) {
    refs.rawEditorHint.textContent = state.shell.t(remoteUrl ? "rawEditorHintOnline" : "rawEditorHint");
  }
  if (!refs.rawEditorMeta) return;
  if (rawEdited && remoteUrl) {
    refs.rawEditorMeta.textContent = state.shell.t("rawEditorMetaEditedOnline");
  } else if (rawEdited) {
    refs.rawEditorMeta.textContent = state.shell.t("rawEditorMetaEdited");
  } else if (remoteUrl) {
    refs.rawEditorMeta.textContent = state.shell.t("rawEditorMetaOnline");
  } else {
    refs.rawEditorMeta.textContent = "";
  }
}

function closeRawEditor() {
  if (refs.rawEditorDialog && refs.rawEditorDialog.open) {
    refs.rawEditorDialog.close();
    return;
  }
  resetRawEditorState();
}

async function openRawEditor() {
  if (!state.chapterId) return;
  if (!hintedSupportsRawEditor()) {
    state.shell.showToast(state.shell.t("rawEditorUnsupported"));
    return;
  }
  state.shell.showStatus(state.shell.t("statusLoadingRawEditor"));
  try {
    const data = await fetchRawEditorContent(state.chapterId);
    state.rawEditorChapterId = String((data && data.chapter_id) || state.chapterId || "").trim();
    state.rawEditorInitialText = String((data && data.content) || "");
    state.chapterSourceType = String((data && data.source_type) || state.chapterSourceType || "");
    state.chapterRemoteUrl = String((data && data.remote_url) || state.chapterRemoteUrl || "");
    state.chapterRawEdited = Boolean(data && data.raw_edited);
    state.chapterRawEditUpdatedAt = String((data && data.raw_edit_updated_at) || "");
    if (refs.rawEditorInput) refs.rawEditorInput.value = state.rawEditorInitialText;
    syncRawEditorHint(data);
    if (refs.rawEditorDialog && !refs.rawEditorDialog.open) refs.rawEditorDialog.showModal();
    if (refs.rawEditorInput) {
      refs.rawEditorInput.focus();
      refs.rawEditorInput.setSelectionRange(0, 0);
    }
  } finally {
    state.shell.hideStatus();
  }
}

async function saveRawEditor(event) {
  if (event) event.preventDefault();
  if (!state.rawEditorChapterId) return;
  const targetChapterId = state.rawEditorChapterId;
  const nextContent = String((refs.rawEditorInput && refs.rawEditorInput.value) || "");
  state.shell.showStatus(state.shell.t("statusSavingRawEditor"));
  try {
    const result = await state.shell.api(`/api/library/chapter/${encodeURIComponent(targetChapterId)}/raw`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: nextContent }),
    });
    state.chapterSourceType = String((result && result.source_type) || state.chapterSourceType || "");
    state.chapterRemoteUrl = String((result && result.remote_url) || state.chapterRemoteUrl || "");
    state.chapterRawEdited = Boolean(result && result.raw_edited);
    state.chapterRawEditUpdatedAt = String((result && result.raw_edit_updated_at) || "");
    const preserveRatio = currentChapterRatio();
    dropChapterCacheById(targetChapterId);
    closeRawEditor();
    if (String(targetChapterId || "").trim() === String(state.chapterId || "").trim()) {
      await loadChapter({ resetFlip: true, preserveRatio });
    }
    state.shell.showToast(state.shell.t("toastRawSaved"));
  } finally {
    state.shell.hideStatus();
  }
}

function prefetchOptions() {
  const sourceType = String(((state.book || {}).source_type) || "").trim().toLowerCase();
  const isVbook = sourceType.startsWith("vbook");
  const pluginId = String(((state.book || {}).source_plugin) || ((state.book || {}).plugin_id) || "").trim();
  const defaults = isVbook
    ? { prefetchUnreadCount: 2, downloadThreads: 4, requestDelayMs: 0 }
    : { prefetchUnreadCount: 1, downloadThreads: 2, requestDelayMs: 0 };
  const cfg = (state.shell && typeof state.shell.getVbookSettings === "function")
    ? (state.shell.getVbookSettings(pluginId) || {})
    : {};
  const asInt = (raw, min, max, fallback) => {
    const num = Number.parseInt(String(raw ?? ""), 10);
    if (!Number.isFinite(num)) return fallback;
    if (num < min) return min;
    if (num > max) return max;
    return num;
  };
  return {
    prefetchUnreadCount: asInt(cfg.prefetch_unread_count, 0, 50, defaults.prefetchUnreadCount),
    downloadThreads: asInt(cfg.download_threads, 1, 16, defaults.downloadThreads),
    requestDelayMs: asInt(cfg.request_delay_ms, 0, 15000, defaults.requestDelayMs),
  };
}

function prefetchNearbyChapters() {
  if (!state.book || !state.chapterId) return;
  const idx = findChapterIndex();
  if (idx < 0) return;

  const options = prefetchOptions();
  const maxForward = Math.max(0, options.prefetchUnreadCount);
  if (maxForward <= 0) {
    cancelPrefetch();
    return;
  }

  const mode = effectiveMode();
  const translationMode = state.translateMode;
  const chapters = [];
  for (let step = 1; step <= maxForward; step += 1) {
    const next = findChapterAt(idx + step);
    if (!next) break;
    chapters.push(next);
  }

  const keepKeys = new Set(chapters.map((ch) => chapterCacheKey(ch.chapter_id, mode, translationMode)));
  cancelPrefetch(keepKeys);
  const runSeq = state.prefetchRunSeq;
  const delayMs = Math.max(0, options.requestDelayMs);

  (async () => {
    let firstFetch = true;
    for (const chapter of chapters) {
      if (runSeq !== state.prefetchRunSeq) return;
      const cid = chapter.chapter_id;
      if (!cid) continue;
      const key = chapterCacheKey(cid, mode, translationMode);
      if (state.chapterCache.has(key) || state.chapterPending.has(key) || state.prefetchControllers.has(key)) continue;

      if (!firstFetch && delayMs > 0) {
        await new Promise((resolve) => window.setTimeout(resolve, delayMs));
        if (runSeq !== state.prefetchRunSeq) return;
      }
      firstFetch = false;

      const controller = new AbortController();
      state.prefetchControllers.set(key, controller);
      try {
        await fetchChapterContent(cid, { mode, translationMode, signal: controller.signal });
      } catch {
        // prefetch fail không chặn UI
      } finally {
        if (state.prefetchControllers.get(key) === controller) {
          state.prefetchControllers.delete(key);
        }
      }
    }
  })();
}

function chapterTitle(ch) {
  if (!ch) return "";
  if (shouldTranslateReaderChrome()) {
    return normalizeDisplayTitle(ch.title_display || ch.title_vi || ch.title_raw || `Chương ${ch.chapter_order || "?"}`);
  }
  return normalizeDisplayTitle(ch.title_raw || ch.title_display || `Chương ${ch.chapter_order || "?"}`);
}

function updateHeader() {
  if (!state.book) {
    refs.readerBookTitle.textContent = state.shell.t("noBookSelected");
    refs.readerChapterSub.textContent = "";
    if (refs.readerChapterVipBadge) refs.readerChapterVipBadge.classList.add("hidden");
    refs.readerChapterCounter.textContent = state.shell.t("chapterCounter", { current: 0, total: 0 });
    refs.readerPageCounter.textContent = state.shell.t("pageCounter", { current: 0, total: 0 });
    refs.readerBookPercent.textContent = state.shell.t("bookPercent", { percent: "0.0" });
    if (refs.readerMiniChapterTitle) refs.readerMiniChapterTitle.textContent = "";
    return;
  }
  const ch = (state.book.chapters || []).find((x) => x.chapter_id === state.chapterId);
  const chapterName = chapterTitle(ch) || state.shell.t("readerEmpty");
  const chapterVip = Boolean(ch && ch.is_vip);
  const bookName = shouldTranslateReaderChrome()
    ? normalizeDisplayTitle(state.book.title_display || state.book.title_vi || state.book.title)
    : normalizeDisplayTitle(state.book.title || state.book.title_display);
  // Bỏ title chương "cứng" ở phần head lớn: head lớn dùng tên truyện,
  // mini header overlay sẽ hiển thị tên chương khi user cuộn vào content.
  refs.readerBookTitle.textContent = bookName;
  refs.readerChapterSub.textContent = `${state.book.author_display || state.book.author || "Khuyết danh"}`;
  if (refs.readerChapterVipBadge) {
    refs.readerChapterVipBadge.textContent = state.shell.t("vipBadge");
    refs.readerChapterVipBadge.classList.toggle("hidden", !chapterVip);
  }
  if (refs.readerMiniChapterTitle) populateChapterTitleNode(refs.readerMiniChapterTitle, chapterName, chapterVip);
}

function updateMiniInfoVisibility() {
  // Mini bars là "info overlay" nhỏ: khi đã load chương thì luôn hiện,
  // không phụ thuộc việc user đã scroll hay chưa (tránh cảm giác "không thấy gì").
  const enabled = !(state.shell && state.shell.settings && state.shell.settings.miniBarsEnabled === false);
  const active = Boolean(state.chapterId) && enabled;
  if (refs.readerViewport) {
    refs.readerViewport.classList.toggle("mini-info-visible", active);
  }
  if (!active) {
    if (refs.readerMiniHead) refs.readerMiniHead.hidden = true;
    if (refs.readerMiniFoot) refs.readerMiniFoot.hidden = true;
    return;
  }
  const ready = syncMiniBarLayout();
  if (refs.readerMiniHead) refs.readerMiniHead.hidden = !ready;
  if (refs.readerMiniFoot) refs.readerMiniFoot.hidden = !ready;
  if (!ready) {
    window.requestAnimationFrame(() => {
      const r2 = syncMiniBarLayout();
      if (refs.readerMiniHead) refs.readerMiniHead.hidden = !r2;
      if (refs.readerMiniFoot) refs.readerMiniFoot.hidden = !r2;
    });
  }
}

function syncMiniBarLayout() {
  if (!refs.readerContentScroll) return false;
  const rect = refs.readerContentScroll.getBoundingClientRect();
  // Mặc định sát mép khung content (không khe hở).
  if (!Number.isFinite(rect.left) || rect.width <= 10) return false;
  const left = Math.max(0, Math.round(rect.left));
  const width = Math.max(240, Math.round(rect.width));
  const top = Math.max(0, Math.round(rect.top));
  const bottom = Math.max(0, Math.round(window.innerHeight - rect.bottom));

  const root = document.documentElement;
  root.style.setProperty("--mini-left", `${left}px`);
  root.style.setProperty("--mini-width", `${width}px`);
  root.style.setProperty("--mini-head-top", `${top}px`);
  root.style.setProperty("--mini-foot-bottom", `${bottom}px`);
  return true;
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

function cancelPendingPositionApply() {
  if (!state.positionApplyRaf) return;
  window.cancelAnimationFrame(state.positionApplyRaf);
  state.positionApplyRaf = 0;
}

function schedulePositionFromRatio(ratio) {
  cancelPendingPositionApply();
  const bounded = clamp01(ratio);
  state.positionApplyRaf = window.requestAnimationFrame(() => {
    state.positionApplyRaf = 0;
    applyPositionFromRatio(bounded);
    updateProgress();
  });
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
  if (state.tts.playing && !state.tts.autoAdvancing && String(chapterId || "").trim() !== String(state.chapterId || "").trim()) {
    stopTtsPlayback({ keepDialogOpen: true, preserveStatus: false });
  }
  if (String(chapterId || "").trim() !== String(state.chapterId || "").trim()) {
    closeRawEditor();
  }
  cancelPendingPositionApply();
  if (String(chapterId || "").trim() !== String(state.chapterId || "").trim()) {
    state.tts.playFromSelectionNext = null;
  }
  state.chapterId = chapterId;
  if (updateHistory) {
    window.history.replaceState({}, "", buildReaderUrl(state.book || state.bookId, state.chapterId, state.mode));
  }
  await loadChapter({ resetFlip, preserveRatio: 0 });
  if (fromToc) closeToc();
}

function buildReaderTocPageLabel(page, pagination = state.readerTocPagination) {
  const pageSize = Math.max(1, Number((pagination && pagination.page_size) || state.readerTocPagination.page_size || 120));
  const totalItems = Math.max(0, Number((pagination && pagination.total_items) || 0));
  const totalPages = Math.max(1, Number((pagination && pagination.total_pages) || 1));
  const safePage = Math.min(totalPages, Math.max(1, Number(page || 1)));
  const start = ((safePage - 1) * pageSize) + 1;
  const fallbackEnd = start + pageSize - 1;
  const end = totalItems > 0 ? Math.min(totalItems, fallbackEnd) : fallbackEnd;
  return `${start}-${end}`;
}

function syncReaderTocPagination({ focusCurrent = false } = {}) {
  const list = Array.isArray(state.book && state.book.chapters) ? state.book.chapters : [];
  const totalItems = list.length;
  const pageSize = Math.max(1, Number(state.readerTocPagination.page_size || 120));
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize) || 1);
  let page = Math.max(1, Number(state.readerTocPagination.page || 1));
  if (focusCurrent && totalItems > 0) {
    const currentIndex = findChapterIndex();
    if (currentIndex >= 0) {
      page = Math.floor(currentIndex / pageSize) + 1;
    }
  }
  page = Math.min(totalPages, page);
  state.readerTocPagination = {
    ...state.readerTocPagination,
    page,
    page_size: pageSize,
    total_pages: totalPages,
    total_items: totalItems,
  };
}

function renderReaderTocPageSelect() {
  if (!refs.readerTocPageSelect) return;
  refs.readerTocPageSelect.innerHTML = "";
  const totalPages = Math.max(1, Number(state.readerTocPagination.total_pages || 1));
  const currentPage = Math.min(totalPages, Math.max(1, Number(state.readerTocPagination.page || 1)));
  for (let page = 1; page <= totalPages; page += 1) {
    const option = document.createElement("option");
    option.value = String(page);
    option.textContent = buildReaderTocPageLabel(page);
    refs.readerTocPageSelect.appendChild(option);
  }
  refs.readerTocPageSelect.value = String(currentPage);
  refs.readerTocPageSelect.disabled = totalPages <= 1;
  refs.readerTocPageSelect.title = state.shell.t("tocJumpPage");
  refs.readerTocPageSelect.setAttribute("aria-label", state.shell.t("tocJumpPage"));
}

function renderToc() {
  refs.readerTocList.innerHTML = "";
  const list = (state.book && state.book.chapters) || [];
  syncReaderTocPagination();
  const page = Math.max(1, Number(state.readerTocPagination.page || 1));
  const pageSize = Math.max(1, Number(state.readerTocPagination.page_size || 120));
  const startIndex = (page - 1) * pageSize;
  const pageItems = list.slice(startIndex, startIndex + pageSize);
  const downloadedCount = list.reduce((acc, chapter) => acc + (chapter && chapter.is_downloaded ? 1 : 0), 0);
  if (refs.btnReaderDownloadBook) {
    refs.btnReaderDownloadBook.textContent = state.shell.t("downloadBook");
    refs.btnReaderDownloadBook.title = state.shell.t("downloadedCountShort", {
      downloaded: downloadedCount,
      total: list.length,
    });
    refs.btnReaderDownloadBook.disabled = !list.length || downloadedCount >= list.length;
  }
  if (!pageItems.length) {
    const li = document.createElement("li");
    li.className = "empty-text";
    li.textContent = state.shell.t("tocNoData");
    refs.readerTocList.appendChild(li);
  }
  for (const chapter of pageItems) {
    const li = document.createElement("li");
    li.className = "toc-row";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "reader-toc-item";
    if (chapter.chapter_id === state.chapterId) btn.classList.add("active");

    const title = document.createElement("div");
    title.className = "reader-toc-item-title";
    populateChapterTitleNode(
      title,
      `${chapter.chapter_order}. ${chapterTitle(chapter)}`,
      Boolean(chapter.is_vip),
    );

    btn.appendChild(title);
    btn.addEventListener("click", () => {
      openChapterById(chapter.chapter_id, { fromToc: true }).catch((error) => {
        state.shell.showToast(error.message || state.shell.t("toastError"));
      });
    });
    li.appendChild(btn);
    const iconBtn = document.createElement("button");
    iconBtn.type = "button";
    iconBtn.className = "btn toc-icon-btn";
    if (chapter.is_downloaded) {
      iconBtn.classList.add("is-done");
      setTocIcon(iconBtn, "done");
      iconBtn.title = state.shell.t("downloadedTag");
      iconBtn.setAttribute("aria-label", state.shell.t("downloadedTag"));
      iconBtn.disabled = true;
    } else {
      iconBtn.classList.add("is-download");
      setTocIcon(iconBtn, "download");
      iconBtn.title = state.shell.t("downloadChapter");
      iconBtn.setAttribute("aria-label", state.shell.t("downloadChapter"));
      iconBtn.addEventListener("click", async (event) => {
        event.preventDefault();
        event.stopPropagation();
        await downloadCurrentChapterById(chapter.chapter_id);
      });
    }
    li.appendChild(iconBtn);
    refs.readerTocList.appendChild(li);
  }
  if (refs.btnReaderTocPrev) refs.btnReaderTocPrev.disabled = page <= 1;
  if (refs.btnReaderTocNext) refs.btnReaderTocNext.disabled = page >= state.readerTocPagination.total_pages;
  renderReaderTocPageSelect();
  showReaderTocSkeleton(false);
}

async function downloadCurrentChapterById(chapterId) {
  const cid = String(chapterId || "").trim();
  if (!cid) return;
  state.shell.showStatus(state.shell.t("statusQueueDownload"));
  try {
    const data = await state.shell.api(`/api/library/chapter/${encodeURIComponent(cid)}/download`, {
      method: "POST",
    });
    if (data && data.already_downloaded) {
      state.shell.showToast(state.shell.t("downloadAlreadyDone"));
    } else {
      state.shell.showToast(state.shell.t("downloadQueued"));
    }
    await loadBook();
    renderToc();
    updateProgress();
    window.dispatchEvent(new CustomEvent("reader-cache-changed", {
      detail: {
        source: "reader-download",
        action: "enqueue_chapter_download",
        book_id: state.bookId,
        chapter_id: cid,
      },
    }));
    startReaderDownloadWatcher();
  } catch (error) {
    state.shell.showToast(error.message || state.shell.t("toastError"));
  } finally {
    state.shell.hideStatus();
  }
}

async function downloadBookFromReaderToc() {
  if (!state.bookId || !state.book || !Array.isArray(state.book.chapters) || !state.book.chapters.length) return;
  const chapters = state.book.chapters;
  let startOrder = 1;
  const currentIndex = findChapterIndex();
  if (currentIndex > 0) {
    const hasMissingBefore = chapters.slice(0, currentIndex).some((chapter) => !chapter || !chapter.is_downloaded);
    if (hasMissingBefore) {
      const currentOrder = Math.max(1, Number(chapters[currentIndex].chapter_order || 0) || (currentIndex + 1));
      const fromCurrent = window.confirm(state.shell.t("downloadBookFromCurrentConfirm", { current: currentOrder }));
      startOrder = fromCurrent ? currentOrder : 1;
    }
  }
  const payload = {};
  if (startOrder > 1) payload.start_order = startOrder;
  state.shell.showStatus(state.shell.t("statusQueueDownload"));
  try {
    const data = await state.shell.api(`/api/library/book/${encodeURIComponent(state.bookId)}/download`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (data && data.already_downloaded) {
      state.shell.showToast(state.shell.t("downloadAlreadyDone"));
    } else {
      state.shell.showToast(state.shell.t("downloadQueued"));
    }
    await loadBook();
    renderToc();
    updateProgress();
    window.dispatchEvent(new CustomEvent("reader-cache-changed", {
      detail: {
        source: "reader-download",
        action: "enqueue_book_download",
        book_id: state.bookId,
        start_order: startOrder,
      },
    }));
    startReaderDownloadWatcher();
  } catch (error) {
    state.shell.showToast(error.message || state.shell.t("toastError"));
  } finally {
    state.shell.hideStatus();
  }
}

async function refreshReaderToc() {
  if (!state.bookId) return;
  const preserveRatio = currentChapterRatio();
  showReaderTocSkeleton(true, 10);
  state.shell.showStatus(state.shell.t("statusCheckingBookUpdates"));
  try {
    const data = await state.shell.api(`/api/library/book/${encodeURIComponent(state.bookId)}/refresh-toc`, {
      method: "POST",
    });
    await loadBook();
    const chapterList = Array.isArray(state.book && state.book.chapters) ? state.book.chapters : [];
    const chapterStillExists = chapterList.some((chapter) => String((chapter && chapter.chapter_id) || "").trim() === String(state.chapterId || "").trim());
    if (!chapterStillExists) {
      state.chapterId = String(
        (state.book && state.book.last_read_chapter_id)
        || (chapterList[0] && chapterList[0].chapter_id)
        || "",
      ).trim();
      if (state.chapterId) {
        await loadChapter({ resetFlip: true, preserveRatio: 0 });
      }
    } else {
      renderToc();
      updateHeader();
      updateProgress();
      if (preserveRatio > 0 && state.runtimeMode !== "flip") {
        window.requestAnimationFrame(() => {
          applyPositionFromRatio(preserveRatio);
          updateProgress();
        });
      }
    }
    if (data && data.changed) {
      state.shell.showToast(state.shell.t("toastBookUpdatesApplied", {
        added: Number(data.added || 0),
        removed: Number(data.removed || 0),
        renamed: Number(data.renamed || 0),
      }));
    } else {
      state.shell.showToast(state.shell.t("toastBookUpdatesNoChange"));
    }
    window.dispatchEvent(new CustomEvent("reader-cache-changed", {
      detail: {
        source: "reader-refresh-toc",
        action: "refresh_toc",
        book_id: state.bookId,
      },
    }));
  } catch (error) {
    state.shell.showToast(error.message || state.shell.t("toastError"));
  } finally {
    showReaderTocSkeleton(false);
    state.shell.hideStatus();
  }
}

function clearReaderDownloadWatcher() {
  if (state.downloadEventSource) {
    try {
      state.downloadEventSource.close();
    } catch {
      // ignore
    }
    state.downloadEventSource = null;
  }
  if (state.downloadWatchReconnectTimer) {
    window.clearTimeout(state.downloadWatchReconnectTimer);
    state.downloadWatchReconnectTimer = null;
  }
  if (state.downloadWatchTimer) {
    window.clearInterval(state.downloadWatchTimer);
    state.downloadWatchTimer = null;
  }
  state.downloadWatchBusy = false;
  state.downloadWatchSig = "";
  state.downloadWatchHadActive = false;
  state.downloadWatchIdleTicks = 0;
}

function isCacheEventForCurrentBook(detail) {
  if (!state.bookId) return false;
  const payload = (detail && typeof detail === "object") ? detail : {};
  const oneBookId = String(payload.book_id || "").trim();
  if (oneBookId && oneBookId === state.bookId) return true;
  const list = Array.isArray(payload.book_ids) ? payload.book_ids : [];
  return list.some((x) => String(x || "").trim() === state.bookId);
}

async function refreshReaderDownloadState() {
  await loadBook();
  renderToc();
  updateProgress();
}

function scheduleReaderDownloadWatcherReconnect() {
  if (state.downloadWatchReconnectTimer) return;
  state.downloadWatchReconnectTimer = window.setTimeout(() => {
    state.downloadWatchReconnectTimer = null;
    startReaderDownloadWatcher();
  }, 1200);
}

async function handleReaderDownloadWatcherPayload(data) {
  const jobs = Array.isArray(data && data.items) ? data.items : [];
  const related = jobs
    .filter((job) => String(job.book_id || "").trim() === state.bookId)
    .map((job) => ({
      id: String(job.job_id || ""),
      status: String(job.status || ""),
      downloaded: Number(job.downloaded_chapters || 0),
      total: Number(job.total_chapters || 0),
    }));
  const sig = related.map((x) => `${x.id}:${x.status}:${x.downloaded}:${x.total}`).join("|");
  const hasActive = related.length > 0;
  if (hasActive) {
    if ((sig !== state.downloadWatchSig) || (!state.downloadWatchHadActive)) {
      await refreshReaderDownloadState();
    }
    state.downloadWatchSig = sig;
    state.downloadWatchHadActive = true;
    state.downloadWatchIdleTicks = 0;
    return;
  }
  if (state.downloadWatchHadActive) {
    await refreshReaderDownloadState();
  }
  state.downloadWatchHadActive = false;
  state.downloadWatchSig = "";
  state.downloadWatchIdleTicks += 1;
  if (state.downloadWatchIdleTicks >= 6) {
    state.downloadWatchIdleTicks = 0;
  }
}

async function pollReaderDownloadWatcherTick() {
  if (!state.bookId || state.downloadWatchBusy) return;
  state.downloadWatchBusy = true;
  try {
    const data = await state.shell.api(`/api/library/download/jobs?book_id=${encodeURIComponent(state.bookId)}`);
    await handleReaderDownloadWatcherPayload(data);
  } catch {
    // ignore poll errors
  } finally {
    state.downloadWatchBusy = false;
  }
}

function startReaderDownloadWatcher() {
  if (!state.bookId) return;
  state.downloadWatchIdleTicks = 0;
  if (state.downloadEventSource || state.downloadWatchTimer) return;
  if (typeof window.EventSource === "function") {
    const streamUrl = `/api/library/download/jobs/stream?book_id=${encodeURIComponent(state.bookId)}`;
    const stream = new window.EventSource(streamUrl);
    state.downloadEventSource = stream;
    stream.addEventListener("jobs", (event) => {
      let payload = null;
      try {
        payload = JSON.parse(event.data || "{}");
      } catch {
        payload = null;
      }
      if (!payload || !Array.isArray(payload.items)) return;
      handleReaderDownloadWatcherPayload(payload).catch(() => {});
    });
    stream.onmessage = (event) => {
      let payload = null;
      try {
        payload = JSON.parse(event.data || "{}");
      } catch {
        payload = null;
      }
      if (!payload || !Array.isArray(payload.items)) return;
      handleReaderDownloadWatcherPayload(payload).catch(() => {});
    };
    stream.onerror = () => {
      if (state.downloadEventSource !== stream) return;
      try {
        stream.close();
      } catch {
        // ignore
      }
      state.downloadEventSource = null;
      scheduleReaderDownloadWatcherReconnect();
    };
    return;
  }
  if (state.downloadWatchTimer) return;
  state.downloadWatchTimer = window.setInterval(() => {
    pollReaderDownloadWatcherTick().catch(() => {});
  }, 1500);
  pollReaderDownloadWatcherTick().catch(() => {});
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
  const paragraphs = splitParagraphBlocks(content);

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
  cancelPendingPositionApply();
  const loadSeq = ++state.comicLoadSeq;
  refs.readerContentBody.innerHTML = "";
  const images = Array.isArray(state.chapterImages) ? state.chapterImages : [];
  if (!images.length) {
    refs.readerContentBody.appendChild(buildParagraphNodes("", state.shell.t("readerEmpty")));
  } else {
    const wrap = document.createElement("div");
    wrap.className = "reader-comic-wrap";
    const slots = [];
    for (let i = 0; i < images.length; i += 1) {
      const src = String(images[i] || "").trim();
      if (!src) continue;
      const slot = document.createElement("figure");
      slot.className = "reader-comic-slot loading";
      const holder = document.createElement("div");
      holder.className = "reader-comic-placeholder";
      holder.textContent = state.shell.t("readerComicLoading", { current: i + 1, total: images.length });
      slot.appendChild(holder);
      wrap.appendChild(slot);
      slots.push({ slot, src, index: i });
    }
    refs.readerContentBody.appendChild(wrap);
    // Tải ảnh tuần tự: ảnh trước xong mới tới ảnh sau, tránh dồn request làm lag/crash webview.
    (async () => {
      for (const item of slots) {
        if (loadSeq !== state.comicLoadSeq) return;
        await new Promise((resolve) => {
          const img = document.createElement("img");
          img.className = "reader-comic-image";
          img.loading = "eager";
          img.decoding = "async";
          img.alt = `Ảnh trang ${item.index + 1}`;
          const done = () => resolve();
          img.onload = () => {
            if (loadSeq !== state.comicLoadSeq) return done();
            item.slot.classList.remove("loading", "error");
            item.slot.classList.add("loaded");
            item.slot.innerHTML = "";
            item.slot.appendChild(img);
            updateProgress();
            done();
          };
          img.onerror = () => {
            if (loadSeq !== state.comicLoadSeq) return done();
            item.slot.classList.remove("loading");
            item.slot.classList.add("error");
            item.slot.innerHTML = "";
            const err = document.createElement("div");
            err.className = "reader-comic-error";
            err.textContent = state.shell.t("readerComicLoadFailed", { index: item.index + 1 });
            item.slot.appendChild(err);
            updateProgress();
            done();
          };
          img.src = item.src;
        });
        if (loadSeq !== state.comicLoadSeq) return;
        await new Promise((resolve) => window.requestAnimationFrame(() => resolve()));
      }
    })();
  }
  refs.readerContentScroll.scrollLeft = 0;
  if (preserveRatio == null) {
    refs.readerContentScroll.scrollTop = 0;
  } else {
    schedulePositionFromRatio(preserveRatio);
  }
}

function renderChapterContent(resetFlip = true, preserveRatio = null) {
  cancelPendingPositionApply();
  if (state.chapterContentType === "images") {
    state.flipPages = [];
    state.flipPageIndex = 0;
    renderImageChapter(preserveRatio);
    updateProgress();
    updateMiniInfoVisibility();
    return;
  }
  // Rời mode ảnh thì hủy luồng tải ảnh tuần tự hiện tại.
  state.comicLoadSeq += 1;
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
      schedulePositionFromRatio(ratio);
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

function renderChapterError(message) {
  cancelPendingPositionApply();
  refs.readerContentBody.innerHTML = "";
  const panel = document.createElement("div");
  panel.className = "reader-inline-error";

  const text = document.createElement("div");
  text.className = "reader-inline-error-text";
  text.textContent = String(message || state.shell.t("toastError")).trim() || state.shell.t("toastError");

  const actions = document.createElement("div");
  actions.className = "reader-inline-error-actions";
  const retryBtn = document.createElement("button");
  retryBtn.type = "button";
  retryBtn.className = "btn btn-primary";
  retryBtn.textContent = state.shell.t("retryCurrentChapter");
  retryBtn.addEventListener("click", () => {
    loadChapter({ resetFlip: true, showSkeleton: true }).catch(() => {});
  });
  actions.appendChild(retryBtn);

  panel.append(text, actions);
  refs.readerContentBody.appendChild(panel);
  refs.readerContentScroll.scrollTop = 0;
  refs.readerContentScroll.scrollLeft = 0;
  clearScrollHint();
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

async function loadBook({ showSkeleton = false } = {}) {
  if (!state.bookId) return;
  const shouldShowSkeleton = Boolean(showSkeleton && !state.book);
  if (shouldShowSkeleton) {
    showReaderHeadSkeleton(true);
    showReaderTocSkeleton(true, 10);
  }
  try {
    const detailMode = state.translationEnabled ? state.mode : "raw";
    const detail = await state.shell.api(`/api/library/book/${encodeURIComponent(state.bookId)}?mode=${encodeURIComponent(detailMode)}&translation_mode=${encodeURIComponent(state.translateMode)}`);
    state.book = detail;
    if (refs.btnReaderRefreshToc) {
      const sourceType = String((detail && detail.source_type) || "").trim().toLowerCase();
      const isOnline = sourceType === "vbook" || sourceType === "vbook_comic" || sourceType.startsWith("vbook_session");
      refs.btnReaderRefreshToc.classList.toggle("hidden", !isOnline);
    }
    if (!supportsTranslation(detail)) {
      state.mode = "raw";
    }
    if (!state.chapterId) {
      state.chapterId = detail.last_read_chapter_id || ((detail.chapters && detail.chapters[0] && detail.chapters[0].chapter_id) || "");
    }
    syncModeButtons();
    showReaderHeadSkeleton(false);
    updateHeader();
    if (shouldShowSkeleton) {
      renderToc();
      updateProgress();
    }
    if (state.shell && typeof state.shell.refreshVbookSettings === "function") {
      try {
        const runtimePluginId = String(detail.source_plugin || detail.plugin_id || "").trim();
        await state.shell.refreshVbookSettings(runtimePluginId);
      } catch {
        // ignore runtime settings refresh errors
      }
    }
  } finally {
    if (shouldShowSkeleton) {
      showReaderHeadSkeleton(false);
      showReaderTocSkeleton(false);
    }
  }
}

async function loadChapter({
  resetFlip = true,
  preserveRatio = null,
  preserveLivePosition = false,
  showSkeleton = true,
  quiet = false,
} = {}) {
  if (!state.chapterId) return;
  hideSelectionBtn();
  cancelPrefetch();
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
  const shouldShowSkeleton = Boolean(showSkeleton);
  if (shouldShowSkeleton) {
    showReaderContentSkeleton(true, { comic: Boolean(state.book && state.book.is_comic) });
  }

  if (!quiet) {
    state.shell.showStatus(state.shell.t("statusLoadingChapter"));
  }
  try {
    const chapter = await fetchChapterContent(targetChapterId, {
      mode,
      translationMode,
      signal: controller.signal,
    });
    if (requestSeq !== state.chapterLoadSeq || targetChapterId !== state.chapterId) return;
    const effectivePreserveRatio = preserveRatio == null
      ? null
      : (preserveLivePosition ? currentChapterRatio() : preserveRatio);
    const currentRow = Array.isArray(state.book && state.book.chapters)
      ? state.book.chapters.find((row) => String((row && row.chapter_id) || "").trim() === String(targetChapterId || "").trim())
      : null;
    if (currentRow) {
      currentRow.is_vip = Boolean(chapter && chapter.is_vip);
      if (chapter && typeof chapter.title === "string" && chapter.title.trim()) {
        currentRow.title_display = chapter.title;
      }
      if (chapter && typeof chapter.title_vi === "string") {
        currentRow.title_vi = chapter.title_vi;
      }
    }
    state.chapterContentType = String(chapter.content_type || "text").toLowerCase() === "images" ? "images" : "text";
    state.chapterImages = Array.isArray(chapter.images) ? chapter.images.map((x) => String(x || "").trim()).filter(Boolean) : [];
    state.chapterText = chapter.content || "";
    state.chapterTransSig = String(chapter.trans_sig || "").trim();
    state.chapterMapVersion = Number.parseInt(String(chapter.map_version || "0"), 10) || 0;
    state.chapterUnitCount = Number.parseInt(String(chapter.unit_count || "0"), 10) || 0;
    state.chapterSourceType = String(chapter.source_type || ((state.book && state.book.source_type) || "")).trim();
    state.chapterRemoteUrl = String(chapter.remote_url || "").trim();
    state.chapterRawEdited = Boolean(chapter.raw_edited);
    state.chapterRawEditUpdatedAt = String(chapter.raw_edit_updated_at || "").trim();
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
    syncModeButtons();
    clearScrollHint();
    renderChapterContent(resetFlip, effectivePreserveRatio);
    updateHeader();
    renderToc();
    updateProgress();
    prefetchNearbyChapters();
    if (isFullscreenActive()) {
      setFullscreenUiVisible(true, { autoHideMs: 1800 });
    }
    if (requestSeq === state.chapterLoadSeq) {
      showReaderContentSkeleton(false);
    }
  } catch (error) {
    if (isAbortError(error)) {
      if (requestSeq === state.chapterLoadSeq) {
        showReaderContentSkeleton(false);
      }
      return;
    }
    if (requestSeq === state.chapterLoadSeq) {
      showReaderContentSkeleton(false);
      state.chapterContentType = "text";
      state.chapterImages = [];
      state.chapterText = "";
      state.chapterTransSig = "";
      state.chapterMapVersion = 0;
      state.chapterUnitCount = 0;
      syncModeButtons();
      renderChapterError(getErrorMessage(error));
      updateHeader();
      renderToc();
    }
  } finally {
    if (!quiet && requestSeq === state.chapterLoadSeq) {
      state.shell.hideStatus();
    }
    if (state.activeChapterController === controller) {
      state.activeChapterController = null;
    }
  }
}

async function refreshReaderAfterDictChange({ preserveRatio = currentChapterRatio(), refreshBook = true } = {}) {
  cancelPrefetch();
  clearChapterCache();
  if (state.chapterId) {
    await loadChapter({
      resetFlip: true,
      preserveRatio,
      preserveLivePosition: true,
      showSkeleton: false,
      quiet: true,
    });
  }
  if (refreshBook && state.bookId) {
    scheduleReaderBookRefresh();
  }
}

function clearReaderBookRefreshTimer() {
  if (!state.bookRefreshTimer) return;
  window.clearTimeout(state.bookRefreshTimer);
  state.bookRefreshTimer = 0;
}

function scheduleReaderBookRefresh(delayMs = 1200) {
  clearReaderBookRefreshTimer();
  const bookId = String(state.bookId || "").trim();
  if (!bookId) return;
  state.bookRefreshTimer = window.setTimeout(() => {
    state.bookRefreshTimer = 0;
    if (String(state.bookId || "").trim() !== bookId) return;
    loadBook()
      .then(() => {
        renderToc();
        updateProgress();
      })
      .catch(() => {});
  }, Math.max(0, Number(delayMs) || 0));
}

function queueReaderDictRefresh({ preserveRatio = currentChapterRatio(), refreshBook = true } = {}) {
  state.dictRefreshQueued = true;
  state.dictRefreshRatio = Number.isFinite(preserveRatio) ? preserveRatio : currentChapterRatio();
  state.dictRefreshBook = Boolean(state.dictRefreshBook || refreshBook);
  if (state.dictRefreshInFlight) return;
  state.dictRefreshInFlight = true;
  (async () => {
    try {
      while (state.dictRefreshQueued) {
        const nextRatio = Number.isFinite(state.dictRefreshRatio) ? state.dictRefreshRatio : currentChapterRatio();
        const nextRefreshBook = Boolean(state.dictRefreshBook);
        state.dictRefreshQueued = false;
        state.dictRefreshRatio = null;
        state.dictRefreshBook = false;
        await refreshReaderAfterDictChange({ preserveRatio: nextRatio, refreshBook: nextRefreshBook });
      }
    } catch (error) {
      state.shell.showToast(error.message || state.shell.t("toastError"));
    } finally {
      state.dictRefreshInFlight = false;
      if (state.dictRefreshQueued) {
        queueReaderDictRefresh({
          preserveRatio: Number.isFinite(state.dictRefreshRatio) ? state.dictRefreshRatio : currentChapterRatio(),
          refreshBook: state.dictRefreshBook,
        });
      }
    }
  })();
}

function openToc() {
  syncReaderTocPagination({ focusCurrent: true });
  renderToc();
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

function isNameBookScope() {
  return state.nameDictType === "name" && state.nameDictScope === "book";
}

function syncNameEditorScopeUi() {
  const isBookName = isNameBookScope();
  if (refs.nameSetControls) refs.nameSetControls.hidden = !isBookName;
}

function getCurrentDictEntries() {
  if (state.nameDictType === "name" && state.nameDictScope === "book") {
    const active = state.activeNameSet || Object.keys(state.nameSets)[0] || "Mặc định";
    return state.nameSets[active] || {};
  }
  if (state.nameDictType === "vp" && state.nameDictScope === "book") {
    return state.bookVpDict || {};
  }
  if (state.nameDictType === "name") {
    return (state.globalDicts && state.globalDicts.name) || {};
  }
  return (state.globalDicts && state.globalDicts.vp) || {};
}

function normalizeNameSourceKey(value) {
  return String(value || "").trim();
}

function hasOwnEntry(entries, sourceKey) {
  if (!entries || typeof entries !== "object" || !sourceKey) return false;
  return Object.prototype.hasOwnProperty.call(entries, sourceKey);
}

function hasExistingNameSource(source) {
  const sourceKey = normalizeNameSourceKey(source);
  if (!sourceKey) return false;
  if (hasOwnEntry(state.bookVpDict, sourceKey)) return true;
  if (hasOwnEntry(state.globalDicts && state.globalDicts.name, sourceKey)) return true;
  if (hasOwnEntry(state.globalDicts && state.globalDicts.vp, sourceKey)) return true;
  const nameSets = state.nameSets && typeof state.nameSets === "object" ? state.nameSets : {};
  return Object.values(nameSets).some((entries) => hasOwnEntry(entries, sourceKey));
}

function syncNameEntrySubmitLabel() {
  if (!refs.btnAddNameEntry) return;
  const source = normalizeNameSourceKey(refs.nameSourceInput && refs.nameSourceInput.value);
  refs.btnAddNameEntry.textContent = state.shell.t(
    hasExistingNameSource(source) ? "updateNameEntry" : "addNameEntry",
  );
}

function renderNameEntriesTable() {
  refs.namePreviewBody.innerHTML = "";
  const entries = Object.entries(getCurrentDictEntries());
  if (!entries.length) {
    refs.namePreviewHint.textContent = state.shell.t("namePreviewEmpty");
    refreshNameSourceSuggestions();
    syncNameEntrySubmitLabel();
    return;
  }
  refs.namePreviewHint.textContent = state.shell.t("namePreviewCount", { count: entries.length });

  for (const [source, target] of entries) {
    const tr = document.createElement("tr");
    tr.className = "name-entry-row";
    const cell = document.createElement("td");
    cell.colSpan = 4;
    const card = document.createElement("div");
    card.className = "name-entry-card";

    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "btn name-entry-chip";
    chip.textContent = `${source}=${target || ""}`;
    chip.title = `${source}=${target || ""}`;
    chip.addEventListener("click", () => {
      openNameEntrySuggestFromList(source, target || "").catch((error) => {
        state.shell.showToast(error.message || state.shell.t("toastError"));
      });
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "btn btn-small";
    deleteBtn.textContent = state.shell.t("deleteNameEntry");
    deleteBtn.addEventListener("click", async () => {
      await deleteNameEntry(source);
    });

    card.append(chip, deleteBtn);
    cell.appendChild(card);
    tr.appendChild(cell);
    refs.namePreviewBody.appendChild(tr);
  }
  refreshNameSourceSuggestions();
  syncNameEntrySubmitLabel();
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
}

async function loadBookVpDict() {
  if (!state.bookId) {
    state.bookVpDict = {};
    return;
  }
  const data = await state.shell.api(`/api/local-dicts/book/${encodeURIComponent(state.bookId)}`);
  state.bookVpDict = (data && data.vp && typeof data.vp === "object") ? data.vp : {};
}

async function loadGlobalDicts() {
  const data = await state.shell.api("/api/local-dicts/global");
  const dicts = (data && data.global_dicts && typeof data.global_dicts === "object") ? data.global_dicts : {};
  state.globalDicts = {
    name: (dicts.name && typeof dicts.name === "object") ? dicts.name : {},
    vp: (dicts.vp && typeof dicts.vp === "object") ? dicts.vp : {},
  };
}

async function loadBookReplaceEntries() {
  if (!state.bookId) {
    state.bookReplaceEntries = [];
    return;
  }
  const data = await state.shell.api(`/api/book-replaces/book/${encodeURIComponent(state.bookId)}`);
  state.bookReplaceEntries = Array.isArray(data && data.entries)
    ? data.entries.map((item) => ({
        source: String(item && item.source || "").trim(),
        target: String(item && item.target || "").trim(),
        use_regex: Boolean(item && item.use_regex),
        ignore_case: Boolean(item && item.ignore_case),
      })).filter((item) => item.source)
    : [];
}

function syncBookReplaceEntriesFromState(payload) {
  state.bookReplaceEntries = Array.isArray(payload && payload.entries)
    ? payload.entries.map((item) => ({
        source: String(item && item.source || "").trim(),
        target: String(item && item.target || "").trim(),
        use_regex: Boolean(item && item.use_regex),
        ignore_case: Boolean(item && item.ignore_case),
      })).filter((item) => item.source)
    : [];
}

async function refreshNameEditorData() {
  await Promise.all([
    loadNameSets(),
    loadBookVpDict(),
    loadGlobalDicts(),
  ]);
  syncNameEditorScopeUi();
  renderNameEntriesTable();
  syncNameEntrySubmitLabel();
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

function refreshNameSourceSuggestions(extraItems = []) {
  const merged = [];
  const seen = new Set();
  const push = (raw) => {
    const value = String(raw || "").trim();
    if (!value || seen.has(value)) return;
    seen.add(value);
    merged.push(value);
  };
  for (const x of Array.isArray(extraItems) ? extraItems : []) push(x);
  for (const key of Object.keys(getCurrentDictEntries() || {})) {
    push(key);
    if (merged.length >= 180) break;
  }
  updateNameSourceSuggestions(merged);
}

function normalizeNameEntries(entries) {
  const result = {};
  for (const [rawSource, rawTarget] of Object.entries(entries || {})) {
    const source = String(rawSource || "").trim();
    const target = String(rawTarget || "").trim();
    if (!source || !target) continue;
    result[source] = target;
  }
  return result;
}

function mergeNameEntriesWithPriority(currentEntries, incomingEntries) {
  const current = normalizeNameEntries(currentEntries);
  const incoming = normalizeNameEntries(incomingEntries);
  const merged = { ...incoming };
  for (const [source, target] of Object.entries(current)) {
    if (Object.prototype.hasOwnProperty.call(merged, source)) continue;
    merged[source] = target;
  }
  return merged;
}

function buildNameSetExportText() {
  return serializeNameSetText(getCurrentDictEntries());
}

function parseNameEntriesOrThrow(rawText) {
  const parsed = parseNameSetText(rawText);
  if (!parsed.entryCount) {
    throw new Error(state.shell.t("nameSetImportInvalid"));
  }
  return normalizeNameEntries(parsed.entries);
}

async function saveBookVpEntries(entries, { replace = false } = {}) {
  const current = normalizeNameEntries(state.bookVpDict || {});
  const incoming = normalizeNameEntries(entries);
  const nextEntries = replace
    ? incoming
    : mergeNameEntriesWithPriority(current, incoming);
  if (replace) {
    for (const source of Object.keys(current)) {
      await state.shell.api(`/api/local-dicts/book/${encodeURIComponent(state.bookId)}/entry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dict_type: "vp", source, target: "", delete: true }),
      });
    }
  } else {
    for (const source of Object.keys(incoming)) {
      if (!Object.prototype.hasOwnProperty.call(current, source)) continue;
      await state.shell.api(`/api/local-dicts/book/${encodeURIComponent(state.bookId)}/entry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dict_type: "vp", source, target: "", delete: true }),
      });
    }
  }
  for (const [source, target] of Object.entries(nextEntries)) {
    await state.shell.api(`/api/local-dicts/book/${encodeURIComponent(state.bookId)}/entry`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dict_type: "vp", source, target }),
    });
  }
}

async function saveCurrentDictEntries(entries, { replace = false } = {}) {
  const incoming = normalizeNameEntries(entries);
  if (state.nameDictScope === "global") {
    const nextEntries = replace ? incoming : mergeNameEntriesWithPriority(getCurrentDictEntries(), incoming);
    await state.shell.api("/api/local-dicts/global", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state.nameDictType === "vp" ? { vp: nextEntries } : { name: nextEntries }),
    });
    return;
  }
  if (state.nameDictType === "vp") {
    await saveBookVpEntries(incoming, { replace });
    return;
  }
  const active = state.activeNameSet || "Mặc định";
  const nextEntries = replace ? incoming : mergeNameEntriesWithPriority(getCurrentDictEntries(), incoming);
  await state.shell.api("/api/name-sets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sets: { ...state.nameSets, [active]: nextEntries },
      active_set: active,
      bump_version: true,
      book_id: state.bookId,
    }),
  });
}

async function applyCurrentDictEntries(entries, { replace = false, toastKey = "nameSetImported" } = {}) {
  const nextEntries = normalizeNameEntries(entries);
  if (!Object.keys(nextEntries).length) {
    state.shell.showToast(state.shell.t("nameSetImportInvalid"));
    return false;
  }
  state.shell.showStatus(state.shell.t("statusApplyingNameEntry"));
  const preserveRatio = currentChapterRatio();
  try {
    await saveCurrentDictEntries(nextEntries, { replace });
    if (refs.nameSuggestDialog && refs.nameSuggestDialog.open) refs.nameSuggestDialog.close();
    if (refs.nameEditorDialog && refs.nameEditorDialog.open) refs.nameEditorDialog.close();
    refreshNameEditorData().catch(() => {});
    queueReaderDictRefresh({ preserveRatio, refreshBook: true });
    if (toastKey) {
      state.shell.showToast(state.shell.t(toastKey));
    }
    return true;
  } catch (error) {
    state.shell.showToast(error.message || state.shell.t("toastError"));
    return false;
  } finally {
    state.shell.hideStatus();
  }
}

async function deleteCurrentDictEntry(source) {
  const sourceKey = normalizeNameSourceKey(source);
  if (!sourceKey) return false;
  if (state.nameDictScope === "global") {
    const current = normalizeNameEntries(getCurrentDictEntries());
    if (!Object.prototype.hasOwnProperty.call(current, sourceKey)) return true;
    delete current[sourceKey];
    await state.shell.api("/api/local-dicts/global", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state.nameDictType === "vp" ? { vp: current } : { name: current }),
    });
    return true;
  }
  if (state.nameDictType === "vp") {
    await state.shell.api(`/api/local-dicts/book/${encodeURIComponent(state.bookId)}/entry`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dict_type: "vp", source: sourceKey, target: "", delete: true }),
    });
    return true;
  }
  const active = state.activeNameSet || "Mặc định";
  const currentSet = normalizeNameEntries((state.nameSets && state.nameSets[active]) || {});
  if (!Object.prototype.hasOwnProperty.call(currentSet, sourceKey)) return true;
  delete currentSet[sourceKey];
  await state.shell.api("/api/name-sets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sets: { ...state.nameSets, [active]: currentSet },
      active_set: active,
      bump_version: true,
      book_id: state.bookId,
    }),
  });
  return true;
}

async function openNameEntrySuggestFromList(source, target) {
  refs.nameSourceInput.value = String(source || "").trim();
  refs.nameTargetInput.value = String(target || "").trim();
  refreshNameSourceSuggestions([source]);
  syncNameEntrySubmitLabel();
  await openNameSuggestDialog();
}

function openNameBulkDialog() {
  if (!refs.nameBulkDialog) return;
  refs.nameBulkForm.reset();
  refs.nameBulkDialog.showModal();
  if (refs.nameBulkInput) refs.nameBulkInput.focus();
}

async function refreshNamePreview() {
  state.shell.showStatus(state.shell.t("statusLoadingNamePreview"));
  try {
    await refreshNameEditorData();
  } catch (error) {
    state.shell.showToast(error.message || state.shell.t("toastError"));
  } finally {
    state.shell.hideStatus();
  }
}

async function applyNameEntry(source, target) {
  return applyCurrentDictEntries({ [source]: target }, { replace: false, toastKey: "nameEntryApplied" });
}

function renderReplaceEntriesTable() {
  if (!refs.replacePreviewBody) return;
  refs.replacePreviewBody.innerHTML = "";
  const entries = Array.isArray(state.bookReplaceEntries) ? state.bookReplaceEntries.slice() : [];
  if (refs.replacePreviewHint) {
    refs.replacePreviewHint.textContent = entries.length
      ? state.shell.t("replacePreviewCount", { count: entries.length })
      : state.shell.t("replacePreviewEmpty");
  }
  for (const entry of entries) {
    const source = String(entry && entry.source || "").trim();
    const target = String(entry && entry.target || "").trim();
    const useRegex = Boolean(entry && entry.use_regex);
    const ignoreCase = Boolean(entry && entry.ignore_case);
    const tr = document.createElement("tr");
    const tdSource = document.createElement("td");
    const wrap = document.createElement("div");
    wrap.className = "junk-entry-row";
    const sourceInput = document.createElement("input");
    sourceInput.type = "text";
    sourceInput.className = "name-target-inline";
    sourceInput.value = source;
    const regexLabel = document.createElement("label");
    regexLabel.className = "checkbox-row";
    const regexInput = document.createElement("input");
    regexInput.type = "checkbox";
    regexInput.checked = useRegex;
    const regexText = document.createElement("span");
    regexText.textContent = state.shell.t("junkRegexLabel");
    regexLabel.append(regexInput, regexText);
    const ignoreLabel = document.createElement("label");
    ignoreLabel.className = "checkbox-row";
    const ignoreInput = document.createElement("input");
    ignoreInput.type = "checkbox";
    ignoreInput.checked = ignoreCase;
    const ignoreText = document.createElement("span");
    ignoreText.textContent = state.shell.t("junkIgnoreCaseLabel");
    ignoreLabel.append(ignoreInput, ignoreText);
    wrap.append(sourceInput, regexLabel, ignoreLabel);
    tdSource.appendChild(wrap);

    const tdTarget = document.createElement("td");
    const targetInput = document.createElement("input");
    targetInput.type = "text";
    targetInput.className = "name-target-inline";
    targetInput.value = target;
    tdTarget.appendChild(targetInput);

    const tdAction = document.createElement("td");
    const btnSave = document.createElement("button");
    btnSave.type = "button";
    btnSave.className = "btn btn-small";
    btnSave.textContent = state.shell.t("saveNameEntry");
    btnSave.addEventListener("click", async () => {
      const nextSource = String(sourceInput.value || "").trim();
      const nextTarget = String(targetInput.value || "").trim();
      if (!nextSource) {
        state.shell.showToast(state.shell.t("replaceSourceRequired"));
        sourceInput.focus();
        return;
      }
      if (!nextTarget) {
        state.shell.showToast(state.shell.t("replaceTargetRequired"));
        targetInput.focus();
        return;
      }
      if (!ensureValidRegexOrToast(nextSource, Boolean(regexInput.checked))) {
        sourceInput.focus();
        return;
      }
      try {
        const result = await state.shell.api(`/api/book-replaces/book/${encodeURIComponent(state.bookId)}/entry`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            source,
            target,
            use_regex: useRegex,
            ignore_case: ignoreCase,
            new_source: nextSource,
            new_target: nextTarget,
            new_use_regex: Boolean(regexInput.checked),
            new_ignore_case: Boolean(ignoreInput.checked),
          }),
        });
        syncBookReplaceEntriesFromState(result);
        renderReplaceEntriesTable();
        await refreshReaderAfterRawRuleChange({ preserveRatio: currentChapterRatio() });
        state.shell.showToast(state.shell.t("replaceEntryApplied"));
      } catch (error) {
        state.shell.showToast(error.message || state.shell.t("toastError"));
      }
    });
    const btnDelete = document.createElement("button");
    btnDelete.type = "button";
    btnDelete.className = "btn btn-small";
    btnDelete.textContent = state.shell.t("deleteNameEntry");
    btnDelete.addEventListener("click", async () => {
      try {
        const result = await state.shell.api(`/api/book-replaces/book/${encodeURIComponent(state.bookId)}/entry`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            source,
            target,
            use_regex: useRegex,
            ignore_case: ignoreCase,
            delete: true,
          }),
        });
        syncBookReplaceEntriesFromState(result);
        renderReplaceEntriesTable();
        await refreshReaderAfterRawRuleChange({ preserveRatio: currentChapterRatio() });
        state.shell.showToast(state.shell.t("replaceEntryDeleted"));
      } catch (error) {
        state.shell.showToast(error.message || state.shell.t("toastError"));
      }
    });
    tdAction.append(btnSave, btnDelete);
    tr.append(tdSource, tdTarget, tdAction);
    refs.replacePreviewBody.appendChild(tr);
  }
}

async function openReplaceEditor() {
  if (!state.bookId) return;
  try {
    await loadBookReplaceEntries();
    renderReplaceEntriesTable();
    if (refs.replaceEditorDialog && !refs.replaceEditorDialog.open) refs.replaceEditorDialog.showModal();
  } catch (error) {
    state.shell.showToast(error.message || state.shell.t("toastError"));
  }
}

async function deleteNameEntry(source) {
  state.shell.showStatus(state.shell.t("statusApplyingNameEntry"));
  const preserveRatio = currentChapterRatio();
  try {
    await deleteCurrentDictEntry(source);
    refreshNameEditorData().catch(() => {});
    queueReaderDictRefresh({ preserveRatio, refreshBook: true });
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
  if (refs.nameDictTypeSelect) refs.nameDictTypeSelect.value = state.nameDictType;
  if (refs.nameDictScopeSelect) refs.nameDictScopeSelect.value = state.nameDictScope;
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
  refreshNameSourceSuggestions((prefill && prefill.suggestions) || []);
  syncNameEntrySubmitLabel();
  refreshNameEditorData().catch((error) => state.shell.showToast(error.message || state.shell.t("toastError")));
}

async function addNameSet() {
  if (!isNameBookScope()) return;
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
    await refreshNameEditorData();
    await refreshReaderAfterDictChange({ preserveRatio: currentChapterRatio(), refreshBook: true });
  } catch (error) {
    state.shell.showToast(error.message || state.shell.t("toastError"));
  } finally {
    state.shell.hideStatus();
  }
}

async function deleteActiveNameSet() {
  if (!isNameBookScope()) return;
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
    await refreshNameEditorData();
    await refreshReaderAfterDictChange({ preserveRatio: currentChapterRatio(), refreshBook: true });
  } catch (error) {
    state.shell.showToast(error.message || state.shell.t("toastError"));
  } finally {
    state.shell.hideStatus();
  }
}

function exportActiveNameSet() {
  if (!isNameBookScope()) {
    const fileName = `dict_${state.nameDictType}_${state.nameDictScope}`.replace(/[^\w\-]+/g, "_");
    downloadPlainTextFile(buildNameSetExportText(), `${fileName}.txt`);
    return;
  }
  const active = state.activeNameSet || "Mặc định";
  const fileName = `name_set_${active}`.replace(/[^\w\-]+/g, "_");
  downloadPlainTextFile(buildNameSetExportText(), `${fileName}.txt`);
}

async function importNameSetFromFile(file) {
  if (!file) return;
  try {
    const raw = await file.text();
    const entries = parseNameEntriesOrThrow(raw);
    await applyCurrentDictEntries(entries, { replace: true, toastKey: "nameSetImported" });
  } catch (error) {
    state.shell.showToast(error.message || state.shell.t("toastError"));
  }
}

async function submitQuickAddNameEntries(event) {
  event.preventDefault();
  try {
    const entries = parseNameEntriesOrThrow(refs.nameBulkInput ? refs.nameBulkInput.value : "");
    const applied = await applyCurrentDictEntries(entries, { replace: false, toastKey: "nameSetQuickAddApplied" });
    if (applied && refs.nameBulkDialog) {
      refs.nameBulkDialog.close();
    }
  } catch (error) {
    state.shell.showToast(error.message || state.shell.t("toastError"));
  }
}

function renderNameSuggestRows(items, rightItems = []) {
  refs.nameSuggestLeftBody.innerHTML = "";
  refs.nameSuggestRightBody.innerHTML = "";
  const list = Array.isArray(items) ? items : [];
  const rightList = Array.isArray(rightItems) ? rightItems : [];
  refs.nameSuggestHint.textContent = state.shell.t("nameSuggestCount", { count: list.length });

  const currentInputs = () => {
    if (refs.selectionNameDialog && refs.selectionNameDialog.open) {
      return {
        sourceInput: refs.selectionNameSourceInput,
        targetInput: refs.selectionNameTargetInput,
        isSelectionDialog: true,
      };
    }
    return {
      sourceInput: refs.nameSourceInput,
      targetInput: refs.nameTargetInput,
      isSelectionDialog: false,
    };
  };

  let selectedIndex = -1;
  const selectRow = (idx) => {
    selectedIndex = idx;
    const row = list[idx];
    if (!row) return;
    const inputs = currentInputs();
    if (inputs.sourceInput) inputs.sourceInput.value = String(row.source_text || "").trim();
    if (inputs.targetInput) inputs.targetInput.value = String(row.han_viet || "").trim();
    const rows = refs.nameSuggestLeftBody.querySelectorAll("tr");
    rows.forEach((el, i) => el.classList.toggle("active", i === idx));
    syncNameSuggestExternalActions();
    if (!inputs.isSelectionDialog) syncNameEntrySubmitLabel();
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
      const inputs = currentInputs();
      if (inputs.targetInput) inputs.targetInput.focus();
    });
    refs.nameSuggestLeftBody.appendChild(trLeft);
  }

  if (!list.length) {
    const trEmptyLeft = document.createElement("tr");
    const tdEmptyLeft = document.createElement("td");
    tdEmptyLeft.colSpan = 3;
    tdEmptyLeft.className = "empty-text";
    tdEmptyLeft.textContent = state.shell.t("nameSuggestEmpty");
    trEmptyLeft.appendChild(tdEmptyLeft);
    refs.nameSuggestLeftBody.appendChild(trEmptyLeft);
  }

  if (!rightList.length) {
    const trPending = document.createElement("tr");
    const tdPending = document.createElement("td");
    tdPending.colSpan = 3;
    tdPending.className = "empty-text";
    tdPending.textContent = state.shell.t("nameSuggestRightPending");
    trPending.appendChild(tdPending);
    refs.nameSuggestRightBody.appendChild(trPending);
  } else {
    for (const row of rightList) {
      const tr = document.createElement("tr");
      const tdTarget = document.createElement("td");
      tdTarget.textContent = String(row.target_text || "").trim();
      const tdOrigin = document.createElement("td");
      tdOrigin.textContent = String(row.origin || "").trim();
      const tdAction = document.createElement("td");

      const btnUse = document.createElement("button");
      btnUse.type = "button";
      btnUse.className = "btn btn-small";
      btnUse.textContent = state.shell.t("nameSuggestUse");
      btnUse.addEventListener("click", () => {
        const inputs = currentInputs();
        const source = String(row.source_text || (inputs.sourceInput && inputs.sourceInput.value) || "").trim();
        const target = String(row.target_text || "").trim();
        if (source && inputs.sourceInput) inputs.sourceInput.value = source;
        if (target && inputs.targetInput) inputs.targetInput.value = target;
        refs.nameSuggestDialog.close();
        if (inputs.targetInput) inputs.targetInput.focus();
        syncNameSuggestExternalActions();
        if (!inputs.isSelectionDialog) syncNameEntrySubmitLabel();
      });
      tdAction.append(btnUse);
      tr.append(tdTarget, tdOrigin, tdAction);
      refs.nameSuggestRightBody.appendChild(tr);
    }
  }

  if (selectedIndex < 0 && list.length) {
    selectRow(0);
  } else {
    syncNameSuggestExternalActions();
  }
}

function currentNameSuggestSourceText() {
  if (refs.selectionNameDialog && refs.selectionNameDialog.open) {
    return String((refs.selectionNameSourceInput && refs.selectionNameSourceInput.value) || "").trim();
  }
  return String((refs.nameSourceInput && refs.nameSourceInput.value) || "").trim();
}

function syncNameSuggestExternalActions() {
  const source = currentNameSuggestSourceText();
  const disabled = !source;
  if (refs.btnNameSuggestGoogleTranslate) refs.btnNameSuggestGoogleTranslate.disabled = disabled;
  if (refs.btnNameSuggestGoogleSearch) refs.btnNameSuggestGoogleSearch.disabled = disabled;
}

async function openNameSuggestDialog() {
  const usingSelectionDialog = Boolean(refs.selectionNameDialog && refs.selectionNameDialog.open);
  const sourceInput = usingSelectionDialog ? refs.selectionNameSourceInput : refs.nameSourceInput;
  const sourceText = String((sourceInput && sourceInput.value) || "").trim();
  if (!sourceText) {
    state.shell.showToast(state.shell.t("nameSourceTargetRequired"));
    if (sourceInput) sourceInput.focus();
    return;
  }
  state.shell.showStatus(state.shell.t("statusLoadingNameSuggest"));
  try {
    const data = await state.shell.api("/api/name-suggest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source_text: sourceText,
        translation_mode: state.translateMode,
        book_id: state.bookId,
        set_name: state.activeNameSet,
        dict_type: state.nameDictType,
        scope: state.nameDictScope,
      }),
    });
    renderNameSuggestRows(data.items || [], data.right_items || []);
    refs.nameSuggestDialog.showModal();
  } catch (error) {
    state.shell.showToast(error.message || state.shell.t("toastError"));
  } finally {
    state.shell.hideStatus();
  }
}

function hideSelectionBtn() {
  if (state.selectionRefreshTimer) {
    window.clearTimeout(state.selectionRefreshTimer);
    state.selectionRefreshTimer = null;
  }
  if (refs.selectionActionMenu) {
    refs.selectionActionMenu.classList.add("hidden");
    refs.selectionActionMenu.style.removeProperty("left");
    refs.selectionActionMenu.style.removeProperty("top");
    refs.selectionActionMenu.style.removeProperty("visibility");
  }
  for (const node of [refs.selectionActionMenu, refs.selectionSpeakBtn, refs.selectionNameBtn, refs.selectionReplaceBtn, refs.selectionCopyBtn, refs.selectionJunkBtn]) {
    if (!node || !node.dataset) continue;
    delete node.dataset.text;
    delete node.dataset.exactText;
    delete node.dataset.startOffset;
    delete node.dataset.endOffset;
    delete node.dataset.startParagraphIndex;
    delete node.dataset.startParagraphOffset;
  }
}

function currentParagraphSeparatorLength() {
  const chapterText = normalizeReaderText(state.chapterText || "");
  if (!chapterText) return 2;
  return /\n{2,}/.test(chapterText) ? 2 : 1;
}

function activeReaderSelectionRange() {
  const selection = window.getSelection && window.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return null;
  const range = selection.getRangeAt(0);
  const ancestor = range.commonAncestorContainer;
  const rangeContainer = ancestor && ancestor.nodeType === 3 ? ancestor.parentElement : ancestor;
  if (!rangeContainer || !refs.readerContentBody || !refs.readerContentBody.contains(rangeContainer)) {
    return null;
  }
  return range;
}

function selectionRectFromRange(range) {
  if (!range) return null;
  const rect = typeof range.getBoundingClientRect === "function" ? range.getBoundingClientRect() : null;
  if (rect && (rect.width > 0 || rect.height > 0)) return rect;
  const rects = typeof range.getClientRects === "function" ? Array.from(range.getClientRects()) : [];
  const visibleRects = rects.filter((item) => item && (item.width > 0 || item.height > 0));
  if (!visibleRects.length) return rect;
  let left = visibleRects[0].left;
  let right = visibleRects[0].right;
  let top = visibleRects[0].top;
  let bottom = visibleRects[0].bottom;
  for (let i = 1; i < visibleRects.length; i += 1) {
    const item = visibleRects[i];
    left = Math.min(left, item.left);
    right = Math.max(right, item.right);
    top = Math.min(top, item.top);
    bottom = Math.max(bottom, item.bottom);
  }
  return {
    left,
    right,
    top,
    bottom,
    width: Math.max(0, right - left),
    height: Math.max(0, bottom - top),
  };
}

function shouldSuspendSelectionMenu() {
  if (refs.selectionJunkDialog && refs.selectionJunkDialog.open) return true;
  if (refs.selectionNameDialog && refs.selectionNameDialog.open) return true;
  if (refs.selectionReplaceDialog && refs.selectionReplaceDialog.open) return true;
  if (refs.nameEditorDialog && refs.nameEditorDialog.open) return true;
  if (refs.replaceEditorDialog && refs.replaceEditorDialog.open) return true;
  if (refs.nameSuggestDialog && refs.nameSuggestDialog.open) return true;
  const active = document.activeElement;
  if (!active || active === document.body) return false;
  if (active.tagName === "TEXTAREA") return true;
  if (active.tagName === "INPUT") {
    const type = String(active.getAttribute("type") || "text").trim().toLowerCase();
    if (!["button", "submit", "reset", "checkbox", "radio", "range"].includes(type)) return true;
  }
  return Boolean(active.isContentEditable);
}

function scheduleSelectionMenuRefresh(delay = 60) {
  if (state.selectionRefreshTimer) {
    window.clearTimeout(state.selectionRefreshTimer);
  }
  state.selectionRefreshTimer = window.setTimeout(() => {
    state.selectionRefreshTimer = null;
    handleSelectionButton();
  }, Math.max(0, Number(delay) || 0));
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
  const paragraphSeparatorLength = currentParagraphSeparatorLength();

  if (containerNode === body) {
    let sum = 0;
    const limit = Math.max(0, Math.min(Number(nodeOffset) || 0, body.childNodes.length));
    for (let i = 0; i < limit; i += 1) {
      const node = body.childNodes[i];
      if (node.nodeType === Node.ELEMENT_NODE && node.tagName && node.tagName.toLowerCase() === "p" && i > 0) {
        sum += paragraphSeparatorLength;
      }
      sum += renderedTextLength(node);
    }
    return sum;
  }

  const paragraphs = Array.from(body.children || []).filter((el) => el.tagName && el.tagName.toLowerCase() === "p");
  let total = 0;
  for (let i = 0; i < paragraphs.length; i += 1) {
    const p = paragraphs[i];
    if (i > 0) total += paragraphSeparatorLength;
    const inside = offsetInsideNode(p, containerNode, nodeOffset);
    if (inside != null) {
      return total + inside;
    }
    total += renderedTextLength(p);
  }
  return total;
}

function normalizeSelectionDisplayText(text) {
  return String(text == null ? "" : text)
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\u00a0/g, " ")
    .trim();
}

function selectionHasNameSplitDelimiter(text) {
  return /[\n\r,，、。！？!?；;：:]/.test(String(text || ""));
}

function selectionStartParagraphInfoFromRange(range) {
  if (!range || !refs.readerContentBody) {
    return { paragraphIndex: 0, paragraphOffset: 0 };
  }
  const startNode = range.startContainer;
  const startElement = startNode && startNode.nodeType === Node.ELEMENT_NODE
    ? startNode
    : (startNode && startNode.parentElement);
  const paragraph = startElement && startElement.closest ? startElement.closest("p") : null;
  if (!paragraph || !refs.readerContentBody.contains(paragraph)) {
    return { paragraphIndex: 0, paragraphOffset: 0 };
  }
  const nodes = paragraphNodesForTts();
  const paragraphIndex = Math.max(0, nodes.indexOf(paragraph));
  const innerOffset = offsetInsideNode(paragraph, range.startContainer, range.startOffset);
  return {
    paragraphIndex,
    paragraphOffset: Math.max(0, Number(innerOffset) || 0),
  };
}

function selectionPayloadFromRange(range) {
  const chapterText = normalizeReaderText(state.chapterText || "");
  const startRaw = computeRenderedOffset(range.startContainer, range.startOffset);
  const endRaw = computeRenderedOffset(range.endContainer, range.endOffset);
  let start = Math.min(startRaw, endRaw);
  let end = Math.max(startRaw, endRaw);
  start = Math.max(0, Math.min(chapterText.length, start));
  end = Math.max(0, Math.min(chapterText.length, end));
  const rawSelected = String(range.toString() || window.getSelection()?.toString() || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");
  const exactSelected = normalizeSelectionDisplayText(rawSelected);
  let selected = chapterText.slice(start, end).trim();
  if (!selected) {
    selected = normalizeReaderText(exactSelected).trim();
  }
  const paragraphInfo = selectionStartParagraphInfoFromRange(range);
  return {
    selected,
    rawSelected: rawSelected || exactSelected || selected,
    exactSelected: exactSelected || selected,
    start,
    end,
    startParagraphIndex: paragraphInfo.paragraphIndex,
    startParagraphOffset: paragraphInfo.paragraphOffset,
  };
}

function currentSelectionPayload(preferredNode = null) {
  const source = preferredNode || refs.selectionActionMenu || refs.selectionNameBtn;
  if (!source || !source.dataset) return null;
  const selected = String(source.dataset.text || "").trim();
  const rawSelected = String(source.dataset.rawText || source.dataset.exactText || selected);
  const exactSelected = normalizeSelectionDisplayText(source.dataset.exactText || selected);
  const startOffset = Number.parseInt(source.dataset.startOffset || "", 10);
  const endOffset = Number.parseInt(source.dataset.endOffset || "", 10);
  const startParagraphIndex = Number.parseInt(source.dataset.startParagraphIndex || "", 10);
  const startParagraphOffset = Number.parseInt(source.dataset.startParagraphOffset || "", 10);
  if (selected && !Number.isNaN(startOffset) && !Number.isNaN(endOffset)) {
    return {
      selected,
      rawSelected,
      exactSelected,
      start: startOffset,
      end: endOffset,
      startParagraphIndex: Number.isNaN(startParagraphIndex) ? 0 : startParagraphIndex,
      startParagraphOffset: Number.isNaN(startParagraphOffset) ? 0 : startParagraphOffset,
    };
  }
  const fallback = state.selectionMenuPayload;
  if (!fallback || !fallback.selected || Number.isNaN(Number(fallback.start)) || Number.isNaN(Number(fallback.end))) {
    return null;
  }
  return {
    selected: String(fallback.selected || "").trim(),
    rawSelected: String(fallback.rawSelected || fallback.exactSelected || fallback.selected || ""),
    exactSelected: normalizeSelectionDisplayText(fallback.exactSelected || fallback.selected || ""),
    start: Number(fallback.start) || 0,
    end: Number(fallback.end) || 0,
    startParagraphIndex: Number(fallback.startParagraphIndex) || 0,
    startParagraphOffset: Number(fallback.startParagraphOffset) || 0,
  };
}

function saveSelectionPayloadSnapshot(payload) {
  if (!payload || !payload.selected || Number.isNaN(Number(payload.start)) || Number.isNaN(Number(payload.end))) {
    return;
  }
  state.selectionMenuPayload = {
    selected: String(payload.selected || "").trim(),
    rawSelected: String(payload.rawSelected || payload.exactSelected || payload.selected || ""),
    exactSelected: normalizeSelectionDisplayText(payload.exactSelected || payload.selected || ""),
    start: Number(payload.start) || 0,
    end: Number(payload.end) || 0,
    startParagraphIndex: Number(payload.startParagraphIndex) || 0,
    startParagraphOffset: Number(payload.startParagraphOffset) || 0,
  };
}

function canEditSelectionName(payload) {
  const text = normalizeSelectionDisplayText(payload && (payload.exactSelected || payload.selected));
  if (!text) return false;
  if (effectiveMode() !== "trans") return false;
  if (!supportsTranslation(state.book)) return false;
  if (text.length > 240) return false;
  if (selectionHasNameSplitDelimiter(text)) return false;
  return true;
}

function canAddSelectionJunk(payload) {
  const text = normalizeSelectionDisplayText(payload && (payload.exactSelected || payload.selected));
  if (!text) return false;
  if (!state.chapterId || state.chapterContentType !== "text") return false;
  if (text.length > 240) return false;
  if (text.includes("\n")) return false;
  return true;
}

function canEditSelectionReplace(payload) {
  const text = normalizeSelectionDisplayText(payload && (payload.exactSelected || payload.selected));
  if (!text) return false;
  if (!state.chapterId || state.chapterContentType !== "text") return false;
  if (!supportsRawTextReplace(state.book)) return false;
  if (text.length > 240) return false;
  if (text.includes("\n")) return false;
  return true;
}

function canSpeakSelection(payload) {
  const text = normalizeSelectionDisplayText(payload && (payload.exactSelected || payload.selected));
  if (!text) return false;
  if (!canListenCurrentChapter()) return false;
  if (text.length > 3000) return false;
  return true;
}

function currentBookCoverForTts() {
  const cover = String(
    (state.book && (state.book.cover_url || state.book.cover || state.book.image_url || state.book.image))
    || "",
  ).trim();
  if (cover) return cover;
  return createTtsFallbackArtworkDataUrl(
    (state.book && (state.book.title_display || state.book.title_vi || state.book.title)) || "Nghe truyện",
  );
}

function getTtsProviderLabel(providerId = getTtsProviderId()) {
  if (isTtsBrowserProvider(providerId)) return state.shell.t("ttsProviderBrowser");
  const plugin = (state.tts.plugins || []).find((item) => String((item && item.plugin_id) || "").trim() === String(providerId || "").trim());
  return String((plugin && (plugin.name || plugin.plugin_id)) || providerId || "").trim() || state.shell.t("ttsProviderUnknown");
}

function getTtsProviderPlugin(providerId = getTtsProviderId()) {
  if (isTtsBrowserProvider(providerId)) return null;
  return (state.tts.plugins || []).find((item) => String((item && item.plugin_id) || "").trim() === String(providerId || "").trim()) || null;
}

function getEffectiveTtsMaxChars(providerId = getTtsProviderId()) {
  const requested = Math.max(80, Number(state.tts.settings && state.tts.settings.maxChars) || TTS_DEFAULT_SETTINGS.maxChars || 260);
  const plugin = getTtsProviderPlugin(providerId);
  const pluginLimit = Number.parseInt(String(plugin && plugin.config && plugin.config.max_length || ""), 10);
  if (!Number.isFinite(pluginLimit) || pluginLimit <= 0) return requested;
  // Chừa headroom vì một số provider fail ngay sát ngưỡng công bố.
  const safePluginLimit = Math.max(80, pluginLimit - Math.max(8, Math.round(pluginLimit * 0.1)));
  return Math.min(requested, safePluginLimit);
}

function formatTtsSleepRemaining(ms) {
  const totalSeconds = Math.max(0, Math.ceil((Number(ms) || 0) / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function remainingTtsSleepMs() {
  if (!(state.tts.sleepDeadlineAt > 0)) return 0;
  return Math.max(0, state.tts.sleepDeadlineAt - Date.now());
}

function currentTtsSleepVolumeFactor() {
  const remaining = remainingTtsSleepMs();
  if (!(remaining > 0)) return 1;
  const fadeWindowMs = 15000;
  if (remaining >= fadeWindowMs) return 1;
  return Math.max(0.08, Math.min(1, remaining / fadeWindowMs));
}

function applyTtsLiveOutputVolume() {
  state.tts.sleepVolumeFactor = currentTtsSleepVolumeFactor();
  if (state.tts.audio) {
    try {
      state.tts.audio.volume = Math.max(0, Math.min(1, (Number(state.tts.settings.volume) || 1) * state.tts.sleepVolumeFactor));
    } catch {
      // ignore
    }
  }
}

function clearTtsSleepTickTimer() {
  if (!state.tts.sleepTickTimer) return;
  window.clearTimeout(state.tts.sleepTickTimer);
  state.tts.sleepTickTimer = 0;
}

function clearTtsSleepTimer({ quiet = false } = {}) {
  clearTtsSleepTickTimer();
  state.tts.sleepDeadlineAt = 0;
  state.tts.sleepVolumeFactor = 1;
  applyTtsLiveOutputVolume();
  if (!quiet) {
    state.tts.statusSub = "";
  }
  renderTtsDialogState();
}

function updateTtsSleepRuntime() {
  clearTtsSleepTickTimer();
  if (!(state.tts.sleepDeadlineAt > 0)) {
    state.tts.sleepVolumeFactor = 1;
    renderTtsDialogState();
    return;
  }
  const remaining = remainingTtsSleepMs();
  state.tts.sleepVolumeFactor = currentTtsSleepVolumeFactor();
  applyTtsLiveOutputVolume();
  if (remaining <= 0) {
    clearTtsSleepTickTimer();
    state.tts.sleepDeadlineAt = 0;
    if (state.tts.playing || state.tts.paused) {
      stopTtsPlayback({ keepDialogOpen: true, preserveStatus: false });
      state.tts.statusMessage = state.shell.t("ttsStatusStopped");
      state.tts.statusSub = state.shell.t("ttsSleepStatusExpired");
    }
    renderTtsDialogState();
    return;
  }
  state.tts.sleepTickTimer = window.setTimeout(updateTtsSleepRuntime, 500);
  renderTtsDialogState();
}

function startTtsSleepTimer({ quiet = false, restart = false } = {}) {
  const minutes = currentTtsSleepMinutes();
  if (!(minutes > 0)) {
    clearTtsSleepTimer({ quiet: true });
    return false;
  }
  if (!restart && state.tts.sleepDeadlineAt > Date.now()) {
    updateTtsSleepRuntime();
    return true;
  }
  state.tts.sleepDeadlineAt = Date.now() + (minutes * 60 * 1000);
  state.tts.sleepVolumeFactor = 1;
  if (!quiet) {
    state.tts.statusSub = state.shell.t("ttsSleepStatusActive", { time: formatTtsSleepRemaining(minutes * 60 * 1000) });
  }
  updateTtsSleepRuntime();
  return true;
}

function clearTtsDelayTimer() {
  if (!state.tts.delayTimer) return;
  window.clearTimeout(state.tts.delayTimer);
  state.tts.delayTimer = 0;
}

function revokeTtsCachedAudio() {
  for (const value of state.tts.audioCache.values()) {
    const url = String((value && value.url) || "").trim();
    if (!url) continue;
    try {
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
  }
  state.tts.audioCache.clear();
}

function abortTtsInflight() {
  for (const item of state.tts.inflight.values()) {
    const controller = item && item.controller;
    if (!controller) continue;
    try {
      controller.abort();
    } catch {
      // ignore
    }
  }
  state.tts.inflight.clear();
}

function clearTtsHighlight() {
  if (!refs.readerContentBody) return;
  for (const node of refs.readerContentBody.querySelectorAll(".tts-active-paragraph")) {
    node.classList.remove("tts-active-paragraph");
  }
}

function paragraphNodesForTts() {
  if (!refs.readerContentBody) return [];
  return Array.from(refs.readerContentBody.querySelectorAll(":scope > p"));
}

function readParagraphNodeTextForTts(node) {
  if (!node) return "";
  if (node.nodeType === Node.TEXT_NODE) {
    return String(node.nodeValue || "");
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return "";
  const tag = node.tagName ? node.tagName.toLowerCase() : "";
  if (tag === "br") return "\n";
  let text = "";
  for (const child of node.childNodes || []) {
    text += readParagraphNodeTextForTts(child);
  }
  return text;
}

function currentRenderedTtsParagraphs() {
  const nodes = paragraphNodesForTts();
  if (!nodes.length) return [];
  return nodes
    .map((node) => normalizeParagraphDisplayText(readParagraphNodeTextForTts(node)))
    .filter(Boolean);
}

function highlightTtsParagraph(paragraphIndex) {
  clearTtsHighlight();
  if (!Number.isFinite(paragraphIndex) || paragraphIndex < 0) return;
  const nodes = paragraphNodesForTts();
  const target = nodes[paragraphIndex];
  if (!target) return;
  target.classList.add("tts-active-paragraph");
  if (!state.tts.settings.autoScroll) return;
  try {
    target.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });
  } catch {
    // ignore
  }
}

function updateTtsMediaSession(segment) {
  if (!("mediaSession" in navigator) || !navigator.mediaSession) return;
  try {
    const title = normalizeDisplayTitle(
      (state.book && (state.book.title_display || state.book.title_vi || state.book.title)) || state.shell.t("ttsDefaultTitle"),
    ) || state.shell.t("ttsDefaultTitle");
    const artist = `${state.shell.t("ttsMediaArtistPrefix")}: ${getTtsProviderLabel()}`;
    const album = String((segment && segment.text) || "").trim().slice(0, 96);
    navigator.mediaSession.metadata = new MediaMetadata({
      title,
      artist,
      album,
      artwork: [
        {
          src: currentBookCoverForTts(),
          sizes: "512x512",
          type: currentBookCoverForTts().startsWith("data:image/svg+xml") ? "image/svg+xml" : "image/png",
        },
      ],
    });
    navigator.mediaSession.playbackState = state.tts.playing && !state.tts.paused ? "playing" : "paused";
  } catch {
    // ignore
  }
}

function clearTtsMediaSession() {
  if (!("mediaSession" in navigator) || !navigator.mediaSession) return;
  try {
    navigator.mediaSession.playbackState = "paused";
    navigator.mediaSession.metadata = null;
  } catch {
    // ignore
  }
}

function bindTtsMediaSessionActions() {
  if (!("mediaSession" in navigator) || !navigator.mediaSession) return;
  const safeBind = (action, handler) => {
    try {
      navigator.mediaSession.setActionHandler(action, handler);
    } catch {
      // ignore unsupported action
    }
  };
  safeBind("play", () => {
    pauseOrResumeTtsPlayback().catch(() => {});
  });
  safeBind("pause", () => {
    pauseOrResumeTtsPlayback().catch(() => {});
  });
  safeBind("stop", () => {
    stopTtsPlayback({ keepDialogOpen: true, preserveStatus: false });
  });
  safeBind("previoustrack", () => {
    seekTtsSegment(-1).catch(() => {});
  });
  safeBind("nexttrack", () => {
    seekTtsSegment(1).catch(() => {});
  });
}

function ensureTtsAudioElement() {
  if (state.tts.audio) return state.tts.audio;
  const audio = new Audio();
  audio.preload = "auto";
  audio.crossOrigin = "anonymous";
  audio.addEventListener("play", () => {
    state.tts.playing = true;
    state.tts.paused = false;
    renderTtsDialogState();
  });
  audio.addEventListener("pause", () => {
    if (!state.tts.playing) return;
    state.tts.paused = true;
    renderTtsDialogState();
  });
  audio.addEventListener("ended", () => {
    const sessionId = Number.parseInt(audio.dataset.sessionId || "", 10);
    if (!Number.isFinite(sessionId) || sessionId !== state.tts.requestId) return;
    if (!state.tts.playing) return;
    const nextIndex = state.tts.segmentIndex + 1;
    if (nextIndex < state.tts.segments.length) {
      clearTtsDelayTimer();
      state.tts.delayTimer = window.setTimeout(() => {
        playTtsSegment(nextIndex, sessionId).catch((error) => {
          state.shell.showToast(getErrorMessage(error));
        });
      }, Math.max(0, Number(state.tts.settings.segmentDelayMs) || 0));
      return;
    }
    handleTtsChapterFinished(sessionId).catch((error) => {
      state.shell.showToast(getErrorMessage(error));
    });
  });
  audio.addEventListener("error", () => {
    if (!state.tts.playing) return;
    const sessionId = Number.parseInt(audio.dataset.sessionId || "", 10);
    if (!Number.isFinite(sessionId) || sessionId !== state.tts.requestId) return;
    stopTtsPlayback({ keepDialogOpen: true, preserveStatus: true });
    state.tts.statusMessage = state.shell.t("ttsStatusError");
    state.tts.statusSub = state.shell.t("ttsAudioError");
    renderTtsDialogState();
  });
  state.tts.audio = audio;
  return audio;
}

function renderTtsDialogState() {
  ensureTtsSettings();
  if (refs.ttsStatusText) refs.ttsStatusText.textContent = state.tts.statusMessage || state.shell.t("ttsStatusIdle");
  if (refs.ttsStatusSub) refs.ttsStatusSub.textContent = state.tts.statusSub || state.shell.t("ttsStatusIdleHint");
  if (refs.ttsProgressText) refs.ttsProgressText.textContent = state.tts.progressText || state.shell.t("ttsProgressEmpty");

  const providerId = getTtsProviderId();
  if (refs.ttsProviderSelect) {
    const current = String(refs.ttsProviderSelect.value || "").trim();
    refs.ttsProviderSelect.innerHTML = "";
    const browserOpt = document.createElement("option");
    browserOpt.value = "browser";
    browserOpt.textContent = state.shell.t("ttsProviderBrowser");
    refs.ttsProviderSelect.appendChild(browserOpt);
    for (const plugin of state.tts.plugins || []) {
      const opt = document.createElement("option");
      opt.value = String(plugin.plugin_id || "");
      opt.textContent = String(plugin.name || plugin.plugin_id || "");
      refs.ttsProviderSelect.appendChild(opt);
    }
    refs.ttsProviderSelect.value = providerId || current || "browser";
  }

  const activeVoices = isTtsBrowserProvider(providerId)
    ? (state.tts.browserVoices || [])
    : (state.tts.voicesByProvider.get(providerId) || []);
  state.tts.activeVoiceItems = activeVoices;
  if (refs.ttsVoiceSelect) {
    const selectedVoiceId = currentSelectedTtsVoiceId(providerId);
    refs.ttsVoiceSelect.innerHTML = "";
    if (!activeVoices.length) {
      const empty = document.createElement("option");
      empty.value = "";
      empty.textContent = state.tts.loadingVoices
        ? state.shell.t("ttsVoiceLoading")
        : state.shell.t("ttsVoiceEmpty");
      refs.ttsVoiceSelect.appendChild(empty);
    } else {
      for (const voice of activeVoices) {
        const opt = document.createElement("option");
        opt.value = String(voice.id || "");
        const lang = String(voice.language || "").trim();
        opt.textContent = lang ? `${voice.name} · ${lang}` : voice.name;
        refs.ttsVoiceSelect.appendChild(opt);
      }
      refs.ttsVoiceSelect.value = selectedVoiceId || String((activeVoices[0] && activeVoices[0].id) || "");
    }
    refs.ttsVoiceSelect.disabled = !activeVoices.length;
  }

  if (refs.ttsRateInput) refs.ttsRateInput.value = String(state.tts.settings.rate);
  if (refs.ttsRateValue) refs.ttsRateValue.textContent = Number(state.tts.settings.rate || 1).toFixed(2);
  if (refs.ttsPitchInput) refs.ttsPitchInput.value = String(state.tts.settings.pitch);
  if (refs.ttsPitchValue) refs.ttsPitchValue.textContent = Number(state.tts.settings.pitch || 1).toFixed(2);
  if (refs.ttsVolumeInput) refs.ttsVolumeInput.value = String(state.tts.settings.volume);
  if (refs.ttsVolumeValue) refs.ttsVolumeValue.textContent = Number(state.tts.settings.volume || 1).toFixed(2);
  if (refs.ttsMaxCharsInput) refs.ttsMaxCharsInput.value = String(state.tts.settings.maxChars);
  if (refs.ttsSegmentDelayInput) refs.ttsSegmentDelayInput.value = String(state.tts.settings.segmentDelayMs);
  if (refs.ttsPrefetchCountInput) refs.ttsPrefetchCountInput.value = String(state.tts.settings.prefetchCount);
  if (refs.ttsRemoteTimeoutInput) refs.ttsRemoteTimeoutInput.value = String(state.tts.settings.remoteTimeoutMs);
  if (refs.ttsRemoteRetriesInput) refs.ttsRemoteRetriesInput.value = String(state.tts.settings.remoteRetries);
  if (refs.ttsRemoteGapInput) refs.ttsRemoteGapInput.value = String(state.tts.settings.remoteMinGapMs);
  if (refs.ttsPrefetchEnabledInput) refs.ttsPrefetchEnabledInput.checked = Boolean(state.tts.settings.prefetchEnabled);
  if (refs.ttsIncludeTitleInput) refs.ttsIncludeTitleInput.checked = Boolean(state.tts.settings.includeTitle);
  if (refs.ttsAutoScrollInput) refs.ttsAutoScrollInput.checked = Boolean(state.tts.settings.autoScroll);
  if (refs.ttsAutoNextInput) refs.ttsAutoNextInput.checked = Boolean(state.tts.settings.autoNext);
  if (refs.ttsAutoStartNextInput) refs.ttsAutoStartNextInput.checked = Boolean(state.tts.settings.autoStartOnNextChapter);
  if (refs.ttsReplaceEnabledInput) refs.ttsReplaceEnabledInput.checked = Boolean(state.tts.settings.replaceEnabled);
  if (refs.ttsReplaceRulesInput) refs.ttsReplaceRulesInput.value = String(state.tts.settings.replaceRulesText || "");
  if (refs.ttsReplaceRulesInput) refs.ttsReplaceRulesInput.disabled = !state.tts.settings.replaceEnabled;
  if (refs.ttsPitchInput) refs.ttsPitchInput.disabled = !isTtsBrowserProvider(providerId);
  if (refs.ttsReplaceRulesHint) {
    const count = parseTtsReplaceRules(state.tts.settings.replaceRulesText || "").length;
    refs.ttsReplaceRulesHint.textContent = state.shell.t("ttsReplaceRulesHint", { count });
  }
  if (refs.ttsSleepPresetSelect) {
    const keep = String(refs.ttsSleepPresetSelect.value || "").trim();
    refs.ttsSleepPresetSelect.innerHTML = "";
    for (const item of TTS_SLEEP_PRESETS) {
      const opt = document.createElement("option");
      opt.value = item.value;
      if (item.value === "off") opt.textContent = state.shell.t("ttsSleepOff");
      else if (item.value === "custom") opt.textContent = state.shell.t("ttsSleepPresetCustom");
      else opt.textContent = state.shell.t("ttsSleepPresetMinutes", { minutes: item.minutes });
      refs.ttsSleepPresetSelect.appendChild(opt);
    }
    refs.ttsSleepPresetSelect.value = String(state.tts.settings.sleepPreset || keep || "off");
  }
  if (refs.ttsSleepCustomWrap) refs.ttsSleepCustomWrap.classList.toggle("hidden", String(state.tts.settings.sleepPreset || "off") !== "custom");
  if (refs.ttsSleepCustomInput) refs.ttsSleepCustomInput.value = String(state.tts.settings.sleepCustomMinutes || 90);
  if (refs.ttsSleepStatus) {
    if (state.tts.sleepDeadlineAt > Date.now()) {
      refs.ttsSleepStatus.textContent = state.shell.t("ttsSleepStatusActive", { time: formatTtsSleepRemaining(remainingTtsSleepMs()) });
    } else {
      refs.ttsSleepStatus.textContent = state.shell.t("ttsSleepStatusNone");
    }
  }
  if (refs.btnTtsTogglePlay) {
    refs.btnTtsTogglePlay.textContent = state.tts.playing && !state.tts.paused
      ? state.shell.t("ttsPause")
      : state.shell.t("ttsResume");
    refs.btnTtsTogglePlay.disabled = !state.tts.segments.length;
  }
  if (refs.btnTtsPlayChapter) {
    refs.btnTtsPlayChapter.textContent = state.tts.playFromSelectionNext
      ? state.shell.t("ttsPlayFromSelection")
      : state.shell.t("ttsPlayFromStart");
    refs.btnTtsPlayChapter.classList.toggle("hidden", Boolean(state.tts.playing || state.tts.paused));
  }
  if (refs.btnTtsStop) refs.btnTtsStop.disabled = !state.tts.playing && !state.tts.paused;
  if (refs.btnTtsPrevSegment) refs.btnTtsPrevSegment.disabled = !(state.tts.segmentIndex > 0);
  if (refs.btnTtsNextSegment) refs.btnTtsNextSegment.disabled = !(state.tts.segmentIndex >= 0 && state.tts.segmentIndex < (state.tts.segments.length - 1));
  if (refs.btnTtsClearSleep) refs.btnTtsClearSleep.disabled = !(state.tts.sleepDeadlineAt > 0);
}

function currentSelectedTtsVoiceId(providerId = getTtsProviderId()) {
  const settings = ensureTtsSettings();
  if (isTtsBrowserProvider(providerId)) return String(settings.voiceURI || "").trim();
  const table = (settings.providerVoiceIds && typeof settings.providerVoiceIds === "object") ? settings.providerVoiceIds : {};
  return String(table[providerId] || "").trim();
}

function rememberTtsVoiceSelection(providerId, voiceId) {
  const provider = String(providerId || "").trim() || "browser";
  const nextVoiceId = String(voiceId || "").trim();
  if (isTtsBrowserProvider(provider)) {
    state.tts.settings.voiceURI = nextVoiceId;
  } else {
    const table = (state.tts.settings.providerVoiceIds && typeof state.tts.settings.providerVoiceIds === "object")
      ? { ...state.tts.settings.providerVoiceIds }
      : {};
    if (nextVoiceId) table[provider] = nextVoiceId;
    else delete table[provider];
    state.tts.settings.providerVoiceIds = table;
  }
  saveTtsSettingsState();
}

function normalizeBrowserVoiceItems(voices) {
  return (Array.isArray(voices) ? voices : []).map((voice) => ({
    id: String(voice.voiceURI || voice.name || "").trim(),
    name: String(voice.name || voice.voiceURI || "").trim() || state.shell.t("ttsVoiceUnknown"),
    language: String(voice.lang || "").trim(),
  })).filter((voice) => voice.id);
}

function refreshBrowserVoices() {
  if (!window.speechSynthesis || typeof window.speechSynthesis.getVoices !== "function") {
    state.tts.browserVoices = [];
    state.tts.browserVoicesLoaded = true;
    renderTtsDialogState();
    return;
  }
  const voices = window.speechSynthesis.getVoices() || [];
  state.tts.browserVoices = normalizeBrowserVoiceItems(voices);
  state.tts.browserVoicesLoaded = true;
  const currentId = currentSelectedTtsVoiceId("browser");
  if (!currentId && state.tts.browserVoices.length) {
    rememberTtsVoiceSelection("browser", state.tts.browserVoices[0].id);
  } else {
    renderTtsDialogState();
  }
}

async function loadTtsPlugins() {
  try {
    const data = await state.shell.api("/api/tts/plugins");
    state.tts.plugins = Array.isArray(data && data.items) ? data.items : [];
  } catch {
    state.tts.plugins = [];
  }
  const providerId = getTtsProviderId();
  if (!isTtsBrowserProvider(providerId)) {
    const exists = state.tts.plugins.some((item) => String((item && item.plugin_id) || "").trim() === providerId);
    if (!exists) {
      state.tts.settings.provider = "browser";
      saveTtsSettingsState();
    }
  }
  renderTtsDialogState();
}

async function ensureTtsProviderVoices(providerId = getTtsProviderId()) {
  const provider = String(providerId || "").trim() || "browser";
  if (isTtsBrowserProvider(provider)) {
    refreshBrowserVoices();
    return state.tts.browserVoices;
  }
  if (state.tts.voicesByProvider.has(provider)) {
    return state.tts.voicesByProvider.get(provider) || [];
  }
  state.tts.loadingVoices = true;
  renderTtsDialogState();
  try {
    const data = await state.shell.api("/api/tts/voices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plugin_id: provider }),
    });
    const items = Array.isArray(data && data.items) ? data.items : [];
    state.tts.voicesByProvider.set(provider, items);
    const currentId = currentSelectedTtsVoiceId(provider);
    if (!currentId && items.length) {
      rememberTtsVoiceSelection(provider, String(items[0].id || ""));
    } else {
      renderTtsDialogState();
    }
    return items;
  } finally {
    state.tts.loadingVoices = false;
    renderTtsDialogState();
  }
}

function base64ToBlobUrl(base64Data, mimeType = "audio/mpeg") {
  const raw = atob(String(base64Data || ""));
  const bytes = new Uint8Array(raw.length);
  for (let index = 0; index < raw.length; index += 1) {
    bytes[index] = raw.charCodeAt(index);
  }
  const blob = new Blob([bytes], { type: String(mimeType || "audio/mpeg") || "audio/mpeg" });
  return URL.createObjectURL(blob);
}

function clearTtsPlaybackState() {
  clearTtsDelayTimer();
  abortTtsInflight();
  if (state.tts.browserUtterance && window.speechSynthesis) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }
  state.tts.browserUtterance = null;
  if (state.tts.audio) {
    try {
      state.tts.audio.pause();
    } catch {
      // ignore
    }
    try {
      state.tts.audio.removeAttribute("src");
      state.tts.audio.load();
    } catch {
      // ignore
    }
  }
  revokeTtsCachedAudio();
  clearTtsHighlight();
  state.tts.segments = [];
  state.tts.segmentIndex = -1;
  state.tts.playing = false;
  state.tts.paused = false;
  state.tts.waiting = false;
  state.tts.chapterId = "";
  state.tts.providerLabel = "";
  state.tts.progressText = "";
  state.tts.autoAdvancing = false;
  clearTtsMediaSession();
}

function stopTtsPlayback({ keepDialogOpen = true, preserveStatus = false } = {}) {
  state.tts.requestId += 1;
  const preservedStatus = preserveStatus ? state.tts.statusMessage : "";
  const preservedSub = preserveStatus ? state.tts.statusSub : "";
  clearTtsPlaybackState();
  if (!preserveStatus) {
    state.tts.statusMessage = state.shell.t("ttsStatusStopped");
    state.tts.statusSub = "";
  } else {
    state.tts.statusMessage = preservedStatus;
    state.tts.statusSub = preservedSub;
  }
  if (!keepDialogOpen && refs.ttsDialog && refs.ttsDialog.open) refs.ttsDialog.close();
  renderTtsDialogState();
}

async function pauseOrResumeTtsPlayback() {
  if (!state.tts.segments.length) return;
  if (isTtsBrowserProvider()) {
    if (!window.speechSynthesis) return;
    if (state.tts.playing && !state.tts.paused) {
      try {
        window.speechSynthesis.pause();
      } catch {
        // ignore
      }
      state.tts.paused = true;
      state.tts.statusMessage = state.shell.t("ttsStatusPaused");
      renderTtsDialogState();
      return;
    }
    if (state.tts.playing && state.tts.paused) {
      try {
        window.speechSynthesis.resume();
      } catch {
        // ignore
      }
      state.tts.paused = false;
      state.tts.statusMessage = state.shell.t("ttsStatusPlaying");
      renderTtsDialogState();
      return;
    }
    await startTtsPlayback({ openDialog: true });
    return;
  }

  const audio = ensureTtsAudioElement();
  if (state.tts.playing && !state.tts.paused) {
    try {
      audio.pause();
    } catch {
      // ignore
    }
    state.tts.paused = true;
    state.tts.statusMessage = state.shell.t("ttsStatusPaused");
    renderTtsDialogState();
    return;
  }
  if (state.tts.playing && state.tts.paused) {
    try {
      applyTtsLiveOutputVolume();
      await audio.play();
      state.tts.paused = false;
      state.tts.statusMessage = state.shell.t("ttsStatusPlaying");
      renderTtsDialogState();
    } catch (error) {
      state.shell.showToast(getErrorMessage(error));
    }
    return;
  }
  await startTtsPlayback({ openDialog: true });
}

function currentTtsChapterTitle() {
  const row = findChapterAt(findChapterIndex());
  return chapterTitle(row) || state.shell.t("ttsDefaultTitle");
}

function currentSelectionParagraphInfo() {
  if (state.tts.playFromSelectionNext) {
    return {
      paragraphIndex: Math.max(0, Number(state.tts.playFromSelectionNext.paragraphIndex) || 0),
      paragraphOffset: Math.max(0, Number(state.tts.playFromSelectionNext.paragraphOffset) || 0),
    };
  }
  const source = refs.selectionActionMenu || refs.selectionSpeakBtn;
  if (!source || !source.dataset) return { paragraphIndex: 0, paragraphOffset: 0 };
  const paragraphIndex = Number.parseInt(source.dataset.startParagraphIndex || "", 10);
  const paragraphOffset = Number.parseInt(source.dataset.startParagraphOffset || "", 10);
  return {
    paragraphIndex: Number.isFinite(paragraphIndex) ? paragraphIndex : 0,
    paragraphOffset: Number.isFinite(paragraphOffset) ? paragraphOffset : 0,
  };
}

function buildCurrentTtsSegments({ fromSelection = false } = {}) {
  const selectionInfo = fromSelection ? currentSelectionParagraphInfo() : { paragraphIndex: 0, paragraphOffset: 0 };
  const renderedParagraphs = currentRenderedTtsParagraphs();
  const useRenderedParagraphs = renderedParagraphs.length > 0 && (fromSelection || runtimeReadingMode() !== "flip");
  return buildTtsSegments({
    chapterTitle: currentTtsChapterTitle(),
    content: state.chapterText || "",
    paragraphs: useRenderedParagraphs ? renderedParagraphs : null,
    includeTitle: !fromSelection && Boolean(state.tts.settings.includeTitle),
    maxChars: getEffectiveTtsMaxChars(),
    startParagraphIndex: selectionInfo.paragraphIndex,
    startParagraphOffset: selectionInfo.paragraphOffset,
    replaceEnabled: state.tts.settings.replaceEnabled,
    replaceRulesText: state.tts.settings.replaceRulesText,
  });
}

async function waitTtsRemoteGap() {
  const minGap = Math.max(0, Number(state.tts.settings.remoteMinGapMs) || 0);
  const now = Date.now();
  const waitMs = Math.max(0, (state.tts.lastRemoteRequestAt + minGap) - now);
  if (waitMs > 0) {
    await new Promise((resolve) => window.setTimeout(resolve, waitMs));
  }
  state.tts.lastRemoteRequestAt = Date.now();
}

async function fetchTtsRemoteSegmentAudio(index, sessionId) {
  const cached = state.tts.audioCache.get(index);
  if (cached) return cached;
  const existing = state.tts.inflight.get(index);
  if (existing) return existing.promise;
  const segment = state.tts.segments[index];
  if (!segment || !segment.text) {
    throw new Error(state.shell.t("ttsSegmentEmpty"));
  }
  const controller = new AbortController();
  const timeoutMs = Math.max(3000, Number(state.tts.settings.remoteTimeoutMs) || 20000);
  const timer = window.setTimeout(() => {
    try {
      controller.abort();
    } catch {
      // ignore
    }
  }, timeoutMs);
  const promise = (async () => {
    const providerId = getTtsProviderId();
    const voiceId = currentSelectedTtsVoiceId(providerId);
    const retries = Math.max(0, Number(state.tts.settings.remoteRetries) || 0);
    const outgoingText = normalizeTtsSpeechText(segment.text, { singleLine: true });
    let lastError = null;
    for (let attempt = 0; attempt <= retries; attempt += 1) {
      if (sessionId !== state.tts.requestId) {
        throw new DOMException("Playback aborted", "AbortError");
      }
      try {
        await waitTtsRemoteGap();
        const payload = await state.shell.api("/api/tts/synthesize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            plugin_id: providerId,
            voice_id: voiceId,
            text: outgoingText,
          }),
          signal: controller.signal,
        });
        const url = base64ToBlobUrl(payload.audio_base64, payload.mime_type || "audio/mpeg");
        const item = {
          url,
          mimeType: String(payload.mime_type || "audio/mpeg"),
          providerLabel: getTtsProviderLabel(providerId),
        };
        state.tts.audioCache.set(index, item);
        return item;
      } catch (error) {
        lastError = error;
        if (isAbortError(error) || attempt >= retries) break;
      }
    }
    throw lastError || new Error(state.shell.t("ttsStatusError"));
  })().finally(() => {
    window.clearTimeout(timer);
    const current = state.tts.inflight.get(index);
    if (current && current.promise === promise) {
      state.tts.inflight.delete(index);
    }
  });
  state.tts.inflight.set(index, { controller, promise });
  return promise;
}

function prefetchTtsSegments(sessionId, fromIndex) {
  if (!state.tts.settings.prefetchEnabled) return;
  if (isTtsBrowserProvider()) return;
  const count = Math.max(0, Number(state.tts.settings.prefetchCount) || 0);
  for (let offset = 1; offset <= count; offset += 1) {
    const nextIndex = fromIndex + offset;
    if (nextIndex >= state.tts.segments.length) break;
    fetchTtsRemoteSegmentAudio(nextIndex, sessionId).catch(() => {});
  }
}

async function playTtsBrowserSegment(index, sessionId) {
  if (!window.speechSynthesis) {
    throw new Error(state.shell.t("ttsBrowserUnsupported"));
  }
  const segment = state.tts.segments[index];
  if (!segment || !segment.text) {
    throw new Error(state.shell.t("ttsSegmentEmpty"));
  }
  try {
    window.speechSynthesis.cancel();
  } catch {
    // ignore
  }
  const utterance = new SpeechSynthesisUtterance(normalizeTtsSpeechText(segment.text, { singleLine: true }));
  state.tts.browserUtterance = utterance;
  const voices = window.speechSynthesis.getVoices ? window.speechSynthesis.getVoices() : [];
  const voiceId = currentSelectedTtsVoiceId("browser");
  const voice = voices.find((item) => String(item.voiceURI || "") === voiceId)
    || voices.find((item) => /^vi\b/i.test(String(item.lang || "")))
    || voices[0];
  if (voice) utterance.voice = voice;
  utterance.lang = String((voice && voice.lang) || "vi-VN").trim() || "vi-VN";
  utterance.rate = Number(state.tts.settings.rate) || 1;
  utterance.pitch = Number(state.tts.settings.pitch) || 1;
  utterance.volume = Math.max(0, Math.min(1, (Number(state.tts.settings.volume) || 1) * currentTtsSleepVolumeFactor()));
  utterance.onend = () => {
    if (sessionId !== state.tts.requestId) return;
    const nextIndex = index + 1;
    if (nextIndex < state.tts.segments.length) {
      clearTtsDelayTimer();
      state.tts.delayTimer = window.setTimeout(() => {
        playTtsSegment(nextIndex, sessionId).catch((error) => {
          state.shell.showToast(getErrorMessage(error));
        });
      }, Math.max(0, Number(state.tts.settings.segmentDelayMs) || 0));
      return;
    }
    handleTtsChapterFinished(sessionId).catch((error) => {
      state.shell.showToast(getErrorMessage(error));
    });
  };
  utterance.onerror = (event) => {
    if (sessionId !== state.tts.requestId) return;
    stopTtsPlayback({ keepDialogOpen: true, preserveStatus: true });
    state.tts.statusMessage = state.shell.t("ttsStatusError");
    state.tts.statusSub = String((event && event.error) || "").trim() || state.shell.t("ttsBrowserUnsupported");
    renderTtsDialogState();
  };
  window.speechSynthesis.speak(utterance);
}

async function playTtsRemoteSegment(index, sessionId) {
  const segment = state.tts.segments[index];
  if (!segment || !segment.text) {
    throw new Error(state.shell.t("ttsSegmentEmpty"));
  }
  const item = await fetchTtsRemoteSegmentAudio(index, sessionId);
  if (sessionId !== state.tts.requestId) return;
  const audio = ensureTtsAudioElement();
  audio.dataset.sessionId = String(sessionId);
  audio.playbackRate = Number(state.tts.settings.rate) || 1;
  audio.volume = Math.max(0, Math.min(1, (Number(state.tts.settings.volume) || 1) * currentTtsSleepVolumeFactor()));
  audio.src = item.url;
  await audio.play();
  prefetchTtsSegments(sessionId, index);
}

async function playTtsSegment(index, sessionId = state.tts.requestId) {
  if (sessionId !== state.tts.requestId) return;
  const segment = state.tts.segments[index];
  if (!segment || !segment.text) {
    throw new Error(state.shell.t("ttsSegmentEmpty"));
  }
  state.tts.segmentIndex = index;
  state.tts.chapterId = state.chapterId;
  state.tts.playing = true;
  state.tts.paused = false;
  state.tts.waiting = false;
  state.tts.providerLabel = getTtsProviderLabel();
  state.tts.statusMessage = state.shell.t("ttsStatusPlaying");
  state.tts.statusSub = segment.text.slice(0, 120);
  state.tts.progressText = state.shell.t("ttsProgressSegments", {
    current: index + 1,
    total: state.tts.segments.length,
  });
  highlightTtsParagraph(segment.paragraphIndex);
  updateTtsMediaSession(segment);
  renderTtsDialogState();
  if (isTtsBrowserProvider()) {
    await playTtsBrowserSegment(index, sessionId);
    return;
  }
  await playTtsRemoteSegment(index, sessionId);
}

async function handleTtsChapterFinished(sessionId) {
  if (sessionId !== state.tts.requestId) return;
  clearTtsDelayTimer();
  state.tts.playing = false;
  state.tts.paused = false;
  state.tts.progressText = state.shell.t("ttsProgressDone");
  state.tts.statusMessage = state.shell.t("ttsStatusFinished");
  state.tts.statusSub = "";
  renderTtsDialogState();
  if (!state.tts.settings.autoNext || !hasChapterByStep(1)) {
    clearTtsMediaSession();
    clearTtsHighlight();
    return;
  }
  state.tts.autoAdvancing = true;
  state.tts.statusMessage = state.shell.t("ttsStatusAutoNext");
  renderTtsDialogState();
  try {
    await goChapter(1);
    if (!state.tts.settings.autoStartOnNextChapter) {
      state.tts.autoAdvancing = false;
      state.tts.statusMessage = state.shell.t("ttsStatusReadyNextChapter");
      state.tts.progressText = state.shell.t("ttsProgressEmpty");
      renderTtsDialogState();
      return;
    }
    await startTtsPlayback({ openDialog: true, fromSelection: false });
  } finally {
    state.tts.autoAdvancing = false;
  }
}

async function startTtsPlayback({ openDialog = true, fromSelection = false } = {}) {
  ensureTtsSettings();
  if (!canListenCurrentChapter()) {
    throw new Error(state.shell.t("ttsNoTextChapter"));
  }
  if (!state.chapterText || !String(state.chapterText || "").trim()) {
    throw new Error(state.shell.t("ttsNoTextChapter"));
  }
  if (openDialog && refs.ttsDialog && !refs.ttsDialog.open) {
    refs.ttsDialog.showModal();
  }
  const providerId = getTtsProviderId();
  if (isTtsBrowserProvider(providerId)) {
    refreshBrowserVoices();
  } else {
    await ensureTtsProviderVoices(providerId);
  }
  const built = buildCurrentTtsSegments({ fromSelection });
  state.tts.playFromSelectionNext = null;
  if (!built.segments.length) {
    throw new Error(state.shell.t("ttsSegmentEmpty"));
  }
  stopTtsPlayback({ keepDialogOpen: true, preserveStatus: false });
  const sessionId = state.tts.requestId;
  state.tts.segments = built.segments;
  state.tts.paragraphCount = built.paragraphs.length;
  state.tts.statusMessage = state.shell.t("ttsStatusPreparing");
  state.tts.statusSub = getTtsProviderLabel(providerId);
  state.tts.progressText = state.shell.t("ttsProgressSegments", {
    current: 0,
    total: built.segments.length,
  });
  if (!(state.tts.sleepDeadlineAt > Date.now()) && currentTtsSleepMinutes() > 0) {
    startTtsSleepTimer({ quiet: true, restart: true });
  } else if (state.tts.sleepDeadlineAt > 0) {
    updateTtsSleepRuntime();
  }
  renderTtsDialogState();
  await playTtsSegment(0, sessionId);
}

async function openTtsDialog({ autoStart = false, fromSelection = false } = {}) {
  ensureTtsSettings();
  if (refs.ttsDialog && !refs.ttsDialog.open) {
    refs.ttsDialog.showModal();
  }
  renderTtsDialogState();
  await loadTtsPlugins();
  if (isTtsBrowserProvider()) refreshBrowserVoices();
  else await ensureTtsProviderVoices(getTtsProviderId());
  if (autoStart) {
    await startTtsPlayback({ openDialog: true, fromSelection });
  }
}

async function seekTtsSegment(direction) {
  if (!state.tts.segments.length) return;
  const nextIndex = Math.max(0, Math.min(state.tts.segments.length - 1, state.tts.segmentIndex + direction));
  if (nextIndex === state.tts.segmentIndex) return;
  const sessionId = state.tts.requestId;
  clearTtsDelayTimer();
  if (isTtsBrowserProvider()) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  } else if (state.tts.audio) {
    try {
      state.tts.audio.pause();
    } catch {
      // ignore
    }
  }
  await playTtsSegment(nextIndex, sessionId);
}

function positionSelectionMenu(rect) {
  const menu = refs.selectionActionMenu;
  if (!menu) return;
  menu.classList.remove("hidden");
  menu.style.visibility = "hidden";
  const menuWidth = Math.max(120, menu.offsetWidth || 0);
  const menuHeight = Math.max(36, menu.offsetHeight || 0);
  let left = rect.left + (rect.width / 2) - (menuWidth / 2);
  left = Math.max(12, Math.min(left, window.innerWidth - menuWidth - 12));
  let top = rect.top - menuHeight - 10;
  if (top < 12) {
    top = Math.min(window.innerHeight - menuHeight - 12, rect.bottom + 10);
  }
  menu.style.left = `${Math.round(left)}px`;
  menu.style.top = `${Math.round(Math.max(12, top))}px`;
  menu.style.visibility = "";
}

async function copySelectionToClipboard(text) {
  const value = String(text || "");
  if (!value) return;
  if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    await navigator.clipboard.writeText(value);
    return;
  }
  const temp = document.createElement("textarea");
  temp.value = value;
  temp.setAttribute("readonly", "readonly");
  temp.style.position = "fixed";
  temp.style.opacity = "0";
  temp.style.pointerEvents = "none";
  document.body.appendChild(temp);
  temp.select();
  document.execCommand("copy");
  temp.remove();
}

function clearSelectedTextRange() {
  const selection = window.getSelection && window.getSelection();
  if (!selection) return;
  try {
    selection.removeAllRanges();
  } catch {
    // ignore
  }
}

async function resolveSelectionSourceForJunk(payload) {
  if (!payload || !payload.selected) return "";
  if (effectiveMode() !== "trans" || !supportsTranslation(state.book) || !state.chapterId) {
    return payload.selected;
  }
  const data = await state.shell.api(`/api/library/chapter/${encodeURIComponent(state.chapterId)}/selection-source`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      selected_text: payload.exactSelected || payload.selected,
      start_offset: payload.start,
      end_offset: payload.end,
      translation_mode: state.translateMode,
      mode: effectiveMode(),
      translated_text: effectiveMode() === "trans" ? state.chapterText : "",
      displayed_trans_sig: state.chapterTransSig || "",
    }),
  });
  return String((data && data.source_candidate) || "").trim() || payload.selected;
}

function resetSelectionNameDialogState() {
  state.selectionNameMapSeq += 1;
  state.pendingSelectionNameRatio = null;
  if (refs.selectionNameForm) refs.selectionNameForm.reset();
  if (refs.selectionNameHint) refs.selectionNameHint.textContent = state.shell.t("selectionNameHint");
  syncSelectionNameDialogActions();
}

function getSelectionNameEntryMeta(source) {
  const sourceKey = normalizeNameSourceKey(source);
  if (!sourceKey) return null;
  const active = state.activeNameSet || Object.keys(state.nameSets || {})[0] || "Mặc định";
  const bookEntries = normalizeNameEntries((state.nameSets && state.nameSets[active]) || {});
  if (Object.prototype.hasOwnProperty.call(bookEntries, sourceKey)) {
    return {
      scope: "book",
      setName: active,
      target: String(bookEntries[sourceKey] || ""),
    };
  }
  const globalEntries = normalizeNameEntries((state.globalDicts && state.globalDicts.name) || {});
  if (Object.prototype.hasOwnProperty.call(globalEntries, sourceKey)) {
    return {
      scope: "global",
      target: String(globalEntries[sourceKey] || ""),
    };
  }
  return null;
}

function syncSelectionNameDialogActions() {
  const source = normalizeNameSourceKey(refs.selectionNameSourceInput && refs.selectionNameSourceInput.value);
  const meta = getSelectionNameEntryMeta(source);
  if (refs.btnConfirmSelectionName) {
    refs.btnConfirmSelectionName.textContent = state.shell.t(
      meta ? "selectionNameUpdate" : "selectionNameConfirm",
    );
  }
  if (refs.btnDeleteSelectionName) {
    refs.btnDeleteSelectionName.textContent = state.shell.t("selectionNameDelete");
    refs.btnDeleteSelectionName.classList.toggle("hidden", !meta);
  }
}

async function saveSelectionNameEntry(source, target) {
  const meta = getSelectionNameEntryMeta(source);
  if (meta && meta.scope === "global") {
    const current = normalizeNameEntries((state.globalDicts && state.globalDicts.name) || {});
    current[source] = target;
    await state.shell.api("/api/local-dicts/global", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: current }),
    });
    return;
  }
  await state.shell.api("/api/name-sets/entry", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      source,
      target,
      set_name: meta && meta.scope === "book" ? meta.setName : undefined,
      book_id: state.bookId,
    }),
  });
}

async function deleteSelectionNameEntry(source) {
  const meta = getSelectionNameEntryMeta(source);
  if (!meta) return;
  if (meta.scope === "global") {
    const current = normalizeNameEntries((state.globalDicts && state.globalDicts.name) || {});
    if (Object.prototype.hasOwnProperty.call(current, source)) {
      delete current[source];
    }
    await state.shell.api("/api/local-dicts/global", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: current }),
    });
    return;
  }
  await state.shell.api("/api/name-sets/entry", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      source,
      target: "",
      delete: true,
      set_name: meta.setName,
      book_id: state.bookId,
    }),
  });
}

async function confirmSelectionNameEntry(event) {
  if (event) event.preventDefault();
  const source = String(refs.selectionNameSourceInput && refs.selectionNameSourceInput.value || "").trim();
  const target = String(refs.selectionNameTargetInput && refs.selectionNameTargetInput.value || "").trim();
  if (!source || !target) {
    state.shell.showToast(state.shell.t("nameSourceTargetRequired"));
    if (!source && refs.selectionNameSourceInput) refs.selectionNameSourceInput.focus();
    else if (refs.selectionNameTargetInput) refs.selectionNameTargetInput.focus();
    return;
  }
  const liveRatio = currentChapterRatio();
  const preserveRatio = Number.isFinite(liveRatio)
    ? liveRatio
    : (Number.isFinite(state.pendingSelectionNameRatio) ? state.pendingSelectionNameRatio : 0);
  state.shell.showStatus(state.shell.t("statusApplyingNameEntry"));
  try {
    await saveSelectionNameEntry(source, target);
    if (refs.selectionNameDialog && refs.selectionNameDialog.open) {
      refs.selectionNameDialog.close();
    } else {
      resetSelectionNameDialogState();
    }
    refreshNameEditorData().catch(() => {});
    queueReaderDictRefresh({ preserveRatio, refreshBook: true });
    state.shell.showToast(state.shell.t("nameEntryApplied"));
  } catch (error) {
    state.shell.showToast(error.message || state.shell.t("toastError"));
  } finally {
    state.shell.hideStatus();
  }
}

async function refreshReaderAfterRawRuleChange({ preserveRatio = currentChapterRatio() } = {}) {
  cancelPrefetch();
  clearChapterCache();
  if (state.chapterId) {
    await loadChapter({
      resetFlip: true,
      preserveRatio,
      preserveLivePosition: true,
      showSkeleton: false,
      quiet: true,
    });
  }
}

async function applySelectionJunkEntry() {
  const payload = currentSelectionPayload(refs.selectionJunkBtn);
  hideSelectionBtn();
  clearSelectedTextRange();
  if (!payload || !payload.selected) return;
  try {
    let sourceText = payload.exactSelected || payload.selected;
    const shouldResolveSource = effectiveMode() === "trans" && supportsTranslation(state.book);
    if (shouldResolveSource) {
      state.shell.showStatus(state.shell.t("statusResolvingSelection"));
      sourceText = await resolveSelectionSourceForJunk(payload);
    }
    if (!sourceText) {
      throw new Error(state.shell.t("junkLineRequired"));
    }
    state.pendingSelectionJunkRatio = currentChapterRatio();
    if (refs.selectionJunkInput) {
      refs.selectionJunkInput.value = sourceText;
    }
    if (refs.selectionJunkDialog) {
      refs.selectionJunkDialog.showModal();
    }
    if (refs.selectionJunkInput) {
      window.setTimeout(() => {
        refs.selectionJunkInput.focus();
        try {
          refs.selectionJunkInput.setSelectionRange(0, refs.selectionJunkInput.value.length);
        } catch {
          // ignore
        }
      }, 10);
    }
  } catch (error) {
    state.shell.showToast(error.message || state.shell.t("toastError"));
  } finally {
    state.shell.hideStatus();
  }
}

function resetSelectionJunkDialogState() {
  state.pendingSelectionJunkRatio = null;
  if (refs.selectionJunkForm) refs.selectionJunkForm.reset();
}

async function confirmSelectionJunkEntry(event) {
  if (event) event.preventDefault();
  const sourceText = String(refs.selectionJunkInput && refs.selectionJunkInput.value || "").trim();
  const useRegex = Boolean(refs.selectionJunkRegexInput && refs.selectionJunkRegexInput.checked);
  if (!sourceText) {
    state.shell.showToast(state.shell.t("junkLineRequired"));
    if (refs.selectionJunkInput) refs.selectionJunkInput.focus();
    return;
  }
  if (!ensureValidRegexOrToast(sourceText, useRegex)) {
    if (refs.selectionJunkInput) refs.selectionJunkInput.focus();
    return;
  }
  const preserveRatio = Number.isFinite(state.pendingSelectionJunkRatio)
    ? state.pendingSelectionJunkRatio
    : currentChapterRatio();
  state.shell.showStatus(state.shell.t("statusApplyingJunkEntry"));
  try {
    await state.shell.api("/api/junk-lines/global/entry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        new_line: sourceText,
        use_regex: useRegex,
        ignore_case: Boolean(refs.selectionJunkIgnoreCaseInput && refs.selectionJunkIgnoreCaseInput.checked),
      }),
    });
    if (refs.selectionJunkDialog && refs.selectionJunkDialog.open) {
      refs.selectionJunkDialog.close();
    } else {
      resetSelectionJunkDialogState();
    }
    clearChapterCache();
    cancelPrefetch();
    await loadBook();
    await loadChapter({ resetFlip: true, preserveRatio });
    state.shell.showToast(state.shell.t("junkEntryApplied"));
  } catch (error) {
    state.shell.showToast(error.message || state.shell.t("toastError"));
  } finally {
    state.shell.hideStatus();
  }
}

function resetSelectionReplaceDialogState() {
  state.pendingSelectionReplaceRatio = null;
  if (refs.selectionReplaceForm) refs.selectionReplaceForm.reset();
}

async function applySelectionReplaceEntry() {
  const payload = currentSelectionPayload(refs.selectionReplaceBtn);
  hideSelectionBtn();
  clearSelectedTextRange();
  if (!payload || !payload.selected) return;
  state.pendingSelectionReplaceRatio = currentChapterRatio();
  if (refs.selectionReplaceSourceInput) refs.selectionReplaceSourceInput.value = payload.exactSelected || payload.selected;
  if (refs.selectionReplaceTargetInput) refs.selectionReplaceTargetInput.value = "";
  if (refs.selectionReplaceDialog) refs.selectionReplaceDialog.showModal();
  if (refs.selectionReplaceTargetInput) {
    window.setTimeout(() => {
      refs.selectionReplaceTargetInput.focus();
    }, 10);
  }
}

async function confirmSelectionReplaceEntry(event) {
  if (event) event.preventDefault();
  const source = String(refs.selectionReplaceSourceInput && refs.selectionReplaceSourceInput.value || "").trim();
  const target = String(refs.selectionReplaceTargetInput && refs.selectionReplaceTargetInput.value || "").trim();
  const useRegex = Boolean(refs.selectionReplaceRegexInput && refs.selectionReplaceRegexInput.checked);
  const ignoreCase = Boolean(refs.selectionReplaceIgnoreCaseInput && refs.selectionReplaceIgnoreCaseInput.checked);
  if (!source) {
    state.shell.showToast(state.shell.t("replaceSourceRequired"));
    if (refs.selectionReplaceSourceInput) refs.selectionReplaceSourceInput.focus();
    return;
  }
  if (!target) {
    state.shell.showToast(state.shell.t("replaceTargetRequired"));
    if (refs.selectionReplaceTargetInput) refs.selectionReplaceTargetInput.focus();
    return;
  }
  if (!ensureValidRegexOrToast(source, useRegex)) {
    if (refs.selectionReplaceSourceInput) refs.selectionReplaceSourceInput.focus();
    return;
  }
  const preserveRatio = Number.isFinite(state.pendingSelectionReplaceRatio)
    ? state.pendingSelectionReplaceRatio
    : currentChapterRatio();
  state.shell.showStatus(state.shell.t("statusApplyingNameEntry"));
  try {
    const result = await state.shell.api(`/api/book-replaces/book/${encodeURIComponent(state.bookId)}/entry`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source,
        target,
        use_regex: useRegex,
        ignore_case: ignoreCase,
      }),
    });
    syncBookReplaceEntriesFromState(result);
    if (refs.selectionReplaceDialog && refs.selectionReplaceDialog.open) {
      refs.selectionReplaceDialog.close();
    } else {
      resetSelectionReplaceDialogState();
    }
    await refreshReaderAfterRawRuleChange({ preserveRatio });
    state.shell.showToast(state.shell.t("replaceEntryApplied"));
  } catch (error) {
    state.shell.showToast(error.message || state.shell.t("toastError"));
  } finally {
    state.shell.hideStatus();
  }
}

async function editSelectionNameFromMenu() {
  const payload = currentSelectionPayload(refs.selectionNameBtn);
  hideSelectionBtn();
  clearSelectedTextRange();
  const text = normalizeSelectionDisplayText(payload && (payload.exactSelected || payload.selected));
  const startOffset = payload ? payload.start : Number.NaN;
  const endOffset = payload ? payload.end : Number.NaN;
  if (!text || !state.chapterId || Number.isNaN(startOffset) || Number.isNaN(endOffset)) {
    state.pendingSelectionNameRatio = currentChapterRatio();
    if (refs.selectionNameSourceInput) refs.selectionNameSourceInput.value = "";
    if (refs.selectionNameTargetInput) refs.selectionNameTargetInput.value = text;
    syncSelectionNameDialogActions();
    if (refs.selectionNameDialog) refs.selectionNameDialog.showModal();
    window.setTimeout(() => {
      if (refs.selectionNameSourceInput) refs.selectionNameSourceInput.focus();
      else if (refs.selectionNameTargetInput) refs.selectionNameTargetInput.focus();
    }, 10);
    return;
  }
  if (selectionHasNameSplitDelimiter(text)) {
    state.shell.showToast(state.shell.t("selectionMapNoSource"));
    return;
  }
  const mapSeq = ++state.selectionNameMapSeq;
  state.pendingSelectionNameRatio = currentChapterRatio();
  if (refs.selectionNameSourceInput) refs.selectionNameSourceInput.value = "";
  if (refs.selectionNameTargetInput) refs.selectionNameTargetInput.value = text;
  if (refs.selectionNameHint) refs.selectionNameHint.textContent = state.shell.t("statusMappingSelection");
  syncSelectionNameDialogActions();
  if (refs.selectionNameDialog) refs.selectionNameDialog.showModal();
  window.setTimeout(() => {
    if (refs.selectionNameTargetInput) refs.selectionNameTargetInput.focus();
  }, 10);
  refreshNameEditorData()
    .then(() => {
      if (mapSeq !== state.selectionNameMapSeq) return;
      syncSelectionNameDialogActions();
    })
    .catch(() => {});
  state.shell.api(`/api/library/chapter/${encodeURIComponent(state.chapterId)}/selection-map`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      selected_text: payload.exactSelected || text,
      start_offset: startOffset,
      end_offset: endOffset,
      translation_mode: state.translateMode,
      translated_text: effectiveMode() === "trans" ? state.chapterText : "",
      displayed_trans_sig: state.chapterTransSig || "",
    }),
  }).then((mapped) => {
    if (mapSeq !== state.selectionNameMapSeq) return;
    if (refs.selectionNameSourceInput && !String(refs.selectionNameSourceInput.value || "").trim()) {
      refs.selectionNameSourceInput.value = mapped.source_candidate || "";
    }
    if (refs.selectionNameTargetInput) {
      const currentTarget = String(refs.selectionNameTargetInput.value || "").trim();
      if (!currentTarget || currentTarget === text) {
        refs.selectionNameTargetInput.value = mapped.target_candidate || text;
      }
    }
    if (refs.selectionNameHint) {
      refs.selectionNameHint.textContent = mapped.source_candidate
        ? state.shell.t("selectionNameHint")
        : state.shell.t("selectionMapNoSource");
    }
    syncSelectionNameDialogActions();
  }).catch((error) => {
    if (mapSeq !== state.selectionNameMapSeq) return;
    if (refs.selectionNameHint) refs.selectionNameHint.textContent = state.shell.t("selectionNameHint");
    state.shell.showToast(error.message || state.shell.t("toastError"));
  });
}

function handleSelectionButton() {
  if (!refs.selectionActionMenu || state.chapterContentType !== "text") {
    hideSelectionBtn();
    return;
  }
  if (shouldSuspendSelectionMenu()) {
    hideSelectionBtn();
    return;
  }
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) {
    hideSelectionBtn();
    return;
  }
  const text = String(sel.toString() || "").trim();
  if (!text || text.length > 1200) {
    hideSelectionBtn();
    return;
  }
  const range = activeReaderSelectionRange();
  if (!range) {
    hideSelectionBtn();
    return;
  }
  const rect = selectionRectFromRange(range);
  if (!rect || (!rect.width && !rect.height)) {
    hideSelectionBtn();
    return;
  }
  const payload = selectionPayloadFromRange(range);
  const selectionText = normalizeSelectionDisplayText(payload && (payload.exactSelected || payload.selected));
  if (!selectionText) {
    hideSelectionBtn();
    return;
  }
  for (const node of [refs.selectionActionMenu, refs.selectionSpeakBtn, refs.selectionNameBtn, refs.selectionReplaceBtn, refs.selectionCopyBtn, refs.selectionJunkBtn]) {
    if (!node || !node.dataset) continue;
    node.dataset.text = selectionText;
    node.dataset.rawText = payload.rawSelected || selectionText;
    node.dataset.exactText = payload.exactSelected || selectionText;
    node.dataset.startOffset = String(payload.start);
    node.dataset.endOffset = String(payload.end);
    node.dataset.startParagraphIndex = String(payload.startParagraphIndex || 0);
    node.dataset.startParagraphOffset = String(payload.startParagraphOffset || 0);
  }
  saveSelectionPayloadSnapshot({
    ...payload,
    selected: selectionText,
    rawSelected: payload.rawSelected || selectionText,
    exactSelected: payload.exactSelected || selectionText,
  });
  if (refs.selectionSpeakBtn) {
    refs.selectionSpeakBtn.textContent = state.shell.t("ttsSelectionPlay");
    refs.selectionSpeakBtn.classList.toggle("hidden", !canSpeakSelection(payload));
  }
  if (refs.selectionNameBtn) {
    refs.selectionNameBtn.textContent = state.shell.t("selectionEditName");
    refs.selectionNameBtn.classList.toggle("hidden", !canEditSelectionName(payload));
  }
  if (refs.selectionReplaceBtn) {
    refs.selectionReplaceBtn.textContent = state.shell.t("selectionEditWord");
    refs.selectionReplaceBtn.classList.toggle("hidden", !canEditSelectionReplace(payload));
  }
  if (refs.selectionCopyBtn) {
    refs.selectionCopyBtn.textContent = state.shell.t("selectionCopy");
    refs.selectionCopyBtn.classList.toggle("hidden", false);
  }
  if (refs.selectionJunkBtn) {
    refs.selectionJunkBtn.textContent = state.shell.t("selectionJunk");
    refs.selectionJunkBtn.classList.toggle("hidden", !canAddSelectionJunk(payload));
  }
  positionSelectionMenu(rect);
}

function bindNameEditor() {
  refs.nameEditorTitle.textContent = state.shell.t("nameEditorTitle");
  refs.nameDictTypeLabel.textContent = state.shell.t("nameDictTypeLabel");
  refs.nameDictScopeLabel.textContent = state.shell.t("nameDictScopeLabel");
  const nameTypeNameOpt = document.getElementById("name-dict-type-name");
  const nameTypeVpOpt = document.getElementById("name-dict-type-vp");
  const nameScopeBookOpt = document.getElementById("name-dict-scope-book");
  const nameScopeGlobalOpt = document.getElementById("name-dict-scope-global");
  if (nameTypeNameOpt) nameTypeNameOpt.textContent = state.shell.t("nameDictTypeName");
  if (nameTypeVpOpt) nameTypeVpOpt.textContent = state.shell.t("nameDictTypeVp");
  if (nameScopeBookOpt) nameScopeBookOpt.textContent = state.shell.t("nameDictScopeBook");
  if (nameScopeGlobalOpt) nameScopeGlobalOpt.textContent = state.shell.t("nameDictScopeGlobal");
  if (refs.nameDictTypeSelect) refs.nameDictTypeSelect.value = state.nameDictType;
  if (refs.nameDictScopeSelect) refs.nameDictScopeSelect.value = state.nameDictScope;
  refs.btnCloseNameEditor.textContent = state.shell.t("close");
  refs.btnRefreshNamePreview.textContent = state.shell.t("refreshNamePreview");
  refs.btnAddNameSet.textContent = state.shell.t("nameSetAdd");
  refs.btnDeleteNameSet.textContent = state.shell.t("nameSetDelete");
  refs.btnQuickAddNameSet.textContent = state.shell.t("nameSetQuickAdd");
  refs.btnExportNameSet.textContent = state.shell.t("nameSetExport");
  refs.btnImportNameSet.textContent = state.shell.t("nameSetImport");
  refs.nameSetLabel.textContent = state.shell.t("nameSetLabel");
  refs.nameSourceLabel.textContent = state.shell.t("nameSourceLabel");
  refs.nameTargetLabel.textContent = state.shell.t("nameTargetLabel");
  refs.btnOpenNameSuggest.textContent = state.shell.t("nameSuggestButton");
  syncNameEntrySubmitLabel();
  refs.nameColSource.textContent = state.shell.t("nameColSource");
  refs.nameColTarget.textContent = state.shell.t("nameColTarget");
  refs.nameColCount.textContent = state.shell.t("nameColType");
  refs.nameColAction.textContent = state.shell.t("nameColAction");
  refs.nameBulkTitle.textContent = state.shell.t("nameSetQuickAddTitle");
  refs.btnCloseNameBulk.textContent = state.shell.t("close");
  refs.nameBulkHint.textContent = state.shell.t("nameSetQuickAddHint");
  refs.nameBulkInputLabel.textContent = state.shell.t("nameSetQuickAddInput");
  refs.nameBulkInput.placeholder = state.shell.t("nameSetQuickAddPlaceholder");
  refs.btnCancelNameBulk.textContent = state.shell.t("cancel");
  refs.btnConfirmNameBulk.textContent = state.shell.t("nameSetQuickAdd");
  refs.namePreviewHint.textContent = state.shell.t("namePreviewEmpty");
  refs.nameSuggestTitle.textContent = state.shell.t("nameSuggestTitle");
  refs.btnCloseNameSuggest.textContent = state.shell.t("close");
  refs.nameSuggestHint.textContent = state.shell.t("nameSuggestHint");
  refs.nameSuggestColIndex.textContent = state.shell.t("nameSuggestColIndex");
  refs.nameSuggestColSource.textContent = state.shell.t("nameSuggestColSource");
  refs.nameSuggestColHv.textContent = state.shell.t("nameSuggestColHv");
  refs.nameSuggestColTarget.textContent = state.shell.t("nameSuggestColTarget");
  refs.nameSuggestColOrigin.textContent = state.shell.t("nameSuggestColOrigin");
  refs.nameSuggestColAction.textContent = state.shell.t("nameSuggestColAction");
  if (refs.btnNameSuggestGoogleTranslate) refs.btnNameSuggestGoogleTranslate.textContent = state.shell.t("nameSuggestGoogleTranslate");
  if (refs.btnNameSuggestGoogleSearch) refs.btnNameSuggestGoogleSearch.textContent = state.shell.t("nameSuggestGoogleSearch");
  if (refs.btnOpenReplaceEditor) refs.btnOpenReplaceEditor.textContent = state.shell.t("openReplaceEditor");
  if (refs.selectionNameTitle) refs.selectionNameTitle.textContent = state.shell.t("selectionNameTitle");
  if (refs.selectionNameHint) refs.selectionNameHint.textContent = state.shell.t("selectionNameHint");
  if (refs.selectionNameSourceLabel) refs.selectionNameSourceLabel.textContent = state.shell.t("selectionNameSourceLabel");
  if (refs.selectionNameTargetLabel) refs.selectionNameTargetLabel.textContent = state.shell.t("selectionNameTargetLabel");
  if (refs.btnCloseSelectionName) refs.btnCloseSelectionName.textContent = state.shell.t("close");
  if (refs.btnOpenSelectionNameSuggest) refs.btnOpenSelectionNameSuggest.textContent = state.shell.t("nameSuggestButton");
  if (refs.btnCancelSelectionName) refs.btnCancelSelectionName.textContent = state.shell.t("cancel");
  syncSelectionNameDialogActions();
  if (refs.selectionJunkTitle) refs.selectionJunkTitle.textContent = state.shell.t("selectionJunkTitle");
  if (refs.btnCloseSelectionJunk) refs.btnCloseSelectionJunk.textContent = state.shell.t("close");
  if (refs.selectionJunkHint) refs.selectionJunkHint.textContent = state.shell.t("selectionJunkHint");
  if (refs.selectionJunkInputLabel) refs.selectionJunkInputLabel.textContent = state.shell.t("selectionJunkInputLabel");
  if (refs.selectionJunkRegexLabel) refs.selectionJunkRegexLabel.textContent = state.shell.t("selectionJunkRegexLabel");
  if (refs.selectionJunkIgnoreCaseLabel) refs.selectionJunkIgnoreCaseLabel.textContent = state.shell.t("selectionJunkIgnoreCaseLabel");
  if (refs.btnCancelSelectionJunk) refs.btnCancelSelectionJunk.textContent = state.shell.t("cancel");
  if (refs.btnConfirmSelectionJunk) refs.btnConfirmSelectionJunk.textContent = state.shell.t("selectionJunkConfirm");
  if (refs.selectionReplaceTitle) refs.selectionReplaceTitle.textContent = state.shell.t("selectionReplaceTitle");
  if (refs.selectionReplaceHint) refs.selectionReplaceHint.textContent = state.shell.t("selectionReplaceHint");
  if (refs.selectionReplaceSourceLabel) refs.selectionReplaceSourceLabel.textContent = state.shell.t("selectionReplaceSourceLabel");
  if (refs.selectionReplaceTargetLabel) refs.selectionReplaceTargetLabel.textContent = state.shell.t("selectionReplaceTargetLabel");
  if (refs.selectionReplaceRegexLabel) refs.selectionReplaceRegexLabel.textContent = state.shell.t("selectionReplaceRegexLabel");
  if (refs.selectionReplaceIgnoreCaseLabel) refs.selectionReplaceIgnoreCaseLabel.textContent = state.shell.t("selectionReplaceIgnoreCaseLabel");
  if (refs.btnCloseSelectionReplace) refs.btnCloseSelectionReplace.textContent = state.shell.t("close");
  if (refs.btnCancelSelectionReplace) refs.btnCancelSelectionReplace.textContent = state.shell.t("cancel");
  if (refs.btnConfirmSelectionReplace) refs.btnConfirmSelectionReplace.textContent = state.shell.t("selectionReplaceConfirm");
  if (refs.replaceEditorTitle) refs.replaceEditorTitle.textContent = state.shell.t("replaceEditorTitle");
  if (refs.replaceEditorHint) refs.replaceEditorHint.textContent = state.shell.t("replaceEditorHint");
  if (refs.btnCloseReplaceEditor) refs.btnCloseReplaceEditor.textContent = state.shell.t("close");
  if (refs.btnRefreshReplaceEditor) refs.btnRefreshReplaceEditor.textContent = state.shell.t("refreshNamePreview");
  if (refs.replaceSourceLabel) refs.replaceSourceLabel.textContent = state.shell.t("replaceSourceLabel");
  if (refs.replaceTargetLabel) refs.replaceTargetLabel.textContent = state.shell.t("replaceTargetLabel");
  if (refs.replaceRegexLabel) refs.replaceRegexLabel.textContent = state.shell.t("junkRegexLabel");
  if (refs.replaceIgnoreCaseLabel) refs.replaceIgnoreCaseLabel.textContent = state.shell.t("junkIgnoreCaseLabel");
  if (refs.btnAddReplaceEntry) refs.btnAddReplaceEntry.textContent = state.shell.t("addNameEntry");
  if (refs.replacePreviewHint) refs.replacePreviewHint.textContent = state.shell.t("replacePreviewEmpty");
  if (refs.replaceColSource) refs.replaceColSource.textContent = state.shell.t("replaceColSource");
  if (refs.replaceColTarget) refs.replaceColTarget.textContent = state.shell.t("replaceColTarget");
  if (refs.replaceColAction) refs.replaceColAction.textContent = state.shell.t("replaceColAction");
  syncNameEditorScopeUi();

  if (refs.nameDictTypeSelect) {
    refs.nameDictTypeSelect.addEventListener("change", () => {
      state.nameDictType = String(refs.nameDictTypeSelect.value || "name").trim().toLowerCase() === "vp" ? "vp" : "name";
      syncNameEditorScopeUi();
      renderNameEntriesTable();
      syncNameEntrySubmitLabel();
    });
  }
  if (refs.nameDictScopeSelect) {
    refs.nameDictScopeSelect.addEventListener("change", () => {
      state.nameDictScope = String(refs.nameDictScopeSelect.value || "book").trim().toLowerCase() === "global" ? "global" : "book";
      syncNameEditorScopeUi();
      renderNameEntriesTable();
      syncNameEntrySubmitLabel();
    });
  }

  refs.btnOpenNameEditor.addEventListener("click", () => openNameEditor({}));
  if (refs.btnOpenReplaceEditor) refs.btnOpenReplaceEditor.addEventListener("click", () => {
    openReplaceEditor().catch((error) => {
      state.shell.showToast(error.message || state.shell.t("toastError"));
    });
  });
  refs.btnCloseNameEditor.addEventListener("click", () => refs.nameEditorDialog.close());
  if (refs.btnCloseReplaceEditor) refs.btnCloseReplaceEditor.addEventListener("click", () => refs.replaceEditorDialog.close());
  refs.btnCloseNameBulk.addEventListener("click", () => refs.nameBulkDialog.close());
  refs.btnCloseNameSuggest.addEventListener("click", () => refs.nameSuggestDialog.close());
  if (refs.btnOpenSelectionNameSuggest) refs.btnOpenSelectionNameSuggest.addEventListener("click", () => {
    openNameSuggestDialog().catch((error) => {
      state.shell.showToast(getErrorMessage(error));
    });
  });
  if (refs.btnCloseSelectionName) refs.btnCloseSelectionName.addEventListener("click", () => {
    if (refs.selectionNameDialog) refs.selectionNameDialog.close();
  });
  if (refs.btnCancelSelectionName) refs.btnCancelSelectionName.addEventListener("click", () => {
    if (refs.selectionNameDialog) refs.selectionNameDialog.close();
  });
  if (refs.btnDeleteSelectionName) refs.btnDeleteSelectionName.addEventListener("click", () => {
    const source = normalizeNameSourceKey(refs.selectionNameSourceInput && refs.selectionNameSourceInput.value);
    if (!source) return;
    const liveRatio = currentChapterRatio();
    const preserveRatio = Number.isFinite(liveRatio)
      ? liveRatio
      : (Number.isFinite(state.pendingSelectionNameRatio) ? state.pendingSelectionNameRatio : 0);
    state.shell.showStatus(state.shell.t("statusApplyingNameEntry"));
    deleteSelectionNameEntry(source)
      .then(async () => {
        if (refs.selectionNameDialog && refs.selectionNameDialog.open) refs.selectionNameDialog.close();
        refreshNameEditorData().catch(() => {});
        queueReaderDictRefresh({ preserveRatio, refreshBook: true });
        state.shell.showToast(state.shell.t("nameEntryDeleted"));
      })
      .catch((error) => {
        state.shell.showToast(error.message || state.shell.t("toastError"));
      })
      .finally(() => {
        state.shell.hideStatus();
      });
  });
  refs.btnCancelNameBulk.addEventListener("click", () => refs.nameBulkDialog.close());
  refs.nameBulkDialog.addEventListener("close", () => {
    if (refs.nameBulkForm) refs.nameBulkForm.reset();
  });
  refs.nameBulkForm.addEventListener("submit", submitQuickAddNameEntries);
  if (refs.selectionNameDialog) {
    refs.selectionNameDialog.addEventListener("close", () => {
      resetSelectionNameDialogState();
    });
  }
  if (refs.selectionNameForm) refs.selectionNameForm.addEventListener("submit", (event) => {
    confirmSelectionNameEntry(event).catch((error) => {
      state.shell.showToast(error.message || state.shell.t("toastError"));
    });
  });
  if (refs.btnCloseSelectionJunk) refs.btnCloseSelectionJunk.addEventListener("click", () => {
    if (refs.selectionJunkDialog) refs.selectionJunkDialog.close();
  });
  if (refs.btnCancelSelectionJunk) refs.btnCancelSelectionJunk.addEventListener("click", () => {
    if (refs.selectionJunkDialog) refs.selectionJunkDialog.close();
  });
  if (refs.selectionJunkDialog) {
    refs.selectionJunkDialog.addEventListener("close", () => {
      resetSelectionJunkDialogState();
    });
  }
  if (refs.selectionJunkForm) refs.selectionJunkForm.addEventListener("submit", (event) => {
    confirmSelectionJunkEntry(event).catch((error) => {
      state.shell.showToast(error.message || state.shell.t("toastError"));
    });
  });
  if (refs.btnCloseSelectionReplace) refs.btnCloseSelectionReplace.addEventListener("click", () => {
    if (refs.selectionReplaceDialog) refs.selectionReplaceDialog.close();
  });
  if (refs.btnCancelSelectionReplace) refs.btnCancelSelectionReplace.addEventListener("click", () => {
    if (refs.selectionReplaceDialog) refs.selectionReplaceDialog.close();
  });
  if (refs.selectionReplaceDialog) {
    refs.selectionReplaceDialog.addEventListener("close", () => {
      resetSelectionReplaceDialogState();
    });
  }
  if (refs.selectionReplaceForm) refs.selectionReplaceForm.addEventListener("submit", (event) => {
    confirmSelectionReplaceEntry(event).catch((error) => {
      state.shell.showToast(error.message || state.shell.t("toastError"));
    });
  });
  if (refs.btnRefreshReplaceEditor) refs.btnRefreshReplaceEditor.addEventListener("click", () => {
    openReplaceEditor().catch((error) => {
      state.shell.showToast(error.message || state.shell.t("toastError"));
    });
  });
  if (refs.replaceEntryForm) refs.replaceEntryForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const source = String(refs.replaceSourceInput && refs.replaceSourceInput.value || "").trim();
    const target = String(refs.replaceTargetInput && refs.replaceTargetInput.value || "").trim();
    const useRegex = Boolean(refs.replaceRegexInput && refs.replaceRegexInput.checked);
    const ignoreCase = Boolean(refs.replaceIgnoreCaseInput && refs.replaceIgnoreCaseInput.checked);
    if (!source) {
      state.shell.showToast(state.shell.t("replaceSourceRequired"));
      if (refs.replaceSourceInput) refs.replaceSourceInput.focus();
      return;
    }
    if (!target) {
      state.shell.showToast(state.shell.t("replaceTargetRequired"));
      if (refs.replaceTargetInput) refs.replaceTargetInput.focus();
      return;
    }
    if (!ensureValidRegexOrToast(source, useRegex)) {
      if (refs.replaceSourceInput) refs.replaceSourceInput.focus();
      return;
    }
    try {
      const result = await state.shell.api(`/api/book-replaces/book/${encodeURIComponent(state.bookId)}/entry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source,
          target,
          use_regex: useRegex,
          ignore_case: ignoreCase,
        }),
      });
      syncBookReplaceEntriesFromState(result);
      refs.replaceEntryForm.reset();
      renderReplaceEntriesTable();
      await refreshReaderAfterRawRuleChange({ preserveRatio: currentChapterRatio() });
      state.shell.showToast(state.shell.t("replaceEntryApplied"));
    } catch (error) {
      state.shell.showToast(error.message || state.shell.t("toastError"));
    }
  });
  if (refs.btnNameSuggestGoogleTranslate) {
    refs.btnNameSuggestGoogleTranslate.addEventListener("click", () => {
      const source = currentNameSuggestSourceText();
      if (!source) return;
      window.open(
        `https://translate.google.com/?sl=zh-CN&tl=vi&text=${encodeURIComponent(source)}&op=translate`,
        "_blank",
        "noopener,noreferrer",
      );
    });
  }
  if (refs.btnNameSuggestGoogleSearch) {
    refs.btnNameSuggestGoogleSearch.addEventListener("click", () => {
      const source = currentNameSuggestSourceText();
      if (!source) return;
      window.open(
        `https://www.google.com/search?q=${encodeURIComponent(source)}`,
        "_blank",
        "noopener,noreferrer",
      );
    });
  }
  refs.nameSourceInput.addEventListener("input", () => {
    syncNameSuggestExternalActions();
    syncNameEntrySubmitLabel();
  });
  if (refs.selectionNameSourceInput) refs.selectionNameSourceInput.addEventListener("input", () => {
    syncNameSuggestExternalActions();
    syncSelectionNameDialogActions();
  });
  refs.btnRefreshNamePreview.addEventListener("click", refreshNamePreview);
  refs.btnAddNameSet.addEventListener("click", addNameSet);
  refs.btnDeleteNameSet.addEventListener("click", deleteActiveNameSet);
  refs.btnQuickAddNameSet.addEventListener("click", openNameBulkDialog);
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
    if (!isNameBookScope()) return;
    const chosen = refs.nameSetSelect.value;
    const preserveRatio = currentChapterRatio();
    state.shell.showStatus(state.shell.t("statusSwitchingNameSet"));
    try {
      const data = await state.shell.api("/api/name-sets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active_set: chosen, bump_version: false, book_id: state.bookId }),
      });
      state.activeNameSet = data.active_set || chosen;
      await refreshNamePreview();
      syncNameEntrySubmitLabel();
      await refreshReaderAfterDictChange({ preserveRatio, refreshBook: true });
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
    const applied = await applyNameEntry(source, target);
    if (!applied) return;
    refs.nameEntryForm.reset();
    syncNameEntrySubmitLabel();
  });

  if (refs.selectionNameBtn) refs.selectionNameBtn.addEventListener("click", () => {
    editSelectionNameFromMenu().catch((error) => {
      state.shell.showToast(error.message || state.shell.t("toastError"));
    });
  });
  if (refs.selectionReplaceBtn) refs.selectionReplaceBtn.addEventListener("click", () => {
    applySelectionReplaceEntry().catch((error) => {
      state.shell.showToast(error.message || state.shell.t("toastError"));
    });
  });
  if (refs.selectionCopyBtn) refs.selectionCopyBtn.addEventListener("click", async () => {
    const payload = currentSelectionPayload(refs.selectionCopyBtn);
    hideSelectionBtn();
    clearSelectedTextRange();
    if (!payload || !payload.selected) return;
    try {
      await copySelectionToClipboard(payload.rawSelected || payload.exactSelected || payload.selected);
      state.shell.showToast(state.shell.t("toastSelectionCopied"));
    } catch (error) {
      state.shell.showToast(error.message || state.shell.t("toastError"));
    }
  });
  if (refs.selectionJunkBtn) refs.selectionJunkBtn.addEventListener("click", () => {
    applySelectionJunkEntry().catch((error) => {
      state.shell.showToast(error.message || state.shell.t("toastError"));
    });
  });
}

function bindTtsControls() {
  if (refs.btnOpenTts) refs.btnOpenTts.textContent = state.shell.t("ttsOpenButton");
  if (refs.ttsDialogTitle) refs.ttsDialogTitle.textContent = state.shell.t("ttsDialogTitle");
  if (refs.btnCloseTtsDialog) refs.btnCloseTtsDialog.textContent = state.shell.t("close");
  if (refs.ttsDialogHint) refs.ttsDialogHint.textContent = state.shell.t("ttsDialogHint");
  if (refs.btnTtsStop) refs.btnTtsStop.textContent = state.shell.t("ttsStop");
  if (refs.btnTtsPrevSegment) refs.btnTtsPrevSegment.textContent = state.shell.t("ttsPrevSegment");
  if (refs.btnTtsNextSegment) refs.btnTtsNextSegment.textContent = state.shell.t("ttsNextSegment");
  if (refs.btnTtsCloseActions) refs.btnTtsCloseActions.textContent = state.shell.t("close");
  if (refs.ttsProviderLabel) refs.ttsProviderLabel.textContent = state.shell.t("ttsProviderLabel");
  if (refs.ttsVoiceLabel) refs.ttsVoiceLabel.textContent = state.shell.t("ttsVoiceLabel");
  if (refs.ttsRateLabel) refs.ttsRateLabel.textContent = state.shell.t("ttsRateLabel");
  if (refs.ttsPitchLabel) refs.ttsPitchLabel.textContent = state.shell.t("ttsPitchLabel");
  if (refs.ttsVolumeLabel) refs.ttsVolumeLabel.textContent = state.shell.t("ttsVolumeLabel");
  if (refs.ttsMaxCharsLabel) refs.ttsMaxCharsLabel.textContent = state.shell.t("ttsMaxCharsLabel");
  if (refs.ttsSegmentDelayLabel) refs.ttsSegmentDelayLabel.textContent = state.shell.t("ttsSegmentDelayLabel");
  if (refs.ttsPrefetchCountLabel) refs.ttsPrefetchCountLabel.textContent = state.shell.t("ttsPrefetchCountLabel");
  if (refs.ttsRemoteTimeoutLabel) refs.ttsRemoteTimeoutLabel.textContent = state.shell.t("ttsRemoteTimeoutLabel");
  if (refs.ttsRemoteRetriesLabel) refs.ttsRemoteRetriesLabel.textContent = state.shell.t("ttsRemoteRetriesLabel");
  if (refs.ttsRemoteGapLabel) refs.ttsRemoteGapLabel.textContent = state.shell.t("ttsRemoteGapLabel");
  if (refs.ttsPrefetchEnabledLabel) refs.ttsPrefetchEnabledLabel.textContent = state.shell.t("ttsPrefetchEnabledLabel");
  if (refs.ttsIncludeTitleLabel) refs.ttsIncludeTitleLabel.textContent = state.shell.t("ttsIncludeTitleLabel");
  if (refs.ttsAutoScrollLabel) refs.ttsAutoScrollLabel.textContent = state.shell.t("ttsAutoScrollLabel");
  if (refs.ttsAutoNextLabel) refs.ttsAutoNextLabel.textContent = state.shell.t("ttsAutoNextLabel");
  if (refs.ttsAutoStartNextLabel) refs.ttsAutoStartNextLabel.textContent = state.shell.t("ttsAutoStartNextLabel");
  if (refs.ttsReplaceEnabledLabel) refs.ttsReplaceEnabledLabel.textContent = state.shell.t("ttsReplaceEnabledLabel");
  if (refs.ttsReplaceRulesLabel) refs.ttsReplaceRulesLabel.textContent = state.shell.t("ttsReplaceRulesLabel");
  if (refs.ttsSleepLabel) refs.ttsSleepLabel.textContent = state.shell.t("ttsSleepLabel");
  if (refs.ttsSleepCustomLabel) refs.ttsSleepCustomLabel.textContent = state.shell.t("ttsSleepCustomLabel");
  if (refs.btnTtsApplySleep) refs.btnTtsApplySleep.textContent = state.shell.t("ttsSleepApply");
  if (refs.btnTtsClearSleep) refs.btnTtsClearSleep.textContent = state.shell.t("ttsSleepClear");

  renderTtsDialogState();
  bindTtsMediaSessionActions();

  if (window.speechSynthesis && typeof window.speechSynthesis.addEventListener === "function") {
    window.speechSynthesis.addEventListener("voiceschanged", refreshBrowserVoices);
  }
  refreshBrowserVoices();

  if (refs.btnOpenTts) refs.btnOpenTts.addEventListener("click", () => {
    state.tts.playFromSelectionNext = null;
    openTtsDialog({ autoStart: false, fromSelection: false }).catch((error) => {
      state.shell.showToast(getErrorMessage(error));
    });
  });
  if (refs.selectionSpeakBtn) refs.selectionSpeakBtn.addEventListener("click", () => {
    const payload = currentSelectionPayload(refs.selectionSpeakBtn);
    state.tts.playFromSelectionNext = payload ? {
      paragraphIndex: payload.startParagraphIndex,
      paragraphOffset: payload.startParagraphOffset,
    } : null;
    hideSelectionBtn();
    clearSelectedTextRange();
    openTtsDialog({ autoStart: false, fromSelection: true }).catch((error) => {
      state.shell.showToast(getErrorMessage(error));
    });
  });
  if (refs.btnCloseTtsDialog) refs.btnCloseTtsDialog.addEventListener("click", () => {
    if (refs.ttsDialog) refs.ttsDialog.close();
  });
  if (refs.btnTtsCloseActions) refs.btnTtsCloseActions.addEventListener("click", () => {
    if (refs.ttsDialog) refs.ttsDialog.close();
  });
  if (refs.btnTtsPlayChapter) refs.btnTtsPlayChapter.addEventListener("click", () => {
    startTtsPlayback({ openDialog: true, fromSelection: Boolean(state.tts.playFromSelectionNext) }).catch((error) => {
      state.shell.showToast(getErrorMessage(error));
    });
  });
  if (refs.btnTtsTogglePlay) refs.btnTtsTogglePlay.addEventListener("click", () => {
    pauseOrResumeTtsPlayback().catch((error) => {
      state.shell.showToast(getErrorMessage(error));
    });
  });
  if (refs.btnTtsStop) refs.btnTtsStop.addEventListener("click", () => {
    stopTtsPlayback({ keepDialogOpen: true, preserveStatus: false });
  });
  if (refs.btnTtsPrevSegment) refs.btnTtsPrevSegment.addEventListener("click", () => {
    seekTtsSegment(-1).catch((error) => {
      state.shell.showToast(getErrorMessage(error));
    });
  });
  if (refs.btnTtsNextSegment) refs.btnTtsNextSegment.addEventListener("click", () => {
    seekTtsSegment(1).catch((error) => {
      state.shell.showToast(getErrorMessage(error));
    });
  });
  if (refs.ttsProviderSelect) refs.ttsProviderSelect.addEventListener("change", () => {
    state.tts.settings.provider = String(refs.ttsProviderSelect.value || "browser").trim() || "browser";
    stopTtsPlayback({ keepDialogOpen: true, preserveStatus: false });
    saveTtsSettingsState();
    ensureTtsProviderVoices(getTtsProviderId()).catch((error) => {
      state.shell.showToast(getErrorMessage(error));
    });
  });
  if (refs.ttsVoiceSelect) refs.ttsVoiceSelect.addEventListener("change", () => {
    rememberTtsVoiceSelection(getTtsProviderId(), refs.ttsVoiceSelect.value || "");
  });

  const bindNumberInput = (input, updater) => {
    if (!input) return;
    input.addEventListener("change", () => {
      updater();
      saveTtsSettingsState();
      if (state.tts.audio) {
        state.tts.audio.playbackRate = Number(state.tts.settings.rate) || 1;
        applyTtsLiveOutputVolume();
      }
    });
  };
  const bindRangeInput = (input, updater) => {
    if (!input) return;
    input.addEventListener("input", () => {
      updater();
      saveTtsSettingsState();
      if (state.tts.audio) {
        state.tts.audio.playbackRate = Number(state.tts.settings.rate) || 1;
        applyTtsLiveOutputVolume();
      }
    });
  };

  bindRangeInput(refs.ttsRateInput, () => {
    state.tts.settings.rate = Number.parseFloat(refs.ttsRateInput.value || "1") || 1;
  });
  bindRangeInput(refs.ttsPitchInput, () => {
    state.tts.settings.pitch = Number.parseFloat(refs.ttsPitchInput.value || "1") || 1;
  });
  bindRangeInput(refs.ttsVolumeInput, () => {
    state.tts.settings.volume = Number.parseFloat(refs.ttsVolumeInput.value || "1") || 1;
  });
  bindNumberInput(refs.ttsMaxCharsInput, () => {
    state.tts.settings.maxChars = Number.parseInt(refs.ttsMaxCharsInput.value || "260", 10) || 260;
  });
  bindNumberInput(refs.ttsSegmentDelayInput, () => {
    state.tts.settings.segmentDelayMs = Number.parseInt(refs.ttsSegmentDelayInput.value || "250", 10) || 250;
  });
  bindNumberInput(refs.ttsPrefetchCountInput, () => {
    state.tts.settings.prefetchCount = Number.parseInt(refs.ttsPrefetchCountInput.value || "2", 10) || 0;
  });
  bindNumberInput(refs.ttsRemoteTimeoutInput, () => {
    state.tts.settings.remoteTimeoutMs = Number.parseInt(refs.ttsRemoteTimeoutInput.value || "20000", 10) || 20000;
  });
  bindNumberInput(refs.ttsRemoteRetriesInput, () => {
    state.tts.settings.remoteRetries = Number.parseInt(refs.ttsRemoteRetriesInput.value || "2", 10) || 0;
  });
  bindNumberInput(refs.ttsRemoteGapInput, () => {
    state.tts.settings.remoteMinGapMs = Number.parseInt(refs.ttsRemoteGapInput.value || "220", 10) || 0;
  });

  const bindToggle = (input, assign) => {
    if (!input) return;
    input.addEventListener("change", () => {
      assign(Boolean(input.checked));
      saveTtsSettingsState();
    });
  };
  bindToggle(refs.ttsPrefetchEnabledInput, (value) => {
    state.tts.settings.prefetchEnabled = value;
  });
  bindToggle(refs.ttsIncludeTitleInput, (value) => {
    state.tts.settings.includeTitle = value;
  });
  bindToggle(refs.ttsAutoScrollInput, (value) => {
    state.tts.settings.autoScroll = value;
  });
  bindToggle(refs.ttsAutoNextInput, (value) => {
    state.tts.settings.autoNext = value;
  });
  bindToggle(refs.ttsAutoStartNextInput, (value) => {
    state.tts.settings.autoStartOnNextChapter = value;
  });
  bindToggle(refs.ttsReplaceEnabledInput, (value) => {
    state.tts.settings.replaceEnabled = value;
  });
  if (refs.ttsReplaceRulesInput) refs.ttsReplaceRulesInput.addEventListener("change", () => {
    state.tts.settings.replaceRulesText = String(refs.ttsReplaceRulesInput.value || "");
    saveTtsSettingsState();
  });
  if (refs.ttsSleepPresetSelect) refs.ttsSleepPresetSelect.addEventListener("change", () => {
    state.tts.settings.sleepPreset = String(refs.ttsSleepPresetSelect.value || "off").trim() || "off";
    saveTtsSettingsState();
  });
  bindNumberInput(refs.ttsSleepCustomInput, () => {
    state.tts.settings.sleepCustomMinutes = Number.parseInt(refs.ttsSleepCustomInput.value || "90", 10) || 90;
  });
  if (refs.btnTtsApplySleep) refs.btnTtsApplySleep.addEventListener("click", () => {
    if (currentTtsSleepMinutes() <= 0) {
      clearTtsSleepTimer({ quiet: true });
      state.shell.showToast(state.shell.t("ttsSleepStatusNone"));
      return;
    }
    startTtsSleepTimer({ quiet: false, restart: true });
  });
  if (refs.btnTtsClearSleep) refs.btnTtsClearSleep.addEventListener("click", () => {
    clearTtsSleepTimer({ quiet: true });
  });
}

async function switchMode(nextMode) {
  if (!state.book) return;
  if (nextMode === "trans" && !supportsTranslation(state.book)) {
    state.shell.showToast(state.shell.t("sourceNoTrans"));
    return;
  }
  if (state.tts.playing && !state.tts.autoAdvancing) {
    stopTtsPlayback({ keepDialogOpen: true, preserveStatus: false });
  }
  state.mode = nextMode;
  state.tts.playFromSelectionNext = null;
  clearChapterCache();
  cancelPrefetch();
  syncModeButtons();
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
  if (state.chapterRawEdited && isCurrentChapterRemoteSource()) {
    if (!window.confirm(state.shell.t("confirmReloadChapterEditedRaw"))) {
      return;
    }
  }
  if (state.tts.playing && !state.tts.autoAdvancing) {
    stopTtsPlayback({ keepDialogOpen: true, preserveStatus: false });
  }
  state.shell.showStatus(state.shell.t("statusReloadingChapter"));
  try {
    if (state.activeChapterController) {
      try {
        state.activeChapterController.abort();
      } catch {
        // ignore
      }
    }
    const result = await state.shell.api(`/api/library/chapter/${encodeURIComponent(state.chapterId)}/reload`, {
      method: "POST",
    });
    dropChapterCacheById(state.chapterId);
    await loadChapter({ resetFlip: true });
    await loadBook();
    renderToc();
    window.dispatchEvent(new CustomEvent("reader-cache-changed", {
      detail: {
        source: "reader-reload",
        action: "reload_chapter",
        book_id: state.bookId,
        chapter_id: state.chapterId,
      },
    }));
    if (result && result.reloaded_from_source) {
      state.shell.showToast(state.shell.t("toastChapterReloadedFromSource"));
    } else {
      state.shell.showToast(state.shell.t("toastChapterReloaded"));
    }
  } catch (error) {
    state.shell.showToast(error.displayMessage || error.message || state.shell.t("toastError"));
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

function scheduleProgressSave(delay = 280) {
  clearTimeout(state.saveTimer);
  state.saveTimer = window.setTimeout(() => saveProgress(), delay);
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
    scheduleProgressSave(280);
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
    return;
  }

  if (state.infiniteScrollProgressPx > 0) clearScrollHint();
}

function onFullscreenHybridWheelFallback(event) {
  if (!isFullscreenActive()) return;
  if (runtimeReadingMode() !== "hybrid") return;
  const target = event.target;
  if (target && target.closest) {
    if (target.closest("#reader-content-scroll")) return;
    if (target.closest("dialog, #settings-drawer, #reader-toc-drawer")) return;
    if (target.closest("#settings-backdrop")) return;
  }
  const wrap = refs.readerContentScroll;
  if (!wrap) return;
  const delta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
  if (Math.abs(delta) < 0.5) return;
  const maxY = Math.max(0, wrap.scrollHeight - wrap.clientHeight);
  if (maxY <= 2) return;
  const prevTop = wrap.scrollTop;
  wrap.scrollTop = Math.max(0, Math.min(maxY, prevTop + delta));
  if (wrap.scrollTop === prevTop) return;
  event.preventDefault();
  updateProgress();
  updateMiniInfoVisibility();
  scheduleProgressSave(280);
}

async function init() {
  if ("scrollRestoration" in window.history) {
    window.history.scrollRestoration = "manual";
  }

  state.shell = await initShell({
    page: "reader",
    onSearchSubmit: (q) => state.shell.goSearchPage(q),
    onImported: (data) => {
      const book = data && data.book;
      const bid = book && book.book_id;
      if (bid) {
        const chapterId = String((book && book.last_read_chapter_id) || "").trim();
        const mode = state.translationEnabled && supportsTranslation(book) ? "trans" : "raw";
        window.location.href = buildReaderUrl(book, chapterId, mode);
      }
    },
  });

  if (state.shell && state.shell.hideStatus) state.shell.hideStatus();

  refs.readerTocTitle.textContent = state.shell.t("tocTitle");
  if (refs.btnReaderDownloadBook) refs.btnReaderDownloadBook.textContent = state.shell.t("downloadBook");
  if (refs.btnReaderRefreshToc) {
    setTocIcon(refs.btnReaderRefreshToc, "refresh");
    refs.btnReaderRefreshToc.title = state.shell.t("checkBookUpdates");
    refs.btnReaderRefreshToc.setAttribute("aria-label", state.shell.t("checkBookUpdates"));
  }
  refs.btnCloseReaderToc.textContent = state.shell.t("close");
  if (refs.btnReaderTocPrev) refs.btnReaderTocPrev.textContent = state.shell.t("tocPrev");
  if (refs.btnReaderTocNext) refs.btnReaderTocNext.textContent = state.shell.t("tocNext");
  if (refs.readerTocPageSelect) {
    refs.readerTocPageSelect.title = state.shell.t("tocJumpPage");
    refs.readerTocPageSelect.setAttribute("aria-label", state.shell.t("tocJumpPage"));
  }
  refs.btnReaderToc.textContent = state.shell.t("readerToc");
  if (refs.btnFooterToc) refs.btnFooterToc.textContent = state.shell.t("readerToc");
  if (refs.btnOpenSettingsInline) refs.btnOpenSettingsInline.textContent = state.shell.t("openSettings");
  if (refs.btnOpenBookInfo) refs.btnOpenBookInfo.textContent = state.shell.t("readerBookInfo");
  if (refs.btnOpenRawEditor) refs.btnOpenRawEditor.textContent = state.shell.t("readerRawEditor");
  refs.btnModeRaw.textContent = state.shell.t("raw");
  refs.btnModeTrans.textContent = state.shell.t("trans");
  refs.btnTranslateMode.textContent = state.shell.t("modeServer");
  if (refs.btnReloadChapter) refs.btnReloadChapter.textContent = state.shell.t("reloadChapter");
  refs.btnOpenNameEditor.textContent = state.shell.t("bookPrivateNames");
  if (refs.rawEditorTitle) refs.rawEditorTitle.textContent = state.shell.t("rawEditorTitle");
  if (refs.btnCloseRawEditor) refs.btnCloseRawEditor.textContent = state.shell.t("close");
  if (refs.rawEditorInputLabel) refs.rawEditorInputLabel.textContent = state.shell.t("rawEditorInputLabel");
  if (refs.btnCancelRawEditor) refs.btnCancelRawEditor.textContent = state.shell.t("cancel");
  if (refs.btnSaveRawEditor) refs.btnSaveRawEditor.textContent = state.shell.t("save");
  syncRawEditorHint();
  refs.btnFullscreen.textContent = state.shell.t("fullscreen");
  refs.btnPrev.textContent = state.shell.t("prev");
  refs.btnNext.textContent = state.shell.t("next");

  applyReaderModeClass();
  window.addEventListener("reader-settings-changed", () => {
    const preserveRatio = currentChapterRatio();
    const prevEnabled = state.translationEnabled;
    const nextEnabled = (state.shell && typeof state.shell.getTranslationEnabled === "function")
      ? state.shell.getTranslationEnabled()
      : state.translationEnabled;
    const nextMode = (state.shell && typeof state.shell.getTranslationMode === "function")
      ? state.shell.getTranslationMode()
      : state.globalTranslationMode;
    const nextLocalSig = localTranslationSettingsSignature(state.shell);
    const localTranslationChanged = nextLocalSig !== state.globalTranslationLocalSig;
    const translationChanged = (nextEnabled !== state.translationEnabled)
      || (nextMode !== state.globalTranslationMode)
      || (["local", "hanviet", "dichngay_local"].includes(nextMode) && localTranslationChanged);
    state.translationEnabled = nextEnabled;
    state.globalTranslationMode = nextMode;
    state.globalTranslationLocalSig = nextLocalSig;
    if (translationChanged) {
      state.translateMode = nextMode;
      if (!nextEnabled) {
        state.mode = "raw";
      } else if (!prevEnabled && state.book && supportsTranslation(state.book)) {
        state.mode = "trans";
      }
      clearChapterCache();
      cancelPrefetch();
      syncModeButtons();
      loadBook()
        .then(() => loadChapter({ resetFlip: true, preserveRatio }))
        .catch((error) => state.shell.showToast(error.message || state.shell.t("toastError")));
      return;
    }
    applyReaderModeClass();
    resetFlipDragVisual();
    renderChapterContent(true, preserveRatio);
    updateProgress();
  });

  window.addEventListener("reader-cache-changed", (event) => {
    if (!state.bookId) return;
    if (!isCacheEventForCurrentBook(event && event.detail)) return;
    refreshReaderDownloadState().catch(() => {});
  });

  bindNameEditor();
  bindTtsControls();
  bindFlipDragGesture();
  bindReaderHotkeys();
  document.addEventListener("fullscreenchange", refreshFullscreenMode);
  refreshFullscreenMode();

  const query = state.shell.parseQuery();
  state.bookId = (query.book_id || "").trim();
  state.chapterId = (query.chapter_id || "").trim();
  state.translationSupportedHint = parseBooleanLike(query.translation_supported);
  state.isComicHint = parseBooleanLike(query.is_comic);
  const requestedMode = parseRequestedMode(query.mode);
  state.mode = requestedMode || "raw";
  state.translationEnabled = (state.shell && typeof state.shell.getTranslationEnabled === "function")
    ? state.shell.getTranslationEnabled()
    : true;
  state.globalTranslationLocalSig = localTranslationSettingsSignature(state.shell);
  const globalTranslateMode = (state.shell && typeof state.shell.getTranslationMode === "function")
    ? state.shell.getTranslationMode()
    : "server";
  state.globalTranslationMode = normalizeTranslateMode(globalTranslateMode);
  if (query.translation_mode) {
    state.translateMode = normalizeTranslateMode(query.translation_mode || "server");
  } else {
    state.translateMode = normalizeTranslateMode(globalTranslateMode);
  }
  if (!state.translationEnabled) {
    state.mode = "raw";
  }
  if (state.translationSupportedHint === false) {
    state.mode = "raw";
  }
  syncModeButtons();

  if (!state.bookId) {
    refs.readerBookTitle.textContent = state.shell.t("noBookSelected");
    refs.readerChapterSub.textContent = "";
    updateProgress();
    return;
  }

  showReaderHeadSkeleton(true);
  showReaderTocSkeleton(true, 10);
  showReaderContentSkeleton(true, { comic: Boolean(state.isComicHint) });
  await loadBook({ showSkeleton: true });
  await refreshNameEditorData();
  loadTtsPlugins().catch(() => {});
  if (!requestedMode && state.book) {
    const savedMode = parseRequestedMode(state.book.last_read_mode || "");
    state.mode = savedMode || "raw";
  }
  syncModeButtons();
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
  await loadChapter({ preserveRatio: initialRatio, showSkeleton: true });
  startReaderDownloadWatcher();

  refs.btnReaderToc.addEventListener("click", openToc);
  if (refs.btnReaderDownloadBook) {
    refs.btnReaderDownloadBook.addEventListener("click", () => {
      downloadBookFromReaderToc().catch((error) => {
        state.shell.showToast(error.message || state.shell.t("toastError"));
      });
    });
  }
  if (refs.btnReaderRefreshToc) {
    refs.btnReaderRefreshToc.addEventListener("click", () => {
      refreshReaderToc().catch((error) => {
        state.shell.showToast(error.message || state.shell.t("toastError"));
      });
    });
  }
  if (refs.btnFooterToc) refs.btnFooterToc.addEventListener("click", openToc);
  if (refs.btnOpenSettingsInline) {
    refs.btnOpenSettingsInline.addEventListener("click", () => {
      const topSettingsBtn = document.getElementById("btn-open-settings");
      if (topSettingsBtn) topSettingsBtn.click();
    });
  }
  if (refs.btnOpenBookInfo) {
    refs.btnOpenBookInfo.addEventListener("click", () => {
      if (!state.bookId) return;
      window.location.href = buildBookUrl(state.book || state.bookId, effectiveMode());
    });
  }
  if (refs.btnOpenRawEditor) {
    refs.btnOpenRawEditor.addEventListener("click", () => {
      openRawEditor().catch((error) => {
        state.shell.showToast(error.message || state.shell.t("toastError"));
      });
    });
  }
  refs.btnCloseReaderToc.addEventListener("click", closeToc);
  if (refs.btnReaderTocPrev) {
    refs.btnReaderTocPrev.addEventListener("click", () => {
      if (Number(state.readerTocPagination.page || 1) <= 1) return;
      state.readerTocPagination.page = Math.max(1, Number(state.readerTocPagination.page || 1) - 1);
      renderToc();
    });
  }
  if (refs.readerTocPageSelect) {
    refs.readerTocPageSelect.addEventListener("change", () => {
      const nextPage = Math.max(1, Number(refs.readerTocPageSelect.value || 1));
      if (nextPage === Number(state.readerTocPagination.page || 1)) return;
      state.readerTocPagination.page = nextPage;
      renderToc();
    });
  }
  if (refs.btnReaderTocNext) {
    refs.btnReaderTocNext.addEventListener("click", () => {
      if (Number(state.readerTocPagination.page || 1) >= Number(state.readerTocPagination.total_pages || 1)) return;
      state.readerTocPagination.page = Math.min(
        Number(state.readerTocPagination.total_pages || 1),
        Number(state.readerTocPagination.page || 1) + 1,
      );
      renderToc();
    });
  }
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
    if (state.translateMode === "server") state.translateMode = "local";
    else if (state.translateMode === "local") state.translateMode = "dichngay_local";
    else if (state.translateMode === "dichngay_local") state.translateMode = "hanviet";
    else state.translateMode = "server";
    clearChapterCache();
    cancelPrefetch();
    if (state.translateMode === "local") refs.btnTranslateMode.textContent = state.shell.t("modeLocal");
    else if (state.translateMode === "dichngay_local") refs.btnTranslateMode.textContent = state.shell.t("modeDichNgayLocal");
    else if (state.translateMode === "hanviet") refs.btnTranslateMode.textContent = state.shell.t("modeHanviet");
    else refs.btnTranslateMode.textContent = state.shell.t("modeServer");
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
  if (refs.btnCloseRawEditor) refs.btnCloseRawEditor.addEventListener("click", closeRawEditor);
  if (refs.btnCancelRawEditor) refs.btnCancelRawEditor.addEventListener("click", closeRawEditor);
  if (refs.rawEditorDialog) refs.rawEditorDialog.addEventListener("close", resetRawEditorState);
  if (refs.rawEditorForm) {
    refs.rawEditorForm.addEventListener("submit", (event) => {
      saveRawEditor(event).catch((error) => {
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
    scheduleProgressSave(280);
  });

  // Nếu trang đang scroll theo window (không phải scroll nội bộ), vẫn phải cập nhật tiến độ + lưu vị trí.
  window.addEventListener("scroll", () => {
    hideSelectionBtn();
    if (runtimeReadingMode() === "flip") return;
    updateProgress();
    updateMiniInfoVisibility();
    scheduleProgressSave(280);
  }, { passive: true });

  // Chỉ bắt sự kiện click vào vùng nội dung để toggle UI
  refs.readerContentScroll.addEventListener("click", onFullscreenContentClick);
  refs.readerContentBody.addEventListener("click", onFullscreenContentClick);
  refs.readerViewport.addEventListener("click", onFullscreenContentClick);

  // Wheel: passive false để có thể preventDefault ở mode flip/horizontal
  refs.readerContentScroll.addEventListener("wheel", onReaderWheel, { passive: false });
  document.addEventListener("wheel", onFullscreenHybridWheelFallback, { passive: false, capture: true });

  // Keydown: chỉ để exit fullscreen fallback
  document.addEventListener("keydown", onFullscreenKeydown, true);

  document.addEventListener("selectionchange", () => {
    scheduleSelectionMenuRefresh(80);
  });
  document.addEventListener("mouseup", () => {
    scheduleSelectionMenuRefresh(24);
  });
  document.addEventListener("touchend", () => {
    scheduleSelectionMenuRefresh(120);
  }, { passive: true });
  refs.readerContentBody.addEventListener("contextmenu", (event) => {
    if (!refs.readerContentBody.contains(event.target)) return;
    const sel = window.getSelection();
    if (sel && String(sel.toString() || "").trim()) {
      event.preventDefault();
    }
  });
  document.addEventListener("click", (event) => {
    if (refs.selectionActionMenu && refs.selectionActionMenu.contains(event.target)) {
      return;
    }
    if (refs.readerContentBody && refs.readerContentBody.contains(event.target) && activeReaderSelectionRange()) {
      scheduleSelectionMenuRefresh(40);
      return;
    }
    hideSelectionBtn();
  });

  // Nếu body/window scroll (một số layout) thì vẫn canh lại vị trí mini bars.
  // Throttle bằng rAF để tránh cập nhật liên tục gây giật trên mobile (browser chrome ẩn/hiện).
  let miniBarRafPending = false;
  window.addEventListener("scroll", () => {
    if (miniBarRafPending) return;
    miniBarRafPending = true;
    window.requestAnimationFrame(() => {
      miniBarRafPending = false;
      syncMiniBarLayout();
    });
  }, { passive: true });
  window.addEventListener("resize", () => {
    syncMiniBarLayout();
    updateProgress();
    updateMiniInfoVisibility();
  }, { passive: true });

  window.addEventListener("beforeunload", () => {
    stopTtsPlayback({ keepDialogOpen: true, preserveStatus: false });
    clearReaderDownloadWatcher();
  });
}

init();
