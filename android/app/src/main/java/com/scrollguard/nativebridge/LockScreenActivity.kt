package com.scrollguard.nativebridge

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.view.Gravity
import android.widget.LinearLayout
import android.widget.TextView
import com.scrollguard.BuildConfig

class LockScreenActivity : Activity() {
  companion object {
    private const val TAG = "ScrollGuardBlocker"
  }

  private lateinit var messageView: TextView
  private var blockedPackageName: String = "This app"

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    applyIntentData(intent)

    val root = LinearLayout(this).apply {
      orientation = LinearLayout.VERTICAL
      gravity = Gravity.CENTER
      setPadding(48, 48, 48, 48)
    }

    val title = TextView(this).apply {
      text = "App Locked"
      textSize = 28f
      gravity = Gravity.CENTER
    }

    messageView = TextView(this).apply {
      text = "$blockedPackageName is currently blocked due to your limit."
      textSize = 18f
      gravity = Gravity.CENTER
      setPadding(0, 24, 0, 0)
    }

    root.addView(title)
    root.addView(messageView)
    setContentView(root)

    if (BuildConfig.DEBUG) {
      Log.d(TAG, "LockScreenActivity created for package=$blockedPackageName")
    }
  }

  override fun onNewIntent(intent: Intent?) {
    super.onNewIntent(intent)
    if (intent != null) {
      setIntent(intent)
      applyIntentData(intent)
      messageView.text = "$blockedPackageName is currently blocked due to your limit."

      if (BuildConfig.DEBUG) {
        Log.d(TAG, "LockScreenActivity updated for package=$blockedPackageName")
      }
    }
  }

  @Deprecated("Deprecated in Activity")
  @Suppress("DEPRECATION")
  override fun onBackPressed() {
    if (BuildConfig.DEBUG) {
      Log.d(TAG, "Back pressed on lock screen; redirecting user to home")
    }
    redirectToHomeAndFinish()
  }

  override fun onUserLeaveHint() {
    super.onUserLeaveHint()
    if (BuildConfig.DEBUG) {
      Log.d(TAG, "User attempted to leave lock screen (home/recents)")
    }
  }

  override fun onPause() {
    super.onPause()
    if (BuildConfig.DEBUG) {
      Log.d(TAG, "Lock screen paused; service will relaunch if blocked app returns to foreground")
    }
  }

  private fun applyIntentData(intent: Intent?) {
    blockedPackageName = intent?.getStringExtra("packageName") ?: "This app"
  }

  private fun redirectToHomeAndFinish() {
    val homeIntent = Intent(Intent.ACTION_MAIN).apply {
      addCategory(Intent.CATEGORY_HOME)
      flags = Intent.FLAG_ACTIVITY_NEW_TASK
    }

    startActivity(homeIntent)
    finishAndRemoveTask()
  }
}
