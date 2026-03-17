package com.scrollguard.nativebridge

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class AppBlockingModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  companion object {
    const val NAME = "AppBlockingModule"
  }

  override fun getName(): String = NAME

  @ReactMethod
  fun blockApp(packageName: String, durationMinutes: Int, promise: Promise) {
    try {
      BlockedAppsStore.blockApp(reactContext, packageName, durationMinutes)
      promise.resolve(null)
    } catch (error: Exception) {
      promise.reject("E_BLOCK_APP", error.message, error)
    }
  }

  @ReactMethod
  fun unblockApp(packageName: String, promise: Promise) {
    try {
      BlockedAppsStore.unblockApp(reactContext, packageName)
      promise.resolve(null)
    } catch (error: Exception) {
      promise.reject("E_UNBLOCK_APP", error.message, error)
    }
  }

  @ReactMethod
  fun isAppBlocked(packageName: String, promise: Promise) {
    try {
      promise.resolve(BlockedAppsStore.isBlocked(reactContext, packageName))
    } catch (error: Exception) {
      promise.reject("E_IS_BLOCKED", error.message, error)
    }
  }
}
