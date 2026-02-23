# Mobile Platform

Environment setup, HMR configuration, platform differences, conditional compilation, and distribution for Tauri v2 Android and iOS applications. Mobile compiles Rust as a native library (`.so` Android / `.a` iOS), frontend runs in system WebView.

<environment_setup>
## Environment setup: SDK, NDK, Xcode, Rust targets

### Android requirements

- **Android Studio** (bundles JDK via JetBrains Runtime)
- SDK Manager: Android SDK Platform, Platform-Tools, **NDK v28+** (Side by side), Build-Tools, Command-line Tools
- NDK v28+ recommended for Google Play 16KB page alignment compliance

| Variable | macOS | Linux | Windows |
|----------|-------|-------|---------|
| `JAVA_HOME` | `/Applications/Android Studio.app/Contents/jbr/Contents/Home` | `/opt/android-studio/jbr` | `C:\Program Files\Android\Android Studio\jbr` |
| `ANDROID_HOME` | `$HOME/Library/Android/sdk` | `$HOME/Android/Sdk` | `$env:LocalAppData\Android\Sdk` |
| `NDK_HOME` | `$ANDROID_HOME/ndk/<version>` | idem | idem |

### iOS requirements

- **macOS + full Xcode** (not just Command Line Tools)
- `brew install cocoapods`
- Free Apple account: device dev. **$99/yr** Apple Developer Program: App Store + TestFlight.

### Rust targets per scenario

| Scenario | Targets | Command |
|----------|---------|---------|
| Android emulator x86_64 | `x86_64-linux-android` | `rustup target add x86_64-linux-android` |
| Android physical ARM | `aarch64-linux-android` | `rustup target add aarch64-linux-android` |
| Android all (CI) | 4 targets | `rustup target add aarch64-linux-android armv7-linux-androideabi i686-linux-android x86_64-linux-android` |
| iOS simulator Apple Silicon | `aarch64-apple-ios-sim` | `rustup target add aarch64-apple-ios-sim` |
| iOS simulator Intel | `x86_64-apple-ios` | `rustup target add x86_64-apple-ios` |
| iOS physical device | `aarch64-apple-ios` | `rustup target add aarch64-apple-ios` |

### gen/ project initialization

`cargo tauri android init` and `cargo tauri ios init` generate native projects in `src-tauri/gen/android/` and `src-tauri/gen/apple/`. **Must be committed to Git.** Regeneration (`init` again) **overwrites customizations** -- only use after major CLI version bump.
</environment_setup>

<mobile_gotchas>
## Mobile gotchas: HMR, WebView, threading, gen/ management

### HMR: localhost vs --host

| Scenario | localhost works? | Solution |
|----------|:----------------:|---------|
| Android emulator | Yes | CLI uses `adb reverse` transparently |
| Android physical (USB) | Yes | Same `adb reverse` mechanism |
| Android physical (WiFi) | No | `--host` flag required |
| iOS simulator | Yes | Shares host network |
| iOS physical | **No** | `--host` flag **mandatory**, sets `TAURI_DEV_HOST` |

Vite config for `TAURI_DEV_HOST`:
```javascript
const host = process.env.TAURI_DEV_HOST;
export default defineConfig({
  server: { host: host || false, port: 1420, strictPort: true,
    hmr: host ? { protocol: 'ws', host, port: 1421 } : undefined },
});
```

**First iOS run**: network permission prompt appears -- accept and restart app.

### WebView engines

| Aspect | iOS (WKWebView) | Android (System WebView) |
|--------|-----------------|--------------------------|
| Engine | WebKit (Safari) | Chromium (Chrome) |
| Updates | Via iOS updates only | Independent via Play Store |
| DevTools | Safari Web Inspector | `chrome://inspect` |
| Tauri protocol | `tauri://` | `https://tauri.localhost` |

### Android main thread constraint

Plugin native commands execute on main thread by default. Long operations cause ANR. Use `Dispatchers.IO` in Kotlin for blocking ops in custom plugins.

### NDK 16KB page alignment

