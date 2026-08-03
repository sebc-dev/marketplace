# Targeting desktop, web and mobile from one codebase

Flutter unifies UI **rendering**, not platform **access**. The moment code touches the
file system, low-level networking, the app lifecycle, FFI, an OS API, or packaging, the
decision is platform-dependent and must be treated as such.

Sources reflect Flutter 3.44 (docs updated 2026-05-05); pub.dev package data verified
2026-08-03. Third-party package status moves fast — re-check before adopting.

## Matrix

✅ supported natively · ⚠️ divergent/partial/third-party · ❌ unsupported · Confidence
H=High, M=Medium

| Concern | Desktop (Win/macOS/Linux) | Web | Mobile (iOS/Android) | Conf. |
|---|---|---|---|---|
| Rendering | Impeller/Skia native | CanvasKit (default) or skwasm (Wasm) | Impeller native | H |
| `dart:io` (files, `Platform`) | ✅ | ❌ throws `UnsupportedError` | ✅ | H |
| `dart:ffi` | ✅ | ❌ forbidden, including under Wasm | ✅ | H |
| Platform channels | ✅ | ⚠️ via JS interop / web plugin | ✅ | H |
| File system (`path_provider`) | ✅ real paths | ❌ no FS | ✅ | H |
| `shared_preferences` | ✅ | ✅ localStorage/IndexedDB | ✅ | H |
| Lifecycle (`AppLifecycleState`) | ⚠️ partial | ⚠️ incomplete mapping | ✅ complete | M |
| Background execution | ⚠️ ordinary process | ❌ no isolates; web workers | ⚠️ WorkManager/BGTaskScheduler, OS-constrained | M |
| Multi-window | ⚠️ experimental + third-party | ❌ one view | ❌ one activity/view | M |
| Native menus | ⚠️ macOS via `PlatformMenuBar`; others third-party | ❌ | ⚠️ contextual | M |
| Isolates / concurrency | ✅ | ❌ not supported | ✅ | H |
| Deep linking / routing | ⚠️ custom schemes, third-party | ✅ hash URL by default, or path | ✅ App Links / Universal Links | H |
| SEO / indexing | n/a | ⚠️ **officially discouraged** | n/a | H |
| Packaging | ⚠️ MSIX / notarisation / Snap — largely third-party | ✅ static files + service worker | ✅ stores | H |

## Branch on capability, not on platform

**[OFFICIAL, High]** The "Capabilities & policies" page: *"Avoid using Platform.isAndroid
and similar functions to make layout decisions or assumptions about what a device can do.
Instead, describe what you want to branch on in a method."* The recommended pattern is
**Capability** classes (what the code/device *can* do) and **Policy** classes (what it
*should* do — e.g. hiding a purchase link on iOS for store rules), then branching on a
method that describes the intent. The reason: mechanical platform APIs age badly as the
app grows and OSes gain features.

Three detection APIs, routinely confused:

| API | Behaviour |
|---|---|
| **`kIsWeb`** | The **only** reliable "am I in a browser" check. **Test it first**, before any `defaultTargetPlatform`. |
| `defaultTargetPlatform` (foundation) | Safe everywhere, but on web returns the **underlying OS** (e.g. `windows`), not "browser". Documented trap: trying to open the native Microsoft Store from a web app running on Windows. |
| `Platform.isAndroid`/`isIOS` (`dart:io`) | **Crashes on web**, and returns `TargetPlatform.android` by default **in tests**. Reserve for cases where the real OS matters immediately before a system call. |

## Conditional imports

The canonical way to keep `dart:io`/`dart:ffi` out of a web build:

```dart
import 'stub.dart'
    if (dart.library.io) 'io_impl.dart'
    if (dart.library.js_interop) 'web_impl.dart';
```

Concrete example: `setUrlStrategy`/`usePathUrlStrategy` can only be called on web, hence a
conditional `configure_web.dart` / `configure_nonweb.dart` pair.

Strategy when a plugin does not cover all three targets:

1. Check the platforms declared on pub.dev **before** adopting.
2. Isolate the call behind an abstraction and provide a fallback/no-op implementation for
   the unsupported target via conditional imports.
3. As a last resort, write a federated implementation for the missing platform.

Note: importing `dart:io` outside a conditional import lowers a package's pub.dev "supports
web" score.

## Responsive versus adaptive

Two orthogonal axes:

- **Responsive** = adapt to **size/shape** — `LayoutBuilder`, `MediaQuery`, breakpoints,
  `SafeArea`.
