import { formatString, Strings } from "@allidroid/i18n";
import { showConfirmationAlert } from "@compat/alerts";
import { CompatPluginManager } from "@compat/plugins";
import { purgeStorage } from "@compat/storage";
import { findAssetId } from "@api/assets";
import { clipboard } from "@metro/common";
import { ActionSheet, ActionSheetRow, Button, TableRow, Text } from "@metro/common/components";
import { hideSheet } from "@ui/sheets";
import { showToast } from "@ui/toasts";
import { ScrollView, View } from "react-native";

import { PluginInfoActionSheetProps } from "./common";
import TitleComponent from "./TitleComponent";

export default function PluginInfoActionSheet({ plugin, navigation }: PluginInfoActionSheetProps) {
    plugin.usePluginState();

    const compatPlugin = CompatPluginManager.plugins[plugin.id];
    const SettingsComponent = plugin.getPluginSettingsComponent();

    return <ActionSheet>
        <ScrollView>
            <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 24 }}>
                <TitleComponent plugin={plugin} />
                <View style={{ marginLeft: "auto" }}>
                    {SettingsComponent && <Button
                        size="md"
                        text="Configure"
                        variant="secondary"
                        icon={findAssetId("WrenchIcon")}
                        onPress={() => {
                            hideSheet("PluginInfoActionSheet");
                            navigation.push("ALLIDROID_CUSTOM_PAGE", {
                                title: plugin.name,
                                render: SettingsComponent,
                            });
                        }}
                    />}
                </View>
            </View>
            <ActionSheetRow.Group>
                <ActionSheetRow
                    label={Strings.REFETCH}
                    icon={<TableRow.Icon source={findAssetId("RetryIcon")} />}
                    onPress={async () => {
                        if (compatPlugin.enabled) CompatPluginManager.stopPlugin(plugin.id, false);

                        try {
                            await CompatPluginManager.fetchPlugin(plugin.id);
                            showToast(Strings.PLUGIN_REFETCH_SUCCESSFUL, findAssetId("DownloadIcon"));
                        } catch {
                            showToast(Strings.PLUGIN_REFETCH_FAILED, findAssetId("XSmallIcon"));
                        }

                        if (compatPlugin.enabled) await CompatPluginManager.startPlugin(plugin.id);
                        hideSheet("PluginInfoActionSheet");
                    }}
                />
                <ActionSheetRow
                    label={Strings.COPY_URL}
                    icon={<TableRow.Icon source={findAssetId("LinkIcon")} />}
                    onPress={() => {
                        clipboard.setString(plugin.id);
                        showToast.showCopyToClipboard();
                    }}
                />
                <ActionSheetRow
                    label={compatPlugin.update ? Strings.DISABLE_UPDATES : Strings.ENABLE_UPDATES}
                    icon={<TableRow.Icon source={findAssetId("DownloadIcon")} />}
                    onPress={() => {
                        compatPlugin.update = !compatPlugin.update;
                        showToast(formatString("TOASTS_PLUGIN_UPDATE", {
                            update: compatPlugin.update,
                            name: plugin.name
                        }), findAssetId("DownloadIcon"));
                    }}
                />
                <ActionSheetRow
                    label={Strings.CLEAR_DATA}
                    icon={<TableRow.Icon variant="danger" source={findAssetId("CopyIcon")} />}
                    variant="danger"
                    onPress={() => showConfirmationAlert({
                        title: Strings.HOLD_UP,
                        content: formatString("ARE_YOU_SURE_TO_CLEAR_DATA", { name: plugin.name }),
                        confirmText: Strings.CLEAR,
                        cancelText: Strings.CANCEL,
                        confirmColor: "red",
                        onConfirm: async () => {
                            if (compatPlugin.enabled) CompatPluginManager.stopPlugin(plugin.id, false);

                            try {
                                await CompatPluginManager.fetchPlugin(plugin.id);
                                showToast(Strings.PLUGIN_REFETCH_SUCCESSFUL, findAssetId("DownloadIcon"));
                            } catch {
                                showToast(Strings.PLUGIN_REFETCH_FAILED, findAssetId("XSmallIcon"));
                            }

                            let message: any[];
                            try {
                                purgeStorage(plugin.id);
                                message = ["CLEAR_DATA_SUCCESSFUL", "TrashIcon"];
                            } catch {
                                message = ["CLEAR_DATA_FAILED", "XSmallIcon"];
                            }

                            showToast(
                                formatString(message[0], { name: plugin.name }),
                                findAssetId(message[1])
                            );

                            if (compatPlugin.enabled) await CompatPluginManager.startPlugin(plugin.id);
                            hideSheet("PluginInfoActionSheet");
                        }
                    })}
                />
                <ActionSheetRow
                    label={Strings.DELETE}
                    icon={<TableRow.Icon variant="danger" source={findAssetId("TrashIcon")} />}
                    variant="danger"
                    onPress={() => showConfirmationAlert({
                        title: Strings.HOLD_UP,
                        content: formatString("ARE_YOU_SURE_TO_DELETE_PLUGIN", { name: plugin.name }),
                        confirmText: Strings.DELETE,
                        cancelText: Strings.CANCEL,
                        confirmColor: "red",
                        onConfirm: () => {
                            try {
                                CompatPluginManager.removePlugin(plugin.id);
                            } catch (e) {
                                showToast(String(e), findAssetId("XSmallIcon"));
                            }
                            hideSheet("PluginInfoActionSheet");
                        }
                    })}
                />
            </ActionSheetRow.Group>
        </ScrollView>
    </ActionSheet>;
}
