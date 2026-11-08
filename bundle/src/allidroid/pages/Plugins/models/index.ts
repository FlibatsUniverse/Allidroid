import { Author } from "@api/addons/types";
import { ImageSourcePropType } from "react-native";

interface Badge {
    source: ImageSourcePropType;
    color?: string;
    onPress?: () => void;
}

export interface UnifiedPluginModel {
    id: string;
    name: string;
    description?: string;
    authors?: Author[];
    tags?: string[];
    /** Tags and search terms, joined so one search key covers them. */
    searchText?: string;
    required?: boolean;
    /** Added by link rather than shipped with the app. */
    isUser?: boolean;
    isConflicted?(): boolean;
    hidden?: boolean;
    requiresRestart?: boolean;
    icon?: string;
    getBadges(): Badge[];
    isEnabled(): boolean;
    usePluginState(): void;
    isInstalled(): boolean;
    toggle(start: boolean): Promise<void> | void;
    resolveSheetComponent(): Promise<{ default: React.ComponentType<any>; }>;
    getPluginSettingsComponent(): React.ComponentType<any> | null | undefined;
}
