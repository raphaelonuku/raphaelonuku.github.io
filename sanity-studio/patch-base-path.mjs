import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const output = join(process.cwd(), "..", "dist", "studio", "index.html");
const source = await readFile(output, "utf8");
await writeFile(output, source.replaceAll('href="/static/', 'href="/studio/static/'));