- **Adaptive** = adapt to **platform conventions** — Material vs Cupertino, mouse/keyboard
  vs touch.

**Anti-pattern:** assuming "desktop = large screen" and "mobile = small screen". A desktop
window can be tiny, a tablet huge, a phone split-screen. **Branch layout on size, appearance
on convention, never layout on platform.**

Interaction conventions diverge too: touch (tap, swipe, pull-to-refresh) vs mouse/keyboard
(hover, right-click, shortcuts, scroll wheel, text selection). A touch-first UI usually
forgets hover and right-click on desktop/web; a desktop-first UI wrongly assumes a precise
pointer.

## Adapt or duplicate

Once you have decided a difference is worth honouring, there is a third option between one
Material UI everywhere and two hand-written UIs: the **`.adaptive` constructors**.

`Switch.adaptive`, `AlertDialog.adaptive`, `showAdaptiveDialog`, `CircularProgressIndicator
.adaptive` and their siblings *"substitute the corresponding Cupertino components when the app
is run on an iOS device"* `[OFFICIAL]`, keyed on `ThemeData.platform` — so `AlertDialog.adaptive`
*"On iOS and macOS […] creates a CupertinoAlertDialog. On other platforms, this creates a
Material design AlertDialog."*

Two things follow. They branch on **`ThemeData.platform`, not on the real device**, so overriding
it in a theme or a test changes what they render — which makes them testable, and also makes an
unexpected result usually a theme question. And they cover **individual controls**, never a
screen: `.adaptive` gets you a native-feeling switch, not a native-feeling navigation pattern.

> **[OFFICIAL, Medium] — the boundary is deliberately open.**
> The official platform-adaptations page carries its own warning: *"This section includes
> preliminary recommendations […] Your feedback is welcomed on issue #8427"*. So the existence
> and mechanism of `.adaptive` are firmly documented, while *how far* to adapt before duplicating
> is not settled, and no source names a winner.
> *What would lift this:* the preliminary status being lifted from
> docs.flutter.dev/ui/adaptive-responsive/platform-adaptations, i.e. issue #8427 closing.

What is decidable without a prescription: `.adaptive` is cheap where it exists and costs nothing
to prefer over a hand-rolled `Platform.isIOS` branch, since it is the same decision made once by
the framework. Duplicating a whole screen per platform is a product decision about how native
each platform should feel — capability and policy classes, not a widget choice.

## Native integration

**Platform channels** **[OFFICIAL, High]** — `MethodChannel`, `EventChannel`,
`BasicMessageChannel`. An asynchronous Dart↔native bridge: Dart calls `invokeMethod`, the
native side answers through a handler. **Consequence:** every target platform that must
answer a channel needs its own native implementation (Kotlin/Java Android, Swift/Obj-C iOS,
C++ Windows, Obj-C/Swift macOS, C++/GTK Linux). Channel name and type must match on both
sides. On web there is no "native code" in the OS sense — a web implementation goes through
JS interop.

**Federated plugins** **[OFFICIAL, High]** — structure:

- `plugin` — the app-facing package (the API the app imports);
- `plugin_platform_interface` — the shared contract; implementations `extends` rather than
  `implements` it, so adding a method is not a breaking change;
- `plugin_android`, `plugin_ios`/`plugin_darwin`, `plugin_web`, `plugin_windows`,
  `plugin_macos`, `plugin_linux` — per-platform implementations.

An implementation is **endorsed** when the app-facing author adds it as a dependency
(`default_package` in the `platforms:` map); otherwise a third party can publish a
non-endorsed implementation that the app adds manually. Real example: `geolocator`
(`geolocator_android`, `geolocator_apple`, `geolocator_web`…).

**FFI** **[OFFICIAL, High]** — since Flutter 3.38 the recommended template is `package_ffi`
(build hooks via `build.dart`, no per-OS build files); the legacy `plugin_ffi` template
remains useful for Plugin API access, iOS/macOS static linking, or Google Play services
configuration. On Android a dynamic library ships as a `.so` per architecture (the JVM is
the executable, so only dynamic libraries are supported).

