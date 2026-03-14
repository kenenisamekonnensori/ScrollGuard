# ScrollGuard — Product & Engineering Specification

## 1. Project Overview

ScrollGuard is a **mobile application designed to help users reduce addiction to short-form video platforms** such as:

* TikTok
* Instagram Reels
* YouTube Shorts

These platforms are intentionally designed to create **infinite scrolling loops** that keep users engaged for long periods of time. ScrollGuard gives users control over their time by:

* Monitoring usage of short-video apps
* Estimating how many short videos are watched
* Warning users when usage becomes excessive
* Temporarily blocking the apps once limits are exceeded
* Providing motivational reminders to stop scrolling

The goal of the application is **digital wellbeing and attention control**.

---

# 2. Core Problem

Short-form video platforms rely on **infinite scroll and algorithmic feeds** that encourage continuous consumption.

Common user problems:

* Users open TikTok "for 5 minutes" and end up spending **1–2 hours**
* People underestimate how many videos they watch
* Current digital wellbeing tools only track **time**, not **video consumption**
* There are very few apps that **actively interrupt scrolling behavior**

ScrollGuard addresses these issues by introducing **real-time awareness and intervention**.

---

# 3. Core Goals of the App

ScrollGuard aims to:

1. Track how long users spend on short-video apps.
2. Estimate the number of short videos watched.
3. Alert users when they exceed healthy limits.
4. Temporarily block apps after limits are reached.
5. Encourage users with motivational reminders.
6. Provide insights into scrolling habits.

---

# 4. Target Platforms

Initial version:

* Android (primary target)

Future versions:

* iOS (limited capability due to Apple restrictions)

Android is required for the first version because it allows:

* App usage tracking
* Accessibility services
* App blocking

---

# 5. Technology Stack

## Mobile Framework

React Native with TypeScript.

Reason:

* Faster development
* Cross-platform support
* Large ecosystem
* Compatible with native Android modules

---

## Native Android Layer

Certain system-level capabilities require native Android code.

Language:

Kotlin

Native Android APIs used:

* UsageStatsManager
* AccessibilityService
* NotificationManager
* Foreground Service

---

## Local Data Storage

Primary storage:

react-native-mmkv

Reason:

* Extremely fast
* Suitable for frequent updates
* Works well for usage counters

---

## Optional Backend (Future)

Backend is not required for version 1.

Possible stack:

* Node.js
* Express
* MongoDB

Potential backend features:

* Sync usage history
* Analytics
* AI behavior analysis
* Cross-device stats

---

# 6. Core Features

## 6.1 App Usage Tracking

The application monitors how long users spend inside specific apps.

Target apps include:

* TikTok
* Instagram
* YouTube

Tracking is implemented using Android's:

UsageStatsManager API.

The app records:

* Time spent per app
* Time spent per day
* Total session duration

Example usage data:

```
TikTok:
Time Today: 42 minutes

Instagram:
Time Today: 18 minutes
```

---

# 6.2 Short Video Counter

The app attempts to estimate how many short videos the user watches.

Two possible methods:

### Method 1 (Initial version)

Estimate using time.

Example:

```
Average short video length ≈ 20 seconds
```

Calculation:

```
videos_watched = total_time / average_video_length
```

---

### Method 2 (Advanced)

Use AccessibilityService to detect scroll events.

Each vertical swipe typically loads a new video.

Example:

```
User swipes up → next video
```

Counter increments:

```
videoCount += 1
```

This provides a much more accurate measurement.

---

# 6.3 Usage Limits

Users can configure daily limits.

Example settings:

```
TikTok limit: 20 minutes
Instagram limit: 15 minutes
YouTube limit: 15 minutes
```

When a limit is reached the system triggers:

1. Warning notification
2. Motivational message
3. App blocking

---

# 6.4 Notifications

Notifications are used to interrupt excessive scrolling.

Examples:

```
"You have watched 45 short videos today."
```

