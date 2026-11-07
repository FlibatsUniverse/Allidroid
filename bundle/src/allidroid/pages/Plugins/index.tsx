import { Strings } from "@allidroid/i18n";
import AddonPage from "@allidroid/ui/components/AddonPage";
import PluginCard from "@allidroid/pages/Plugins/components/PluginCard";
import { CompatPluginManager } from "@compat/plugins";
import { useProxy } from "@compat/storage";
import { isCorePlugin, isPluginInstalled, pluginSettings, registeredPlugins } from "@plugins";
import { Author } from "@api/addons/types";
import { findAssetId } from "@api/assets";
import { settings } from "@api/settings";
import { useObservable } from "@api/storage";
import { showToast } from "@ui/toasts";
import { PROXY_PREFIX } from "@lib/utils/constants";
import { lazyDestructure } from "@lib/utils/lazy";
import { findByProps } from "@metro";
import { NavigationNative } from "@metro/common";
import { Button, Card, FlashList, IconButton, Text } from "@metro/common/components";
import { ComponentProps } from "react";
import { View } from "react-native";

import { UnifiedPluginModel } from "./models";
import unifyAllidroidPlugin from "./models/allidroid";
import unifyCompatPlugin from "./models/compat";

const { openAlert } = lazyDestructure(() => findByProps("openAlert", "dismissAlert"));
const { AlertModal, AlertActions, AlertActionButton } = lazyDestructure(() => findByProps("AlertModal", "AlertActions"));

interface PluginPageProps extends Partial<ComponentProps<typeof AddonPage<UnifiedPluginModel>>> {
    useItems: () => unknown[];
}

function PluginPage(props: PluginPageProps) {
    const items = props.useItems();

    return <AddonPage<UnifiedPluginModel>
        CardComponent={PluginCard}
        title={Strings.PLUGINS}
        searchKeywords={[
            "name",
            "description",
            p => p.authors?.map(
                (a: Author | string) => typeof a === "string" ? a : a.name
            ).join() || "",
            "searchText"
        ]}
        sortOptions={{
            "Name (A-Z)": (a, b) => a.name.localeCompare(b.name),
            "Name (Z-A)": (a, b) => b.name.localeCompare(a.name),
            "Enabled": (a, b) => Number(b.isEnabled()) - Number(a.isEnabled()),
            "Disabled": (a, b) => Number(a.isEnabled()) - Number(b.isEnabled())

        }}
        safeModeHint={{ message: Strings.SAFE_MODE_NOTICE_PLUGINS }}
        items={items}
        {...props}
    />;
}

export default function Plugins() {
    useProxy(settings);
    const navigation = NavigationNative.useNavigation();
    const [, forceUpdate] = React.useReducer((x) => x + 1, 0);

    return <PluginPage
        useItems={() => {
            useProxy(CompatPluginManager.plugins);
            useObservable([pluginSettings]);

            const compatPlugins = Object.values(CompatPluginManager.plugins).map(unifyCompatPlugin);
            const bnPlugins = [...registeredPlugins.values()].filter(p => isPluginInstalled(p.id) && !p.hidden).map(unifyAllidroidPlugin);

            return [...compatPlugins, ...bnPlugins];
        }}
        ListHeaderComponent={() => {
            const unproxiedPlugins = Object.values(CompatPluginManager.plugins).filter(p => !p.id.startsWith(PROXY_PREFIX));
            if (!unproxiedPlugins.length) return null;

            return <View style={{ marginVertical: 12, marginHorizontal: 10 }}>
                <Card border="strong">
                    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", flexDirection: "row" }}>
                        <View style={{ gap: 6, flexShrink: 1 }}>
                            <Text variant="heading-md/bold">User plugins installed</Text>
                            <Text variant="text-sm/medium" color="text-muted">
                                User plugins come from links you added yourself and run their code inside this app. Only keep the ones you trust.
                            </Text>
                        </View>
                        <View style={{ marginLeft: "auto" }}>
                            <IconButton
                                size="sm"
                                variant="secondary"
                                icon={findAssetId("CircleInformationIcon-primary")}
                                style={{ marginLeft: 8 }}
                                onPress={() => {
                                    navigation.push("ALLIDROID_CUSTOM_PAGE", {
                                        title: "User plugins",
                                        render: () => {
                                            return <FlashList
                                                data={unproxiedPlugins}
                                                contentContainerStyle={{ padding: 8 }}
                                                ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
                                                renderItem={({ item: p }: any) => <Card>
                                                    <Text variant="heading-md/semibold">{p.id}</Text>
                                                </Card>}
                                            />;
                                        }
                                    });
                                }}
                            />
                        </View>
                    </View>
                </Card>
            </View>;
        }}
        ListFooterComponent={() => (
            <View style={{ alignItems: "center", justifyContent: "center", paddingTop: 16, gap: 12 }}><Button
                size="lg"
                text="Browse official plugins"
                icon={findAssetId("CompassIcon")}
                onPress={() => {
                    navigation.push("ALLIDROID_CUSTOM_PAGE", {
                        title: "Plugin Browser",
                        render: React.lazy(() => import("../PluginBrowser")),
                    });
                }}
            />
            </View>
        )}
        installAction={{
            label: "Add a user plugin",
            fetchFn: async (url: string) => {
                if (!url.startsWith(PROXY_PREFIX) && !settings.developerSettings) {
                    openAlert("allidroid-plugin-unproxied-confirmation", <AlertModal
                        title="Add a user plugin?"
                        content="This plugin does not come from the official Allidroid list. It will run its code inside this app, so only continue if you trust whoever made it."
                        extraContent={<Card><Text variant="text-md/bold">{url}</Text></Card>}
                        actions={<AlertActions>
                            <AlertActionButton text="Continue" variant="primary" onPress={() => {
                                CompatPluginManager.installPlugin(url)
                                    .then(() => {
                                        showToast(Strings.TOASTS_INSTALLED_PLUGIN, findAssetId("DownloadIcon"));
                                        forceUpdate();
                                    })
                                    .catch(e => openAlert("allidroid-plugin-install-failed", <AlertModal
                                        title="Install Failed"
                                        content={`Unable to install plugin from '${url}':`}
                                        extraContent={<Card><Text variant="text-md/normal">{e instanceof Error ? e.message : String(e)}</Text></Card>}
                                        actions={<AlertActionButton text="Okay" variant="primary" />}
                                    />));
                            }} />
                            <AlertActionButton text="Cancel" variant="secondary" />
                        </AlertActions>}
                    />);
                } else {
                    await CompatPluginManager.installPlugin(url);
                    showToast(Strings.TOASTS_INSTALLED_PLUGIN, findAssetId("DownloadIcon"));
                    forceUpdate();
                }
            }
        }}
    />;
}
