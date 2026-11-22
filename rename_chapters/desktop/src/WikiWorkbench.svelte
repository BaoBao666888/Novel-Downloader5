<script lang="ts">
  import { onMount } from 'svelte';
  import { importWikiScript, listWikiProfiles, openWiki, type WikiProfile } from './studio';

  let profiles = $state<WikiProfile[]>([]);
  let profile = $state('mac-dinh');
  let address = $state('');
  let runScript = $state(false);
  let busy = $state(false);
  let error = $state('');
  let status = $state('');

  const profileName = $derived(profile.trim());
  const hasScript = $derived(profiles.some((item) => item.name === profileName && item.has_script));

  onMount(() => {
    void listWikiProfiles().then((items) => { profiles = items; })
      .catch((cause) => { error = String(cause); });
  });

  function changeProfile() {
    runScript = false;
    error = '';
    status = '';
  }

  async function open() {
    if (busy || !profileName) return;
    busy = true;
    error = '';
    status = '';
    try {
      await openWiki(profileName, address, hasScript && runScript);
      profiles = await listWikiProfiles();
      status = `Đã mở cửa sổ Wikidich cho hồ sơ ${profileName}.`;
    } catch (cause) {
      error = String(cause);
    } finally {
      busy = false;
    }
  }

  async function chooseScript() {
    if (busy || !profileName) return;
    busy = true;
    error = '';
    status = '';
    try {
      if (await importWikiScript(profileName)) {
        profiles = await listWikiProfiles();
        runScript = false;
        status = 'Đã lưu userscript cho hồ sơ này.';
      }
    } catch (cause) {
      error = String(cause);
    } finally {
      busy = false;
    }
  }
</script>

<section class="heading">
  <div>
    <h1>Wikidich</h1>
    <p>Mở Wikidich trong cửa sổ riêng theo hồ sơ đăng nhập.</p>
  </div>
</section>

{#if error}<p class="notice error wiki-status" role="alert">{error}</p>
{:else if status}<p class="notice wiki-status" role="status">{status}</p>{/if}

<div class="workspace">
  <aside aria-label="Hồ sơ Wikidich">
    <h2>Hồ sơ</h2>
    <label for="wiki-profile">Chọn hoặc đặt tên hồ sơ</label>
    <input id="wiki-profile" list="wiki-profiles" bind:value={profile} oninput={changeProfile} disabled={busy}
      maxlength="32" autocomplete="off" aria-describedby="wiki-profile-help" />
    <datalist id="wiki-profiles">
      {#each profiles as item (item.name)}<option value={item.name}></option>{/each}
    </datalist>
    <p class="field-help" id="wiki-profile-help">Mỗi hồ sơ giữ cookie riêng. Dùng chữ thường, số hoặc dấu gạch ngang.</p>
  </aside>

  <section class="proof" aria-label="Mở Wikidich">
    <div class="wiki-form">
      <form onsubmit={(event) => { event.preventDefault(); void open(); }}>
        <label for="wiki-address">Địa chỉ Wikidich</label>
        <input id="wiki-address" type="url" bind:value={address} placeholder="https://wikicv.org/" disabled={busy} />
        <button class="button primary" type="submit" disabled={busy || !profileName}>Mở Wikidich</button>
      </form>
      <section class="wiki-script" aria-label="Userscript của hồ sơ">
        <h2>Userscript</h2>
        <p class="field-help">Chọn tệp .user.js dùng <code>@match</code> và <code>@grant none</code>.</p>
        <label class="wiki-check"><input type="checkbox" bind:checked={runScript} disabled={busy || !hasScript} /> Chạy script khi mở</label>
        <button type="button" class="button" onclick={chooseScript} disabled={busy || !profileName}>
          {hasScript ? 'Đổi userscript…' : 'Chọn .user.js…'}
        </button>
      </section>
    </div>
  </section>
</div>

<style>
  .wiki-status { margin-bottom: 16px; border: 1px solid var(--line); border-radius: var(--radius-sm); }
  .wiki-form { padding: var(--space-panel); }
  .wiki-form form > label { margin-top: 0; }
  .wiki-form form > button { margin-top: 12px; }
  .wiki-script { margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--line); }
  .wiki-check { display: flex; align-items: center; gap: 8px; min-height: 36px; margin: 8px 0; }
  .wiki-check input { accent-color: var(--accent); }
</style>
