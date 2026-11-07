import { expect, test } from "bun:test";

import { computeClean } from "../src/plugins/cleanchannelname/clean";

test("removes emoji and decoration from a text channel", () => {
    expect(computeClean("🔥-general-chat", 0)).toBe("general-chat");
    expect(computeClean("┃general┃chat", 0)).toBe("general-chat");
    expect(computeClean("★-news-★", 0)).toBe("news");
});

test("uses spaces in voice channels", () => {
    expect(computeClean("🎮┃game night", 2)).toBe("game night");
});

test("turns small caps into letters", () => {
    expect(computeClean("ɢᴇɴᴇʀᴀʟ", 0)).toBe("general");
});

test("keeps the name when nothing is left", () => {
    expect(computeClean("🔥", 0)).toBe("🔥");
});

test("can show spaces instead of dashes", () => {
    expect(computeClean("general-chat", 0, true)).toBe("general chat");
    expect(computeClean("general-chat", 0, false)).toBe("general-chat");
});
