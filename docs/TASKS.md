# ScrollGuard — Development Tasks (TASKS.md)

## Purpose of This Document

This document defines **step-by-step development tasks** for building the ScrollGuard application.

It is designed so that **AI coding agents (Cursor, Copilot, Claude Code)** can execute tasks sequentially and generate production-ready code with minimal ambiguity.

Tasks are grouped into **phases**.
Each task should ideally be implemented in a **separate commit or pull request**.

---

# Phase 1 — Project Initialization

## Task 1.1 — Create React Native Project

Create a new React Native project using TypeScript.

Requirements:

* React Native CLI or Expo (React Native CLI preferred for native modules)
* TypeScript enabled

Project name:

```
ScrollGuard
```

Install core dependencies:

```
zustand
react-query
react-native-mmkv
react-native-permissions
react-native-notifications
react-navigation
react-native-safe-area-context
react-native-screens
```

Goal:

Initialize a working React Native environment with TypeScript.

---

## Task 1.2 — Setup Navigation

Implement navigation using React Navigation.

Create the following stack navigator:

```
OnboardingScreen
DashboardScreen
StatsScreen
SettingsScreen
LockScreen
```

Navigation type:

```
Stack Navigator
```

Ensure navigation is typed using TypeScript.

---

## Task 1.3 — Create Base Folder Structure

Create the following directory structure inside `/src`:

```
/src
  /components
  /screens
  /features
  /services
  /store
  /db
  /native
  /utils
```

Inside `/screens`, create empty files:

```
DashboardScreen.tsx
StatsScreen.tsx
SettingsScreen.tsx
LockScreen.tsx
OnboardingScreen.tsx
```

Each screen should export a simple placeholder component.

---

# Phase 2 — Storage Layer

## Task 2.1 — Configure MMKV Storage

Install and configure:

```
react-native-mmkv
```

Create file:

```
/src/db/storage.ts
```

Initialize a shared MMKV instance.

Expose helper methods:

```
getValue(key)
setValue(key, value)
deleteValue(key)
```

Purpose:

Provide fast persistent storage for usage data and settings.

---

## Task 2.2 — Define Data Models

Create file:

```
/src/db/models.ts
```

Define TypeScript interfaces for:

UserSettings

```
{
  tiktokLimitMinutes: number
  instagramLimitMinutes: number
  youtubeLimitMinutes: number
  lockDurationMinutes: number
}
```

DailyUsage

```
{
  date: string
  app: string
  timeSpentSeconds: number
  videoCount: number
}
```

LockState

```
{
  app: string
  lockedUntil: number
}
```

---

# Phase 3 — Global State Management

## Task 3.1 — Create Settings Store

Create Zustand store:

```
/src/store/settingsStore.ts
```

State should include:

```
userSettings
setUserSettings()
updateLimit()
```

Load settings from MMKV on initialization.

---

## Task 3.2 — Create Usage Store

Create Zustand store:

```
/src/store/usageStore.ts
```

State should include:

```
usageStats
videoCounts
updateUsage()
incrementVideoCount()
```

Persist updates using MMKV.

---

# Phase 4 — Native Bridge Interface

## Task 4.1 — Define Native Bridge Interface

Create file:

```
/src/native/NativeBridgeService.ts
```

Define interface functions:

```
getUsageStats()
startScrollDetection()
stopScrollDetection()
blockApp(packageName)
unblockApp(packageName)
```

These functions will call native Android modules.

For now, create placeholder implementations.

---

# Phase 5 — Core Services

## Task 5.1 — Usage Service

Create:

```
/src/services/UsageService.ts
```

Responsibilities:

* fetch usage stats from native bridge
* transform usage data
* update usage store

Method:

```
fetchTodayUsage()
```

This function should:

1. call native module
2. parse results
3. update store

---

## Task 5.2 — Scroll Service

Create:

```
/src/services/ScrollService.ts
```

Responsibilities:

* listen for scroll events from native layer
* increment video counter

Methods:

```
startListening()
stopListening()
```

Each scroll event should trigger:

