import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const origin = 'https://raphaelonuku.com';
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
const unescape = value => value.replaceAll('&amp;', '&').replaceAll('&quot;', '"').replaceAll('&#039;', "'");
async function visit(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name === 'studio') continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) { await visit(path); continue; }
    if (!entry.name.endsWith('.html') || entry.name === '404.html') continue;
    let html = await readFile(path, 'utf8');
    const title = unescape(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || 'Raphael Onuku');
    const description = unescape(html.match(/<meta name="description" content="([^"]*)"/i)?.[1] || 'Peptides for anti-infective drug discovery.');
    const page = relative('dist', path).replaceAll('\\', '/').replace(/index\.html$/, '');
    const canonical = `${origin}/${page}`;
    const image = unescape(html.match(/<meta property="og:image" content="([^"]*)"/i)?.[1] || `${origin}/assets/social-preview-ro-20260910.png`);
    const type = page.startsWith('writing/') && page !== 'writing/' ? 'article' : 'website';
    html = html.replace(/<meta\b[^>]*(?:property="og:[^"]*"|name="twitter:[^"]*")[^>]*>\s*/gi, '')
      .replace(/<link\b[^>]*rel="(?:canonical|icon|apple-touch-icon)"[^>]*>\s*/gi, '');
    const tags = [
      `<link rel="canonical" href="${canonical}">`,
      `<meta property="og:type" content="${type}">`,
      '<meta property="og:site_name" content="Raphael Onuku">',
      `<meta property="og:title" content="${escape(title)}">`,
      `<meta property="og:description" content="${escape(description)}">`,
      `<meta property="og:url" content="${canonical}">`,
      `<meta property="og:image" content="${escape(image)}">`,
      `<meta property="og:image:alt" content="${image.includes('social-preview-ro-') ? 'RO scientific logo' : escape(title)}">`,
      '<meta name="twitter:card" content="summary_large_image">',
      `<meta name="twitter:title" content="${escape(title)}">`,
      `<meta name="twitter:description" content="${escape(description)}">`,
      `<meta name="twitter:image" content="${escape(image)}">`,
      '<link rel="icon" href="/favicon.ico" sizes="any">',
      '<link rel="icon" href="/assets/favicon.svg?v=3" type="image/svg+xml">',
      '<link rel="icon" href="/assets/favicon-32.png?v=3" type="image/png" sizes="32x32">',
      '<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png?v=3" sizes="180x180">'
    ];
    if (image.includes('social-preview-ro-')) tags.push('<meta property="og:image:width" content="1200">', '<meta property="og:image:height" content="630">');
    await writeFile(path, html.replace('</head>', `${tags.join('\n')}\n</head>`));
  }
}
await visit('dist');
