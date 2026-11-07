# Contributing to Allidroid

## Branches and pull requests

main is the stable Allidroid branch. Create feature branches from main and target main. Never force-push main. Every main push is built by the Allidroid Build workflow, and a release is published automatically once that build succeeds.

## Conventional Commits

Use Conventional Commits for new commits and pull request titles:

```text
feat(settings): add a plugin folder shortcut
fix(loader): retry a failed bundle download once
docs(contributing): describe the release process
ci(release): pin action versions
```

Format: type(optional-scope): description. Types include feat, fix, docs, style, refactor, perf, test, build, ci, chore and revert. Use ! or a BREAKING CHANGE: footer for breaking changes. Squash titles must follow this format. History-preserving merge commits keep their original messages.

## Layout

`bundle/` is the TypeScript that runs inside Discord, `app/` and `api/` are the Android module, and `ios/` is the iOS tweak. [ARCHITECTURE.md](ARCHITECTURE.md) explains each part.

## Plugins

Plugins are folders in `bundle/src/plugins`, see [its README](bundle/src/plugins/README.md). `node bundle/scripts/buildPlugins.mjs` checks that they are listed correctly.

## Code

Follow .rules for Kotlin, strings and branding. User-facing text belongs in `app/src/main/res/values/strings.xml`, in US spelling. Branding values are `BuildConfig` fields in `app/build.gradle.kts`.

## Releases

The Allidroid Release workflow publishes `app-release.apk` with a SHA256SUMS file. Allidroid Manager downloads that exact file name from the latest release, so it must never be renamed. The version comes from `versionName` in `app/build.gradle.kts`.

## Validation

For the bundle, run `bun install --frozen-lockfile` and `node scripts/build.mjs --build-minify` inside `bundle/`. For Android, install JDK 17 and the Android SDK with platform 37, then run `./gradlew assembleDebug`. For iOS, run `gmake package` inside `ios/` on macOS with Theos. Install the result with Allidroid Manager on a device or emulator and test what you changed. Review workflow changes and dependency compatibility. Compilation alone does not validate behavior.

## Related repositories

Allidroid is the mobile version of [Allicord](https://github.com/FlibatsUniverse/Allicord) and is installed by [Allidroid Manager](https://github.com/FlibatsUniverse/AllidroidManager). Problems with the installer belong in the Allidroid Manager repository, and problems with the desktop and web client belong in the Allicord repository.

## AI assistance

Disclose the tool and scope of AI assistance. Human contributors must review and understand submitted changes. Keep issues and pull request descriptions concise and relevant.
