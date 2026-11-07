import { AllidroidManifest } from "@api/addons/types";
import { createStorage } from "@api/storage";
import { Logger } from "@lib/utils/logger";

import type { defineSettings, SettingsDefinitions } from "./settings";

export type PluginRepo = Record<string, {
    version: string;
    // For plugin developing convenience, plugins with this on will always get fetched
    alwaysFetch?: boolean;
}> & {
    $meta: {
        name: string;
        description: string;
    };
};

export interface PluginRepoStorage {
    [repoUrl: string]: PluginRepo;
}

export interface PluginSettingsStorage {
    [pluginId: string]: {
        enabled: boolean;
    };
}

export interface AllidroidPluginManifest extends AllidroidManifest {
    readonly type: "plugin";
    readonly spec: 3;
    readonly main: string;
    /** Groups shown on the plugin, like "Appearance". */
    readonly tags?: string[];
    /** Extra words that bring the plugin up in search. */
    readonly searchTerms?: string[];
    /** Plugins, by id or name, that are turned on first and kept on while this one is. */
    readonly dependencies?: string[];
    /** Plugins, by id or name, that do the same job. They cannot be on together with this one. */
    readonly conflicts?: string[];
    /** Always on and cannot be turned off. */
    readonly required?: boolean;
    /** Kept out of the plugin list. */
    readonly hidden?: boolean;
    /** Turned on once, the first time it is available. */
    readonly enabledByDefault?: boolean;
    /** Asks for a restart after it is turned on or off. */
    readonly requiresRestart?: boolean;
}

export interface AllidroidPluginManifestInternal extends AllidroidPluginManifest {
    readonly parentRepository: string;
    readonly jsPath?: string;
}

export interface PluginInstance {
    start?(): void;
    stop?(): void;
    SettingsComponent?(): JSX.Element;
}

export interface PluginInstanceInternal extends PluginInstance {
    readonly manifest: AllidroidPluginManifest;
}

export interface AllidroidPluginProperty {
    readonly manifest: AllidroidPluginManifestInternal;
    readonly logger: Logger;
    createStorage<T extends object>(): ReturnType<typeof createStorage<T>>;
    defineSettings(definitions: SettingsDefinitions): ReturnType<typeof defineSettings>;
}

export type AllidroidPluginObject = typeof window.allidroid & {
    plugin: AllidroidPluginProperty;
};
