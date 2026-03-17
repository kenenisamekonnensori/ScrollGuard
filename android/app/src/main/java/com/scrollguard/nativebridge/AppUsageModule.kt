package com.scrollguard.nativebridge

import android.app.AppOpsManager
import android.app.usage.UsageStatsManager
import android.content.Context
import android.os.Process
import androidx.core.app.NotificationManagerCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.util.Calendar

class AppUsageModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  companion object {
    const val NAME = "AppUsageModule"
  }

  override fun getName(): String = NAME

  @ReactMethod
  fun getUsageStats(promise: Promise) {
    if (!hasUsageAccessPermission()) {
      promise.reject("E_PERMISSION", "Usage access permission not granted")
      return
    }

    try {
      val usageStatsManager =
        reactContext.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
      val now = System.currentTimeMillis()
      val calendar = Calendar.getInstance().apply {
        set(Calendar.HOUR_OF_DAY, 0)
        set(Calendar.MINUTE, 0)
        set(Calendar.SECOND, 0)
        set(Calendar.MILLISECOND, 0)
      }
      val startOfDay = calendar.timeInMillis
      val stats = usageStatsManager.queryUsageStats(
        UsageStatsManager.INTERVAL_DAILY,
        startOfDay,
        now,
      )

      val result = Arguments.createMap()
      AppPackages.MONITORED_PACKAGES.forEach { monitoredPackage ->
        result.putDouble(monitoredPackage, 0.0)
      }

      stats?.forEach { usageStat ->
        val packageName = usageStat.packageName ?: return@forEach
        if (!AppPackages.MONITORED_PACKAGES.contains(packageName)) {
          return@forEach
        }

        val existingSeconds = if (result.hasKey(packageName)) {
          result.getDouble(packageName)
        } else {
          0.0
        }

        val additionalSeconds = usageStat.totalTimeInForeground.toDouble() / 1000.0
        result.putDouble(packageName, existingSeconds + additionalSeconds)
      }

      promise.resolve(result)
    } catch (error: Exception) {
      promise.reject("E_USAGE_STATS", error.message, error)
    }
  }

  @ReactMethod
  fun hasUsageAccessPermission(promise: Promise) {
    try {
      promise.resolve(hasUsageAccessPermission())
    } catch (error: Exception) {
      promise.reject("E_PERMISSION_STATUS", error.message, error)
    }
  }

  @ReactMethod
  fun areNotificationsEnabled(promise: Promise) {
    try {
      val enabled = NotificationManagerCompat.from(reactContext).areNotificationsEnabled()
      promise.resolve(enabled)
    } catch (error: Exception) {
      promise.reject("E_NOTIFICATION_STATUS", error.message, error)
    }
  }

  private fun hasUsageAccessPermission(): Boolean {
    val appOpsManager =
      reactContext.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
    val mode = appOpsManager.checkOpNoThrow(
      AppOpsManager.OPSTR_GET_USAGE_STATS,
      Process.myUid(),
      reactContext.packageName,
    )
    return mode == AppOpsManager.MODE_ALLOWED
  }
}
