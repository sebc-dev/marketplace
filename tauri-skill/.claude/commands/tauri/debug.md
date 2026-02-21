---
description: "Diagnose Tauri v2 errors. Routes symptoms to skill troubleshooting tables, then falls back to official documentation via WebFetch."
argument-hint: "[error message or symptom]"
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
  - WebFetch
---

# Debug Tauri v2 Errors

Diagnose Tauri v2 errors by routing symptoms to the correct skill reference file and presenting structured fixes. Falls back to official documentation via WebFetch when no local match is found.

## Step 1: Accept Symptom

Use `$ARGUMENTS` as the error or symptom description. If `$ARGUMENTS` is empty, ask the user to describe the error or paste the full error message.

## Step 2: Route Symptom to Reference Files

Match the user's symptom against this routing table to identify which reference file(s) contain the relevant troubleshooting information:

| Symptom Pattern | Reference File(s) |
|---|---|
| App freezes / deadlock on Windows | `ipc-bridge.md` |
| "borrowed value does not live long enough" | `ipc-bridge.md` |
| "future cannot be sent between threads safely" | `ipc-bridge.md` |
| `.unwrap()` panic / Promise never resolves | `ipc-bridge.md` |
| State type mismatch / runtime panic | `ipc-bridge.md` |
| Permission denied / command not found (IPC) | `architecture-security.md` |
| `core:default` missing functionality | `architecture-security.md` |
| CSP blocks scripts/styles/images | `architecture-security.md` |
| Capability not applying / window has no IPC | `architecture-security.md` |
| Isolation pattern issues | `architecture-security.md` |
| `tauri.conf.json` schema error | `config-structure.md` |
| Build fails / cargo feature errors | `config-structure.md` |
| IndexedDB/LocalStorage lost after migration | `config-structure.md` |
| Platform overlay not merging correctly | `config-structure.md` |
| Plugin not found / version mismatch | `plugin-ecosystem.md` |
| Plugin not working on mobile | `plugin-ecosystem.md` |
| `persisted-scope` silently fails | `plugin-ecosystem.md` |
| Plugin registration order issue | `plugin-ecosystem.md` |
| Window creation fails / multi-window issues | `desktop-patterns.md` |
| Tray icon not showing (especially Linux) | `desktop-patterns.md` |
| Sidecar binary not found | `desktop-patterns.md` |
| Deep link spawns new instance | `desktop-patterns.md` |
| Menu items not appearing (macOS) | `desktop-patterns.md` |
| HMR not working on mobile device | `mobile-platform.md` |
| Android/iOS build fails | `mobile-platform.md` |
| Safe area / status bar issues | `mobile-platform.md` |
| App Review rejection (4.2) | `mobile-platform.md` |
| Updater signature verification fails | `build-distribution.md` |
| SmartScreen warning on Windows | `build-distribution.md` |
| Mac App Store white screen | `build-distribution.md` |
| Code signing errors in CI | `build-distribution.md` |
| `mockIPC` not intercepting calls | `testing-quality.md` |
| MockRuntime compile errors | `testing-quality.md` |
| tauri-driver not working | `testing-quality.md` |
| DevTools not opening | `testing-quality.md` |

If the symptom matches multiple patterns, route to ALL matched reference files.

If no clear match, check the three most likely based on context:
- Build/config errors → `config-structure.md` or `build-distribution.md`
- Runtime/IPC errors → `ipc-bridge.md` or `architecture-security.md`
- Platform-specific errors → `desktop-patterns.md` or `mobile-platform.md`

## Step 3: Read Troubleshooting Section from Matched Reference File(s)

For each matched reference file:

1. Find the troubleshooting section:
   ```
   grep -n '<troubleshooting>' .claude/skills/tauri-development/references/{matched-file}
   ```
2. Read the troubleshooting table (columns: Symptom | Cause | Fix)
3. Find the row that most closely matches the user's symptom

## Step 4: Check Anti-patterns (Fallback)

If no direct match was found in the troubleshooting table, check the anti_patterns section:

1. Find the anti-patterns section:
   ```
   grep -n '<anti_patterns>' .claude/skills/tauri-development/references/{matched-file}
   ```
2. Read the anti-patterns table
3. Check if the user's error aligns with a known anti-pattern

## Step 5: Check Critical Rules

Read the Critical Rules section from SKILL.md to check if the symptom matches any of the 10 rules:

```
grep -n "## Critical Rules" .claude/skills/tauri-development/SKILL.md
```

Many Tauri v2 errors trace back to one of these violations.

## Step 6: Read Relevant Project Files

To confirm the diagnosis, read the user's project files that relate to the error:

- **IPC/command errors:** Read the failing .rs command file
- **Permission errors:** Read `src-tauri/capabilities/*.json`
- **Config errors:** Read `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml`
- **Build errors:** Read `src-tauri/build.rs`, `src-tauri/Cargo.toml`
- **State errors:** Read `src-tauri/src/lib.rs` (manage() calls)
- **Plugin errors:** Read `src-tauri/Cargo.toml` (plugin deps) + capabilities

Use Glob to locate files if paths are uncertain:
```
glob src-tauri/capabilities/*.json
glob src-tauri/src/**/*.rs
```

## Step 7: Present Diagnosis

Present the diagnosis in this structured format:

### Diagnosis

**Symptom:** [User's error description]

**Likely Cause:** [From troubleshooting table, anti-patterns, or Critical Rules]

**Fix:**
[From troubleshooting table fix column, with code snippet showing the exact change needed.]

**Prevention:** [How to avoid this in the future]

**Reference:** [Link to the reference file section, e.g., "See `.claude/skills/tauri-development/references/ipc-bridge.md` anti_patterns section"]

### If No Match Found in Skill References

If no troubleshooting entry, anti-pattern, or Critical Rule matches the symptom:

1. Say so honestly: "This symptom is not covered in the skill's troubleshooting tables."
2. **WebFetch the official docs:**
   - Read `references/llms.txt` to find the most relevant documentation URL
   - WebFetch that URL for detailed information
   - Example: for a plugin error, WebFetch the plugin's documentation page
3. Suggest the user share more context (full error stack trace, config files, reproduction steps).

## Step 8: Offer to Apply Fix

Ask the user: "Would you like me to apply this fix to your project?"

Do NOT auto-apply the fix. Wait for explicit user confirmation before making any changes.

## Important Constraints

- ALWAYS read from reference files for diagnosis. Never diagnose from memory alone.
- Route to MULTIPLE reference files if the symptom spans domains.
- Check Critical Rules for EVERY diagnosis -- many errors trace to these violations.
- Present the fix before applying it. The user decides whether to proceed.
- Use WebFetch as a fallback when skill references don't cover the symptom.
