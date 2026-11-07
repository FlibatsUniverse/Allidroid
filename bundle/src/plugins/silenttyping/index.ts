import { instead } from "@api/patcher";
import { findByProps } from "@metro/wrappers";
import { definePlugin } from "@plugins";
import { Contributors } from "@allidroid/Developers";

const Typing = findByProps("startTyping", "stopTyping");
const patches: (() => void)[] = [];

export default definePlugin({
    name: "SilentTyping",
    description: "Hide that you are typing",
    author: [Contributors.redstonekasi],
    id: "silenttyping",
    version: "1.0.0",
    tags: ["Privacy"],
    start() {
        patches.push(
            instead("startTyping", Typing, () => {}),
            instead("stopTyping", Typing, () => {})
        );
    },
    stop() {
        for (const unpatch of patches) unpatch();
        patches.length = 0;
    },
});
