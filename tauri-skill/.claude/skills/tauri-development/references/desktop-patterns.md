# Desktop Patterns

Multi-window management, system tray, menus, global shortcuts, sidecars, deep linking, and splash screen patterns for Tauri v2 desktop applications. All window operations in commands MUST be async (deadlock on Windows otherwise).

<multi_window>
## Multi-window: WebviewWindowBuilder, focus-or-create, inter-window communication

### Static vs dynamic window creation

Static: declared in `tauri.conf.json` under `app.windows`, created at startup. `"create": false` declares config without auto-instantiation.

```json
{ "app": { "windows": [
  { "label": "main", "url": "index.html", "width": 1024, "height": 768 },
  { "label": "preferences", "create": false, "url": "preferences.html", "width": 500, "height": 400 }
]}}
```

Dynamic (Rust) -- focus-or-create pattern:
```rust
#[tauri::command]
async fn open_preferences(app: tauri::AppHandle) -> tauri::Result<()> {
    if let Some(win) = app.get_webview_window("preferences") {
        win.set_focus()?;
        return Ok(());
    }
    WebviewWindowBuilder::new(&app, "preferences", WebviewUrl::App("preferences.html".into()))
        .title("Preferences").inner_size(500.0, 400.0).resizable(false).center()
        .parent(&app.get_webview_window("main").unwrap())
        .build()?;
    Ok(())
}
```

TypeScript: `new WebviewWindow('preferences', { url, title, width, height, center: true })` with `tauri://created` and `tauri://error` listeners.

### CRITICAL: async commands only for window ops

On **Windows only**, sync commands calling `.show()`, `.hide()`, or `WebviewWindowBuilder::build()` cause **permanent deadlock** (WebView2 message loop blocked). No error, no crash -- app freezes.

```rust
// DEADLOCK on Windows
#[tauri::command]
fn bad(app: tauri::AppHandle) { WebviewWindowBuilder::new(&app, "x", WebviewUrl::App("i.html".into())).build().unwrap(); }

// CORRECT -- always async
#[tauri::command]
async fn good(app: tauri::AppHandle) { WebviewWindowBuilder::new(&app, "x", WebviewUrl::App("i.html".into())).build().unwrap(); }
```

### Inter-window communication

```rust
// Broadcast all windows
app.emit("global-update", payload)?;
// Target specific window
app.emit_to("settings", "config-changed", payload)?;
// Filter with predicate
app.emit_filter("event", payload, |target| match target {
    EventTarget::WebviewWindow { label } => label == "main", _ => false,
})?;
```

```typescript
import { emitTo, listen } from '@tauri-apps/api/event';
await emitTo('main', 'data-updated', { id: 42 });
const unlisten = await listen('data-updated', (event) => console.log(event.payload));
```

Shared state via `app.manage()` is global -- accessible from any window via commands.

### Parent windows -- behavior differs by OS

| OS | Parent behavior |
|----|----------------|
| Windows | Child stays above owner, destroyed with parent |
| macOS | Added as `childWindow` |
| Linux | Becomes `transient_for` |

No native blocking modal in Tauri v2. Combine `parent()` with manual parent window disabling.

### Capabilities for dynamic windows

Every window using Tauri APIs must be listed in a capability's `windows` array:
```json
{ "identifier": "default", "windows": ["main", "preferences", "about"],
  "permissions": ["core:default", "core:window:default", "core:webview:allow-create-webview-window"] }
```
</multi_window>

<system_tray>
## System tray: TrayIconBuilder, minimize-to-tray, background app

### Feature flag required

`tauri = { version = "2", features = ["tray-icon"] }` in Cargo.toml. Linux also needs `libayatana-appindicator` system package.

### Minimize-to-tray pattern (3 required pieces)

1. **setup**: `TrayIconBuilder` with menu + left-click handler (show/unminimize/focus)
2. **on_window_event**: `CloseRequested` -> `window.hide()` + `api.prevent_close()`
3. **run callback**: `ExitRequested` -> `api.prevent_exit()` (keep alive when all windows hidden)

