---
name: tauri-development
description: |
  Tauri v2 desktop and mobile application development. Architecture (core process,
  webview, TAO, WRY), security model (capabilities, permissions, scopes, CSP,
  isolation pattern), configuration (tauri.conf.json, Cargo.toml features, platform
  overlays), IPC bridge (commands, events, channels, state management, error
  handling, raw payloads), plugin ecosystem (30+ official plugins, installation,
  selection matrix, mobile compatibility), desktop patterns (multi-window, system
  tray, menus, global shortcuts, sidecars, deep linking, splash screen), mobile
  development (Android, iOS, HMR, conditional compilation, platform differences),
  build pipeline (bundlers, code signing, auto-updater, CI/CD with tauri-action),
  testing and debugging (mockIPC, tauri::test, tauri-driver, tracing, DevTools).
  Uses WebFetch with references/llms.txt for official Tauri v2 docs lookup.
  Does NOT cover frontend framework specifics — use svelte-skill or astro-skill.
  Activate when detecting src-tauri/, tauri.conf.json, Cargo.toml with tauri
  dependency, #[tauri::command], capabilities/*.json, or explicit Tauri mentions.
  Anti-patterns, cross-platform gotchas, security hardening, v1-to-v2 migration.
---

## Critical Rules (Tauri v2)

These prevent the most common errors. Apply before writing any Tauri code.

1. **Capabilities = minimum permissions** -- never `"permissions": ["fs:default"]` without explicit scopes; use granular `allow-*` + scope constraints
2. **`deny` always wins over `allow`** -- if a scope appears in both, deny prevails; capabilities are merged additively per window
3. **Async commands for window ops** -- sync commands that create/show/hide windows **deadlock on Windows** (WebView2 event loop conflict)
4. **`Result<T, E>` always** -- never `.unwrap()` in commands; sync panic = app crash, async panic = Promise hangs forever
5. **`State<'_, Mutex<T>>` not `State<'_, T>`** -- type mismatch compiles but **panics at runtime**; use type aliases
6. **Owned types in async commands** -- `&str` causes lifetime errors; use `String` and owned types only
7. **`std::sync::Mutex` for sync, `tokio::sync::Mutex` for async** -- holding `std::sync::MutexGuard` across `.await` = "future cannot be sent between threads"
8. **`core:default` is NOT enough** -- it excludes `window:allow-close`, `window:allow-hide`, `webview:allow-create-webview-window` -- add them explicitly
9. **`single-instance` must be the FIRST plugin registered** -- wrong order = duplicate instances not prevented
10. **Mobile: check plugin compatibility matrix** -- `global-shortcut`, `window-state`, `autostart`, `updater`, `cli` are desktop-only

## WebFetch Strategy

Use the consolidated `references/llms.txt` file to find official documentation URLs, then WebFetch for detailed API reference.

| Need | Source | Action |
|------|--------|--------|
| Architecture decisions, anti-patterns | Skill reference files | Read the relevant reference |
| Plugin API details, config options | Official docs via WebFetch | Read `llms.txt` → find URL → WebFetch |
| Exact Rust API signatures | docs.rs | WebFetch `https://docs.rs/tauri/latest/tauri/` |
| Error diagnosis | Skill troubleshooting tables | Read reference → fallback to WebFetch |
| Plugin installation steps | Official plugin docs | Read `llms.txt` Plugins section → WebFetch |

**Workflow:** Reference files first (rules, patterns, gotchas) → WebFetch only when you need details not in refs.

## IPC Mechanism Selection

| Need | Mechanism | Why |
|------|-----------|-----|
| Request/response (CRUD, queries) | Commands (`invoke`) | Type-safe, Promise-based, capability-enforced |
| Broadcast notification (all windows) | Events (`emit`) | Fire-and-forget, decoupled |
| Targeted notification (one window) | Events (`emit_to`) | Same as above, scoped to label |
| Streaming data (progress, logs) | Channels (`Channel<T>`) | Ordered, high-performance, within command context |
| Binary data > 10 KB | Raw payloads (`Request`/`Response`) | Bypasses JSON serialization entirely |
| Real-time bidirectional | Events (JS→Rust) + Channels (Rust→JS) | Combine for full-duplex pattern |

## Reference Files

- `references/architecture-security.md` -- Process model, capabilities schema, permissions system, CSP, isolation pattern
  - Sections: `<process_model>`, `<security_capabilities>`, `<permissions_scopes>`, `<csp_headers>`, `<isolation_pattern>`

