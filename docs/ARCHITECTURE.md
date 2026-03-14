# ScrollGuard — System Architecture

## 1. Purpose of This Document

This document describes the **technical architecture of the ScrollGuard application**.
It is intended to provide **AI coding agents (Copilot, Cursor, Claude Code)** and developers with a clear understanding of:

* System components
* Data flow
* Responsibilities of each module
* Boundaries between React Native and Android native code
* Storage strategy
* Event flow

The architecture is designed for **fast iteration, maintainability, and clear module separation**.

---

# 2. High-Level Architecture

ScrollGuard consists of **four main layers**:

```
┌─────────────────────────────────────┐
│           UI LAYER                  │
│ React Native Screens & Components   │
└─────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────┐
│         APPLICATION LAYER           │
│  Business Logic / Feature Engines   │
└─────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────┐
│        NATIVE ANDROID LAYER         │
│  System APIs + Background Services  │
└─────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────┐
│          STORAGE LAYER              │
│       Local persistent storage      │
└─────────────────────────────────────┘
```

---

# 3. Layer Descriptions

## 3.1 UI Layer (React Native)

This layer contains **all user interface components**.

Responsibilities:

* Rendering app screens
* Displaying statistics
* Showing lock screen
* Handling user settings
* Requesting permissions
* Presenting notifications

The UI layer **does not contain business logic**.
All logic is delegated to the Application Layer.

---

## 3.2 Application Layer

The application layer contains **all core logic and services**.

Responsibilities:

* Usage monitoring logic
* Video counting
* Limit enforcement
* Triggering notifications
* Triggering app blocking

This layer acts as the **central brain of the system**.

Main modules:

```
UsageEngine
ScrollEngine
LimitEngine
NotificationEngine
MotivationEngine
BlockingController
```

---

## 3.3 Native Android Layer

Some system-level capabilities cannot be implemented in React Native.

These are implemented in **native Kotlin modules**.

Responsibilities:

* Access Android system APIs
* Track app usage
* Detect scroll gestures
* Monitor foreground apps
* Launch blocking screen

This layer communicates with React Native through:

```
React Native Native Modules
```

---

## 3.4 Storage Layer

ScrollGuard stores data **locally on the device**.

Primary storage:

```
react-native-mmkv
```

Reasons:

* Extremely fast
* Persistent
* Suitable for frequent updates
* Works well with counters

Stored data includes:

* app usage statistics
* video count
* user settings
* lock states

---

# 4. Directory Structure

The project follows a **feature-oriented architecture**.

```
/src

  /components
    Reusable UI components

  /screens
    DashboardScreen
    StatsScreen
    SettingsScreen
    LockScreen
    OnboardingScreen

  /features
    /usage
      usageEngine.ts
      usageSelectors.ts

    /scroll
      scrollEngine.ts

    /limits
      limitEngine.ts

    /notifications
      notificationEngine.ts

    /blocking
      blockingController.ts

    /motivation
      motivationEngine.ts

  /services
      UsageService.ts
      NativeBridgeService.ts
      NotificationService.ts

  /store
      settingsStore.ts
      usageStore.ts

  /db
      storage.ts
      models.ts

  /native
      AppUsageBridge.ts
      ScrollBridge.ts
      BlockBridge.ts
```

---

# 5. Core Application Modules

## 5.1 Usage Engine

Purpose:

Track how long users spend inside monitored apps.

Input:

* app usage data from Android

Output:

* usage statistics
* session duration

Example output:

```
{
  tiktok: 32 minutes,
  instagram: 18 minutes,
  youtube: 10 minutes
}
```

---

## 5.2 Scroll Engine

Purpose:

Estimate how many short videos the user watches.

Method:

Count scroll gestures detected by AccessibilityService.

Example:

```
User swipes up → next video
```

Counter increments:

```
videoCount += 1
```

---

## 5.3 Limit Engine

Purpose:

Compare usage with user-defined limits.

Example rule:

```
if usageTime > dailyLimit
    triggerBlock()
```

