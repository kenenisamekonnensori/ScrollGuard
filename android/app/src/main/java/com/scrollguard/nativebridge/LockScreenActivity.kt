package com.scrollguard.nativebridge

import android.app.Activity
import android.content.Intent
import android.graphics.Color
import android.graphics.Typeface
import android.os.Bundle
import android.os.CountDownTimer
import android.util.Log
import android.view.Gravity
import android.view.View
import android.widget.LinearLayout
import android.widget.TextView
import com.scrollguard.BuildConfig

class LockScreenActivity : Activity() {
  companion object {
    private const val TAG = "ScrollGuardBlocker"
  }

  private lateinit var messageView: TextView
  private lateinit var timerView: TextView
  private var blockedPackageName: String = "This app"
  private var lockedUntil: Long = 0L
  private var countDownTimer: CountDownTimer? = null

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    applyIntentData(intent)
    setContentView(buildContentView())
    startCountdown()

    if (BuildConfig.DEBUG) {
      Log.d(TAG, "LockScreenActivity created for package=$blockedPackageName lockedUntil=$lockedUntil")
    }
  }

  override fun onNewIntent(intent: Intent?) {
    super.onNewIntent(intent)
    if (intent != null) {
      setIntent(intent)
      applyIntentData(intent)
      messageView.text =
        "$blockedPackageName is blocked for now. Take a break. Your future self will thank you for the extra time and focus."
      startCountdown()

      if (BuildConfig.DEBUG) {
        Log.d(TAG, "LockScreenActivity updated for package=$blockedPackageName lockedUntil=$lockedUntil")
      }
    }
  }

  override fun onDestroy() {
    countDownTimer?.cancel()
    super.onDestroy()
  }

  @Deprecated("Deprecated in Activity")
  @Suppress("DEPRECATION")
  override fun onBackPressed() {
    if (BuildConfig.DEBUG) {
      Log.d(TAG, "Back pressed on lock screen; redirecting user to home")
    }
    redirectToHomeAndFinish()
  }

  private fun buildContentView(): View {
    val root = LinearLayout(this).apply {
      orientation = LinearLayout.VERTICAL
      gravity = Gravity.CENTER_HORIZONTAL
      setBackgroundColor(Color.WHITE)
      setPadding(56, 72, 56, 72)
    }

    val brand = TextView(this).apply {
      text = "ScrollGuard"
      textSize = 18f
      setTypeface(typeface, Typeface.BOLD)
      setTextColor(Color.parseColor("#0B1330"))
      gravity = Gravity.CENTER
    }

    val artCard = LinearLayout(this).apply {
      orientation = LinearLayout.VERTICAL
      gravity = Gravity.CENTER
      setPadding(32, 32, 32, 32)
      background = android.graphics.drawable.GradientDrawable().apply {
        shape = android.graphics.drawable.GradientDrawable.RECTANGLE
        cornerRadius = 36f
        setColor(Color.parseColor("#DFF7FF"))
        setStroke(2, Color.parseColor("#C9EDF7"))
      }
    }

    val artIcon = TextView(this).apply {
      text = "⏳"
      textSize = 54f
      gravity = Gravity.CENTER
    }
    artCard.addView(
      artIcon,
      LinearLayout.LayoutParams(
        LinearLayout.LayoutParams.MATCH_PARENT,
        360,
      ),
    )

    val title = TextView(this).apply {
      text = "You've reached your scrolling limit."
      textSize = 24f
      setTypeface(typeface, Typeface.BOLD)
      setTextColor(Color.parseColor("#0B1330"))
      gravity = Gravity.CENTER
    }

    messageView = TextView(this).apply {
      text = "$blockedPackageName is blocked for now. Take a break. Your future self will thank you for the extra time and focus."
      textSize = 18f
      setTextColor(Color.parseColor("#5C6F82"))
      gravity = Gravity.CENTER
    }

    timerView = TextView(this).apply {
      text = "00:00"
      textSize = 28f
      setTypeface(typeface, Typeface.BOLD)
      setTextColor(Color.parseColor("#0891B2"))
      gravity = Gravity.CENTER
    }

    val backButton = TextView(this).apply {
      text = "←  Go Back"
      textSize = 18f
      setTypeface(typeface, Typeface.BOLD)
      setTextColor(Color.WHITE)
      gravity = Gravity.CENTER
      setPadding(32, 24, 32, 24)
      background = android.graphics.drawable.GradientDrawable().apply {
        shape = android.graphics.drawable.GradientDrawable.RECTANGLE
        cornerRadius = 999f
        setColor(Color.parseColor("#19C3E6"))
      }
      setOnClickListener {
        redirectToHomeAndFinish()
      }
    }

    val premiumRow = LinearLayout(this).apply {
      orientation = LinearLayout.HORIZONTAL
      gravity = Gravity.CENTER
    }

    val extendLimit = TextView(this).apply {
      text = "EXTEND LIMIT"
      textSize = 12f
      setTypeface(typeface, Typeface.BOLD)
      setTextColor(Color.parseColor("#0891B2"))
    }
    val premiumBadge = TextView(this).apply {
      text = "PREMIUM"
      textSize = 10f
      setTypeface(typeface, Typeface.BOLD)
      setTextColor(Color.parseColor("#91A5B8"))
      setPadding(14, 8, 14, 8)
      background = android.graphics.drawable.GradientDrawable().apply {
        shape = android.graphics.drawable.GradientDrawable.RECTANGLE
        cornerRadius = 999f
        setColor(Color.parseColor("#EEF7FA"))
      }
    }
    premiumRow.addView(extendLimit)
    premiumRow.addView(
      premiumBadge,
      LinearLayout.LayoutParams(
        LinearLayout.LayoutParams.WRAP_CONTENT,
        LinearLayout.LayoutParams.WRAP_CONTENT,
      ).apply {
        leftMargin = 12
      },
    )

    val footer = TextView(this).apply {
      text = "\"Disconnect to reconnect.\""
      textSize = 12f
      setTextColor(Color.parseColor("#9AA8B8"))
      gravity = Gravity.CENTER
    }

    root.addView(brand)
    root.addView(
      artCard,
      LinearLayout.LayoutParams(
        LinearLayout.LayoutParams.MATCH_PARENT,
        LinearLayout.LayoutParams.WRAP_CONTENT,
      ).apply {
        topMargin = 36
      },
    )
    root.addView(
      title,
      LinearLayout.LayoutParams(
        LinearLayout.LayoutParams.MATCH_PARENT,
        LinearLayout.LayoutParams.WRAP_CONTENT,
      ).apply {
        topMargin = 40
      },
    )
    root.addView(
      messageView,
      LinearLayout.LayoutParams(
        LinearLayout.LayoutParams.MATCH_PARENT,
        LinearLayout.LayoutParams.WRAP_CONTENT,
      ).apply {
        topMargin = 20
      },
    )
    root.addView(
      timerView,
      LinearLayout.LayoutParams(
        LinearLayout.LayoutParams.MATCH_PARENT,
        LinearLayout.LayoutParams.WRAP_CONTENT,
      ).apply {
        topMargin = 24
      },
    )
    root.addView(
      backButton,
      LinearLayout.LayoutParams(
        LinearLayout.LayoutParams.MATCH_PARENT,
        LinearLayout.LayoutParams.WRAP_CONTENT,
      ).apply {
        topMargin = 28
      },
    )
    root.addView(
      premiumRow,
      LinearLayout.LayoutParams(
        LinearLayout.LayoutParams.WRAP_CONTENT,
        LinearLayout.LayoutParams.WRAP_CONTENT,
      ).apply {
        topMargin = 28
        gravity = Gravity.CENTER_HORIZONTAL
      },
    )
    root.addView(
      footer,
      LinearLayout.LayoutParams(
        LinearLayout.LayoutParams.MATCH_PARENT,
        LinearLayout.LayoutParams.WRAP_CONTENT,
      ).apply {
        topMargin = 36
      },
    )

    return root
  }

  private fun startCountdown() {
    countDownTimer?.cancel()
    val remainingMs = (lockedUntil - System.currentTimeMillis()).coerceAtLeast(0L)
    timerView.text = formatRemainingTime(remainingMs)

    countDownTimer = object : CountDownTimer(remainingMs, 1000L) {
      override fun onTick(millisUntilFinished: Long) {
        timerView.text = formatRemainingTime(millisUntilFinished)
      }

      override fun onFinish() {
        timerView.text = "00:00"
        if (blockedPackageName != "This app") {
          BlockedAppsStore.unblockAppFamily(applicationContext, blockedPackageName)
        }
        finish()
      }
    }.start()
  }

  private fun applyIntentData(intent: Intent?) {
    blockedPackageName = intent?.getStringExtra("packageName") ?: "This app"
    val intentLockedUntil = intent?.getLongExtra("lockedUntil", 0L) ?: 0L
    val persistedLockedUntil =
      if (blockedPackageName == "This app") {
        null
      } else {
        BlockedAppsStore.getLockedUntil(applicationContext, blockedPackageName)
      }

    lockedUntil = persistedLockedUntil ?: intentLockedUntil
  }

  private fun formatRemainingTime(remainingMs: Long): String {
    val totalSeconds = (remainingMs / 1000L).coerceAtLeast(0L)
    val minutes = (totalSeconds / 60L).toString().padStart(2, '0')
    val seconds = (totalSeconds % 60L).toString().padStart(2, '0')
    return "$minutes:$seconds"
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
