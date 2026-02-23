# IPC Bridge

Tauri v2 commands, events, channels, state management, error handling, raw payloads, and resource system. Decision patterns, threading rules, and comprehensive anti-patterns. For exact API signatures, use WebFetch with docs.rs/tauri.

<commands>
**Declaration:** `#[tauri::command]` transforms a Rust function into an IPC command. Register ALL commands in a single `generate_handler![]` call -- multiple `invoke_handler()` calls overwrite previous ones.

```rust
#[tauri::command]
pub async fn get_user(user_id: u32) -> Result<UserProfile, String> { /* ... */ }

// lib.rs -- single centralized registration (multiple invoke_handler calls overwrite)
.invoke_handler(tauri::generate_handler![commands::users::get_user, commands::files::read_file])
```

**Naming rules:**
- Command name = snake_case as-is: `invoke('get_user', ...)`
- Arguments auto-convert snake_case -> camelCase: `user_id` (Rust) = `userId` (JS)
- Disable with `#[tauri::command(rename_all = "snake_case")]`
- Use `#[serde(rename_all = "camelCase")]` on custom structs
- **Names are globally unique** -- module prefix ignored during dispatch

**Auto-injected parameters** (invisible to frontend, not in JSON payload):

| Type | Description |
|------|-------------|
| `AppHandle` | Global app handle |
| `WebviewWindow` | Invoking window/webview |
| `State<'_, Mutex<T>>` | Managed state |
| `Channel<T>` | Streaming channel |
| `Request<'_>` | Raw request (body + headers) |
| `Window`, `Webview` | Separate window/webview handles |
| `CommandScope`, `GlobalScope` | Plugin scopes |

**Sync vs async threading:**

| Type | Runs on | Blocks UI? | Use when |
|------|---------|------------|----------|
| `fn cmd()` (sync) | Main thread | **YES** | Trivial, sub-ms operations |
| `async fn cmd()` | Tokio thread pool | No | I/O, network, anything > few ms |
| `#[tauri::command(async)] fn cmd()` | Tokio thread pool | No | Blocking code without rewrite |

**Constraint:** Commands in `lib.rs` cannot be `pub`. Commands in modules MUST be `pub`.
</commands>

<events_channels>
**Events** -- fire-and-forget, JSON-serialized, no type safety, no backpressure.

**Rust emit** (requires `use tauri::Emitter`): `app.emit("name", payload)` (global), `app.emit_to("label", ...)` (targeted), `app.emit_filter(...)` (predicate). Rust-emitted events bypass capability system.

**JS listen:** `listen("name", handler)` returns `unlisten` fn -- MUST call in `onUnmounted`/`onDestroy` (SPA memory leak). `once()` auto-unsubscribes. `emit()`/`emitTo()` send JS->Rust.

**Rust listen:** `app.listen("event", |e| { ... })` returns `EventId`. `listen_any()` captures regardless of target.

---

**Channels** -- ordered streaming Rust->JS, higher performance than events for >8KB payloads.

**Rust side:** `Channel<T>` as command param. `on_event.send(ProgressEvent::Progress { percent: 50 })`. Use `#[serde(tag = "event", content = "data")]` for tagged enum patterns.

**JS side:** `const ch = new Channel<T>(); ch.onmessage = (msg) => { ... }; await invoke('cmd', { onEvent: ch });`

**Channel guarantees:** Incremental index per message; JS buffers out-of-order messages and delivers in sequence. **No backpressure** -- fast Rust sender accumulates messages in JS memory. Implement acknowledgment via separate command if needed.

**Decision matrix:**

| Need | Mechanism | Why |
|------|-----------|-----|
| Request/response | Commands (`invoke`) | Type-safe, Promise, capability-enforced |
| Broadcast (all windows) | Events (`emit`) | Fire-and-forget, decoupled |
| Targeted (one window) | Events (`emit_to`) | Scoped to label |
| Streaming (progress, logs) | Channels (`Channel<T>`) | Ordered, high-perf, within command |
| Binary data > 10 KB | Raw payloads | Bypass JSON serialization |
</events_channels>

<state_management>
**Registration:** `app.manage(state)` wraps in `Arc` automatically -- never add `Arc` yourself.

```rust
Builder::default()
    .setup(|app| {
        app.manage(Mutex::new(AppData::default()));      // Typed state #1
        app.manage(Mutex::new(DatabasePool::connect()?)); // Typed state #2
        Ok(())
    })
```

**Injection:** `State<'_, Mutex<T>>` in command parameters. Type must match EXACTLY what was managed.

**std::sync::Mutex vs tokio::sync::Mutex:**

| | `std::sync::Mutex` | `tokio::sync::Mutex` |
|---|---|---|
| Use when | Lock NOT held across `.await` | Lock held across `.await` |
| Performance | Faster (no async overhead) | Async-aware |
| Error if wrong | -- | `MutexGuard` across `.await` = "future cannot be sent between threads" |

```rust
// std::sync -- scope the guard before await
let value = { state.lock().unwrap().clone() }; // guard dropped
some_async_fn().await; // safe

// tokio::sync -- lock across await
let conn = db.lock().await; // held across await
conn.execute("...").await;  // safe with tokio Mutex
```

**Access outside commands:** `app.state::<Mutex<T>>()` (panic if not managed) or `app.try_state::<T>()` (`Option`). State is global, shared across all windows.

**Architecture:** Multiple small typed states > one monolithic struct. Use `RwLock` for read-heavy, `AtomicU64` for counters.
</state_management>

<error_handling>
**Pattern:** `Result<T, E>` with `E: serde::Serialize`. `Ok` resolves Promise, `Err` rejects it.

