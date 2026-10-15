const PROJECT_ID = process.env.SANITY_PROJECT_ID || "o7wl4x52";
const DATASET = process.env.SANITY_DATASET || "production";
const API_VERSION = "2026-09-01";

const escapeHtml = (value = "") => String(value)
  .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;").replaceAll("'", "&#039;");

function renderSpan(span, markDefs = []) {
  let value = escapeHtml(span.text || "").replaceAll("\n", "<br>");
  for (const mark of span.marks || []) {
    if (mark === "strong") value = `<strong>${value}</strong>`;
    else if (mark === "em") value = `<em>${value}</em>`;
    else if (mark === "code") value = `<code>${value}</code>`;
    else {
      const definition = markDefs.find(item => item._key === mark);
      if (definition?._type === "link" && definition.href) {
        value = `<a href="${escapeHtml(definition.href)}">${value}</a>`;
      }
    }
  }
  return value;
}

export function portableTextToHtml(blocks = []) {
  const output = [];
  let listType = null;
  let listItems = [];
  const flushList = () => {
    if (!listType) return;
    output.push(`<${listType}>${listItems.map(item => `<li>${item}</li>`).join("")}</${listType}>`);
    listType = null;
    listItems = [];
  };

  for (const block of blocks || []) {
    if (block._type === "image" && block.url) {
      flushList();
      output.push(`<figure><img src="${escapeHtml(block.url)}" alt="${escapeHtml(block.alt || "")}"></figure>`);
      continue;
    }
    if (block._type !== "block") continue;
    const content = (block.children || []).map(span => renderSpan(span, block.markDefs || [])).join("");
    if (block.listItem) {
      const nextType = block.listItem === "number" ? "ol" : "ul";
      if (listType && listType !== nextType) flushList();
      listType = nextType;
      listItems.push(content);
      continue;
    }
    flushList();
    if (["h2", "h3", "h4"].includes(block.style)) output.push(`<${block.style}>${content}</${block.style}>`);
    else if (block.style === "blockquote") output.push(`<blockquote><p>${content}</p></blockquote>`);
    else {
      const paragraphs = [''];
      for (const span of block.children || []) {
        String(span.text || '').split(/\r?\n/).forEach((line, index) => {
          if (index) paragraphs.push('');
          if (line) paragraphs[paragraphs.length - 1] += renderSpan({ ...span, text: line }, block.markDefs || []);
        });
      }
      for (const paragraph of paragraphs.filter(value => value.trim())) output.push(`<p>${paragraph}</p>`);
    }
  }
  flushList();
  if (output.length && output.at(-1).startsWith("<p>")) {
    output[output.length - 1] = output.at(-1).replace("<p>", '<p class="article-closing">');
  }
  return output.join("\n        ");
}

export async function fetchSanityWriting() {
  const query = `*[_type == "writing" && !(_id in path("drafts.**"))] | order(publishedAt desc, _createdAt desc){_id,_createdAt,title,subtitle,category,series,publishedAt,summary,slug,body[]{...,_type == "image" => {"url": asset->url,alt}},"image": image.asset->url,"image_alt": image.alt,"social_image": socialImage.asset->url}`;
  const endpoint = `https://${PROJECT_ID}.api.sanity.io/v${API_VERSION}/data/query/${DATASET}?query=${encodeURIComponent(query)}`;
  let lastError;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(endpoint, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(15000) });
      if (!response.ok) throw new Error(`Sanity returned ${response.status}`);
      const payload = await response.json();
      if (!Array.isArray(payload.result)) throw new Error('Sanity did not return an article list');
      return payload.result;
    } catch (error) {
      lastError = error;
      if (attempt < 2) await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
  throw lastError;
}
