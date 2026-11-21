<script lang="ts">
  import { tick } from 'svelte';
  import {
    chooseArchiveFile,
    chooseArchiveOutputDir,
    extractArchive,
    inspectArchive,
    previewArchiveEntry,
    type ArchiveEntry,
    type ArchivePreview,
    type EntryPreview,
    type ExtractOutcome,
  } from './studio';

  type Props = {
    python: string;
    onPickPython: () => Promise<void>;
    parentBusy: boolean;
  };

  let { python, onPickPython, parentBusy }: Props = $props();

  const PAGE_SIZE = 40;

  let archiveFile = $state('');
  let outputDir = $state('');
  let onlyTxt = $state(false);
  let overwrite = $state(false);
  let query = $state('');
  let page = $state(0);

  let preview = $state<ArchivePreview | null>(null);
  let selected = $state(new Set<number>());
  let outcome = $state<ExtractOutcome | null>(null);
  let entryPreview = $state<EntryPreview | null>(null);
  let busy = $state<'file' | 'outdir' | 'inspect' | 'preview' | 'extract' | null>(null);
  let error = $state('');

  let previewDialog: HTMLDialogElement;
  let confirmDialog: HTMLDialogElement;

  const isBusy = $derived(busy !== null || parentBusy);
  const filteredEntries = $derived.by(() => {
    const entries = preview?.info.entries ?? [];
    const q = query.trim().toLowerCase();
    return entries.filter((entry) => {
      if (onlyTxt && !entry.is_txt) return false;
      if (q && !entry.display_name.toLowerCase().includes(q)) return false;
      return true;
    });
  });
  const totalPages = $derived(Math.max(1, Math.ceil(filteredEntries.length / PAGE_SIZE)));
  const clampedPage = $derived(Math.min(page, totalPages - 1));
  const pagedEntries = $derived(
    filteredEntries.slice(clampedPage * PAGE_SIZE, (clampedPage + 1) * PAGE_SIZE),
  );
  const selectableVisible = $derived(filteredEntries.filter((e) => e.safe));
  const allVisibleChecked = $derived(
    selectableVisible.length > 0 && selectableVisible.every((e) => selected.has(e.index)),
  );

  function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  function toggleIndices(indices: number[], checked: boolean) {
    const next = new Set(selected);
    for (const idx of indices) {
      if (checked) next.add(idx);
      else next.delete(idx);
    }
    selected = next;
  }

  function selectAllSafe(txtOnly: boolean) {
    const entries = preview?.info.entries ?? [];
    selected = new Set(
      entries.filter((e) => e.safe && (!txtOnly || e.is_txt)).map((e) => e.index),
    );
  }

  async function pickArchive() {
    if (isBusy) return;
    busy = 'file';
    error = '';
    try {
      const picked = await chooseArchiveFile();
      if (picked) {
        archiveFile = picked.file;
        outputDir = picked.output_dir;
        preview = null;
        selected = new Set();
        outcome = null;
        page = 0;
        await runInspect();
      }
    } catch (cause) {
      error = String(cause);
    } finally {
      busy = null;
    }
  }

  async function pickOutputDir() {
    if (isBusy) return;
    busy = 'outdir';
    error = '';
    try {
      const dir = await chooseArchiveOutputDir();
      if (dir) outputDir = dir;
    } catch (cause) {
      error = String(cause);
    } finally {
      busy = null;
    }
  }

  async function runInspect() {
    if (!archiveFile) return;
    busy = 'inspect';
    error = '';
    outcome = null;
    page = 0;
    try {
      preview = await inspectArchive();
      outputDir = preview.output_dir;
      selected = new Set(preview.info.entries.filter((e) => e.safe).map((e) => e.index));
    } catch (cause) {
      preview = null;
      error = String(cause);
    } finally {
      busy = null;
    }
  }

  async function openEntryPreview(entry: ArchiveEntry) {
    if (!preview || isBusy || !entry.safe) return;
    busy = 'preview';
    error = '';
    try {
      entryPreview = await previewArchiveEntry(preview.revision, entry.index);
      await tick();
      previewDialog.showModal();
    } catch (cause) {
      error = String(cause);
    } finally {
      busy = null;
    }
  }

  async function confirmExtract() {
    confirmDialog.close();
    if (!preview || !selected.size || isBusy) return;
    busy = 'extract';
    error = '';
    outcome = null;
    try {
      outcome = await extractArchive(preview.revision, Array.from(selected), overwrite);
    } catch (cause) {
      error = String(cause);
    } finally {
      busy = null;
    }
  }
</script>