**FFI is not available on web**: `dart:ffi` cannot be imported in a web compilation and is
explicitly forbidden under Wasm (flutter/flutter #149984: *"'dart:ffi' can't be imported
when compiling to Wasm"*). **Consequence:** any FFI-based package (native SQLite bindings
such as `drift`/`moor_ffi`) breaks the web build (drift #658: *"Error: Not found:
'dart:ffi'"*).

## Web

**Renderers** **[OFFICIAL, High]**. Two build modes:

- **Default**: **canvaskit** — *"includes a copy of Skia compiled to WebAssembly, which
  adds about 1.5MB in download size."*
- **Wasm** (`flutter build web --wasm`): **skwasm**, a more compact Skia *"adding about
  1.1MB in download size"*, which also compiles Dart to WebAssembly. skwasm requires
  **WasmGC**, *"which is not yet supported by all modern browsers"*; at runtime Flutter
  picks skwasm when GC is available and falls back to canvaskit otherwise. Multithreaded
  skwasm rendering needs the server to honour **SharedArrayBuffer** security requirements
  (COOP/COEP headers); without them skwasm runs single-threaded.

**Wasm prerequisites**: new JS interop only (`dart:js_interop`; `dart:js`, `dart:js_util`
and `package:js` are no longer supported), `package:web` instead of `dart:html`, and VM
numeric semantics (`int`/`double` behave like the Dart VM, not like JS `Number`).
**Consequence on your Dart code:** a single dependency using the old interop or `dart:html`
blocks `--wasm` for the whole app. Stay on the default mode until every dependency supports
Wasm.

**The HTML renderer is REMOVED.** The official announcement (flutter-announce, 2024-08-20)
deprecated then removed it; `--web-renderer=html` and `--web-renderer=auto` stopped working,
with removal *"in the first Flutter stable release of 2025"*. **Any source presenting the
HTML renderer as an available option is obsolete** — including tutorials recommending
`--web-renderer html` for bundle size or SEO. The same announcement notes that under
CanvasKit *"there are situations where Flutter needs to create extra `<canvas>` elements to
composite HTML content"*, so `HtmlElementView` is not free and too many platform views
degrade performance.

**SEO — the official position is a "don't"** **[OFFICIAL, High]**: *"At this time, Flutter
is not suitable for static websites with text-rich flow-based content… Flutter web
prioritizes performance, fidelity, and consistency. This means application output doesn't
align with what search engines need to properly index."* Recommendation: use **Jaspr** (a
Dart DOM framework with native SEO — the Dart and Flutter documentation and marketing sites
were migrated to it) or plain HTML, separating the indexable landing page from the Flutter
app. Flutter web remains right for PWAs, single-page apps, and porting existing Flutter
mobile apps.

