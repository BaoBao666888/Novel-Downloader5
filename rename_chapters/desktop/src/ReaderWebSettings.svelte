<script lang="ts">
  import { onMount } from 'svelte';
  import { getReaderWebStatus, startReaderWeb, stopReaderWeb, type ReaderWebStatus } from './studio';

  let status = $state<ReaderWebStatus>({ url: null, lan: false });
  let lan = $state(true);
  let port = $state<number | undefined>(8787);
  let busy = $state(false);
  let error = $state('');
  let copied = $state('');
  let shareUrl = $state<HTMLInputElement>();

  async function run(action: () => Promise<ReaderWebStatus>) {
    busy = true;
    error = '';
    copied = '';
    try { status = await action(); }
    catch (cause) { error = String(cause); }
    finally { busy = false; }
  }

  onMount(() => { void run(getReaderWebStatus); });

  async function copy() {
    if (!status.url) return;
    try {
      await navigator.clipboard.writeText(status.url);
      copied = 'Đã chép liên kết.';
    } catch {
      shareUrl?.focus();
      shareUrl?.select();
      copied = 'Nhấn Ctrl+C để chép liên kết.';
    }
  }

  function submit(event: SubmitEvent) {
    event.preventDefault();
    if (!busy && port !== undefined) void run(() => startReaderWeb(lan, port ?? 0));
  }
</script>

<section class="settings-section" aria-busy={busy}>
  <h2>Dịch vụ web</h2>
  <p class="field-help">Mở thư viện ở chế độ chỉ đọc cho thiết bị khác.</p>
  {#if error}<p class="notice error" role="alert">{error}</p>{/if}
  {#if status.url}
    <p role="status">{status.lan ? 'Đang mở cho thiết bị cùng mạng.' : 'Đang mở trên máy này.'}</p>
    <label class="settings-field" for="reader-web-url">Liên kết đọc truyện</label>
    <div class="settings-path-row">
      <input id="reader-web-url" type="text" readonly value={status.url} bind:this={shareUrl} />
      <button class="button" type="button" onclick={copy}>Chép liên kết</button>
    </div>
    <p class="field-help">{copied || 'Thiết bị có liên kết này có thể đọc truyện cho tới khi dịch vụ dừng.'}</p>
    <div><button class="button" type="button" disabled={busy} onclick={() => run(stopReaderWeb)}>Dừng chia sẻ</button></div>
  {:else}
    <form class="settings-section" onsubmit={submit}>
      <label class="settings-toggle">
        <input type="checkbox" bind:checked={lan} disabled={busy} />
        Cho phép thiết bị cùng mạng
      </label>
      <label class="settings-field">
        <span>Cổng <small>(0 để tự chọn)</small></span>
        <input class="port" type="number" min="0" max="65535" required bind:value={port} disabled={busy} />
      </label>
      <div><button class="button primary" type="submit" disabled={busy}>Bật chia sẻ</button></div>
    </form>
  {/if}
</section>

<style>
  .port { max-width: 150px; }
</style>
