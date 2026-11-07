import { openContributor } from "@allidroid/ui/components/Contributors";
import { defineSettings } from "@plugins/settings";
import { after } from "@api/patcher";
import { onJsxCreate } from "@api/react/jsx";
import { openAlert } from "@ui/alerts";
import { AllidroidDevs } from "@lib/utils/constants";
import { findByName } from "@metro";
import { AlertActionButton, AlertActions, AlertModal, TableRow } from "@metro/common/components";
import { UserStore } from "@metro/common/stores";
import React from "react";
import { Linking } from "react-native";

import { definePlugin } from "@plugins";

interface UserBadge {
    tooltip: string;
    mod: string;
    badge: string;
    kind?: string;
}

interface ServiceInfo {
    id: string;
    name: string;
    default?: boolean;
}

const DEFAULT_API_URL = "https://api.flibat.com/v1/alliance/badges";
const REFRESH_EVERY = 1000 * 60 * 10;

// Alliance badges come first, then flibatsuniverse, then badges from other services in the order the API lists them
const kindOrder = ["developer", "contributor", "allidroid", "donor", "bot", "flibatsuniverse"];

const useBadgesModule = findByName("useBadges", false);

const { store, raw, Rows } = defineSettings("allidroid.allibadges", {
    provider: {
        type: "select",
        description: "Badge API Provider",
        default: "allicord",
        options: [
            { label: "Aerolith API", value: "allicord" },
            { label: "Custom", value: "custom" }
        ],
        onChange: () => void loadBadges()
    },
    customUrl: {
        type: "string",
        description: "Custom badge API URL",
        default: "",
        hidden: s => s.provider !== "custom",
        onChange: () => void loadBadges()
    },
    modStyle: {
        type: "select",
        description: "Show which client mod a badge comes from",
        default: "none",
        options: [
            { label: "Don't show the mod", value: "none" },
            { label: "Show the mod as a prefix", value: "prefix" },
            { label: "Show the mod as a suffix", value: "suffix" }
        ]
    }
});

let users: Record<string, UserBadge[]> = {};
let services: ServiceInfo[] = [];
let timer: ReturnType<typeof setInterval> | undefined;

const apiUrl = () => (store.provider === "custom" && store.customUrl ? store.customUrl : DEFAULT_API_URL).replace(/\/$/, "");

async function loadBadges() {
    const base = apiUrl();
    const [list, info] = await Promise.all([
        fetch(`${base}/users`, { cache: "no-cache" }).then(r => r.json()),
        fetch(`${base}/`, { cache: "no-cache" }).then(r => r.json()).catch(() => null)
    ]);

    users = list.data?.users ?? list.users ?? {};

    const root = info?.data ?? info;
    services = root?.serviceInfo ?? (root?.services ?? []).map((id: string) => ({
        id,
        name: id.charAt(0).toUpperCase() + id.slice(1),
        default: id === "allicord"
    }));
}

const isShown = (mod: string) => {
    if (mod === "allicord") return true;
    const service = services.find(s => s.id === mod);
    return Boolean(raw[`show_${mod}`] ?? service?.default);
};

const serviceName = (mod: string) => services.find(s => s.id === mod)?.name ?? mod;

function rank({ mod, kind }: UserBadge) {
    if (mod === "allicord") {
        const index = kindOrder.indexOf(kind ?? "");
        return index === -1 ? kindOrder.length - 1 : index;
    }
    return kindOrder.length + services.findIndex(s => s.id === mod);
}

function tooltipOf({ mod, tooltip }: UserBadge) {
    if (mod === "allicord" || store.modStyle === "none") return tooltip;
    return store.modStyle === "prefix" ? `${serviceName(mod)} - ${tooltip}` : `${tooltip} - ${serviceName(mod)}`;
}

const badgeText: Record<string, { title: string; text: string; button?: [string, string]; }> = {
    allidroid: {
        title: "Allidroid Contributor",
        text: "This badge is granted to people who have contributed to Allidroid, the mobile version of Allicord.",
        button: ["View Allidroid", "https://github.com/FlibatsUniverse/Allidroid"]
    },
    flibatsuniverse: {
        title: "Flibat's Universe",
        text: "This badge is granted automatically to server staff in Flibat's Universe, the community behind Alliance Development. Its color matches the member's rank in the community.",
        button: ["Join the community", "https://discord.com/invite/XszKXdqaZP"]
    },
    bot: {
        title: "Official Alliance Bot",
        text: "This is an official bot made and run by Alliance Development.",
        button: ["Add Alliance", "https://alliance.flibat.com/invite"]
    },
    donor: {
        title: "Allicord Donor",
        text: "This badge is a special perk for Allicord donors. Please consider supporting the development of Allicord by becoming a donor. It would mean a lot!"
    }
};

// What tapping an Alliance badge opens
function openBadge(kind: string | undefined, userId: string) {
    if (kind === "contributor" || kind === "developer") {
        const user = UserStore.getUser(userId);
        openContributor({ name: user?.username ?? "Contributor", id: userId as `${bigint}` });
        return;
    }

    const info = kind ? badgeText[kind] : undefined;
    if (!info) return;

    openAlert("allidroid-allibadges-info", <AlertModal
        title={info.title}
        content={info.text}
        actions={<AlertActions>
            {info.button && <AlertActionButton text={info.button[0]} variant="primary" onPress={() => void Linking.openURL(info.button![1])} />}
            <AlertActionButton text="Close" variant="secondary" />
        </AlertActions>}
    />);
}

function ServiceRow({ service }: { service: ServiceInfo; }) {
    const [on, setOn] = React.useState(isShown(service.id));
    return <TableRow
        label={`Show ${service.name} badges`}
        trailing={<TableRow.TrailingText text={on ? "On" : "Off"} />}
        onPress={() => {
            raw[`show_${service.id}`] = !on;
            setOn(!on);
        }}
    />;
}

// One row per badge service the API knows, so the list follows the API
function ServiceRows() {
    return <>
        {services.filter(s => s.id !== "allicord").map(service => <ServiceRow key={service.id} service={service} />)}
    </>;
}

export default definePlugin({
    name: "AlliBadges",
    description: "Adds contributor, donor and community badges to user profiles.",
    id: "allibadges",
    version: "1.0.0",
    author: [AllidroidDevs.Kuraa],
    tags: ["Appearance"],
    required: true,
    enabledByDefault: true,
    settings: () => <Rows extra={<ServiceRows />} />,
    start() {
        const holder = {} as Record<string, any>;

        onJsxCreate("RenderedBadge", (_, ret) => {
            if (ret.props.id.match(/allibadges-\d+-\d+/)) {
                Object.assign(ret.props, holder[ret.props.id]);
            }
            return ret;
        });

        after("default", useBadgesModule, ([user], r) => {
            if (!user) return;

            (users[user.userId] ?? [])
                .filter(b => isShown(b.mod))
                .sort((a, b) => rank(a) - rank(b))
                .forEach((b, i) => {
                    const id = `allibadges-${user.userId}-${i}`;
                    holder[id] = {
                        source: { uri: b.badge },
                        id: `allibadges-${i}`,
                        label: tooltipOf(b),
                        onPress: b.kind ? () => openBadge(b.kind, user.userId) : undefined
                    };
                    r.push({ id, description: tooltipOf(b), icon: "_" });
                });
        });

        const refresh = () => loadBadges().catch(() => { });
        void refresh();
        timer = setInterval(refresh, REFRESH_EVERY);
    },
    stop() {
        clearInterval(timer);
    }
});
