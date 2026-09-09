import { readFile, readdir } from "node:fs/promises";
import { basename, extname, join } from "node:path";

const ROOT = process.cwd();
const CONTENT_DIR = join(ROOT, "content", "writing");
const PROJECT_ID = process.env.SANITY_PROJECT_ID || "o7wl4x52";
const DATASET = process.env.SANITY_DATASET || "production";
const TOKEN = process.env.SANITY_WRITE_TOKEN;
const API_VERSION = "2026-09-01";
let keyIndex = 0;

if (!TOKEN) throw new Error("SANITY_WRITE_TOKEN is required");

const nextKey = () => `k${(++keyIndex).toString(36)}`;

function decodeScalar(raw = "") {
  const value = raw.trim();
  if (value === "true") return true;
  if (value === "false") return false;
  if (value === "null" || value === "~") return null;
  if (value.startsWith('"') && value.endsWith('"')) {
    try { return JSON.parse(value); } catch { return value.slice(1, -1); }
  }
  if (value.startsWith("'") && value.endsWith("'")) return value.slice(1, -1).replaceAll("''", "'");
  return value;
}

function parseDocument(source, filename) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) throw new Error(`${filename} is missing YAML frontmatter`);
  const data = {};
  const lines = match[1].split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const field = lines[index].match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!field) continue;
    if (/^[>|][+-]?$/.test(field[2])) {
      const parts = [];
      while (index + 1 < lines.length && /^\s+/.test(lines[index + 1])) {
        parts.push(lines[index + 1].trim());
        index += 1;
      }
      data[field[1]] = field[2].startsWith(">") ? parts.join(" ") : parts.join("\n");
    } else {
      const parts = [field[2]];
      while (index + 1 < lines.length && /^\s+/.test(lines[index + 1])) {
        parts.push(lines[index + 1].trim());
        index += 1;
      }
      data[field[1]] = decodeScalar(parts.join(" "));
    }
  }
  return { data, body: match[2].trim() };
}

function slugify(value) {
  return String(value).normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function inlineChildren(text) {
  const children = [];
  const markDefs = [];
  const pattern = /(\*\*[^*]+\*\*|(?<!\*)\*[^*]+\*(?!\*)|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let cursor = 0;
  for (const match of text.matchAll(pattern)) {
    if (match.index > cursor) children.push({ _type: "span", _key: nextKey(), text: text.slice(cursor, match.index), marks: [] });
    const token = match[0];
    if (token.startsWith("**")) children.push({ _type: "span", _key: nextKey(), text: token.slice(2, -2), marks: ["strong"] });
    else if (token.startsWith("*")) children.push({ _type: "span", _key: nextKey(), text: token.slice(1, -1), marks: ["em"] });
    else if (token.startsWith("`")) children.push({ _type: "span", _key: nextKey(), text: token.slice(1, -1), marks: ["code"] });
    else {
      const link = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      const markKey = nextKey();
      markDefs.push({ _type: "link", _key: markKey, href: link[2] });
      children.push({ _type: "span", _key: nextKey(), text: link[1], marks: [markKey] });
    }
    cursor = match.index + token.length;
  }
  if (cursor < text.length || !children.length) children.push({ _type: "span", _key: nextKey(), text: text.slice(cursor), marks: [] });
  return { children, markDefs };
}

function block(text, style = "normal", listItem) {
  const inline = inlineChildren(text);
  return { _type: "block", _key: nextKey(), style, ...inline, ...(listItem ? { listItem, level: 1 } : {}) };
}

function markdownToPortableText(markdown) {
  const output = [];
  let paragraph = [];
  const flush = () => {
    if (paragraph.length) output.push(block(paragraph.join("\n")));
    paragraph = [];
  };
  for (const rawLine of markdown.replaceAll("\r\n", "\n").split("\n")) {
    const line = rawLine.trimEnd();
    const heading = line.match(/^(#{2,4})\s+(.+)$/);
    const unordered = line.match(/^(?:[-*+]\s+|•\s*)(.+)$/);
    const ordered = line.match(/^\d+[.)]\s+(.+)$/);
    const quote = line.match(/^>\s?(.*)$/);
    if (!line.trim()) { flush(); continue; }
    if (heading) { flush(); output.push(block(heading[2], `h${Math.min(4, heading[1].length)}`)); continue; }
    if (unordered) { flush(); output.push(block(unordered[1], "normal", "bullet")); continue; }
    if (ordered) { flush(); output.push(block(ordered[1], "normal", "number")); continue; }
    if (quote) { flush(); output.push(block(quote[1], "blockquote")); continue; }
    paragraph.push(line.trimStart().replace(/ {2}$/, "\n"));
  }
  flush();
  return output;
}

async function uploadImage(sitePath) {
  if (!sitePath) return undefined;
  const localPath = join(ROOT, "dist", sitePath.replace(/^\//, ""));
  const bytes = await readFile(localPath);
  const extension = extname(localPath).toLowerCase();
  const types = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".gif": "image/gif" };
  const endpoint = `https://${PROJECT_ID}.api.sanity.io/v${API_VERSION}/assets/images/${DATASET}?filename=${encodeURIComponent(basename(localPath))}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": types[extension] || "application/octet-stream" },
    body: bytes
  });
  if (!response.ok) throw new Error(`Image upload failed with ${response.status}`);
  const payload = await response.json();
  return { _type: "image", asset: { _type: "reference", _ref: payload.document._id } };
}

async function migrate() {
  const filenames = (await readdir(CONTENT_DIR)).filter(file => file.endsWith(".md"));
  const documents = [];
  for (const filename of filenames) {
    const { data, body } = parseDocument(await readFile(join(CONTENT_DIR, filename), "utf8"), filename);
    if (data.published !== true) continue;
    const title = String(data.title || "Untitled writing").trim();
    const series = String(data.series || "").trim();
    const slugTitle = series && !title.toLowerCase().includes(series.toLowerCase()) ? `${title} ${series}` : title;
    const slug = slugify(slugTitle);
    const image = await uploadImage(String(data.image || "").trim());
    const socialImage = await uploadImage(String(data.social_image || "").trim());
    if (image && data.image_alt) image.alt = String(data.image_alt);
    documents.push({
      _id: `writing-${slug}`,
      _type: "writing",
      title,
      subtitle: String(data.subtitle || "").trim(),
      category: String(data.category || "Reflections").trim(),
      series,
      slug: { _type: "slug", current: slug },
      publishedAt: `${String(data.date || new Date().toISOString().slice(0, 10)).slice(0, 10)}T12:00:00.000Z`,
      summary: String(data.summary || "").trim(),
      ...(image ? { image } : {}),
      ...(socialImage ? { socialImage } : {}),
      body: markdownToPortableText(body)
    });
  }
  const endpoint = `https://${PROJECT_ID}.api.sanity.io/v${API_VERSION}/data/mutate/${DATASET}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ mutations: documents.map(document => ({ createOrReplace: document })) })
  });
  if (!response.ok) throw new Error(`Content migration failed with ${response.status} ${await response.text()}`);
  console.log(`Migrated ${documents.length} published writing entries to Sanity`);
}

migrate().catch(error => { console.error(error); process.exitCode = 1; });

