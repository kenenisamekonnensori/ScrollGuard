package com.scrollguard.nativebridge

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
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
  }

  @ReactMethod
  fun stopScrollDetection() {
  }
}
