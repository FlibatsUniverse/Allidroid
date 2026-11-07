import { Contributors } from "@allidroid/Developers";
import { after } from "@api/patcher";
import { logger } from "@lib/utils/logger";
import { findByStoreName } from "@metro";
import { FluxDispatcher } from "@metro/common";
import { definePlugin } from "@plugins";
import { defineSettings } from "@plugins/settings";

import { computeClean } from "./clean";

const ORIGINAL_NAME = Symbol("cleanChannelName.original");

const { store, SettingsComponent } = defineSettings("allidroid.cleanchannelname", {
    ignoredChannels: {
        type: "string",
        description: "Comma separated list of channel IDs to leave untouched.",
        default: ""
    },
    spaces: {
        type: "boolean",
        description: "Show spaces instead of dashes in text channel names.",
        default: false
    }
});

const ChannelStore = findByStoreName("ChannelStore");

let editingChannelId: string | null = null;
let ignoredRaw = "";
let ignored: string[] = [];

function getIgnored() {
    const raw = String(store.ignoredChannels ?? "");
    if (raw !== ignoredRaw) {
        ignoredRaw = raw;
        ignored = raw.split(",").map(id => id.trim()).filter(Boolean);
    }
    return ignored;
}

function cleanChannelName(channel: any) {
    if (channel == null || channel[ORIGINAL_NAME] !== undefined) return channel;

    channel[ORIGINAL_NAME] = channel.name;
    Object.defineProperty(channel, "name", {
        configurable: true,
        enumerable: true,
        get() {
            if (editingChannelId === channel.id || getIgnored().includes(channel.id)) return channel[ORIGINAL_NAME];
            return computeClean(channel[ORIGINAL_NAME], channel.type, Boolean(store.spaces));
        },
        set(value: string) {
            channel[ORIGINAL_NAME] = value;
        }
    });

    return channel;
}

const cleanups: (() => void)[] = [];

export default definePlugin({
    name: "CleanChannelName",
    description: "Remove emoji and decoration from channel names. Reverts to the original while you're editing the channel.",
    id: "cleanchannelname",
    version: "1.0.0",
    author: [Contributors.AutumnVN, Contributors.Awesomegamergame],
    tags: ["Appearance", "Chat", "Servers"],
    searchTerms: ["dashless", "dashes", "emoji"],
    eagerStart() {
        cleanups.push(after("getChannel", ChannelStore, (_, channel) => cleanChannelName(channel)));

        const onEdit = ({ channelId }: { channelId: string; }) => void (editingChannelId = channelId);
        const onClose = () => void (editingChannelId = null);
        FluxDispatcher.subscribe("CHANNEL_SETTINGS_INIT", onEdit);
        FluxDispatcher.subscribe("CHANNEL_SETTINGS_CLOSE", onClose);
        cleanups.push(
            () => FluxDispatcher.unsubscribe("CHANNEL_SETTINGS_INIT", onEdit),
            () => FluxDispatcher.unsubscribe("CHANNEL_SETTINGS_CLOSE", onClose)
        );
    },
    stop() {
        for (const cleanup of cleanups) {
            try {
                cleanup();
            } catch (e) {
                logger.error("[CleanChannelName] stop error:", e);
            }
        }
        cleanups.length = 0;
    },
    settings: SettingsComponent
});
