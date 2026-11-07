package com.flibatsuniverse.allidroid.xposed.tweaks.plugins.internal

import com.flibatsuniverse.allidroid.plugins.API_VERSION
import com.flibatsuniverse.allidroid.plugins.PluginManifest
import com.flibatsuniverse.allidroid.xposed.api.registerNativeMethod

private val manifest = PluginManifest(
    id = "allidroid.example",
    name = "Example Plugin",
    description = "Example plugin.",
    author = "Allidroid",
    version = API_VERSION,
)

internal val examplePlugin =
    internalPlugin(manifest, setOf(InternalPluginFlags.INTERNAL, InternalPluginFlags.ESSENTIAL)) {
        start {
            log.i("started in ${appInfo.packageName}")
            registerNativeMethod("allidroid.example.test") { args ->
                log.i("allidroid.example.test($args)")
                null
            }

            registerNativeMethod("allidroid.example.test.error") {
                errors.tryEmit(Exception("Test exception!"))
            }
        }
    }