package com.scrollguard.nativebridge

import android.accessibilityservice.AccessibilityService
import android.content.Intent
import android.graphics.Color
import android.graphics.PixelFormat
import android.util.Log
import android.view.Gravity
import android.view.View
import android.view.accessibility.AccessibilityEvent
import android.view.WindowManager
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TextView
import com.facebook.react.bridge.Arguments
import com.scrollguard.BuildConfig

class ScrollGuardAccessibilityService : AccessibilityService() {
  companion object {
    private const val TAG = "ScrollGuardBlocker"
    private const val BLOCK_LAUNCH_COOLDOWN_MS = 150L
  }

  private var lastScrollEventTimeMs: Long = 0L
  private var lastForegroundPackage: String? = null
  private var lastBlockedPackage: String? = null
  private var lastBlockLaunchTimeMs: Long = 0L
  private var blockingOverlayView: View? = null

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

        val blocked = enforceBlockingIfNeeded(packageName)
        if (!blocked) {
          hideBlockingOverlay()
        }
      }

      AccessibilityEvent.TYPE_WINDOWS_CHANGED -> {
        val blocked = enforceBlockingIfNeeded(packageName)
        if (!blocked) {
          hideBlockingOverlay()
        }
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
    hideBlockingOverlay()
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

  private fun enforceBlockingIfNeeded(packageName: String): Boolean {
    val lockedUntil = BlockedAppsStore.getLockedUntil(applicationContext, packageName) ?: return false
    val now = System.currentTimeMillis()
    if (lastBlockedPackage == packageName && now - lastBlockLaunchTimeMs < BLOCK_LAUNCH_COOLDOWN_MS) {
      showBlockingOverlay(packageName)
      return true
    }

    lastBlockedPackage = packageName
    lastBlockLaunchTimeMs = now

    if (BuildConfig.DEBUG) {
      Log.d(TAG, "Blocking triggered for package=$packageName lockedUntil=$lockedUntil")
    }

    BlockingForegroundService.start(applicationContext)
    showBlockingOverlay(packageName)

    val lockIntent = Intent(this, LockScreenActivity::class.java).apply {
      addFlags(
        Intent.FLAG_ACTIVITY_NEW_TASK
          or Intent.FLAG_ACTIVITY_SINGLE_TOP
          or Intent.FLAG_ACTIVITY_CLEAR_TOP
          or Intent.FLAG_ACTIVITY_REORDER_TO_FRONT
          or Intent.FLAG_ACTIVITY_EXCLUDE_FROM_RECENTS
          or Intent.FLAG_ACTIVITY_NO_ANIMATION,
      )
      putExtra("packageName", packageName)
      putExtra("lockedUntil", lockedUntil)
    }

    try {
      startActivity(lockIntent)
      if (BuildConfig.DEBUG) {
        Log.d(TAG, "Blocking screen launched for package=$packageName")
      }
    } catch (error: Exception) {
      if (BuildConfig.DEBUG) {
        Log.e(TAG, "Failed to launch blocking activity for package=$packageName", error)
      }
    }

    return true
  }

  private fun showBlockingOverlay(packageName: String) {
    if (blockingOverlayView != null) {
      val messageText = blockingOverlayView
        ?.findViewWithTag<TextView>("blocking_message")
      messageText?.text = "$packageName is blocked due to your limit."
      return
    }

    val windowManager = getSystemService(WINDOW_SERVICE) as WindowManager

    val root = FrameLayout(this).apply {
      setBackgroundColor(Color.parseColor("#EE0B1330"))
      isClickable = true
      isFocusable = true
      importantForAccessibility = View.IMPORTANT_FOR_ACCESSIBILITY_YES
    }

    val content = LinearLayout(this).apply {
      orientation = LinearLayout.VERTICAL
      gravity = Gravity.CENTER
      setPadding(48, 48, 48, 48)
    }

    val title = TextView(this).apply {
      text = "App Locked"
      textSize = 28f
      setTextColor(Color.WHITE)
      gravity = Gravity.CENTER
    }

    val message = TextView(this).apply {
      text = "$packageName is blocked due to your limit."
      textSize = 18f
      setTextColor(Color.WHITE)
      gravity = Gravity.CENTER
      setPadding(0, 24, 0, 0)
      tag = "blocking_message"
    }

    content.addView(title)
    content.addView(message)
    root.addView(content)

    val params = WindowManager.LayoutParams(
      WindowManager.LayoutParams.MATCH_PARENT,
      WindowManager.LayoutParams.MATCH_PARENT,
      WindowManager.LayoutParams.TYPE_ACCESSIBILITY_OVERLAY,
      WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN
        or WindowManager.LayoutParams.FLAG_FULLSCREEN,
      PixelFormat.TRANSLUCENT,
    ).apply {
      gravity = Gravity.CENTER
    }

    try {
      windowManager.addView(root, params)
      blockingOverlayView = root
      if (BuildConfig.DEBUG) {
        Log.d(TAG, "Blocking overlay shown for package=$packageName")
      }
    } catch (error: Exception) {
      if (BuildConfig.DEBUG) {
        Log.e(TAG, "Failed to show blocking overlay for package=$packageName", error)
      }
    }
  }

  private fun hideBlockingOverlay() {
    val existing = blockingOverlayView ?: return
    val windowManager = getSystemService(WINDOW_SERVICE) as WindowManager
    try {
      windowManager.removeView(existing)
      if (BuildConfig.DEBUG) {
        Log.d(TAG, "Blocking overlay hidden")
      }
    } catch (_: Exception) {
    } finally {
      blockingOverlayView = null
    }
  }
}
