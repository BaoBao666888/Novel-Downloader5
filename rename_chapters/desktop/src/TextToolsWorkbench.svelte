<script lang="ts">
  import {
    applyTextEdit,
    chooseTextFile,
    chooseTocFile,
    previewApplyToc,
    previewRenumber,
    previewReplace,
    undoTextEdit,
    type TextPreview,
    type TextResult,
    type TocMode,
  } from './studio';

  type Props = {
    python: string;
    onPickPython: () => Promise<void>;
    parentBusy: boolean;
  };

  let { python, onPickPython, parentBusy }: Props = $props();

  const PAGE_SIZE = 40;

  const toolTitles = {
    renumber: 'Đánh số lại chương',
    toc: 'Áp mục lục vào truyện',
    replace: 'Tìm & thay thế',
  } as const;
  type Tool = keyof typeof toolTitles;
  let tool = $state<Tool>('renumber');
  let mainFile = $state('');
  let tocFile = $state('');

  // Renumber options
  let findRegex = $state('^\\s*第[0-9零一二三四五六七八九十百千万两]+章');
  let replaceFormat = $state('Chương {num}');
  let startNum = $state(1);

  // Apply TOC options
  let tocRegex = $state('^(第\\d+章)');
  let mainRegex = $state('^第\\d+章$');
  let tocMode = $state<TocMode>('append');

  let searchText = $state('');
  let replacement = $state('');
  let useRegex = $state(false);
  let wholeWord = $state(false);
  let matchCase = $state(false);

  let preview = $state<TextPreview | null>(null);
  let outcome = $state<{ result: TextResult; undone: boolean } | null>(null);
  let undoRevision = $state<number | null>(null);
  let query = $state('');
  let page = $state(0);
  let busy = $state<'main' | 'toc' | 'preview' | 'apply' | 'undo' | null>(null);
  let error = $state('');
  let needsPreview = $state(false);

  let confirmDialog: HTMLDialogElement;
  let replaceInput = $state<HTMLInputElement | undefined>(undefined);

  const isBusy = $derived(busy !== null || parentBusy);
  const canPreview = $derived(!isBusy && Boolean(mainFile) && (
    tool === 'renumber' ? Number.isSafeInteger(startNum) : tool === 'toc' ? Boolean(tocFile) : searchText.length > 0
  ));
  const filteredChanges = $derived.by(() => {
    const list = preview?.summary.changes ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (item) =>
        item.before.toLowerCase().includes(q) ||
        item.after.toLowerCase().includes(q) ||
        String(item.line_number).includes(q),
    );
  });
  const totalPages = $derived(Math.max(1, Math.ceil(filteredChanges.length / PAGE_SIZE)));
  const clampedPage = $derived(Math.min(page, totalPages - 1));
  const pagedChanges = $derived(
    filteredChanges.slice(clampedPage * PAGE_SIZE, (clampedPage + 1) * PAGE_SIZE),
  );

  function markStale() {
    if (preview) needsPreview = true;
    preview = null;
    error = '';
  }

  function switchTool(next: Tool) {
    if (tool === next || isBusy) return;
    tool = next;
    preview = null;
    error = '';
    needsPreview = false;
    query = '';
    page = 0;
  }

  function insertNumToken() {
    if (!replaceInput) return;
    const start = replaceInput.selectionStart ?? replaceFormat.length;
    const end = replaceInput.selectionEnd ?? start;
    replaceFormat = replaceFormat.slice(0, start) + '{num}' + replaceFormat.slice(end);
    markStale();
    requestAnimationFrame(() => {
      replaceInput?.focus();
      replaceInput?.setSelectionRange(start + 5, start + 5);
    });
  }

  async function pickMainFile() {
    if (isBusy) return;
    busy = 'main';
    error = '';
    try {
      const path = await chooseTextFile();
      if (path) {
        mainFile = path;
        preview = null;
        outcome = null;
        undoRevision = null;
        needsPreview = false;
      }
    } catch (cause) {
      error = String(cause);
    } finally {
      busy = null;
    }
  }

  async function pickTocFile() {
    if (isBusy) return;
    busy = 'toc';
    error = '';
    try {
      const path = await chooseTocFile();
      if (path) {
        tocFile = path;
        markStale();
      }
    } catch (cause) {
      error = String(cause);
    } finally {
      busy = null;
    }
  }

  async function runPreview() {
    if (!canPreview) return;
    busy = 'preview';
    error = '';
    outcome = null;
    page = 0;
    try {
      switch (tool) {
        case 'renumber':
          preview = await previewRenumber(findRegex, replaceFormat, startNum);
          break;
        case 'toc':
          preview = await previewApplyToc(tocRegex, mainRegex, tocMode);
          break;
        case 'replace':
          preview = await previewReplace({
            search: searchText, replacement, use_regex: useRegex, whole_word: wholeWord, match_case: matchCase,
          });
          break;
      }
      needsPreview = false;
    } catch (cause) {
      preview = null;
      error = String(cause);
    } finally {
      busy = null;
    }
  }

  async function confirmApply() {
    confirmDialog.close();
    if (!preview || !preview.has_changes || isBusy) return;
    busy = 'apply';
    error = '';
    try {
      const result = await applyTextEdit(preview.revision);
      outcome = { result, undone: false };
      undoRevision = result.undo_revision;
      preview = null;
      needsPreview = true;
    } catch (cause) {
      preview = null;
      needsPreview = true;
      error = String(cause);
    } finally {
      busy = null;
    }
  }

  async function runUndo() {
    if (undoRevision === null || isBusy) return;
    const rev = undoRevision;
    busy = 'undo';
    error = '';
    try {
      const result = await undoTextEdit(rev);
      outcome = { result, undone: true };
      undoRevision = result.undo_revision;
      preview = null;
      needsPreview = true;
    } catch (cause) {
      error = String(cause);
    } finally {
      busy = null;
    }
  }
