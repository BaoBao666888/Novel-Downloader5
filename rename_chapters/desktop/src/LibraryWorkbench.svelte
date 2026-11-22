<script lang="ts">
  import { onMount } from 'svelte';
  import {
    importLibrary, listLibrary, readLibrary, removeLibrary,
    type LibraryItem, type LibraryPage, type ReadingCursor,
  } from './studio';

  let books = $state<LibraryItem[]>([]);
  let selected = $state<number | null>(null);
  let query = $state('');
  let page = $state<LibraryPage | null>(null);
  let cursors = $state<Array<ReadingCursor | null>>([null]);
  let pending = $state<'load' | 'import' | 'read' | 'remove' | null>('load');
  let catalogError = $state('');
  let readError = $state('');
  let message = $state('');
  let reader: HTMLDivElement;
  let removeDialog: HTMLDialogElement;

  const current = $derived(books.find((book) => book.id === selected));
  const visible = $derived(books.filter((book) => book.title.toLowerCase().includes(query.trim().toLowerCase())));

  onMount(() => { void reload(); });

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
    page = null;
    cursors = [null];
    await loadPage(cursors);
  }

  async function loadPage(nextCursors: Array<ReadingCursor | null>) {
    if (selected === null || pending) return;
    pending = 'read';
    readError = '';
    try {
      page = await readLibrary(selected, nextCursors.at(-1) ?? null);
      cursors = nextCursors;
      reader.scrollTop = 0;
    } catch (cause) {
      readError = String(cause);
    } finally {
      pending = null;
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
      page = null;
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
    <p>Lưu và đọc các tệp truyện TXT trên máy.</p>
  </div>
  <button class="button primary" type="button" disabled={pending !== null} onclick={addBooks}>
    {pending === 'import' ? 'Đang mở…' : 'Thêm tệp TXT'}
  </button>
</section>

<div class="workspace">
  <aside class="shelf" aria-label="Tệp trong thư viện">
    <div class="shelf-head">
      <h2>Tệp đã lưu</h2>
      {#if books.length}
        <input type="search" aria-label="Tìm theo tên truyện" placeholder="Tìm theo tên truyện…" bind:value={query} />
      {/if}
    </div>
    {#if catalogError}
      <div class="notice error">
        <p role="alert">{catalogError}</p>
        <button class="button" type="button" disabled={pending !== null} onclick={reload}>Tải lại danh mục</button>
      </div>
    {:else if message}
      <p class="notice" role="status">{message}</p>
    {/if}
    {#if visible.length}
      <ul class="shelf-items">
        {#each visible as book (book.id)}
          <li>
            <button type="button" aria-pressed={selected === book.id} title={book.path}
              disabled={pending !== null} onclick={() => openBook(book.id)}>
              <span>{book.title}</span>
              <small>{book.path}</small>
            </button>
          </li>
        {/each}
      </ul>
    {:else if !catalogError}
      <p class="shelf-empty">{pending === 'load' ? 'Đang mở thư viện…' : books.length ? 'Không tìm thấy tên phù hợp.' : 'Chưa có tệp TXT.'}</p>
    {/if}
  </aside>

  <section class="proof reader" aria-label="Khung đọc" aria-busy={pending === 'read'}>
    {#if current}
      <header class="proof-head">
        <h2>{current.title}</h2>
        <button class="button" type="button" disabled={pending !== null} onclick={() => removeDialog.showModal()}>
          Bỏ khỏi thư viện
        </button>
      </header>
    {/if}
    {#if readError}
      <div class="notice error">
        <p role="alert">{readError}</p>
        {#if current}
          <button class="button" type="button" disabled={pending !== null} onclick={() => openBook(current.id)}>Mở lại từ trang đầu</button>
        {/if}
      </div>
    {/if}
    <!-- svelte-ignore a11y_no_noninteractive_tabindex (The scrollable reading region needs keyboard focus.) -->
    <div class="proof-body reading-body" bind:this={reader} role="region" tabindex="0" aria-label="Nội dung trang">
      {#if page?.text}
        <div class="reading-page">{page.text}</div>
      {:else if !readError}
        <div class="empty">
          {#if pending === 'read'}
            <h3>Đang đọc tệp…</h3>
          {:else if page}
            <h3>Tệp không có nội dung</h3>
          {:else}
            <h3>{books.length ? 'Chọn một truyện để đọc' : 'Thêm tệp TXT để bắt đầu đọc'}</h3>
          {/if}
        </div>
      {/if}
    </div>
    {#if page}
      <footer class="proof-footer">
        <span aria-live="polite">Trang {cursors.length}</span>
        <div class="proof-actions">
          <button class="button" type="button" disabled={pending !== null || cursors.length < 2}
            onclick={() => loadPage(cursors.slice(0, -1))}>Trang trước</button>
          <button class="button" type="button" disabled={pending !== null || !page.next}
            onclick={() => page?.next && loadPage([...cursors, page.next])}>Trang sau</button>
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
  .shelf-items { margin: 0; padding: 0; list-style: none; max-height: 40vh; overflow: auto; }
  .shelf-items button {
    width: 100%; min-height: 56px; display: grid; gap: 4px; padding: 8px 16px;
    text-align: start; border: 0; border-top: 1px solid var(--line);
    background: var(--sheet); color: var(--ink); font-weight: 600;
  }
  .shelf-items button:focus-visible { outline-offset: -3px; }
  .shelf-items button:hover:not(:disabled) { background: var(--inset); }
  .shelf-items button[aria-pressed="true"] {
    background: var(--selection); color: var(--accent); box-shadow: inset 3px 0 var(--accent);
  }
  .shelf-items span, .shelf-items small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .shelf-items small { color: var(--muted); font-size: 12px; font-weight: 400; }
  .shelf-empty { padding: 0 16px 16px; color: var(--muted); }
  .reader h2 { overflow-wrap: anywhere; }
  .reader .notice .button, .shelf .notice .button { margin-top: 8px; }
  .reading-body:focus-visible { outline-offset: -3px; }
  .reading-page {
    max-width: 69ch; margin-inline: auto; padding: 16px clamp(16px, 3vw, 32px);
    font: 400 18px/1.65 Cambria, "Times New Roman", serif;
    white-space: pre-wrap; overflow-wrap: anywhere;
  }
</style>
