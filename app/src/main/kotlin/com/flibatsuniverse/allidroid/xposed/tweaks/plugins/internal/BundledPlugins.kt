package com.flibatsuniverse.allidroid.xposed.tweaks.plugins.internal

import com.flibatsuniverse.allidroid.logger
import com.flibatsuniverse.allidroid.plugins.PluginDependency
import com.flibatsuniverse.allidroid.plugins.PluginManifest
import com.flibatsuniverse.allidroid.plugins.Version
import com.flibatsuniverse.allidroid.plugins.VersionRange
import com.flibatsuniverse.allidroid.xposed.tweaks.BundleManifest
import com.flibatsuniverse.allidroid.xposed.tweaks.plugins.PluginFactory
import com.flibatsuniverse.allidroid.xposed.tweaks.plugins.external.requireValidPluginId

private val log = logger("bundledPlugins")


/**
 * Handles registration of internal JS-only (bundled) plugins. Registering them here makes the dependency graph complete.
 *
 * Native discovers external plugins and handles dependency resolution before JS starts, so without this,
 * it cannot tell an ID belonging to a bundled plugin from one that does not exist, which causes it to drop any
 * external plugin that depends on one.
 */
internal fun bundledPlugins(bundleManifest: BundleManifest): List<PluginFactory> {
    val bundleVersion = Version.parse(bundleManifest.version)

    return bundleManifest.plugins.mapNotNull { entry ->
        runCatching {
            val manifest = entry.toPluginManifest(bundleVersion)
            val flags = entry.internalFlags()

            if (entry.defaultSource != null) {
                stubPlugin(
                    manifest,
                    entry.defaultSource,
                    flags,
                ) {}
            } else {
                internalPlugin(manifest, flags) {}
            }
        }
            .onFailure { log.e("Skipping bundled plugin '${entry.id}'", it) }
            .getOrNull()
    }
}

private fun BundleManifest.Plugin.internalFlags() = buildSet {
    add(InternalPluginFlags.INTERNAL)
    if (essential) add(InternalPluginFlags.ESSENTIAL)
    if (enabledByDefault) add(InternalPluginFlags.ENABLED_BY_DEFAULT)
}

private fun BundleManifest.Plugin.toPluginManifest(bundleVersion: Version): PluginManifest {
    requireValidPluginId(id)
    require(version == null || defaultSource != null) { "Only stubs can override the bundle version" }

    return PluginManifest(
        id = id,
        name = name ?: id,
        description = description.orEmpty(),
        author = author.orEmpty(),
        contributors = contributors,
        icon = icon,
        dependencies = dependencies.entries.associate { (depId, dep) ->
            requireValidPluginId(depId)
            depId to PluginDependency(
                version = dep.version?.let(VersionRange::parse) ?: VersionRange.ANY,
                optional = dep.optional,
            )
        },
        version = version?.let(Version::parse) ?: bundleVersion,
    )
}