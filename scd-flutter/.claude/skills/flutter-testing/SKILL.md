---
name: flutter-testing
description: |
  Flutter test strategy and test authoring — proving an app behaves, pass or fail, and
  keeping the proof reliable.
  Use when writing, fixing or reviewing a Flutter test; when a test is flaky, times out or
  fails only in CI; when deciding what to test at which layer; when a widget test throws
  MissingPluginException or a network call in a test returns 400; or when setting up goldens,
  the accessibility harness or coverage.
---

# Flutter testing

Reference: **Flutter 3.44.0** · Dart SDK **3.12.x**.

## Test layers

*"A well-tested app has many unit and widget tests, tracked by code coverage, plus enough
integration tests to cover all the important use cases."* `[OFFICIAL]`

| Trade-off | Unit | Widget | Integration |
|---|---|---|---|
| Confidence | Low | Higher | Highest |
| Maintenance cost | Low | Higher | Highest |
| Speed | Fast | Fast | Slow |

Testability is an architecture signal, not just a test concern: *"view and view model tests
only require mocking repositories if your architecture is sound."* `[OFFICIAL]` Test a ViewModel
with **fakes of its repositories** and no Flutter dependency; test a Repository by mocking the
services it depends on. `test/` mirrors `lib/`; fakes live in a `testing/` folder — *"a version
of your app you do not ship."*

Documented limit: `integration_test` **cannot** drive native UI — permission dialogs,
notifications, platform views. That needs `patrol` `[OFFICIAL]`.

## Rules that prevent flakiness

1. **Control time, never wait for it.** Use `fakeAsync`/`FakeAsync.elapse` or
   `tester.pump(Duration)`. Widget tests already run inside a `FakeAsync` zone. `fakeAsync`
   does not control `DateTime.now()`/`Stopwatch` — inject those through the `clock` package.
2. **`pumpAndSettle` is not a wait-for-ready.** It re-pumps until no frame is scheduled
   (default timeout **10 minutes**) and **throws on an infinite animation** — an indeterminate
   progress indicator is enough. *"Figure out exactly why each frame is needed, and then pump
   exactly as many frames as necessary."* `[OFFICIAL]`
3. **Prefer fakes to mocks.** A fake is a lightweight deterministic implementation. Mock only
   your own boundaries — repositories, services — never the framework.
4. **Assert behaviour, not implementation.** Tests that verify internal call order break on
   every refactor. One scenario per test, and every test ends in a meaningful
   `expect`/`verify` — coverage without an assertion tells you nothing.
5. **Register cleanup with `addTearDown(obj.dispose)`** inside the test rather than a shared
   manual `tearDown`. Leak tracking (Flutter 3.22+) hooks into it.
6. **Expect the HttpClient override.** In non-browser tests the binding replaces `HttpClient`
   with a fake returning **400**, to keep tests off the network. A test that genuinely needs a
   network call must supply its own client.

## Driving an interaction

Rule 2 says *what* to pump. This is how to make something happen first, and how to assert
part-way through rather than only at rest.

**Landing mid-animation.** Widget tests run inside a `FakeAsync` zone, so `pump(Duration)`
steps the clock instead of waiting `[OFFICIAL, High]`. That is the whole mechanism — there is
no separate animation-driving API:

```dart
await tester.tap(find.byType(FloatingActionButton));
await tester.pump();                                  // schedules and starts the animation
await tester.pump(const Duration(milliseconds: 150)); // lands on the instant asserted
expect(/* the half-way state */);
await tester.pumpAndSettle();                         // drain — only if it terminates
```

An animation that never ends makes `pumpAndSettle` throw (rule 2) **and** can make
`pump(Duration)` fail on pending timers — flutter/flutter #180772, Flutter 3.38.5, ouvert
2026-01-09, clos *solved* `[MAINTAINER]` `[VERIFY per version]`. Pump a fixed number of frames
on those screens.

**Choosing the gesture** — all on `WidgetTester` `[OFFICIAL]`:

| Need | Method |
|---|---|
| Move a widget by an offset | `drag(finder, offset)` |
| Start where no widget centre is | `dragFrom(start, offset)` |
| A controlled velocity profile | `timedDrag(finder, offset, duration)` |
| Throw with inertia | `fling(finder, offset, speed)` |
| Scroll until a finder matches | `dragUntilVisible(finder, view, moveStep)` |
| Several steps, or arena arbitration | `startGesture(loc)`, then `moveBy` / `up` on the `TestGesture` |
| Trackpad rather than touch | `trackpadFling` — sends `PointerPanZoom`, not a touch sequence |

**The touch-slop trap.** A drag longer than `kDragSlopDefault` (**20 px**) only registers if it
is subdivided into smaller moves. `drag` and `dragFrom` subdivide for you; **`fling` does not**,
which is why its `initialOffset` — meant to simulate a drag *then* a fling — does nothing:
flutter/flutter #139455, ouvert, P3, found in 3.16/3.18, dernière activité 2023-12-04
`[MAINTAINER]` `[VERIFY per version]`. Compose it by hand with `startGesture` when you need
drag-then-fling.

