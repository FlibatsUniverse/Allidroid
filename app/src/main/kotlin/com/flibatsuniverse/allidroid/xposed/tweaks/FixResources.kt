package com.flibatsuniverse.allidroid.xposed.tweaks

import android.content.res.Resources
import com.flibatsuniverse.allidroid.xposed.AllidroidConstants
import com.flibatsuniverse.allidroid.xposed.hook
import com.flibatsuniverse.allidroid.xposed.method
import com.flibatsuniverse.allidroid.xposed.tweak

/**
 * Hooks [Resources.getIdentifier] to rewrite the package name to `com.discord` when the host app was repackaged.
 */
val fixResources by tweak {
    val hostPkg = appInfo.packageName
    if (hostPkg == AllidroidConstants.TARGET_PACKAGE) return@tweak

    Resources::class.java.method(
        "getIdentifier",
        String::class.java,
        String::class.java,
        String::class.java,
    ).hook {
        before {
            if (args[2] == hostPkg) args[2] = AllidroidConstants.TARGET_PACKAGE
        }
    }
}
