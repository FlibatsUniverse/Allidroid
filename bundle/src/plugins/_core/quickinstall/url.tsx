import { formatString, Strings } from "@allidroid/i18n";
import { showConfirmationAlert } from "@compat/alerts";
import { CompatPluginManager } from "@compat/plugins";
import { installTheme } from "@api/addons/themes";
import { findAssetId } from "@api/assets";
import { isThemeSupported } from "@api/native/loader";
import { after, instead } from "@api/patcher";
import { PROXY_PREFIX } from "@lib/utils/constants";
import { byMutableProp } from "@metro/filters";
import { findExports } from "@metro/finders";
import { findByPropsLazy } from "@metro/wrappers";
import { showToast } from "@ui/toasts";
import { Linking } from "react-native";

const showSimpleActionSheet = findExports(byMutableProp("showSimpleActionSheet"));
const handleClick = findByPropsLazy("handleClick");

function typeFromUrl(url: string) {
    if (url.startsWith(PROXY_PREFIX)) {
        return "plugin";
    } else if (url.endsWith(".json") && isThemeSupported()) {
        return "theme";
    }
}

function installWithToast(type: "plugin" | "theme", url: string) {
    (type === "plugin" ? CompatPluginManager.installPlugin.bind(CompatPluginManager) : installTheme)(url)
        .then(() => {
            showToast(Strings.SUCCESSFULLY_INSTALLED, findAssetId("DownloadIcon"));
        })
        .catch((e: Error) => {
            showToast(e.message, findAssetId("XSmallIcon"));
        });
}

export default () => {
    const patches = new Array<Function>();

    patches.push(
        after("showSimpleActionSheet", showSimpleActionSheet, args => {
            if (args[0].key !== "LongPressUrl") return;
            const {
                header: { title: url },
                options,
            } = args[0];

            const urlType = typeFromUrl(url);
            if (!urlType) return;

            options.push({
                label: Strings.INSTALL_ADDON,
                onPress: () => installWithToast(urlType, url),
            });
        })
    );

    patches.push(
        instead("handleClick", handleClick, async function (this: any, args, orig) {
            const { href: url } = args[0];

            const urlType = typeFromUrl(url);
            if (!urlType) return orig.apply(this, args);

            // Theme links are never installed from a click.
            if (urlType === "theme") return orig.apply(this, args);

            showConfirmationAlert({
                title: Strings.HOLD_UP,
                content: formatString("CONFIRMATION_LINK_IS_A_TYPE", { urlType }),
                onConfirm: () => installWithToast(urlType, url),
                confirmText: Strings.INSTALL,
                cancelText: Strings.CANCEL,
                secondaryConfirmText: Strings.OPEN_IN_BROWSER,
                onConfirmSecondary: () => Linking.openURL(url),
            });
        })
    );

    return () => patches.forEach(p => p());
};
