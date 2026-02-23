# tauri-skill

Tauri v2 desktop and mobile application development skill for Claude Code. Architecture decisions, security hardening, anti-pattern prevention, plugin selection, and cross-platform troubleshooting. Uses WebFetch for official Tauri documentation lookup on demand.

## What this skill covers

- **Architecture & security** -- Process model, capabilities, permissions, scopes, CSP, isolation pattern
- **Configuration** -- tauri.conf.json schema, Cargo features, platform overlays, v1-to-v2 migration
- **IPC bridge** -- Commands, events, channels, state management, error handling, raw payloads
- **Plugin ecosystem** -- 30+ official plugins, selection matrix, mobile compatibility, community plugins
- **Desktop patterns** -- Multi-window, system tray, menus, global shortcuts, sidecars, deep linking
- **Mobile development** -- Android/iOS setup, HMR, conditional compilation, platform differences
- **Build & distribution** -- Build pipeline, code signing, auto-updater, CI/CD, store submission
- **Testing & quality** -- Frontend mocking, Rust testing, E2E with tauri-driver, tracing, DevTools

## Documentation strategy

This skill uses a **hybrid approach**: lean reference files containing rules, anti-patterns, and decision matrices are loaded on demand, while the official Tauri v2 documentation is accessed via WebFetch using a consolidated `llms.txt` index. This means the skill stays compact while still providing access to the full official documentation when needed.

## Commands

| Command | Description |
|---------|-------------|
| `/scd:tauri-audit` | Audit a project against security best practices and anti-patterns |
| `/scd:tauri-debug` | Diagnose errors using troubleshooting tables and official docs |
| `/scd:tauri-scaffold` | Create a new Tauri v2 project with secure defaults |

## Install

```bash
/plugin install tauri-skill@sebc-dev-marketplace
```

## Requirements

- Tauri v2.x project (v2.10+ recommended)
- Rust toolchain installed
- Platform-specific prerequisites (see [Tauri prerequisites](https://v2.tauri.app/start/prerequisites))

## License

MIT
