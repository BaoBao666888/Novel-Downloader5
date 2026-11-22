<script lang="ts">
  import { onMount } from 'svelte';
  import { listWikiProfiles, openWiki } from './studio';

  let profiles = $state<string[]>([]);
  let profile = $state('mac-dinh');
  let address = $state('');
  let busy = $state(false);
  let error = $state('');
  let status = $state('');

  const profileName = $derived(profile.trim());

  onMount(() => {
    void listWikiProfiles().then((items) => { profiles = items; })
      .catch((cause) => { error = String(cause); });
  });

  function changeProfile() {
    error = '';
    status = '';
  }

  async function open() {
    if (busy || !profileName) return;
    busy = true;
    error = '';
    status = '';
    try {
      await openWiki(profileName, address);
      profiles = await listWikiProfiles();
      status = `Đã mở cửa sổ Wikidich cho hồ sơ ${profileName}.`;
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
      {#each profiles as item (item)}<option value={item}></option>{/each}
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
    </div>
  </section>
</div>

<style>
  .wiki-status { margin-bottom: 16px; border: 1px solid var(--line); border-radius: var(--radius-sm); }
  .wiki-form { padding: var(--space-panel); }
  .wiki-form form > label { margin-top: 0; }
  .wiki-form form > button { margin-top: 12px; }
</style>
