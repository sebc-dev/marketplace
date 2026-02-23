# Plugin Ecosystem

Tauri v2 official plugins matrix, installation pattern, critical interactions, mobile-specific plugins, and community plugins. For exact plugin API details, use WebFetch with v2.tauri.app/plugin/.

<plugin_matrix>
**30+ official plugins.** Platform key: W=Windows, M=macOS, L=Linux, A=Android, I=iOS.

| Plugin | npm/cargo ver | W | M | L | A | I | Category | Size impact |
|--------|--------------|---|---|---|---|---|----------|-------------|
| **fs** | ~2.4.5 | x | x | x | x | x | Storage | +0.27 MB |
| **store** | ~2.4.2 | x | x | x | x | x | Storage | +0.11 MB |
| **sql** | ~2.3.0 | x | x | x | x | x | Storage | moderate |
| **stronghold** | ~2.2.0 | x | x | x | x | x | Storage | moderate |
| **persisted-scope** | ~2.3.4 | x | x | x | x | x | Storage | minimal |
| **http** | ~2.5.7 | x | x | x | x | x | Network | moderate |
| **websocket** | ~2.4.2 | x | x | x | x | x | Network | moderate |
| **upload** | ~2.3.2 | x | x | x | x | x | Network | moderate |
| **dialog** | ~2.6.0 | x | x | x | x | x | UI | +0.13 MB |
| **notification** | ~2.3.3 | x | x | x | x | x | UI | moderate |
| **clipboard-manager** | ~2.3.2 | x | x | x | x | x | UI | minimal |
| **opener** | ~2.5.x | x | x | x | x | x | UI | minimal |
| **global-shortcut** | ~2.2.x | x | x | x | - | - | UI | minimal |
| **positioner** | ~2.3.0 | x | x | x | - | - | UI | minimal |
| **window-state** | ~2.4.1 | x | x | x | - | - | UI | minimal |
| **os** | ~2.3.1 | x | x | x | x | x | System | minimal |
| **process** | ~2.3.0 | x | x | x | x | x | System | minimal |
| **shell** | ~2.3.4 | x | x | x | - | - | System | **+1.38 MB** |
| **cli** | ~2.4.0 | x | x | x | - | - | System | **+0.7 MB** |
| **autostart** | ~2.5.1 | x | x | x | - | - | System | minimal |
| **single-instance** | ~2.3.6 | x | x | x | - | - | System | minimal |
| **log** | ~2.7.x | x | x | x | x | x | System | +0.12 MB |
| **updater** | ~2.10.0 | x | x | x | - | - | Lifecycle | **+0.91 MB** |
| **deep-link** | ~2.4.6 | x | x | x | x | x | Lifecycle | minimal |
| **localhost** | ~2.3.2 | x | x | x | - | - | Lifecycle | minimal |
| **barcode-scanner** | ~2.4.2 | - | - | - | x | x | Mobile | minimal |
| **biometric** | ~2.3.2 | - | - | - | x | x | Mobile | minimal |
| **nfc** | ~2.3.4 | - | - | - | x | x | Mobile | minimal |
| **geolocation** | ~2.3.2 | - | - | - | x | x | Mobile | minimal |
| **haptics** | ~2.3.2 | - | - | - | x | x | Mobile | minimal |

**Desktop-only:** global-shortcut, positioner, window-state, shell (spawn), cli, autostart, single-instance, updater, localhost.
**Mobile-only:** barcode-scanner, biometric, nfc, geolocation, haptics.
</plugin_matrix>

<installation_pattern>
**Universal 4-step process for every plugin:**

1. **Cargo dep:** `cargo tauri add <plugin>` (shortcut) or manual in `src-tauri/Cargo.toml`
2. **npm package:** `npm add @tauri-apps/plugin-<name>`
3. **Builder registration:** `.plugin(tauri_plugin_<name>::init())` in `lib.rs`
4. **Capabilities:** Add permissions in `src-tauri/capabilities/default.json`

**Permission syntax:** `<plugin>:<permission>` -- e.g., `fs:default`, `fs:allow-read-file`, `fs:deny-write-file`.

