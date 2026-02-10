function groupHitRows(preview) {
  const rows = new Map();
  const addHits = (hits) => {
    for (const hit of hits || []) {
      const source = String(hit.source || "").trim();
      if (!source) continue;
      const current = rows.get(source) || {
        source,
        target: String(hit.target || "").trim(),
        count: 0,
      };
      current.count += 1;
      if (!current.target && hit.target) {
        current.target = String(hit.target || "").trim();
      }
      rows.set(source, current);
    }
  };

  addHits(preview && preview.name_map ? preview.name_map.hits : null);
  addHits(preview && preview.title_name_map ? preview.title_name_map.hits : null);

  return Array.from(rows.values()).sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return a.source.localeCompare(b.source, "vi");
  });
}

export function createNameEditor(options) {
  const {
    refs,
    api,
    t,
    showToast,
    showStatus,
    hideStatus,
    getContext,
    onApplied,
  } = options;

  const state = {
    sets: { "Mặc định": {} },
    activeSet: "Mặc định",
    version: 1,
    preview: null,
  };

  function renderNameSetSelect() {
    if (!refs.nameSetSelect) return;
    refs.nameSetSelect.innerHTML = "";
    const names = Object.keys(state.sets || {});
    if (!names.length) {
      state.sets = { "Mặc định": {} };
      state.activeSet = "Mặc định";
    }
    for (const name of Object.keys(state.sets)) {
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name;
      refs.nameSetSelect.appendChild(opt);
    }
    if (!(state.activeSet in state.sets)) {
      state.activeSet = Object.keys(state.sets)[0];
    }
    refs.nameSetSelect.value = state.activeSet;
  }

  async function loadNameSets() {
    const data = await api("/api/name-sets");
    state.sets = data.sets || { "Mặc định": {} };
    state.activeSet = data.active_set || Object.keys(state.sets)[0] || "Mặc định";
    state.version = Number(data.version || 1);
    renderNameSetSelect();
  }

  function close() {
    if (refs.nameEditorDialog && refs.nameEditorDialog.open) {
      refs.nameEditorDialog.close();
    }
  }

  function renderPreviewRows(preview) {
    if (!refs.namePreviewBody || !refs.namePreviewHint) return;
    refs.namePreviewBody.innerHTML = "";

    const rows = groupHitRows(preview);
    if (!rows.length) {
      refs.namePreviewHint.textContent = t("namePreviewEmpty");
      return;
    }
    refs.namePreviewHint.textContent = t("namePreviewCount", { count: rows.length });

    for (const row of rows) {
      const tr = document.createElement("tr");

      const sourceCell = document.createElement("td");
      sourceCell.textContent = row.source;

      const targetCell = document.createElement("td");
      const targetInput = document.createElement("input");
      targetInput.type = "text";
      targetInput.value = row.target || "";
      targetInput.className = "name-target-inline";
      targetCell.appendChild(targetInput);

      const countCell = document.createElement("td");
      countCell.textContent = String(row.count);

      const actionCell = document.createElement("td");
      const applyBtn = document.createElement("button");
      applyBtn.type = "button";
      applyBtn.className = "btn btn-small";
      applyBtn.textContent = t("applyNameEntry");
      applyBtn.addEventListener("click", async () => {
        const target = targetInput.value.trim();
        if (!target) {
          showToast(t("nameTargetRequired"));
          return;
        }
        showStatus(t("statusApplyingNameEntry"));
        try {
          await api("/api/name-sets/entry", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              source: row.source,
              target,
              set_name: state.activeSet,
            }),
          });
          await loadNameSets();
          await refreshPreview();
          if (typeof onApplied === "function") {
            await onApplied();
          }
          showToast(t("nameEntryApplied"));
        } catch (error) {
          showToast(error.message || t("toastError"));
        } finally {
          hideStatus();
        }
      });
      actionCell.appendChild(applyBtn);

      tr.append(sourceCell, targetCell, countCell, actionCell);
      refs.namePreviewBody.appendChild(tr);
    }
  }

  async function refreshPreview() {
    const ctx = getContext();
    if (!ctx.chapterId) {
      refs.namePreviewHint.textContent = t("namePreviewNeedChapter");
      refs.namePreviewBody.innerHTML = "";
      return;
    }

    showStatus(t("statusLoadingNamePreview"));
    try {
      const payload = await api(`/api/library/chapter/${encodeURIComponent(ctx.chapterId)}/name-preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          translation_mode: ctx.translationMode,
        }),
      });
      state.preview = payload;
      renderPreviewRows(payload);
    } catch (error) {
      showToast(error.message || t("toastError"));
    } finally {
      hideStatus();
    }
  }

  async function setActiveSet(setName) {
    const chosen = String(setName || "").trim();
    if (!chosen) return;
    showStatus(t("statusSwitchingNameSet"));
    try {
      const data = await api("/api/name-sets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active_set: chosen, bump_version: false }),
      });
      state.sets = data.sets || state.sets;
      state.activeSet = data.active_set || chosen;
      state.version = Number(data.version || state.version || 1);
      renderNameSetSelect();
    } finally {
      hideStatus();
    }
  }

  async function submitManualEntry(event) {
    event.preventDefault();
    const source = ((refs.nameSourceInput && refs.nameSourceInput.value) || "").trim();
    const target = ((refs.nameTargetInput && refs.nameTargetInput.value) || "").trim();
    if (!source || !target) {
      showToast(t("nameSourceTargetRequired"));
      return;
    }

    showStatus(t("statusApplyingNameEntry"));
    try {
      await api("/api/name-sets/entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source,
          target,
          set_name: state.activeSet,
        }),
      });
      if (refs.nameEntryForm) {
        refs.nameEntryForm.reset();
      }
      await loadNameSets();
      await refreshPreview();
      if (typeof onApplied === "function") {
        await onApplied();
      }
      showToast(t("nameEntryApplied"));
    } catch (error) {
      showToast(error.message || t("toastError"));
    } finally {
      hideStatus();
    }
  }

  async function open() {
    if (!refs.nameEditorDialog) return;
    if (!refs.nameEditorDialog.open) {
      refs.nameEditorDialog.showModal();
    }
    try {
      await loadNameSets();
      await refreshPreview();
    } catch (error) {
      showToast(error.message || t("toastError"));
    }
  }

  function bind() {
    if (refs.btnOpenNameEditor) {
      refs.btnOpenNameEditor.addEventListener("click", () => {
        open().catch((error) => showToast(error.message || t("toastError")));
      });
    }
    if (refs.btnCloseNameEditor) {
      refs.btnCloseNameEditor.addEventListener("click", close);
    }
    if (refs.btnRefreshNamePreview) {
      refs.btnRefreshNamePreview.addEventListener("click", () => {
        refreshPreview().catch((error) => showToast(error.message || t("toastError")));
      });
    }
    if (refs.nameSetSelect) {
      refs.nameSetSelect.addEventListener("change", () => {
        setActiveSet(refs.nameSetSelect.value)
          .then(() => refreshPreview())
          .catch((error) => showToast(error.message || t("toastError")));
      });
    }
    if (refs.nameEntryForm) {
      refs.nameEntryForm.addEventListener("submit", submitManualEntry);
    }
  }

  return {
    bind,
    open,
    close,
    refreshPreview,
  };
}
