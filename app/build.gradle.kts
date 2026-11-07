plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.serialization)
}

kotlin {
    jvmToolchain(libs.versions.javaVersion.get().toInt())
}

android {
    namespace = "com.flibatsuniverse.allidroid.xposed"
    compileSdk = libs.versions.compileSdk.get().toInt()

    defaultConfig {
        applicationId = "com.flibatsuniverse.allidroid.xposed"
        minSdk = libs.versions.minSdk.get().toInt()
        targetSdk = libs.versions.targetSdk.get().toInt()
        versionCode = 1
        versionName = "1.0.0"

        // Pass -PbundleUrl=... to build a copy that loads its bundle from a development server.
        val bundleUrl = providers.gradleProperty("bundleUrl")
            .getOrElse("https://github.com/FlibatsUniverse/Allidroid/releases/latest/download/allidroid.min.js")
        buildConfigField("String", "BUNDLE_URL", "\"$bundleUrl\"")
    }

    sourceSets {
        named("main") {
            kotlin.directories += "src/main/kotlin"
        }
    }

    // Release signing is provided by CI through the environment. Without it, release builds are unsigned.
    val keystoreFile = providers.environmentVariable("KEYSTORE_FILE").orNull?.takeIf { it.isNotBlank() }
    if (keystoreFile != null) {
        signingConfigs {
            create("release") {
                storeFile = file(keystoreFile)
                storePassword = providers.environmentVariable("KEYSTORE_PASSWORD").get()
                keyAlias = providers.environmentVariable("KEY_ALIAS").get()
                keyPassword = providers.environmentVariable("KEY_PASSWORD").get()
            }
        }
    }

    buildTypes {
        debug {
            isDebuggable = true
            isMinifyEnabled = false
        }
        release {
            isDebuggable = false
            isMinifyEnabled = false
            signingConfig = signingConfigs.findByName("release")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.toVersion(libs.versions.javaVersion.get())
        targetCompatibility = JavaVersion.toVersion(libs.versions.javaVersion.get())
    }

    buildFeatures {
        buildConfig = true
    }

    testOptions {
        // Logger wraps android.util.Log; return default values so unit tests can run.
        unitTests.isReturnDefaultValues = true
    }
}

dependencies {
    compileOnly(libs.xposed.api)

    implementation(project(":api"))

    implementation(libs.androidx.core.ktx)
    implementation(libs.kotlinx.serialization.json)
    implementation(libs.kotlinx.coroutines.android)
    implementation(libs.ktor.client.core)
    implementation(libs.ktor.client.okhttp)

    testImplementation(libs.kotlin.test)
}