**Version sync requirement (since v2.2.0):** npm and Cargo versions MUST match exactly (e.g., `@tauri-apps/plugin-http@2.5.7` requires `tauri-plugin-http = "2.5.7"`).

**`default` permission set:** Enables commonly-needed commands. Granular `allow-*`/`deny-*` auto-generated for every command. **Deny always beats allow.**

**Scopes:** Further restrict commands to specific paths, URLs, or resources:
```json
{
  "identifier": "http:default",
  "allow": [{ "url": "https://api.example.com/*" }],
  "deny": [{ "url": "https://api.example.com/admin/*" }]
}
```

**Rust-only plugins** (no npm package): persisted-scope, single-instance, localhost.
</installation_pattern>

<plugin_interactions>
**Order matters in two critical cases:**

```rust
tauri::Builder::default()
    .plugin(tauri_plugin_single_instance::init(|app, argv, cwd| {
        // FIRST -- intercepts before other plugins
    }))
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_persisted_scope::init()) // AFTER fs -- hooks into scope system
    // ... other plugins in any order
```

| Rule | Consequence if violated |
|------|------------------------|
| `single-instance` must be FIRST | Duplicate instances not prevented |
| `persisted-scope` must follow `fs` | Silently fails (dev-mode warning only) |

**The Dialog -> FS -> Persisted-scope chain:**
1. User selects file via Dialog `open()`
2. Path auto-added to FS scope (no pre-config needed)
3. Persisted-scope saves grant to disk
4. On restart, persisted-scope restores the scope
5. Enables "recent files" behavior without hardcoding paths

**Platform-conditional loading:**
```toml
# Cargo.toml -- desktop-only dependency
[target.'cfg(not(any(target_os = "android", target_os = "ios")))'.dependencies]
tauri-plugin-global-shortcut = "2"
```

```rust
// lib.rs -- guarded registration
#[cfg(desktop)]
app.handle().plugin(tauri_plugin_global_shortcut::Builder::new().build())?;
```

Mobile-only: inverse guard `cfg(any(target_os = "android", target_os = "ios"))` + `#[cfg(mobile)]`. Capabilities use `"platforms": ["iOS", "android"]` or `["windows", "macOS", "linux"]`.

**Plugin config** in `tauri.conf.json` under `plugins.<name>` (without `tauri-plugin-` prefix):
```json
{ "plugins": { "updater": { "endpoints": ["..."], "pubkey": "..." } } }
```
</plugin_interactions>

<mobile_plugins>
All 5 use `#[cfg(mobile)]` guard and `[target.'cfg(any(target_os = "android", target_os = "ios"))'.dependencies]`.

| Plugin | Key API | iOS requirements | Android requirements |
|--------|---------|------------------|---------------------|
| **barcode-scanner** | `scan({ windowed, formats })` | `NSCameraUsageDescription` in Info.plist | Camera permission |
| **biometric** | `checkStatus()`, `authenticate(reason)` | `NSFaceIDUsageDescription` | BiometricPrompt API |
| **nfc** | `scan({ type: 'ndef' })`, `write()` | deployment target >= 14.0, `NFCReaderUsageDescription`, NFC entitlement | NFC permission |
| **geolocation** | `getCurrentPosition()`, `watchPosition()` | `NSLocationWhenInUseUsageDescription` | Location permissions (auto-added) |
| **haptics** | `impactFeedback()`, `vibrate(duration)` | None (UIKit) | Vibration permission |

**Barcode scanner:** `windowed: true` makes entire webview transparent (build overlay in HTML). UPC_A/Codabar not on iOS. GS1DataBar iOS 15.4+ only.

**Biometric:** Authentication only -- NO Keychain/Keystore integration. `allowDeviceCredential` for PIN fallback.

**NFC:** `keepSessionAlive: true` for scan-then-write. mimeType/URI filtering Android-only. No background reading on iOS.

**Geolocation:** Mirrors Web Geolocation API. No documented background tracking. Desktop alternative: `navigator.geolocation`.

**Haptics:** Android behavior inconsistent on budget phones (may fallback to simple vibration).
</mobile_plugins>

<community_plugins>
**Type-safe IPC:**

