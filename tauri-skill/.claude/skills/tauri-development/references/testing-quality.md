# Testing & Quality

Frontend mocking, Rust testing with MockRuntime, E2E with tauri-driver, debugging strategies, and tracing/monitoring for Tauri v2 applications. Test ecosystem is young but functional -- invest primarily in unit tests on both sides of the IPC boundary.

<frontend_mocking>
## Frontend mocking: @tauri-apps/api/mocks, Vitest setup, plugin mocking

### Vitest + jsdom setup with crypto polyfill

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: { environment: 'jsdom', globals: true, setupFiles: ['./tests/setup.ts'] },
});

// tests/setup.ts
import { randomFillSync } from 'crypto';
import { afterEach } from 'vitest';
import { clearMocks } from '@tauri-apps/api/mocks';

Object.defineProperty(window, 'crypto', {
  value: { getRandomValues: (buffer: Buffer) => randomFillSync(buffer) },
});
afterEach(() => clearMocks());  // MANDATORY in afterEach
```

### mockIPC and mockWindows

```typescript
import { mockIPC, mockWindows } from '@tauri-apps/api/mocks';
mockWindows('main');
mockIPC((cmd, args) => {
  switch (cmd) {
    case 'greet': return `Hello, ${args.name}!`;
    case 'list_items': return mockDb;
  }
}, { shouldMockEvents: true }); // Event mocking since v2.7.0
```

### Plugin mocking: vi.mock() preferred over mockIPC

Plugin IPC names are internal (`plugin:<name>|<command>`), undocumented, and may change. **Use `vi.mock()` instead**:

```typescript
vi.mock('@tauri-apps/plugin-fs', () => ({
  readTextFile: vi.fn().mockResolvedValue('mocked content'),
  writeTextFile: vi.fn().mockResolvedValue(undefined),
  exists: vi.fn().mockResolvedValue(true),
}));

vi.mock('@tauri-apps/plugin-dialog', () => ({
  open: vi.fn().mockResolvedValue('/selected/path.txt'),
  save: vi.fn().mockResolvedValue('/save/path.txt'),
  ask: vi.fn().mockResolvedValue(true),
}));
```

HTTP plugin (`@tauri-apps/plugin-http`) uses Channel API for streaming -- module-level mocking is quasi-mandatory.

### Channel mocking workaround

No dedicated mock function. Retrieve channel ID from `mockIPC` payload, call `window['_' + channelId](data)` manually. This is an internal implementation detail.

### Rules

- **`clearMocks()` in `afterEach` is mandatory** -- mocks accumulate across tests
- Import `invoke` from `@tauri-apps/api/core` (not `/tauri` like v1)
- `shouldMockEvents: true` required for `listen()`, `once()`, `emit()` mocking
- `emitTo` is NOT supported by event mocking -- only global `emit` works
</frontend_mocking>

<rust_testing>
## Rust testing: tauri::test module, MockRuntime, State, IPC

### Setup

```toml
[dev-dependencies]
tauri = { version = "2", features = ["test"] }
```

Feature `test` is unstable but usable. Provides `mock_builder()`, `mock_app()`, `mock_context(noop_assets())`.

### Commands must be generic on R: Runtime

```rust
// CORRECT -- works with MockRuntime
#[tauri::command]
fn greet<R: tauri::Runtime>(app: tauri::AppHandle<R>, name: &str) -> String {
    format!("Hello, {}!", name)
}

