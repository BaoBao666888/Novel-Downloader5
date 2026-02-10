export function normalizeReaderText(text) {
  let value = String(text == null ? "" : text);
  value = value.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  value = value.replace(/\\r\\n/g, "\n").replace(/\\n/g, "\n").replace(/\\r/g, "\n");
  value = value.replace(/\\\s*n/g, "\n");
  value = value.replace(/\\\s*r/g, "\n");
  value = value.replace(/\u2028/g, "\n").replace(/\u2029/g, "\n");
  value = value.replace(/\n{3,}/g, "\n\n");
  return value.trim();
}

export function normalizeDisplayTitle(text) {
  const value = normalizeReaderText(text || "").replace(/\s+/g, " ").trim();
  if (!value) return "";
  const chars = Array.from(value);
  for (let i = 0; i < chars.length; i += 1) {
    const ch = chars[i];
    if (!ch || /\s/.test(ch)) continue;
    const isLetter = ch.toLowerCase() !== ch.toUpperCase();
    if (!isLetter) return value;
    chars[i] = ch.toUpperCase();
    return chars.join("");
  }
  return value;
}

export function buildParagraphNodes(text, emptyText) {
  const content = normalizeReaderText(text);
  const fragment = document.createDocumentFragment();
  if (!content) {
    const p = document.createElement("p");
    p.textContent = emptyText;
    fragment.appendChild(p);
    return fragment;
  }

  const blocks = content.split(/\n{2,}/g).map((x) => x.trim()).filter(Boolean);
  for (const block of blocks) {
    const p = document.createElement("p");
    const lines = block.split(/\n/g);
    for (let i = 0; i < lines.length; i += 1) {
      if (i > 0) p.appendChild(document.createElement("br"));
      p.appendChild(document.createTextNode(lines[i]));
    }
    fragment.appendChild(p);
  }
  return fragment;
}
