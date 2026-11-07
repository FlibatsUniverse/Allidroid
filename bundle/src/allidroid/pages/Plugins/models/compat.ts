import { CompatPluginManager, AllidroidPlugin } from "@compat/plugins";
import { useProxy } from "@compat/storage";
import { LEGACY_MANIFEST_KEY } from "@compat/legacy";
import { UnifiedPluginModel } from ".";
import { showToast } from "@ui/toasts";
import { findAssetId } from "@api/assets";

export default function unifyCompatPlugin(compatPlugin: AllidroidPlugin): UnifiedPluginModel {
    return {
        id: compatPlugin.id,
        name: compatPlugin.manifest.name,
        description: compatPlugin.manifest.description,
        authors: compatPlugin.manifest.authors,
        icon: (compatPlugin.manifest as any)[LEGACY_MANIFEST_KEY]?.icon,

        getBadges() {
            return [];
        },
        isEnabled: () => compatPlugin.enabled,
        isInstalled: () => Boolean(compatPlugin && CompatPluginManager.plugins[compatPlugin.id]),
        usePluginState() {
            useProxy(CompatPluginManager.plugins[compatPlugin.id]);
        },
        async toggle(start: boolean) {
            console.log(`[Toggle] Target state: ${start ? 'Enabled' : 'Disabled'} for ${compatPlugin.id}`);
            try {
                if (start) {
                    await CompatPluginManager.startPlugin(compatPlugin.id);
                } else {
                    CompatPluginManager.stopPlugin(compatPlugin.id);
                }
                console.log(`[Toggle] Success for ${compatPlugin.id}`);
            } catch (e: any) {
                console.error(`[Toggle] Failed for ${compatPlugin.id}`, e);
                showToast(`Failed to toggle: ${e?.message ?? e}`, findAssetId("XSmallIcon"));
                throw e; // rethrow so the card knows it failed
            }
        },
        resolveSheetComponent() {
            return import("../sheets/CompatPluginInfoActionSheet");
        },
        getPluginSettingsComponent() {
            return CompatPluginManager.getSettings(compatPlugin.id);
        },
    };
}
