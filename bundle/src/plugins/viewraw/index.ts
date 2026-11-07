import { definePlugin } from "@plugins";
import viewraw from "@plugins/viewraw/patches/viewraw";
import { Contributors,Developers } from "@allidroid/Developers";

const patches: any[] = [];

export default definePlugin({
    name: "ViewRaw",
    description: "Copy and view the raw content/data of any message, channel or guild",
    author: [Contributors.sapphire, Contributors.Vendicated, Contributors.Bwlok, Developers.j],
    id: "viewraw",
    version: "1.0.0",
    tags: ["Developers"],
    start() {
        patches.push(...viewraw());
    },
    stop() {
        for (const unpatch of patches) unpatch();
    },
});
