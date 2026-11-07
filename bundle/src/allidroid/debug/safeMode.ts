import { getCurrentTheme, writeThemeToNative } from "@api/addons/themes";
import { BundleUpdaterManager } from "@api/native/modules";
import { settings } from "@api/settings";

export function isSafeMode() {
    return settings.safeMode?.enabled === true;
}

export async function toggleSafeMode({
    to = !isSafeMode(),
    reload = true
} = {}) {
    const enabled = (settings.safeMode ??= { enabled: to }).enabled = to;
    const currentColor = getCurrentTheme();
    await writeThemeToNative(enabled ? {} : currentColor?.data ?? {});
    if (reload) setTimeout(() => BundleUpdaterManager.reload(), 500);
}