Google Play requires 16KB page-aligned shared libraries. NDK v28+ handles this. For older NDK, add to `.cargo/config.toml`:
```toml
[target.aarch64-linux-android]
rustflags = ["-C", "link-arg=-z", "-C", "link-arg=max-page-size=16384"]
```

### gen/ must be versioned

Commit `gen/android/` and `gen/apple/` to Git. They contain their own `.gitignore`. `tauri.properties` is gitignored by default on Android -- remove from `.gitignore` if using `autoVersionCode`.
</mobile_gotchas>

<platform_differences>
## Platform differences: lib.rs entry, crate types, capabilities, CSS

### lib.rs as main entry point

Mobile compiles as library, not binary: `staticlib` (iOS), `cdylib` (Android), `rlib` (desktop).

```toml
# src-tauri/Cargo.toml
[lib]
name = "app_lib"
crate-type = ["staticlib", "cdylib", "rlib"]
```

```rust
// src-tauri/src/lib.rs
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!()).expect("error");
}
```

```rust
// src-tauri/src/main.rs -- thin desktop wrapper
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
fn main() { app_lib::run(); }
```

### cfg flags

| Flag | When true |
|------|-----------|
| `#[cfg(mobile)]` | Android or iOS |
| `#[cfg(desktop)]` | Windows, macOS, Linux |
| `#[cfg(target_os = "android")]` | Android only |
| `#[cfg(target_os = "ios")]` | iOS only |

### Capabilities with platform field

Separate `desktop.json` and `mobile.json` in `src-tauri/capabilities/`:
```json
{ "identifier": "mobile", "platforms": ["iOS", "android"],
  "permissions": ["barcode-scanner:default", "biometric:default"] }
```

### Safe areas CSS

Add `viewport-fit=cover` to meta viewport. Use `env()` variables:
```css
body { padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left); }
```

### Dark mode iOS gotcha

