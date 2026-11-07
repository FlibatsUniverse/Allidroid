import { useProxy } from "@compat/storage";
import { findAssetId } from "@api/assets";
import { settings } from "@api/settings";
import { showToast } from "@ui/toasts";
import { safeFetch } from "@lib/utils";
import { applyImport, detectSettings, exportBackup, type ImportPlan, type ImportResult, isEmptyPlan } from "@lib/backup";
import { clipboard } from "@metro/common";
import { Button, Stack, TableRow, TableRowGroup, Text } from "@metro/common/components";
import React from "react";
import { ScrollView } from "react-native";

function Summary({ plan }: { plan: ImportPlan; }) {
    return (
        <TableRowGroup title={`Found: ${plan.kind}`}>
            <TableRow label="Plugins to switch on or off" trailing={<TableRow.TrailingText text={String(plan.pluginStates.length)} />} />
            <TableRow label="Plugins to add from a link" trailing={<TableRow.TrailingText text={String(plan.pluginLinks.length)} />} />
            <TableRow label="Themes" trailing={<TableRow.TrailingText text={String(plan.themeLinks.length)} />} />
            {plan.customCss && <TableRow label="Custom CSS" subLabel="Only used on desktop" />}
        </TableRowGroup>
    );
}

export default function Backup() {
    useProxy(settings);

    const [plan, setPlan] = React.useState<ImportPlan | null>(null);
    const [result, setResult] = React.useState<ImportResult | null>(null);
    const [busy, setBusy] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const read = (text: string) => {
        setResult(null);
        try {
            const found = detectSettings(text);
            if (isEmptyPlan(found)) throw new Error("Nothing in this file can be imported here.");
            setError(null);
            setPlan(found);
        } catch (e) {
            setPlan(null);
            setError(e instanceof Error ? e.message : String(e));
        }
    };

    const fromClipboard = async () => read(await clipboard.getString());
    const fromLink = async () => {
        const text = await clipboard.getString();
        try {
            read(await (await safeFetch(text.trim(), { cache: "no-store" })).text());
        } catch {
            setPlan(null);
            setError("Copy a link to a settings file first, then try again.");
        }
    };

    return (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 38 }}>
            <Stack style={{ paddingVertical: 24, paddingHorizontal: 12 }} spacing={24}>
                <TableRowGroup title="Export">
                    <TableRow
                        label="Copy backup"
                        subLabel="Plugins, themes and settings, ready to paste into Allicord or Allidroid."
                        icon={<TableRow.Icon source={findAssetId("LinkIcon")} />}
                        onPress={() => {
                            clipboard.setString(exportBackup());
                            showToast("Copied the backup", findAssetId("CheckmarkSmallIcon"));
                        }}
                    />
                </TableRowGroup>

                <TableRowGroup title="Import">
                    <TableRow
                        label="Paste from clipboard"
                        subLabel="Settings from Allicord, Allidroid or any other client mod."
                        icon={<TableRow.Icon source={findAssetId("DownloadIcon")} />}
                        onPress={fromClipboard}
                    />
                    <TableRow
                        label="Load from a copied link"
                        icon={<TableRow.Icon source={findAssetId("LinkIcon")} />}
                        onPress={fromLink}
                    />
                </TableRowGroup>

                {error && <Text variant="text-md/medium" color="text-danger">{error}</Text>}

                {plan && !result && <>
                    <Summary plan={plan} />
                    <Button
                        size="lg"
                        text="Import"
                        variant="primary"
                        loading={busy}
                        disabled={busy}
                        onPress={async () => {
                            setBusy(true);
                            try {
                                setResult(await applyImport(plan));
                                setPlan(null);
                            } catch (e) {
                                setError(e instanceof Error ? e.message : String(e));
                            } finally {
                                setBusy(false);
                            }
                        }}
                    />
                </>}

                {result && <TableRowGroup title="Import finished">
                    <TableRow label="Imported" trailing={<TableRow.TrailingText text={String(result.done.length)} />} />
                    {result.skipped.map(text => <TableRow key={text} label={text} />)}
                    {result.failed.map(item => <TableRow key={item.what} label={item.what} subLabel={item.error} />)}
                </TableRowGroup>}
            </Stack>
        </ScrollView>
    );
}
