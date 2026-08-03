# scd-flutter

Dart 3.x and Flutter 3.44+ skills for Claude Code. Seven skills with **disjoint scopes**, so a
pure Dart project never loads Flutter guidance, an architecture question never loads the
profiler, and a signing question never loads the animation API — plus `flutter-index`, the map
that tells you which one to reach for.

## Every skill is user-invoked

None of these skills fires on its own. They are all `disable-model-invocation: true`, so the
agent cannot reach them and **you invoke them by name**:

```
/scd-flutter:flutter-runtime
```

That is a deliberate trade. A model-invoked skill keeps its description in the context window
on **every turn of every session**, whether or not you are writing Flutter; these seven cost
nothing until you ask for them. What you pay instead is having to remember they exist — which
is what `flutter-index` is for. Start there when you are not sure:

```
/scd-flutter:flutter-index
```

## The eight skills

| Skill | Reach for it when | Leading question it answers |
|---|---|---|
| **`flutter-index`** | You are not sure which of the others owns your question | "Which skill should I invoke?" |
| **`dart-idioms`** | Any `.dart` file, `analysis_options.yaml` — including pure Dart CLI, server or package projects with no Flutter | "Is this idiomatic, sound Dart?" |
| **`flutter-architecture`** | Scaffolding, placing a file, choosing a state mechanism, wiring DI, reviewing layers, targeting web/desktop, packaging a desktop app | "Where does this belong, and what talks to what?" |
| **`flutter-runtime`** | Jank, dropped frames, memory growth, state lost after a reorder, an intrinsics throw, hot reload, error handlers, profiling | "What does the framework rebuild, reconcile, lay out and replay — and what does it cost?" |
| **`flutter-testing`** | Writing or fixing a test, a flaky or timing-out test, goldens, coverage, accessibility checks | "How do I prove it works, and keep the proof reliable?" |
| **`flutter-data`** | Calling an API, mapping a DTO, timeouts and retries, expiring tokens, local databases, offline | "How do I fill the Repository?" |
| **`flutter-ui-interaction`** | Animating, handling a gesture, wiring a shortcut, a form, a theme, `Semantics`, a translation | "How does the user interact with this, and how does it look and read?" |
| **`flutter-build-release`** | Flavors, `pubspec` conflicts, keystores, version bumps, monorepos, publishing, CI/CD, binary size | "How do I configure, depend, sign, version and ship it?" |

`dart-idioms` applies inside Flutter projects too — it covers the language, not the framework.

Three seams worth knowing, because they are the ones that would otherwise drift — `flutter-index`
carries the full set, measured against real questions rather than guessed:

- **`flutter-runtime` measures cost, `flutter-testing` proves behaviour.** A performance test
  that produces a timing (`watchPerformance`, `traceAction`) is a measurement and stays with the
  profiler.
- **`flutter-runtime` diagnoses, `flutter-build-release` produces the artefact.** The DevTools
  App size view is a diagnostic; `flutter build --analyze-size`, `--obfuscate` and
  `--split-debug-info` ship with the build chain.
- **Accessibility splits by activity, not by subject.** *What* to annotate (`Semantics`,
  `TextScaler`, target sizes) is `flutter-ui-interaction`; *running* the checks
  (`ensureSemantics`, `meetsGuideline` and the four guideline values) is `flutter-testing`,
  so the numeric values cannot diverge across two skills.

### `dart-idioms`

Inference boundaries, sound null safety and type promotion (the private-and-final field
rule), `late` and `!` discipline, records vs classes, patterns and destructuring, class
modifiers and switch exhaustiveness, extension type erasure, async/await and unawaited
futures, `on`-clause error handling, subscription lifetime, `Isolate.run`, naming and
constructor conventions, `==`/`hashCode`, doc comments, and the
`lints` / `flutter_lints` / `very_good_analysis` rulesets with the three `strict-*`
analyzer modes.

### `flutter-architecture`

The official architecture guide (docs.flutter.dev/app-architecture): the UI/Data layer
split, MVVM, the Repository and Service contract, the file-placement table, choosing a state
mechanism **by scope**, dependency injection through `provider`, the `Result` and `Command`
patterns, `go_router`, layer-violation review, and targeting desktop/web/mobile —
capability-not-platform branching, conditional imports, federated plugins, FFI limits, web
renderers and Wasm, plus the desktop packaging chain (MSIX, macOS notarisation and
entitlements, Snap).

### `flutter-runtime`

`Element` reconciliation and the `Key` family, the constraints and layout contract, intrinsic
passes and their O(N²) worst case, the `LayoutBuilder` intrinsic-dimensions invariant, the
composition-first ladder down to `CustomPainter`/`RenderBox`/`RenderObject`, hot reload
semantics and what needs a restart, the frame budget and the UI-vs-raster red fork, build modes
and what each invalidates as a measurement, DevTools and the `debug*` flags, rebuild
granularity, `const`, `saveLayer`, opacity, clipping, lazy builders, `RepaintBoundary`, image
decode sizing, `dispose` and leak diagnosis, `leak_tracker`, isolates as an application
mechanism, and uncaught-error handling with crash reporting and PII redaction.

