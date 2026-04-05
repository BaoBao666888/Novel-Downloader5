export function parseNameSetText(raw) {
  const text = String(raw || "").replace(/^\uFEFF/, "");
  const entries = {};
  let validLineCount = 0;
  for (const line of text.split(/\r?\n/)) {
    const trimmed = String(line || "").trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex <= 0) continue;
    const source = trimmed.slice(0, eqIndex).trim();
    const target = trimmed.slice(eqIndex + 1).trim();
    if (!source || !target) continue;
    entries[source] = target;
    validLineCount += 1;
  }
  return {
    entries,
    validLineCount,
    entryCount: Object.keys(entries).length,
  };
}

export function serializeNameSetText(entries) {
  const lines = [];
  for (const [rawSource, rawTarget] of Object.entries(entries || {})) {
    const source = String(rawSource || "").trim();
    const target = String(rawTarget || "").trim();
    if (!source || !target) continue;
    lines.push(`${source}=${target}`);
  }
  return lines.join("\n");
}

export function downloadPlainTextFile(text, fileName) {
  const blob = new Blob([String(text || "")], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
