package com.scrollguard.nativebridge

import android.accessibilityservice.AccessibilityService
import android.content.Intent
import android.view.accessibility.AccessibilityEvent
import com.facebook.react.bridge.Arguments

class ScrollGuardAccessibilityService : AccessibilityService() {
  private var lastScrollEventTimeMs: Long = 0L
  private var lastForegroundPackage: String? = null

  override fun onAccessibilityEvent(event: AccessibilityEvent?) {
    val safeEvent = event ?: return
    val packageName = safeEvent.packageName?.toString() ?: return

    when (safeEvent.eventType) {
      AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED -> {
        if (lastForegroundPackage != packageName) {
          lastForegroundPackage = packageName
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

    val lockIntent = Intent(this, LockScreenActivity::class.java).apply {
      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
      putExtra("packageName", packageName)
      putExtra("lockedUntil", lockedUntil)
    }

    startActivity(lockIntent)
  }
}
