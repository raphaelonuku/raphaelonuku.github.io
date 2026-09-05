import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";

const ROOT = process.cwd();
const CONTENT_DIR = join(ROOT, "content", "writing");
const OUTPUT_DIR = join(ROOT, "dist", "writing");
const SITE_URL = "https://raphaelonuku.com";

const escapeHtml = (value = "") => String(value)
  .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;").replaceAll("'", "&#039;");

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
  for (const line of match[1].split(/\r?\n/)) {
    if (!line.trim() || line.trimStart().startsWith("#")) continue;
    const field = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (field) data[field[1]] = decodeScalar(field[2]);
  }
  return { data, body: match[2].trim() };
}

function slugify(value) {
  return String(value).normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function renderInline(text) {
  let value = escapeHtml(text);
  value = value.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+["']([^"']*)["'])?\)/g, (_, alt, src, title) =>
    `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}"${title ? ` title="${escapeHtml(title)}"` : ""}>`);
  value = value.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+["']([^"']*)["'])?\)/g, (_, label, href, title) =>
    `<a href="${escapeHtml(href)}"${title ? ` title="${escapeHtml(title)}"` : ""}>${label}</a>`);
  value = value.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  value = value.replace(/__([^_]+)__/g, "<strong>$1</strong>");
  value = value.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "<em>$1</em>");
  value = value.replace(/(?<!_)_([^_]+)_(?!_)/g, "<em>$1</em>");
  value = value.replace(/`([^`]+)`/g, "<code>$1</code>");
  return value;
}

function markdownToHtml(markdown) {
  const output = [];
  let paragraph = [];
  let listType = null;
  let listItems = [];
  const flushParagraph = () => {
    if (paragraph.length) output.push(`<p>${renderInline(paragraph.join(" "))}</p>`);
    paragraph = [];
  };
  const flushList = () => {
    if (!listType) return;
    output.push(`<${listType}>${listItems.map(item => `<li>${renderInline(item)}</li>`).join("")}</${listType}>`);
    listType = null;
    listItems = [];
  };
  for (const line of markdown.replaceAll("\r\n", "\n").split("\n")) {
    const heading = line.match(/^(#{2,4})\s+(.+)$/);
    const unordered = line.match(/^[-*+]\s+(.+)$/);
    const ordered = line.match(/^\d+[.)]\s+(.+)$/);
    const quote = line.match(/^>\s?(.*)$/);
    if (!line.trim()) { flushParagraph(); flushList(); continue; }
    if (heading) { flushParagraph(); flushList(); output.push(`<h${heading[1].length}>${renderInline(heading[2])}</h${heading[1].length}>`); continue; }
    if (unordered || ordered) {
      flushParagraph();
      const nextType = unordered ? "ul" : "ol";
      if (listType && listType !== nextType) flushList();
      listType = nextType;
      listItems.push((unordered || ordered)[1]);
      continue;
    }
    if (quote) { flushParagraph(); flushList(); output.push(`<blockquote><p>${renderInline(quote[1])}</p></blockquote>`); continue; }
    paragraph.push(line.trim());
  }
  flushParagraph();
  flushList();
  return output.join("\n        ");
}

function readingTime(body) {
  return Math.max(1, Math.ceil(body.trim().split(/\s+/).filter(Boolean).length / 220));
}

function formatDate(value) {
  const date = new Date(`${value}T12:00:00Z`);
  if (Number.isNaN(date.valueOf())) return value;
  return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }).format(date);
}

function titleFromFilename(filename) {
  const cleaned = basename(filename, ".md")
    .replace(/^\d{4}-\d{2}-\d{2}(?:-\d{2}-\d{2}-\d{2})?-/, "")
    .replace(/[-_]+/g, " ")
    .trim();
  return cleaned ? cleaned.replace(/\b\w/g, letter => letter.toUpperCase()) : "Untitled writing";
}

function plainText(markdown) {
  return markdown
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[#>*_`~-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeArticle(data, body, file) {
  const text = plainText(body);
  const title = String(data.title || "").trim() || titleFromFilename(file);
  const date = String(data.date || "").trim() || new Date().toISOString().slice(0, 10);
  return {
    ...data,
    title,
    subtitle: String(data.subtitle || "").trim(),
    category: String(data.category || "").trim() || "Reflections",
    series: String(data.series || "").trim(),
    date,
    summary: String(data.summary || "").trim() || text.slice(0, 180) || "A new entry from Raphael S. Onuku.",
    image: String(data.image || "").trim(),
    image_alt: String(data.image_alt || "").trim(),
    body: body.trim(),
    slug: slugify(basename(file, ".md")),
    minutes: readingTime(body)
  };
}