- `references/config-structure.md` -- Project structure, tauri.conf.json schema, Cargo features, platform overlays, v1→v2 migration
  - Sections: `<project_structure>`, `<config_schema>`, `<cargo_features>`, `<build_hooks>`, `<migration_v1_v2>`

- `references/ipc-bridge.md` -- Commands, events, channels, state management, error handling, raw payloads, resource system
  - Sections: `<commands>`, `<events_channels>`, `<state_management>`, `<error_handling>`, `<resource_system>`, `<anti_patterns>`, `<troubleshooting>`

- `references/plugin-ecosystem.md` -- 30+ official plugins matrix, installation pattern, interactions, mobile compatibility, community plugins
  - Sections: `<plugin_matrix>`, `<installation_pattern>`, `<plugin_interactions>`, `<mobile_plugins>`, `<community_plugins>`

- `references/desktop-patterns.md` -- Multi-window, system tray, titlebar, menus, global shortcuts, sidecars, deep linking, splash screen
  - Sections: `<multi_window>`, `<system_tray>`, `<menus_shortcuts>`, `<sidecars>`, `<deep_linking>`, `<splash_screen>`

- `references/mobile-platform.md` -- Android/iOS setup, HMR, lib.rs pattern, platform differences, conditional compilation, distribution
  - Sections: `<environment_setup>`, `<mobile_gotchas>`, `<platform_differences>`, `<conditional_compilation>`, `<distribution>`

- `references/build-distribution.md` -- Build pipeline, code signing, updater plugin, CI/CD with tauri-action, store submission
  - Sections: `<build_pipeline>`, `<code_signing>`, `<updater_plugin>`, `<ci_cd>`, `<store_submission>`

- `references/testing-quality.md` -- Frontend mocking, Rust tauri::test, E2E with tauri-driver, debugging, tracing, CrabNebula DevTools
  - Sections: `<frontend_mocking>`, `<rust_testing>`, `<e2e_tauri_driver>`, `<debugging>`, `<tracing>`

- `references/llms.txt` -- Consolidated index of official Tauri v2 documentation URLs for WebFetch lookup

## Quick Troubleshooting Index

Route error symptoms to the right reference file.

| Symptom | Reference |
|---------|-----------|
| Deadlock on Windows (app freezes) | [ipc-bridge.md](references/ipc-bridge.md) anti_patterns |
| "borrowed value does not live long enough" in async command | [ipc-bridge.md](references/ipc-bridge.md) anti_patterns |
| "future cannot be sent between threads safely" | [ipc-bridge.md](references/ipc-bridge.md) anti_patterns |
| Permission denied / IPC command not found | [architecture-security.md](references/architecture-security.md) security_capabilities |
| `core:default` missing functionality | [architecture-security.md](references/architecture-security.md) permissions_scopes |
| CSP blocks inline scripts/styles | [architecture-security.md](references/architecture-security.md) csp_headers |
| Plugin not working on mobile | [plugin-ecosystem.md](references/plugin-ecosystem.md) mobile_plugins |
| `persisted-scope` silently fails | [plugin-ecosystem.md](references/plugin-ecosystem.md) plugin_interactions |
| IndexedDB/LocalStorage lost after v1→v2 migration | [config-structure.md](references/config-structure.md) migration_v1_v2 |
| Sidecar binary not found | [desktop-patterns.md](references/desktop-patterns.md) sidecars |
| Tray icon not showing on Linux | [desktop-patterns.md](references/desktop-patterns.md) system_tray |
| HMR not working on mobile device | [mobile-platform.md](references/mobile-platform.md) mobile_gotchas |
| Build fails for mobile target | [mobile-platform.md](references/mobile-platform.md) environment_setup |
| Updater signature verification fails | [build-distribution.md](references/build-distribution.md) updater_plugin |
| SmartScreen warning on Windows | [build-distribution.md](references/build-distribution.md) code_signing |
| `mockIPC` not intercepting plugin calls | [testing-quality.md](references/testing-quality.md) frontend_mocking |

## Boundary Declaration

**This skill covers:** Tauri v2 core (Rust backend, IPC, config, plugins, security, build, distribution, testing, mobile)

**This skill does NOT cover:** Frontend framework specifics (use svelte-skill or astro-skill), Rust language basics, WebView engine internals, native OS API details beyond Tauri abstractions

**Complements:** svelte-skill (Svelte/SvelteKit frontend), astro-skill (Astro/Cloudflare frontend), Rust language knowledge, Cloudflare documentation MCP (for deployment)