```
usageStore.incrementVideoCount()
```

---

## Task 5.3 — Limit Engine

Create:

```
/src/features/limits/limitEngine.ts
```

Responsibilities:

* compare usage with limits
* trigger blocking when limits exceeded

Function:

```
evaluateUsageLimits()
```

Logic:

```
if usage > limit:
   block app
```

---

## Task 5.4 — Notification Service

Create:

```
/src/services/NotificationService.ts
```

Responsibilities:

* schedule notifications
* send alerts when usage thresholds reached

Methods:

```
sendWarningNotification()
sendLimitReachedNotification()
```

---

## Task 5.5 — Motivation Engine

Create:

```
/src/features/motivation/motivationEngine.ts
```

Define array of motivational messages.

Create function:

```
getRandomMotivation()
```

Used by NotificationService and LockScreen.

---

# Phase 6 — App Blocking

## Task 6.1 — Blocking Controller

Create:

```
/src/features/blocking/blockingController.ts
```

Responsibilities:

* activate block
* deactivate block
* check lock state

Functions:

```
blockApp(app)
unblockApp(app)
isAppBlocked(app)
```

Persist lock state in storage.

---

## Task 6.2 — Lock Screen UI

Implement screen:

```
/src/screens/LockScreen.tsx
```

Display:

* locked app name
* time remaining
* motivational message

Add countdown timer.

---

# Phase 7 — Dashboard

## Task 7.1 — Dashboard Screen

Implement:

```
/src/screens/DashboardScreen.tsx
```

Display:

```
Time spent today
Videos watched
App usage summary
```

Example:

```
TikTok
Time: 22 minutes
Videos: 65
```

---

# Phase 8 — Statistics

## Task 8.1 — Stats Screen

Create:

```
/src/screens/StatsScreen.tsx
```

Display:

* daily usage
* weekly usage
* videos watched

Use simple charts or lists.

---

# Phase 9 — Settings

## Task 9.1 — Settings Screen

Implement:

```
/src/screens/SettingsScreen.tsx
```

Allow user to configure:

```
TikTok limit
Instagram limit
YouTube limit
Lock duration
```

Update settings store.

---

# Phase 10 — Onboarding

## Task 10.1 — Onboarding Screen

Implement:

```
/src/screens/OnboardingScreen.tsx
```

Explain:

* purpose of the app
* required permissions

Include buttons to open system settings.

---

# Phase 11 — Android Native Implementation

## Task 11.1 — UsageStats Module

Create Android native module using:

```
UsageStatsManager
```

Expose function:

```
getUsageStats()
```

Return usage time for monitored apps.

---

## Task 11.2 — Accessibility Service

Implement:

```
AccessibilityService
```

Responsibilities:

* detect scroll gestures
* detect foreground apps

Emit events to React Native.

---

## Task 11.3 — Blocking Service

Inside AccessibilityService:

When blocked app is detected:

```
launch LockScreen activity
```

---

# Phase 12 — Background Monitoring

## Task 12.1 — Usage Polling

Create background task that runs:

```
every 30 seconds
```

Call:

```
UsageService.fetchTodayUsage()
LimitEngine.evaluateUsageLimits()
```

---

# Phase 13 — Testing

## Task 13.1 — Unit Tests

Test:

* limit logic
* usage calculations
* motivation engine

---

## Task 13.2 — Manual Testing

Verify:

* permissions flow
* usage tracking accuracy
* blocking functionality
* notification delivery

---

# Phase 14 — Release Preparation

## Task 14.1 — Performance Optimization

Check:

* memory usage
* background services
* battery impact

---

## Task 14.2 — Play Store Preparation

Prepare:

* app icon
* screenshots
* description
* privacy policy

---

# Summary

The development process follows these phases:

```
1. Project setup
2. Storage
3. State management
4. Native bridge
5. Core services
6. Blocking system
7. UI screens
8. Android native modules
9. Background monitoring
10. Testing
```

This task list is designed so an **AI coding agent can implement the project step-by-step with minimal context switching**.
