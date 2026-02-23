# Architecture & Security

Tauri v2 process model, capability system, permissions, CSP, and isolation pattern. Core security decisions, scope variables, and anti-patterns. For exact API signatures, use WebFetch with docs.rs/tauri.

<process_model>
**Core process** = single Rust process. Four responsibilities:
1. **IPC** -- intercept, filter, route all messages via `RuntimeAuthority`
2. **OS access** -- windows (TAO), webviews (WRY), tray, notifications
3. **State** -- global via `Builder::manage()`, accessed via `State<T>` (must be `Send + Sync + 'static`, mutability requires `Mutex`)
4. **Plugin hosting** -- `Builder::plugin()`, lifecycle: `initialize()` -> script injection -> `extend_api()`, commands namespaced `plugin:{name}|{command}`

**WebView processes** = isolated HTML/CSS/JS. Libraries dynamically linked, NOT embedded in binary.

| Platform | Engine | URI scheme | JS engine | Update model |
|----------|--------|------------|-----------|--------------|
| Windows | WebView2 (Chromium) | `http://tauri.localhost` | V8 | Evergreen (auto) |
| macOS/iOS | WKWebView | `tauri://localhost` | JavaScriptCore | Tied to OS |
| Linux | WebKitGTK | `tauri://localhost` | JavaScriptCore | Tied to distro packages |

**IPC flow (simplified):**
```
invoke("cmd", {args})
  -> Custom Protocol (ipc://localhost) HTTP POST
  -> parse_invoke_request() + validate __TAURI_INVOKE_KEY__
  -> RuntimeAuthority: check origin label -> check capability -> resolve scopes
  -> Command dispatch (plugin or app handler) + serde deserialize
  -> Response via custom protocol (or eval() fallback on Android)
```

**Crate chain:** `tauri` -> `tauri-runtime` (trait) -> `tauri-runtime-wry` -> WRY (webview) + TAO (window). TAO = winit fork with GTK linux port. WRY backends: WebView2, WKWebView, WebKitGTK, Android System WebView via JNI.

**`__TAURI_INVOKE_KEY__`** -- random string per launch, injected as JS global, validated in every IPC call. Prevents unauthorized iframe access. NOT a defense against compromised Tauri windows.

**Asset protocols by platform:**

| Protocol | Windows / Android | macOS / iOS / Linux |
|----------|-------------------|---------------------|
| App (frontend) | `http://tauri.localhost` | `tauri://localhost` |
| Asset | `http://asset.localhost/<path>` | `asset://localhost/<path>` |
| IPC | `http://ipc.localhost` | `ipc://localhost` |
</process_model>

<security_capabilities>
Capability files (JSON/JSON5/TOML) reside in `src-tauri/capabilities/`. **All files auto-activated by default.** Explicit list in `app.security.capabilities` overrides this.

**Schema:**

| Field | Type | Required | Default |
|-------|------|----------|---------|
| `identifier` | string | **Yes** | -- |
| `description` | string | No | -- |
| `local` | boolean | No | `true` |
| `windows` | string[] (glob) | No | -- |
| `webviews` | string[] (glob) | No | -- |
| `permissions` | (string \| PermissionEntry)[] | **Yes** | -- |
| `platforms` | Target[] \| null | No | all |
| `remote` | { urls: string[] } \| null | No | -- |

**Assignment rules:**
- `windows` match -> capability applies to ALL webviews in that window
- `webviews` -> fine-grained per-webview (recommended for multiwebview)
- No match = zero IPC access
- Same window capabilities merged additively
- Platforms: `"linux"`, `"macOS"`, `"windows"`, `"iOS"`, `"android"` (case-sensitive)

**Minimal viable capability:**
```json
{ "identifier": "minimal", "permissions": ["core:default"] }
```

