import AllidroidIcon from "@assets/icons/allidroid.png";
import { Strings } from "@allidroid/i18n";
import { useProxy } from "@compat/storage";
import { findAssetId } from "@api/assets";
import { isFontSupported, isThemeSupported } from "@api/native/loader";
import { settings } from "@api/settings";
import { registerSection } from "@ui/settings";
import { version } from "allidroid-build-info";

export { AllidroidIcon };

export default function initSettings() {

    registerSection({
        name: Strings.ALLIDROID,
        items: [
            {
                key: "ALLIDROID",
                title: () => Strings.ALLIDROID,
                icon: { uri: AllidroidIcon },
                render: () => import("@allidroid/pages/General"),
                useTrailing: () => `(${version})`
            },
            {
                key: "ALLIDROID_PLUGINS",
                title: () => Strings.PLUGINS,
                icon: findAssetId("PuzzlePieceIcon"),
                render: () => import("@allidroid/pages/Plugins")
            },
            {
                key: "ALLIDROID_THEMES",
                title: () => Strings.THEMES,
                icon: findAssetId("PaintPaletteIcon"),
                render: () => import("@allidroid/pages/Themes"),
                usePredicate: () => isThemeSupported()
            },
            {
                key: "ALLIDROID_FONTS",
                title: () => Strings.FONTS,
                icon: findAssetId("LettersIcon"),
                render: () => import("@allidroid/pages/Fonts"),
                usePredicate: () => isFontSupported()
            },
            {
                key: "ALLIDROID_UPDATER",
                title: () => "Updater",
                icon: findAssetId("DownloadIcon"),
                render: () => import("@allidroid/pages/Updater")
            },
            {
                key: "ALLIDROID_BACKUP",
                title: () => "Backup & Restore",
                icon: findAssetId("ClockIcon"),
                render: () => import("@allidroid/pages/Backup")
            },
            {
                key: "ALLIDROID_CHANGELOG",
                title: () => "Changelog",
                icon: findAssetId("BookCheckIcon"),
                render: () => import("@allidroid/pages/Changelog")
            },
            {
                key: "ALLIDROID_DEVELOPER",
                title: () => Strings.DEVELOPER,
                icon: findAssetId("WrenchIcon"),
                render: () => import("@allidroid/pages/Developer"),
                usePredicate: () => useProxy(settings).developerSettings ?? false
            }
        ]
    });

    // Retain compatibility with plugins which inject into this section
    registerSection({
        name: "Allidroid",
        items: []
    });

    // Compat for plugins which injects into the settings
    // Flaw: in the old UI, this will be displayed anyway with no items
    registerSection({
        name: "Allidroid",
        items: []
    });
}