function nav(prefix) {
  const links = [["Home", prefix], ["Research", `${prefix}research/`], ["Publications", `${prefix}publications/`], ["Writing", `${prefix}writing/`], ["About", `${prefix}about/`], ["Impact", `${prefix}impact/`], ["Contact", `${prefix}contact/`]];
  return `<header class="site-header"><nav class="nav-shell" aria-label="Main navigation"><a class="brand" href="${prefix}"><img class="brand-mark" src="${prefix}assets/favicon.svg" alt=""><span>Raphael Onuku</span></a><button class="menu-toggle" type="button" aria-expanded="false" aria-controls="main-menu">Menu</button><div class="nav-links" id="main-menu">${links.map(([label, href]) => `<a href="${href}"${label === "Writing" ? ' aria-current="page"' : ""}>${label}</a>`).join("")}</div></nav></header>`;
}

function socials(prefix) {
  return `<div class="social-links" aria-label="Professional profiles"><a href="https://www.linkedin.com/in/raphaelonuku/" aria-label="LinkedIn"><img src="${prefix}assets/icons/linkedin.svg" alt=""></a><a href="https://scholar.google.com/citations?user=BeNWFb0AAAAJ&amp;hl=en" aria-label="Google Scholar"><img src="${prefix}assets/icons/scholar.svg" alt=""></a><a href="https://www.researchgate.net/profile/Raphael-Onuku" aria-label="ResearchGate"><img src="${prefix}assets/icons/researchgate.svg" alt=""></a><a href="https://orcid.org/0000-0003-2564-2109" aria-label="ORCID"><img src="${prefix}assets/icons/orcid.svg" alt=""></a><a href="https://x.com/RaphaelOnuku" aria-label="X"><img src="${prefix}assets/icons/x.svg" alt=""></a></div>`;
}

