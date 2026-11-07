import { createStorage, useObservable } from "@api/storage";
import { lazyDestructure } from "@lib/utils/lazy";
import { findByProps } from "@metro/wrappers";
import { Stack, TableRow, TableRowGroup, TableSwitchRow, TextInput } from "@metro/common/components";
import React from "react";
import { ScrollView } from "react-native";

const { showSimpleActionSheet } = lazyDestructure(() => findByProps("showSimpleActionSheet"));

type Store = Record<string, any>;

export interface SettingDefinition {
    type: "boolean" | "string" | "number" | "select";
    description: string;
    default?: any;
    options?: { label: string; value: any; }[];
    /** Hide the setting while this returns true. */
    hidden?(store: Store): boolean;
    /** Show the setting but keep it from being changed. */
    disabled?(store: Store): boolean;
    onChange?(value: any): void;
}

export type SettingsDefinitions = Record<string, SettingDefinition>;

/**
 * The mobile counterpart of Allicord's `definePluginSettings`. Describe the
 * options once and get back the values, and a screen to change them.
 *
 * `store` reads fall back to the default, and writes are saved right away.
 */
export function defineSettings(id: string, definitions: SettingsDefinitions) {
    const raw = createStorage<Store>(`plugins/storage/${id}.json`);

    const store = new Proxy({} as Store, {
        get: (_, key: string) => raw[key] ?? definitions[key]?.default,
        set: (_, key: string, value) => {
            raw[key] = value;
            definitions[key]?.onChange?.(value);
            return true;
        }
    });

    function Rows({ title = "Settings", extra }: { title?: string; extra?: React.ReactNode; }) {
        useObservable([raw]);

        return (
            <TableRowGroup title={title}>
                {Object.entries(definitions).map(([key, def]) => {
                    if (def.hidden?.(store)) return null;
                    const disabled = def.disabled?.(store);

                    if (def.type === "boolean") {
                        return <TableSwitchRow
                            key={key}
                            label={def.description}
                            value={Boolean(store[key])}
                            disabled={disabled}
                            onValueChange={(value: boolean) => void (store[key] = value)}
                        />;
                    }

                    if (def.type === "select") {
                        const current = def.options?.find(o => o.value === store[key]);
                        return <TableRow
                            key={key}
                            label={def.description}
                            disabled={disabled}
                            trailing={<TableRow.TrailingText text={current?.label ?? ""} />}
                            onPress={() => showSimpleActionSheet({
                                key: `allidroid-setting-${id}-${key}`,
                                header: { title: def.description, onClose: () => { } },
                                options: (def.options ?? []).map(option => ({
                                    label: option.label,
                                    onPress: () => void (store[key] = option.value)
                                }))
                            })}
                        />;
                    }

                    return <TableRow
                        key={key}
                        label={<TextInput
                            label={def.description}
                            size="md"
                            defaultValue={String(store[key] ?? "")}
                            editable={!disabled}
                            onChange={(value: string) => void (store[key] = def.type === "number" ? Number(value) : value)}
                        />}
                    />;
                })}
                {extra}
            </TableRowGroup>
        );
    }

    function SettingsComponent() {
        return (
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 38 }}>
                <Stack style={{ paddingVertical: 24, paddingHorizontal: 12 }} spacing={24}>
                    <Rows />
                </Stack>
            </ScrollView>
        );
    }

    return { store, raw, Rows, SettingsComponent };
}