// FAILS to compile in tests
#[tauri::command]
fn greet_bad(app: tauri::AppHandle, name: &str) -> String { /* ... */ }
```

### State testing via mock_app().manage()

`State<T>` has no public constructor -- must use `manage()`:

```rust
#[test]
fn test_with_state() {
    let app = tauri::test::mock_app();
    app.manage(AppState { counter: Mutex::new(0) });
    let result = increment(app.state::<AppState>());
    assert_eq!(result, 1);
}
```

### IPC testing with InvokeRequest + INVOKE_KEY

```rust
tauri::test::assert_ipc_response(
    &webview,
    tauri::webview::InvokeRequest {
        cmd: "ping".into(),
        callback: tauri::ipc::CallbackFn(0),
        error: tauri::ipc::CallbackFn(1),
        url: "http://tauri.localhost".parse().unwrap(),
        body: tauri::ipc::InvokeBody::default(),
        headers: Default::default(),
        invoke_key: tauri::test::INVOKE_KEY.to_string(),
    },
    Ok("pong"),
);
```

INVOKE_KEY bypasses ACL system -- no capability test from unit tests. Use E2E for permission enforcement testing.

### Async deadlock detection

```rust
#[tokio::test]
async fn test_no_deadlock() {
    let result = tokio::time::timeout(Duration::from_secs(5), async {
        // potentially blocking operations
    }).await;
    assert!(result.is_ok(), "Timeout -- probable deadlock");
}
```

Use `tokio::sync::Mutex` when lock must be held across `.await` points. `std::sync::Mutex` in async context risks deadlock.
</rust_testing>

<e2e_tauri_driver>
## E2E: tauri-driver, WebdriverIO, alternatives

### tauri-driver v2.0.4: Linux + Windows only, NO macOS

macOS unsupported (issue #7068) -- Apple provides no WebDriver for WKWebView. `safaridriver` only controls Safari, not embedded WebViews.

| Requirement | Linux | Windows |
|-------------|-------|---------|
| Driver | `webkit2gtk-driver` (from system packages) | `msedgedriver` (must match Edge version) |
| Headless | `xvfb-run` required | Not needed |
| Browser name | `wry` | `wry` |

### WebdriverIO config

```javascript
// wdio.conf.js
exports.config = {
  capabilities: [{ browserName: 'wry', 'tauri:options': { application: '../src-tauri/target/release/my-app' } }],
};
```

### Alternative E2E approaches

| Capability | tauri-driver | Playwright (dev server) | tauri-remote-ui |
|-----------|:------------:|:----------------------:|:---------------:|
| DOM interactions | Yes | Yes | Yes |
| Real Rust backend | Yes | No (mocked) | Yes |
| Native dialogs | No | No | No |
| Multi-window | Partial | No | Partial |
| macOS support | **No** | Yes (frontend only) | Yes |
| CI headless | Yes (xvfb) | Yes | Yes |

Playwright on `http://localhost:1420` tests frontend but not native features. `tauri-remote-ui` (community plugin) exposes UI via WebSocket for Playwright against running app.
</e2e_tauri_driver>

<debugging>
## Debugging: DevTools, VS Code, mobile, deadlocks

### DevTools shortcuts

- **Windows/Linux**: `Ctrl+Shift+I`
- **macOS**: `Cmd+Option+I`

`devtools` Cargo feature enables inspector in production builds -- **blocks Mac App Store submission** (private WebKit API).

### VS Code: CodeLLDB + tasks.json

```json
// .vscode/tasks.json
{ "tasks": [{ "label": "ui:dev", "type": "shell", "isBackground": true,
  "command": "npm", "args": ["run", "dev"],
  "problemMatcher": { "owner": "custom", "pattern": { "regexp": "^$" },
    "background": { "activeOnStart": true, "beginsPattern": ".", "endsPattern": "Local:\\s+https?://localhost" }
}}]}

// .vscode/launch.json
{ "configurations": [{ "type": "lldb", "request": "launch", "name": "Tauri Rust Debug",
  "cargo": { "args": ["build", "--manifest-path=./src-tauri/Cargo.toml", "--no-default-features"] },
  "preLaunchTask": "ui:dev"
}]}
```

`--no-default-features` tells Tauri to use dev server (not disk assets). **Simultaneous Rust + frontend debug: Windows only** (via `msedge` type with `useWebView: true`).

### Mobile debugging

| Platform | WebView | Rust logs |
|----------|---------|-----------|
| Android | `chrome://inspect` in Chrome | `adb logcat \| grep "Tauri"` |
| iOS | Safari Web Inspector (enable in device Settings > Safari > Advanced) | Console.app or Xcode Console |
</debugging>

<tracing>
## Tracing: feature flag, tracing-subscriber, CrabNebula DevTools, Sentry

### Feature flag "tracing" on tauri crate

Instruments: window startup, plugin init, `Window::eval()`, events, IPC handling, updater, custom protocol handlers.

