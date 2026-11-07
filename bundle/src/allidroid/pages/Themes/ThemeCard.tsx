import { formatString, Strings } from "@allidroid/i18n";
import AddonCard, { CardWrapper } from "@allidroid/ui/components/AddonCard";
import { showConfirmationAlert } from "@compat/alerts";
import { useProxy } from "@compat/storage";
import { fetchTheme, removeTheme, selectTheme, themes, CompatThemeInfo } from "@api/addons/themes";
import { findAssetId } from "@api/assets";
import { settings } from "@api/settings";
import { clipboard } from "@metro/common";
import { showToast } from "@ui/toasts";

function selectAndApply(value: boolean, theme: CompatThemeInfo) {
    try {
        selectTheme(value ? theme : null);
    } catch (e: any) {
        console.error("Error while selectAndApply,", e);
    }
}

export default function ThemeCard({ item: theme }: CardWrapper<CompatThemeInfo>) {
    useProxy(theme);

    const [removed, setRemoved] = React.useState(false);

    // This is needed because of React™
    if (removed) return null;

    const { authors } = theme.data;

    return (
        <AddonCard
            headerLabel={theme.data.name}
            headerSublabel={authors ? `by ${authors.map(i => i.name).join(", ")}` : ""}
            descriptionLabel={theme.data.description ?? "No description."}
            toggleType={!settings.safeMode?.enabled ? "radio" : undefined}
            toggleValue={() => themes[theme.id].selected}
            onToggleChange={(v: boolean) => {
                selectAndApply(v, theme);
            }}
            overflowTitle={theme.data.name}
            overflowActions={[
                {
                    icon: "RefreshIcon",
                    label: Strings.REFETCH,
                    onPress: () => {
                        fetchTheme(theme.id, theme.selected).then(() => {
                            showToast(Strings.THEME_REFETCH_SUCCESSFUL, findAssetId("DownloadIcon"));
                        }).catch(() => {
                            showToast(Strings.THEME_REFETCH_FAILED, findAssetId("XSmallIcon"));
                        });
                    },
                },
                {
                    icon: "LinkIcon",
                    label: Strings.COPY_URL,
                    onPress: () => {
                        clipboard.setString(theme.id);
                        showToast.showCopyToClipboard();
                    }
                },
                {
                    icon: "TrashIcon",
                    label: Strings.DELETE,
                    isDestructive: true,
                    onPress: () => showConfirmationAlert({
                        title: Strings.HOLD_UP,
                        content: formatString("ARE_YOU_SURE_TO_DELETE_THEME", { name: theme.data.name }),
                        confirmText: Strings.DELETE,
                        cancelText: Strings.CANCEL,
                        confirmColor: "red",
                        onConfirm: () => {
                            removeTheme(theme.id).then(wasSelected => {
                                setRemoved(true);
                                if (wasSelected) selectAndApply(false, theme);
                            }).catch((e: Error) => {
                                showToast(e.message, findAssetId("XSmallIcon"));
                            });
                        }
                    })
                },
            ]}
        />
    );
}
