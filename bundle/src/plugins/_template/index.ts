import { AllidroidDevs } from "@lib/utils/constants";
import { definePlugin } from "@plugins";

// Copy this folder to start a new plugin, then list it in plugins/_core/index.ts.
export default definePlugin({
    name: "Template",
    description: "Copy this folder to start a new Allidroid plugin.",
    id: "template",
    version: "1.0.0",
    author: [AllidroidDevs.Kuraa],
    tags: ["Utility"],
    start() { },
    stop() { }
});
