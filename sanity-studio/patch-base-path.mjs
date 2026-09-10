import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const output = join(process.cwd(), "..", "dist", "studio", "index.html");
const source = await readFile(output, "utf8");
const restoreStudioPath = `<script>(function(){var key="sanityStudioPath";var path=sessionStorage.getItem(key);if(path){sessionStorage.removeItem(key);history.replaceState(null,"",path)}})()</script>`;
const basePatched = source.replaceAll('href="/static/', 'href="/studio/static/');
const patched = basePatched.includes('sanityStudioPath')
  ? basePatched
  : basePatched.replace("</head>", `${restoreStudioPath}</head>`);

await writeFile(output, patched);

const fallback = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex">
  <title>Page not found | Raphael Onuku</title>
  <script>
    (function () {
      var path = window.location.pathname;
      if (path === "/studio" || path.indexOf("/studio/") === 0) {
        sessionStorage.setItem("sanityStudioPath", path + window.location.search + window.location.hash);
        window.location.replace("/studio/");
      }
    })();
  </script>
  <style>
    body{margin:0;min-height:100vh;display:grid;place-items:center;background:#071526;color:#f7f8fa;font-family:Arial,sans-serif}
    main{max-width:40rem;padding:2rem;text-align:center}h1{font-size:clamp(3rem,12vw,8rem);margin:0;color:#55d9f7}p{font-size:1.1rem;line-height:1.6;color:#b8c2cf}a{color:#071526;background:#ffc400;padding:.9rem 1.2rem;text-decoration:none;font-weight:700;display:inline-block;margin-top:1rem}
  </style>
</head>
<body><main><h1>404</h1><p>The page you requested could not be found.</p><a href="/">Return home</a></main></body>
</html>`;

await writeFile(join(process.cwd(), "..", "dist", "404.html"), fallback);
