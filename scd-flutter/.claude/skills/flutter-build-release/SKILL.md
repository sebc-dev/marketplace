---
name: flutter-build-release
description: |
  Flutter build, dependencies, release and delivery — everything between the source tree and a
  signed Android or iOS artefact in a store. It produces the artefact and the pipeline that
  emits it; reading what that costs is elsewhere.
  Use when wiring a flavor or a --dart-define into the build, editing pubspec.yaml or resolving
  a version conflict, setting up an Android keystore or an iOS provisioning profile, bumping a
  release version, splitting a repo into Pub workspaces, publishing to pub.dev, writing a
  release pipeline, upgrading Flutter or AGP, or shrinking a binary.
---

# Flutter build, release and delivery

Reference: **Flutter 3.44.0** (stable 2026-05-18) · Dart SDK **3.12.x**.

**This is the most perishable skill in the plugin.** Every rule carries a Flutter version and
a date, and the skill maintains its own quarterly re-verification list. A rule without a date
is a bug.

## Four rules that get a build rejected or a secret leaked

Each is short, well-sourced and costly to get wrong. Apply them before anything else here.

**1. The keystore and `key.properties` stay out of version control.** *"However, keep the
keystore file private; don't check it into public source control!"* and *"Keep the
key.properties file private; don't check it into public source control."* `[OFFICIAL, High]`
Reference `key.properties` from `build.gradle`, gitignore both, and hold the keystore in a
secret store.

**2. Android signs with two different keys.** *"Android uses two signing keys: upload and app
signing"* `[OFFICIAL, High]`. You sign with the **upload key**; Google re-signs with the **app
signing key** and that is what reaches the device. Losing the upload key is recoverable through
Play support — losing an app signing key you manage yourself is not. Treating them as one key
is the most common Android release mistake.

