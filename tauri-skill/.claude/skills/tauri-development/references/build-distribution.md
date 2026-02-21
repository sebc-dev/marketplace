# Build & Distribution

Build pipeline, code signing, auto-updater, CI/CD workflows, and store submission for Tauri v2 applications. Covers desktop installer formats, cross-compilation constraints, and release automation.

<build_pipeline>
## Build pipeline: flags, hooks, release profile, removeUnusedCommands

### cargo tauri build flags

| Flag | Description |
|------|-------------|
| `--target <TRIPLE>` | Rust target (`x86_64-apple-darwin`, `aarch64-apple-darwin`, `universal-apple-darwin`) |
| `--bundles <FORMATS>` | `deb`, `rpm`, `appimage`, `nsis`, `msi`, `app`, `dmg`, `updater` |
| `--debug` / `-d` | Build in debug mode |
| `--no-bundle` | Compile binary without installer -- enables split build |
| `--config <JSON>` | JSON string or path, merged via RFC 7396 (JSON Merge Patch) |
| `--features <FEATURES>` | Cargo features (comma or space separated) |
| `--ci` | Skip password prompt if `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` empty |

**Split build**: `cargo tauri build --no-bundle` then `cargo tauri bundle --bundles nsis,updater`. Enables App Store vs direct distribution variants from same binary with different `--config`.

### Hooks execution order

1. `beforeBuildCommand` -- typically `npm run build` (frontend)
2. `cargo build --release` (Rust compilation)
3. `beforeBundleCommand` -- post-compile, pre-packaging
4. Bundling installers

Hooks receive env vars: `TAURI_ENV_PLATFORM`, `TAURI_ENV_ARCH`, `TAURI_ENV_FAMILY`, `TAURI_ENV_DEBUG`, `TAURI_ENV_TARGET_TRIPLE`.

### Release profile optimization

```toml
[profile.release]
codegen-units = 1    # Better LLVM optimization (slower compile)
lto = true           # Full link-time optimization
opt-level = "s"      # Optimize for size ("z" = smallest, "3" = fastest)
panic = "abort"      # Remove unwinding logic (~100 KB saved)
strip = true         # Remove debug symbols
```

### removeUnusedCommands (v2.4+)

```json
{ "build": { "removeUnusedCommands": true } }
```

Eliminates IPC commands not referenced in capability files, reducing binary size.
</build_pipeline>

<code_signing>
## Code signing: decision tree, macOS, Windows, Linux

### Decision tree by context

```
Direct distribution?
+-- macOS -> Apple Developer ($99/yr) -- MANDATORY for notarization
+-- Windows -> Azure Trusted Signing ($9.99/mo) -- best cost/simplicity
+-- Linux -> GPG (free, optional, not OS-enforced)
+-- No budget?
    +-- macOS -> Gatekeeper blocks execution (user must whitelist manually)
    +-- Windows -> SmartScreen warning ("Run anyway" available)
    +-- Linux -> No impact

Store distribution?
+-- Mac App Store -> Apple Distribution cert (included in $99/yr)
+-- Google Play -> Java keystore (free) + $25 one-time
+-- Microsoft Store -> Code signing required (OV/EV or Azure Trusted Signing)
+-- iOS App Store -> Apple Developer Program ($99/yr)
```

### Cost comparison

| Option | Annual cost | Platform | Notes |
|--------|------------|----------|-------|
| Apple Developer Program | **$99/yr** | macOS, iOS | Mandatory for notarization + stores |
| Azure Trusted Signing Basic | **~$120/yr** | Windows | Cloud, no physical token, 5000 sigs/mo |
| OV cert (Sectigo, DigiCert) | $200-500/yr | Windows | Hardware token mandatory since June 2023 |
| EV cert | $300-900/yr | Windows | Token included, SmartScreen no longer instant |
| Google Play Developer | **$25 one-time** | Android | Java keystore free |
| GPG (Linux) | Free | Linux | Manual verification by user |

### macOS env vars for CI

```bash
APPLE_CERTIFICATE              # .p12 base64-encoded
APPLE_CERTIFICATE_PASSWORD     # Export password
APPLE_SIGNING_IDENTITY         # "Developer ID Application: Name (TEAMID)"
# Notarization via App Store Connect API (recommended for CI):
APPLE_API_ISSUER               # Issuer ID
APPLE_API_KEY                  # Key ID
APPLE_API_KEY_PATH             # Path to .p8 file
```

### Windows: Azure Trusted Signing

OV certs require hardware token since June 2023. Azure Trusted Signing is simpler:
```json
{ "bundle": { "windows": {
  "signCommand": "trusted-signing-cli -e https://wus2.codesigning.azure.net -a MyAccount -c MyProfile -d MyApp %1"
}}}
```
Requires: `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`, `AZURE_TENANT_ID`.
</code_signing>

