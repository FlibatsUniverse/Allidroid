import { expect, test } from "bun:test";

import { LEGACY_API_NAME, wrapLegacyPlugin } from "../src/compat/legacy";

// What a plugin built for an earlier loader looks like: an expression that uses the API by its old name.
const plugin = `{ onLoad() { return api.logger.name + ":" + ${LEGACY_API_NAME}.version; }, onUnload() {} }`.replace("api.", `${LEGACY_API_NAME}.`);

test("an earlier plugin finds the API under its old name", () => {
    const run = (0, eval)(wrapLegacyPlugin(plugin, "https://x.test/p/"));
    const loaded = run({ logger: { name: "log" }, version: "1.0" });
    expect(loaded.onLoad()).toBe("log:1.0");
});

test("the wrapper names the plugin for stack traces", () => {
    expect(wrapLegacyPlugin("{}", "id")).toContain("//# sourceURL=id");
});
