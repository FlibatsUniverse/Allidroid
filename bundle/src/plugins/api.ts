import { patcher } from "@api";
import { registerCommand } from "@api/commands";
import { createStorage } from "@api/storage";
import { logger } from "@lib/utils/logger";

import { registeredPlugins } from ".";
import { defineSettings } from "./settings";
import { AllidroidPluginObject } from "./types";

type DisposableFn = (...props: any[]) => () => unknown;
function shimDisposableFn<F extends DisposableFn>(unpatches: (() => void)[], f: F): F {
    const dummy = ((...props: Parameters<F>) => {
        const up = f(...props);
        unpatches.push(up);
        return up;
    }) as F;

    for (const key in f) if (typeof f[key] === "function") {
        // @ts-ignore
        dummy[key] = shimDisposableFn(unpatches, f[key] as DisposableFn);
    }

    return dummy;
}

export function createAllidroidPluginApi(id: string) {
    const disposers = new Array<DisposableFn>;

    // proxying this would be a good idea
    const object = {
        ...window.allidroid,
        api: {
            ...window.allidroid.api,
            patcher: {
                before: shimDisposableFn(disposers, patcher.before),
                after: shimDisposableFn(disposers, patcher.after),
                instead: shimDisposableFn(disposers, patcher.instead)
            },
            commands: {
                ...window.allidroid.api.commands,
                registerCommand: shimDisposableFn(disposers, registerCommand)
            },
            flux: {
                ...window.allidroid.api.flux,
                intercept: shimDisposableFn(disposers, window.allidroid.api.flux.intercept)
            }
        },
        // Added something in here? Make sure to also update AllidroidPluginProperty in ./types
        plugin: {
            createStorage: <T extends object = any>() => createStorage<T>(`plugins/storage/${id}.json`),
            defineSettings: (definitions: Parameters<typeof defineSettings>[1]) => defineSettings(id, definitions),
            manifest: registeredPlugins.get(id),
            logger
        }
    } as unknown as AllidroidPluginObject;

    return {
        object,
        disposers,
    };
}