<updater_plugin>
## Updater: architecture, Ed25519, latest.json, JS API

### Architecture: check -> download -> verify -> install -> restart

HTTP GET to endpoints with `{{target}}`, `{{arch}}`, `{{current_version}}` interpolation. Server responds **200 + JSON** (update available) or **204** (none). Ed25519 signature verification is **mandatory and cannot be disabled**.

### Key generation

```bash
cargo tauri signer generate -w ~/.tauri/myapp.key
# Creates: myapp.key (PRIVATE) + myapp.key.pub (PUBLIC)
```

Public key content goes in `plugins.updater.pubkey`. Private key via `TAURI_SIGNING_PRIVATE_KEY` env var (string content or file path). **.env files do NOT work** -- use real environment variables.

### Config

```json
{ "bundle": { "createUpdaterArtifacts": true },
  "plugins": { "updater": {
    "pubkey": "<PUBLIC_KEY_CONTENT>",
    "endpoints": ["https://github.com/USER/REPO/releases/latest/download/latest.json"],
    "windows": { "installMode": "passive" }
}}}
```

`createUpdaterArtifacts`: `true` (new v2 apps) or `"v1Compatible"` (migration from v1 only).

### latest.json schema

```json
{ "version": "1.2.0", "notes": "Bug fixes", "pub_date": "2025-01-15T12:00:00Z",
  "platforms": {
    "linux-x86_64": { "signature": "<.sig file content>", "url": "https://cdn/myapp.AppImage" },
    "darwin-aarch64": { "signature": "...", "url": "https://cdn/myapp.app.tar.gz" },
    "windows-x86_64": { "signature": "...", "url": "https://cdn/myapp-setup.exe" }
}}
```

Required: `version`, `platforms.<target>.url`, `platforms.<target>.signature`. Platform keys: `{linux|darwin|windows}-{x86_64|aarch64|i686|armv7}`.

### JS API with progress callback

```typescript
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
const update = await check();
if (update) {
  await update.downloadAndInstall((event) => {
    if (event.event === 'Progress') downloaded += event.data.chunkLength;
  });
  await relaunch();
}
```

### Windows installMode

| Mode | Behavior |
|------|----------|
| `"passive"` | Progress bar, no interaction (default) |
| `"basicUi"` | User interaction required |
| `"quiet"` | No feedback |
</updater_plugin>

<ci_cd>
## CI/CD: tauri-action workflow, matrix, cost estimates

### Production workflow with tauri-action

```yaml
release:
  permissions: { contents: write }
  strategy:
    fail-fast: false
    matrix:
      include:
        - { platform: macos-latest, args: '--target aarch64-apple-darwin' }
        - { platform: macos-latest, args: '--target x86_64-apple-darwin' }
        - { platform: ubuntu-22.04, args: '' }
        - { platform: windows-latest, args: '' }
  runs-on: ${{ matrix.platform }}
  steps:
    - uses: actions/checkout@v4
    - if: startsWith(matrix.platform, 'ubuntu')
      run: sudo apt-get install -y libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf
    - uses: actions/setup-node@v4
      with: { node-version: 'lts/*', cache: 'pnpm' }
    - run: pnpm install --frozen-lockfile
    - uses: dtolnay/rust-toolchain@stable
    - uses: swatinem/rust-cache@v2
      with: { workspaces: './src-tauri -> target' }
    - uses: tauri-apps/tauri-action@v0
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        TAURI_SIGNING_PRIVATE_KEY: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY }}
        APPLE_CERTIFICATE: ${{ secrets.APPLE_CERTIFICATE }}
        APPLE_SIGNING_IDENTITY: ${{ secrets.APPLE_SIGNING_IDENTITY }}
      with: { tagName: 'v__VERSION__', releaseDraft: true, args: '${{ matrix.args }}' }
```

### Key tauri-action inputs

| Input | Description |
|-------|-------------|
| `tagName` | Release tag. `__VERSION__` replaced by `tauri.conf.json` version |
| `releaseDraft` | Create as draft (publish manually after review) |
| `args` | Extra args passed to `tauri build` |
| `uploadUpdaterJson` | Generate and upload `latest.json` (default: true) |
| `updaterJsonPreferNsis` | Prefer NSIS over WiX in updater JSON |

### Build time and cost estimates

| Platform | Without cache | With rust-cache | Cost/build (private) |
|----------|:------------:|:--------------:|:-------------------:|
| Linux (ubuntu-22.04) | ~8-15 min | ~3-7 min | ~$0.03 |
| Windows | ~12-20 min | ~5-10 min | ~$0.08 |
| macOS (+ notarization) | ~10-18 min | ~4-8 min | ~$0.50 |

