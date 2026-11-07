package com.flibatsuniverse.allidroid.xposed

object AllidroidConstants {
    const val TARGET_PACKAGE = "com.discord"

    // @TODO: Migration to allidroid named dir
    const val FILES_DIR = "files/allidroid"
    const val CACHE_DIR = "cache/allidroid"
    const val MAIN_SCRIPT_FILE = "bundle.js"
    const val BUNDLE_MANIFEST_FILE = "manifest.json"
    const val PRELOADS_DIR = "preloads"

    const val LOADER_NAME = "Allidroid"
    val LOADER_VERSION
        get() = BuildConfig.VERSION_NAME
    val USER_AGENT
        get() = "Allidroid/$LOADER_VERSION"

    /**
     * Fallback Hermes bundle shipped inside this APK's `assets/` directory.
     * Loaded by [com.flibatsuniverse.allidroid.xposed.tweaks.allidroidScriptLoader] when the cached `bundle.js` isn't available.
     */
    const val FALLBACK_BUNDLE_ASSET = "assets://allidroid.bundle"
}

/**
 * Hermes bytecode assets shipped inside the Xposed module APK.
 */
val scriptAssets = emptyList<String>()
