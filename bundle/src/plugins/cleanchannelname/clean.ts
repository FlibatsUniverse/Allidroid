/** Channel types that use spaces: voice and stage. Text channels keep dashes. */

const SMALL_CAPS: Record<string, string> = {
    "ᴀ": "a", "ʙ": "b", "ᴄ": "c", "ᴅ": "d", "ᴇ": "e", "ꜰ": "f", "ɢ": "g", "ʜ": "h", "ɪ": "i", "ᴊ": "j",
    "ᴋ": "k", "ʟ": "l", "ᴍ": "m", "ɴ": "n", "ᴏ": "o", "ᴘ": "p", "ǫ": "q", "ʀ": "r", "ꜱ": "s", "ᴛ": "t",
    "ᴜ": "u", "ᴠ": "v", "ᴡ": "w", "ʏ": "y", "ᴢ": "z"
};

// Written as plain ranges: the engine on mobile does not understand Unicode property escapes.
const EMOJI = /(?:[←-⇿⌀-⏿①-⓿■-➿⤀-⯿〰〽㊗㊙]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|\uD83E[\uDC00-\uDFFF])[️‍⃣]*/g;
const DECORATION = /[ -⁯─-╿　-〯︀-️＀-￯]/g;

export function computeClean(name: string, type: number, spaces = false): string {
    const separator = type === 2 || type === 4 ? " " : "-";

    let cleaned = name;
    try {
        cleaned = cleaned.normalize("NFKC");
    } catch { /* the engine has no normalize, the name is used as it is */ }

    cleaned = cleaned
        .replace(/[ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘǫʀꜱᴛᴜᴠᴡʏᴢ]/g, m => SMALL_CAPS[m])
        .replace(EMOJI, "")
        .replace(/-?\|-?/g, separator)
        .replace(DECORATION, separator)
        .replace(/-+/g, "-")
        .replace(/(^[- ]+|[- ]+$)/g, "");

    if (spaces && separator === "-") cleaned = cleaned.replace(/-/g, " ");
    return cleaned || name;
}

