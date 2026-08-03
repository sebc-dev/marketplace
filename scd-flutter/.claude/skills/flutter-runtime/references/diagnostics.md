# Diagnostic tooling

Source levels: **[OFFICIAL]** docs.flutter.dev/api.flutter.dev · **[TOOLED]** enforced by a
tool · **[PRACTITIONER]** recognised maintainer/GDE · **[WIDESPREAD]** common but unnormed.

Everything here is read **in profile mode on a physical device**, except the `debug*` flags,
which only work in debug mode and therefore inform layout and repaint questions — never
timing.

## Hot reload: what is not replayed

*"a hot reload causes all the existing widgets to rebuild. Only code involved in the rebuilding
of the widgets is automatically re-executed. The main() and initState() functions, for example,
are not run again."* `[OFFICIAL, High]`

**A hot restart is required** for `[OFFICIAL, High]`:

- Changes to `main()` or `initState()`
- Global variables and static fields — treated as state, so their **initialisers** are not re-run
- An enum becoming a class, or the reverse; changed generic type declarations
- A widget changing between `StatelessWidget` and `StatefulWidget`
- `pubspec.yaml` edits — dependencies, assets, fonts — and any native code, which need a **full**
  restart

Say this plainly when advising a change: telling someone to hot reload an `initState` edit sends
them to debug a stale app. When in doubt, hot restart.

`State.reassemble` runs on reassembly in debug. Its dartdoc is explicit that *"In release
builds, the ext.flutter.reassemble hook is not available"* and that *"Implementers should not
rely on any ordering for hot reload source update, reassemble, and build methods"* `[OFFICIAL]` —
so it is a hook for re-deriving debug state, never a place to sequence anything.

## DevTools views

- **Performance view** — the Flutter frames chart: each pair of bars is one Flutter frame,
  colour-coded UI vs raster. Selecting a frame opens the *Frame analysis* and *Timeline
  events* tabs. Options: *Track layouts* (off by default; reveals intrinsic passes as
  `$runtimeType intrinsics` events), the performance overlay toggle, and pause/resume/stop
  buttons for profiling.
- **CPU profiler** — a flame chart of call stacks for the selected timeline event.
- **Memory view** — heap and external allocation tracking, snapshots, snapshot diffing,
  *Trace Instances*, leak and bloat detection.
- **Widget Inspector** — a visual tree, the *Performance Overlay* button, and *Slow
  Animations* — verbatim: *"When enabled, this option runs animations 5 times slower for
  easier visual inspection"* (the code equivalent is `timeDilation = 5.0` from
  `package:flutter/scheduler.dart`). *Show widget rebuild information* lives in the IDE's
  Flutter Performance window.
- Also available: **Network view**, **Logging view**, **Debugger**, **App size tool**.

**[OFFICIAL]** Confidence: High.

## Performance overlay

Enable it from the Inspector's *Performance Overlay* button, by pressing **P** on the command
line, or by setting `MaterialApp.showPerformanceOverlay = true` /
`WidgetsApp.showPerformanceOverlay`.

Two graphs, one per thread. A green vertical line means the current frame is inside budget; a
red bar means it exceeded it. **Always read it in profile mode.** **[OFFICIAL]** Confidence:
High.

## `debug*` flags

*"In general, anything in the Flutter framework that starts with 'debug…' only works in debug
mode."* Remove the `package:flutter/rendering.dart` import for these before a release build.

| Flag | What it does |
|---|---|
| `debugProfileBuildsEnabled` | Adds a timeline event per widget build. ⚠️ **Official warning:** *"The timing information this flag exposes is not representative of the actual cost of building, because the overhead of adding timeline events is significant relative to the time each object takes to build."* Use it to see **what** rebuilds, never **how long** it took. See also `debugProfileLayoutsEnabled`, `debugProfilePaintsEnabled`. |
| `debugPrintRebuildDirtyWidgets` | Reports builds to the console |
| `debugRepaintRainbowEnabled` | Overlays rotating colours on every layer repaint — reveals unexpected repaints and `RepaintBoundary` candidates |
| `debugPaintLayerBordersEnabled` | Orange outline around each layer's bounds |
| `debugPaintSizeEnabled` | Cyan boxes and arrows showing sizes and constraints — the tool for layout and overflow debugging |
| `debugPaintBaselinesEnabled` | Text baselines |
| `debugPaintPointersEnabled` | Touch/gesture contact points |
| `debugInvertOversizedImages` | Inverts images decoded larger than displayed |
| `debugPrintLayouts`, `debugPrintScheduleFrameStacks`, `debugPrintMarkNeedsLayoutStacks` | Layout and frame scheduling traces |
| `timeDilation` (scheduler, > 1.0) | Slows animations programmatically |