This engine runs periodically.

Recommended interval:

```
every 30 seconds
```

---

## 5.4 Notification Engine

Responsible for sending notifications when thresholds are reached.

Examples:

```
"You have watched 50 shorts today."
```

```
"You have been scrolling for 20 minutes."
```

Notifications are triggered when usage reaches predefined percentages:

```
50%
75%
100%
```

---

## 5.5 Motivation Engine

Provides motivational messages to interrupt scrolling behavior.

Message examples:

```
"Stop scrolling. Start building."
```

```
"Your future is not in the feed."
```

Messages are selected randomly.

---

## 5.6 Blocking Controller

Responsible for blocking apps when limits are exceeded.

Process:

1. LimitEngine detects limit exceeded
2. BlockingController activates block
3. Native layer intercepts app launch
4. Lock screen is shown

---

# 6. Native Android Modules

Native modules expose Android functionality to React Native.

---

## 6.1 AppUsageModule

Uses:

```
UsageStatsManager
```

Returns:

* time spent per app
* usage sessions

Example response:

```
{
  "com.zhiliaoapp.musically": 1200,
  "com.instagram.android": 800
}
```

Values are in seconds.

---

## 6.2 ScrollDetectionService

Implements:

```
AccessibilityService
```

Detects:

* scroll gestures
* active app package

Events sent to React Native:

```
onScrollDetected()
onAppForegroundChanged()
```

---

## 6.3 BlockingService

Also uses:

```
AccessibilityService
```

When a blocked app is detected:

```
launch LockScreen activity
```

---

# 7. Data Model

## User Settings

```
{
  tiktokLimitMinutes: number
  instagramLimitMinutes: number
  youtubeLimitMinutes: number
  lockDurationMinutes: number
}
```

---

## Daily Usage

```
{
  date: string
  app: string
  timeSpentSeconds: number
  videoCount: number
}
```

---

## Lock State

```
{
  app: string
  lockedUntil: timestamp
}
```

---

# 8. Event Flow

Typical user interaction flow:

```
User opens TikTok
        │
        ▼
AccessibilityService detects foreground app
        │
        ▼
UsageEngine starts tracking session
        │
        ▼
User scrolls
        │
        ▼
ScrollDetectionService triggers event
        │
        ▼
ScrollEngine increments counter
        │
        ▼
LimitEngine evaluates usage
        │
        ▼
If limit exceeded
        │
        ▼
BlockingController activates block
        │
        ▼
LockScreen displayed
```

---

# 9. Permission Flow

Required permissions:

### Usage Access

Allows monitoring app usage.

```
android.permission.PACKAGE_USAGE_STATS
```

---

### Accessibility Service

Required for:

* detecting scroll gestures
* detecting foreground apps
* blocking apps

User must manually enable it in Android settings.

---

### Notification Permission

Used to display alerts.

---

# 10. Background Services

Two background services run during app operation.

### Usage Monitoring Service

Periodically retrieves app usage statistics.

Interval:

```
30 seconds
```

---

### Accessibility Service

Continuously monitors:

* scroll events
* active apps

---

# 11. Performance Considerations

Key performance goals:

* Minimal battery impact
* Lightweight background tasks
* Efficient local storage

Strategies:

* Use MMKV for fast writes
* Avoid frequent heavy queries
* Process events asynchronously

---

# 12. Security and Privacy

ScrollGuard does **not access personal user data**.

The app only records:

* app usage duration
* scroll counts

The app does **not collect**:

* screen recordings
* messages
* personal media

All data remains **local to the device** in version 1.

---

# 13. Future Architecture Extensions

Possible future additions:

* backend sync service
* AI habit analysis
* machine learning recommendations
* productivity gamification
* cross-device usage tracking

---

# 14. Architectural Principles

The system is designed using the following principles:

* Clear separation of concerns
* Minimal coupling between modules
* Native code only where necessary
* React Native for most logic
* Local-first data storage
* Extensible feature modules

These principles allow **rapid development while maintaining long-term scalability**.
