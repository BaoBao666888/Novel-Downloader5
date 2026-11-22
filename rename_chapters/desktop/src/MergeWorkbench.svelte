<script lang="ts">
  import {
    applyMerge,
    chooseMergeFolder,
    chooseMergeOutput,
    refreshMerge,
    type MergeEntry,
    type MergeOutcome,
    type MergePreview,
  } from './studio';

  type Props = {
    parentBusy: boolean;
  };

  let { parentBusy }: Props = $props();

  const PAGE_SIZE = 40;
  const SEPARATORS = [
    { id: 'blank2', label: 'Hai dòng trống (\\n\\n)', value: '\n\n' },
    { id: 'blank1', label: 'Một dòng xuống (\\n)', value: '\n' },
    { id: 'rule', label: 'Dòng gạch ngang (---)', value: '\n\n---\n\n' },
    { id: 'none', label: 'Nối liền không phân cách', value: '' },
  ] as const;

  let preview = $state<MergePreview | null>(null);
  let ordered = $state<MergeEntry[]>([]);
  let selected = $state(new Set<string>());
  let outputFile = $state('');
  let separatorId = $state<(typeof SEPARATORS)[number]['id']>('blank2');
  let includeHeading = $state(false);
  let overwrite = $state(false);
  let query = $state('');
  let page = $state(0);
  let outcome = $state<MergeOutcome | null>(null);
  let busy = $state<'folder' | 'output' | 'refresh' | 'apply' | null>(null);
  let error = $state('');

  let confirmDialog: HTMLDialogElement;

  const isBusy = $derived(busy !== null || parentBusy);
  const separatorValue = $derived(
    SEPARATORS.find((s) => s.id === separatorId)?.value ?? '\n\n',
  );
  const filtered = $derived.by(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ordered;
    return ordered.filter(
      (entry) =>
        entry.filename.toLowerCase().includes(q) ||
        entry.first_line.toLowerCase().includes(q),
    );
  });
  const totalPages = $derived(Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)));
  const clampedPage = $derived(Math.min(page, totalPages - 1));
  const paged = $derived(
    filtered.slice(clampedPage * PAGE_SIZE, (clampedPage + 1) * PAGE_SIZE),
  );
  const chosenOrdered = $derived(ordered.filter((e) => selected.has(e.filename)));
  const allFilteredChecked = $derived(
    filtered.length > 0 && filtered.every((e) => selected.has(e.filename)),
  );

  function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  function applyPreview(next: MergePreview) {
    preview = next;
    outputFile = next.output_file;
    ordered = [...next.info.entries];
    selected = new Set(next.info.entries.map((e) => e.filename));
    page = 0;
  }

  async function pickFolder() {
    if (isBusy) return;
    busy = 'folder';
    error = '';
    outcome = null;
    try {
      const picked = await chooseMergeFolder();
      if (picked) applyPreview(picked);
    } catch (cause) {
      error = String(cause);
    } finally {
      busy = null;
    }
  }

  async function pickOutput() {
    if (isBusy) return;
    busy = 'output';
    error = '';
    try {
      const path = await chooseMergeOutput();
      if (path) outputFile = path;
    } catch (cause) {
      error = String(cause);
    } finally {
      busy = null;
    }
  }

  async function rescan() {
    if (!preview || isBusy) return;
    busy = 'refresh';
    error = '';
    outcome = null;
    try {
      applyPreview(await refreshMerge());
    } catch (cause) {
      error = String(cause);
    } finally {
      busy = null;
    }
  }

  function toggleNames(names: string[], checked: boolean) {
    const next = new Set(selected);
    for (const name of names) {
      if (checked) next.add(name);
      else next.delete(name);
    }
    selected = next;
  }

  function moveEntry(filename: string, delta: -1 | 1) {
    const idx = ordered.findIndex((e) => e.filename === filename);
    const target = idx + delta;
    if (idx < 0 || target < 0 || target >= ordered.length) return;
    const copy = [...ordered];
    [copy[idx], copy[target]] = [copy[target], copy[idx]];
    ordered = copy;
  }

  function reverseOrder() {
    ordered = [...ordered].reverse();
  }

  async function confirmMerge() {
    confirmDialog.close();
    if (!preview || chosenOrdered.length === 0 || isBusy) return;
    busy = 'apply';
    error = '';
    outcome = null;
    try {
      outcome = await applyMerge(preview.revision, {
        filenames: chosenOrdered.map((e) => e.filename),
        separator: separatorValue,
        include_filename_heading: includeHeading,
        overwrite,
      });
    } catch (cause) {
      error = String(cause);
    } finally {
      busy = null;
    }
  }