**`dynamic-acl`** (default feature) -- `Manager::add_capability()` at runtime:
- Additive only (cannot remove at runtime)
- Permissions must be known at compile-time
- Acquires mutex lock on `runtime_authority` (can panic if poisoned)
- Use case: progressive permissions post-auth, premium features
</security_capabilities>

<permissions_scopes>
**Syntax:** `<plugin>:<permission>`. Identifier constraints: ASCII lowercase `[a-z]`, max 116 chars.

**`core:default` includes:**

| Permission set | Includes |
|----------------|----------|
| `core:app:default` | allow-version, allow-name, allow-tauri-version |
| `core:event:default` | allow-listen, allow-unlisten, allow-emit, allow-emit-to |
| `core:image:default` | allow-new, allow-from-bytes, allow-from-path, allow-rgba |
| `core:path:default` | allow-resolve-directory, allow-resolve, allow-normalize, allow-join |
| `core:window:default` | ~20 read-only permissions (scale-factor, position, size, is-fullscreen...) |

**`core:default` EXCLUDES:** `core:window:allow-close`, `core:window:allow-hide`, `core:webview:allow-create-webview-window`, all destructive actions.

**Deny > Allow rule:** if same command in both, deny wins. Applies at merged level across capabilities.

**Scope types:**
- `CommandScope<'_, T>` -- per-command allow/deny
- `GlobalScope<'_, T>` -- plugin-wide (no command list)
- Path traversal (`..`) blocked by FS plugin
- HTTP scopes: `http:default` enables ops but allows NO URLs by default

**Path variables table:**

| Variable | Windows | macOS | Linux |
|----------|---------|-------|-------|
| `$APPCONFIG` | `AppData\Roaming\{id}` | `~/Library/Application Support/{id}` | `$XDG_CONFIG_HOME/{id}` |
| `$APPDATA` | `AppData\Roaming\{id}` | `~/Library/Application Support/{id}` | `$XDG_DATA_HOME/{id}` |
| `$APPLOCALDATA` | `AppData\Local\{id}` | `~/Library/Application Support/{id}` | `$XDG_DATA_HOME/{id}` |
| `$APPCACHE` | `AppData\Local\{id}` | `~/Library/Caches/{id}` | `$XDG_CACHE_HOME/{id}` |
| `$APPLOG` | `AppData\Roaming\{id}\logs` | `~/Library/Logs/{id}` | `$XDG_DATA_HOME/{id}/logs` |
| `$RESOURCE` | `{exe_dir}` | `{exe_dir}/../Resources` | `/usr/lib/{exe_name}` |
| `$DESKTOP` | `~\Desktop` | `~/Desktop` | `XDG_DESKTOP_DIR` |
| `$DOCUMENT` | `~\Documents` | `~/Documents` | `XDG_DOCUMENTS_DIR` |
| `$DOWNLOAD` | `~\Downloads` | `~/Downloads` | `XDG_DOWNLOAD_DIR` |
| `$HOME` | `C:\Users\{user}` | `/Users/{user}` | `/home/{user}` |
| `$TEMP` | `AppData\Local\Temp` | `/tmp` | `/tmp` |
</permissions_scopes>

<csp_headers>
**CSP config** in `app.security.csp` (string or structured object). `dev_csp` for development.

**Required directives for Tauri:**
```json
{
  "default-src": "'self'",
  "connect-src": "ipc: http://ipc.localhost",
  "img-src": "'self' asset: http://asset.localhost blob: data:",
  "style-src": "'unsafe-inline' 'self'",
  "script-src": "'self'"
}
```

**Auto-injection:** Tauri injects sha256 hashes into `script-src`/`style-src` at compile-time. Hash presence disables `'unsafe-inline'` per CSP spec -- inline event handlers (`onclick`) break even if `'unsafe-inline'` declared.

**Key rules:**
- Omitting `csp` entirely = NO CSP protection
- For WASM (Leptos, Yew): add `'wasm-unsafe-eval'` to `script-src`
- `dangerous_disable_asset_csp_modification` disables auto-injection (XSS risk)
- CSP must include BOTH `asset:` AND `http://asset.localhost` for cross-platform `convertFileSrc()`

