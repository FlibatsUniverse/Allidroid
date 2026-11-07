package com.flibatsuniverse.allidroid.xposed.tweaks.bridge

import com.flibatsuniverse.allidroid.bridge.asDelegate
import com.flibatsuniverse.allidroid.reloadApp
import com.flibatsuniverse.allidroid.xposed.api.registerNativeMethod
import com.flibatsuniverse.allidroid.xposed.openFileGuarded
import com.flibatsuniverse.allidroid.xposed.tweak
import java.io.File

/**
 * `allidroid.fs.*` + `allidroid.app.*` bridge methods.
 */
val additionalBridgeMethods by tweak {
    registerNativeMethod("allidroid.app.reload") {
        reloadApp()
    }

    withAppContext { ctx ->
        registerNativeMethod("allidroid.fs.getConstants") {
            mapOf(
                "data" to ctx.dataDir.absolutePath,
                "files" to ctx.filesDir.absolutePath,
                "cache" to ctx.cacheDir.absolutePath,
            )
        }

        registerNativeMethod("allidroid.fs.delete") { args ->
            val argv = args.asDelegate()
            val path by argv.string()
            val f = File(path)
            if (f.isDirectory) f.deleteRecursively() else f.delete()
        }

        registerNativeMethod("allidroid.fs.exists") { args ->
            val argv = args.asDelegate()
            val path by argv.string()
            File(path).exists()
        }

        registerNativeMethod("allidroid.fs.read") { args ->
            val argv = args.asDelegate()
            val path by argv.string()
            val file = File(path).also { it.openFileGuarded() }
            file.bufferedReader().use { it.readText() }
        }

        registerNativeMethod("allidroid.fs.write") { args ->
            val argv = args.asDelegate()
            val path by argv.string()
            val contents by argv.string()
            File(path).apply {
                if (isDirectory) throw Error("Path is a directory: $path")
                parentFile?.mkdirs()
                writeText(contents)
            }

            null
        }
    }
}
