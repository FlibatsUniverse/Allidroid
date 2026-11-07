import patchErrorBoundary from "@allidroid/debug/patches/patchErrorBoundary";
import initFixes from "@allidroid/fixes";
import { initFetchI18nStrings } from "@allidroid/i18n";
import initSettings from "@allidroid/settings";
import { initAllidroidObject } from "@compat/api";
import { CompatPluginManager } from "@compat/plugins";
import { updateFonts } from "@api/addons/fonts";
import { initPlugins, updatePlugins } from "@plugins";
import { initThemes } from "@api/addons/themes";
import { patchCommands } from "@api/commands";
import { initDebugger } from "@api/debug";
import { injectFluxInterceptor } from "@api/flux";
import { patchJsx } from "@api/react/jsx";
import { patchToasts } from "@ui/toasts";
import { logger } from "@lib/utils/logger";
import { patchSettings } from "@ui/settings";

import * as lib from "./lib";

export default async () => {
    // Load everything in parallel
    await Promise.all([
        initThemes(),
        injectFluxInterceptor(),
        patchSettings(),
        patchCommands(),
        patchJsx(),
        initAllidroidObject(),
        initFetchI18nStrings(),
        initSettings(),
        initFixes(),
        patchErrorBoundary(),
        patchToasts(),
        updatePlugins()
    ]).then(
        // Push them all to unloader
        u => u.forEach(f => f && lib.unload.push(f))
    );

    // Assign window object
    window.allidroid = lib;

    // Start debugger
    initDebugger();

    // Once done, load Allidroid plugins
    CompatPluginManager.initPlugins()
        .then(u => lib.unload.push(u))
        .catch(() => alert("Failed to initialize Allidroid plugins"));

    // And then, load Allidroid plugins
    initPlugins();

    // Update the fonts
    updateFonts();

    // We good :)
    logger.log("Allidroid is ready!");
};
