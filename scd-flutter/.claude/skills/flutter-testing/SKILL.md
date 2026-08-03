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

## Symptom index

| Symptom | Likely cause |
|---|---|
| `MissingPluginException` | Host code absent in unit/widget tests — mock the channel |
| "pumpAndSettle timed out" | Infinite animation, or `pumpAndSettle` used as a wait-for-ready |
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
