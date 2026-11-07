import { AllidroidIcon } from "@allidroid/settings";
import { disablePlugin, enablePlugin, getPluginSettingsComponent, isPluginEnabled, pluginSettings } from "@plugins";
import { AllidroidPluginManifest } from "@plugins/types";
import { useObservable } from "@api/storage";

import { UnifiedPluginModel } from ".";
import { findAssetId } from "@api/assets";
import { showToast } from "@ui/toasts";

export default function unifyAllidroidPlugin(manifest: AllidroidPluginManifest): UnifiedPluginModel {
    return {
        id: manifest.id,
        name: manifest.display.name,
        description: manifest.display.description,
        authors: manifest.display.authors,
        tags: manifest.tags,
        searchText: [...(manifest.tags ?? []), ...(manifest.searchTerms ?? [])].join(" "),
        required: manifest.required,
        hidden: manifest.hidden,
        requiresRestart: manifest.requiresRestart,

        getBadges() {
            return [
                { source: { uri: AllidroidIcon } },
                // { source: findAssetId("CheckmarkLargeBoldIcon")! }
            ];
        },
        isEnabled: () => isPluginEnabled(manifest.id),
        isInstalled: () => manifest.id in pluginSettings,
        usePluginState() {
            useObservable([pluginSettings]);
        },
        async toggle(start: boolean) {
            try {
            start
                    ? await enablePlugin(manifest.id, true)
                    : disablePlugin(manifest.id);
            if (manifest.requiresRestart) showToast("Restart Discord to finish this change", findAssetId("WarningIcon"));
            } catch (e: any) {
                console.error(`Failed to toggle (${start?"enable":"disable"}) plugin`, e);
                showToast(`Failed to toggle (${start?"enable":"disable"}) plugin: ${e?.message ?? e}`, findAssetId("XSmallIcon"));
            }
        },
        resolveSheetComponent() {
            return import("../sheets/PluginInfoActionSheet");
        },
        getPluginSettingsComponent() {
            return getPluginSettingsComponent(manifest.id);
        },
    };
}
