#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ANDROID_DIR="$ROOT_DIR/android"
LOCAL_JDK_DIR="$HOME/.local/jdks/temurin-21"
LOCAL_JDK_ARCHIVE="$HOME/.local/jdks/temurin-21.tar.gz"
JDK_URL="https://api.adoptium.net/v3/binary/latest/21/ga/linux/x64/jdk/hotspot/normal/eclipse"
ANDROID_SDK_DEFAULT="$HOME/Android/Sdk"
ANDROID_CMDLINE_TOOLS_URL="https://dl.google.com/android/repository/commandlinetools-linux-13114758_latest.zip"

download_jdk() {
  mkdir -p "$HOME/.local/jdks"
  rm -rf "$LOCAL_JDK_DIR"
  mkdir -p "$LOCAL_JDK_DIR"
  rm -f "$LOCAL_JDK_ARCHIVE"

  curl -fL --retry 3 --retry-delay 2 "$JDK_URL" -o "$LOCAL_JDK_ARCHIVE"
  tar -xzf "$LOCAL_JDK_ARCHIVE" -C "$LOCAL_JDK_DIR" --strip-components=1
}

install_android_cmdline_tools() {
  local sdk_root="$1"
  local tools_zip="$sdk_root/cmdline-tools.zip"
  local tools_dir="$sdk_root/cmdline-tools"
  local latest_dir="$tools_dir/latest"

  mkdir -p "$tools_dir"
  rm -f "$tools_zip"

  echo "[toolchain] Installing Android command-line tools..."
  curl -fL --retry 3 --retry-delay 2 "$ANDROID_CMDLINE_TOOLS_URL" -o "$tools_zip"
  rm -rf "$latest_dir" "$tools_dir/cmdline-tools"
  unzip -q "$tools_zip" -d "$tools_dir"
  mv "$tools_dir/cmdline-tools" "$latest_dir"
  rm -f "$tools_zip"
}

ensure_android_packages() {
  local sdk_root="$1"
  local sdkmanager_bin="$sdk_root/cmdline-tools/latest/bin/sdkmanager"

  if [[ ! -x "$sdkmanager_bin" ]]; then
    install_android_cmdline_tools "$sdk_root"
  fi

  export ANDROID_SDK_ROOT="$sdk_root"
  export ANDROID_HOME="$sdk_root"

  set +o pipefail
  yes | "$sdkmanager_bin" --sdk_root="$sdk_root" --licenses >/dev/null
  set -o pipefail
  "$sdkmanager_bin" --sdk_root="$sdk_root" \
    "platform-tools" \
    "platforms;android-36" \
    "build-tools;36.0.0"
}

if [[ ! -x "$LOCAL_JDK_DIR/bin/java" ]]; then
  echo "[toolchain] JDK 21 not found locally. Downloading Temurin JDK 21..."
  download_jdk
fi

export JAVA_HOME="$LOCAL_JDK_DIR"
export PATH="$JAVA_HOME/bin:$PATH"

SDK_DIR="${ANDROID_SDK_ROOT:-${ANDROID_HOME:-}}"

if [[ -z "$SDK_DIR" ]]; then
  for candidate in "$HOME/Android/Sdk" "$HOME/Android/sdk" "$HOME/android-sdk" "/opt/android-sdk"; do
    if [[ -d "$candidate" ]]; then
      SDK_DIR="$candidate"
      break
    fi
  done
fi

if [[ -z "$SDK_DIR" ]]; then
  SDK_DIR="$ANDROID_SDK_DEFAULT"
  ensure_android_packages "$SDK_DIR"
else
  ensure_android_packages "$SDK_DIR"
fi

mkdir -p "$ANDROID_DIR"
printf 'sdk.dir=%s\n' "$(printf '%s' "$SDK_DIR" | sed 's:/:\\/:g')" > "$ANDROID_DIR/local.properties"

echo "[toolchain] JAVA_HOME=$JAVA_HOME"
echo "[toolchain] ANDROID SDK=$SDK_DIR"

cd "$ANDROID_DIR"

if [[ $# -eq 0 ]]; then
  ./gradlew assembleDebug
else
  ./gradlew "$@"
fi