### `flutter-testing`

The three test layers and what each buys, testability as an architecture signal, fakes vs
mocks, `WidgetTester`, `pump` vs `pumpAndSettle` and why the latter is not a wait-for-ready,
`fakeAsync` and controlling time, golden tests and their font fragility, `blocTest`, mocktail vs
mockito, plugin channel mocking, the accessibility harness with the exact values of the four
guidelines, `integration_test` and its native-UI ceiling, coverage and its limits, and the
documented flakiness causes.

### `flutter-data`

HTTP clients (`http.Client`, `dio`, `cupertino_http`/`cronet_http`), interceptors,
retry/backoff/timeout/cancellation gated on idempotency, mapping transport and HTTP errors onto
a sealed `Result`, concurrent access-token refresh, OAuth 2.0 + PKCE, `flutter_secure_storage`
and biometrics and what they do **not** guarantee, the `SharedPreferencesAsync` migration and
the corruption from mixing it with the legacy API, local databases and their dated maintenance
status, database access from an isolate, reactive query streams, offline-first with the
Repository as source of truth, JSON serialisation generators, and `build_runner`.

### `flutter-ui-interaction`

Implicit vs explicit animations and the `TickerProvider` choice, the gesture arena and
parent/child arbitration, focus and keyboard (`Shortcuts`/`Actions`/`Intent`), text input
(`TextInputFormatter`, composing region, IME), `Form`/`FormField`/`autovalidateMode`,
Material 3 as the default with `ColorScheme.fromSeed` and `ThemeExtension`, accessibility
(`Semantics`, `TextScaler`, target sizes), internationalisation (`gen-l10n`, ARB, RTL),
`Hero` and route transitions, and drag & drop.

### `flutter-build-release`

Flavors and `--dart-define-from-file` with the trap that its values are not reachable from
native code, the Android and iOS signing chains and the two-key model, version / build-number
semantics, `pubspec` constraints and dependency resolution, `dependency_overrides`, Pub
workspaces and melos, publishing to pub.dev and its scoring, `fvm` and upgrade strategy
including the AGP 9 warning, CI/CD and pipeline signing, `--analyze-size` / `--obfuscate` /
`--split-debug-info`, deferred components, and what obfuscation does **not** protect.

## Sourcing discipline

Every claim carries its authority — `[OFFICIAL]` (docs.flutter.dev, dart.dev,
api.flutter.dev), `[COMPASS]` (the reference app), `[MAINTAINER]`, `[PRACTITIONER]`,
`[WIDESPREAD]`, `[TOOLED]`, `[UNVERIFIED]` — with a `High`/`Medium`/`Low` confidence suffix.
Three consequences worth knowing:

- **Every skill names its silences.** Where the documentation prescribes nothing, the skill
  says so and says what source would lift it, rather than filling the hole by inference:
  certificate pinning, root/jailbreak detection, concurrent refresh-token serialisation,
  at-rest database encryption, desktop multi-window, non-Snap Linux packaging, app start-up
  cost. A silence is reported, never converted into a rule in either direction.
- **Open questions stay open.** The official architecture guide is deliberately neutral —
  *"ultimately the decision comes down to personal preference"* — so the skills give
  thresholds for choosing a state mechanism, not a winner. Same for the CI platform and for
  comparative criteria between local databases.
- **No unsourced performance figures.** "−70% dropped frames"-style numbers circulating in
  blog posts have no published methodology and must not drive an optimisation decision.

## Reference versions

Flutter **3.44.0** (stable 2026-05-18, docs updated 2026-05-05) · Dart SDK **3.12.x** ·
Impeller default since 3.27 · Material 3 default since 3.16 · `lints` 6.1.0 ·
`flutter_lints` 6.0.0 · `very_good_analysis` 10.2.0 · Riverpod 3.0.0 · flutter_bloc 9.x ·
`go_router` feature-complete · Pub workspaces native since Dart 3.6. pub.dev package status
verified 2026-08-03.

`flutter-build-release` and the persistence half of `flutter-data` are the two perishable
blocks — re-checked at each Flutter stable. `flutter-build-release` carries its own quarterly
re-verification list. Claims that depend on an open issue are marked `[VERIFY per version]`
rather than restated as settled.

## Install

```bash
/plugin install scd-flutter@sebc-dev-marketplace
```

Then invoke a skill by name — nothing fires automatically:

```bash
/scd-flutter:flutter-index          # which skill owns my question?
/scd-flutter:flutter-runtime        # or go straight to one
```

## License

MIT
