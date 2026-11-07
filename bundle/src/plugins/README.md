# Plugins

Every plugin Allidroid ships is a folder here, the way Allicord keeps its plugins in `src/plugins`. `_core` holds the ones that make up the app itself. Folders that start with an underscore are not plugins, `_template` is the one to copy.

A plugin is a folder with an `index.ts` (or `.tsx`) that exports `definePlugin({ ... })`, and a line in `_core/index.ts` that lists it. When a plugin has an Allicord version, give it the **same name and description**, so the Allicord website shows it once, working everywhere.

## What a plugin can declare

The same options an Allicord plugin has:

| Field | What it does |
| --- | --- |
| `name`, `description`, `id`, `version` | What it is. `id` is short and unique, the app prefixes it with `allidroid.`. |
| `author` | The people who made it, from `src/allidroid/Developers.ts`. The app shows their Discord profile picture and username, and tapping one lists everything they made. |
| `tags` | Groups shown on the plugin, like `Appearance`. |
| `searchTerms` | Extra words that bring the plugin up in search. |
| `dependencies` | Plugins, by id or name, turned on first and kept on while this one is. |
| `conflicts` | Plugins that do the same job. They cannot be on together, and while a `required` plugin lists one, it cannot be turned on. |
| `required` | Always on and cannot be turned off. |
| `hidden` | Kept out of the plugin list. |
| `enabledByDefault` | Turned on once, the first time it is available. Turning it off later sticks. |
| `requiresRestart` | Asks for a restart after it is turned on or off. |
| `platforms`, `predicates`, `devOnly` | Where it is allowed to run. |
| `eagerStart`, `start`, `stop` | When it runs. |
| `settings` | A screen to configure it. `defineSettings` in `@plugins/settings` builds one from a list of options. |

`node bundle/scripts/buildPlugins.mjs` reads every definition and writes `bundle/dist/plugins.json`. The release publishes it, and the Alliance website lists the plugins from it under Mobile.

## User plugins

People can also add their own plugins in the app by pasting a link to a plugin folder. Those are kept separate from the ones here.
