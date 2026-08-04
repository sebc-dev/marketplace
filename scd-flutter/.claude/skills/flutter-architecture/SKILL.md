---
name: flutter-architecture
description: |
  Flutter app architecture per the official app-architecture guide — where code belongs, and
  which boundaries it may not cross.
  Use when scaffolding a project or deciding where a new file or entry-point variant goes; when
  choosing a state mechanism by scope (setState / ViewModel / Repository / Riverpod / BLoC);
  when wiring dependency injection or the Result and Command patterns; when reviewing for layer
  violations; when a BuildContext is used after an await; when asking whether something works
  on web and desktop and how far to adapt per platform; or when packaging, signing or
  notarising a desktop app.
---

# Flutter app architecture

Reference: the official architecture guide, reflecting **Flutter 3.44.0** (stable
2026-05-18; pages updated 2026-05-05). Since 2024 Flutter has an official architecture
position — every pre-2024 "Clean Architecture in Flutter" article must be positioned
relative to it, not merged into it.

## What the guide prescribes, and what it deliberately leaves open

This distinction is the point. Do not prescribe more firmly than the guide does.

| **Strongly recommend** | **Conditional / open** |
|---|---|
| UI and Data layers | The state-management mechanism |
| Repository pattern | A Domain layer (use-cases) |
| MVVM (Views + ViewModels) | Separate API vs domain models |
| No logic in widgets | `ChangeNotifier`/`Listenables` specifically |
| Unidirectional data flow | *(Recommend, not strongly:* Commands, freezed/built_value, go_router, naming conventions*)* |
| Immutable models | |
| Dependency injection | |
| Abstract Repository classes | |

On state management the guide is explicit: *"There are many options to handle
state-management, and ultimately the decision comes down to personal preference."* The
reference app (Compass) uses `ChangeNotifier` + `provider`, and the guide names Riverpod,
flutter_bloc, signals and plain streams as equally viable.

## Layers

Two mandatory, one optional. **Each layer talks only to its immediate neighbours** —
*"The UI layer shouldn't know that the data layer exists, and vice versa."*

- **UI layer** — Views (widget compositions) + ViewModels.
- **Domain layer** — **optional**, use-cases. Only *"if your application has complex
  business logic that happens on the client"*. Most CRUD apps do not need it.
- **Data layer** — Repositories (source of truth) + Services (raw access).

| Component | Contract |
|---|---|
| **View** | A composition of widgets. **No business logic.** Receives all data from its ViewModel, forwards events to it. |
| **ViewModel** | Turns app data into UI state: fetch from repositories and transform (filter, sort, aggregate); hold current view state (flags, active field); expose **commands** the view binds to its handlers. |
| **Repository** | *"Source of truth for your model data."* Fetches from services, maps to domain models, owns caching, error handling, retry, refresh, polling. One per data type. **"Repositories should never be aware of each other."** |
| **Service** | Lowest layer. Wraps endpoints (REST, platform APIs, local files). Exposes `Future`/`Stream`. **Stateless** — *"they hold no state."* One per data source. |

Cardinality: View ↔ ViewModel is **one-to-one**; Repository ↔ ViewModel and Service ↔
Repository are **many-to-many**. A View is not one widget — it is a one-to-one relation
with a *collection* of widgets.

App-wide session state (active user session, in-memory caches, transient settings) lives
in **Repositories**, because they are the shared single source of truth.

## Where does this file go

`data/` is organised **by type**, `ui/` **by feature**, because repositories and services
cross features while each feature has exactly one view and one view model.

```
lib/
├── main.dart, main_development.dart, main_staging.dart
├── ui/                     ORGANISED BY FEATURE
│   ├── core/ui/            shared widgets  (not a top-level /widgets folder)
│   ├── core/themes/
│   └── <feature>/
│       ├── view_models/    home_viewmodel.dart
│       └── widgets/        home_screen.dart
├── domain/models/<type>/   types shared by data AND ui — immutable
├── data/                   ORGANISED BY TYPE
│   ├── repositories/<type>/   abstract + Remote/Local implementations
│   ├── services/<source>/     api_client.dart
│   └── model/                 raw API models
├── routing/                go_router configuration
├── config/
└── utils/                  command.dart, result.dart
test/                       mirrors lib/
testing/                    mocks and fakes — a version of your app you do not ship
```

| Need | Destination |
|---|---|
| Screen or widget | `ui/<feature>/widgets/` — no business logic |
| ViewModel | `ui/<feature>/view_models/` |
| Shared widget / theme | `ui/core/ui/` · `ui/core/themes/` |
| Source of truth for a data type, cache, session | `data/repositories/<type>/` — abstract + Remote/Local |
| Talking to an API, platform or file (stateless) | `data/services/<source>/` |
| Raw API model | `data/model/` |
| Type shared by data and ui | `domain/models/<type>/` — immutable |
| Logic repeated in ≥2 ViewModels, or merging ≥2 repositories | Use-case in the **optional** Domain layer |
| Route | `routing/` |
| Cross-cutting utility (`Result`, `Command`) | `utils/` |

