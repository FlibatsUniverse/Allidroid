import { definePlugin } from "@plugins";
import { Contributors,Developers } from "@allidroid/Developers";

import { onLoad } from "./patches/showimagelinks";

const patches: any[] = [];

export default definePlugin({
    name: "ImageLink",
    description: "Never hide image links in messages, even if it's the only content",
    author: [Contributors.Cynosphere, Developers.reyyan1],
    id: "imagelink",
    version: "1.0.0",
    tags: ["Chat"],
    start() {
        patches.push(
            onLoad()
        );
    },
    stop() {
        for (const unpatch of patches) unpatch();

    },
});
