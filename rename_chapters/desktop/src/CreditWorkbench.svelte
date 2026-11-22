<script lang="ts">
  import {
    chooseCreditFolder, previewCredit, sampleCredit, saveCredit, undoCredit,
    type CreditPreview, type CreditSample, type CreditResult,
  } from './studio';

  const pageSize = 80;
  let folder = $state('');
  let text = $state('');
  let position = $state<'start' | 'end' | 'line'>('start');
  let line = $state(2);
  let preview = $state<CreditPreview | null>(null);
  let selected = $state(new Set<string>());
  let sample = $state<CreditSample | null>(null);
  let sampleName = $state('');
  let page = $state(0);
  let busy = $state(false);
  let error = $state('');
  let result = $state<{ action: 'save' | 'undo'; files: string[] } | null>(null);
  let canUndo = $state(false);
  let confirm: HTMLDialogElement;

  const eligible = $derived(preview?.rows.filter((row) => row.error === null) ?? []);
  const rows = $derived(preview?.rows.slice(page * pageSize, (page + 1) * pageSize) ?? []);
  const pages = $derived(Math.ceil((preview?.rows.length ?? 0) / pageSize));
  const validOptions = $derived(text.trim() !== '' && (position !== 'line' || (Number.isSafeInteger(line) && line >= 1)));

  function clearReview() {
    preview = null;
    sample = null;
    selected = new Set();
    page = 0;
  }

  function changedOptions() {
    clearReview();
    error = '';
  }

  async function run(action: () => Promise<void>) {
    if (busy) return;
    busy = true;
    error = '';
    try {
      await action();
    } catch (cause) {
      error = String(cause);
    } finally {
      busy = false;
    }
  }

  function pickFolder() {
    void run(async () => {
      const path = await chooseCreditFolder();
      if (path === null) return;
      folder = path;
      canUndo = false;
      result = null;
      clearReview();
    });
  }

  function review() {
    void run(async () => {
      clearReview();
      result = null;
      preview = await previewCredit(text, position === 'line' ? { line } : position);
      const names = preview.rows.filter((row) => row.error === null).map((row) => row.name);
      selected = new Set(names);
      sampleName = names[0] ?? '';
      if (sampleName) sample = await sampleCredit(preview.revision, sampleName);
    });
  }

  function changeSample(name: string) {
    const current = preview;
    if (!current) return;
    void run(async () => {
      sample = null;
      sampleName = name;
      sample = await sampleCredit(current.revision, name);
    });
  }

  function toggle(name: string, checked: boolean) {
    const next = new Set(selected);
    if (checked) next.add(name);
    else next.delete(name);
    selected = next;
  }

  function finish(action: 'save' | 'undo', operation: () => Promise<CreditResult>) {
    void run(async () => {
      result = null;
      const outcome = await operation();
      result = { action, files: outcome.report.written };
      canUndo = outcome.can_undo;
      error = outcome.report.error ?? '';
      clearReview();
    });
  }

  function confirmSave() {
    confirm.close();
    const current = preview;
    if (current && selected.size) finish('save', () => saveCredit(current.revision, Array.from(selected)));
  }
</script>

<section class="heading">
  <div><h1>Thêm credit</h1><p>Chèn ghi công vào các tệp TXT trong thư mục.</p></div>
  <button class="button primary" type="button" disabled={busy} onclick={pickFolder}>Chọn thư mục</button>
</section>
<div class="folder-line"><span class="folder-label">Thư mục</span><span class="folder-path" title={folder}>{folder || 'Chưa chọn thư mục'}</span></div>

