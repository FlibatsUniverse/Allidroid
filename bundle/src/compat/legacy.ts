/**
 * Plugins written for earlier loaders reach the app through fixed names: a
 * global object, the argument their code is wrapped in, and a loader marker.
 * They cannot be renamed without breaking every one of those plugins, so the
 * compatibility layer provides them, and this is the only file that spells
 * them out.
 */
export const LEGACY_API_NAME = "vendetta";
export const LEGACY_LOADER_NAME = "__vendetta_loader";
export const LEGACY_MANIFEST_KEY = "vendetta";

/** The source of a plugin, wrapped the way earlier loaders wrapped it. */
export const wrapLegacyPlugin = (js: string, id: string) => `${LEGACY_API_NAME}=>{return ${js}}
//# sourceURL=${id}`;

export const legacyApi = () => (window as any)[LEGACY_API_NAME];
export const setLegacyApi = (api: unknown) => ((window as any)[LEGACY_API_NAME] = api);
export const clearLegacyApi = () => void delete (window as any)[LEGACY_API_NAME];
