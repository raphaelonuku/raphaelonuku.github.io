# Raphael Onuku

Personal research website for Raphael Onuku.

## Local preview

Run `npm run build`, then serve `dist` with a static file server. The build fetches
published Sanity writing, copies the current static source, standardizes sharing
metadata, and checks internal links and icons. `npm test` checks summaries and
pasted paragraph formatting. An explicitly offline preview can use
`ALLOW_CONTENT_FALLBACK=true npm run build`; deployments must not set that flag.

## GitHub Pages

The workflow builds and publishes on a push to `main`, on a Sanity workflow
dispatch, and on an hourly fallback schedule. New runs cancel obsolete runs in
the existing `pages` concurrency group. The build runs independently of the
protected `github-pages` deployment job. Existing deployment protection rules
remain in force. Sanity Studio is cached by its source and dependency lockfile.

`npm run check:live` compares the live writing archive with published Sanity
entries and checks all public pages. The daily Website health workflow runs the
same check. `build-info.json` records the deployed commit, build time, article
count, and public article slugs for diagnosing stale deployments.

Visitor analytics require an owner-controlled analytics account. No visitor
tracking service is enabled by this repository.
