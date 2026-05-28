package com.scrollguard.nativebridge

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.scrollguard.MainActivity
import com.scrollguard.R
import kotlin.math.absoluteValue

class LocalNotificationModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  companion object {
    const val NAME = "LocalNotificationModule"
    private const val CHANNEL_ID = "scrollguard-alerts"
    private const val CHANNEL_NAME = "ScrollGuard Alerts"
  }

  override fun getName(): String = NAME

  @ReactMethod
  fun postLocalNotification(title: String, body: String, promise: Promise) {
    try {
      if (!canPostNotifications()) {
        promise.resolve(false)
        return
      }

      createNotificationChannel()

      val launchIntent = Intent(reactContext, MainActivity::class.java).apply {
        flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
      }
      val pendingIntent = PendingIntent.getActivity(
        reactContext,
        title.hashCode().absoluteValue,
        launchIntent,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
      )

      val notification = NotificationCompat.Builder(reactContext, CHANNEL_ID)
        .setSmallIcon(R.drawable.notification_icon)
        .setContentTitle(title)
        .setContentText(body)
        .setStyle(NotificationCompat.BigTextStyle().bigText(body))
        .setContentIntent(pendingIntent)
        .setAutoCancel(true)
        .setOnlyAlertOnce(true)
        .setPriority(NotificationCompat.PRIORITY_DEFAULT)
        .build()

      NotificationManagerCompat.from(reactContext).notify(
        createNotificationId(title, body),
        notification,
      )
      promise.resolve(true)
    } catch (error: Exception) {
      promise.reject("E_LOCAL_NOTIFICATION", error.message, error)
    }
  }

  private fun canPostNotifications(): Boolean {
    if (!NotificationManagerCompat.from(reactContext).areNotificationsEnabled()) {
      return false
    }

    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
      return true
    }

    return reactContext.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) ==
      PackageManager.PERMISSION_GRANTED
  }

  private fun createNotificationChannel() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      return
    }

    val manager = reactContext.getSystemService(NotificationManager::class.java)
    if (manager.getNotificationChannel(CHANNEL_ID) != null) {
      return
    }

    val channel = NotificationChannel(
      CHANNEL_ID,
      CHANNEL_NAME,
      NotificationManager.IMPORTANCE_DEFAULT,
    ).apply {
      description = "Usage warnings, lock events, and release updates"
      setShowBadge(true)
    }

    manager.createNotificationChannel(channel)
  }

  private fun createNotificationId(title: String, body: String): Int {
    return "$title:$body:${System.currentTimeMillis()}".hashCode().absoluteValue
  }
}
