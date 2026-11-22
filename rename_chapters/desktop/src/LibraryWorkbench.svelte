<script lang="ts">
  import { onMount } from 'svelte';
  import {
    importLibrary,
    listLibrary,
    listLibraryChapters,
    readLibrary,
    readLibraryChapter,
    removeLibrary,
    type LibraryChapterContent,
    type LibraryChapterList,
    type LibraryItem,
    type LibraryPage,
    type ReadingCursor,
  } from './studio';

  let books = $state<LibraryItem[]>([]);
  let selected = $state<number | null>(null);
  let query = $state('');
  let readMode = $state<'chapter' | 'page'>('chapter');

  // Chapter reader state
  let toc = $state<LibraryChapterList | null>(null);
  let chapter = $state<LibraryChapterContent | null>(null);
  let tocOpen = $state(false);
  let tocQuery = $state('');

  // Stream page reader state (for plain TXT without chapters or user toggle)
  let page = $state<LibraryPage | null>(null);
  let cursors = $state<Array<ReadingCursor | null>>([null]);

  let pending = $state<'load' | 'import' | 'read' | 'remove' | null>('load');
  let catalogError = $state('');
  let readError = $state('');
  let message = $state('');
  let reader: HTMLDivElement;
  let removeDialog: HTMLDialogElement;

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

  onMount(() => {
    void reload();
  });

  function formatSize(bytes: number): string {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function savedChapterIndex(bookId: number): number {
    try {
      const raw = localStorage.getItem(`novel-studio-lib-ch-${bookId}`);
      const parsed = raw ? Number(raw) : 0;
      return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0;
    } catch {
      return 0;
    }
  }

  function persistChapterIndex(bookId: number, idx: number) {
    try {
      localStorage.setItem(`novel-studio-lib-ch-${bookId}`, String(idx));
    } catch {
      // ignore storage errors
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

  async function openBook(id: number) {
    if (pending) return;
    selected = id;
    toc = null;
    chapter = null;
    page = null;
    cursors = [null];
    tocOpen = false;
    tocQuery = '';
    readError = '';
    pending = 'read';
    try {
      const list = await listLibraryChapters(id);
      toc = list;
      if (list.chapters.length > 0) {
        readMode = 'chapter';
        const target = Math.min(savedChapterIndex(id), list.chapters.length - 1);
        chapter = await readLibraryChapter(id, target);
        persistChapterIndex(id, target);
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

  async function openChapter(index: number) {
    if (selected === null || pending) return;
    pending = 'read';
    readError = '';
    try {
      chapter = await readLibraryChapter(selected, index);
      readMode = 'chapter';
      persistChapterIndex(selected, index);
      tocOpen = false;
      if (reader) reader.scrollTop = 0;
    } catch (cause) {
      readError = String(cause);
    } finally {
      pending = null;
    }
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
</script>

<section class="heading">
  <div>
    <h1>Thư viện</h1>
    <p>Lưu và đọc truyện từ tệp TXT hoặc gói ZIP theo mục lục chương, giữ nguyên tệp gốc trên máy.</p>
  </div>
  <button class="button primary" type="button" disabled={pending !== null} onclick={addBooks}>
    {pending === 'import' ? 'Đang mở…' : 'Thêm TXT / ZIP'}
  </button>
</section>

<div class="workspace">
  <aside class="shelf" aria-label="Tệp trong thư viện">
    <div class="shelf-head">
      <h2>Tệp đã lưu</h2>
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
                <small>{book.path}</small>
                {#if book.size > 0}
                  <small class="num-stat">{formatSize(book.size)}</small>
                {/if}
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
            ? 'Không tìm thấy tên phù hợp.'
            : 'Chưa có truyện nào. Bấm Thêm TXT / ZIP để bắt đầu.'}
      </p>
    {/if}
  </aside>

  <section class="proof reader" aria-label="Khung đọc" aria-busy={pending === 'read'}>
    {#if current}
      <header class="proof-head">
        <div class="reader-title-group">
          <h2>{current.title}</h2>
          {#if readMode === 'chapter' && chapter}
            <p class="summary num-stat">
              {chapter.title} · Chương {chapter.index + 1}/{chapter.total_chapters} · {chapter.encoding}
            </p>
          {:else if readMode === 'page' && page}
            <p class="summary num-stat">Chế độ đọc theo trang · Trang {cursors.length}</p>
          {/if}
        </div>
        <div class="proof-actions">
          {#if hasChapters}
            <button
              class="button subtle"
              type="button"
              aria-expanded={tocOpen}
              disabled={pending !== null}
              onclick={() => (tocOpen = !tocOpen)}
            >
              Mục lục ({toc?.chapters.length ?? 0})
            </button>
          {/if}
          {#if current.kind === 'txt' && hasChapters}
            <button
              class="button subtle"
              type="button"
              disabled={pending !== null}
              onclick={toggleReadMode}
            >
              {readMode === 'chapter' ? 'Đọc theo trang' : 'Đọc theo chương'}
            </button>
          {/if}
          <button
            class="button subtle"
            type="button"
            disabled={pending !== null}
            onclick={() => removeDialog.showModal()}
          >
            Bỏ khỏi thư viện
          </button>
        </div>
      </header>
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
                <small class="num-stat">{formatSize(item.size)}</small>
              </button>
            </li>
          {/each}
        </ul>
      </div>
    {/if}

    <!-- svelte-ignore a11y_no_noninteractive_tabindex (The scrollable reading region needs keyboard focus.) -->
    <div class="proof-body reading-body" bind:this={reader} role="region" tabindex="0" aria-label="Nội dung trang">
      {#if readMode === 'chapter' && chapter}
        <article class="reading-page">
          <h3 class="chapter-heading">{chapter.title}</h3>
          {#if chapter.truncated}
            <p class="notice">Chương vượt quá 2 MB, đang hiển thị phần đầu.</p>
          {/if}
          <div class="chapter-text">{chapter.text}</div>
        </article>
      {:else if readMode === 'page' && page?.text}
        <div class="reading-page">{page.text}</div>
      {:else if !readError}
        <div class="empty">
          <div class="paper" aria-hidden="true"><span></span><span></span><span></span></div>
          {#if pending === 'read'}
            <h3>Đang mở truyện…</h3>
          {:else if page}
            <h3>Tệp không có nội dung</h3>
          {:else}
            <h3>{books.length ? 'Chọn một truyện để đọc' : 'Thêm TXT hoặc ZIP để bắt đầu đọc'}</h3>
            <p>Tệp ZIP được đọc trực tiếp từng chương theo mục lục, không cần giải nén ra đĩa.</p>
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

<dialog bind:this={removeDialog} aria-labelledby="remove-book-title">
  <h2 id="remove-book-title">Bỏ khỏi thư viện?</h2>
  <p>{current?.title}. Tệp gốc vẫn ở vị trí hiện tại trên máy.</p>
  <div class="dialog-actions">
    <button type="button" class="button" onclick={() => removeDialog.close()}>Hủy</button>
    <button type="button" class="button primary" onclick={removeBook}>Bỏ khỏi thư viện</button>
  </div>
</dialog>

<style>
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
    width: 100%; display: grid; grid-template-columns: 40px minmax(0, 1fr) auto;
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
  .toc-list small { color: var(--muted); font-size: 11.5px; }

  .reading-body:focus-visible { outline-offset: -3px; }
  .reading-page {
    max-width: 68ch; margin-inline: auto; padding: 20px clamp(16px, 3vw, 34px) 28px;
    font: 400 18px/1.72 Cambria, "Times New Roman", serif;
    white-space: pre-wrap; overflow-wrap: anywhere;
  }
  .chapter-heading {
    font: 600 22px/1.3 Cambria, "Times New Roman", serif;
    letter-spacing: -0.015em;
    color: var(--ink);
    margin: 0 0 18px;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--line);
  }
  .chapter-text { white-space: pre-wrap; }
</style>
