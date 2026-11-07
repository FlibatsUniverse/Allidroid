import { CompatPluginManager } from "@compat/plugins";
import { themes, installTheme } from "@api/addons/themes";
import { disablePlugin, enablePlugin, installPlugin, isCorePlugin, isPluginEnabled, isPluginInstalled, registeredPlugins } from "@plugins";
import { settings } from "@api/settings";
import { isThemeSupported } from "@api/native/loader";

import { type ImportPlan, makeAllidroidBlock } from "./detect";

export * from "./detect";

// Settings that describe this device or this session rather than the person.
const LOCAL_ONLY = new Set(["safeMode", "debuggerUrl", "enableAutoDebugger", "developerSettings"]);

const normalize = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, "");

/** The backup as text. Allicord reads the `settings` part and keeps the `allidroid` part for later. */
export function exportBackup() {
    const pluginTable: Record<string, { enabled: boolean; }> = {};
    const officialPlugins: { id: string; enabled: boolean; }[] = [];

    for (const [id, manifest] of registeredPlugins) {
        if (!isPluginInstalled(id) || isCorePlugin(id)) continue;
        const enabled = isPluginEnabled(id);
        pluginTable[manifest.display.name] = { enabled };
        officialPlugins.push({ id, enabled });
    }

    const userPlugins = Object.values(CompatPluginManager.plugins).map(plugin => ({
        id: plugin.id,
        url: plugin.id,
        enabled: plugin.enabled
    }));

    const themeList = Object.values(themes).map(theme => ({ url: theme.id, selected: theme.selected }));

    const ownSettings: Record<string, any> = {};
    for (const [key, value] of Object.entries(JSON.parse(JSON.stringify(settings)))) {
        if (!LOCAL_ONLY.has(key)) ownSettings[key] = value;
    }

    return JSON.stringify({
        settings: {
            plugins: pluginTable
        },
        allidroid: makeAllidroidBlock({
            plugins: [...officialPlugins, ...userPlugins],
            themes: themeList,
            settings: ownSettings
        })
    }, null, 2);
}

export interface ImportResult {
    done: string[];
    skipped: string[];
    failed: { what: string; error: string; }[];
}

/** Finds an official plugin a name from another app refers to. */
function findOfficialPlugin(name: string) {
    const wanted = normalize(name);
    for (const [id, manifest] of registeredPlugins) {
        if (normalize(manifest.display.name) === wanted || normalize(id.split(".").pop() ?? id) === wanted) return id;
    }
    return null;
}

export async function applyImport(plan: ImportPlan): Promise<ImportResult> {
    const result: ImportResult = { done: [], skipped: [], failed: [] };
    const fail = (what: string, error: unknown) => result.failed.push({ what, error: error instanceof Error ? error.message : String(error) });

    for (const { name, enabled } of plan.pluginStates) {
        const id = findOfficialPlugin(name);
        if (!id) {
            result.skipped.push(`${name} has no mobile version`);
            continue;
        }
        try {
            if (!isPluginInstalled(id)) {
                if (!enabled) continue;
                await installPlugin(id, true);
            } else if (enabled) {
                if (!isPluginEnabled(id)) await enablePlugin(id, true);
            } else {
                disablePlugin(id);
            }
            result.done.push(name);
        } catch (error) {
            fail(name, error);
        }
    }

    for (const { url, enabled } of plan.pluginLinks) {
        const id = url.endsWith("/") ? url : `${url}/`;
        try {
            if (id in CompatPluginManager.plugins) {
                if (enabled && !CompatPluginManager.plugins[id].enabled) await CompatPluginManager.startPlugin(id);
                else if (!enabled && CompatPluginManager.plugins[id].enabled) CompatPluginManager.stopPlugin(id);
                result.skipped.push(`${url} was already added`);
            } else {
                await CompatPluginManager.installPlugin(url, enabled);
                result.done.push(url);
            }
        } catch (error) {
            fail(url, error);
        }
    }

    for (const url of plan.themeLinks) {
        if (/\.css(\?|#|$)/i.test(url)) {
            result.skipped.push(`${url} is a desktop theme`);
            continue;
        }
        if (!isThemeSupported()) {
            result.skipped.push(`${url} needs theme support`);
            continue;
        }
        try {
            if (url in themes) {
                result.skipped.push(`${url} was already added`);
                continue;
            }
            await installTheme(url);
            result.done.push(url);
        } catch (error) {
            fail(url, error);
        }
    }

    if (plan.customCss) result.skipped.push("Custom CSS is only used on desktop");

    const own = plan.allidroid?.settings;
    if (own) {
        for (const [key, value] of Object.entries(own)) {
            if (LOCAL_ONLY.has(key) || (value != null && typeof value === "object")) continue;
            (settings as Record<string, any>)[key] = value;
        }
        result.done.push("Allidroid settings");
    }

    return result;
}
