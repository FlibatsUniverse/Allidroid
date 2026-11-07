# [<img src="./assets/alliance.svg" width="40" align="left" alt="Allidroid">](https://github.com/FlibatsUniverse/Allidroid) Allidroid

[![Version](https://img.shields.io/github/v/release/FlibatsUniverse/Allidroid?include_prereleases&style=for-the-badge&logo=github&logoColor=caa7f5&label=&color=caa7f5&labelColor=101018)](https://github.com/FlibatsUniverse/Allidroid/releases/latest)
[![Build](https://img.shields.io/github/actions/workflow/status/FlibatsUniverse/Allidroid/build.yml?branch=main&style=for-the-badge&logo=githubactions&logoColor=caa7f5&label=Build&labelColor=101018)](https://github.com/FlibatsUniverse/Allidroid/actions/workflows/build.yml)
[![License](https://img.shields.io/badge/License-GPL--3.0--or--later-caa7f5?style=for-the-badge&logo=gnu&logoColor=caa7f5&labelColor=101018)](LICENSE)
[![Stars](https://img.shields.io/github/stars/FlibatsUniverse/Allidroid?style=for-the-badge&logo=github&logoColor=caa7f5&color=caa7f5&labelColor=101018)](https://github.com/FlibatsUniverse/Allidroid/stargazers)
[![Discord](https://img.shields.io/badge/Discord-Join-caa7f5?style=for-the-badge&logo=discord&logoColor=caa7f5&labelColor=101018)](https://discord.com/invite/XszKXdqaZP)

The mobile version of [Allicord](https://github.com/FlibatsUniverse/Allicord), the undisputed cutest Discord client mod.

## Installing

Use [Allidroid Manager](https://github.com/FlibatsUniverse/AllidroidManager). It downloads the latest Discord, patches it with Allidroid, and installs the result for you, with no root needed. On iOS, install the tweak from the releases page. Allidroid Manager always fetches `app-release.apk` from the [latest release](https://github.com/FlibatsUniverse/Allidroid/releases/latest) of this repository.

## Building

Allidroid is a TypeScript bundle (`bundle/`), an Android module (`app/` and `api/`) and an iOS tweak (`ios/`). See [ARCHITECTURE.md](ARCHITECTURE.md) for how they fit together.

#### Prerequisites

- [Git](https://git-scm.com/downloads)
- [JDK 17](https://learn.microsoft.com/java/openjdk/download#openjdk-17) and the [Android SDK](https://developer.android.com/studio) with platform 37, for Android
- [Bun](https://bun.sh) and Node.js, for the bundle
- macOS with [Theos](https://theos.dev), for iOS

#### Steps

1. Clone the repo
    - `git clone https://github.com/FlibatsUniverse/Allidroid.git && cd Allidroid`
2. Build the bundle
    - `cd bundle && bun install --frozen-lockfile && node scripts/build.mjs --build-minify`
3. Point Gradle at your Android SDK by creating `local.properties` with `sdk.dir=<path to your SDK>`, then build the module
    - Linux: `chmod +x ./gradlew && ./gradlew assembleDebug`
    - Windows: `./gradlew assembleDebug`
4. Build the iOS tweak on macOS
    - `cd ios && gmake package`

## Plugins and settings

Turn on official plugins from the Plugins screen, or add your own by pasting a link to a plugin folder. Backup & Restore exports your setup and imports settings from Allicord, Allidroid or any other client mod.

## Related projects

- [Allicord](https://github.com/FlibatsUniverse/Allicord) for desktop and web
- [Allidroid Manager](https://github.com/FlibatsUniverse/AllidroidManager) to install and update Allidroid

## Credits

Allidroid is made by Alliance Development, led by [Kuraa](https://github.com/ItzFlibat). See everyone who helps on the [team page](https://alliance.flibat.com/team).

## Star History

<a href="https://star-history.com/#FlibatsUniverse/Allidroid&Timeline">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=FlibatsUniverse/Allidroid&type=Timeline&theme=dark" />
    <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=FlibatsUniverse/Allidroid&type=Timeline" />
    <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=FlibatsUniverse/Allidroid&type=Timeline" />
  </picture>
</a>