Name classes after the architectural component they represent: `HomeViewModel`,
`HomeScreen`, `UserRepository`, `ClientApiService`. Avoid names that collide with the SDK.

**Threshold for adopting a Domain layer** — the guide is blunt: *"A domain layer is only
needed if your application has exceeding complex logic that crowds your ViewModels, or if
you find yourself repeating logic in ViewModels. In very large apps, use-cases are useful,
but in most apps they add unnecessary overhead."*

## Choosing a state mechanism by scope

Scope decides, not preference for a winner.

| Scope | Mechanism |
|---|---|
| Ephemeral and purely local (animation, form field, active tab) | `StatefulWidget` / `setState` — **no ViewModel** |
| One feature's state | ViewModel (`ChangeNotifier`) + `ListenableBuilder`/`provider` |
| App-wide or session state | Repository, exposed via provider (`ChangeNotifierProvider` when it holds session state) |

Switching wholesale to Riverpod or BLoC is a separate decision, and not one to impose on a
working project. Thresholds and trade-offs:
[`references/state-mechanisms.md`](references/state-mechanisms.md).

## Canonical patterns

**`Result<T>`** — a **sealed** class returned by repositories. The repository catches its
exceptions rather than letting them cross the layer boundary and returns `Result.error(e)`;
the ViewModel unwraps with a `switch` on `Ok`/`Error` that is exhaustive *because* the class
is sealed — adding a variant breaks the build.

**`Command0`/`Command1`** — wrap a ViewModel action and expose `running`, `completed`,
`error`. The View listens through `ListenableBuilder` instead of hand-rolling loading
booleans.

**Dependency injection** — *"Dependency injection prevents your app from having globally
accessible objects."* The guide recommends `provider`: services and repositories exposed at
the **top** of the tree via `MultiProvider`, repositories cast to their **abstract
interface** so dev/staging/prod implementations can be swapped, dependencies resolved with
`context.read()`.

Never keep or leak a `BuildContext` into the Data or Domain layers — those layers must not
know Flutter exists. `context.read()` belongs only at the wiring point.

Full code for all three, plus the canonical ViewModel and the `get_it` alternative:
[`references/state-mechanisms.md`](references/state-mechanisms.md).

## Layer-violation review

Flag each of these — all are documented violations:

- A widget importing or calling a Service or `ApiClient` directly.
- A View subscribing to a Repository without going through its ViewModel.
- Business logic inside `build()`.
- One Repository importing another. *"Repositories should never be aware of each other"* —
  combine in the ViewModel or a use-case.
- A Service holding state.
- A mutable model crossing layers.
- A ViewModel instantiated inside `build()` — it is recreated on every rebuild.
- A globally accessible object standing in for dependency injection.

The only logic allowed in a View: simple `if`s showing/hiding a widget from a ViewModel
flag, animation logic, layout logic based on device info (screen size, orientation), and
simple routing.

## Platform branching

Official position: **branch on capability, not on platform.** *"Avoid using
Platform.isAndroid and similar functions to make layout decisions or assumptions about
what a device can do. Instead, describe what you want to branch on in a method."* Model
the differences as Capability classes (what the device can do) and Policy classes (what it
should do — e.g. hiding a purchase link on iOS for store rules).

Three detection APIs, routinely confused:

- **`kIsWeb`** — the only reliable way to know you are in a browser. **Test it first.**
- `defaultTargetPlatform` — safe everywhere, but on web it returns the *underlying OS*
  (e.g. `windows`), not "browser".
- `Platform.isAndroid`/`isIOS` (`dart:io`) — **crashes on web**, and returns
  `TargetPlatform.android` by default in tests. Only just before a system call.

Layout branches on **size** (`MediaQuery`, `LayoutBuilder`); appearance branches on
**convention** (Material vs Cupertino). Never branch layout on platform — a desktop window
can be tiny and a tablet huge.

**How far to adapt before duplicating** has a middle option — the `.adaptive` constructors
(`Switch.adaptive`, `AlertDialog.adaptive`, `showAdaptiveDialog`), which swap in the Cupertino
component keyed on `ThemeData.platform` rather than on the real device, and cover individual
controls, never a screen. That decision, the full matrix, conditional imports, federated
plugins, FFI limits, web/desktop/mobile specifics and packaging:
[`references/platform-targets.md`](references/platform-targets.md).

## The async gap

