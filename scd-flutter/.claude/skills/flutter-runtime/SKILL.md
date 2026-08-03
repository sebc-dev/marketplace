---
name: flutter-runtime
description: |
  Flutter runtime behaviour, widget lifecycle and cost — what the framework rebuilds,
  reconciles, lays out and replays, and what that costs.
  Use when an app janks, drops frames or leaks memory; when an animation rebuilds more than it
  repaints; when widget state sticks to the wrong row after a reorder; when a layout throws on
  intrinsics; when asking what hot reload replays; when reading a figure a tool produced — a
  DevTools trace, an app-size view, a timing; when wiring a global error handler or keeping PII
  out of a crash report; or when moving work off the UI thread with an isolate.
---

# Flutter runtime, lifecycle and diagnosis

Calibrated on **Impeller** (default engine since Flutter 3.27, released 2024-12-11) and
Flutter 3.44.0 documentation (pages updated 2026-05-05). Anti-jank advice written around
Skia's runtime shader compilation is **historical** — it no longer describes the default
engine.

## The measurement gate

**Measured outside profile mode on a physical device, it is not a measurement.** Debug compiles
JIT with expensive asserts and exaggerates costs — *"JIT can cause the app to pause for JIT
compilation, which itself can cause jank"* — and emulators do not have the target hardware.

| Mode | What it is for | What it invalidates |
|---|---|---|
| Debug | Hot reload, asserts, `debug*` flags | Any performance figure. *"Application performance can be janky in debug mode."* |
| **Profile** | **The only representative measurement.** `flutter run --profile` | Disabled on emulators/simulators, by design |
| Release | Shipping | Service extensions off — cannot be profiled |

Profile on the **slowest device you target**. On web, DevTools cannot attach to a profile
build — use Chrome DevTools for the timeline.

Establish a reproducible baseline **before** changing anything. And know when to stop:
*"If your frames are rendering in well under 16ms total in profile mode, you likely don't
have to worry about performance even if some performance pitfalls apply."*

## The frame budget

*"build and display a frame in 16ms or less. Note that means built in 8ms or less, and
rendered in 8ms or less, for a total of 16ms or less."* Target under 8 ms total for 120 Hz
screens.

Two threads, and the overlay shows one graph each:

- **UI thread** — runs your Dart code in the VM and builds a *layer tree*.
- **Raster thread** (formerly "GPU thread") — takes the layer tree and talks to the GPU. You
  cannot address it directly; when it is slow, that is a consequence of your Dart code.

## The red fork

A frame over budget paints a **vertical red bar**. Which graph is red decides where to look
— this is the single most useful diagnostic split.

| Red graph | Meaning | Go to |
|---|---|---|
| **UI red** (even if raster is also red) | Dart code too expensive, excessive rebuilds | Profile the Dart VM **first**: CPU profiler, rebuild granularity, `const`, `AnimatedBuilder` `child` |
| **Raster red**, UI green | Scene too complex | `saveLayer`, opacity, clips, shadows |

Enable the overlay from the Inspector's *Performance Overlay* button, press **P** on the
command line, or set `MaterialApp.showPerformanceOverlay = true`. Always read it in profile.

## Symptom index

| Symptom | Open | Likely cause |
|---|---|---|
| Jank on scroll/animation, **UI** red | DevTools Performance + CPU profiler (profile) | Expensive build/layout, excessive rebuilds |
| **Raster** red, UI green | Overlay + `checkerboardOffscreenLayers` | `saveLayer`, opacity, clips, shadows |
| Unexpected repaints of a static area | `debugRepaintRainbowEnabled` | Missing `RepaintBoundary` |
| Double layout pass | DevTools *Track layouts* | Intrinsic passes |
| State follows the slot after a reorder or removal | Widget Inspector | Missing or unstable `Key` |
| Subtree state resets every frame | Widget Inspector | `GlobalKey`/`UniqueKey` created inside `build` |
| Memory grows without settling | DevTools Memory, diff snapshots | Undisposed controller/subscription/timer |
| OOM with large images | `debugInvertOversizedImages` | Image decoded larger than displayed |
| Overflow / unexpected sizes | `debugPaintSizeEnabled` | Layout constraints |
| "LayoutBuilder does not support returning intrinsic dimensions" | — | A `LayoutBuilder` (or `Ink`, `AutoSizeText`) under a `Table` or `IntrinsicHeight` |
| A change does not appear after hot reload | [diagnostics.md](references/diagnostics.md) | `main()`, `initState`, a static initialiser or `pubspec.yaml` — needs a restart |
| `NestedScrollView` header and body stop coordinating | [layout-and-painting.md](references/layout-and-painting.md) | A `ScrollController` passed to the inner scrollable — it supplies its own |

