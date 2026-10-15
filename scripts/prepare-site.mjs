import { cp, mkdir, rm } from 'node:fs/promises';

// Regenerate public pages from source instead of deploying stale checked-in copies.
await mkdir('dist', { recursive: true });
await rm('dist/writing', { recursive: true, force: true });
for (const path of ['index.html', 'CNAME', 'favicon.ico', 'assets', 'research', 'publications', 'about', 'impact', 'media', 'contact']) {
  await cp(path, `dist/${path}`, { recursive: true });
}