**[OFFICIAL]** Confidence: High.

## Diagnosing a leak

Procedure:

1. Open the **Memory view**.
2. Reproduce the suspect interaction — typically navigate away and back.
3. Force a GC.
4. Take a snapshot before and after.
5. **Diff Snapshots**, filter the classes, and spot the instances that survive.
6. **Trace Instances** to find the allocation site.
7. Expand the reference tree to understand the retention — e.g. a `BuildContext` retained by
   an `AnimationController` means a missing `dispose`.

**Leak vs bloat.** A *leak* means memory grows indefinitely (a listener recreated and never
disposed); *bloat* means more memory than necessary (oversized images, streams open for their
whole lifetime). Both can end in OOM, but the leak is more dangerous because it is
cumulative: *"even a small leak, if repeated many times, leads to a crash."*

**Automation.** The `leak_tracker` package (Dart team) detects, in tests, objects not
collected when they should be. It is integrated into recent `flutter_test` (3.22+) through
`leak_tracker_flutter_testing`, hooked into the internal tearDown. **[OFFICIAL]** Confidence:
High.

## Automated performance tests in CI

**Approach.** An integration test using `IntegrationTestWidgetsFlutterBinding` plus
`binding.traceAction(() async { … }, reportKey: 'scrolling_timeline')`. Give each
`traceAction` a distinct `reportKey` when there is more than one — the default key is
`timeline`.

**Modern API.** `IntegrationTestWidgetsFlutterBinding.watchPerformance(action, reportKey:
'performance')` replaces the old `flutter_driver` pairing of `traceAction` and
`TimelineSummary`.

**Running it:**

```
flutter drive \
  --driver=test_driver/perf_driver.dart \
  --target=integration_test/scrolling_test.dart \
  --profile --no-dds
```

`--no-dds` is required on a device or emulator.

**Output.** JSON, consumable in CI to assert that a jank or timing metric stays under a
ceiling. The `integration_test` framework can also produce jank, download-size,
battery-efficiency and startup-time metrics. Fail the build below the threshold.

**Historical note.** `flutter_driver` + `FlutterDriver.connect()` +
`TimelineSummary.summarize()` is still documented, but the official direction has moved to the
`integration_test` package. **[OFFICIAL, marked historical]** Confidence: Medium.

## Web caveat

Dart/Flutter DevTools **cannot** attach to a web app in profile mode. Use Chrome DevTools to
generate timeline events on the web. **[OFFICIAL]** Confidence: High.

## Recommended sequence

1. **Before optimising** — run `flutter run --profile` on the slowest target device, enable
   the overlay, reproduce the interaction, capture a DevTools timeline. Change nothing without
   a baseline. **Stopping rule:** if the frame is already *"well under 16ms total in profile
   mode"*, stop.
2. **Facing jank** — follow the red fork: UI red → CPU profiler, then reduce rebuilds, add
   `const`, pass `AnimatedBuilder`'s `child`. Raster red → hunt `saveLayer`, opacity, clips.
3. **Suspecting a leak** — Memory view, diff snapshots around the interaction, aim for the
   allocation site, add the missing `dispose`, enable `cancel_subscriptions`.
4. **For tests** — mirror `lib/` in `test/`, one scenario per test with a real assertion,
   control time with `fakeAsync`/`pump(Duration)`, wrap plugins, run goldens through Alchemist
   on Linux CI, enforce a coverage threshold with `very_good_coverage`.
5. **In CI** — add a `traceAction`/`watchPerformance` integration test with a distinct
   `reportKey` and JSON export to catch frame regressions.

**What changes the decision:** moving to a 120 Hz device (target under 8 ms total); switching
Flutter channel (re-check Impeller status per platform).
