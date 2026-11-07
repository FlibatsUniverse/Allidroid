package com.flibatsuniverse.allidroid.xposed

import android.app.Activity
import android.content.Context
import android.content.pm.ApplicationInfo
import de.robv.android.xposed.IXposedHookLoadPackage
import de.robv.android.xposed.IXposedHookZygoteInit
import de.robv.android.xposed.callbacks.XC_LoadPackage
import com.flibatsuniverse.allidroid.bridge.AllidroidBridge
import com.flibatsuniverse.allidroid.xposed.api.HostScope
import com.flibatsuniverse.allidroid.xposed.tweaks.*
import com.flibatsuniverse.allidroid.xposed.tweaks.base.lifecycleSupport
import com.flibatsuniverse.allidroid.xposed.tweaks.base.scriptLoader
import com.flibatsuniverse.allidroid.xposed.tweaks.bridge.AllidroidBridgeRegistry
import com.flibatsuniverse.allidroid.xposed.tweaks.bridge.additionalBridgeMethods
import com.flibatsuniverse.allidroid.xposed.tweaks.bridge.allidroidBridgeSupport
import com.flibatsuniverse.allidroid.xposed.tweaks.legacy.appearance.fonts
import com.flibatsuniverse.allidroid.xposed.tweaks.legacy.appearance.sysColors
import com.flibatsuniverse.allidroid.xposed.tweaks.legacy.appearance.themes
import com.flibatsuniverse.allidroid.xposed.tweaks.legacy.allidroidPayloadGlobal
import com.flibatsuniverse.allidroid.xposed.tweaks.plugins.pluginInstallMethods
import com.flibatsuniverse.allidroid.xposed.tweaks.plugins.pluginLoader
import com.flibatsuniverse.allidroid.xposed.tweaks.plugins.pluginMethods
import com.flibatsuniverse.allidroid.xposed.tweaks.plugins.pluginStates
import com.flibatsuniverse.allidroid.xposed.tweaks.plugins.repos.pluginRepos

private lateinit var modulePath: String

@Suppress("UNUSED")
class Main : IXposedHookLoadPackage, IXposedHookZygoteInit {
    @Volatile
    private var hooked = false

    private val tweaks: List<TweakSpec> = listOf(
        // Framework
        lifecycleSupport,
        allidroidBridgeSupport,
        scriptLoader,
        discordVersionRetriever,

        // Static patches
        fixResources,

        // Persistence
        caches,
        pluginStates,
        pluginRepos,

        // Async updater
        allidroidUpdater,
        allidroidBundleManifest,

        // Consumers
        recoveryCompanion,
        discordDevSupport,
        additionalBridgeMethods,
        fonts,
        themes,
        sysColors,
        pluginLoader,
        pluginMethods,
        pluginInstallMethods,
        allidroidScriptLoader,
        allidroidPayloadGlobal,
    )

    override fun initZygote(startupParam: IXposedHookZygoteInit.StartupParam) {
        modulePath = startupParam.modulePath
    }

    override fun handleLoadPackage(param: XC_LoadPackage.LoadPackageParam) {
        // Only hook the main process.
        // Discord uses ProcessPhoenix to spawn a ":phoenix" process to restart the app. It will cause concurrency issues.
        if (param.processName != param.packageName) return

        if (hooked) return
        hooked = true

        val ctx = HostScopeImpl(
            modulePath = modulePath,
            appInfo = param.appInfo,
            classLoader = param.classLoader,
        )
        DexFinder.init(param.appInfo, param.classLoader, modulePath)
        for (spec in tweaks) spec.applyTo(ctx)
        DexFinder.release()
    }
}

private class HostScopeImpl(
    override val modulePath: String,
    override val appInfo: ApplicationInfo,
    override val classLoader: ClassLoader,
) : HostScope {
    override val bridge: AllidroidBridge get() = AllidroidBridgeRegistry
    override val dexFinder: DexFinder get() = DexFinder
    override fun withAppContext(block: (Context) -> Unit) = com.flibatsuniverse.allidroid.xposed.tweaks.base.withAppContext(block)
    override fun withAppActivity(block: (Activity) -> Unit) =
        com.flibatsuniverse.allidroid.xposed.tweaks.base.withAppActivity(block)
}