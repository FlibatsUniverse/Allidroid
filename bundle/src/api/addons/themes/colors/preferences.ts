import { createStorage } from "@api/storage";

interface AllidroidColorPreferencesStorage {
    selected: string | null;
    type?: "dark" | "light" | null;
    customBackground: "hidden" | null;
    per?: Record<string, { autoUpdate?: string; } | undefined>;
}

export const colorsPref = createStorage<AllidroidColorPreferencesStorage>(
    "themes/colors/preferences.json",
    {
        dflt: {
            selected: null,
            customBackground: null
        }
    }
);
