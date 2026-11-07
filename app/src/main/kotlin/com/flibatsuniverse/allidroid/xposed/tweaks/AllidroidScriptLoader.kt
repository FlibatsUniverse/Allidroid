package com.flibatsuniverse.allidroid.xposed.tweaks

import com.flibatsuniverse.allidroid.xposed.AllidroidConstants
import com.flibatsuniverse.allidroid.xposed.ensureDir
import com.flibatsuniverse.allidroid.xposed.ensureFile
import com.flibatsuniverse.allidroid.xposed.tweak
import com.flibatsuniverse.allidroid.xposed.tweaks.base.InjectorScope
import com.flibatsuniverse.allidroid.xposed.tweaks.base.registerScriptInjector
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withTimeout
import java.io.File

/**
 * Waits for script updates and loads the Allidroid bundle. Depends on [com.flibatsuniverse.allidroid.xposed.tweaks.base.scriptLoader].
 *
 * 1. Awaits the bundle download from [allidroidUpdater].
 * 2. Runs every file under `files/allidroid/preloads/`.
 * 3. Loads `cache/allidroid/bundle.js` (downloaded copy) if present.
 * 4. Falls back to the in-APK `assets://allidroid.bundle` asset shipped with this module.
 */
val allidroidScriptLoader by tweak {
    val dataDir = appInfo.dataDir
    val filesDir = File(dataDir, AllidroidConstants.FILES_DIR).apply { ensureDir() }
    val cacheDir = File(dataDir, AllidroidConstants.CACHE_DIR).apply { ensureDir() }
    val preloadsDir = File(filesDir, AllidroidConstants.PRELOADS_DIR).apply { ensureDir() }
    val mainScript = File(cacheDir, AllidroidConstants.MAIN_SCRIPT_FILE).apply { ensureFile() }

    registerScriptInjector { scope: InjectorScope ->
        runAllidroidScripts(scope, preloadsDir, mainScript)
    }
}

private fun runAllidroidScripts(scope: InjectorScope, preloadsDir: File, mainScript: File) {
    val log = scope.tweakLog
    log.i("Running Allidroid custom scripts...")

    runBlocking {
        try {
            withTimeout(AllidroidUpdater.TIMEOUT) { AllidroidUpdater.downloadReady.await() }
        } catch (e: Throwable) {
            log.w("Bundle download did not complete", e)
        }
    }

    try {
        preloadsDir.walk().filter { it.isFile }.sorted().forEach { f ->
            log.d("Running preload: ${f.absolutePath}")
            scope.runFile(f.absolutePath)
        }

        if (mainScript.exists()) {
            log.i("Loading downloaded bundle: ${mainScript.absolutePath}")
            scope.runFile(mainScript.absolutePath)
        } else {
            log.i("Downloaded bundle missing; falling back to ${AllidroidConstants.FALLBACK_BUNDLE_ASSET}")
            scope.runAsset(AllidroidConstants.FALLBACK_BUNDLE_ASSET)
        }
    } catch (e: Throwable) {
        log.e("Unable to run Allidroid scripts", e)
    }
}

