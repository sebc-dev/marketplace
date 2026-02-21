# Configuration & Project Structure

Tauri v2 project layout, tauri.conf.json schema, Cargo features, build hooks, platform overlays, and v1-to-v2 migration. For CLI command details, use WebFetch with v2.tauri.app docs.

<project_structure>
```
src-tauri/
  Cargo.toml              # Manifest: deps, features, [lib] crate-type
  Cargo.lock              # Lock file (COMMIT this)
  build.rs                # tauri_build::build() -- single line
  tauri.conf.json         # Main config (JSON default, JSON5/TOML optional)
  src/
    lib.rs                # ALL app code + #[cfg_attr(mobile, tauri::mobile_entry_point)]
    main.rs               # Thin desktop wrapper -- DO NOT MODIFY
  capabilities/
    default.json          # ACL permissions ($schema for IDE autocompletion)
  icons/                  # Generated via `tauri icon`
  gen/
    schemas/              # Auto-generated: desktop-schema.json, mobile-schema.json
    android/              # Android Studio project (COMMIT, has own .gitignore)
    apple/                # Xcode project (COMMIT, has own .gitignore)
```

**lib.rs** = all app code with `#[cfg_attr(mobile, tauri::mobile_entry_point)]`. Mobile requires compilation as library (`staticlib` for iOS, `cdylib` for Android). Attribute is a no-op on desktop.

**main.rs** = `fn main() { app_lib::run(); }` -- thin wrapper, DO NOT MODIFY. `#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]` hides console on Windows release.

**Cargo.toml `[lib]`:** `crate-type = ["staticlib", "cdylib", "lib"]` -- required for mobile support.

**build.rs:** `tauri_build::build()` -- config validation, capability schemas, asset embedding, `cfg(desktop)`/`cfg(mobile)` flags.

**gen/schemas/:** Can be `.gitignore`-ed. **gen/android/ and gen/apple/:** MUST be committed (contain modifiable AndroidManifest.xml, Info.plist).

**.taurignore:** `.gitignore` syntax in `src-tauri/` to exclude files from dev watcher.
</project_structure>

<config_schema>
**Format:** JSON (default), JSON5 (`config-json5` feature), TOML (`config-toml` feature, `Tauri.toml`). Features must be enabled on BOTH `tauri` and `tauri-build`.

**Top-level keys:**

| Key | Type | Required | Description |
|-----|------|----------|-------------|
| `$schema` | string | No | `https://schema.tauri.app/config/2` |
| `productName` | string? | No | Display name (no `/\:*?"<>\|` chars) |
| `mainBinaryName` | string? | No | Binary name (no `.exe`). Derived from Cargo.toml if absent |
| `version` | string? | No | Semver or path to `package.json` |
| `identifier` | string | **Yes** | Reverse-domain `[A-Za-z0-9-.]` |

**`build` section:**

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `devUrl` | string? | null | Dev server URL (`http://localhost:5173`) |
| `frontendDist` | string? | null | Built assets path (`../dist`) |
| `beforeDevCommand` | string \| HookCommand? | null | Runs before `tauri dev` |
| `beforeBuildCommand` | string \| HookCommand? | null | Runs before `cargo build` |
| `beforeBundleCommand` | string \| HookCommand? | null | After Rust build, before packaging |
| `removeUnusedCommands` | boolean | false | Strip unused ACL commands from binary (v2.4+) |

**`app` section:** `withGlobalTauri` (false, security risk), `security.csp`, `security.pattern` (brownfield/isolation), `security.capabilities` (empty = all from dir), `security.headers` (COOP/COEP), `security.freezePrototype`, `windows[]` (label, title, size, `create: false` for deferred).

**Notable window props:** `useHttpsScheme` (v1 migration), `windowEffects` (Mica/Acrylic), `theme`, `titleBarStyle`, `backgroundThrottling`.

**`bundle` section:**
- `active: true` to generate installers
- `targets`: `"all"` or `["deb","rpm","appimage","nsis","msi","app","dmg"]`
- `resources`: globs or source->destination mapping
- `createUpdaterArtifacts`: `false` | `true` | `"v1Compatible"`

**`plugins` section:** Keys = plugin name without `tauri-plugin-` prefix. Each plugin defines its own config schema.

