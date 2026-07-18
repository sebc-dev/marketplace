---
description: Audit a Tauri v2 project against security best practices, capability hygiene, and cross-platform anti-patterns
disable-model-invocation: true
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
---

# Audit Tauri v2 Project

Perform a comprehensive audit of the current Tauri v2 project against the tauri-development skill best practices, security rules, and anti-patterns.

## Current Project State

### Tauri Config
!`cat src-tauri/tauri.conf.json 2>/dev/null || echo "NO_TAURI_CONFIG"`

### Cargo.toml
!`cat src-tauri/Cargo.toml 2>/dev/null || echo "NO_CARGO_TOML"`

### Main Entry (lib.rs)
!`cat src-tauri/src/lib.rs 2>/dev/null || echo "NO_LIB_RS"`

### Default Capabilities
!`cat src-tauri/capabilities/default.json 2>/dev/null || cat src-tauri/capabilities/*.json 2>/dev/null | head -100 || echo "NO_CAPABILITIES"`

### Source Structure
!`find src-tauri/src -type f -name "*.rs" 2>/dev/null | head -30 || echo "NO_SRC"`

---

## Audit Instructions

Run the audit in four stages, from most critical to least. For each check, inspect the pre-loaded project state above and use Grep/Glob to scan files as needed.

### Stage 1: Security Critical (CRITICAL severity)

Read the 10 Critical Rules from `.claude/skills/tauri-development/SKILL.md` then check each:

**Rule 1 -- Capability permissions too broad:**
Check all capability files for overly permissive scopes:
```bash
grep -rn '"permissions"' src-tauri/capabilities/ 2>/dev/null
```
Flag any `"fs:default"` without explicit scope constraints, any `"shell:default"` (exposes all commands), any wildcard scopes (`**/*`).

**Rule 2 -- Missing deny scopes:**
Check if capabilities use deny scopes for sensitive paths:
```bash
grep -rn '"deny"' src-tauri/capabilities/ 2>/dev/null
```
Flag capabilities with broad allow scopes but no corresponding deny scopes.

**Rule 3 -- Sync commands with window operations:**
```bash
grep -rn 'WebviewWindowBuilder\|\.show()\|\.hide()\|\.close()\|\.set_focus()' src-tauri/src/ --include="*.rs" 2>/dev/null
```
For each match, verify the enclosing function is `async`. Non-async = deadlock on Windows.

**Rule 4 -- .unwrap() or .expect() in commands:**
```bash
grep -rn '\.unwrap()\|\.expect(' src-tauri/src/ --include="*.rs" 2>/dev/null
```
Flag any `.unwrap()` or `.expect()` in `#[tauri::command]` functions. Must return `Result<T, E>`.

**Rule 5 -- State type mismatch:**
```bash
grep -rn 'State<' src-tauri/src/ --include="*.rs" 2>/dev/null
```
Cross-reference each `State<'_, T>` with `app.manage(...)` calls. If `manage(Mutex::new(data))` but `State<'_, Data>` instead of `State<'_, Mutex<Data>>` = runtime panic.

**Rule 6 -- Owned types in async commands:**
```bash
grep -rn '#\[tauri::command\]' src-tauri/src/ --include="*.rs" 2>/dev/null
```
For each async command, check for `&str` parameters. Must use `String` (owned types only).

**Rule 7 -- MutexGuard held across .await:**
```bash
grep -rn '\.lock()' src-tauri/src/ --include="*.rs" 2>/dev/null
```
Check if any `std::sync::MutexGuard` is held across a `.await` point.

**Rule 8 -- core:default missing required permissions:**
Check capabilities for `core:default` and verify explicit additions for `window:allow-close`, `window:allow-hide`, `webview:allow-create-webview-window` if the app uses these features.

**Rule 9 -- Plugin registration order:**
Check `lib.rs` for `.plugin()` calls. `single-instance` must be first. `persisted-scope` must be after `fs`.

**Rule 10 -- Desktop-only plugins without cfg guard:**
```bash
grep -rn 'tauri_plugin_global_shortcut\|tauri_plugin_window_state\|tauri_plugin_autostart\|tauri_plugin_updater\|tauri_plugin_cli\|tauri_plugin_positioner\|tauri_plugin_single_instance' src-tauri/src/ --include="*.rs" 2>/dev/null
```
Flag any desktop-only plugin not guarded by `#[cfg(desktop)]` if the project targets mobile.

### Stage 2: Anti-pattern Scan (HIGH severity)

Read the `<anti_patterns>` sections from the reference files dynamically:

```bash
grep -n '<anti_patterns>' .claude/skills/tauri-development/references/ipc-bridge.md
grep -n '<anti_patterns>' .claude/skills/tauri-development/references/architecture-security.md
grep -n '<anti_patterns>' .claude/skills/tauri-development/references/config-structure.md
```

Key checks:

- **CSP not configured:**
  Check `tauri.conf.json` for `app.security.csp`. Missing = no CSP protection.

- **devtools feature in release:**
  ```bash
  grep -n 'devtools' src-tauri/Cargo.toml 2>/dev/null
  ```
  Flag if enabled without `#[cfg(debug_assertions)]` guard.

- **withGlobalTauri enabled:**
  Check `tauri.conf.json` for `"withGlobalTauri": true` — security risk.

- **Release profile not optimized:**
  Check `Cargo.toml` for `[profile.release]` section. Missing = suboptimal binary size.

- **removeUnusedCommands not enabled:**
  Check `tauri.conf.json` for `build.removeUnusedCommands`. Missing = larger binary (up to 51% savings).

### Stage 3: Architecture Review (MEDIUM severity)

- **Command organization:** For 20+ commands, are they organized in modules?
- **Error handling pattern:** String errors or typed errors (thiserror)?
- **State architecture:** One monolithic state or multiple typed states?
- **Plugin selection:** Are desktop-only plugins used with cfg guards for mobile support?

### Stage 4: Cross-platform Check (LOW severity)

Read the relevant reference file sections for platform gotchas:

- **Windows migration:** Check for `useHttpsScheme` if migrating from v1
- **Linux compatibility:** Check webkit2gtk version requirements
- **macOS App Store:** Check for `macos-private-api` feature (causes rejection)
- **Mobile readiness:** Check `Cargo.toml` for `crate-type` array (staticlib, cdylib, lib)

---

## Report Format

```markdown
# Tauri v2 Audit Report

## Summary
- **Project:** [name from tauri.conf.json]
- **Tauri version:** [from Cargo.toml]
- **Target platforms:** [detected from config/capabilities]
- **Issues found:** X CRITICAL, Y HIGH, Z MEDIUM, W LOW

## CRITICAL Issues
[If any]

### [Issue title]
- **Rule:** [rule number]
- **File:** path/to/file:line
- **Problem:** [what's wrong]
- **Fix:** [the correct pattern]
- **Reference:** [path to reference file section]

## HIGH Issues
## MEDIUM Issues
## LOW Issues
## Passed Checks
## Recommendations
```

## Post-Audit Actions

1. **Offer to fix CRITICAL issues** -- ask confirmation before each fix.
2. **Suggest reference file sections** for HIGH and MEDIUM issues.
3. **If no issues found** -- confirm the project follows Tauri v2 best practices.

## Important Notes

- Read anti-patterns from reference files dynamically. Do NOT rely on hardcoded content.
- Check ALL pre-loaded files even if some are missing. Report "NOT FOUND" for essential missing files.
- Do not suggest fixes that contradict the skill reference files.
