package com.scrollguard.nativebridge

import android.content.ComponentName
import android.provider.Settings
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule

class ScrollDetectionModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  companion object {
    const val NAME = "ScrollDetectionModule"
    private var currentContext: ReactApplicationContext? = null

    fun emitEvent(eventName: String, params: Any?) {
      val context = currentContext ?: return
      context
        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
        .emit(eventName, params)
    }
  }

  init {
    currentContext = reactContext
  }

  override fun getName(): String = NAME

  @ReactMethod
  fun startScrollDetection() {
    BlockingForegroundService.start(reactContext)
  }

  @ReactMethod
  fun stopScrollDetection() {
    BlockingForegroundService.stop(reactContext)
  }

  @ReactMethod
  fun startForegroundProtectionService() {
    BlockingForegroundService.start(reactContext)
  }

  @ReactMethod
  fun stopForegroundProtectionService() {
    BlockingForegroundService.stop(reactContext)
  }

  @ReactMethod
  fun isAccessibilityServiceEnabled(promise: Promise) {
    try {
      val accessibilityEnabled = Settings.Secure.getInt(
        reactContext.contentResolver,
        Settings.Secure.ACCESSIBILITY_ENABLED,
        0,
      ) == 1

      if (!accessibilityEnabled) {
        promise.resolve(false)
        return
      }

      val enabledServices = Settings.Secure.getString(
        reactContext.contentResolver,
        Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES,
      ) ?: ""

      val componentName = ComponentName(reactContext, ScrollGuardAccessibilityService::class.java)
      val expectedFullName = componentName.flattenToString()
      val expectedShortName = componentName.flattenToShortString()

      val isEnabled = enabledServices
        .split(':')
        .map { it.trim() }
        .any { serviceEntry ->
          serviceEntry.equals(expectedFullName, ignoreCase = true)
            || serviceEntry.equals(expectedShortName, ignoreCase = true)
            || serviceEntry.endsWith("/${ScrollGuardAccessibilityService::class.java.simpleName}", ignoreCase = true)
        }

      promise.resolve(isEnabled)
    } catch (error: Exception) {
      promise.reject("E_ACCESSIBILITY_STATUS", error.message, error)
    }
  }
}
