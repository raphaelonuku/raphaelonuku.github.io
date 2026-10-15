import { fetchSanityWriting } from './sanity-content.mjs';

const origin = 'https://raphaelonuku.com';
async function get(path) {
  const response = await fetch(`${origin}${path}`, { signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error(`${path} returned ${response.status}`);
  return response;
}
const info = await (await get(`/build-info.json?check=${Date.now()}`)).json();
const documents = await fetchSanityWriting();
const slugify = value => value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const slugs = documents.map(document => {
  const title = String(document.title || '').trim() || 'Untitled writing';
  const series = String(document.series || '').trim();
  return document.slug?.current || slugify(series && !title.toLowerCase().includes(series.toLowerCase()) ? `${title} ${series}` : title);
});
if (JSON.stringify([...slugs].sort()) !== JSON.stringify([...info.slugs].sort())) throw new Error('The live writing archive differs from published Sanity content');
for (const path of ['/', '/research/', '/publications/', '/writing/', '/about/', '/impact/', '/media/', '/contact/', ...slugs.map(slug => `/writing/${slug}/`)]) {
  const html = await (await get(path)).text();
  if (!html.includes('rel="canonical"') || !html.includes('property="og:image"')) throw new Error(`${path} has incomplete sharing metadata`);
}
console.log(`Live website is healthy with ${slugs.length} articles. Build ${info.commit}.`);
