import { awaitStorage, createFileBackend, createMMKVBackend, createStorage, wrapSync } from "@compat/storage";
import { writeFile } from "@api/native/fs";
import { getStoredTheme, getThemeFilePath, isAllidroidLoader, isThemeSupported } from "@api/native/loader";
import { awaitStorage as newAwaitStorage } from "@api/storage";
import { safeFetch } from "@lib/utils";
import { Platform } from "react-native";

import initColors from "./colors";
import { applyAndroidAlphaKeys, normalizeToHex } from "./colors/parser";
import { colorsPref } from "./colors/preferences";
import { AllidroidThemeManifest } from "./colors/types";
import { updateAllidroidColor } from "./colors/updater";

export interface CompatThemeInfo {
    id: string;
    selected: boolean;
    data: AllidroidThemeManifest;
}

export const themes = wrapSync(createStorage<Record<string, CompatThemeInfo>>(createMMKVBackend("ALLIDROID_THEMES")));

/**
 * @internal
 */
export async function writeThemeToNative(theme: CompatThemeInfo | {}) {
    if (typeof theme !== "object") throw new Error("Theme must be an object");

    // Save the current theme as current-theme.json. When supported by loader,
    // this json will be written to appropriate path and be used to theme the native side.
    await createFileBackend(getThemeFilePath() || "theme.json").set(theme);
}

// Process data for some compatiblity with native side
function processData(data: AllidroidThemeManifest) {
    if (data.semanticColors) {
        const { semanticColors } = data;

        for (const key in semanticColors) {
            for (const index in semanticColors[key]) {
                semanticColors[key][index] &&= normalizeToHex(semanticColors[key][index] as string) || false;
            }
        }
    }

    if (data.rawColors) {
        const { rawColors } = data;

        for (const key in rawColors) {
            const normalized = normalizeToHex(rawColors[key]);
            if (normalized) data.rawColors[key] = normalized;
        }

        if (Platform.OS === "android") applyAndroidAlphaKeys(rawColors);
    }

    // this field is required by the spec but vd seems to ignore this
    // so are most vd themes
    data.spec ??= 2;

    return data;
}

function validateTheme(themeJSON: any): boolean {
    if (typeof themeJSON !== "object" || themeJSON === null) return false;
    if (themeJSON.spec !== 2 && themeJSON.spec !== 3) return false;
    if (themeJSON.spec === 3 && !themeJSON.main) return false;

    return true;
}

export async function fetchTheme(url: string, selected = false) {
    let themeJSON: any;

    try {
        themeJSON = await (await safeFetch(url, { cache: "no-store" })).json();
    } catch {
        throw new Error(`Failed to fetch theme at ${url}`);
    }

    // Validate theme
    if (!validateTheme(themeJSON)) throw new Error(`Invalid theme at ${url}`);

    themes[url] = {
        id: url,
        selected: selected,
        data: processData(themeJSON),
    };

    if (selected) {
        writeThemeToNative(themes[url]);
        updateAllidroidColor(themes[url].data, { update: true });
    }
}

export async function installTheme(url: string) {
    if (typeof url !== "string" || url in themes) throw new Error("Theme already installed");
    await fetchTheme(url);
}

export function selectTheme(theme: CompatThemeInfo | null, write = true) {
    if (theme) theme.selected = true;
    Object.keys(themes).forEach(
        k => themes[k].selected = themes[k].id === theme?.id
    );

    if (theme == null && write) {
        updateAllidroidColor(null, { update: true });
        return writeThemeToNative({});
    } else if (theme) {
        updateAllidroidColor(theme.data, { update: true });
        return writeThemeToNative(theme);
    }
}

export async function removeTheme(id: string) {
    const theme = themes[id];
    if (theme.selected) await selectTheme(null);
    delete themes[id];

    return theme.selected;
}

export async function updateThemes() {
    await awaitStorage(themes);
    const currentTheme = getThemeFromLoader();
    await Promise.allSettled(Object.keys(themes).map(id => fetchTheme(id, currentTheme?.id === id)));
}

export function getCurrentTheme() {
    return Object.values(themes).find(t => t.selected) ?? null;
}

/**
 * @internal
 */
export function getThemeFromLoader(): CompatThemeInfo | null {
    return getStoredTheme();
}

/**
 * @internal
 */
export async function initThemes() {
    if (!isThemeSupported()) return;

    try {
        if (isAllidroidLoader()) {
            writeFile("../allidroid_theme.json", "null");
        }

        await newAwaitStorage(colorsPref);

        const currentTheme = getThemeFromLoader();
        initColors(currentTheme?.data ?? null);

        updateThemes().catch(e => console.error("Failed to update themes", e));
    } catch (e) {
        console.error("Failed to initialize themes", e);
    }
}