```
"You have spent 30 minutes scrolling."
```

```
"Take a break. Your attention matters."
```

Notifications appear at configurable thresholds.

Example thresholds:

* 10 minutes
* 20 minutes
* 30 minutes

---

# 6.5 App Blocking

Once a user exceeds the limit, ScrollGuard temporarily blocks access to the app.

This is implemented using:

AccessibilityService.

When the blocked app is detected in the foreground:

ScrollGuard immediately launches its own lock screen.

Example lock message:

```
TikTok is locked for 30 minutes.

You already spent your scroll time today.
Take a break and come back later.
```

---

# 6.6 Lock Screen

The lock screen replaces the blocked app.

It displays:

* reason for the lock
* time remaining
* motivational message

Example UI:

```
App Locked

TikTok is temporarily locked.

Time remaining: 25 minutes

"Your time is your life."
```

---

# 6.7 Usage Statistics

The app provides insight into scrolling behavior.

Examples:

Daily stats:

```
Videos watched: 132
Time spent: 54 minutes
```

Weekly stats:

```
Total shorts watched: 820
Time spent: 5.4 hours
```

These statistics help users understand their habits.

---

# 7. System Architecture

High-level architecture:

```
React Native App
│
├── UI Layer
│   ├── Dashboard
│   ├── Stats
│   ├── Settings
│   ├── Lock Screen
│   └── Onboarding
│
├── Application Logic
│   ├── Usage Tracking Engine
│   ├── Scroll Counter Engine
│   ├── Limit Engine
│   ├── Notification Engine
│   └── Motivation Engine
│
├── Native Android Bridge
│   ├── UsageStatsManager
│   ├── AccessibilityService
│   └── App Blocking
│
└── Storage Layer
    └── MMKV
```

---

# 8. Application Modules

## Usage Engine

Responsible for:

* retrieving app usage
* calculating session durations

---

## Scroll Counter

Responsible for:

* estimating number of videos watched
* incrementing counters on scroll events

---

## Limit Engine

Responsible for:

* comparing usage to user limits
* triggering warnings
* initiating app blocking

---

## Notification Engine

Responsible for:

* delivering motivational notifications
* sending usage alerts

---

## Blocking Engine

Responsible for:

* detecting when blocked apps are opened
* launching the lock screen

---

# 9. Required Android Permissions

The application requires several system permissions.

### Usage Access

Allows the app to monitor app usage.

```
android.permission.PACKAGE_USAGE_STATS
```

---

### Accessibility Service

Allows detection of scrolling events and foreground apps.

This permission must be enabled manually by the user.

---

### Notifications

Used to deliver warnings and reminders.

---

# 10. Privacy Philosophy

ScrollGuard prioritizes user privacy.

Key principles:

* No tracking of personal content
* No recording of screen data
* No monitoring of messages or media
* Only usage metadata is collected

Example stored data:

```
time_spent
app_name
scroll_count
```

---

# 11. Future Features

Potential future improvements:

* AI scroll habit analysis
* bedtime scrolling detection
* focus mode for work/study
* streak system for reduced scrolling
* gamified productivity rewards
* community challenges

---

# 12. Non-Goals (Version 1)

The first version will NOT include:

* social features
* cloud sync
* machine learning models
* complex analytics

The focus is on **core functionality and speed of development**.

---

# 13. Success Metrics

The app is successful if users:

* reduce daily scrolling time
* become aware of their habits
* feel more control over their attention

Possible measurable metrics:

* daily usage reduction
* fewer short videos watched
* higher focus time

---

# 14. Summary

ScrollGuard is a digital wellbeing application that helps users regain control of their attention by monitoring and limiting short-form video consumption.

It combines:

* app usage tracking
* scroll detection
* limit enforcement
* motivational interventions

The project uses React Native for rapid development and Kotlin for Android system integration.

The goal is to build a simple, effective tool that helps users **break the cycle of endless scrolling**.