Zones outside safe area may remain white in dark mode (issue #10579). Status bar customization requires modifying `MainActivity.kt` in `gen/android/`.
</platform_differences>

<conditional_compilation>
## Conditional compilation: plugins, dependencies, capabilities

### Plugin loading per platform

```rust
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut builder = tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_fs::init());

    #[cfg(desktop)]
    { builder = builder.plugin(tauri_plugin_window_state::Builder::default().build()); }

    #[cfg(mobile)]
    { builder = builder.plugin(tauri_plugin_barcode_scanner::init()); }

    builder.run(tauri::generate_context!()).expect("error");
}
```

### Cargo target-specific dependencies

```toml
[target."cfg(not(any(target_os = \"android\", target_os = \"ios\")))".dependencies]
tauri-plugin-updater = "2"
tauri-plugin-window-state = "2"

[target."cfg(any(target_os = \"android\", target_os = \"ios\"))".dependencies]
tauri-plugin-barcode-scanner = "2"
```

### Platform config files

`tauri.android.conf.json` and `tauri.ios.conf.json` are auto-merged (JSON Merge Patch RFC 7396) with the base config for respective builds.
</conditional_compilation>

<distribution>
## Distribution: Google Play, App Store, CI/CD

### Android: AAB signing and versionCode

```bash
keytool -genkey -v -keystore ~/upload-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload
cargo tauri android build --aab
```

**versionCode** auto-derived: `major * 1_000_000 + minor * 1_000 + patch`. Override: `bundle.android.versionCode`. Must be strictly increasing per upload. Google Play dev account: **$25 one-time**.

### iOS: App Review guideline 4.2 risk

| Requirement | Detail |
|-------------|--------|
| Minimum functionality | Must offer features beyond Safari (offline, biometric, haptics) |
| Privacy policy | Must be accessible in-app |
| Account deletion | Required if account creation exists |
| Icons | **No transparency** -- use `pnpm tauri icon /path/icon.png --ios-color '#ffffff'` |
| Upload | `xcrun altool --upload-app --type ios --file <IPA> --apiKey <KEY_ID> --apiIssuer <ISSUER>` |

### CI/CD: GitHub Actions for Android

```yaml
build-android:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-java@v4
      with: { distribution: 'temurin', java-version: '17' }
    - uses: android-actions/setup-android@v3
    - run: sdkmanager "ndk;28.0.12674087"
    - uses: dtolnay/rust-toolchain@stable
      with: { targets: 'aarch64-linux-android,armv7-linux-androideabi,i686-linux-android,x86_64-linux-android' }
    - uses: swatinem/rust-cache@v2
      with: { workspaces: 'src-tauri -> target' }
    - run: pnpm install && pnpm tauri android build --aab
      env: { NDK_HOME: '${{ env.ANDROID_HOME }}/ndk/28.0.12674087' }
```

### CI/CD: GitHub Actions for iOS

```yaml
build-ios:
  runs-on: macos-latest  # REQUIRED for iOS
  steps:
    - uses: actions/checkout@v4
    - uses: dtolnay/rust-toolchain@stable
      with: { targets: aarch64-apple-ios }
    - uses: swatinem/rust-cache@v2
      with: { workspaces: 'src-tauri -> target' }
    - uses: apple-actions/import-codesign-certs@v2
      with: { p12-file-base64: '${{ secrets.APPLE_CERTIFICATE_BASE64 }}', p12-password: '${{ secrets.APPLE_CERTIFICATE_PASSWORD }}' }
    - run: pnpm install && pnpm tauri ios build
      env: { APPLE_DEVELOPMENT_TEAM: '${{ secrets.APPLE_TEAM_ID }}' }
```

**Build time estimates**: Android ~10-20 min cached, iOS ~15-30 min cached. iOS runners cost **$0.08/min** for private repos (10x Linux). `swatinem/rust-cache` is essential. `tauri-action` mobile support is **experimental**.
</distribution>

<anti_patterns>
## Anti-patterns

| Anti-pattern | Problem | Correct approach |
|-------------|---------|-----------------|
| Missing `crate-type` in Cargo.toml | Compilation fails on mobile | `["staticlib", "cdylib", "rlib"]` |
| `main.rs` as only entry point | No mobile entry point | Use `lib.rs` with `#[cfg_attr(mobile, tauri::mobile_entry_point)]` |
| Desktop-only plugin without `#[cfg(desktop)]` | Compile error on mobile | Guard with `#[cfg(desktop)]` or target-specific dep |
| HMR without `--host` on physical iOS | Cannot connect to dev server | Always use `--host` for physical devices |
| `tauri android/ios init` to fix issues | Overwrites all customizations | Only use after major CLI upgrade |
| nvm/fnm for Node.js with Xcode | Node not found in Xcode build phase | Use system Node.js or configure PATH in Xcode |
| `armv7-linux-androideabi` with OpenSSL | Build fails (issue #9582) | Avoid OpenSSL or use `rustls` feature |
| Transparent iOS icons | App Store rejection | Use `--ios-color '#ffffff'` flag |
</anti_patterns>

<troubleshooting>
## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| HMR not working on physical device | Dev server on localhost only | Use `--host` flag, configure `TAURI_DEV_HOST` in Vite |
| iOS first run hangs after permission prompt | Network permission dialog | Accept prompt, restart app |
| ANR on Android during command | Plugin command on main thread | Use `Dispatchers.IO` in Kotlin plugin code |
| `env(safe-area-inset-*)` not working Android | SDK 35+ bug (issue #14142) | Test on target devices, use fallback padding |
| Build fails with OpenSSL on Android | Cross-compilation issue | Use `rustls` feature instead of native TLS |
| Dark mode white areas on iOS | Known bug (issue #10579) | Apply background color to root element covering full viewport |
| gen/ customizations lost | Ran `tauri android/ios init` again | Restore from Git, only regenerate on major CLI bumps |
| versionCode not incrementing | Using default derivation with same semver | Set explicit `bundle.android.versionCode` or bump version |
| App rejected by Apple (4.2) | "Web clipping" -- insufficient native features | Add biometric, haptics, offline support, or notifications |
| Node not found during Xcode build | nvm/fnm not in Xcode environment | Install Node.js via Homebrew system-wide |
</troubleshooting>
