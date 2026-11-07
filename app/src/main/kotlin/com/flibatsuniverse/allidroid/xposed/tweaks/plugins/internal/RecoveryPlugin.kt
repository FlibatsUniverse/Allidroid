package com.flibatsuniverse.allidroid.xposed.tweaks.plugins.internal

import android.app.Activity
import android.app.AlertDialog
import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.view.MotionEvent
import android.widget.Toast
import com.flibatsuniverse.allidroid.plugins.API_VERSION
import com.flibatsuniverse.allidroid.plugins.PluginManifest
import com.flibatsuniverse.allidroid.plugins.PluginScope
import com.flibatsuniverse.allidroid.reloadApp
import com.flibatsuniverse.allidroid.xposed.*
import com.flibatsuniverse.allidroid.xposed.api.registerNativeMethod
import com.flibatsuniverse.allidroid.xposed.tweaks.AllidroidUpdater
import com.flibatsuniverse.allidroid.xposed.tweaks.base.withAppActivity
import com.flibatsuniverse.allidroid.xposed.tweaks.crashRecoveryTriggered
import com.flibatsuniverse.allidroid.xposed.tweaks.plugins.PluginStatesStore
import com.flibatsuniverse.allidroid.xposed.tweaks.resetCrashCount
import java.io.File

private val manifest = PluginManifest(
    id = "allidroid.recovery",
    name = "Recovery",
    description = "Handles errors and provides troubleshooting options for Allidroid.",
    author = "Allidroid",
    icon = "ShieldIcon",
    version = API_VERSION,
)

internal val recoveryPlugin =
    internalPlugin(manifest, setOf(InternalPluginFlags.INTERNAL, InternalPluginFlags.ESSENTIAL)) {
        start {
            // User stuck in Recovery mode. It is only ever intended to be one-shot.
            if (PluginStatesStore.activeSlotId == PluginStatesStore.DEFAULTS_SLOT) {
                PluginStatesStore.setActiveSlot(appInfo.dataDir, PluginStatesStore.PRIMARY_SLOT, false)
            }

            addBridgeMethods()
            recoveryHook()
        }
    }

/**
 * For the actual shake-gesture hook, you should be looking at [com.flibatsuniverse.allidroid.xposed.tweaks.discordDevSupport].
 */
fun showRecoveryAlert(context: Context) {
    AlertDialog.Builder(context)
        .setTitle("Allidroid Recovery Options")
        .setItems(
            arrayOf("Reload", "Enter Recovery Mode", "Delete Script", "Reset Loader Config"),
        ) { _, which ->
            when (which) {
                0 -> reloadApp()

                1 -> {
                    PluginStatesStore.setActiveSlot(
                        context.dataDir.absolutePath,
                        PluginStatesStore.DEFAULTS_SLOT,
                        oneShot = true,
                    )
                    reloadApp()
                }

                2 -> {
                    val bundleFile = File(
                        context.dataDir,
                        "${AllidroidConstants.CACHE_DIR}/${AllidroidConstants.MAIN_SCRIPT_FILE}",
                    )
                    if (bundleFile.exists()) bundleFile.delete()
                    reloadApp()
                }

                3 -> {
                    AllidroidUpdater.resetLoaderConfig()
                    reloadApp()
                }
            }
        }
        .show()
}

fun PluginScope.addBridgeMethods() {
    withAppActivity { act ->
        registerNativeMethod("allidroid.showRecoveryAlert") {
            showRecoveryAlert(act)
            null
        }

        registerNativeMethod("allidroid.alertError") {
            val (error, version) = it
            val errorString = "$error"

            val clipboard = act.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
            val clip = ClipData.newPlainText("Stack Trace", errorString)

            AlertDialog.Builder(act)
                .setTitle("Allidroid Error")
                .setMessage(
                    """
                        Allidroid: $version
                        Discord: ${act.versionName()} (${act.versionCode()})
                        Device: ${Build.MANUFACTURER} ${Build.MODEL}
                        
                        
                    """.trimIndent() + errorString
                )
                .setPositiveButton(android.R.string.ok) { dialog, _ -> dialog.dismiss() }
                .setNeutralButton(android.R.string.copy) { dialog, _ ->
                    @Suppress("UsePropertyAccessSyntax")
                    clipboard.setPrimaryClip(clip)
                    Toast.makeText(act, "Copied stack trace", Toast.LENGTH_SHORT).show()
                    dialog.dismiss()
                }
                .setNegativeButton("Recovery") { dialog, _ ->
                    showRecoveryAlert(act)
                    dialog.dismiss()
                }
                .show()

            null
        }
    }
}

fun recoveryHook() {
    var holdRunnable: Runnable? = null
    val handler = Handler(Looper.getMainLooper())

    withAppActivity {
        if (crashRecoveryTriggered) {
            AlertDialog.Builder(it)
                .setTitle("Booted in Recovery Mode")
                .setMessage("Allidroid detected consecutive crashes and has booted into Recovery Mode.")
                .setPositiveButton(android.R.string.ok) { d, _ -> d.dismiss() }
                .setNeutralButton("Exit Recovery Mode") { _, _ -> reloadApp() }
                .show()
        }

        val hook = Activity::class.java.method("dispatchTouchEvent", MotionEvent::class.java).hook {
            before {
                val event = param.args[0] as MotionEvent
                val activity = param.thisObject as Activity

                if (event.pointerCount == 2) {
                    when (event.actionMasked) {
                        // 3s hold timer when 2nd finger touches screen
                        MotionEvent.ACTION_POINTER_DOWN -> {
                            handler.postDelayed({
                                Toast.makeText(
                                    activity,
                                    "Keep holding to trigger Recovery Options...",
                                    Toast.LENGTH_SHORT
                                )
                                    .show()
                            }, 1500)

                            holdRunnable = { showRecoveryAlert(activity) }
                            handler.postDelayed(holdRunnable, 3000)
                        }

                        // Lifted finger early
                        MotionEvent.ACTION_POINTER_UP, MotionEvent.ACTION_CANCEL -> {
                            holdRunnable?.let { handler.removeCallbacks(it) }
                        }
                    }
                }
            }
        }

        // Stop listening after 3s
        handler.postDelayed({
            hook.unhook()

            // Give users up to 2 extra seconds (5 - 3) to press the dialog options
            handler.postDelayed({
                resetCrashCount()
            }, 5000)
        }, 3000)

        // Intentional exit, so we clear the crash count
        Activity::class.java.method("onDestroy").hook {
            before {
                val activity = param.thisObject as Activity
                if (activity.isFinishing) resetCrashCount()
            }
        }
    }
}