**3. The build number must strictly increase.** `version: x.y.z+n` in `pubspec.yaml` maps to
`versionName`/`versionCode` on Android and
`CFBundleShortVersionString`/`CFBundleVersion` on iOS `[OFFICIAL, High]`. The part after `+` is
an integer the stores require to be strictly increasing; reusing one is rejected at upload, not
at build. Documented trap: `--build-name`/`--build-number` historically did **not** override the
`pubspec.yaml` version on Android while they did on iOS (flutter/flutter #23811) — verify the
value in the produced artefact rather than trusting the flag.

**4. Obfuscation is not encryption, and an app is not a place for secrets.** *"It is a poor
security practice to store secrets in an app. Obfuscating your code does not encrypt resources
nor does it protect against reverse engineering. It only renames symbols with more obscure
names."* `[OFFICIAL, High]` An API key shipped inside the binary is extractable whether or not
`--obfuscate` is on. Keep the secret server-side and give the app a token it may hold.

## Environments and flavors

Two mechanisms, and they answer different questions — mixing them up is what produces the trap
below.

| Mechanism | Configures | Reaches |
|---|---|---|
| **Flavors** — Gradle product flavors, Xcode schemes | The *native* build: app id / bundle id, app name, icons, per-environment native config | Native and Dart |
| **`--dart-define` / `--dart-define-from-file`** | Compile-time constants for **Dart code** | Dart only |

A separate app id per flavor is what lets dev, staging and prod live side by side on one device;
`--dart-define` cannot do that, because it never reaches the native build.

**The trap: `--dart-define-from-file` values are not readable from Gradle or `Info.plist`.**
That access existed briefly and was **removed in Flutter 3.16** (flutter/flutter #139289;
introduced by PR #136865, removed per #138793). The Flutter CLI tech lead took public
responsibility for the regression `[MAINTAINER, High]`:

> *"I recognize that there were many users who started using variables provided via
> --dart-define-from-file in their native build configurations who were then broken with the
> Flutter 3.16 release when this behavior was removed. I take personal responsibility for this,
> as I both reviewed the PR which introduced this behavior and the follow-up that removed it."*

So a `build.gradle` or `Info.plist` reading those keys is broken on any current Flutter.
Native-side configuration goes through the native mechanisms — Gradle flavor properties, Xcode
build settings, `.xcconfig` — and Dart-side values through `--dart-define`. This sits on the
quarterly re-verification list because it is a removal that could be reinstated.

**`appFlavor` fails silently.** The constant from `package:flutter/services.dart` returns
**`null`** when no flavor was passed, so code branching on it takes the default path in a build
nobody flavoured rather than failing. Assert it early in `main` if a flavor is mandatory.

Where the `main_dev.dart` / `main_prod.dart` entry points sit in the tree is
`flutter-architecture`'s call; this skill covers only the build that consumes them.

## Dependency constraints and resolution

**Pub resolves every package to a single version across the whole build.** Two versions of one
package cannot coexist — the consequence is type conflicts, duplicated global state and binary
size, so a constraint conflict is resolved, never worked around `[OFFICIAL, High]`.

| Rule | Why |
|---|---|
| `^1.2.3` allows `>=1.2.3 <2.0.0` | Standard caret, post-1.0 |
| `^0.2.3` allows `>=0.2.3 <0.3.0` | Before 1.0.0 any **minor** bump may break, so the caret is tighter than it looks |
| Always give the SDK constraint a lower bound | Omitting it fails with `pubspec.yaml has no lower-bound SDK constraint`. A caret on the SDK constraint is valid only from Dart 2.19 |
| Avoid `any` | It opts out of resolution safety and lets an incompatible major version in |

`dependency_overrides` (and `pubspec_overrides.yaml`) is a **development-time** escape hatch:
it forces a version past the resolver, which is exactly what makes it unsafe to ship. Remove it
before publishing — pub.dev accepts only published dependencies and rejects a package that
declares overrides.

## Monorepos and publishing to pub.dev

**Pub handles monorepos natively since Dart 3.6 / Flutter 3.27** — `workspace:` in the root
`pubspec.yaml`, `resolution: workspace` in each member, no third-party tool needed for shared
resolution `[OFFICIAL, High]`. melos still earns its place for task orchestration and automated
versioning, and now builds on top of workspaces rather than replacing them.

**Publishing is forever** `[OFFICIAL, High]` — `dart pub publish --dry-run` first, because a
wrong version or a leaked file cannot be withdrawn. Run `pana` locally to see the score before
pub.dev does. A package declaring `dependency_overrides` is refused: the single-version rule
above, and its sanction.

The four workspace traps, the SwiftPM scoring rule, the retired popularity score and the melos
arbitration are in [`references/delivery.md`](references/delivery.md).

## Toolchain upgrades

**Do not move a Flutter app to AGP 9.** *"Do not update your Flutter app for Android to AGP 9
as migrating plugins to AGP 9 and Flutter apps on AGP 9 using plugins is not yet supported
(#181383). This support is paused while the Flutter team audits the migration for backwards
compatibility with older versions of AGP."* `[OFFICIAL, High]` — Flutter 3.41 blog. This is the
most date-sensitive rule in the plugin: re-check it every stable before repeating it.

Stable moves roughly every three months. The upgrade path is the official breaking-changes page
plus its migration guides, with an announcements mailing list and a test registry `[OFFICIAL]`.
The iOS **UIScene lifecycle migration** (Flutter 3.38) is mandated by Apple and is required, not
optional `[OFFICIAL]`.

**Pinning the SDK per project** is `fvm`'s job `[MAINTAINER/PRACTICE]`. Two mechanics that decide
whether it works for a team: commit the fvm **config** so everyone resolves the same version, and
gitignore the `.fvm/flutter_sdk` **symlink**, which is machine-local. Committing the symlink or
ignoring the config each break the other developer's checkout.

## CI/CD

Official deployment guidance exists and is **fastlane-centred**, with worked examples for the
usual platforms `[OFFICIAL]`; iOS scripts need `FLUTTER_ROOT` set. **No CI platform is
endorsed** — vendor documentation describes that vendor's product, not Flutter best practice.

Three things a pipeline solves whatever the platform: signing secrets reach the build from the
CI secret store and never from the repository (the `key.properties` rule again); the build
number derives from a monotonic CI value rather than a human; internal, beta and production
ride separate tracks.

The fastlane specifics, the `fastlane match` trade-off and the full pipeline table are in
[`references/delivery.md`](references/delivery.md).

## Shipping a smaller binary

Three build flags, and they do different jobs `[OFFICIAL]`:

| Flag | Effect |
|---|---|
| `--split-debug-info=<dir>` | Strips debug symbols out of the binary into a separate directory. **Keep that directory** — it is what makes a stack trace readable again via `flutter symbolize` |
| `--obfuscate` | Renames symbols. Requires `--split-debug-info`. Shrinks a little, protects nothing (see the four rules) |
| `--analyze-size` | Produces a size analysis file. Reading it is `flutter-runtime`'s App size view; **producing** it is this command |

Losing the `--split-debug-info` output means every crash report from that release stays
unreadable — archive it alongside the artefact, not in the build workspace.

**Deferred components exist on two platforms only.** Android, through dynamic feature modules,
and web, through JS chunks `[OFFICIAL, High]`. On iOS and macOS there is **no Flutter
code-splitting** at all — Apple's On-Demand Resources cover assets, never Dart code. Attempting
the pattern there is the failure this section prevents.

The Android flow builds a single AAB and generates `deferred_components_loading_units.yaml`,
whose loading units are then mapped in `pubspec.yaml`.

> **[UNVERIFIED] — do not quote a size reduction.**
> The "~46%" figure circulating from the Flutter wiki describes one specific case, the Gallery
> app deferred in full, with no generalisable methodology. Measure your own artefact with
> `--analyze-size` instead.

## Seams

When a question sits near a seam, decide which side it falls on before answering.

| Neighbouring subject | Owner | Why the seam sits there |
|---|---|---|
| Diagnosing size or performance — the DevTools App size view, the frame budget, memory | `flutter-runtime` | The governing rule: **`flutter-runtime` diagnoses, `flutter-build-release` produces the artefact.** `flutter build --analyze-size` and the size flags are here; reading the resulting view is there |
| Where `main_dev.dart` / `main_prod.dart` sit in the tree, entry-point structure | `flutter-architecture` | Only the build mechanics that consume them are here |
| Desktop signing and packaging: MSIX and `.pfx`, macOS notarisation and entitlements, Snap/snapcraft, fastforge | `flutter-architecture` | That skill already carries the actionable desktop chain, including the `flutter_secure_storage` #686 keychain trap. **Android and iOS signing is here**, and neither side restates the other |
| Dart 3 language breaking changes as language facts | `dart-idioms` | Only the tooling strategy that decides *when* to take them is here |
| `analysis_options.yaml` and lint ruleset choice | `dart-idioms` | Language layer, valid in any Dart project |

`pubspec.yaml` is here rather than in `dart-idioms` because that skill is scoped to *language
and standard library, any Dart project* — it is the only skill in this plugin still valid
outside Flutter, and `pubspec.yaml` is neither language nor stdlib. Single-version resolution,
`dependency_overrides` and Pub workspaces are one object and must live together; pub.dev
refuses a package that declares `dependency_overrides`, so the rule and its sanction belong in
the same place.

## Name the silence

Say what has no prescription, and what would lift it — an unlabelled claim gets obeyed as one.
Silence is not itself a prescription: that the official security page says nothing about
hardening does not mean hardening is discouraged.

Standing silences here: **certificate pinning** — the APIs `SecurityContext` and `HttpClient`
are documented and unsupported on web, but *when* to pin is not; and **root/jailbreak
detection** — the official security page carries three "keep updated" practices and nothing
further. Advanced third-party obfuscation tooling — control-flow flattening, string encryption
— is vendor-sourced and is reported as such rather than as Flutter practice. Everything
measured rather than produced, start-up included, is `flutter-runtime`'s to leave unspoken.

## Quarterly re-verification list

Re-check at each Flutter stable: the AGP 9 warning; whether `--dart-define-from-file` values
became reachable from native code; the `--build-name` / `--build-number` mapping on Android;
the Android 17 v3.2 signing scheme.

## References

- [`references/signing-and-versioning.md`](references/signing-and-versioning.md) — the full
  Android and iOS chains: the two-key model and why a lost upload key is recoverable, keystore
  and `key.properties` handling, the v3.2 scheme, the five-step iOS chain from Bundle ID to
  upload, the `pubspec.yaml` → `versionName`/`CFBundleVersion` mapping table with the #23811
  trap, and what release obfuscation does and does not buy.
- [`references/delivery.md`](references/delivery.md) — the three branches a daily build never
  reaches: the four Pub workspace traps and where melos still earns its place; the pub.dev
  scoring specifics (SwiftPM for iOS/macOS plugins, the popularity score retired for a download
  count); and the CI/CD detail — fastlane-centred official guidance, the signing-secret and
  build-number recipes, `fastlane match`, and why no platform is endorsed.
