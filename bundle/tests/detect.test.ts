import { expect, test } from "bun:test";

import { detectSettings, isEmptyPlan } from "../src/lib/backup/detect";

test("reads an Allicord backup", () => {
    const plan = detectSettings(JSON.stringify({
        settings: { plugins: { Alpha: { enabled: true }, Beta: { enabled: false, option: 1 } }, themeLinks: ["https://x.test/a.css"] },
        quickCss: "body{color:red}"
    }));
    expect(plan.kind).toBe("Allicord backup");
    expect(plan.pluginStates).toEqual([{ name: "Alpha", enabled: true }, { name: "Beta", enabled: false }]);
    expect(plan.themeLinks).toEqual(["https://x.test/a.css"]);
    expect(plan.customCss).toBe("body{color:red}");
});

test("reads a bare settings file", () => {
    const plan = detectSettings({ plugins: { Alpha: { enabled: true } }, themeLinks: [] });
    expect(plan.pluginStates).toEqual([{ name: "Alpha", enabled: true }]);
});

test("reads a plugin list kept by link", () => {
    const plan = detectSettings({
        "https://a.test/plugin/": { id: "https://a.test/plugin/", enabled: true, manifest: { name: "A" } },
        "https://b.test/plugin/": { enabled: false },
        "https://t.test/theme.json": { selected: true, data: { name: "T", authors: [] } }
    });
    expect(plan.pluginLinks).toEqual([{ url: "https://a.test/plugin/", enabled: true }, { url: "https://b.test/plugin/", enabled: false }]);
    expect(plan.themeLinks).toEqual(["https://t.test/theme.json"]);
});

test("reads a plain on and off list", () => {
    const plan = detectSettings({ Alpha: true, Beta: false });
    expect(plan.kind).toBe("Plugin switches");
    expect(plan.pluginStates).toHaveLength(2);
});

test("reads a list of links", () => {
    const plan = detectSettings(["https://a.test/p/", "https://a.test/t.css", { url: "https://c.test/p/" }]);
    expect(plan.pluginLinks.map(p => p.url)).toEqual(["https://a.test/p/", "https://c.test/p/"]);
    expect(plan.themeLinks).toEqual(["https://a.test/t.css"]);
});

test("finds links in an unknown file", () => {
    const plan = detectSettings({ misc: { installedPlugins: ["https://a.test/p/"], themes: ["https://a.test/x.css"] }, customCss: "a{}" });
    expect(plan.pluginLinks.map(p => p.url)).toEqual(["https://a.test/p/"]);
    expect(plan.themeLinks).toEqual(["https://a.test/x.css"]);
    expect(plan.customCss).toBe("a{}");
});

test("keeps the Allidroid block", () => {
    const plan = detectSettings({ settings: { plugins: {} }, allidroid: { version: 1, plugins: [{ id: "x", url: "https://a.test/p/", enabled: true }], themes: [{ url: "https://a.test/t.json" }] } });
    expect(plan.kind).toBe("Allidroid backup");
    expect(plan.pluginLinks).toEqual([{ url: "https://a.test/p/", enabled: true }]);
    expect(plan.themeLinks).toEqual(["https://a.test/t.json"]);
    expect(plan.allidroid?.version).toBe(1);
});

test("rejects bad input", () => {
    expect(() => detectSettings("nope")).toThrow();
    expect(() => detectSettings('{"__proto__":{"x":1}}')).toThrow();
    expect(isEmptyPlan(detectSettings({ nothing: 1 }))).toBe(true);
});
