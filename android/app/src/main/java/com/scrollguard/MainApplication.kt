@file:Suppress("DEPRECATION")

package com.scrollguard

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.react.defaults.DefaultReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.scrollguard.nativebridge.ScrollGuardNativePackage

class MainApplication : Application(), ReactApplication {

  @Deprecated("Current React Native host setup still relies on ReactNativeHost")
  private val mReactNativeHost =
    object : DefaultReactNativeHost(this) {

      override fun getUseDeveloperSupport(): Boolean {
        return BuildConfig.DEBUG
      }

      override fun getPackages() =
        PackageList(this).packages.apply {
          add(ScrollGuardNativePackage())
        }

      override fun getJSMainModuleName(): String {
        return "index"
      }
    }

  override val reactHost: ReactHost
    get() = DefaultReactHost.getDefaultReactHost(this, mReactNativeHost)

  override fun onCreate() {
    super.onCreate()
    loadReactNative(this)
  }
}
