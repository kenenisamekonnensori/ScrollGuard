package com.scrollguard

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.react.defaults.DefaultReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative

class MainApplication : Application(), ReactApplication {

  private val mReactNativeHost: ReactNativeHost =
    object : DefaultReactNativeHost(this) {

      override fun getUseDeveloperSupport(): Boolean {
        return BuildConfig.DEBUG
      }

      override fun getPackages(): List<ReactPackage> {
        return PackageList(this).packages
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
