<script lang="ts">
  import {
    applyRename, chooseFolder, choosePython, previewRename, rowStatus,
    type Outcome, type Preview,
  } from './studio';

  const defaultFormat = '第{num}章 {title}.txt';
  let folder = $state('');
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
  let busy = $state<'folder' | 'python' | 'preview' | 'apply' | null>(null);
  let error = $state('');
  let needsPreview = $state(false);
  let dark = $state(
    (localStorage.getItem('novel-studio-theme') ?? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')) === 'dark',
  );
  let formatInput: HTMLInputElement;
  let confirmation: HTMLDialogElement;

  const eligible = $derived(new Set(preview?.eligible ?? []));
  const visible = $derived((preview?.rows ?? []).filter((row) =>
    [row.filename, row.proposed_name].some((name) => name?.toLowerCase().includes(query.trim().toLowerCase()))
  ));
  const eligibleVisible = $derived(visible.filter((row) => eligible.has(row.filename)));
  const checkedVisible = $derived(eligibleVisible.length > 0 && eligibleVisible.every((row) => selected.has(row.filename)));
  const selectedRows = $derived((preview?.rows ?? []).filter((row) => selected.has(row.filename)));
  const warnings = $derived((preview?.rows ?? []).filter((row) =>
    row.issues.length > 0 || row.status === 'missing_number' || (row.status === 'proposed' && !eligible.has(row.filename))
  ).length);

  $effect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    localStorage.setItem('novel-studio-theme', dark ? 'dark' : 'light');
  });

  function clearPreview() {
    preview = null;
    selected = new Set();
    query = '';
  }

  function changedRules() {
    if (preview) needsPreview = true;
    clearPreview();
    error = '';
  }

  function insertToken(token: string) {
    const start = formatInput.selectionStart ?? nameFormat.length;
    const end = formatInput.selectionEnd ?? start;
    nameFormat = nameFormat.slice(0, start) + token + nameFormat.slice(end);
    changedRules();
    requestAnimationFrame(() => {
      formatInput.focus();
      formatInput.setSelectionRange(start + token.length, start + token.length);
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
      });
      selected = new Set(preview.eligible);
      needsPreview = false;
    } catch (cause) {
      error = String(cause);
    } finally {
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
    confirmation.close();
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
  <div class="brand"><span class="book-mark" aria-hidden="true"></span> Novel Studio</div>
  <div class="masthead-end">
    <button type="button" class="theme" aria-label={dark ? 'Bật giao diện sáng' : 'Bật giao diện tối'}
      onclick={() => (dark = !dark)}>{dark ? '☀' : '☾'} <span>{dark ? 'Sáng' : 'Tối'}</span></button>
  </div>
</header>

<main>
  <section class="heading">
    <div>
      <h1>Đổi tên chương</h1>
      <p>Đối chiếu tên chương và chọn các file cần đổi.</p>
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
    <aside aria-label="Quy tắc đặt tên">
      <h2>Quy tắc đặt tên</h2>
      <fieldset disabled={busy !== null}>
        <label for="name-format">Mẫu tên mới</label>
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

    <section class="proof" aria-label="Bản xem trước" aria-busy={busy === 'preview' || busy === 'apply'}>
      <div class="proof-head">
        <div>
          <h2>Bản xem trước</h2>
          {#if preview}
            <p class="summary">{preview.rows.length} file · {preview.eligible.length} có thể đổi{warnings ? ` · ${warnings} cần xem lại` : ''}</p>
          {/if}
        </div>
        {#if preview?.rows.length}
          <input class="search" type="search" aria-label="Tìm tên chương" placeholder="Tìm tên chương…" bind:value={query} />
        {/if}
      </div>

      {#if error}<p role="alert" class="notice error">{error}</p>{/if}
      {#if outcome}
        <div role="status" class="notice" class:error={outcome.failure !== null}>
          Đã đổi tên {outcome.renamed.length} file.
          {#if outcome.failure}
            Dừng tại <strong>{outcome.failure.operation.source}</strong>. {outcome.failure.error}
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
                <th scope="col">Tên hiện tại</th>
                <th class="direction" scope="col" aria-label="Đổi thành">→</th>
                <th scope="col">Tên sau khi đổi</th>
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
                  <td class="direction" aria-hidden="true">→</td>
                  <td><span class="filename next-name">{row.proposed_name ?? '—'}</span>
                    <small class:row-error={row.issues.length > 0}>{rowStatus(row, available)}</small>
                  </td>
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
            {:else if !folder}
              <h3>Chọn thư mục chứa chương</h3>
              <p>Các file .txt sẽ xuất hiện tại đây sau khi xem trước.</p>
            {:else if preview && !preview.rows.length}
              <h3>Thư mục chưa có file .txt</h3>
            {:else if preview}
              <h3>Không tìm thấy tên phù hợp</h3>
            {:else}
              <h3>{needsPreview ? 'Xem trước lại để tiếp tục' : 'Sẵn sàng xem trước'}</h3>
              <p>Chỉnh mẫu tên bên trái rồi bấm Xem trước.</p>
            {/if}
          </div>
        {/if}
      </div>

      <footer class="proof-footer">
        <span aria-live="polite">{selected.size ? `${selected.size} file đã chọn` : 'Chưa chọn file để đổi'}</span>
        <button class="button primary" type="button" disabled={busy !== null || !selected.size}
          onclick={() => confirmation.showModal()}>Đổi tên{selected.size ? ` ${selected.size} file` : ''}</button>
      </footer>
    </section>
  </div>
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
    <button type="button" class="button" onclick={() => confirmation.close()}>Hủy</button>
    <button type="button" class="button primary" onclick={confirmApply}>Xác nhận đổi tên</button>
  </div>
</dialog>