<div class="workspace">
  <aside aria-label="Nội dung credit">
    <fieldset disabled={busy}>
      <label for="credit-text">Nội dung credit</label>
      <textarea id="credit-text" rows="4" bind:value={text} oninput={changedOptions}></textarea>
      <label for="credit-position">Vị trí chèn</label>
      <select id="credit-position" bind:value={position} onchange={changedOptions}>
        <option value="start">Đầu tệp</option><option value="end">Cuối tệp</option><option value="line">Trước dòng</option>
      </select>
      {#if position === 'line'}
        <label for="credit-line">Số dòng</label>
        <input id="credit-line" type="number" min="1" bind:value={line} oninput={changedOptions} />
      {/if}
    </fieldset>
    <button class="button preview-button" type="button" disabled={busy || !folder || !validOptions} onclick={review}>Xem trước</button>
  </aside>

  <section class="proof" aria-label="Đối chiếu credit" aria-busy={busy}>
    <header class="proof-head"><h2>Đối chiếu credit</h2></header>
    {#if error}<p class="notice error" role="alert">{error}</p>{/if}
    {#if result}<p class="notice" role="status">{result.action === 'save' ? 'Đã lưu' : 'Đã hoàn tác'} {result.files.length} tệp.</p>{/if}
    <div class="proof-body credit-body">
      {#if preview?.rows.length}
        {#if eligible.length}
          <div class="credit-excerpt">
            <label for="credit-sample">Xem đoạn trích</label>
            <select id="credit-sample" value={sampleName} disabled={busy} onchange={(event) => changeSample(event.currentTarget.value)}>
              {#each eligible as item (item.name)}<option value={item.name}>{item.name}</option>{/each}
            </select>
            {#if sample}<pre>{sample.before}<mark>{sample.credit}</mark>{sample.after}</pre>{/if}
          </div>
        {/if}
        <p class="credit-select"><label><input type="checkbox" disabled={busy || !eligible.length} checked={eligible.length > 0 && selected.size === eligible.length}
          onchange={(event) => { selected = new Set(event.currentTarget.checked ? eligible.map((row) => row.name) : []); }} /> Chọn tất cả tệp hợp lệ</label></p>
        {#each rows as row (row.name)}
          <div class="credit-row">
            <label><input type="checkbox" checked={selected.has(row.name)} disabled={busy || row.error !== null}
              onchange={(event) => toggle(row.name, event.currentTarget.checked)} /> {row.name}</label>
            {#if row.error}<small>{row.error}</small>{/if}
          </div>
        {/each}
        {#if pages > 1}<div class="credit-pages">
          <button class="button" disabled={page === 0} onclick={() => (page -= 1)}>Trang trước</button>
          <span>Trang {page + 1} / {pages}</span>
          <button class="button" disabled={page + 1 === pages} onclick={() => (page += 1)}>Trang sau</button>
        </div>{/if}
      {:else}
        <div class="empty"><h3>{busy ? 'Đang xử lý…' : preview ? 'Thư mục chưa có tệp TXT' : 'Xem trước vị trí chèn và chọn tệp cần lưu'}</h3></div>
      {/if}
    </div>
    <footer class="proof-footer">
      <span aria-live="polite">{selected.size} tệp đã chọn</span>
      <div class="proof-actions">
        {#if canUndo}<button class="button" type="button" disabled={busy} onclick={() => finish('undo', undoCredit)}>Hoàn tác</button>{/if}
        <button class="button primary" type="button" disabled={busy || !selected.size} onclick={() => confirm.showModal()}>Lưu credit</button>
      </div>
    </footer>
  </section>
</div>

<dialog bind:this={confirm} aria-labelledby="credit-confirm">
  <h2 id="credit-confirm">Lưu credit vào {selected.size} tệp?</h2>
  <p>Mỗi tệp được sao lưu cạnh bản gốc trước khi ghi.</p>
  <div class="dialog-actions">
    <button class="button" type="button" onclick={() => confirm.close()}>Hủy</button>
    <button class="button primary" type="button" onclick={confirmSave}>Xác nhận lưu</button>
  </div>
</dialog>

<style>
  .credit-excerpt { padding: 12px var(--space-panel); border-bottom: 1px solid var(--line); }
  .credit-excerpt > label { margin-top: 0; }
  .credit-excerpt pre { font: inherit; white-space: pre-wrap; overflow-wrap: anywhere; max-height: 180px; overflow: auto; }
  mark { background: var(--selection); color: var(--accent); }
  .credit-select, .credit-row { padding: 6px var(--space-panel); border-bottom: 1px solid var(--line); }
  .credit-select label, .credit-row label { display: block; margin: 0; padding-block: 6px; overflow-wrap: anywhere; }
  input[type='checkbox'] { accent-color: var(--accent); }
  .credit-row small { color: var(--muted); }
  .credit-pages { display: flex; align-items: center; gap: 12px; padding: 12px var(--space-panel); }
</style>