function articlePage(article) {
  const prefix = "../../";
  const title = escapeHtml(article.title);
  const subtitle = escapeHtml(article.subtitle);
  const summary = escapeHtml(article.summary);
  const category = escapeHtml(article.category);
  const series = article.series ? ` · ${escapeHtml(article.series)}` : "";
  const socialImage = article.image ? `${SITE_URL}${article.image}` : `${SITE_URL}/assets/social-preview.jpg`;
  const cover = article.image ? `<figure class="article-cover"><img src="${escapeHtml(article.image)}" alt="${escapeHtml(article.image_alt || "")}"></figure>` : "";
  const articleContent = article.body ? markdownToHtml(article.body) : "<p>This entry has no article text yet.</p>";
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="description" content="${summary}"><link rel="canonical" href="${SITE_URL}/writing/${article.slug}/"><meta property="og:type" content="article"><meta property="og:title" content="${title} | Raphael S. Onuku"><meta property="og:description" content="${subtitle}"><meta property="og:url" content="${SITE_URL}/writing/${article.slug}/"><meta property="og:image" content="${socialImage}"><meta property="article:published_time" content="${escapeHtml(article.date)}"><meta property="article:author" content="Raphael S. Onuku"><meta property="article:section" content="${category}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${title} | Raphael S. Onuku"><meta name="twitter:description" content="${subtitle}"><meta name="twitter:image" content="${socialImage}"><meta name="theme-color" content="#07111f"><title>${title} | Raphael S. Onuku</title><link rel="icon" href="/favicon.ico" sizes="any"><link rel="icon" href="/assets/favicon.svg?v=2" type="image/svg+xml"><link rel="icon" href="/assets/favicon-32.png?v=2" type="image/png" sizes="32x32"><link rel="apple-touch-icon" href="/assets/apple-touch-icon.png?v=2"><link rel="stylesheet" href="${prefix}assets/styles.css?v=20260905c"></head>
<body><a class="skip-link" href="#main">Skip to content</a>${nav(prefix)}<main id="main"><header class="page-hero article-hero"><div class="article-hero-inner"><p class="eyebrow">${category}${series}</p><h1>${title}</h1>${subtitle ? `<p class="article-deck">${subtitle}</p>` : ""}<div class="article-meta"><span>By Raphael S. Onuku</span><time datetime="${escapeHtml(article.date)}">${escapeHtml(formatDate(article.date))}</time><span>${article.minutes} minute read</span></div></div></header>${cover}<div class="article-shell"><aside class="article-aside"><p>${category}</p><a href="../">← All writing</a></aside><article class="article-body">${articleContent}</article></div><section class="section article-next"><p class="kicker">More writing</p><h2>Ideas, experiences, and practical guidance.</h2><p>Return to the Writing collection for more reflections, mentorship, science, community, and announcements.</p><a class="button primary" href="../">Return to Writing <span class="arrow">↗</span></a></section></main><footer class="footer"><div class="footer-meta"><span>Raphael S. Onuku</span>${socials(prefix)}<span>© <span data-year></span></span></div></footer><script src="${prefix}assets/site.js"></script></body></html>`;
}

function card(article, featured = false) {
  const link = `${article.slug}/`;
  if (featured) return `<article class="writing-feature"><div class="writing-feature-meta"><span>${escapeHtml(article.category)}</span><span>${escapeHtml(formatDate(article.date))}</span><span>${article.minutes} minute read</span></div><div class="writing-feature-body"><h2><a href="${link}">${escapeHtml(article.title)}</a></h2><p>${escapeHtml([article.series, article.subtitle].filter(Boolean).join(". "))}</p><p>${escapeHtml(article.summary)}</p><a class="button primary" href="${link}">Read the essay <span class="arrow">↗</span></a></div></article>`;
  return `<article class="writing-card"><p class="writing-card-meta">${escapeHtml(article.category)} · ${escapeHtml(formatDate(article.date))}</p><h3><a href="${link}">${escapeHtml(article.title)}</a></h3><p>${escapeHtml(article.summary)}</p><a class="text-link" href="${link}">Read <span aria-hidden="true">↗</span></a></article>`;
}

function writingIndex(articles) {
  const featured = articles.find(item => item.featured) || articles[0];
  const remaining = articles.filter(item => item !== featured);
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="description" content="Essays, reflections, mentorship guidance, and announcements from Raphael S. Onuku."><link rel="canonical" href="${SITE_URL}/writing/"><meta property="og:type" content="website"><meta property="og:title" content="Writing | Raphael S. Onuku"><meta property="og:description" content="Ideas worth sharing on opportunity, mentorship, science, community, and life."><meta property="og:url" content="${SITE_URL}/writing/"><meta property="og:image" content="${SITE_URL}/assets/social-preview.jpg"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="Writing | Raphael S. Onuku"><meta name="twitter:description" content="Ideas worth sharing on opportunity, mentorship, science, community, and life."><meta name="twitter:image" content="${SITE_URL}/assets/social-preview.jpg"><meta name="theme-color" content="#07111f"><title>Writing | Raphael S. Onuku</title><link rel="icon" href="/favicon.ico" sizes="any"><link rel="icon" href="/assets/favicon.svg?v=2" type="image/svg+xml"><link rel="icon" href="/assets/favicon-32.png?v=2" type="image/png" sizes="32x32"><link rel="apple-touch-icon" href="/assets/apple-touch-icon.png?v=2"><link rel="stylesheet" href="../assets/styles.css?v=20260905c"></head>
<body><a class="skip-link" href="#main">Skip to content</a>${nav("../")}<main id="main"><header class="page-hero"><div class="writing-intro"><p class="eyebrow">Writing</p><h1>Ideas worth sharing.</h1><p class="intro">Reflections on opportunity, mentorship, science, community, and the experiences that shape a life. This is also where I share announcements that may help others move forward.</p></div></header>${featured ? `<section class="section"><p class="kicker">Featured essay</p>${card(featured, true)}</section>` : ""}${remaining.length ? `<section class="section writing-archive"><div class="section-head"><p class="kicker">Latest writing</p><div><h2>Recent essays and announcements.</h2></div></div><div class="writing-card-grid">${remaining.map(item => card(item)).join("")}</div></section>` : ""}<section class="section blue"><div class="section-head"><p class="kicker">The notebook</p><div><h2>Experience becomes useful when it is shared.</h2><p class="section-lede">This collection will grow across personal reflections, mentorship, science and society, community work, and timely announcements.</p><div class="writing-categories" aria-label="Writing categories"><span>Reflections</span><span>Experiences</span><span>Mentorship</span><span>Science and Society</span><span>Community</span><span>Announcements</span></div></div></div></section></main><footer class="footer"><div class="footer-call"><h2>Words can become <span>direction.</span></h2><a class="button primary" href="../contact/">Start a conversation <span class="arrow">↗</span></a></div><div class="footer-meta"><span>Raphael S. Onuku</span>${socials("../")}<span>© <span data-year></span></span></div></footer><script src="../assets/site.js"></script></body></html>`;
}