```rust
tracing_subscriber::fmt()
    .with_max_level(tracing::Level::DEBUG)
    .with_env_filter("my_app=trace,tauri=debug,tauri::ipc=trace")
    .init();
```

### CrabNebula DevTools (tauri-plugin-devtools)

IPC visualization with timing breakdown (deserialization, handler, serialization). Rust log inspection. Config viewer. Asset explorer.

**NOT compatible with `tauri-plugin-log`** -- both register a global logger. Use `#[cfg(debug_assertions)]` guard:

```rust
#[cfg(debug_assertions)]
{ builder = builder.plugin(tauri_plugin_devtools::init()); }
#[cfg(not(debug_assertions))]
{ builder = builder.plugin(tauri_plugin_log::Builder::new().build()); }
```

### Sentry: tauri-plugin-sentry v0.5

Community plugin (experimental). Captures JS errors (via `@sentry/browser`), Rust panics, native crash dumps (except iOS). Single maintainer -- evaluate reliability for production.

### Aptabase: tauri-plugin-aptabase

Privacy-first analytics with panic capture hook. Lighter than Sentry, fewer capabilities.

### Production panic handling

- `panic = "unwind"` (default): allows panic hooks and `catch_unwind()`
- `panic = "abort"`: smaller binary but no unwinding
- **Always return `Result<T, E>` from commands** -- never `unwrap()`. Panic in sync command crashes entire app.
</tracing>

<anti_patterns>
## Anti-patterns

| Anti-pattern | Problem | Correct approach |
|-------------|---------|-----------------|
| Missing `clearMocks()` in `afterEach` | Mocks accumulate, tests interfere | Always call `clearMocks()` in `afterEach` |
| `unwrap()` in Tauri commands | Panic crashes entire app | Return `Result<T, E>` with serializable error |
| Non-generic commands with `AppHandle` | Won't compile with MockRuntime | `fn cmd<R: Runtime>(app: AppHandle<R>)` |
| `mockIPC` for plugin commands | Internal IPC names undocumented, may change | Use `vi.mock()` at module level |
| `generate_context!()` in integration tests | macOS symbol conflict `_EMBED_INFO_PLIST` | Use `mock_context(noop_assets())` |
| `std::sync::Mutex` held across `.await` | Deadlock in async context | Use `tokio::sync::Mutex` |
| `tauri-plugin-devtools` + `tauri-plugin-log` | Both register global logger, conflict | Choose one, guard with `#[cfg(debug_assertions)]` |
| `devtools` feature in production Mac App Store build | Apple rejects private API usage | Remove for store submission |
| E2E tests relying on macOS tauri-driver | Not supported (issue #7068) | Use Playwright on dev server for macOS |
</anti_patterns>

<troubleshooting>
## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `crypto.getRandomValues` error in Vitest | jsdom lacks crypto | Add polyfill in setup: `randomFillSync` from `crypto` |
| Mock not intercepting plugin calls | Using `mockIPC` with wrong internal command name | Use `vi.mock('@tauri-apps/plugin-x')` instead |
| Test command won't compile with MockRuntime | `AppHandle` not generic | Add `<R: Runtime>` generic parameter |
| `STATUS_ENTRYPOINT_NOT_FOUND` on Windows cargo test | Known issue #13419 with mock runtime | Isolate affected tests, run separately |
| VS Code Rust debug hangs at launch | Missing `problemMatcher` in background task | Add proper `beginsPattern`/`endsPattern` matcher |
| Tracing causes deadlock | `window.emit()` from non-main thread with tracing (issue #9453) | Test with and without `tracing` feature |
| CrabNebula DevTools logs missing | Conflicts with `tauri-plugin-log` | Only use one logger, guard with `#[cfg]` |
| `emitTo` not working in mocked tests | Event mocking only supports global `emit` | Use global `emit` in tests, test `emitTo` in E2E |
| E2E WebDriver errors on Windows | msedgedriver version mismatch with Edge | Install matching msedgedriver version |
| Capabilities not enforced in unit tests | `INVOKE_KEY` bypasses ACL | Test ACL enforcement via E2E only |
</troubleshooting>