</script>

<section class="heading">
  <div>
    <h1>{toolTitles[tool]}</h1>
    <p>
      {tool === 'renumber'
        ? 'Tìm chuỗi đánh số chương bằng regex, đối chiếu thay đổi rồi lưu an toàn kèm bản sao lưu.'
        : tool === 'toc'
          ? 'Khớp số chương từ tệp mục lục để bổ sung hoặc thay thế tiêu đề trong tệp truyện chính.'
          : 'Duyệt từng chỗ thay đổi trong tệp truyện trước khi lưu.'}
    </p>
  </div>
  <button class="button primary" type="button" onclick={pickMainFile} disabled={isBusy}>
    {busy === 'main' ? 'Đang mở…' : mainFile ? 'Đổi tệp truyện' : 'Chọn tệp .txt'}
  </button>
</section>

<div class="subtool-bar" role="group" aria-label="Chọn công cụ văn bản">
  {#each Object.keys(toolTitles) as key (key)}
    {@const option = key as Tool}
    <button type="button" class="subtool-pill" aria-pressed={tool === option}
      disabled={isBusy} onclick={() => switchTool(option)}>{toolTitles[option]}</button>
  {/each}
</div>

<div class={tool === 'toc' ? 'path-grid' : ''}>
  <div class="folder-line">
    <span class="folder-label">Tệp truyện chính</span>
    <span class="folder-path" title={mainFile}>{mainFile || 'Chưa chọn tệp .txt'}</span>
  </div>
  {#if tool === 'toc'}
    <div class="folder-line">
      <span class="folder-label">Tệp mục lục</span>
      <span class="folder-path" title={tocFile}>{tocFile || 'Chưa chọn tệp mục lục .txt'}</span>
      <button type="button" class="inline-action" onclick={pickTocFile} disabled={isBusy}>
        {busy === 'toc' ? 'Đang mở…' : 'Chọn mục lục…'}
      </button>
    </div>
  {/if}
</div>

<div class="workspace">
  <aside aria-label="Cấu hình xử lý văn bản">
    <h2>{tool === 'renumber' ? 'Quy tắc đánh số lại' : tool === 'toc' ? 'Quy tắc khớp mục lục' : 'Nội dung cần sửa'}</h2>
    <fieldset disabled={isBusy}>
      {#if tool === 'renumber'}
        <label for="renum-find">Regex tìm tiêu đề cần đánh số</label>
        <input
          id="renum-find"
          class="format"
          bind:value={findRegex}
          oninput={markStale}
          placeholder="Ví dụ: ^第\d+章"
        />
        <div class="tokens" aria-label="Mẫu regex nhanh">
          <button
            type="button"
            onclick={() => {
              findRegex = '^\\s*第[0-9零一二三四五六七八九十百千万两]+章';
              markStale();
            }}
          >
            第N章
          </button>
          <button
            type="button"
            onclick={() => {
              findRegex = '^\\s*Chương\\s+\\d+';
              markStale();
            }}
          >
            Chương N
          </button>
          <button
            type="button"
            onclick={() => {
              findRegex = '^\\s*Chapter\\s+\\d+';
              markStale();
            }}
          >
            Ch. N
          </button>
        </div>

        <label for="renum-replace">Cấu trúc thay thế (cần {'{num}'})</label>
        <input
          id="renum-replace"
          class="format"
          bind:this={replaceInput}
          bind:value={replaceFormat}
          oninput={markStale}
        />
        <div class="tokens">
          <button type="button" onclick={insertNumToken}>{'{num}'}</button>
        </div>

        <label for="renum-start">Số bắt đầu</label>
        <input
          id="renum-start"
          type="number"
          bind:value={startNum}
          oninput={markStale}
        />
      {:else if tool === 'toc'}
        <label for="toc-regex">Regex tệp mục lục (cần nhóm bắt (...))</label>
        <input
          id="toc-regex"
          class="format"
          bind:value={tocRegex}
          oninput={markStale}
          placeholder="Ví dụ: ^(第\d+章)"
        />
        <div class="tokens">
          <button
            type="button"
            onclick={() => {
              tocRegex = '^(第\\d+章)';
              mainRegex = '^第\\d+章$';
              markStale();
            }}
          >
            第N章
          </button>
          <button
            type="button"
            onclick={() => {
              tocRegex = '^(Chương\\s+\\d+)';
              mainRegex = '^Chương\\s+\\d+$';
              markStale();
            }}
          >
            Chương N
          </button>
        </div>

        <label for="main-regex">Regex khớp trong truyện chính</label>
        <input
          id="main-regex"
          class="format"
          bind:value={mainRegex}
          oninput={markStale}
          placeholder="Ví dụ: ^第\d+章$"
        />

        <label for="toc-mode">Chế độ áp mục lục</label>
        <select id="toc-mode" bind:value={tocMode} onchange={markStale}>
          <option value="append">Bổ sung tiêu đề sau khóa</option>
          <option value="replace">Thay thế toàn bộ bằng dòng mục lục</option>
        </select>
      {:else}
        <label for="replace-search">Tìm</label>
        <textarea id="replace-search" rows="2" class:format={useRegex} bind:value={searchText}
          spellcheck={false} oninput={markStale}></textarea>
        <label for="replace-value">Thay bằng</label>
        <textarea id="replace-value" rows="2" class:format={useRegex} bind:value={replacement}
          aria-describedby="replace-help" spellcheck={false} oninput={markStale}></textarea>
        <p class="field-help" id="replace-help">
          Để trống nếu muốn xóa đoạn tìm thấy.{#if useRegex}{' '}Dùng <code>$1</code> cho nhóm bắt và <code>$$</code> cho dấu đô la.{/if}
        </p>
        <details>
          <summary>Tùy chọn tìm kiếm</summary>
          <div class="replace-options">
            <label><input type="checkbox" bind:checked={useRegex} onchange={markStale} /> Biểu thức chính quy</label>
            <label><input type="checkbox" bind:checked={wholeWord} onchange={markStale} /> Khớp cả từ</label>
            <label><input type="checkbox" bind:checked={matchCase} onchange={markStale} /> Phân biệt hoa thường</label>
          </div>
        </details>
      {/if}
    </fieldset>

    <button
      class="button preview-button"
      type="button"
      onclick={runPreview}
      disabled={!canPreview}
    >
      {busy === 'preview' ? 'Đang đối chiếu…' : 'Xem trước thay đổi'}
    </button>

    <div class="runtime">
      <span>Python · {python || 'Mặc định'}</span>
      <button type="button" class="runtime-button" onclick={onPickPython} disabled={isBusy}>
        Chọn Python…
      </button>
    </div>
  </aside>

  <section class="proof" aria-label="Bảng đối chiếu thay đổi" aria-busy={isBusy}>
    <div class="proof-head">
      <div>
        <h2>Đối chiếu thay đổi</h2>
        {#if preview}
          <p class="summary">
            {preview.summary.changed_count} chỗ thay đổi
            {#if tool === 'replace'} trong {preview.summary.match_count} kết quả tìm thấy{/if}
            {#if preview.summary.toc_entries !== null}
              · {preview.summary.toc_entries} mục trong mục lục
            {/if}
          </p>
        {/if}
      </div>
      {#if preview?.summary.changes.length}
        <input
          class="search"
          type="search"
          aria-label="Lọc dòng thay đổi"
          placeholder="Lọc dòng…"
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
        {outcome.undone ? 'Đã hoàn tác' : 'Đã lưu'} <strong>{outcome.result.outcome.changed_count}</strong> thay đổi.
        Bản sao lưu: <code>{outcome.result.outcome.backup}</code>
      </div>
    {/if}

    <div class="proof-body">
      {#if preview && pagedChanges.length}
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
            <span>Trang {clampedPage + 1} / {totalPages} ({filteredChanges.length} dòng)</span>
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
              <th class="line-col" scope="col">Dòng</th>
              <th scope="col">Hiện tại</th>
              <th class="direction" scope="col" aria-label="Đổi thành">→</th>
              <th scope="col">Sau khi áp dụng</th>
            </tr>
          </thead>
          <tbody>
            {#each pagedChanges as item (item.index)}
              <tr>
                <th class="line-col diff-line" scope="row">{item.line_number}</th>
                <td>
                  {#if item.before}<span class="diff-before">{item.before}</span>
                  {:else}<span class="diff-empty">Vị trí chèn</span>{/if}
                </td>
                <td class="direction" aria-hidden="true">→</td>
                <td>
                  {#if item.after}<span class="diff-after">{item.after}</span>
                  {:else}<span class="diff-empty">Đã xóa</span>{/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      {:else}
        <div class="empty">
          <div class="paper" aria-hidden="true"><span></span><span></span><span></span></div>
          {#if busy === 'preview'}
            <h3>Đang phân tích tệp…</h3>
          {:else if busy === 'apply' || busy === 'undo'}
            <h3>{busy === 'apply' ? 'Đang lưu thay đổi…' : 'Đang hoàn tác…'}</h3>
          {:else if !mainFile}
            <h3>Chọn tệp truyện .txt</h3>
          {:else if tool === 'toc' && !tocFile}
            <h3>Chọn thêm tệp mục lục .txt</h3>
            <p>Bấm "Chọn mục lục…" ở thanh phía trên để nạp danh sách tiêu đề chương.</p>
          {:else if preview && filteredChanges.length === 0 && query.trim() && preview.summary.changes.length}
            <h3>Không có dòng nào khớp bộ lọc</h3>
          {:else if preview && !preview.has_changes}
            <h3>{tool === 'replace' && preview.summary.match_count === 0 ? 'Không tìm thấy nội dung' : 'Nội dung không đổi'}</h3>
            {#if tool === 'replace' && preview.summary.match_count === 0}
              <p>Thử đổi nội dung tìm hoặc tùy chọn khớp từ.</p>
            {/if}
          {:else}
            <h3>{needsPreview ? 'Xem trước lại để tiếp tục' : 'Sẵn sàng đối chiếu'}</h3>
            <p>{tool === 'replace' ? 'Nhập nội dung cần tìm rồi bấm Xem trước thay đổi.' : 'Chỉnh biểu thức bên trái rồi bấm Xem trước thay đổi.'}</p>
          {/if}
        </div>
      {/if}
    </div>

    <footer class="proof-footer">
      <span aria-live="polite">
        {#if preview}
          {preview.has_changes
            ? `${preview.summary.changed_count} chỗ sẽ được cập nhật (tự tạo bản sao .bak)`
            : 'Nội dung không đổi'}
        {:else}
          Chưa có bản đối chiếu
        {/if}
      </span>
      <div class="proof-actions">
        {#if undoRevision !== null}
          <button class="button" type="button" disabled={isBusy} onclick={runUndo}>
            Hoàn tác lần lưu
          </button>
        {/if}
        <button
          class="button primary"
          type="button"
          disabled={isBusy || !preview || !preview.has_changes}
          onclick={() => confirmDialog.showModal()}
        >
          Lưu thay đổi
        </button>
      </div>
    </footer>
  </section>
</div>

<dialog bind:this={confirmDialog} aria-labelledby="text-confirm-title">
  <h2 id="text-confirm-title">Lưu {preview?.summary.changed_count ?? 0} thay đổi?</h2>
  <p title={mainFile}>Tệp đích: <strong>{mainFile}</strong></p>
  <p>Bản gốc sẽ được tự động sao lưu thành tệp <code>.bak</code> ngay cạnh tệp nguồn và có thể hoàn tác trong phiên.</p>
  <ul>
    {#each (preview?.summary.changes ?? []).slice(0, 5) as item (item.index)}
      <li>
        <span>Dòng {item.line_number} · {item.before || 'Vị trí chèn'}</span>
        <strong>{item.after || 'Xóa đoạn này'}</strong>
      </li>
    {/each}
  </ul>
  {#if (preview?.summary.changes.length ?? 0) > 5}
    <p>Và {(preview?.summary.changes.length ?? 0) - 5} thay đổi khác.</p>
  {/if}
  <div class="dialog-actions">
    <button type="button" class="button" onclick={() => confirmDialog.close()}>Hủy</button>
    <button type="button" class="button primary" onclick={confirmApply}>Xác nhận lưu</button>
  </div>
</dialog>