</script>

<section class="heading">
  <div>
    <h1>Ghép tệp TXT</h1>
    <p>Gộp nhiều tệp chương .txt trong thư mục thành một tệp duy nhất theo thứ tự tự nhiên, không ghi đè ngoài ý muốn.</p>
  </div>
  <button class="button primary" type="button" onclick={pickFolder} disabled={isBusy}>
    {busy === 'folder' ? 'Đang mở…' : preview ? 'Đổi thư mục' : 'Chọn thư mục'}
  </button>
</section>

<div class="path-grid">
  <div class="folder-line">
    <span class="folder-label">Thư mục nguồn</span>
    <span class="folder-path" title={preview?.info.folder}>
      {preview?.info.folder || 'Chưa chọn thư mục chứa tệp .txt'}
    </span>
  </div>
  <div class="folder-line">
    <span class="folder-label">Tệp xuất</span>
    <span class="folder-path" title={outputFile}>
      {outputFile || 'Tự động tạo <thư_mục>_merged.txt'}
    </span>
    <button
      type="button"
      class="inline-action"
      onclick={pickOutput}
      disabled={!preview || isBusy}
    >
      {busy === 'output' ? 'Đang mở…' : 'Đổi đích…'}
    </button>
  </div>
</div>

<div class="workspace">
  <aside aria-label="Tùy chọn ghép tệp">
    <h2>Tùy chọn ghép tệp</h2>
    <fieldset disabled={isBusy}>
      <label for="merge-sep">Dấu phân cách giữa các tệp</label>
      <select id="merge-sep" bind:value={separatorId}>
        {#each SEPARATORS as sep (sep.id)}
          <option value={sep.id}>{sep.label}</option>
        {/each}
      </select>

      <label class="checkbox-field">
        <input type="checkbox" bind:checked={includeHeading} />
        <span>Chèn tên tệp làm tiêu đề trước mỗi phần</span>
      </label>

      <label class="checkbox-field">
        <input type="checkbox" bind:checked={overwrite} />
        <span>Cho phép ghi đè nếu tệp đích đã tồn tại</span>
      </label>

      {#if preview}
        <div class="stat-box">
          <div><span>Tổng tệp .txt</span><strong>{ordered.length}</strong></div>
          <div><span>Đang chọn ghép</span><strong>{chosenOrdered.length}</strong></div>
          <div><span>Tổng dung lượng</span><strong>{formatBytes(preview.info.total_size)}</strong></div>
        </div>

        <div class="tokens" aria-label="Sắp xếp nhanh">
          <button type="button" onclick={reverseOrder}>Đảo thứ tự</button>
          <button type="button" onclick={() => (selected = new Set(ordered.map((e) => e.filename)))}>
            Chọn hết
          </button>
          <button type="button" onclick={() => (selected = new Set())}>Bỏ chọn</button>
        </div>
      {/if}
    </fieldset>

    <button
      class="button preview-button"
      type="button"
      onclick={rescan}
      disabled={!preview || isBusy}
    >
      {busy === 'refresh' ? 'Đang quét…' : 'Quét lại thư mục'}
    </button>
  </aside>

  <section class="proof" aria-label="Thứ tự tệp sẽ ghép" aria-busy={isBusy}>
    <div class="proof-head">
      <div>
        <h2>Thứ tự ghép chương</h2>
        {#if preview}
          <p class="summary">
            {chosenOrdered.length} / {ordered.length} tệp sẽ được ghép thành một tệp UTF-8
          </p>
        {/if}
      </div>
      {#if ordered.length}
        <input
          class="search"
          type="search"
          aria-label="Lọc tên tệp hoặc dòng đầu"
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
      <div role="status" class="notice">
        Đã ghép <strong>{outcome.merged_count}</strong> tệp ({outcome.total_chars.toLocaleString('vi-VN')} ký tự) vào
        <code>{outcome.output_file}</code>.
      </div>
    {/if}

    <div class="proof-body">
      {#if preview && paged.length}
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
            <span>Trang {clampedPage + 1} / {totalPages} ({filtered.length} tệp)</span>
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
                  aria-label="Chọn tất cả tệp đang hiển thị"
                  checked={allFilteredChecked}
                  disabled={!filtered.length || isBusy}
                  onchange={(e) =>
                    toggleNames(
                      filtered.map((item) => item.filename),
                      e.currentTarget.checked,
                    )}
                />
              </th>
              <th scope="col">Tệp &amp; dòng đầu</th>
              <th class="size-col" scope="col">Kích thước</th>
              <th class="action-col" scope="col">Thứ tự</th>
            </tr>
          </thead>
          <tbody>
            {#each paged as entry (entry.filename)}
              <tr class:chosen={selected.has(entry.filename)}>
                <td class="check-cell">
                  <input
                    type="checkbox"
                    aria-label={`Chọn ${entry.filename}`}
                    checked={selected.has(entry.filename)}
                    disabled={isBusy}
                    onchange={(e) => toggleNames([entry.filename], e.currentTarget.checked)}
                  />
                </td>
                <td>
                  <span class="filename">{entry.filename}</span>
                  {#if entry.first_line}
                    <small>{entry.first_line}</small>
                  {/if}
                </td>
                <td class="size-col"><span>{formatBytes(entry.size)}</span></td>
                <td class="action-col">
                  <button
                    type="button"
                    class="mini-btn"
                    title="Đưa lên trên"
                    disabled={isBusy || ordered[0]?.filename === entry.filename}
                    onclick={() => moveEntry(entry.filename, -1)}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    class="mini-btn"
                    title="Đưa xuống dưới"
                    disabled={isBusy || ordered.at(-1)?.filename === entry.filename}
                    onclick={() => moveEntry(entry.filename, 1)}
                  >
                    ↓
                  </button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      {:else}
        <div class="empty">
          <div class="paper" aria-hidden="true"><span></span><span></span><span></span></div>
          {#if !preview}
            <h3>Chọn thư mục chứa các chương .txt</h3>
            <p>Các tệp được tự động sắp xếp tự nhiên (2.txt trước 10.txt) và chạy thuần Rust.</p>
          {:else if ordered.length === 0}
            <h3>Thư mục chưa có tệp .txt nào</h3>
          {:else}
            <h3>Không có tệp nào khớp bộ lọc</h3>
          {/if}
        </div>
      {/if}
    </div>

    <footer class="proof-footer">
      <span aria-live="polite">
        {chosenOrdered.length
          ? `${chosenOrdered.length} tệp đã chọn${overwrite ? ' (cho phép ghi đè)' : ' (không ghi đè)'}`
          : 'Chưa chọn tệp'}
      </span>
      <button
        class="button primary"
        type="button"
        disabled={isBusy || !preview || chosenOrdered.length === 0}
        onclick={() => confirmDialog.showModal()}
      >
        Ghép {chosenOrdered.length ? `${chosenOrdered.length} tệp` : ''}
      </button>
    </footer>
  </section>
</div>

<dialog bind:this={confirmDialog} aria-labelledby="merge-confirm-title">
  <h2 id="merge-confirm-title">Ghép {chosenOrdered.length} tệp .txt?</h2>
  <p title={outputFile}>Tệp xuất: <strong>{outputFile}</strong></p>
  {#if overwrite}
    <p class="row-error">Cảnh báo: Tệp đích hiện có sẽ bị ghi đè.</p>
  {/if}
  <ul>
    {#each chosenOrdered.slice(0, 5) as entry (entry.filename)}
      <li><span>{entry.filename}</span><strong>{entry.first_line || '(không có dòng đầu)'}</strong></li>
    {/each}
  </ul>
  {#if chosenOrdered.length > 5}
    <p>Và {chosenOrdered.length - 5} tệp khác theo thứ tự đã chọn.</p>
  {/if}
  <div class="dialog-actions">
    <button type="button" class="button" onclick={() => confirmDialog.close()}>Hủy</button>
    <button type="button" class="button primary" onclick={confirmMerge}>Xác nhận ghép tệp</button>
  </div>
</dialog>
