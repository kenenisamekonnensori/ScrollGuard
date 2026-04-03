package com.scrollguard.nativebridge

object AppPackages {
  val TIKTOK_PACKAGES = setOf(
    "com.zhiliaoapp.musically",
    "com.zhiliaoapp.musically.go",
  )

  val INSTAGRAM_PACKAGES = setOf(
    "com.instagram.android",
    "com.instagram.lite",
  )

  val YOUTUBE_PACKAGES = setOf(
    "com.google.android.youtube",
  )

  val MONITORED_PACKAGES = setOf(
    *TIKTOK_PACKAGES.toTypedArray(),
    *INSTAGRAM_PACKAGES.toTypedArray(),
    *YOUTUBE_PACKAGES.toTypedArray(),
  )
}
