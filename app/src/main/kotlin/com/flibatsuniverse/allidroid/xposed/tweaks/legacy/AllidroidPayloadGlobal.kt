@file:Suppress("DEPRECATION")

package com.flibatsuniverse.allidroid.xposed.tweaks.legacy

import de.robv.android.xposed.XC_MethodHook
import de.robv.android.xposed.XposedBridge
import com.flibatsuniverse.allidroid.Logger
import com.flibatsuniverse.allidroid.xposed.*
import com.flibatsuniverse.allidroid.xposed.tweaks.base.registerScriptInjector
import kotlinx.serialization.json.JsonObjectBuilder
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import java.io.File

@Deprecated(
    "Payloads will be replaced by synchronous Allidroid bridge methods.",
    level = DeprecationLevel.WARNING,
)
object AllidroidPayloadBuilder {
    private val contributors: MutableList<JsonObjectBuilder.() -> Unit> = mutableListOf()

    fun contribute(block: JsonObjectBuilder.() -> Unit) {
        contributors += block
    }

    internal fun build(): String = AllidroidJson.encodeToString(
        buildJsonObject {
            put("loaderName", AllidroidConstants.LOADER_NAME)
            put("loaderVersion", AllidroidConstants.LOADER_VERSION)
            for (c in contributors) c()
        },
    )
}

internal const val FIELD_NAME = "__ALLIDROID_LOADER__"

/**
 * Sets the `__ALLIDROID_LOADER__` JS global before the bundle runs.
 */
@Deprecated(
    "Payloads will be replaced by synchronous Allidroid bridge methods.",
    level = DeprecationLevel.WARNING,
)
val allidroidPayloadGlobal by tweak {
    val log: Logger = this.log
    val dataDir = appInfo.dataDir

    registerScriptInjector { scope ->
        val json = AllidroidPayloadBuilder.build()

        val preloadsDir = File("$dataDir/${AllidroidConstants.FILES_DIR}", AllidroidConstants.PRELOADS_DIR)
        if (!preloadsDir.isDirectory) {
            preloadsDir.delete()
            preloadsDir.mkdirs()
        }

        File(preloadsDir, "rv_globals_$FIELD_NAME.js").apply {
            writeText("this[${JsonPrimitive(FIELD_NAME)}]=$json")
            try {
                scope.runFile(absolutePath)
            } catch (e: Throwable) {
                log.e("rv_globals_$FIELD_NAME.js preload injection failed", e)
            } finally {
                delete()
            }
        }
    }
}
