import { PluginInstanceInternal } from "@plugins/types";

interface CorePlugin {
    default: PluginInstanceInternal;
    preenabled: boolean;
}

/** Every built-in plugin. Add a new one here and it is listed on the Plugins screen. */
const builtIn = () => [
    require("./allibadges"),
    require("./quickinstall"),
    require("../cleanchannelname"),
    require("../silenttyping"),
    require("../unlimitedzoom"),
    require("../imagelink"),
    require("../filesizeonpicker"),
    require("../viewraw"),
    require("../bettersilentleave"),
    require("../favoriteanything"),
] as CorePlugin[];

// Called from @plugins
export const getCorePlugins = (): Record<string, CorePlugin> => Object.fromEntries(
    builtIn()
        .filter(plugin => !(plugin.default as any).unsupported)
        .map(plugin => [plugin.default.manifest.id, plugin])
);

/**
 * @internal
 */
export function defineCorePlugin(instance: PluginInstanceInternal): PluginInstanceInternal {
    // @ts-expect-error
    instance[Symbol.for("allidroid.core.plugin")] = true;
    return instance;
}