| Plugin | Approach | Recommendation |
|--------|----------|----------------|
| **tauri-specta** | `#[specta::specta]` on standard commands, generates TS bindings | Best for existing projects (no refactor) |
| **taurpc** | Trait-based API (replaces command pattern) | More structured, bigger migration |

**Essential utilities:**
- **tauri-plugin-prevent-default** -- disables browser shortcuts (F3, Ctrl+J, right-click) leaking through webview. Virtually required for production desktop apps.
- **tauri-plugin-decorum** -- custom titlebar styling, macOS traffic light positioning, Windows Snap Layout support.

**State persistence:**
- **tauri-plugin-pinia** (tauri-store ecosystem) -- persistent Vue Pinia stores with cross-window sync, multiple serialization formats (JSON, CBOR, RON, TOML). Also: `tauri-plugin-svelte` for Svelte stores.

**Extended capabilities:**
- **tauri-plugin-clipboard** (CrossCopy) -- RTF, file clipboard, clipboard monitoring (absent from official).
- **tauri-plugin-serialplugin** -- V2-native serial port communication.
- **tauri-plugin-fs-pro** -- tar.gz compression, directory size, move operations.

**Monitoring:**
- **tauri-plugin-sentry** (timfish) -- merges browser + Rust error contexts, minidump support. Recommended by Sentry.
- **tauri-plugin-aptabase** -- privacy-first analytics.

**Obsolete for V2:** `tauri-plugin-context-menu` (use V2 built-in Menu API), `tauri-plugin-theme` (use built-in `setTheme()`).
</community_plugins>

<anti_patterns>
| Don't | Do | Severity |
|-------|-----|----------|
| Register `single-instance` after other plugins | Register FIRST in the builder chain | CRITICAL |
| Register `persisted-scope` before `fs` | Register AFTER `fs` plugin | CRITICAL |
| Mismatch npm/Cargo plugin versions | Exact version sync since v2.2.0 | CRITICAL |
| Use `fs:default` without scopes on sensitive data | Granular permissions + explicit scope variables | HIGH |
| Skip platform guard on desktop-only plugin | Use `#[cfg(desktop)]` + conditional Cargo deps | HIGH |
| `http:default` expecting all URLs allowed | Default allows NO URLs -- add explicit scope | HIGH |
| Expect `dialog:open()` folder selection on mobile | Android/iOS cannot select folders | MEDIUM |
| Call `listen()` on mobile for global-shortcut events | Plugin is desktop-only | MEDIUM |
| Expect clipboard image/html on mobile | Mobile supports plain text only | MEDIUM |
| Use `tauri-plugin-context-menu` with V2 | Obsolete -- use V2 built-in Menu API | MEDIUM |
</anti_patterns>

<troubleshooting>
| Symptom | Cause | Fix |
|---------|-------|-----|
| `persisted-scope` silently fails | Registered before `fs` plugin | Move after `fs` in builder chain |
| Duplicate app instances despite `single-instance` | Not registered as first plugin | Move to first position in builder |
| HTTP requests blocked at runtime | `http:default` allows no URLs by default | Add URL patterns to scope `allow` |
| Plugin version conflict error | npm/Cargo version mismatch | Ensure exact version sync (since v2.2.0) |
| Desktop plugin crashes on mobile build | Missing `#[cfg(desktop)]` guard | Add conditional compilation + platform Cargo deps |
| `dialog:open()` returns null on Android | Folder selection not supported | Use file selection mode on mobile |
| Notification shows PowerShell icon (Windows dev) | Dev mode limitation on Windows | Normal in dev; correct in production builds |
| `global-shortcut` registration silently fails | Another app holds the shortcut | `isRegistered()` only checks own registrations |
| File handle resource leak | `open()` handle not closed | Always call `close()` on file handles |
| `deep-link` spawns new instance (Windows/Linux) | Default behavior unlike macOS | Combine with `single-instance` (feature `deep-link`) |
| Updater signature verification fails | `TAURI_SIGNING_PRIVATE_KEY` not set as real env var | `.env` files don't work -- use actual env var |
| `localhost` plugin security risk | Any local process can access served assets | Only use when web APIs require HTTP origin |
</troubleshooting>
