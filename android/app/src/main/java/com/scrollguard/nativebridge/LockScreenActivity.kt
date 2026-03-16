package com.scrollguard.nativebridge

import android.app.Activity
import android.os.Bundle
import android.view.Gravity
import android.widget.LinearLayout
import android.widget.TextView

class LockScreenActivity : Activity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    val packageName = intent?.getStringExtra("packageName") ?: "This app"
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

    val message = TextView(this).apply {
      text = "$packageName is currently blocked due to your limit."
      textSize = 18f
      gravity = Gravity.CENTER
      setPadding(0, 24, 0, 0)
    }

    root.addView(title)
    root.addView(message)
    setContentView(root)
  }
}