**String errors (quick):** `fn cmd(path: String) -> Result<String, String>` with `.map_err(|e| e.to_string())`.

**Typed errors (thiserror + ErrorKind):** Define `AppError` with `#[derive(thiserror::Error)]`, separate `ErrorKind` enum with `#[serde(tag = "kind", content = "message")]`, implement `Serialize` for `AppError` by converting to `ErrorKind`. JS matches via `e.kind` discriminant.

```typescript
type AppError = { kind: 'io' | 'validation'; message: string };
invoke('cmd').catch((e: AppError) => { switch (e.kind) { /* ... */ } });
```

**`anyhow::Error` does NOT work directly** -- no `Serialize` impl. Wrap with thiserror: `#[error(transparent)] Anyhow(#[from] anyhow::Error)`.
</error_handling>

<resource_system>
**Resource trait + ResourceTable** expose Rust objects to frontend via numeric IDs (file descriptor pattern).

Implement `Resource` trait on struct (`name()` + `close()`). Add to table: `app.resources_table().add(obj)` returns `u32` ID. Retrieve: `table.get::<T>(rid)`. JS `Resource` class exposes `close(): Promise<void>`.

**Key rules:**
- Resources NOT auto-cleaned (except on app exit) -- explicit `close()` required
- JS `Resource` class from `@tauri-apps/api/core` exposes `close(): Promise<void>`
- Resource IDs are randomly allocated (audit fix TAU2-044, not sequential)

**Raw payloads** -- bypass JSON for binary data (>10 KB threshold):
```rust
// Receive binary
#[tauri::command]
fn upload(request: Request<'_>) -> Result<(), String> {
    let InvokeBody::Raw(bytes) = request.body() else { return Err("expected raw".into()); };
    std::fs::write("/tmp/upload.bin", bytes).map_err(|e| e.to_string())
}

// Send binary (received as ArrayBuffer in JS)
#[tauri::command]
fn read_image(path: String) -> Result<Response, String> {
    Ok(Response::new(std::fs::read(&path).map_err(|e| e.to_string())?))
}
```

Performance: 150 MB file in <60 ms (V2 raw) vs ~50 seconds (V1 JSON).
</resource_system>

<anti_patterns>
| Pattern | Problem | Fix |
|---------|---------|-----|
| `async fn greet(name: &str)` | "borrowed value does not live long enough" -- `spawn` requires `'static` | Use `String` (owned types) in async commands |
| Sync command creates window on Windows | **DEADLOCK** -- WebView2 requires event loop, sync blocks it | Make command `async` |
| `.unwrap()` / `.expect()` in commands | Sync: **crashes entire app**. Async: Promise **hangs forever** | Always return `Result<T, E>` |
| `std::sync::MutexGuard` across `.await` | "future cannot be sent between threads safely" | Scope guard before `.await` or use `tokio::sync::Mutex` |
| Missing `unlisten()` in SPA | Listeners accumulate on navigation = memory leak | Call `unlisten()` in `onUnmounted` / `onDestroy` |
| `State<'_, AppState>` instead of `State<'_, Mutex<AppState>>` | Compiles but **panics at runtime** (type mismatch) | Match exact managed type; use type aliases |
| Non-unique command names across modules | Module prefix ignored in dispatch -- last wins | Ensure globally unique function names |
| `async fn cmd(state: State<...>) -> u32` (no Result) | "__tauri_message__ does not live long enough" | Wrap return in `Result<u32, ()>` |
| Multiple `invoke_handler()` calls | Each call **overwrites** previous handler | Single `generate_handler![]` with all commands |
| `listen()` from `@tauri-apps/api/event` | Captures ALL events of that name (any window) | Use `getCurrentWebviewWindow().listen()` for targeted |
| Channels without flow control | No backpressure -- fast Rust sender fills JS memory | Implement ACK pattern via separate command |
| `anyhow::Error` as command error type | No `Serialize` impl | Wrap in thiserror with `#[from] anyhow::Error` |
</anti_patterns>

<troubleshooting>
| Symptom | Cause | Fix |
|---------|-------|-----|
| App freezes on Windows when opening window | Sync command + WebView2 event loop deadlock | Make command `async` |
| "borrowed value does not live long enough" | `&str` in async command parameters | Use `String` instead of `&str` |
| "future cannot be sent between threads safely" | `std::sync::MutexGuard` held across `.await` | Scope guard in block before `.await` or use `tokio::sync::Mutex` |
| Promise never resolves (no error either) | Panic in async command -- Future dropped silently | Replace `.unwrap()` with `Result` return |
| "No command `xyz` found" at runtime | Command not in `generate_handler![]` or name mismatch | Check registration and naming (snake_case) |
| State injection panics at runtime | Managed type differs from `State<T>` type parameter | Match exact type (e.g., `Mutex<AppState>` not `AppState`) |
| Events received by wrong window | `listen()` captures all events globally | Use `getCurrentWebviewWindow().listen()` |
| Memory growing with SPA navigation | Event listeners not cleaned up | Call `unlisten()` in component teardown |
| Command handler returns empty/unexpected | `serde(rename_all)` mismatch between Rust/JS | Ensure consistent `camelCase` rename on structs |
| `emitTo` / `emit_filter` fail in tests | Not supported in `mockIPC` JS mocks | Test these via Rust-side `tauri::test` instead |
| Channel messages arrive out of order | Normal behavior -- JS buffers and reorders | This is handled automatically; check consumer logic |
| 100+ commands slow compile | Expected: dispatch is compile-time lookup | No runtime impact; consider plugin pattern for organization |
</troubleshooting>
