import { CompatThemeInfo } from "@api/addons/themes";
import { LEGACY_LOADER_NAME } from "@compat/legacy";

import { removeCacheFile } from "./fs";

// @ts-ignore
const nativeLoaderIdentity = globalThis.__ALLIDROID_LOADER__;
// @ts-ignore
const compatLoaderIdentity = globalThis.__allidroid_loader;

export interface CompatLoaderIdentity {
    name: string;
    features: {
        loaderConfig?: boolean;
        devtools?: {
            prop: string;
            version: string;
        },
        themes?: {
            prop: string;
        };
    };
}

export function isCompatLoader() {
    return compatLoaderIdentity != null;
}

export function isAllidroidLoader() {
    return nativeLoaderIdentity != null;
}

function polyfillCompatLoaderIdentity() {
    if (!isAllidroidLoader() || isCompatLoader()) return null;

    const loader = {
        name: nativeLoaderIdentity.loaderName,
        features: {} as Record<string, any>
    };

    if (isLoaderConfigSupported()) loader.features.loaderConfig = true;
    if (isSysColorsSupported()) {
        loader.features.syscolors = {
            prop: "__compat_syscolors"
        };

        Object.defineProperty(globalThis, "__compat_syscolors", {
            get: () => getSysColors(),
            configurable: true
        });
    }
    if (isThemeSupported()) {
        loader.features.themes = {
            prop: "__compat_theme"
        };

        Object.defineProperty(globalThis, "__compat_theme", {
            // get: () => getStoredTheme(),
            get: () => {
                // The Allidroid loader only returns keys it parses, making custom keys like Themes+' to gone
                const id = getStoredTheme()?.id;
                if (!id) return null;

                const { themes } = require("@api/addons/themes");
                return themes[id] ?? getStoredTheme() ?? null;
            },
            configurable: true
        });
    }

    for (const name of ["__allidroid_loader", LEGACY_LOADER_NAME]) {
        Object.defineProperty(globalThis, name, {
            get: () => loader,
            configurable: true
        });
    }

    return loader as CompatLoaderIdentity;
}

export function getLoaderIdentity() {
    if (isAllidroidLoader()) {
        return nativeLoaderIdentity;
    } else if (isCompatLoader()) {
        return getCompatLoaderIdentity();
    }

    return null;
}

export function getCompatLoaderIdentity(): CompatLoaderIdentity | null {
    // @ts-ignore
    if (globalThis.__allidroid_loader) return globalThis.__allidroid_loader;
    return polyfillCompatLoaderIdentity();
}

// add to __allidroid_loader anyway
getCompatLoaderIdentity();

export function getLoaderName() {
    if (isAllidroidLoader()) return nativeLoaderIdentity.loaderName;
    else if (isCompatLoader()) return compatLoaderIdentity.name;

    return "Unknown";
}

export function getLoaderVersion(): string | null {
    if (isAllidroidLoader()) return nativeLoaderIdentity.loaderVersion;
    return null;
}

export function isLoaderConfigSupported() {
    if (isAllidroidLoader()) {
        return true;
    } else if (isCompatLoader()) {
        return compatLoaderIdentity!!.features.loaderConfig;
    }

    return false;
}

export function isThemeSupported() {
    if (isAllidroidLoader()) {
        return nativeLoaderIdentity.hasThemeSupport;
    } else if (isCompatLoader()) {
        return compatLoaderIdentity!!.features.themes != null;
    }

    return false;
}

export function getStoredTheme(): CompatThemeInfo | null {
    if (isAllidroidLoader()) {
        return nativeLoaderIdentity.storedTheme;
    } else if (isCompatLoader()) {
        const themeProp = compatLoaderIdentity!!.features.themes?.prop;
        if (!themeProp) return null;
        // @ts-ignore
        return globalThis[themeProp] || null;
    }

    return null;
}

export function getThemeFilePath() {
    if (isAllidroidLoader()) {
        return "allidroid/current-theme.json";
    } else if (isCompatLoader()) {
        return "compat_theme.json";
    }

    return null;
}

export function isReactDevToolsPreloaded() {
    if (isAllidroidLoader()) {
        return Boolean(window.__REACT_DEVTOOLS__);
    }
    if (isCompatLoader()) {
        return compatLoaderIdentity!!.features.devtools != null;
    }

    return false;
}

export function getReactDevToolsProp(): string | null {
    if (!isReactDevToolsPreloaded()) return null;

    if (isAllidroidLoader()) {
        window.__allidroid_rdt = window.__REACT_DEVTOOLS__.exports;
        return "__allidroid_rdt";
    }

    if (isCompatLoader()) {
        return compatLoaderIdentity!!.features.devtools!!.prop;
    }

    return null;
}

export function getReactDevToolsVersion() {
    if (!isReactDevToolsPreloaded()) return null;

    if (isAllidroidLoader()) {
        return window.__REACT_DEVTOOLS__.version || null;
    }
    if (isCompatLoader()) {
        return compatLoaderIdentity!!.features.devtools!!.version;
    }

    return null;
}

export function isSysColorsSupported() {
    if (isAllidroidLoader()) return nativeLoaderIdentity.isSysColorsSupported;
    else if (isCompatLoader()) {
        return compatLoaderIdentity!!.features.syscolors != null;
    }

    return false;
}

export function getSysColors() {
    if (!isSysColorsSupported()) return null;
    if (isAllidroidLoader()) {
        return nativeLoaderIdentity.sysColors;
    } else if (isCompatLoader()) {
        return compatLoaderIdentity!!.features.syscolors!!.prop;
    }

    return null;
}

export function getLoaderConfigPath() {
    if (isAllidroidLoader()) {
        return "allidroid/loader.json";
    } else if (isCompatLoader()) {
        return "compat_loader.json";
    }

    return "loader.json";
}

export function isFontSupported() {
    if (isAllidroidLoader()) return nativeLoaderIdentity.fontPatch === 2;

    return false;
}

export async function clearBundle() {
    // TODO: This should be not be hardcoded, maybe put in loader.json?
    return void await removeCacheFile("bundle.js");
}