## First levers on the UI thread

1. **Rebuild granularity.** Call `setState()` as low in the subtree as possible — every
   descendant of that `State` rebuilds. Traversal stops when the same child widget instance
   as the previous frame is re-encountered.
2. **`const` everywhere it is possible.** It lets Flutter short-circuit most of a rebuild.
   `prefer_const_constructors` is in `flutter_lints`.
3. **A `StatelessWidget`, not a helper function**, for reusable UI — a widget gets rebuild
   boundaries and instance caching that a function does not.
4. **Pass the animation-independent subtree as `AnimatedBuilder`'s `child`**, never build it
   inside the `builder` — the builder body runs on every tick.
5. **`.builder` constructors for large lists and grids.** `ListView(children: [...])` builds
   offscreen children for nothing.

Detail, plus opacity, clipping, `saveLayer`, intrinsic passes, `RepaintBoundary`, image
decode sizing and string building: [`references/perf-patterns.md`](references/perf-patterns.md).

## Moving work off the UI thread

Isolates do not share memory, so every message is copied — which is what makes the choice
between one-shot and persistent a real decision rather than a style preference. One heavy
computation occasionally (parsing a large payload, image processing) is `Isolate.run` or
`compute()`; a continuous flow of jobs is a **persistent worker** — `Isolate.spawn` with a
`SendPort`/`ReceivePort` pair — because **`compute()` creates and tears down an isolate on every
call**, and for a stream of jobs that overhead dominates.

Two traps that produce build or runtime failures rather than slow code:

- **A plugin call from an isolate throws** unless that isolate first runs
  `BackgroundIsolateBinaryMessenger.ensureInitialized(token)` (Flutter 3.7+), where `token` is
  the `RootIsolateToken` captured on the root isolate and passed in `[OFFICIAL]`.
