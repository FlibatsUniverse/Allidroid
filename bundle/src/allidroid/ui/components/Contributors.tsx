import { CompatPluginManager } from "@compat/plugins";
import { registeredPlugins } from "@plugins";
import { Author } from "@api/addons/types";
import { showSheet } from "@ui/sheets";
import { lazyDestructure } from "@lib/utils/lazy";
import { findByNameLazy, findByProps } from "@metro";
import { FluxUtils } from "@metro/common";
import { ActionSheet, Avatar, Stack, TableRow, TableRowGroup, Text } from "@metro/common/components";
import { UserStore } from "@metro/common/stores";
import React from "react";
import { ScrollView, View } from "react-native";

const showUserProfileActionSheet = findByNameLazy("showUserProfileActionSheet");
const { getUser: fetchUser } = lazyDestructure(() => findByProps("getUser", "fetchProfile"));

/** The Discord accounts of plugin authors, fetched when they are not known yet. */
export function useAuthorUsers(authors?: Author[]): any[] {
    React.useEffect(() => {
        authors?.forEach(a => a.id && fetchUser(a.id));
    }, [authors]);

    return FluxUtils.useStateFromStoresArray([UserStore], () => (authors ?? []).map(a => a.id ? UserStore.getUser(a.id) : undefined));
}

/** The name the Discord client shows: the account's username, or the name written in the plugin. */
export const authorName = (author: Author, user?: any) => user?.username ?? author.name;

const sameAuthor = (a: Author, b: Author) => a.id && b.id ? a.id === b.id : a.name.toLowerCase() === b.name.toLowerCase();

/** Everything an author has made that this app knows about: official plugins and the ones added by link. */
export function contributionsOf(author: Author) {
    const found = new Map<string, { id: string; name: string; description?: string; }>();

    for (const [id, manifest] of registeredPlugins) {
        if (manifest.display.authors?.some(a => sameAuthor(a, author))) {
            found.set(id, { id, name: manifest.display.name, description: manifest.display.description });
        }
    }
    for (const plugin of Object.values(CompatPluginManager.plugins)) {
        if (plugin.manifest.authors?.some((a: Author) => sameAuthor(a, author))) {
            found.set(plugin.id, { id: plugin.id, name: plugin.manifest.name, description: plugin.manifest.description });
        }
    }

    return [...found.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function ContributorSheet({ author }: { author: Author; }) {
    const [user] = useAuthorUsers([author]);
    const contributions = contributionsOf(author);

    return (
        <ActionSheet>
            <ScrollView contentContainerStyle={{ gap: 16, paddingBottom: 16 }}>
                <View style={{ alignItems: "center", gap: 8, paddingTop: 24 }}>
                    {user && <Avatar size="large" user={user} />}
                    <Text variant="heading-xl/semibold">{authorName(author, user)}</Text>
                    <Text variant="text-md/medium" color="text-muted">
                        {contributions.length} {contributions.length === 1 ? "contribution" : "contributions"}
                    </Text>
                </View>
                <Stack spacing={16} style={{ paddingHorizontal: 12 }}>
                    {author.id && <TableRowGroup title="Discord">
                        <TableRow label="View Discord profile" onPress={() => showUserProfileActionSheet({ userId: author.id })} />
                    </TableRowGroup>}
                    <TableRowGroup title="Plugins">
                        {contributions.length
                            ? contributions.map(c => <TableRow key={c.id} label={c.name} subLabel={c.description} />)
                            : <TableRow label="Nothing here yet" />}
                    </TableRowGroup>
                </Stack>
            </ScrollView>
        </ActionSheet>
    );
}

/** What tapping an author opens: their profile picture, username and all of their plugins. */
export function openContributor(author: Author) {
    showSheet("ContributorSheet", ContributorSheet, { author });
}
