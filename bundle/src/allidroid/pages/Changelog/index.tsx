import { safeFetch } from "@lib/utils";
import { Card, Stack, Text } from "@metro/common/components";
import React from "react";
import { ScrollView } from "react-native";

interface Release {
    id: number;
    tag_name: string;
    name: string | null;
    body: string | null;
    published_at: string;
}

export default function Changelog() {
    const [releases, setReleases] = React.useState<Release[] | null>(null);
    const [failed, setFailed] = React.useState(false);

    React.useEffect(() => {
        safeFetch("https://api.github.com/repos/FlibatsUniverse/Allidroid/releases?per_page=10", { cache: "no-store" })
            .then(r => r.json())
            .then(setReleases)
            .catch(() => setFailed(true));
    }, []);

    return (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 38 }}>
            <Stack style={{ paddingVertical: 24, paddingHorizontal: 12 }} spacing={12}>
                {failed && <Text variant="text-md/medium" color="text-muted">The changelog could not be loaded right now.</Text>}
                {releases && !releases.length && <Text variant="text-md/medium" color="text-muted">There are no releases yet.</Text>}
                {releases?.map(release => (
                    <Card key={release.id}>
                        <Text variant="heading-md/bold">{release.name || release.tag_name}</Text>
                        <Text variant="text-xs/medium" color="text-muted">{new Date(release.published_at).toLocaleDateString()}</Text>
                        {release.body ? <Text variant="text-sm/normal" style={{ marginTop: 8 }}>{release.body}</Text> : null}
                    </Card>
                ))}
            </Stack>
        </ScrollView>
    );
}