```rust
tauri::Builder::default()
    .setup(|app| {
        let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
        let show = MenuItem::with_id(app, "show", "Show", true, None::<&str>)?;
        let menu = Menu::with_items(app, &[&show, &quit])?;
        TrayIconBuilder::new()
            .icon(app.default_window_icon().unwrap().clone())
            .tooltip("My App").menu(&menu).menu_on_left_click(false)
            .on_menu_event(|app, event| match event.id.as_ref() {
                "quit" => app.exit(0),
                "show" => { if let Some(w) = app.get_webview_window("main") {
                    let _ = w.show(); let _ = w.unminimize(); let _ = w.set_focus(); }},
                _ => {}
            })
            .on_tray_icon_event(|tray, event| {
                if let TrayIconEvent::Click { button: MouseButton::Left,
                    button_state: MouseButtonState::Up, .. } = event {
                    if let Some(w) = tray.app_handle().get_webview_window("main") {
                        let _ = w.show(); let _ = w.unminimize(); let _ = w.set_focus(); }}
            }).build(app)?;
        Ok(())
    })
    .on_window_event(|window, event| {
        if let tauri::WindowEvent::CloseRequested { api, .. } = event {
            window.hide().unwrap(); api.prevent_close();
        }
    })
    .build(tauri::generate_context!()).expect("error")
    .run(|_app, event| {
        if let tauri::RunEvent::ExitRequested { api, .. } = event { api.prevent_exit(); }
    });
```

### Linux limitations

No `Enter`, `Move`, `Leave` tray events. Tray may not display without a menu defined.

### Background app pattern (no window)

```json
{ "app": { "windows": [] } }
```
```rust
#[cfg(target_os = "macos")]
app.set_activation_policy(tauri::ActivationPolicy::Accessory);
```
</system_tray>

<menus_shortcuts>
## Menus and shortcuts: MenuBuilder, context menus, global shortcuts

### Native menu construction

```rust
use tauri::menu::{MenuBuilder, SubmenuBuilder, PredefinedMenuItem};
let file_menu = SubmenuBuilder::new(app, "File")
    .text("new", "New").text("open", "Open").separator().quit().build()?;
let edit_menu = SubmenuBuilder::new(app, "Edit")
    .undo().redo().separator().cut().copy().paste().select_all().build()?;
let menu = MenuBuilder::new(app).items(&[&file_menu, &edit_menu]).build()?;
app.set_menu(menu)?;
```

**macOS**: items must be inside a submenu -- top-level items are ignored.

### Context menus (v2 built-in, plugin obsolete)

```typescript
window.addEventListener('contextmenu', async (e) => {
  e.preventDefault();
  const menu = await Menu.new({ items: [
    { id: 'copy', text: 'Copy', action: () => {} },
    { type: 'Separator' },
    { id: 'paste', text: 'Paste', action: () => {} },
  ]});
  await menu.popup();
});
```

**Linux**: `linux-libxdo` Cargo feature required for Cut/Copy/Paste to work via native menus.

### Global shortcuts plugin

```rust
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, ShortcutState};
app.handle().plugin(
    tauri_plugin_global_shortcut::Builder::new()
        .with_handler(|app, shortcut, event| {
            if event.state == ShortcutState::Pressed && shortcut.matches(Modifiers::CONTROL, Code::Space) {
                // Global action
            }
        }).build(),
)?;
```

Syntax: `CommandOrControl+Key`. **Silent failure if shortcut already taken** by another app.

### Browser shortcut prevention

```rust
// Production: block all browser shortcuts
tauri_plugin_prevent_default::init()
// Dev: keep DevTools and reload
tauri_plugin_prevent_default::Builder::new()
    .with_flags(Flags::all().difference(Flags::DEV_TOOLS | Flags::RELOAD)).build()
```
</menus_shortcuts>

<sidecars>
## Sidecars: externalBin, target triple suffix, argument scoping

### Config and file naming

```json
{ "bundle": { "externalBin": ["binaries/ffmpeg"] } }
```

Files required in `src-tauri/binaries/` with **exact target triple suffix**:
- `ffmpeg-x86_64-pc-windows-msvc.exe`
- `ffmpeg-x86_64-apple-darwin`
- `ffmpeg-aarch64-apple-darwin`
- `ffmpeg-x86_64-unknown-linux-gnu`

### Execution via Shell plugin

```typescript
import { Command } from '@tauri-apps/plugin-shell';
const command = Command.sidecar('binaries/ffmpeg', ['-i', input, '-o', output]);
command.stdout.on('data', (line) => console.log(line));
command.stderr.on('data', (line) => console.error(line));
const child = await command.spawn();
await child.kill();
```

### Argument scope validation

```json
{ "identifier": "shell:allow-spawn", "allow": [{
    "name": "binaries/ffmpeg", "sidecar": true,
    "args": ["-i", { "validator": "\\S+" }, "-o", { "validator": "[a-zA-Z0-9/._-]+" }]
}]}
```

