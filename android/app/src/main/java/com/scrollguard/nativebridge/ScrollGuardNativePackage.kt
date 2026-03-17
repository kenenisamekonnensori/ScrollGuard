package com.scrollguard.nativebridge

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider
import com.facebook.react.module.annotations.ReactModuleList
import java.util.HashMap

@ReactModuleList(
  nativeModules = [
    AppUsageModule::class,
    ScrollDetectionModule::class,
    AppBlockingModule::class,
  ],
)
class ScrollGuardNativePackage : BaseReactPackage() {
  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? {
    return when (name) {
      AppUsageModule.NAME -> AppUsageModule(reactContext)
      ScrollDetectionModule.NAME -> ScrollDetectionModule(reactContext)
      AppBlockingModule.NAME -> AppBlockingModule(reactContext)
      else -> null
    }
  }

  override fun getReactModuleInfoProvider(): ReactModuleInfoProvider {
    return ReactModuleInfoProvider {
      val moduleInfos = HashMap<String, ReactModuleInfo>()

      moduleInfos[AppUsageModule.NAME] = ReactModuleInfo(
        AppUsageModule.NAME,
        AppUsageModule::class.java.name,
        false,
        false,
        false,
        false,
      )

      moduleInfos[ScrollDetectionModule.NAME] = ReactModuleInfo(
        ScrollDetectionModule.NAME,
        ScrollDetectionModule::class.java.name,
        false,
        false,
        false,
        false,
      )

      moduleInfos[AppBlockingModule.NAME] = ReactModuleInfo(
        AppBlockingModule.NAME,
        AppBlockingModule::class.java.name,
        false,
        false,
        false,
        false,
      )

      moduleInfos
    }
  }
}
