import { AllidroidDevs } from "@lib/utils/constants";
import { Platform } from "react-native";

import { defineCorePlugin } from "./_core";
import type { PluginInstanceInternal } from "./types";

export interface PluginAuthor {
    name: string;
    id: bigint | `${bigint}`;
}

/**
 * How a built-in plugin describes itself. It takes the options an Allicord
 * plugin takes, and the ones the mobile plugins it was ported from used.
 */
export interface PluginDefinition {
    name: string;
    description: string;
    /** Short and unique, the app prefixes it with `allidroid.` */
    id: string;
    version: string;
    author: PluginAuthor[];
    tags?: string[];
    searchTerms?: string[];
    dependencies?: string[];
    conflicts?: string[];
    required?: boolean;
    hidden?: boolean;
    enabledByDefault?: boolean;
    requiresRestart?: boolean;
    /** Only runs on these platforms. */
    platforms?: ("android" | "ios")[];
    /** Only runs when all of these return true. */
    predicates?: (() => boolean)[];
    /** Only runs when developer settings are on. */
    devOnly?: boolean;
    /** Runs as soon as the plugin is loaded, before the interface is ready. */
    eagerStart?(): void;
    start?(): void;
    stop?(): void;
    settings?(): JSX.Element;
}

/** Whether the plugin can run here at all. */
export const supported = (definition: PluginDefinition) =>
    (!definition.platforms || definition.platforms.includes(Platform.OS as "android" | "ios"))
    && (definition.predicates ?? []).every(predicate => predicate());

export function definePlugin(definition: PluginDefinition): PluginInstanceInternal {
    const id = definition.id.startsWith("allidroid.") ? definition.id : `allidroid.${definition.id}`;

    const instance = defineCorePlugin({
        manifest: {
            id,
            spec: 3,
            version: definition.version,
            type: "plugin",
            main: "",
            display: {
                name: definition.name,
                description: definition.description,
                authors: definition.author.map(author => ({ name: author.name, id: String(author.id) as `${bigint}` }))
            },
            tags: definition.tags,
            searchTerms: definition.searchTerms,
            dependencies: definition.dependencies,
            conflicts: definition.conflicts,
            required: definition.required,
            hidden: definition.hidden,
            enabledByDefault: definition.enabledByDefault,
            requiresRestart: definition.requiresRestart
        },
        start() {
            definition.eagerStart?.();
            definition.start?.();
        },
        stop: definition.stop,
        SettingsComponent: definition.settings
    });

    Object.defineProperty(instance, "unsupported", { value: !supported(definition) });
    return instance;
}

export { AllidroidDevs };