<section class="heading">
  <div>
    <h1>Giải nén &amp; Xem tệp nén</h1>
    <p>Quét danh sách chương trong tệp .zip, xem trước nội dung (tự nhận diện UTF-8/GB18030) và giải nén an toàn, giữ trọn tên có dấu “…”.</p>
  </div>
  <button class="button primary" type="button" onclick={pickArchive} disabled={isBusy}>
    {busy === 'file' ? 'Đang mở…' : archiveFile ? 'Đổi tệp .zip' : 'Chọn tệp .zip'}
  </button>
</section>

<div class="path-grid">
  <div class="folder-line">
    <span class="folder-label">Tệp nén</span>
    <span class="folder-path" title={archiveFile}>{archiveFile || 'Chưa chọn tệp .zip'}</span>
  </div>
  <div class="folder-line">
    <span class="folder-label">Thư mục giải nén</span>
    <span class="folder-path" title={outputDir}>{outputDir || 'Tự động tạo <tên_zip>_extracted'}</span>
    <button
      type="button"
      class="inline-action"
      onclick={pickOutputDir}
      disabled={!archiveFile || isBusy}
    >
      {busy === 'outdir' ? 'Đang mở…' : 'Đổi đích…'}
    </button>
  </div>
</div>

<div class="workspace">
  <aside aria-label="Tùy chọn giải nén">
    <h2>Tùy chọn giải nén</h2>
    <fieldset disabled={isBusy}>
      <label class="checkbox-field">
        <input type="checkbox" bind:checked={onlyTxt} onchange={() => (page = 0)} />
        <span>Chỉ hiển thị tệp .txt</span>
      </label>

      <label class="checkbox-field">
        <input type="checkbox" bind:checked={overwrite} />
        <span>Cho phép ghi đè tệp đã tồn tại</span>
      </label>

      {#if preview}
        <div class="stat-box">
          <div><span>Tổng số mục</span><strong>{preview.info.entries.length}</strong></div>
          <div><span>Tệp .txt hợp lệ</span><strong>{preview.info.txt_count}</strong></div>
          <div><span>Tổng dung lượng</span><strong>{formatBytes(preview.info.total_size)}</strong></div>
          {#if preview.info.blocked_count > 0}
            <div class="warn-stat">
              <span>Bị chặn (không an toàn)</span>
              <strong>{preview.info.blocked_count}</strong>
            </div>
          {/if}
        </div>

        <div class="tokens" aria-label="Chọn nhanh tệp">
          <button type="button" onclick={() => selectAllSafe(false)}>Chọn tất cả</button>
          <button type="button" onclick={() => selectAllSafe(true)}>Chỉ chọn .txt</button>
          <button type="button" onclick={() => (selected = new Set())}>Bỏ chọn</button>
        </div>
      {/if}
    </fieldset>

    <button
      class="button preview-button"
      type="button"
      onclick={runInspect}
      disabled={!archiveFile || isBusy}
    >
      {busy === 'inspect' ? 'Đang quét…' : 'Quét lại tệp nén'}
    </button>

    <div class="runtime">
      <span>Python · {python || 'Mặc định'}</span>
      <button type="button" class="runtime-button" onclick={onPickPython} disabled={isBusy}>
        Chọn Python…
      </button>
    </div>
  </aside>

  <section class="proof" aria-label="Danh sách tệp trong gói nén" aria-busy={isBusy}>
    <div class="proof-head">
      <div>
        <h2>Nội dung tệp nén</h2>
        {#if preview}
          <p class="summary">
            {preview.info.safe_count} mục an toàn · {selected.size} đang chọn
            {#if preview.info.blocked_count > 0}
              · {preview.info.blocked_count} bị chặn
            {/if}
          </p>
        {/if}
      </div>
      {#if preview?.info.entries.length}
        <input
          class="search"
          type="search"
          aria-label="Lọc tên tệp trong gói nén"
          placeholder="Lọc tên tệp…"
          bind:value={query}
          oninput={() => (page = 0)}
        />
      {/if}
    </div>

    {#if error}
      <p role="alert" class="notice error">{error}</p>
    {/if}

    {#if outcome}
      <div role="status" class="notice" class:error={outcome.failure !== null}>
        Đã giải nén <strong>{outcome.extracted.length}</strong> tệp vào <code>{outcome.output_dir}</code>.
        {#if outcome.failure}
          Dừng tại <strong>{outcome.failure.entry}</strong>: {outcome.failure.error}
        {/if}
      </div>
    {/if}

    <div class="proof-body">
      {#if preview && pagedEntries.length}
        {#if totalPages > 1}
          <div class="pager">
            <button
              type="button"
              class="button subtle"
              disabled={clampedPage === 0 || isBusy}
              onclick={() => (page = Math.max(0, clampedPage - 1))}
            >
              ← Trang trước
            </button>
            <span>Trang {clampedPage + 1} / {totalPages} ({filteredEntries.length} mục)</span>
            <button
              type="button"
              class="button subtle"
              disabled={clampedPage >= totalPages - 1 || isBusy}
              onclick={() => (page = Math.min(totalPages - 1, clampedPage + 1))}
            >
              Trang sau →
            </button>
          </div>
        {/if}

        <table>
          <thead>
            <tr>
              <th class="check-cell" scope="col">
                <input
                  type="checkbox"
                  aria-label="Chọn tất cả mục hợp lệ đang hiển thị"
                  checked={allVisibleChecked}
                  disabled={!selectableVisible.length || isBusy}
                  onchange={(e) =>
                    toggleIndices(
                      selectableVisible.map((item) => item.index),
                      e.currentTarget.checked,
                    )}
                />
              </th>
              <th scope="col">Tên tệp trong gói</th>
              <th class="size-col" scope="col">Kích thước</th>
              <th class="action-col" scope="col">Xem nhanh</th>
            </tr>
          </thead>
          <tbody>
            {#each pagedEntries as entry (entry.index)}
              <tr class:chosen={selected.has(entry.index)}>
                <td class="check-cell">
                  <input
                    type="checkbox"
                    aria-label={`Chọn ${entry.display_name}`}
                    checked={selected.has(entry.index)}
                    disabled={!entry.safe || isBusy}
                    onchange={(e) => toggleIndices([entry.index], e.currentTarget.checked)}
                  />
                </td>
                <td>
                  <span class="filename">{entry.display_name}</span>
                  {#if entry.issue}
                    <small class="row-error">{entry.issue}</small>
                  {:else if entry.is_txt}
                    <small>Văn bản .txt</small>
                  {/if}
                </td>
                <td class="size-col"><span>{formatBytes(entry.size)}</span></td>
                <td class="action-col">
                  {#if entry.safe && entry.is_txt}
                    <button
                      type="button"
                      class="mini-btn"
                      disabled={isBusy}
                      onclick={() => openEntryPreview(entry)}
                    >
                      Đọc thử
                    </button>
                  {:else}
                    <small>—</small>
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      {:else}
        <div class="empty">
          <div class="paper" aria-hidden="true"><span></span><span></span><span></span></div>
          {#if busy === 'inspect'}
            <h3>Đang đọc danh sách tệp nén…</h3>
          {:else if busy === 'extract'}
            <h3>Đang giải nén các tệp đã chọn…</h3>
          {:else if !archiveFile}
            <h3>Chọn tệp .zip chứa truyện</h3>
            <p>Hỗ trợ giải nén đủ tệp chứa dấu “…” trong tên, tự nhận diện tên tiếng Trung (UTF-8/GB18030) và chặn đường dẫn “..”.</p>
          {:else}
            <h3>Không có mục nào khớp bộ lọc</h3>
          {/if}
        </div>
      {/if}
    </div>

    <footer class="proof-footer">
      <span aria-live="polite">
        {selected.size ? `${selected.size} tệp đã chọn để giải nén` : 'Chưa chọn tệp'}
      </span>
      <button
        class="button primary"
        type="button"
        disabled={isBusy || !preview || selected.size === 0}
        onclick={() => confirmDialog.showModal()}
      >
        Giải nén {selected.size ? `${selected.size} tệp` : ''}
      </button>
    </footer>
  </section>
</div>

<dialog class="line-confirmation" bind:this={previewDialog} aria-labelledby="entry-preview-title">
  {#if entryPreview}
    <h2 id="entry-preview-title">{entryPreview.display_name}</h2>
    <p>
      Bảng mã phát hiện: <strong>{entryPreview.encoding}</strong>
      {#if entryPreview.truncated} · Đang hiển thị 16 KB đầu tiên{/if}
    </p>
    <pre class="archive-preview-body">{entryPreview.text}</pre>
  {/if}
  <div class="dialog-actions">
    <button type="button" class="button primary" onclick={() => previewDialog.close()}>Đóng</button>
  </div>
</dialog>

<dialog bind:this={confirmDialog} aria-labelledby="extract-confirm-title">
  <h2 id="extract-confirm-title">Giải nén {selected.size} tệp?</h2>
  <p title={outputDir}>Thư mục đích: <strong>{outputDir}</strong></p>
  {#if overwrite}
    <p class="row-error">Cảnh báo: Tệp trùng tên trong thư mục đích sẽ bị ghi đè.</p>
  {/if}
  <div class="dialog-actions">
    <button type="button" class="button" onclick={() => confirmDialog.close()}>Hủy</button>
    <button type="button" class="button primary" onclick={confirmExtract}>Xác nhận giải nén</button>
  </div>
</dialog>