**Platform overlays** -- `tauri.{platform}.conf.json` merged via RFC 7396:
- Objects: recursive deep merge
- Arrays: **REPLACED entirely** (not merged)
- `null` values: delete the key
- Priority: base -> platform -> `--config` CLI (stacked sequentially)

```bash
tauri build --config src-tauri/tauri.beta.conf.json --config '{"identifier":"com.app.beta"}'
```

**No env var interpolation** in tauri.conf.json (parsed as static JSON). Only `{{target}}`/`{{current_version}}` in updater endpoints.
</config_schema>

<cargo_features>
**Default features (5):** `wry`, `compression`, `common-controls-v6`, `dynamic-acl`, `x11`.

| Feature | Description | Impact |
|---------|-------------|--------|
| `tray-icon` | System notification area icon | Enables tray API |
| `devtools` | WebView inspector | Required for debugging |
| `protocol-asset` | Asset protocol for local files | Serves filesystem files |
| `isolation` | Sandboxed IPC via iframe | AES-GCM encrypted IPC |
| `config-json5` | JSON5 format support | Comments, trailing commas |
| `config-toml` | TOML format (Tauri.toml) | Kebab-case config |
| `macos-private-api` | Transparent background, fullscreen | **Blocks App Store submission** |
| `macos-proxy` | Proxy config on macOS | Requires macOS 14+ |
| `tracing` | Instrumentation spans | Startup, plugins, IPC perf |
| `image-ico` / `image-png` | ICO/PNG format support | Image handling |
| `linux-libxdo` | libxdo on Linux | Tray/menus support |
| `native-tls` / `rustls-tls` | TLS backends | HTTP plugin dependency |
| `unstable` | Experimental APIs | Multiwebview etc. |
| `specta` | Specta integration | Type-safe IPC |
| `custom-protocol` | Serve embedded assets | **Auto-managed by CLI** |
| `linux-protocol-body` | Full IPC on webkit2gtk < 2.40 | Activates via wry chain |

**CLI auto-management:** `tauri dev` removes `custom-protocol`, activates dev server. `tauri build` adds `custom-protocol` automatically.

**Release profile (optimized for size):**
```toml
[profile.release]
codegen-units = 1    # Better LLVM optimization (slower compile)
lto = true           # Link-time optimization (slower compile)
opt-level = "s"      # Optimize for binary size
panic = "abort"      # No stack unwinding -> smaller binary
strip = true         # Remove debug symbols
```

**`removeUnusedCommands`** (v2.4+): strips commands not referenced in capabilities. Can reduce binary by ~51%. Enable in `build` section.

**Impact:** `lto + codegen-units=1` adds significant compile time but reduces binary 30-50%.
</cargo_features>

<build_hooks>
**HookCommand format:** string or `{ "script": "...", "cwd": "...", "wait": false }`.

| Hook | When | Typical use |
|------|------|-------------|
| `beforeDevCommand` | Before `tauri dev` starts | `pnpm run dev` (dev server) |
| `beforeBuildCommand` | Before `cargo build` | `pnpm run build` (frontend compile) |
| `beforeBundleCommand` | After Rust build, before packaging | Sign binary, post-process |

`wait: false` in `beforeDevCommand` -- don't wait for dev server to exit (it runs continuously).

**Environment variables set by CLI:**

| Variable | Values | Usage |
|----------|--------|-------|
| `TAURI_ENV_PLATFORM` | `windows`, `darwin`, `linux` | Platform detection |
| `TAURI_ENV_ARCH` | `x86_64`, `aarch64` | Architecture |
| `TAURI_ENV_DEBUG` | `true` / `false` | Debug mode |
| `TAURI_ENV_FAMILY` | `unix`, `windows` | Platform family |
| `TAURI_ENV_TARGET_TRIPLE` | `x86_64-unknown-linux-gnu` etc. | Full target triple |
| `TAURI_DEV_HOST` | IP address | Mobile HMR |
| `TAURI_SIGNING_PRIVATE_KEY` | Key content | CI/CD signing |

**Vite config:** `envPrefix: ["VITE_", "TAURI_"]`, build target `es2021` + `chrome97` (Windows) or `safari13` (others), conditional minify/sourcemap based on `TAURI_DEBUG`.
</build_hooks>

<migration_v1_v2>
**Config renames:**

