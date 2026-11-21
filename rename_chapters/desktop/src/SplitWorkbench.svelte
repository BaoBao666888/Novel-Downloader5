<script lang="ts">
  import { tick } from 'svelte';
  import {
    addSplitBoundary,
    applySplit,
    chooseSplitFile,
    chooseSplitOutputDir,
    mergeSplitBoundary,
    nudgeSplitBoundary,
    previewSplit,
    redoSplit,
    refreshSplitView,
    renameSplitBoundary,
    searchSplitText,
    undoSplit,
    type PrefaceMode,
    type SplitOutcome,
    type SplitPart,
    type SplitPreview,
    type SplitSearchHit,
  } from './studio';

  type Props = {
    python: string;
    onPickPython: () => Promise<void>;
    parentBusy: boolean;
  };

  let { python, onPickPython, parentBusy }: Props = $props();

  const REGEX_PRESETS = [
    { label: '第N章', pattern: '^\\s*第[0-9零一二三四五六七八九十百千万两]+章.*$' },
    { label: 'Chương N', pattern: '^\\s*Chương\\s+\\d+.*$' },
    { label: 'Ch. N', pattern: '^\\s*Chapter\\s+[0-9IVXLCDM]+.*$' },
    { label: '---', pattern: '^\\s*-{3,}\\s*$' },
  ];

  const PAGE_SIZE = 30;

  let sourceFile = $state('');
  let outputDir = $state('');
  let pattern = $state('^\\s*第[0-9零一二三四五六七八九十百千万两]+章.*$');
  let position = $state<'before' | 'after'>('before');
  let prefaceMode = $state<PrefaceMode>('separate');
  let nameFormat = $state('part_{num}.txt');
  let overwrite = $state(false);

  let preview = $state<SplitPreview | null>(null);
  let outcome = $state<SplitOutcome | null>(null);
  let query = $state('');
  let page = $state(0);
  let expandedContext = $state(new Set<number>());
  let busy = $state<'file' | 'outdir' | 'preview' | 'edit' | 'search' | 'apply' | null>(null);
  let error = $state('');
  let needsPreview = $state(false);

  // Add-boundary dialog state
  let addDialog: HTMLDialogElement;
  let searchQuery = $state('');
  let searchHits = $state<SplitSearchHit[]>([]);
  let hasSearched = $state(false);

  // Rename-boundary dialog state
  let renameDialog: HTMLDialogElement;
  let editingPart = $state<SplitPart | null>(null);
  let editingTitle = $state('');

  // Confirm-apply dialog
  let confirmDialog: HTMLDialogElement;
  let nameFormatInput: HTMLInputElement;

  const isBusy = $derived(busy !== null || parentBusy);
  const filteredParts = $derived.by(() => {
    const parts = preview?.parts ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return parts;
    return parts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        (p.filename?.toLowerCase().includes(q) ?? false) ||
        p.preview.toLowerCase().includes(q),
    );
  });
  const totalPages = $derived(Math.max(1, Math.ceil(filteredParts.length / PAGE_SIZE)));
  const clampedPage = $derived(Math.min(page, totalPages - 1));
  const pagedParts = $derived(
    filteredParts.slice(clampedPage * PAGE_SIZE, (clampedPage + 1) * PAGE_SIZE),
  );
  const warningCount = $derived(
    (preview?.parts ?? []).filter((p) => p.warnings.length > 0).length,
  );
  const writableParts = $derived((preview?.parts ?? []).filter((p) => !p.is_empty));

  function markStale() {
    if (preview) needsPreview = true;
    preview = null;
    outcome = null;
    expandedContext = new Set();
    error = '';
  }

  function applyPreset(presetPattern: string) {
    pattern = presetPattern;
    markStale();
  }

  function insertToken(token: string) {
    const start = nameFormatInput.selectionStart ?? nameFormat.length;
    const end = nameFormatInput.selectionEnd ?? start;
    nameFormat = nameFormat.slice(0, start) + token + nameFormat.slice(end);
    syncViewOptions();
    requestAnimationFrame(() => {
      nameFormatInput.focus();
      nameFormatInput.setSelectionRange(start + token.length, start + token.length);
    });
  }

  async function pickSourceFile() {
    if (isBusy) return;
    busy = 'file';
    error = '';
    try {
      const result = await chooseSplitFile();
      if (result) {
        sourceFile = result.file;
        outputDir = result.output_dir;
        preview = null;
        outcome = null;
        expandedContext = new Set();
        needsPreview = false;
        page = 0;
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
      const dir = await chooseSplitOutputDir();
      if (dir) {
        outputDir = dir;
        if (preview) {
          preview = await refreshSplitView(preview.revision, prefaceMode, nameFormat);
        }
      }
    } catch (cause) {
      error = String(cause);
    } finally {
      busy = null;
    }
  }

  async function runPreview() {
    if (!sourceFile || isBusy) return;
    busy = 'preview';
    error = '';
    outcome = null;
    expandedContext = new Set();
    page = 0;
    try {
      preview = await previewSplit({
        pattern,
        position,
        preface_mode: prefaceMode,
        name_format: nameFormat,
      });
      outputDir = preview.output_dir;
      needsPreview = false;
    } catch (cause) {
      preview = null;
      error = String(cause);
    } finally {
      busy = null;
    }
  }

  async function syncViewOptions() {
    if (!preview || isBusy) return;
    error = '';
    try {
      preview = await refreshSplitView(preview.revision, prefaceMode, nameFormat);
    } catch (cause) {
      error = String(cause);
    }
  }

  async function runBoundaryMutation(action: () => Promise<SplitPreview>) {
    if (!preview || isBusy) return;
    busy = 'edit';
    error = '';
    outcome = null;
    try {
      preview = await action();
    } catch (cause) {
      error = String(cause);
    } finally {
      busy = null;
    }
  }

  function toggleContext(boundaryIndex: number) {
    const next = new Set(expandedContext);
    if (next.has(boundaryIndex)) next.delete(boundaryIndex);
    else next.add(boundaryIndex);
    expandedContext = next;
  }

  async function openRenameDialog(part: SplitPart) {
    editingPart = part;
    editingTitle = part.title;
    await tick();
    renameDialog.showModal();
  }

  async function saveBoundaryTitle() {
    if (!preview || !editingPart) return;
    const part = editingPart;
    const title = editingTitle.trim();
    if (!title) return;
    renameDialog.close();
    await runBoundaryMutation(() =>
      renameSplitBoundary(preview!.revision, part.boundary_index, title, prefaceMode, nameFormat),
    );
  }

  async function openAddDialog() {
    if (!preview || isBusy) return;
    searchQuery = '';
    searchHits = [];
    hasSearched = false;
    await tick();
    addDialog.showModal();
  }

  async function runSearch() {
    if (!preview || !searchQuery.trim() || busy === 'search') return;
    busy = 'search';
    error = '';
    try {
      searchHits = await searchSplitText(preview.revision, searchQuery);
      hasSearched = true;
    } catch (cause) {
      error = String(cause);
    } finally {
      busy = null;
    }
  }

  async function pickSearchHit(hit: SplitSearchHit) {
    if (!preview) return;
    addDialog.close();
    await runBoundaryMutation(() =>
      addSplitBoundary(preview!.revision, hit.line_start_byte, null, prefaceMode, nameFormat),
    );
  }

  async function confirmSplit() {
    confirmDialog.close();
    if (!preview || !preview.writable_count || isBusy) return;
    busy = 'apply';
    error = '';
    outcome = null;
    try {
      outcome = await applySplit(preview.revision, prefaceMode, nameFormat, overwrite);
    } catch (cause) {
      error = String(cause);
    } finally {
      busy = null;
    }
  }
</script>

<section class="heading">
  <div>
    <h1>Chia chương</h1>
    <p>Phát hiện mốc chia bằng regex, tinh chỉnh ranh giới trực quan rồi xuất thành từng tệp chương.</p>
  </div>
  <button class="button primary" type="button" onclick={pickSourceFile} disabled={isBusy}>
    {busy === 'file' ? 'Đang mở…' : sourceFile ? 'Đổi tệp nguồn' : 'Chọn tệp .txt'}
  </button>
</section>

<div class="path-grid">
  <div class="folder-line">
    <span class="folder-label">Tệp nguồn</span>
    <span class="folder-path" title={sourceFile}>{sourceFile || 'Chưa chọn tệp .txt'}</span>
  </div>
  <div class="folder-line">
    <span class="folder-label">Thư mục xuất</span>
    <span class="folder-path" title={outputDir}>{outputDir || 'Tự động tạo <tên_file>_split'}</span>
    <button
      type="button"
      class="inline-action"
      onclick={pickOutputDir}
      disabled={!sourceFile || isBusy}
    >
      {busy === 'outdir' ? 'Đang mở…' : 'Đổi đích…'}
    </button>
  </div>
</div>

<div class="workspace">
  <aside aria-label="Quy tắc chia chương">
    <h2>Quy tắc chia chương</h2>
    <fieldset disabled={isBusy}>
      <label for="split-regex">Regex điểm chia</label>
      <input
        id="split-regex"
        class="format"
        bind:value={pattern}
        oninput={markStale}
        placeholder="Ví dụ: ^第\d+章"
      />
      <div class="tokens" aria-label="Mẫu regex gợi ý">
        {#each REGEX_PRESETS as preset (preset.label)}
          <button type="button" onclick={() => applyPreset(preset.pattern)}>{preset.label}</button>
        {/each}
      </div>

      <label for="split-position">Vị trí cắt</label>
      <select id="split-position" bind:value={position} onchange={markStale}>
        <option value="before">Trước dòng khớp (giữ tiêu đề)</option>
        <option value="after">Sau chuỗi khớp</option>
      </select>

      <label for="split-preface">Xử lý phần mở đầu</label>
      <select id="split-preface" bind:value={prefaceMode} onchange={syncViewOptions}>
        <option value="separate">Tách thành tệp riêng</option>
        <option value="merge">Gộp vào chương đầu tiên</option>
        <option value="remove">Bỏ qua phần mở đầu</option>
      </select>

      <label for="split-format">Mẫu tên tệp xuất</label>
      <input
        id="split-format"
        class="format"
        bind:this={nameFormatInput}
        bind:value={nameFormat}
        oninput={syncViewOptions}
      />
      <div class="tokens" aria-label="Chèn biến số thứ tự">
        <button type="button" onclick={() => insertToken('{num}')}>{'{num}'}</button>
        <button type="button" onclick={() => insertToken('{num+1}')}>{'{num+1}'}</button>
      </div>

      <label class="checkbox-field">
        <input type="checkbox" bind:checked={overwrite} />
        <span>Cho phép ghi đè tệp đã có trong thư mục xuất</span>
      </label>
    </fieldset>

    <button
      class="button preview-button"
      type="button"
      onclick={runPreview}
      disabled={!sourceFile || !pattern.trim() || isBusy}
    >
      {busy === 'preview' ? 'Đang phân tích…' : 'Xem trước chia chương'}
    </button>

    <div class="runtime">
      <span>Python · {python || 'Mặc định'}</span>
      <button type="button" class="runtime-button" onclick={onPickPython} disabled={isBusy}>
        Chọn Python…
      </button>
    </div>
  </aside>

  <section class="proof" aria-label="Danh sách mốc chia" aria-busy={isBusy}>
    <div class="proof-head">
      <div>
        <h2>Mốc chia chương</h2>
        {#if preview}
          <p class="summary">
            {preview.parts.length} phần · {preview.writable_count} tệp sẽ xuất{warningCount ? ` · ${warningCount} lưu ý` : ''}
          </p>
        {/if}
      </div>

      {#if preview}
        <div class="split-toolbar">
          <button
            type="button"
            class="button subtle"
            disabled={isBusy}
            onclick={openAddDialog}
          >
            + Thêm mốc
          </button>
          <button
            type="button"
            class="button subtle icon-btn"
            aria-label="Hoàn tác chỉnh mốc"
            title="Hoàn tác chỉnh mốc"
            disabled={!preview.can_undo || isBusy}
            onclick={() =>
              runBoundaryMutation(() => undoSplit(preview!.revision, prefaceMode, nameFormat))}
          >
            ↶
          </button>
          <button
            type="button"
            class="button subtle icon-btn"
            aria-label="Làm lại chỉnh mốc"
            title="Làm lại chỉnh mốc"
            disabled={!preview.can_redo || isBusy}
            onclick={() =>
              runBoundaryMutation(() => redoSplit(preview!.revision, prefaceMode, nameFormat))}
          >
            ↷
          </button>
          <input
            class="search"
            type="search"
            aria-label="Lọc mốc chia"
            placeholder="Lọc tiêu đề…"
            bind:value={query}
            oninput={() => (page = 0)}
          />
        </div>
      {/if}
    </div>

    {#if error}
      <p role="alert" class="notice error">{error}</p>
    {/if}

    {#if outcome}
      <div role="status" class="notice" class:error={outcome.failure !== null}>
        Đã xuất <strong>{outcome.written.length}</strong> tệp vào <code>{outcome.output_dir}</code>.
        {#if outcome.skipped_empty > 0}
          Bỏ qua {outcome.skipped_empty} phần rỗng.
        {/if}
        {#if outcome.failure}
          Dừng tại <strong>{outcome.failure.filename}</strong>: {outcome.failure.error}
        {/if}
      </div>
    {/if}

    <div class="proof-body">
      {#if preview && pagedParts.length}
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
            <span>Trang {clampedPage + 1} / {totalPages} ({filteredParts.length} mục)</span>
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

        <ul class="boundary-list">
          {#each pagedParts as part (part.boundary_index)}
            <li class="boundary-card" class:has-warning={part.warnings.length > 0}>
              <div class="boundary-main">
                <div class="boundary-meta">
                  <span class="badge index">#{part.part_index + 1}</span>
                  {#if part.filename}
                    <code class="badge file">{part.filename}</code>
                  {:else}
                    <span class="badge warn">Bỏ qua</span>
                  {/if}
                  {#if part.is_preface}
                    <span class="badge accent">Mở đầu</span>
                  {/if}
                  {#if part.manual}
                    <span class="badge muted">Đã chỉnh</span>
                  {/if}
                  <span class="char-stat">{part.char_count.toLocaleString('vi-VN')} ký tự</span>
                </div>

                <div class="boundary-title">{part.title}</div>
                {#if part.preview}
                  <p class="boundary-snippet">{part.preview}</p>
                {/if}
                {#if part.warnings.length}
                  <p class="boundary-warn">{part.warnings.join(' · ')}</p>
                {/if}
              </div>

              <div class="boundary-actions">
                <button
                  type="button"
                  class="mini-btn"
                  title="Xem ngữ cảnh trước và sau mốc chia"
                  onclick={() => toggleContext(part.boundary_index)}
                >
                  {expandedContext.has(part.boundary_index) ? 'Ẩn ngữ cảnh' : 'Ngữ cảnh'}
                </button>
                <button
                  type="button"
                  class="mini-btn"
                  title="Đổi tiêu đề hiển thị"
                  disabled={isBusy}
                  onclick={() => openRenameDialog(part)}
                >
                  Sửa tên
                </button>
                {#if part.boundary_index > 0}
                  <button
                    type="button"
                    class="mini-btn"
                    aria-label={`Dời mốc ${part.part_index + 1} lên một dòng`}
                    title="Dời mốc lên 1 dòng"
                    disabled={isBusy}
                    onclick={() =>
                      runBoundaryMutation(() =>
                        nudgeSplitBoundary(
                          preview!.revision,
                          part.boundary_index,
                          -1,
                          prefaceMode,
                          nameFormat,
                        ),
                      )}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    class="mini-btn"
                    aria-label={`Dời mốc ${part.part_index + 1} xuống một dòng`}
                    title="Dời mốc xuống 1 dòng"
                    disabled={isBusy}
                    onclick={() =>
                      runBoundaryMutation(() =>
                        nudgeSplitBoundary(
                          preview!.revision,
                          part.boundary_index,
                          1,
                          prefaceMode,
                          nameFormat,
                        ),
                      )}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    class="mini-btn danger"
                    title="Gộp phần này vào chương trước"
                    disabled={isBusy}
                    onclick={() =>
                      runBoundaryMutation(() =>
                        mergeSplitBoundary(
                          preview!.revision,
                          part.boundary_index,
                          prefaceMode,
                          nameFormat,
                        ),
                      )}
                  >
                    Gộp
                  </button>
                {/if}
              </div>

              {#if expandedContext.has(part.boundary_index)}
                <div class="context-grid">
                  <div>
                    <small>Cuối phần trước</small>
                    <pre>{part.context_before || '(Đầu tệp nguồn)'}</pre>
                  </div>
                  <div>
                    <small>Đầu phần này</small>
                    <pre>{part.context_after || '(Trống)'}</pre>
                  </div>
                </div>
              {/if}
            </li>
          {/each}
        </ul>
      {:else}
        <div class="empty">
          <div class="paper" aria-hidden="true"><span></span><span></span><span></span></div>
          {#if busy === 'preview'}
            <h3>Đang phân tích điểm chia…</h3>
          {:else if busy === 'apply'}
            <h3>Đang xuất các tệp chương…</h3>
          {:else if !sourceFile}
            <h3>Chọn tệp .txt cần chia</h3>
            <p>Hỗ trợ xem trước mốc chia, chỉnh sửa ranh giới và xuất an toàn không ghi đè.</p>
          {:else if preview && !filteredParts.length}
            <h3>Không có mốc nào khớp bộ lọc</h3>
          {:else}
            <h3>{needsPreview ? 'Xem trước lại để cập nhật mốc chia' : 'Sẵn sàng phân tích'}</h3>
            <p>Chọn mẫu regex bên trái rồi bấm Xem trước chia chương.</p>
          {/if}
        </div>
      {/if}
    </div>

    <footer class="proof-footer">
      <span aria-live="polite">
        {#if preview}
          Sẽ xuất {preview.writable_count} tệp{overwrite ? ' (cho phép ghi đè)' : ' (không ghi đè)'}
        {:else}
          Chưa có bản xem trước
        {/if}
      </span>
      <button
        class="button primary"
        type="button"
        disabled={isBusy || !preview || preview.writable_count === 0}
        onclick={() => confirmDialog.showModal()}
      >
        Chia thành {preview?.writable_count ?? 0} tệp
      </button>
    </footer>
  </section>
</div>

<dialog bind:this={confirmDialog} aria-labelledby="split-confirm-title">
  <h2 id="split-confirm-title">Xuất {preview?.writable_count ?? 0} tệp chương?</h2>
  <p title={outputDir}>Thư mục đích: <strong>{outputDir}</strong></p>
  {#if overwrite}
    <p class="row-error">Cảnh báo: Tệp trùng tên trong thư mục đích sẽ bị ghi đè.</p>
  {/if}
  <ul>
    {#each writableParts.slice(0, 5) as part (part.boundary_index)}
      <li>
        <span>{part.title}</span>
        <strong>{part.filename}</strong>
      </li>
    {/each}
  </ul>
  {#if writableParts.length > 5}
    <p>Và {writableParts.length - 5} tệp khác trong danh sách đã xem trước.</p>
  {/if}
  <div class="dialog-actions">
    <button type="button" class="button" onclick={() => confirmDialog.close()}>Hủy</button>
    <button type="button" class="button primary" onclick={confirmSplit}>Xác nhận chia chương</button>
  </div>
</dialog>

<dialog bind:this={renameDialog} aria-labelledby="rename-boundary-title">
  <h2 id="rename-boundary-title">Đổi tiêu đề mốc chia</h2>
  <p>Chỉ đổi nhãn hiển thị để dễ đối chiếu, không sửa nội dung văn bản gốc.</p>
  <label for="boundary-title-input">Tiêu đề</label>
  <input
    id="boundary-title-input"
    type="text"
    bind:value={editingTitle}
    onkeydown={(e) => e.key === 'Enter' && saveBoundaryTitle()}
  />
  <div class="dialog-actions">
    <button type="button" class="button" onclick={() => renameDialog.close()}>Hủy</button>
    <button
      type="button"
      class="button primary"
      disabled={!editingTitle.trim()}
      onclick={saveBoundaryTitle}
    >
      Lưu tiêu đề
    </button>
  </div>
</dialog>

<dialog class="line-confirmation" bind:this={addDialog} aria-labelledby="add-boundary-title">
  <h2 id="add-boundary-title">Thêm mốc chia thủ công</h2>
  <p>Tìm một dòng trong văn bản gốc rồi chọn dòng bắt đầu của chương mới.</p>
  <div class="search-row">
    <input
      type="search"
      placeholder="Nhập từ khóa dòng tiêu đề cần tìm…"
      bind:value={searchQuery}
      onkeydown={(e) => e.key === 'Enter' && runSearch()}
    />
    <button
      type="button"
      class="button primary"
      disabled={!searchQuery.trim() || busy === 'search'}
      onclick={runSearch}
    >
      {busy === 'search' ? 'Đang tìm…' : 'Tìm'}
    </button>
  </div>
  {#if searchHits.length}
    <ul class="hit-list">
      {#each searchHits as hit (hit.line_start_byte)}
        <li class="hit-item">
          <div>
            <span>Dòng {hit.line_number} · vị trí {hit.line_start_char}</span>
            <strong>{hit.snippet || '(dòng trống)'}</strong>
          </div>
          <button
            type="button"
            class="button subtle"
            disabled={hit.line_start_byte === 0}
            onclick={() => pickSearchHit(hit)}
          >
            Đặt mốc tại đây
          </button>
        </li>
      {/each}
    </ul>
  {:else if hasSearched}
    <p>Không tìm thấy dòng nào khớp từ khóa.</p>
  {/if}
  <div class="dialog-actions">
    <button type="button" class="button" onclick={() => addDialog.close()}>Đóng</button>
  </div>
</dialog>
