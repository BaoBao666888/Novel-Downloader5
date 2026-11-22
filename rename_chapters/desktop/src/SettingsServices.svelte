<script lang="ts">
  import { onMount } from 'svelte';
  import {
    checkUploadSession, clearUploadSessionCookie, getTranslateServerConfig, getUploadRuntimeStatus,
    getUploadSessionStatus, saveTranslateServerConfig, saveUploadSessionCookie, setUploadAutoSchedule,
    type SessionSecretStatus, type TranslateBatchConfig, type UploadRuntimeStatus,
  } from './studio';

  let { group }: { group: 'account' | 'translation' } = $props();
  let busy = $state(true);
  let error = $state('');
  let notice = $state('');
  let session = $state<SessionSecretStatus | null>(null);
  let runtime = $state<UploadRuntimeStatus | null>(null);
  let config = $state<TranslateBatchConfig | null>(null);
  let cookie = $state('');
  let clearDialog: HTMLDialogElement;

  async function run(action: () => Promise<void>) {
    busy = true;
    error = '';
    notice = '';
    try { await action(); }
    catch (cause) { error = String(cause); }
    finally { busy = false; }
  }

  onMount(() => {
    void run(async () => {
      if (group === 'translation') config = await getTranslateServerConfig();
      else [session, runtime] = await Promise.all([getUploadSessionStatus(), getUploadRuntimeStatus()]);
    });
  });

  function save() {
    return run(async () => {
      session = await saveUploadSessionCookie(cookie);
      cookie = '';
      runtime = await getUploadRuntimeStatus();
      notice = 'Đã lưu phiên Wikidich bằng Windows DPAPI.';
    });
  }

  function check() {
    return run(async () => {
      const outcome = await checkUploadSession();
      runtime = await getUploadRuntimeStatus();
      if (outcome.authenticated) notice = outcome.message;
      else error = outcome.message;
    });
  }

  function clear() {
    clearDialog.close();
    return run(async () => {
      session = await clearUploadSessionCookie();
      cookie = '';
      runtime = await getUploadRuntimeStatus();
      notice = 'Đã xóa phiên đã lưu trên máy.';
    });
  }

  function saveTranslation(event: SubmitEvent) {
    event.preventDefault();
    const draft = config;
    if (draft) return run(async () => {
      config = await saveTranslateServerConfig(draft);
      notice = 'Đã lưu cấu hình dịch thuật.';
    });
  }
</script>

<section class="settings-section" aria-busy={busy}>
  <h2>{group === 'account' ? 'Tài khoản Wikidich' : 'Dịch thuật'}</h2>
  {#if error}<p class="notice error" role="alert">{error}</p>{/if}
  {#if notice}<p class="notice" role="status">{notice}</p>{/if}
  {#if group === 'account'}
    <p class="field-help">Phiên này dùng cho Works và Đăng tải. Windows DPAPI mã hóa cookie đã lưu.</p>
    <div class="stat-box">
      <div><span>Phiên trên máy</span><strong>{session?.configured ? (session.readable ? 'Đã lưu' : 'Lỗi giải mã') : 'Chưa lưu'}</strong></div>
      <div><span>Tài khoản đã xác thực</span><strong>{runtime?.verifiedAccount || 'Chưa kiểm tra'}</strong></div>
    </div>
    <label class="settings-field">
      <span>Cookie phiên</span>
      <input type="password" autocomplete="off" spellcheck="false" bind:value={cookie} disabled={busy} />
    </label>
    <div class="settings-path-actions">
      <button class="button primary" type="button" disabled={busy || !cookie.trim()} onclick={save}>Lưu phiên</button>
      <button class="button" type="button" disabled={busy || !session?.readable} onclick={check}>Kiểm tra phiên</button>
      {#if session?.configured}
        <button class="button" type="button" disabled={busy} onclick={() => clearDialog.showModal()}>Xóa phiên</button>
      {/if}
    </div>
    {#if runtime}
      <label class="settings-toggle">
        <input type="checkbox" checked={runtime.autoScheduleEnabled} disabled={busy} onchange={(event) => {
          const checked = event.currentTarget.checked;
          void run(async () => { runtime = await setUploadAutoSchedule(checked); })
            .finally(() => { if (event.target instanceof HTMLInputElement) event.target.checked = Boolean(runtime?.autoScheduleEnabled); });
        }} />
        Tự chạy lịch hẹn và đối chiếu nền
      </label>
    {/if}
  {:else if config}
    <form class="settings-section" onsubmit={saveTranslation}>
      <label class="settings-field">
        <span>Địa chỉ DichNgay Server</span>
        <input type="url" required bind:value={config.serverUrl} disabled={busy} />
      </label>
      <label class="settings-field">
        <span>Số ký tự tối đa mỗi lượt (500–9000)</span>
        <input type="number" min="500" max="9000" required bind:value={config.maxChars} disabled={busy} />
      </label>
      <div><button type="submit" class="button primary" disabled={busy}>Lưu cấu hình</button></div>
    </form>
  {/if}
</section>
<dialog bind:this={clearDialog} aria-labelledby="clear-wiki-session-title">
  <h2 id="clear-wiki-session-title">Xóa phiên Wikidich trên máy?</h2>
  <div class="dialog-actions">
    <button class="button" type="button" onclick={() => clearDialog.close()}>Hủy</button>
    <button class="button primary" type="button" onclick={clear}>Xóa phiên</button>
  </div>
</dialog>
