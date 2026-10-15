import { readFile, readdir, stat } from 'node:fs/promises';
import { resolve, join, relative } from 'node:path';

const root = resolve('dist');
const errors = [];
const pages = [];
async function walk(path) {
  for (const entry of await readdir(path, { withFileTypes: true })) {
    if (entry.name === 'studio') continue;
    const child = join(path, entry.name);
    if (entry.isDirectory()) await walk(child);
    else if (entry.name.endsWith('.html') && entry.name !== '404.html') pages.push(child);
  }
}
await walk(root);
for (const path of pages) {
  const html = await readFile(path, 'utf8');
  const label = relative(root, path);
  for (const marker of ['<title>', 'name="description"', 'rel="canonical"', 'property="og:title"', 'property="og:image"', 'name="twitter:card"', 'sizes="180x180"']) {
    if (!html.includes(marker)) errors.push(`${label} lacks ${marker}`);
  }
  if ((html.match(/<h1\b/g) || []).length !== 1) errors.push(`${label} must have one main heading`);
  if (/<button\b[^>]*role="listitem"/.test(html)) errors.push(`${label} overrides a button role`);
  for (const image of html.matchAll(/<img\b[^>]*>/g)) {
    if (!/\balt=/.test(image[0])) errors.push(`${label} has an image without alt text`);
  }
  const pageUrl = new URL(label.replace(/index\.html$/, ''), 'https://raphaelonuku.com/');
  for (const [, value] of html.matchAll(/(?:href|src|poster)="([^"<>]+)"/g)) {
    const url = new URL(value.replaceAll('&amp;', '&'), pageUrl);
    if (url.origin !== pageUrl.origin) continue;
    const target = resolve(root, `.${decodeURIComponent(url.pathname)}`);
    if (!target.startsWith(`${root}/`) && target !== root) { errors.push(`${label} links outside the site`); continue; }
    try {
      const info = await stat(target);
      const file = info.isDirectory() ? join(target, 'index.html') : target;
      await stat(file);
      if (url.hash && file.endsWith('.html')) {
        const content = await readFile(file, 'utf8');
        const id = decodeURIComponent(url.hash.slice(1));
        if (!content.includes(`id="${id}"`)) errors.push(`${label} links to missing anchor ${url.pathname}${url.hash}`);
      }
    } catch { errors.push(`${label} links to missing file ${url.pathname}`); }
  }
}
const icon = await readFile(join(root, 'assets/apple-touch-icon.png'));
if (icon.readUInt32BE(16) !== 180 || icon.readUInt32BE(20) !== 180) errors.push('Apple touch icon must be 180 by 180 pixels');
const sitemap = await readFile(join(root, 'sitemap.xml'), 'utf8');
const locations = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1]);
if (new Set(locations).size !== locations.length) errors.push('Sitemap has duplicate addresses');
if (errors.length) throw new Error(errors.join('\n'));
console.log(`Validated ${pages.length} pages, internal links, metadata, controls, and icon dimensions.`);