async function updateHomepage(featured) {
  if (!featured) return;
  const homepagePath = join(ROOT, "dist", "index.html");
  let homepage = await readFile(homepagePath, "utf8");
  const start = "<!-- WRITING_FEATURE_START -->";
  const end = "<!-- WRITING_FEATURE_END -->";
  const block = `${start}\n    <section class="section writing-teaser"><div class="writing-teaser-grid" data-reveal><p class="kicker">Latest writing · ${escapeHtml(featured.category)}</p><div><h2>${escapeHtml(featured.title)}</h2><p>${escapeHtml(featured.summary)}</p><a class="button" href="writing/${featured.slug}/">Read the latest essay <span class="arrow">↗</span></a></div></div></section>\n    ${end}`;
  const pattern = new RegExp(`${start}[\\s\\S]*?${end}`);
  if (!pattern.test(homepage)) throw new Error("Homepage writing markers are missing");
  await writeFile(homepagePath, homepage.replace(pattern, block));
}

async function main() {
  const files = (await readdir(CONTENT_DIR)).filter(file => file.endsWith(".md"));
  const articles = [];
  for (const file of files) {
    const { data, body } = parseDocument(await readFile(join(CONTENT_DIR, file), "utf8"), file);
    if (data.published !== true) continue;
    articles.push(normalizeArticle(data, body, file));
  }
  articles.sort((a, b) => String(b.date).localeCompare(String(a.date)));
  await mkdir(OUTPUT_DIR, { recursive: true });
  for (const article of articles) {
    const articleDir = join(OUTPUT_DIR, article.slug);
    await mkdir(articleDir, { recursive: true });
    await writeFile(join(articleDir, "index.html"), articlePage(article));
  }
  await writeFile(join(OUTPUT_DIR, "index.html"), writingIndex(articles));
  await updateHomepage(articles.find(item => item.featured) || articles[0]);
  console.log(`Built ${articles.length} published writing entr${articles.length === 1 ? "y" : "ies"}`);
}

main().catch(error => { console.error(error); process.exitCode = 1; });