### Rust vs JS path difference

| API | Path format |
|-----|-------------|
| Rust: `app.shell().sidecar("my-sidecar")` | Name only |
| JS: `Command.sidecar('binaries/my-sidecar')` | Full path as in `externalBin` |
</sidecars>

<deep_linking>
## Deep linking: schemes, single-instance, JS API

### Config

```json
{ "plugins": { "deep-link": { "desktop": { "schemes": ["my-app"] } } } }
```

### Windows/Linux: new instance spawned

On Windows and Linux, `my-app://action` **launches a new process**. Requires `tauri-plugin-single-instance` with `deep-link` feature:

```rust
tauri::Builder::default()
    .plugin(tauri_plugin_single_instance::init(|app, argv, _cwd| {
        if let Some(w) = app.get_webview_window("main") { let _ = w.set_focus(); }
    }))
    .plugin(tauri_plugin_deep_link::init())
```

**`single-instance` MUST be the first plugin registered.**

### JS API

```typescript
import { onOpenUrl, getCurrent } from '@tauri-apps/plugin-deep-link';
const urls = await getCurrent();             // Launch URL
if (urls?.length) handleDeepLink(urls[0]);
await onOpenUrl((urls) => handleDeepLink(urls[0])); // Runtime URLs
```

**macOS**: requires bundled `.app` for URL scheme registration.
</deep_linking>

<splash_screen>
## Splash screen: two-window pattern

Config: splash `visible: true`, main `visible: false`. Use `tauri::async_runtime::spawn` for init tasks.

```rust
tauri::Builder::default()
    .setup(|app| {
        let splash = app.get_webview_window("splashscreen").unwrap();
        let main = app.get_webview_window("main").unwrap();
        let handle = app.handle().clone();
        tauri::async_runtime::spawn(async move {
            load_app_config(&handle).await;  // DB migrations, config, etc.
            splash.close().unwrap();
            main.show().unwrap();
        });
        Ok(())
    })
```

**CRITICAL**: use `tokio::time::sleep()` not `std::thread::sleep()` in async contexts -- `std::thread::sleep` blocks the entire runtime.

Prefer inline spinner/loading state over splash screen when startup is fast.
</splash_screen>

<anti_patterns>
## Anti-patterns

| Anti-pattern | Problem | Correct approach |
|-------------|---------|-----------------|
| Sync command with window ops | Deadlock on Windows (WebView2 message loop blocked) | Always `async fn` for window commands |
| Missing `prevent_exit` in RunEvent | App quits when last window hidden (tray pattern) | Handle `ExitRequested` with `api.prevent_exit()` |
| Dynamic window not in capabilities | API calls fail silently | List all window labels in capability `windows` array |
| `std::thread::sleep()` in async context | Blocks tokio runtime, freezes app | Use `tokio::time::sleep()` |
| Sidecar without target triple suffix | Binary not found at runtime | Suffix every binary: `name-x86_64-pc-windows-msvc.exe` |
| Deep link without single-instance | New process on each link (Windows/Linux) | Register `single-instance` as **first** plugin |
| Top-level menu items on macOS | Items silently ignored | Wrap all items in submenus |
| `tauri-plugin-context-menu` | Obsolete in v2 | Use built-in `menu.popup()` |
</anti_patterns>

<troubleshooting>
## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| App freezes on Windows when creating window | Sync command deadlock | Make command `async` |
| Tray icon not visible on Linux | Missing menu or `libayatana-appindicator` | Define menu + install system package |
| Tray Enter/Move/Leave events not firing on Linux | Not supported on Linux | Rely on Click events only |
| Deep link opens new instance (Windows/Linux) | No single-instance plugin | Add `tauri-plugin-single-instance` with `deep-link` feature |
| Sidecar binary not found | Missing target triple suffix | Name files `binary-{target_triple}[.exe]` |
| Cut/Copy/Paste not working in menus (Linux) | Missing `linux-libxdo` feature | Enable `linux-libxdo` Cargo feature |
| Global shortcut silently fails | Shortcut already registered by another app | Try alternative key combination, handle gracefully |
| Splash screen blocks app startup | `std::thread::sleep` in async spawn | Use `tokio::time::sleep` |
| Child window not staying above parent (Linux) | OS-specific parent behavior | Accept platform difference, test per OS |
| `macOSPrivateApi` blocks App Store | Apple rejects private API usage | Remove the feature before Store submission |
</troubleshooting>
