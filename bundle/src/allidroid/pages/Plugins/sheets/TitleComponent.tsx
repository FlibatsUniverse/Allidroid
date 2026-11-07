import { authorName, openContributor, useAuthorUsers } from "@allidroid/ui/components/Contributors";
import { UnifiedPluginModel } from "@allidroid/pages/Plugins/models";
import { Avatar, AvatarPile, Text } from "@metro/common/components";
import { View } from "react-native";

export default function TitleComponent({ plugin }: { plugin: UnifiedPluginModel; }) {
    const authors = plugin.authors ?? [];
    const users = useAuthorUsers(authors);
    const known = users.filter(Boolean);

    return <View style={{ gap: 4 }}>
        <View>
            <Text variant="heading-xl/semibold">
                {plugin.name}
            </Text>
        </View>
        <View style={{ flexDirection: "row", flexShrink: 1 }}>
            {authors.length > 0 && <View style={{ flexDirection: "row", gap: 8, alignItems: "center", paddingVertical: 4, paddingHorizontal: 8, backgroundColor: "#00000016", borderRadius: 32 }}>
                {known.length > 0 && <AvatarPile
                    size="xxsmall"
                    names={authors.map(a => a.name)}
                    totalCount={authors.length}
                >
                    {known.map(user => <Avatar key={user.id} size="xxsmall" user={user} />)}
                </AvatarPile>}
                <Text variant="text-md/medium">
                    {authors.map((author, i) => (
                        <Text key={i} variant="text-md/medium" onPress={() => openContributor(author)}>
                            {authorName(author, users[i])}{i < authors.length - 1 ? ", " : ""}
                        </Text>
                    ))}
                </Text>
            </View>}
        </View>
    </View>;
}
