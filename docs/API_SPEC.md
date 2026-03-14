# ScrollGuard — Native API Specification (API_SPEC.md)

## 1. Purpose of This Document

This document defines the **interface between the React Native application and the Android native layer**.

ScrollGuard requires native Android capabilities that are not available in standard React Native APIs, including:

* App usage tracking
* Scroll gesture detection
* Foreground app detection
* App blocking
* Background monitoring

These capabilities are implemented using **Android Kotlin native modules** and exposed to React Native through the **React Native Native Modules system**.

This specification ensures that:

* The React Native codebase knows exactly which native functions exist
* Native modules follow a consistent contract
* AI coding agents can implement both sides correctly

---

# 2. Architecture Overview

```
React Native (TypeScript)
        │
        │ Native Bridge
        ▼
Android Native Modules (Kotlin)
        │
        ▼
Android System APIs
```

Native modules are responsible for interacting with:

```
UsageStatsManager
AccessibilityService
ActivityManager
NotificationManager
```

React Native communicates with these modules using:

```
NativeModules
EventEmitters
```

---

# 3. Native Modules

ScrollGuard requires **three primary native modules**:

```
AppUsageModule
ScrollDetectionModule
AppBlockingModule
```

Each module exposes specific functionality to the React Native layer.

---

# 4. Module 1 — AppUsageModule

## Purpose

Provides access to **Android app usage statistics**.

Uses:

```
UsageStatsManager
```

This module returns the **time spent inside monitored apps**.

---

## Native Module Name

```
AppUsageModule
```

---

## React Native Import

```
import { NativeModules } from 'react-native'

const { AppUsageModule } = NativeModules
```

---

## Function: getUsageStats

### Description

Returns usage time for selected apps during the current day.

### Method Signature (React Native)

```
getUsageStats(): Promise<UsageStatsResponse>
```

---

### Response Type

```
type UsageStatsResponse = {
  [packageName: string]: number
}
```

Values represent **seconds spent inside the app**.

---

### Example Response

```
{
  "com.zhiliaoapp.musically": 1800,
  "com.instagram.android": 900,
  "com.google.android.youtube": 600
}
```

Meaning:

```
TikTok: 30 minutes
Instagram: 15 minutes
YouTube: 10 minutes
```

---

# 5. Module 2 — ScrollDetectionModule

## Purpose

Detects **scroll gestures and foreground app changes**.

Implemented using:

```
AccessibilityService
```

This module emits **real-time events** to React Native.

---

## Native Module Name

```
ScrollDetectionModule
```

---

## React Native Event Listener

Uses:

```
NativeEventEmitter
```

Example setup:

```
import { NativeModules, NativeEventEmitter } from 'react-native'

const { ScrollDetectionModule } = NativeModules

const eventEmitter = new NativeEventEmitter(ScrollDetectionModule)
```

---

## Function: startScrollDetection

### Description

Starts the accessibility monitoring service.

### Method Signature

```
startScrollDetection(): void
```

---

## Function: stopScrollDetection

### Description

Stops scroll monitoring.

### Method Signature

```
stopScrollDetection(): void
```

---

## Event: onScrollDetected

### Description

Emitted when the user scrolls to the next short video.

### Event Payload

```
{
  packageName: string,
  timestamp: number
}
```

Example:

```
{
  "packageName": "com.zhiliaoapp.musically",
  "timestamp": 1710000000
}
```

React Native should increment the **video counter** when this event fires.

---

## Event: onForegroundAppChanged

### Description

Emitted when the active app changes.

### Event Payload

```
{
  packageName: string
}
```

Example:

```
{
  "packageName": "com.instagram.android"
}
```

React Native uses this event to determine:

* whether a blocked app was opened
* whether usage tracking should start

---

# 6. Module 3 — AppBlockingModule

## Purpose

Handles **temporary blocking of apps** when limits are exceeded.

Blocking is enforced through **AccessibilityService interception**.

---

## Native Module Name

```
AppBlockingModule
```

---

## React Native Import

```
const { AppBlockingModule } = NativeModules
```

---

## Function: blockApp

### Description

Blocks a specific app for a defined period.

### Method Signature

```
blockApp(packageName: string, durationMinutes: number): Promise<void>
```

---

### Example

```
blockApp("com.zhiliaoapp.musically", 30)
```

This blocks TikTok for 30 minutes.

---

## Function: unblockApp

### Description

Removes the block from an app.

### Method Signature

```
unblockApp(packageName: string): Promise<void>
```

---

## Function: isAppBlocked

### Description

Checks if an app is currently blocked.

### Method Signature

```
isAppBlocked(packageName: string): Promise<boolean>
```

---

# 7. Supported App Package Names

The application primarily monitors these packages.

```
TikTok:
com.zhiliaoapp.musically

Instagram:
com.instagram.android

YouTube:
com.google.android.youtube
```

These constants should be defined in a shared configuration file.

Example:

```
/src/constants/appPackages.ts
```

---

# 8. Event Flow Example

Example sequence when a user scrolls TikTok:

```
User opens TikTok
        │
        ▼
AccessibilityService detects foreground app
        │
        ▼
Event emitted:
onForegroundAppChanged
        │
        ▼
User scrolls
        │
        ▼
AccessibilityService detects scroll
        │
        ▼
Event emitted:
onScrollDetected
        │
        ▼
React Native increments video counter
        │
        ▼
LimitEngine evaluates usage
        │
        ▼
If limit exceeded
        │
        ▼
AppBlockingModule.blockApp()
```

---

# 9. Error Handling

All native module methods should handle errors gracefully.

Example error cases:

```
Permission not granted
Accessibility service disabled
Usage stats unavailable
```

Recommended error response format:

```
{
  error: string
}
```

React Native should catch and log these errors.

---

# 10. Permission Requirements

These native modules require the following Android permissions:

### Usage Access

```
android.permission.PACKAGE_USAGE_STATS
```

---

### Accessibility Service

Used for:

* scroll detection
* foreground app detection
* app blocking

Must be enabled manually by the user.

---

### Foreground Service (Optional)

Used for persistent background monitoring.

```
android.permission.FOREGROUND_SERVICE
```

---

# 11. Performance Considerations

Native modules should be implemented with the following constraints:

* minimal CPU usage
* efficient event emission
* avoid excessive polling
* debounce scroll detection events

Recommended event rate:

```
Maximum 1 scroll event per second
```

---

# 12. Future API Extensions

Possible future additions to the native API:

```
getWeeklyUsageStats()

detectSessionStart()

detectSessionEnd()

detectLateNightScrolling()

getInstalledApps()
```

These are not required for the initial version.

---

# 13. Summary

The native API consists of **three core modules**:

```
AppUsageModule
ScrollDetectionModule
AppBlockingModule
```

These modules allow the React Native application to:

* track app usage
* detect scrolling behavior
* block apps when limits are exceeded

The architecture keeps **most business logic in React Native**, while **native code only handles Android system interactions**.
