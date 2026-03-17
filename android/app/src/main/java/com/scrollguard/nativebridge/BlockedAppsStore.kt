package com.scrollguard.nativebridge

import android.content.Context

object BlockedAppsStore {
  private const val PREFS_NAME = "scrollguard_blocked_apps"
  private const val PREFIX = "blocked_"

  private fun prefs(context: Context) =
    context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

  fun blockApp(context: Context, packageName: String, durationMinutes: Int) {
    val now = System.currentTimeMillis()
    val durationMs = durationMinutes.coerceAtLeast(0) * 60_000L
    val lockedUntil = now + durationMs
    prefs(context).edit().putLong(PREFIX + packageName, lockedUntil).apply()
  }

  fun unblockApp(context: Context, packageName: String) {
    prefs(context).edit().remove(PREFIX + packageName).apply()
  }

  fun getLockedUntil(context: Context, packageName: String): Long? {
    val key = PREFIX + packageName
    val stored = prefs(context).getLong(key, -1L)
    if (stored <= 0L) {
      return null
    }

    if (stored <= System.currentTimeMillis()) {
      prefs(context).edit().remove(key).apply()
      return null
    }

    return stored
  }

  fun isBlocked(context: Context, packageName: String): Boolean {
    return getLockedUntil(context, packageName) != null
  }
}