Using a `BuildContext` after an `await` is the most common way a layer-clean codebase still
crashes: the widget may be gone by the time the future completes.

The lint `use_build_context_synchronously` catches it, and the check to write depends on **which
context** you hold `[OFFICIAL]`:

> *"When using a State's context property, the State's mounted property must be checked; for
> other BuildContext instances … the BuildContext's mounted property must be checked"*

```dart
// Inside a State, using State.context — check State.mounted
await repository.save();
if (!mounted) return;
Navigator.of(context).pop();

// Holding some other BuildContext — check that context's own mounted
await repository.save();
if (!ctx.mounted) return;
Navigator.of(ctx).pop();
```

They are different properties, and the two are not interchangeable: `State.mounted` says the
`State` is still in the tree, `BuildContext.mounted` says that particular element is. Checking
the wrong one satisfies neither the lint nor the runtime.

The structural fix is upstream: a ViewModel that returns a `Result` and a View that reacts to it
has no context to leak across an await. Passing a `BuildContext` into the Data layer is the
violation this section exists to prevent.

## Seams

When a question sits near a seam, decide which side it falls on before answering. This skill
owns **where code belongs and which boundaries it may not cross** — five skills route their
placement questions here, and it routes everything about what that code then does back out.

| Neighbouring subject | Owner | Where the seam falls |
|---|---|---|
| Rebuild and reconciliation cost, `Key`, jank and the frame budget, layout cost, `dispose` and leaks, hot reload, profiling, isolates | `flutter-runtime` | **This skill decides where code goes; that one what it costs at runtime.** A ViewModel instantiated in `build()` is a layer violation here and a rebuild cost there — same line, two readings |
| Writing or fixing tests, goldens, `fakeAsync`, flakiness, coverage | `flutter-testing` | Testability is designed here and exercised there |
| HTTP clients, serialisation, local databases, tokens and sessions, offline-first | `flutter-data` | **The `Result` and `Command` types themselves and the layer contract are here**; how a Repository is filled is there |
| Animations, gestures, focus and shortcuts, text input and forms, theming, `Semantics` annotations, i18n | `flutter-ui-interaction` | The state mechanism, `go_router` itself and the adapt-vs-duplicate decision are here; only the `Hero` × route-transition articulation is there |
| Hover, mouse cursors, the scroll wheel, right-click menus — the interaction a pointer has and a finger does not | `flutter-ui-interaction` | **Deciding that desktop and web deserve a different interaction is a targeting decision and is here; how a pointer is then detected, cursored, hovered, wheeled and right-clicked is that skill's API surface.** This skill names the omission — a touch-first UI forgets hover and right-click — and that one closes it |
| Flavors, Android/iOS signing, versioning, `pubspec` constraints, CI/CD, size flags | `flutter-build-release` | Where `main_dev.dart` / `main_prod.dart` sit in the tree is here; the build that consumes them is there. **Desktop signing and packaging — MSIX and `.pfx`, macOS notarisation, Snap, fastforge — stays here**, and neither side restates the other |
| The Dart language, null safety, patterns, lint rulesets | `dart-idioms` | Language layer, valid outside Flutter |

## Name the silence

Say what has no prescription, and what would lift it — an unlabelled claim gets obeyed as one.

Standing silence here: **the state-management mechanism.** The guide names Riverpod,
flutter_bloc, signals and plain streams as equally viable and says the choice *"comes down to
personal preference"* — so a winner asserted in this skill would be invented, and the scope
table above is the whole of what is decidable. *What would lift this:* the guide naming a
default, which it deliberately declines to do.

The guide's open items are open, not decided against: an optional Domain layer, separate API vs
domain models, `ChangeNotifier` specifically, freezed/built_value, go_router and the naming
conventions are *recommended*, not *strongly recommended*. Reporting them as mandatory
over-prescribes in exactly the column the guide left conditional. The adapt-vs-duplicate
boundary is boxed where it appears, in [`references/platform-targets.md`](references/platform-targets.md).

## References

- [`references/state-mechanisms.md`](references/state-mechanisms.md) — setState,
  ChangeNotifier, ValueNotifier, InheritedWidget, provider, Riverpod 3.0, flutter_bloc:
  mental model, guide compatibility, verified maintenance status, when to choose and when
  to avoid each; the canonical ViewModel, Result, Command and MultiProvider code; go_router.
- [`references/platform-targets.md`](references/platform-targets.md) — the
  desktop/web/mobile matrix, responsive vs adaptive, the `.adaptive` constructors and how far
  to adapt before duplicating (with the open-boundary box), platform channels, federated
  plugins, FFI, conditional imports, web renderers and Wasm, SEO position, PWA/service worker,
  desktop windowing and packaging, mobile lifecycle and permissions, and the areas where no
  authoritative source exists.