**Total per release** (4 targets, private, cached): **~$1.10**. Public repos: free. `swatinem/rust-cache` is essential.
</ci_cd>

<store_submission>
## Store submission: Mac App Store, Google Play, Microsoft Store

### Mac App Store

| Rule | Detail |
|------|--------|
| Sandbox | **Mandatory** |
| `network.client` entitlement | **Required** -- white screen without it (WebView needs network) |
| `devtools` feature | **Rejection** -- uses private APIs |
| `macos-private-api` | **Rejection** -- private APIs |

Split build for App Store:
```bash
cargo tauri build --no-bundle --target universal-apple-darwin
cargo tauri bundle --bundles app --config src-tauri/tauri.appstore.conf.json
xcrun productbuild --sign "3rd Party Mac Developer Installer: Name (TEAMID)" \
  --component "./target/universal-apple-darwin/release/bundle/macos/App.app" /Applications "App.pkg"
```

### Google Play

versionCode auto-derived: `major*1000000 + minor*1000 + patch`. AAB required (`cargo tauri android build --aab`). versionCode must be strictly increasing.

### Microsoft Store

No native MSIX from Tauri. Options: (1) submit as EXE/MSI with `webviewInstallMode: "offlineInstaller"`, (2) manually create MSIX with `makeappx.exe`. Upload unsigned MSIX -- Microsoft signs automatically.

### Installer format comparison

| Format | Platform | Size | Notes |
|--------|----------|------|-------|
| NSIS (.exe) | Windows | 3-6 MB | Cross-compile from Linux/macOS, `currentUser` mode |
| WiX (.msi) | Windows | 3-6 MB | Enterprise/GPO, Windows-only build, per-machine only |
| DMG + .app | macOS | 3-8 MB | Standard macOS distribution |
| .deb | Linux | 2-6 MB | Debian/Ubuntu, lightweight |
| AppImage | Linux | **70-90 MB** | Universal, embeds webkit2gtk (~70 MB) |
| RPM | Linux | 2-6 MB | Fedora/RHEL/openSUSE |
</store_submission>

<anti_patterns>
## Anti-patterns

| Anti-pattern | Problem | Correct approach |
|-------------|---------|-----------------|
| Missing `strip = true` in release profile | Debug symbols add several MB | Always set in `[profile.release]` |
| Cross-compile to macOS from other OS | Impossible (Apple proprietary toolchain) | Use macOS runner in CI |
| `.env` files for `TAURI_SIGNING_PRIVATE_KEY` | Silently ignored by CLI | Use real environment variables |
| `signature` field as URL/path in latest.json | Updater expects content | Paste `.sig` file **text content** directly |
| `devtools` feature in App Store build | Apple rejects private API usage | Remove before store submission |
| EV cert to bypass SmartScreen | No longer grants instant reputation (since March 2024) | Build reputation organically with OV or Azure Trusted Signing |
| `releaseDraft: false` in CI | Untested artifacts go live immediately | Always use `releaseDraft: true`, publish manually |
| Trying to shrink AppImage | webkit2gtk ~70 MB is structural, incompressible | Offer .deb as lightweight alternative |
| UPX compression on Windows/macOS | Triggers antivirus false positives | Avoid or reserve for offline distribution only |
</anti_patterns>

<troubleshooting>
## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| White screen on Mac App Store | Missing `com.apple.security.network.client` entitlement | Add to entitlements file |
| App Store rejection (private APIs) | `devtools` or `macos-private-api` feature enabled | Remove features for store builds |
| Updater signature verification fails | Wrong content in `signature` field | Use text content of `.sig` file, not path |
| `TAURI_SIGNING_PRIVATE_KEY` not found | Using `.env` file | Export as real env var or CI secret |
| SmartScreen warning despite EV cert | No instant reputation since March 2024 | Build reputation over time with signed releases |
| AppImage requires `libfuse2` | Missing dependency on modern Ubuntu | Install `libfuse2` or use .deb instead |
| latest.json URLs broken | `releaseId` without `tagName` in tauri-action | Always provide `tagName` to tauri-action |
| Cross-compilation NSIS fails | Experimental, many edge cases | Use GitHub Actions multi-OS matrix instead |
| Build non-reproducible | Rust + frontend bundlers not deterministic | Lock CI action versions (`@v4` not `@main`), trust build system |
| versionCode conflict on Play Store | Same semver produces same versionCode | Bump version or set explicit `bundle.android.versionCode` |
</troubleshooting>
