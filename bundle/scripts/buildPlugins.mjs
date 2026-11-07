// @ts-nocheck
import { existsSync } from "fs";
import { mkdir, readdir, readFile, writeFile } from "fs/promises";
import path from "path";

const entries = [];

// Plugins built into the app itself have no code to download. They are listed so the website can show them,
// and what is listed is read from their own definitions so it cannot drift.
const people = {};
const personRe = /(\w+):\s*\{\s*name:\s*"([^"]+)",\s*id:\s*"?(\d+)n?"?/g;
for (const file of ["src/allidroid/Developers.ts", "src/lib/utils/constants.ts"]) {
    for (const [, key, name, id] of (await readFile(file, "utf8")).matchAll(personRe)) people[key] = { name, id };
}

async function* builtInFiles(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
        if (!entry.isDirectory() || (entry.name.startsWith("_") && entry.name !== "_core")) continue;
        const folder = path.join(dir, entry.name);
        if (entry.name === "_core") yield* builtInFiles(folder);
        else for (const f of ["index.ts", "index.tsx"]) if (existsSync(path.join(folder, f))) yield path.join(folder, f);
    }
}

const pick = (text, re) => text.match(re)?.[1];
const flag = (text, key) => new RegExp(`\\b${key}:\\s*true`).test(text) || undefined;
const list = (text, key) => pick(text, new RegExp(`\\b${key}:\\s*\\[([^\\]]*)\\]`))?.split(",").map(s => s.trim().replace(/^"|"$/g, "")).filter(Boolean);

for await (const file of builtInFiles("src/plugins")) {
    const text = await readFile(file, "utf8");
    const start = text.indexOf("definePlugin({");
    if (start === -1) continue;
    const head = text.slice(start);

    const id = pick(head, /\bid:\s*"([^"]+)"/);
    const authors = (list(head, "author") ?? []).map(entry => {
        const key = entry.split(".").pop();
        if (!people[key]) throw new Error(`${file}: unknown author ${key}`);
        return people[key];
    });

    const manifest = {
        id: id.startsWith("allidroid.") ? id : `allidroid.${id}`,
        spec: 3,
        version: pick(head, /\bversion:\s*"([^"]+)"/),
        type: "plugin",
        display: {
            name: pick(head, /\bname:\s*"([^"]+)"/),
            description: pick(head, /\bdescription:\s*"((?:[^"\\]|\\.)*)"/),
            authors
        },
        tags: list(head, "tags"),
        searchTerms: list(head, "searchTerms"),
        dependencies: list(head, "dependencies"),
        conflicts: list(head, "conflicts"),
        required: flag(head, "required"),
        hidden: flag(head, "hidden"),
        enabledByDefault: flag(head, "enabledByDefault"),
        requiresRestart: flag(head, "requiresRestart")
    };

    entries.push({
        id: manifest.id,
        name: manifest.display.name,
        description: manifest.display.description,
        version: manifest.version,
        authors,
        platform: "mobile",
        builtIn: true,
        path: path.relative("..", path.dirname(file)).replace(/\\/g, "/"),
        manifest: JSON.parse(JSON.stringify(manifest))
    });
}

await mkdir("dist", { recursive: true });
await writeFile("dist/plugins.json", JSON.stringify(entries));
console.log(`Built ${entries.filter(e => e.code).length} downloadable plugins, listed ${entries.length}`);
