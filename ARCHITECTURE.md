# Architecture

Allidroid has three parts that ship together: a TypeScript bundle that runs inside Discord, an Android loader that starts it, and an iOS loader that starts it.

## Bundle (`bundle/`)

TypeScript, built with esbuild and swc into one file, `bundle/dist/allidroid.min.js`. It finds Discord's own modules, patches them, and adds the Allidroid settings, plugins, themes and fonts. Both loaders download that file from the latest release of this repository.

The layout follows Allicord, with the same `api`, `plugins` and `utils` roles:

- `src/api` is the app's API: patcher, storage, assets, native modules, settings, commands, flux, `ui` components, and the `addons` for themes and fonts.
- `src/plugins` is the plugin system, and each built-in plugin is a folder next to it, the way Allicord keeps its plugins. `_core` holds the plugins that make up the app itself, like AlliBadges.
- `src/allidroid` is the app's own screens and pieces: the settings pages, translations, commands, error screen and debug tools. It mirrors the screens in Allicord's settings.
- `src/metro` finds Discord's modules and wraps them.
- `src/lib` has shared utilities and the backup and import code.
- `src/compat` lets plugins written for earlier loaders keep working.

Build it with `bun install --frozen-lockfile` and `node scripts/build.mjs --build-minify` inside `bundle/`.

## Plugins

There are two kinds, shown together on the Plugins screen.

- **Built-in plugins** are folders in `bundle/src/plugins`, the one place plugins live, like `src/plugins` in Allicord. They ship inside the app. `node bundle/scripts/buildPlugins.mjs` lists them in `plugins.json`, the release publishes that file, and the Allicord plugins page on the Alliance website shows them under Mobile. A plugin that also exists in Allicord uses the same name and description, and the website shows it once with both sources.
- **User plugins** are added in the app by pasting a link to a folder that holds a `manifest.json` and the file it names. Since this is mobile there is no folder to create, just the link.

## Settings and backups

The settings screens mirror Allicord's tabs that make sense on a phone: Allidroid (general), Plugins, Themes, Updater, Backup & Restore and Changelog, plus Fonts and Developer. Cloud sync and the desktop-only tabs are left out.

`bundle/src/lib/backup/detect.ts` reads a settings file from any client mod by its shape and turns it into one plan: plugin switches, plugin links, theme links and custom CSS. Allicord carries an identical copy in `src/api/SettingsSync/detect.ts`, so a backup from either app imports into the other, and Allicord keeps the `allidroid` part of a backup untouched so nothing is lost on the way back.

## Android (`app/` and `api/`)

An Xposed module written in Kotlin. Allidroid Manager patches Discord with it, so it runs inside the Discord process.

- `app` is the module. `Main.kt` starts the tweaks, `tweaks/` has one file per feature, and `tweaks/plugins` is the native plugin system.
- `api` is the small library native plugins build against.
- Files live in the app's `files/allidroid` folder and caches in `cache/allidroid`.
- The loader sets the `__ALLIDROID_LOADER__` global before the bundle runs.

Build it with `./gradlew assembleDebug`. The release workflow publishes it as `app-release.apk`, the exact name Allidroid Manager downloads.

## iOS (`ios/`)

A Theos tweak written in Objective-C and C++ that injects into Discord, downloads the bundle, and runs it. It sets the same `__ALLIDROID_LOADER__` global, and also handles themes, fonts, sideloading support and the loader settings screen opened by shaking the device.

Build it on macOS with Theos: `gmake package` inside `ios/`.

## Releases

The Allidroid Release workflow builds the bundle and the APK after every successful `main` build and publishes `app-release.apk`, `allidroid.min.js` and a `SHA256SUMS` file.