**COOP/COEP** (since v2.1.0) via `app.security.headers`:
```json
{
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Embedder-Policy": "require-corp"
}
```
Required for `SharedArrayBuffer`. Must ALSO be configured in dev server (e.g., `vite.config.ts > server.headers`) -- Tauri headers apply to production only.
</csp_headers>

<isolation_pattern>
| Criteria | Brownfield (default) | Isolation |
|----------|---------------------|-----------|
| Security | Basic | Reinforced (recommended) |
| Complexity | None | Requires isolation app |
| Performance | No overhead | AES-GCM (negligible) |
| Supply chain protection | None | Intercepts malicious IPC |
| ES modules | Normal | NOT supported in iframe (Windows) |

**Configuration:**
```json
{
  "app": { "security": { "pattern": {
    "use": "isolation",
    "options": { "dir": "../dist-isolation" }
  }}}
}
```

**Isolation hook (dist-isolation/index.js):**
```javascript
window.__TAURI_ISOLATION_HOOK__ = (payload) => {
  // Validate, filter, log, or block IPC messages
  if (payload.cmd === 'dangerous') return null; // block
  return payload;
};
```

**How it works:** iframe sandboxed between frontend and Core. All IPC encrypted with AES-GCM via SubtleCrypto. Keys regenerated per launch. Intercepts events too.

**Use when:** many npm dependencies (supply chain risk), sensitive data handling, compliance requirements. Keep isolation app minimal (no ES modules on Windows).
</isolation_pattern>

<anti_patterns>
| Don't | Do | Severity |
|-------|-----|----------|
| Omit `core:default` in capabilities | Always include -- events, paths, basic ops fail silently | CRITICAL |
| Use `"permissions": ["fs:default"]` without scopes | Granular `allow-*` + explicit scope variables | CRITICAL |
| Use `**/*` glob in FS scopes | Specific variables ($DOCUMENT, $APPDATA) | HIGH |
| Declare `'unsafe-inline'` expecting it to work with CSP | Tauri injects hashes which disable it per spec | HIGH |
| Only include `asset:` in CSP img-src | Include BOTH `asset:` AND `http://asset.localhost` | HIGH |
| Trust error message permission names literally | Check `gen/schemas/desktop-schema.json` -- errors may drop `core:` prefix | MEDIUM |
| Configure COOP/COEP only in tauri.conf.json | Also configure dev server headers for dev mode | MEDIUM |
| Skip `csp` in config entirely | Always define CSP -- omission = zero protection | MEDIUM |
</anti_patterns>

<troubleshooting>
| Symptom | Cause | Fix |
|---------|-------|-----|
| Command silently fails with no error | Window/webview not matching any capability | Add capability with matching `windows`/`webviews` glob |
| `core:default` missing functionality (close, hide) | Destructive actions excluded from default | Add `core:window:allow-close` etc. explicitly |
| Error references permission without `core:` prefix | Known inconsistency since PR #10390 | Verify against `gen/schemas/desktop-schema.json` |
| IPC slow on Linux | webkit2gtk < 2.40, using postMessage fallback | Enable `linux-protocol-body` Cargo feature |
| CSP blocks inline scripts even with `unsafe-inline` | Tauri auto-injects hashes which disable `unsafe-inline` | Use external scripts or explicit hashes |
| `convertFileSrc()` images not loading | CSP missing one of the two URI scheme formats | Add both `asset:` and `http://asset.localhost` to `img-src` |
| Isolation iframe scripts fail on Windows | ES modules not supported in sandboxed iframe | Keep isolation app minimal, avoid imports |
| SharedArrayBuffer undefined | Missing COOP/COEP headers | Configure both `tauri.conf.json` and dev server headers |
</troubleshooting>