- **Web has no isolates at all.** `compute()` runs on the main thread — so it is not a
  concurrency escape hatch there — and `BackgroundIsolateBinaryMessenger.ensureInitialized`
  **does not compile** on web: a *build* error, not a runtime one (flutter/flutter #136886).
  Anything shipping to web needs a `kIsWeb` branch or a conditional import.

Worker skeleton, plugin initialisation, the zero-copy `TransferableTypedData` transfer, and the
web fallback: [`references/isolates.md`](references/isolates.md).

## Reconciliation and keys

The rule the whole widget lifecycle rests on, and the one most often applied blind.

**`Widget.canUpdate`: an `Element` can be updated to a new widget if and only if the two
widgets have equal `runtimeType` *and* equal `key` under `operator==`** `[OFFICIAL, High]`.
With no key, that reduces to matching **by type and position** — so state follows the slot,
not the data.

```dart
// Wrong: after a reorder or a removal, state (TextEditingController contents,
// checkbox, scroll offset) stays glued to the POSITION
ListView(children: items.map((it) => TodoTile(todo: it)).toList())

// Right: stable identity taken from the data
ListView(children: items.map((it) =>
    TodoTile(key: ValueKey(it.id), todo: it)).toList())
```

A key is needed when **stateful siblings of the same type can be reordered, inserted or
removed**. A list of `StatelessWidget`s that never moves needs none.

| Key | Identity it carries |
|---|---|
| `ValueKey(id)` | A value from the data — the default choice |
| `ObjectKey(item)` | The object's identity, when the value is not unique |
| `UniqueKey()` | Never equal to anything, including itself on the next build — forces a fresh `Element` |
| `GlobalKey` | Identity across the *whole* tree; enables reparenting and outside access to a `State`. Expensive, and rarely what you want |
| `PageStorageKey` | Restores scroll offset and similar via `PageStorage`; its value must stay stable across recreations |

Two traps worth stating outright:

- **A `GlobalKey` created in `build` throws the subtree's state away.** *"Creating a new
  GlobalKey on every build will throw away the state of the subtree."* `[OFFICIAL, High]` Own it
  in the `State`, instantiated in `initState`.
- **`UniqueKey()` in `build` has the same effect** for the same reason — a new identity every
  frame means a new `Element` every frame.

Full mechanism — the O(N) per-children-list algorithm from *Inside Flutter* (Flutter does not
diff trees), the real cost of `GlobalKey` reparenting, legitimate `GlobalKey` uses versus the
architecture smell, and the `use_key_in_widget_constructors` lint debate:
[`references/reconciliation.md`](references/reconciliation.md).

## dispose

Every one of these leaks if not released, and the generational GC cannot collect an object
still referenced by a live controller, timer or subscription:

```dart
class _State extends State<W> {
  final _controller = TextEditingController();
  StreamSubscription<int>? _sub;
  Timer? _timer;
  @override
  void dispose() {
    _controller.dispose();
    _sub?.cancel();
    _timer?.cancel();
    super.dispose();          // last
  }
}
```

`AnimationController`, `TextEditingController`, `ScrollController`, `StreamSubscription`
(`cancel`), `StreamController`/`Sink` (`close`), `Timer` (`cancel`). Holding a
`BuildContext` in a singleton retains the whole tree.

Official distinction: a **leak** (memory grows indefinitely — cumulative, *"even a small
leak, if repeated many times, leads to a crash"*) versus **bloat** (more memory than
necessary — oversized images, streams open for their whole lifetime). Both can end in OOM;
the leak is the more dangerous.

## Uncaught errors

An app with no error handlers loses every production failure. Three hooks, and they cover
different origins — installing one is not installing the others `[OFFICIAL, High]`:

| Hook | Catches |
|---|---|
| `FlutterError.onError` | Errors thrown inside the framework — build, layout, paint |
| `PlatformDispatcher.instance.onError` | Uncaught asynchronous errors outside the framework |
| `runZonedGuarded` | Errors in a zone you establish yourself |

`FlutterError.onError` plus `PlatformDispatcher.onError` covers the ground for most apps and is
the simpler arrangement; `runZonedGuarded` is the older path and is only needed when zone-local
state is in play. Installing all three without understanding which fires produces duplicate
reports far more often than extra coverage.

In debug, `FlutterError.onError` also drives the red error screen — replacing it silently
without forwarding to `FlutterError.presentError` removes the feedback you develop against.

**Crash reporting is where PII leaks.** Both Crashlytics and Sentry document
redaction/scrubbing hooks `[MAINTAINER]`, and the rule that matters is upstream of the tool: an
exception message built by interpolating user data carries that data into the report. Redact at
the point the error is constructed, not only at the point it is sent — a scrubber only removes
what it was told to look for.

## Hot reload: what is not replayed

**A hot reload rebuilds widgets and re-runs nothing else** — `main()`, `initState()`, static and
global **initialisers** are not replayed `[OFFICIAL, High]`, so telling someone to hot reload an
`initState` edit sends them to debug a stale app. When in doubt, hot restart. The full restart
list — including the type changes and the `pubspec.yaml` case — and `State.reassemble`'s two
warnings: [`references/diagnostics.md`](references/diagnostics.md).

## Layout cost, and dropping below the widget layer

**Intrinsic passes are quadratic in the worst case.** `IntrinsicWidth`/`IntrinsicHeight` adds a
speculative layout pass and *"can result in a layout that is O(N²) in the depth of the tree"*
`[OFFICIAL, High]` — one per item inside a scrollable is the shape that gets written by accident.
And **`LayoutBuilder` cannot resolve intrinsic dimensions**: a framework invariant that
propagates, so any widget containing one — `Ink`, `AutoSizeText` — breaks intrinsic measurement
for its ancestors and throws under a `Table` or an `IntrinsicHeight` (flutter/flutter #44472).

Below the widget layer, the official bias is to stay high — *"direct interaction with the
rendering layer is awkward at best and bug-prone at worst"* `[OFFICIAL, High]`. The ladder:
compose; then `CustomPaint` when the **drawing** is custom but the box model is not; then a
custom `RenderBox` when layout must **measure then decide** in one pass; then `RenderObject`
only for a non-Cartesian protocol. `CustomPainter` buys drawing and **not** layout — `setState`
and `markNeedsLayout` are illegal from inside `paint` — and a `shouldRepaint` returning a hard
`true` repaints every frame.

Each level in one more sentence, the intrinsic overrides, the full `shouldRepaint` contract and
driving a painter from a `Listenable`:
[`references/layout-and-painting.md`](references/layout-and-painting.md).

## Seams

This skill owns **what the framework does at runtime and what it costs**, lifecycle included: an
intrinsic pass is a layout contract *and* an O(N²) cost, `CustomPainter` a drawing API *and* a
repaint lever, so a rendering/performance cut would run *through* those topics rather than
between them. When a question sits near a seam, decide which side it falls on before answering.

| Neighbouring subject | Owner | Where the seam falls |
|---|---|---|
| Writing or fixing tests, goldens, `fakeAsync`, the a11y harness, flakiness, coverage | `flutter-testing` | **This skill measures cost; that one proves behaviour.** A performance test producing a timing (`watchPerformance`, `traceAction`) is a measurement and stays here |
| Layers, file placement, the state mechanism, DI, routing, platform targeting, desktop packaging | `flutter-architecture` | — |
| Animations, gestures, focus and shortcuts, text input and forms, theming, `Semantics` annotations, i18n | `flutter-ui-interaction` | The *cost* of animating is here; the animation API is there |
| HTTP clients, serialisation, local databases, tokens and sessions | `flutter-data` | The isolate *mechanism* is here; the `DriftIsolate.spawn` recipe is there |
| Flavors, signing, versioning, `pubspec` constraints, CI/CD, `--analyze-size` and the size flags | `flutter-build-release` | **This skill diagnoses, that one produces the artefact.** The DevTools App size view is here |
| The Dart language, null safety, patterns, lint rulesets | `dart-idioms` | — |

Accessibility is cut by activity, not by subject: the **harness and the guideline values** live
in `flutter-testing`, **what to annotate** in `flutter-ui-interaction`.

## Name the silence

Say what has no prescription, and what would lift it — an unlabelled claim gets obeyed as one.

Standing silences here: **no published methodology for app start-up cost or first-frame cost**,
so circulating blog figures must not drive a decision; **no official numeric threshold for
writing a custom `RenderObject`** — the citable material is the composition-first ladder above,
not a number; and **no prescribed interaction between `reassemble` and application state**, the
dartdoc warning against relying on ordering being a warning, not a procedure.

## References

- [`references/perf-patterns.md`](references/perf-patterns.md) — every rendering pattern and
  its cost: build granularity, `const`, `AnimatedBuilder`, opacity, `saveLayer`, clipping,
  lazy builders, intrinsic passes, `RepaintBoundary`, image cache sizing, `operator ==` on
  widgets, `StringBuffer`, allocation pressure in `build()`.
- [`references/layout-and-painting.md`](references/layout-and-painting.md) — the two documented
  `NestedScrollView` constraints and the open issues around it, why to override
  `computeMinIntrinsic*` and never the `get*` forms, the two halves of the `shouldRepaint`
  contract and why it is a hint rather than a guarantee, driving a painter from a `Listenable`
  instead of an `AnimatedBuilder`, and one sentence on each level of the descent ladder.
- [`references/isolates.md`](references/isolates.md) — one-shot versus persistent worker with a
  worker skeleton and why every message needs an id, `RootIsolateToken` and
  `BackgroundIsolateBinaryMessenger`, `TransferableTypedData` ownership transfer, and the
  per-construct table of what web does instead (including the build-time failure).
- [`references/reconciliation.md`](references/reconciliation.md) — the O(N) per-children-list
  matching algorithm from *Inside Flutter*, the `canUpdate` gate, a decision tree for choosing a
  key, `PageStorageKey` stability, what `GlobalKey` reparenting really costs and its four
  legitimate uses, the three places keys resurface in UI code, and the
  `use_key_in_widget_constructors` debate.
- [`references/diagnostics.md`](references/diagnostics.md) — the full hot-restart list and
  `State.reassemble`'s two warnings, DevTools views, the performance overlay, the full `debug*`
  flag list with the official warning about `debugProfileBuildsEnabled`, the leak-diagnosis
  procedure, `leak_tracker`, and automated performance tests in CI (`watchPerformance`,
  `traceAction`, JSON output).
