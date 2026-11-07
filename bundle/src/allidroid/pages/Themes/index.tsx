import { formatString, Strings } from "@allidroid/i18n";
import AddonPage from "@allidroid/ui/components/AddonPage";
import ThemeCard from "@allidroid/pages/Themes/ThemeCard";
import { useProxy } from "@compat/storage";
import { getCurrentTheme, installTheme, themes, CompatThemeInfo } from "@api/addons/themes";
import { colorsPref } from "@api/addons/themes/colors/preferences";
import { updateAllidroidColor } from "@api/addons/themes/colors/updater";
import { Author } from "@api/addons/types";
import { findAssetId } from "@api/assets";
import { settings } from "@api/settings";
import { useObservable } from "@api/storage";
import { ActionSheet, BottomSheetTitleHeader, Button, TableRowGroup, TableRowIcon, TableSwitchRow, TableRow, TableRadioGroup, TableRadioRow } from "@metro/common/components";
import { View } from "react-native";

export default function Themes() {
    useProxy(settings);
    useProxy(themes);

    return (
        <AddonPage<CompatThemeInfo>
            title={Strings.THEMES}
            searchKeywords={[
                "data.name",
                "data.description",
                p => p.data.authors?.map((a: Author) => a.name).join(", ") ?? ""
            ]}
            sortOptions={{
                "Name (A-Z)": (a, b) => a.data.name.localeCompare(b.data.name),
                "Name (Z-A)": (a, b) => b.data.name.localeCompare(a.data.name)
            }}
            installAction={{
                label: "Install a theme",
                fetchFn: installTheme
            }}
            items={Object.values(themes)}
            safeModeHint={{
                message: formatString("SAFE_MODE_NOTICE_THEMES", { enabled: Boolean(settings.safeMode?.currentThemeId) }),
                footer: settings.safeMode?.currentThemeId && <Button
                    size="small"
                    text={Strings.DISABLE_THEME}
                    onPress={() => delete settings.safeMode?.currentThemeId}
                    style={{ marginTop: 8 }}
                />
            }}
            CardComponent={ThemeCard}
            OptionsActionSheetComponent={() => {
                useObservable([colorsPref]);

                return <ActionSheet>
                    <BottomSheetTitleHeader title="Options" />
                    <View style={{ paddingVertical: 20, gap: 12 }}>
                        <TableRadioGroup
                            title="Override Theme Type"
                            defaultValue={colorsPref.type ?? "auto"}
                            hasIcons={true}
                            onChange={type => {
                                colorsPref.type = type !== "auto" ? type as "dark" | "light" : undefined;
                                getCurrentTheme()?.data && updateAllidroidColor(getCurrentTheme()!.data!, { update: true });
                            }}
                        >
                            <TableRadioRow icon={<TableRowIcon source={findAssetId("RobotIcon")} />} label="Auto" value="auto" />
                            <TableRadioRow icon={<TableRowIcon source={findAssetId("ThemeDarkIcon")} />} label="Dark" value="dark" />
                            <TableRadioRow icon={<TableRowIcon source={findAssetId("ThemeLightIcon")} />} label="Light" value="light" />
                        </TableRadioGroup>

                        <TableRowGroup title="Settings">
                            <TableSwitchRow
                                label="Show Chat Background"
                                subLabel="Shows or hides the theme's background image in chat"
                                icon={<TableRow.Icon source={findAssetId("ImageIcon")} />}
                                value={colorsPref.customBackground !== "hidden"}
                                onValueChange={(value) => {
                                    colorsPref.customBackground = value ? null : "hidden";
                                }}
                            />
                        </TableRowGroup>
                    </View>
                </ActionSheet>;
            }}
        />
    );
}