| V1 | V2 | Notes |
|----|-----|-------|
| `package > productName` | `productName` (root) | Hoisted |
| `package > version` | `version` (root) | Hoisted |
| `tauri > bundle > identifier` | `identifier` (root) | Hoisted |
| `tauri > *` | `app > *` | `tauri` renamed to `app` |
| `build > devPath` | `build > devUrl` | URLs only now |
| `build > distDir` | `build > frontendDist` | Renamed |
| `tauri > allowlist` | **REMOVED** -> capabilities | ACL system |
| `tauri > systemTray` | `app > trayIcon` | Renamed |
| `tauri > updater` | `plugins > updater` | Moved to plugin |
| `tauri > cli` | `plugins > cli` | Moved to plugin |

**Windows protocol change:** V1 = `https://tauri.localhost`, V2 = `http://tauri.localhost`. IndexedDB, LocalStorage, Cookies **lost on upgrade**. Fix: `"useHttpsScheme": true` per window.

**JS API changes:**

| V1 | V2 |
|----|-----|
| `@tauri-apps/api/tauri` -> `invoke` | `@tauri-apps/api/core` -> `invoke` |
| `Window` class | `WebviewWindow` class |
| `@tauri-apps/api/fs` | `@tauri-apps/plugin-fs` (separate plugin) |
| `@tauri-apps/api/http` | `@tauri-apps/plugin-http` (separate plugin) |
| `@tauri-apps/api/dialog` | `@tauri-apps/plugin-dialog` (separate plugin) |

Only `core`, `path`, `event`, `webviewWindow` remain in `@tauri-apps/api`. All others are now `@tauri-apps/plugin-*`.

**Env var renames:** `TAURI_PRIVATE_KEY` -> `TAURI_SIGNING_PRIVATE_KEY`, `TAURI_DEBUG` -> `TAURI_ENV_DEBUG`, `TAURI_PLATFORM` -> `TAURI_ENV_PLATFORM`.

**Migration command:** `cargo tauri migrate` automates config conversion, plugin installation, capability generation.
</migration_v1_v2>

<anti_patterns>
| Don't | Do | Severity |
|-------|-----|----------|
| Put app code in `main.rs` | All code in `lib.rs` with mobile entry point attr | CRITICAL |
| Omit `crate-type` in `[lib]` | `["staticlib", "cdylib", "lib"]` for mobile compat | CRITICAL |
| Use V1 `tauri > allowlist` | Migrate to capabilities/permissions system | CRITICAL |
| Skip `useHttpsScheme: true` in V1->V2 migration | Set per window to preserve user data (IndexedDB, etc.) | CRITICAL |
| Expect env var interpolation in config | Config is static JSON; use `--config` for overrides | HIGH |
| Add `Arc` around managed state | Tauri wraps in `Arc` automatically | HIGH |
| Enable `macos-private-api` for production | Blocks App Store submission | HIGH |
| Edit `gen/android/` without committing | Must be committed (modifiable native project files) | MEDIUM |
| Use `lto = true` in dev profile | Only for release -- adds massive compile time | MEDIUM |
</anti_patterns>

<troubleshooting>
| Symptom | Cause | Fix |
|---------|-------|-----|
| IndexedDB/LocalStorage lost after V1->V2 update | Protocol changed `https://` to `http://` on Windows | Add `"useHttpsScheme": true` to each window config |
| rust-analyzer not finding project | `src-tauri/` not auto-discovered | Add `"rust-analyzer.linkedProjects": ["src-tauri/Cargo.toml"]` |
| `cfg(mobile)` not defined | `build.rs` missing `tauri_build::build()` | Ensure build.rs calls `tauri_build::build()` |
| Platform overlay arrays not merging | RFC 7396: arrays are REPLACED entirely | Duplicate full array in platform config |
| `removeUnusedCommands` strips needed command | Command not referenced in any capability | Add permission for the command in capabilities |
| Binary too large in release | Missing release profile optimizations | Add `lto=true`, `codegen-units=1`, `opt-level="s"`, `strip=true` |
| Brotli compression increases binary for tiny assets | ~170 KiB lookup table overhead | Disable `compression` feature for very small apps |
| `tauri icon` fails | Source image < 1024x1024 or not square | Use square PNG/SVG, minimum 1024x1024px |
| Dev server not triggering reload | File not watched | Add path to `build.additionalWatchFolders` or check `.taurignore` |
| `--config` not applying | JSON syntax error in inline config | Validate JSON; multiple `--config` flags stack sequentially |
</troubleshooting>
