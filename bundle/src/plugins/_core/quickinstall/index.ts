import { AllidroidDevs } from "@lib/utils/constants";

import { definePlugin } from "@plugins";
import patchUrl from "./url";

let patches = [] as (() => unknown)[];

export default definePlugin({
    name: "QuickInstall",
    description: "Quickly install Allidroid plugins and themes",
    id: "quickinstall",
    version: "1.0.0",
    author: [AllidroidDevs.Kuraa],
    tags: ["Utility"],
    start() {
        patches = [patchUrl()];
    },
    stop() {
        patches.forEach(p => p());
    }
});