**PWA / service worker** **[OFFICIAL, High]**: the service worker generated by
`flutter build web` is **deprecated** (flutter/flutter #156910; the justification is that
shipping it *"sends the message that it is necessary or recommended… but that is not the
case"*). Disable with `--pwa-strategy=none`. To keep one, write your own or use Workbox.
**Do not assume offline caching works by itself.**

**Cache and updates** **[OFFICIAL, High]**: after deploying, users may see a cached version
(browser/CDN) for as long as `Cache-Control` allows. Version your resources
(`flutter_bootstrap.js?v=123` or file renaming) — *"Flutter doesn't currently support
appending build IDs to resources automatically."* Concrete risk: a cached app that is no
longer compatible with an already-updated backend.

**Routing** **[OFFICIAL, High]**: by default the web reads the path from the **hash
fragment** (`example.dev/#/path/to/screen`). For clean URLs, `usePathUrlStrategy()` (from
`flutter_web_plugins/url_strategy.dart`) enables `PathUrlStrategy`, which relies on the
History API and **requires server configuration** (rewrite every route to `index.html`;
"Configure as a single-page app" on Firebase Hosting). Adjust `<base href="/">` if hosted
outside the root. **Consequence:** a deep link that works under hash returns a 404 under
path without that server config.

**Loading strategies**: icon tree-shaking works well natively (MaterialIcons-Regular.otf
reduced from 1,645,184 to 1,384 bytes on an APK build, #154986) but has been reported broken
on web (#102489, #126793, #154986), failing on non-const `IconData` instances. Do not assume
web behaves like native — verify per version. **Confidence: Medium.** `dart2js` supports
tree-shaking (release build) and deferred loading to shrink the JS bundle.

**No isolates on web** — *"Dart's concurrency support that uses isolates is not currently
supported in Flutter web."* Web workers are a workaround, not an integration.

## Desktop

*This section is deliberately shorter and more qualified: the authoritative corpus is thin.
That asymmetry is real and is not to be filled in by inference.*

Official docs cover desktop setup and basic builds, but **windowing, multi-window, menus
(outside macOS), tray and non-Snap packaging rest on third-party packages and practitioner
practice.** The Flutter 3.44 blog announces: *"We are excited to announce an expanded
partnership with Canonical, who will now serve as the lead maintainer and Strategic Steward
for Flutter Desktop… Canonical will lead the Flutter Desktop roadmap and oversee the
maintenance of our Linux, Windows, and macOS embedders."* — a governance signal, **not** a
guarantee of current documentation coverage.

**Multi-window** is **experimental**: the 3.44 blog mentions a `multiple_windows` example,
multi-window support arriving on Windows, and "content-sized views" on Linux (#182924).
Third-party packages, status verified 2026-08-03:

| Package | Status |
|---|---|
| **`window_manager`** (verified publisher leanflutter.dev) | v0.5.2 (2026-07-04), 160 pub points, ~1,120 likes, Linux/macOS/Windows, **not** a Flutter Favorite. ⚠️ Shows a **migration notice** toward `libnativeapi/nativeapi-flutter` — watch this. |
| **`desktop_multi_window`** (mixin.dev) | v0.3.0 (2025-10-28), 150 points, 281 likes, Linux/macOS/Windows |
| **`window_manager_plus`** | v1.0.5 (2024-10-08, ~19 months without a release), 140 points, 48 likes, **unverified uploader**, **does not support Linux**. Treat as weakly maintained. |

**Native menus**: `PlatformMenuBar` renders through native APIs, but *"Flutter only includes
support for macOS out of the box, but support for other platforms may be provided via
plugins that set `WidgetsBinding.platformMenuDelegate`"*. It is *"especially useful on
macOS, where a system menu is a required part of every application"*. Confirmed limitation
(#162566): `PlatformMenuBar` **wipes the default macOS menus** and does not expose every
system menu. Conversely `MenuBar`/`MenuAnchor` (Material) render a **Flutter-drawn** menu,
available on every platform. Confidence: High (macOS), Low (native Windows/Linux).

**File system**: `path_provider` (flutter.dev, **Flutter Favorite**, v2.1.6 of 2026-06-15)
supports Android/iOS/Linux/macOS/Windows — **no Web declared**. Its README warns *"Not all
methods are supported on all platforms"* (e.g. `getDownloadsDirectory()`).
`file_selector` (flutter.dev, v1.1.0 of 2025-11-21) covers all six platforms.

**Packaging**:

- **Windows / MSIX**: the docs recommend the `msix` package — *"The easiest way to create an
  MSIX distribution for a Flutter project is to use the msix pub package."* v3.18.0
  (2026-06-27), verified publisher kremer.software, **Flutter Favorite**, Windows only. A
  `.pfx` signature is required for private deployment/testing; the Microsoft Store signs
  automatically. Win32/COM/WinRT is reachable through `dart:ffi` (C ABI).
- **macOS / notarisation**: builds are signed and **App Sandbox**-sandboxed by default.
  Configure **entitlements** in `macos/Runner/*.entitlements` — e.g.
  `com.apple.security.network.client` for network access, without which every network call
  fails (`SocketException: Operation not permitted`, #63716). **Hardened Runtime** is
  required for notarisation. Confirmed trap (`flutter_secure_storage` #686): a
  signed+notarised app can lose keychain access without the right entitlements.
- **Linux**: the official docs detail **Snap/snapcraft only** (`snapcraft.yaml`, `gnome`
  extension, confinement, Snap Store channels). Other formats are delegated to third-party
  tools under "Additional deployment resources": **fastforge** (*"Supports popular packaging
  formats like appimage, deb, pacman, rpm, and more"*) and **flatpak-flutter**. There is
  **no official guide** for AppImage/.deb/.rpm/Flatpak.
- Complementary third-party: `tray_manager` (leanflutter.dev, v0.5.3 of 2026-06-09; same
  migration notice; needs `ayatana-appindicator3-0.1` on Linux); `flutter_acrylic` (v1.1.4
  of 2024-06-11 — ~2 years without a release, unverified uploader, treat as poorly
  maintained).

## Mobile

**Lifecycle** **[OFFICIAL, High]**: `AppLifecycleState` values are `resumed`, `inactive`,
`hidden`, `paused`, `detached`, and mappings are **not** 1:1 across OSes. On Android
`Activity.onPause` → `inactive` and `Activity.onStop` → `paused`; on iOS/macOS `inactive`
covers transitions (incoming call, App Switcher); on web it means an unfocused window/tab.
Detect via `WidgetsBindingObserver.didChangeAppLifecycleState` or `AppLifecycleListener`.
**Trap:** `WidgetsBindingObserver` also surfaces Activity/ViewController changes — an iOS
FaceID prompt marks the app `inactive`. The `flutter_fgbg` package reports only app-level
background/foreground events.

**Permissions**: radically different models. iOS declares usages in `Info.plist`
(`NSCameraUsageDescription`, `NSMicrophoneUsageDescription`…); Android declares in
`AndroidManifest.xml` and requests at runtime. **Consequence:** one feature needs two
distinct native configurations, and a missing `Info.plist` key crashes or gets rejected on
iOS.

**Background execution** **[Medium]**: Android via **WorkManager** (guaranteed execution),
iOS via **BGTaskScheduler**/background modes (short, best-effort windows). The `workmanager`
package wraps both, but **behaviour differs fundamentally by platform**: Android can
guarantee execution, iOS remains at the OS's discretion. Callbacks must be top-level/static
functions annotated `@pragma('vm:entry-point')`. Android 14+ hardened background services
(notification required, `SCHEDULE_EXACT_ALARM` permission). Practitioner principle: treat
the platform as the source of truth, keep tasks small and idempotent, plan a server-side
fallback.

**Stores**: iOS App Store review is strict (background location permissions are scrutinised;
Bitcode deprecated since Xcode 14, `ENABLE_BITCODE=NO`). In-app purchase and update flows go
through distinct SDKs with different review rules — policies with no web/desktop equivalent.

**iOS/Android differences that reach Dart code**: framework auto-adaptations (scroll physics,
page transitions, default fonts) driven by `defaultTargetPlatform`. Swift Package Manager is
now the iOS/macOS default (3.44 blog). Predictive back (Android) and system gestures differ.
**In tests `defaultTargetPlatform` returns `TargetPlatform.android` by default** — override
via `debugDefaultTargetPlatformOverride` or `TargetPlatformVariant` to test iOS.

## The costliest implicit assumptions

1. **Persistence** — assuming an accessible file system. False on web (`path_provider`
   declares no Web, `dart:io` unavailable). Use key/value abstractions
   (`shared_preferences`) or conditional imports.
2. **Networking** — on web the **browser controls the headers** (CORS), not the app. Raw
   sockets (`dart:io`) are unavailable. On macOS, networking requires an entitlement.
3. **Input** — assuming touch (or the reverse); forgetting keyboard/mouse/hover/right-click.
4. **Screen size** — coding for a single size class; ignoring window resize, orientation,
   foldables, split-screen.
5. **Lifecycle** — assuming the complete mobile states on web/desktop, where the mapping is
   incomplete.

## Undocumented areas — do not fill these by inference

No sufficient authoritative source was found (as of 2026-08-03). Do not close these gaps by
symmetry with another platform.

- **A stable public multi-window desktop API** — "experimental" only; no stabilised official
  API documentation. Third-party packages fill the void without a durability guarantee (a
  migration notice is displayed on `window_manager`). *[RE-CHECK each release.]*
- **Native menus outside macOS** — no official documentation for a native Windows/Linux menu
  bar; the third-party packages are not qualified as canonical by Flutter.
- **Current exact behaviour of icon tree-shaking on web** — contradictory issue history;
  no clear official confirmation of the state at the current version. *[VERIFY per version.]*
- **Detailed, reliable web lifecycle** (a full equivalent of `paused`/`resumed`) — issue
  #85069 requested it; official coverage of the web mapping remains incomplete. *[UNCERTAIN.]*
- **Linux packaging outside Snap** (AppImage/.deb/.rpm/Flatpak) — no official Flutter guide;
  delegated to third-party tools not documented by the Flutter team.
- **Quantified performance/size comparison between canvaskit and skwasm** beyond the
  download sizes quoted above — the docs claim *"skwasm has noticeably better app start-up
  time and frame performance compared to canvaskit"* without published figures. *[NOT
  QUANTITATIVELY VERIFIED.]*

## What would change these recommendations

- A stable Flutter release documenting a **public multi-window API** → drop the dependency on
  `window_manager`/`desktop_multi_window`.
- `--tree-shake-icons` **confirmed stable on web** by official docs → enable it.
- A critical desktop package going **beyond ~12 months without a release**, or displaying a
  **migration notice** (the current case for `window_manager`/`tray_manager`) → plan an
  alternative or wrap it behind an abstraction.
- **WasmGC support becoming universal** across target browsers → make `--wasm` the default.
