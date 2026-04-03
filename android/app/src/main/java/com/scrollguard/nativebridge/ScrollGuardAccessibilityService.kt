package com.scrollguard.nativebridge

import android.accessibilityservice.AccessibilityService
import android.content.Intent
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import com.facebook.react.bridge.Arguments
import com.scrollguard.BuildConfig

class ScrollGuardAccessibilityService : AccessibilityService() {
  companion object {
    private const val TAG = "ScrollGuardBlocker"
    private const val BLOCK_LAUNCH_COOLDOWN_MS = 600L
  }

  private var lastScrollEventTimeMs: Long = 0L
  private var lastForegroundPackage: String? = null
  private var lastBlockedPackage: String? = null
  private var lastBlockLaunchTimeMs: Long = 0L

  override fun onServiceConnected() {
    super.onServiceConnected()
    BlockingForegroundService.start(applicationContext)
    if (BuildConfig.DEBUG) {
      Log.d(TAG, "Accessibility service connected; foreground protection started")
    }
  }

  override fun onAccessibilityEvent(event: AccessibilityEvent?) {
    val safeEvent = event ?: return
    val packageName = safeEvent.packageName?.toString()?.trim().orEmpty()
    if (packageName.isEmpty()) {
      if (BuildConfig.DEBUG && safeEvent.eventType == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
        Log.d(TAG, "Ignoring foreground event with empty package name")
      }
      return
    }

    when (safeEvent.eventType) {
      AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED -> {
        if (lastForegroundPackage != packageName) {
          lastForegroundPackage = packageName
          if (BuildConfig.DEBUG) {
            Log.d(TAG, "Foreground package detected: $packageName")
          }
          emitForegroundAppChanged(packageName)
        }
        enforceBlockingIfNeeded(packageName)
      }

      AccessibilityEvent.TYPE_VIEW_SCROLLED -> {
        if (!AppPackages.MONITORED_PACKAGES.contains(packageName)) {
          return
        }

        val now = System.currentTimeMillis()
        if (now - lastScrollEventTimeMs < 1000L) {
          return
        }

        lastScrollEventTimeMs = now
        emitScrollDetected(packageName, now)
      }
    }
  }

  override fun onInterrupt() {
  }

  override fun onDestroy() {
    super.onDestroy()
    BlockingForegroundService.stop(applicationContext)
    if (BuildConfig.DEBUG) {
      Log.d(TAG, "Accessibility service destroyed; foreground protection stopped")
    }
  }

  private fun emitForegroundAppChanged(packageName: String) {
    val payload = Arguments.createMap().apply {
      putString("packageName", packageName)
    }
    ScrollDetectionModule.emitEvent("onForegroundAppChanged", payload)
  }

  private fun emitScrollDetected(packageName: String, timestampMs: Long) {
    val payload = Arguments.createMap().apply {
      putString("packageName", packageName)
      putDouble("timestamp", timestampMs.toDouble())
    }
    ScrollDetectionModule.emitEvent("onScrollDetected", payload)
  }

  private fun enforceBlockingIfNeeded(packageName: String) {
    val lockedUntil = BlockedAppsStore.getLockedUntil(applicationContext, packageName) ?: return
    val now = System.currentTimeMillis()
    if (lastBlockedPackage == packageName && now - lastBlockLaunchTimeMs < BLOCK_LAUNCH_COOLDOWN_MS) {
      return
    }

    lastBlockedPackage = packageName
    lastBlockLaunchTimeMs = now

    if (BuildConfig.DEBUG) {
      Log.d(TAG, "Blocking triggered for package=$packageName lockedUntil=$lockedUntil")
    }

    val lockIntent = Intent(this, LockScreenActivity::class.java).apply {
      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
      putExtra("packageName", packageName)
      putExtra("lockedUntil", lockedUntil)
    }

    startActivity(lockIntent)
  }
}
