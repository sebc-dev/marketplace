# Signing, versioning and store submission

The actionable chains for Android and iOS. Desktop packaging — MSIX, macOS notarisation and
entitlements, Snap — is in `flutter-architecture`, which owns the desktop target.

Sources reflect **Flutter 3.44** — the Android deployment page updated 2026-07-31, the iOS
page 2026-05-05. Store requirements are the most perishable content here: re-check before
relying on a date-sensitive claim.

## Android

### The two-key model

*"Android uses two signing keys: upload and app signing"* `[OFFICIAL, High]`.

| Key | Held by | Used for |
|---|---|---|
| **Upload key** | You | Signing the artefact you upload to Play |
| **App signing key** | Google, under Play App Signing | Re-signing what actually ships to devices |

The consequence that matters: a **lost upload key is recoverable** — Play support can register
a replacement — while an app signing key you chose to manage yourself is not. Prefer Play App
Signing precisely for that asymmetry.

Android 17 introduced the **v3.2 signing scheme** with post-quantum hybrid signatures, and the
official Android deployment page now covers it `[OFFICIAL]`. On the quarterly re-verification
list.

### Keystore handling

Generate the keystore outside the repository, reference it from `android/key.properties`, and
gitignore both files. The official warnings are explicit `[OFFICIAL, High]`:

> *"However, keep the keystore file private; don't check it into public source control!"*
> *"Keep the key.properties file private; don't check it into public source control."*

`build.gradle` reads `key.properties`; nothing about the key itself belongs in a tracked file.
In CI, the keystore travels as a base64-encoded secret and is materialised at build time — see
the CI/CD section of the skill once written.

## iOS

The chain, in order `[OFFICIAL, High]`:

1. **Register the Bundle ID** on the Apple Developer *Identifiers* page — an **Explicit App ID**,
   not a wildcard, for anything using entitlements.
2. **Create the App Store Connect record** matching that Bundle ID.
3. **Signing in Xcode** — `Automatically manage signing` is `true` by default; select the
   **Team**. Automatic signing provisions the profile for you.
4. **`flutter build ipa`** produces the `.xcarchive` and the `.ipa`.
5. **Upload**, by any of three documented routes: Apple Transporter,
   `xcrun altool --upload-app`, or Xcode's Validate/Distribute flow.

Flutter supports **iOS 13 and later**.

The iOS UIScene lifecycle migration (Flutter 3.38) is mandated by Apple and is required, not
optional `[OFFICIAL]`.

## Version and build number

`pubspec.yaml` carries both numbers in one field:

```yaml
version: 1.4.2+37
#        ^^^^^ version name    ^^ build number
```

| `pubspec.yaml` | Android | iOS |
|---|---|---|
| `1.4.2` (before `+`) | `versionName` | `CFBundleShortVersionString` |
| `37` (after `+`) | `versionCode` | `CFBundleVersion` |

**The build number is an integer both stores require to increase strictly.** A reused value is
rejected at upload, long after a green build — which is why release pipelines derive it from a
monotonic source (a CI run number, a commit count) rather than incrementing it by hand.

The version name is what users see and follows whatever product convention you set; the stores
do not enforce semver on it.

**Documented trap** — `--build-name` and `--build-number` historically did **not** override the
`pubspec.yaml` version on Android, while the same flags worked on iOS (flutter/flutter #23811).
Verify the value inside the produced artefact rather than trusting the flag to have applied.
`[OFFICIAL + tracker]`

## Release security

The official position is strong on one point and silent on the rest — do not let the strong
point lend authority to the silence.

**Stated, and unambiguous** `[OFFICIAL, High]`:

> *"It is a poor security practice to store secrets in an app. Obfuscating your code does not
> encrypt resources nor does it protect against reverse engineering. It only renames symbols
> with more obscure names."*

So `--obfuscate` raises the cost of reading decompiled code. It does not protect a key, a
token, or an endpoint compiled into the binary. Anything that must stay secret stays on a
server; the app receives a credential it is allowed to hold.

**The official security page** (reflecting Flutter 3.44.0, updated 2026-05-05) carries **three
practices, all of the "keep updated" kind**: keep the Flutter SDK current, keep dependencies
current, keep your copy of Flutter current. It says nothing about certificate pinning,
root/jailbreak detection, secure storage, or supply-chain verification beyond updating.

That silence is reported as silence. See the skill's *Name the silence* section: pinning exists
at the API level (`SecurityContext`, `HttpClient`, unsupported on web) with no official guidance
on *when* to pin, and the absence of a rule is not a rule against.