**Keyboard** `[OFFICIAL]`. `sendKeyEvent` sends down **and** up; `sendKeyDownEvent` /
`sendKeyUpEvent` hold a modifier across other keys; `sendKeyRepeatEvent` simulates auto-repeat.
The global `simulateKeyDownEvent` / `simulateKeyUpEvent` work without a tester. **A shortcut
fires only if something is focused** — `Shortcuts` resolves through the enclosing `Focus`
context, so a test must place focus before sending the key or the `Intent` never reaches its
`Action`.

> **[OFFICIAL, Medium] — there is no strategy guidance for testing an interaction.**
> The API is fully documented on api.flutter.dev, but the official cookbook *Tap, drag, and
> enter text* demonstrates only `tap`, `drag` and `enterText` — nothing on `fling`,
> `dragUntilVisible`, arena arbitration or the keyboard. How much of a gesture is worth
> asserting is left to the reader.
> *What would lift this:* a cookbook recipe covering gestures beyond `drag`.

## Symptom index

| Symptom | Likely cause |
|---|---|
| `MissingPluginException` | Host code absent in unit/widget tests — mock the channel |
| "pumpAndSettle timed out" | Infinite animation, or `pumpAndSettle` used as a wait-for-ready |
| A drag in a test does nothing | Shorter than the 20 px slop, or `fling`'s `initialOffset` (#139455) |
| A shortcut never fires in a test | Nothing focused — `Shortcuts` resolves through `Focus` |
| Network call returns 400 | The binding's `HttpClient` override |
| Passes locally, fails in CI | Real time, execution order, or a font-dependent golden |
| Golden differs by a few pixels | Fonts — goldens need the test font loaded, and differ across platforms |

## The accessibility harness

Accessibility is checkable, and the four guidelines carry exact values `[OFFICIAL, High]`:

| Guideline | Value |
|---|---|
| `androidTapTargetGuideline` | `MinimumTapTargetGuideline(size: Size(48.0, 48.0))` |
| `iOSTapTargetGuideline` | `MinimumTapTargetGuideline(size: Size(44.0, 44.0))` |
| `textContrastGuideline` | WCAG minimum text contrast — 3:1 for large text ≥ 18 pt |
| `labeledTapTargetGuideline` | Every tap target carries a label |

The official pattern, verbatim `[OFFICIAL, High]`:

```dart
final SemanticsHandle handle = tester.ensureSemantics();
await tester.pumpWidget(const MaterialApp(home: HomePage()));
await expectLater(tester, meetsGuideline(androidTapTargetGuideline));
handle.dispose();
```

`ensureSemantics()` is required — the semantics tree is not built during a widget test
otherwise — and `handle.dispose()` is mandatory, so it belongs in `addTearDown` for anything
beyond a one-line test.

**What to annotate** — `Semantics`, `MergeSemantics`, `ExcludeSemantics`, `TextScaler`, target
sizes — is `flutter-ui-interaction`'s. This skill runs the check; that one decides what the
check should find.

## Seams

When a question sits near a seam, decide which side it falls on before answering.

| Neighbouring subject | Owner | Where the seam falls |
|---|---|---|
| Profiling, DevTools traces, the frame budget, leak diagnosis, `leak_tracker` | `flutter-runtime` | **This skill proves behaviour; that one measures cost.** A performance test that produces a timing (`watchPerformance`, `traceAction`) is a measurement and lives there |
| Where code belongs, the layer contract, what makes code testable in the first place | `flutter-architecture` | Testability is designed there and exercised here |
| What to annotate for accessibility, and the `Semantics` API | `flutter-ui-interaction` | This skill owns the harness and the guideline values, so they cannot diverge across two skills |
| How the gesture arena arbitrates, how focus traversal and `Shortcuts`/`Actions` resolve, which animation family to reach for | `flutter-ui-interaction` | **Simulating an interaction is here; the behaviour being simulated is there.** `tester.drag`, `fling`, `sendKeyEvent` and stepping an animation with `pump(Duration)` are test instruments and stay here |
| Running the suite in CI, release gating | `flutter-build-release` | Authoring a test is here; wiring it into a pipeline is a delivery concern |
| `test` package idioms, async and `Future` semantics in Dart | `dart-idioms` | Language layer, valid outside Flutter |

## Name the silence

Say what has no prescription, and what would lift it — an unlabelled claim gets obeyed as one.

Standing silence here: **no official coverage threshold exists.** Flutter documents how to
produce coverage, never what number to require. A percentage presented as a Flutter standard is
invented.

## References

- [`references/test-strategy.md`](references/test-strategy.md) — what each layer covers, testing
  by architecture layer, `blocTest`, golden tests and Alchemist, fakes and mocks, async, stream
  and time testing, plugin-dependent code, file organisation, coverage and its limits, and the
  six documented test anti-patterns.
