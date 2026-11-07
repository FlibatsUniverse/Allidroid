import { findAssetId } from "@api/assets";
import { getDebugInfo } from "@api/debug";
import { downloadFile } from "@api/native/fs";
import { BundleUpdaterManager } from "@api/native/modules";
import { showToast } from "@ui/toasts";
import { safeFetch } from "@lib/utils";
import { Button, Stack, TableRow, TableRowGroup } from "@metro/common/components";
import React from "react";
import { ScrollView } from "react-native";

const RELEASE_API = "https://api.github.com/repos/FlibatsUniverse/Allidroid/releases/latest";
const BUNDLE_URL = "https://github.com/FlibatsUniverse/Allidroid/releases/latest/download/allidroid.min.js";

interface Release {
    tag_name: string;
    published_at: string;
}

export default function Updater() {
    const debugInfo = getDebugInfo();
    const [release, setRelease] = React.useState<Release | null>(null);
    const [status, setStatus] = React.useState("");
    const [busy, setBusy] = React.useState(false);

    const check = async () => {
        setBusy(true);
        setStatus("");
        try {
            setRelease(await (await safeFetch(RELEASE_API, { cache: "no-store" })).json());
        } catch {
            setStatus("Could not reach GitHub. Try again in a moment.");
        } finally {
            setBusy(false);
        }
    };

    React.useEffect(() => void check(), []);

    return (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 38 }}>
            <Stack style={{ paddingVertical: 24, paddingHorizontal: 12 }} spacing={24}>
                <TableRowGroup title="Version">
                    <TableRow label="Installed" trailing={<TableRow.TrailingText text={debugInfo.allidroid.version} />} />
                    <TableRow
                        label="Latest release"
                        subLabel={release ? new Date(release.published_at).toLocaleDateString() : undefined}
                        trailing={<TableRow.TrailingText text={release?.tag_name ?? (busy ? "Checking" : "Unknown")} />}
                    />
                </TableRowGroup>

                {status ? <TableRow label={status} /> : null}

                <Stack spacing={12}>
                    <Button
                        size="lg"
                        text="Check for updates"
                        variant="secondary"
                        loading={busy}
                        disabled={busy}
                        onPress={check}
                    />
                    <Button
                        size="lg"
                        text="Update and restart"
                        variant="primary"
                        icon={findAssetId("DownloadIcon")}
                        disabled={busy}
                        onPress={async () => {
                            setBusy(true);
                            try {
                                await downloadFile(BUNDLE_URL, "bundle.js");
                                showToast("Updated, restarting", findAssetId("CheckmarkSmallIcon"));
                                setTimeout(() => BundleUpdaterManager.reload(), 400);
                            } catch {
                                setStatus("The update could not be downloaded.");
                                setBusy(false);
                            }
                        }}
                    />
                </Stack>
            </Stack>
        </ScrollView>
    );
}
