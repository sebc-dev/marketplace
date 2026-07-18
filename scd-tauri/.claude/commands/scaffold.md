---
description: "Create a new Tauri v2 project with secure defaults, correct capability configuration, and recommended plugin setup."
argument-hint: "[project name]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
---

# Scaffold Tauri v2 Project

Create a new Tauri v2 project with secure defaults and best practices from the tauri-development skill.

## Step 1: Project Name

Use `$ARGUMENTS` as the project directory name. If `$ARGUMENTS` is empty, ask the user for a project name before proceeding.

## Step 2: Configuration Questions

Ask the user ALL of the following questions at once using AskUserQuestion:

1. **Frontend framework:**
   - Vanilla TypeScript (default)
   - Vue.js
   - Svelte
   - React
   - None (Rust-only with Leptos/Yew)

2. **Target platforms:**
   - Desktop only (Windows, macOS, Linux) (default)
   - Desktop + Android
   - Desktop + iOS
   - Desktop + Android + iOS

3. **Plugins to include:**
   - Minimal (opener only) (default)
   - Standard (opener, fs, dialog, store, log, process)
   - Full (standard + http, notification, updater, window-state, single-instance)

4. **System tray:** Yes / No (default)

5. **Auto-updater:** Yes / No (default)

6. **Package manager:** npm (default), pnpm, bun, yarn

Wait for the user's answers before proceeding to Step 3.

## Step 3: Read Patterns from Skill Reference Files

CRITICAL: Do NOT generate config files from memory. Read patterns from the skill reference files and adapt them.

### Always read:

- **Security capabilities:**
  ```bash
  grep -n '<security_capabilities>' .claude/skills/tauri-development/references/architecture-security.md
  ```

- **Project structure:**
  ```bash
  grep -n '<project_structure>' .claude/skills/tauri-development/references/config-structure.md
  ```

- **Config schema:**
  ```bash
  grep -n '<config_schema>' .claude/skills/tauri-development/references/config-structure.md
  ```

- **Cargo features:**
  ```bash
  grep -n '<cargo_features>' .claude/skills/tauri-development/references/config-structure.md
  ```

### Conditionally read:

- **If plugins selected:**
  ```bash
  grep -n '<installation_pattern>' .claude/skills/tauri-development/references/plugin-ecosystem.md
  grep -n '<plugin_interactions>' .claude/skills/tauri-development/references/plugin-ecosystem.md
  ```

- **If tray selected:**
  ```bash
  grep -n '<system_tray>' .claude/skills/tauri-development/references/desktop-patterns.md
  ```

- **If updater selected:**
  ```bash
  grep -n '<updater_plugin>' .claude/skills/tauri-development/references/build-distribution.md
  ```

- **If mobile selected:**
  ```bash
  grep -n '<conditional_compilation>' .claude/skills/tauri-development/references/mobile-platform.md
  grep -n '<environment_setup>' .claude/skills/tauri-development/references/mobile-platform.md
  ```

## Step 4: Create Project

Use `create-tauri-app` to scaffold the base project:

```bash
npm create tauri-app@latest $PROJECT_NAME -- --template <template-based-on-framework>
```

Template mapping:
- Vanilla TypeScript → `vanilla-ts`
- Vue.js → `vue-ts`
- Svelte → `svelte-ts`
- React → `react-ts`

Then apply customizations based on user choices.

## Step 5: Customize Configuration

### tauri.conf.json enhancements:

1. **Add CSP** (always):
   ```json
   "app": {
     "security": {
       "csp": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' asset: http://asset.localhost blob: data:; connect-src ipc: http://ipc.localhost"
     }
   }
   ```

2. **Add release profile** in Cargo.toml (always):
   ```toml
   [profile.release]
   codegen-units = 1
   lto = true
   opt-level = "s"
   panic = "abort"
   strip = true
   ```

3. **Enable removeUnusedCommands** (always):
   ```json
   "build": { "removeUnusedCommands": true }
   ```

### If tray selected:
4. Add `"tray-icon"` to Cargo features
5. Add tray setup code in lib.rs setup closure (read from desktop-patterns.md)

### If updater selected:
6. Add `tauri-plugin-updater` and `tauri-plugin-process` deps
7. Generate signing keys: `cd $PROJECT_NAME && cargo tauri signer generate -w ~/.tauri/$PROJECT_NAME.key`
8. Add updater config to tauri.conf.json

### If mobile selected:
9. Verify `crate-type = ["staticlib", "cdylib", "lib"]` in Cargo.toml
10. Add platform-specific capability files
11. Run `cargo tauri android init` and/or `cargo tauri ios init`

## Step 6: Configure Capabilities

Replace the default capability with a properly scoped one:

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "Default capabilities for the main window",
  "windows": ["main"],
  "permissions": [
    "core:default"
  ]
}
```

Add plugin permissions based on selection (granular, not defaults):
- opener: `"opener:default"`
- fs: `"fs:allow-read-text-file"`, `"fs:allow-write-text-file"` (with scopes)
- dialog: `"dialog:default"`
- store: `"store:default"`
- log: `"log:default"`
- process: `"process:default"`
- notification: `"notification:default"`
- window-state: (Rust-only, no permissions needed)
- single-instance: (Rust-only, no permissions needed)

## Step 7: Install Plugins

Based on selection, add plugins using the official CLI:

```bash
cd $PROJECT_NAME/src-tauri
cargo tauri add opener  # Always included
# Based on choices:
cargo tauri add fs
cargo tauri add dialog
cargo tauri add store
cargo tauri add log
cargo tauri add process
```

## Step 8: Plugin Registration Order

Ensure `lib.rs` registers plugins in the correct order:

```rust
tauri::Builder::default()
    // 1. single-instance MUST be first (if selected)
    // 2. fs
    // 3. dialog
    // 4. persisted-scope AFTER fs (if selected)
    // 5. All other plugins in any order
    .plugin(tauri_plugin_opener::init())
    .invoke_handler(tauri::generate_handler![greet])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
```

## Step 9: Post-Creation Summary

Print a summary:

```markdown
## Project Created: [name]

### Configuration
- Frontend: [framework]
- Platforms: [targets]
- Plugins: [list]
- Tray: [yes/no]
- Updater: [yes/no]

### Files Created/Modified
[list of generated/modified files]

### Security
- CSP configured
- Capabilities scoped to main window
- Release profile optimized
- removeUnusedCommands enabled

### Next Steps
1. `cd [project-name]`
2. `npm run tauri dev`
3. Open http://localhost:1420 (frontend) — Tauri app launches automatically

### Key Conventions (Tauri v2)
- All app code in `src-tauri/src/lib.rs` (not main.rs)
- Use `async` for any command that touches windows
- Always return `Result<T, E>` from commands (never unwrap)
- Use `State<'_, Mutex<T>>` for shared state
- Capabilities in `src-tauri/capabilities/` control IPC access
- `core:default` excludes close/hide — add explicitly if needed
```

## Critical Rules (MUST apply to all generated code)

1. All commands must be `async` if they touch windows
2. All commands must return `Result<T, E>`
3. State must use `Mutex<T>` wrapper
4. Capabilities must use granular permissions with scopes
5. CSP must be configured
6. Release profile must be optimized
7. Plugin order: single-instance first, persisted-scope after fs

NEVER inline patterns from memory. Always read them from the reference files in Step 3.
