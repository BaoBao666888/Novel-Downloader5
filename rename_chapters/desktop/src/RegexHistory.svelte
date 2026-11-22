<script lang="ts">
  import { removeSavedRegex, togglePinRegex, type RegexScope, type SavedRegex } from './regex-presets';

  type Props = {
    scope: RegexScope;
    items: SavedRegex[];
    disabled?: boolean;
    onApply: (item: SavedRegex) => void;
    onChange: (next: SavedRegex[]) => void;
  };

  let { scope, items, disabled = false, onApply, onChange }: Props = $props();

  const pinnedCount = $derived(items.filter((i) => i.pinned).length);

  function pin(id: string) {
    onChange(togglePinRegex(scope, id));
  }

  function remove(id: string) {
    onChange(removeSavedRegex(scope, id));
  }
</script>

{#if items.length > 0}
  <details class="regex-history">
    <summary>
      Mẫu đã dùng ({items.length}{#if pinnedCount > 0} · {pinnedCount} ghim{/if})
    </summary>
    <ul>
      {#each items as item (item.id)}
        <li>
          <button
            type="button"
            class="regex-apply"
            title={item.secondary ? `${item.pattern} → ${item.secondary}` : item.pattern}
            {disabled}
            onclick={() => onApply(item)}
          >
            <code>{item.pattern}</code>
            {#if item.secondary}
              <small>→ {item.secondary}</small>
            {/if}
          </button>
          <button
            type="button"
            class="regex-icon"
            class:pinned={item.pinned}
            aria-label={item.pinned ? 'Bỏ ghim mẫu' : 'Ghim mẫu'}
            title={item.pinned ? 'Bỏ ghim' : 'Ghim mẫu này'}
            {disabled}
            onclick={() => pin(item.id)}
          >
            {item.pinned ? '★' : '☆'}
          </button>
          <button
            type="button"
            class="regex-icon"
            aria-label="Xóa mẫu khỏi lịch sử"
            title="Xóa"
            {disabled}
            onclick={() => remove(item.id)}
          >
            ×
          </button>
        </li>
      {/each}
    </ul>
  </details>
{/if}

<style>
  .regex-history {
    margin-top: 12px;
  }
  .regex-history summary {
    margin-top: 0;
    color: var(--muted);
    font-size: 12px;
  }
  .regex-history ul {
    list-style: none;
    margin: 8px 0 0;
    padding: 0;
    display: grid;
    gap: 4px;
    max-height: 168px;
    overflow: auto;
  }
  .regex-history li {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto auto;
    align-items: center;
    gap: 4px;
    padding: 3px 4px;
    border: 1px solid var(--line);
    border-radius: var(--radius-sm);
    background: var(--inset);
  }
  .regex-apply {
    min-width: 0;
    text-align: start;
    border: 0;
    background: transparent;
    color: var(--ink);
    padding: 2px 4px;
    display: grid;
    gap: 1px;
  }
  .regex-apply:hover:not(:disabled) code {
    color: var(--accent);
  }
  .regex-apply code,
  .regex-apply small {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .regex-apply small {
    font-size: 11px;
    color: var(--muted);
  }
  .regex-icon {
    border: 0;
    background: transparent;
    color: var(--muted);
    width: 24px;
    height: 24px;
    border-radius: 4px;
    display: grid;
    place-items: center;
    font-size: 13px;
  }
  .regex-icon:hover:not(:disabled) {
    background: var(--selection);
    color: var(--ink);
  }
  .regex-icon.pinned {
    color: var(--accent);
  }
</style>
