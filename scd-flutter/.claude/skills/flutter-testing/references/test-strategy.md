# Test strategy by layer

Source levels: **[OFFICIAL]** docs.flutter.dev/api.flutter.dev · **[TOOLED]** enforced by a
tool · **[PRACTITIONER]** recognised maintainer/GDE · **[WIDESPREAD]** common but unnormed.

## The three layers and their trade-offs

| Trade-off | Unit | Widget | Integration |
|---|---|---|---|
| Confidence | Low | Higher | Highest |
| Maintenance cost | Low | Higher | Highest |
| Dependencies | Few | More | Most |
| Speed | Fast | Fast | Slow |

Official target: *"a well-tested app has many unit and widget tests, tracked by code
coverage, plus enough integration tests to cover all the important use cases."* **[OFFICIAL]**

### What each layer covers

- **Unit** — one function, method or class. Verify logic under varying conditions; external
  dependencies mocked or faked. Does not read/write disk, does not render, does not receive
  user actions.
- **Widget** — one widget. Verify it renders and reacts as expected, in a simplified
  environment driven by `WidgetTester`.
- **Integration** — the whole app or a large slice, on a real device or emulator, with test
  code isolated from app code. SDK package `integration_test`. **Documented limit:** it
  **cannot** interact with native UI (permission dialogs, notifications, platform views) —
  use the `patrol` package for that.

## Testing by architecture layer

**[OFFICIAL, from the Compass case study]**

- **ViewModel** — unit tests with no Flutter dependency. Its only dependency is its
  repositories, so write fakes: `FakeBookingRepository implements BookingRepository`.
  Verbatim: *"view and view model tests only require mocking repositories if your
  architecture is sound."*
- **Repository** — mock the services it depends on.
- **Architectural signal.** Ease of testing indicates sound architecture. Repositories must
  never know about each other — combine them in the ViewModel or a use-case. The `testing/`
  folder holds *"a version of your app that you don't ship."*

## Testing state (bloc)

**[PRACTITIONER (bloclibrary.dev/felangel) — secondary]** Use `blocTest` from the `bloc_test`
package: `build`/`act`/`expect`, plus `seed`, `skip`, `wait` (a `Duration` for async
operations such as debounce), `verify`, `errors`.

`blocTest` closes the bloc's stream before evaluating the expectation, which guarantees no
extra state is emitted afterwards. `whenListen` stubs a stream of states; `MockBloc`/
`MockCubit` are provided. Watch out when states do not override `==`/`hashCode`.

Low-level alternative: `expectLater(bloc.stream, emitsInOrder([...]))`. Confidence: High.

## Golden tests and their fragility

**Statement.** Use `matchesGoldenFile`:
`expectLater(find.byType(X), matchesGoldenFile('x.png'))`; regenerate with
`flutter test --update-goldens`.

**Documented fragility.** By default the framework uses the **Ahem** font — squares instead
of characters. Load a real font via `FontLoader`, ideally in `flutter_test_config.dart`.
api.flutter.dev, verbatim: *"Custom fonts may render differently across different platforms,
or between different versions of Flutter"* — a golden generated on Windows or macOS differs
from one produced on Linux (CI).

**Tooled fix.** `alchemist` (VGV) separates **CI** goldens (independent of font rendering,
safe in CI) from **platform** goldens (per OS, excluded from CI). Lock down themes, fonts,
`surfaceSize` and `devicePixelRatio`, and run goldens on Linux in CI. **[OFFICIAL for
`matchesGoldenFile`/Ahem; PRACTITIONER (VGV/LeanCode) for Alchemist]** Confidence: High.

## Fakes and mocks

**Statement.** Prefer wrapping plugin/service calls behind your own API, which is then
mockable in tests.

**Tools.** `mocktail` — pub.dev, verbatim: *"without the need for manual mocks or code
generation"*; `extends Mock implements X`. `registerFallbackValue(FakeX())` is **required**
for non-primitive types used with `any()`, and belongs in `setUpAll`. Without it mocktail
throws: *"a test tried to use `any` or `captureAny` on a parameter of type …, but
registerFallbackValue was not previously called to register a fallback value"*.
Alternative: `mockito` (`@GenerateMocks` + `build_runner`).

**VGV core kit** **[PRACTITIONER]**: `mocktail`, `bloc_test`, `alchemist`, `mockingjay`
(navigation mocks), `flame_test`. Confidence: High.

## Async, streams and time

**Statement.** Control time through `fakeAsync`/`FakeAsync.elapse` or
`tester.pump(Duration)` — never through real delays.

Widget tests already run inside a `FakeAsync` zone — api.flutter.dev: *"For a FakeAsync
environment (typically in flutter test), this advances time and timeout counting."*
`fakeAsync` (package `fake_async`) controls Futures, Streams, Timers and microtasks: *"When
the time is advanced, FakeAsync fires all asynchronous events that are scheduled for that
time period without actually needing the test to wait for real time to elapse."*

It does **not** control `DateTime.now()` or `Stopwatch` — inject those through the `clock`
package (`clock.now()`).

**Stream matchers:** `emitsInOrder`, `emits`, `emitsDone`, `isA<T>()`. **[OFFICIAL]**
Confidence: High.

## Plugin-dependent code

Host code (Kotlin/Swift) is not available in unit or widget tests, producing
`MissingPluginException(No implementation found for method … on channel …)`.

Official solutions, in order of preference:

1. Wrap the plugin call behind your own API and mock that.
2. Mock the platform channel:
   `TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger.setMockMethodCallHandler(channel, handler)`
   — and reset it to `null` in `tearDown`.

Note: *"Plugin implementations that only use Dart will work in unit tests. This is an
implementation detail… tests shouldn't rely on it."* **[OFFICIAL]** Confidence: High.

## File organisation

`test/` mirrors the structure of `lib/`, one `_test.dart` per source file — barrel files do
not need testing. The official Compass app keeps its test doubles in `testing/`. VS Code
offers "Go to Tests" / "Go to Test/Implementation File" to create or find a test file. One
scenario per test, even if that means more tests — preferred for readability and debugging.
**[PRACTITIONER (VGV) + OFFICIAL (Compass)]**

## Coverage and its limits

Measure coverage, but assert **behaviour**, not line execution.

VGV targets 100% line coverage — *"the only threshold that guarantees every line you ship has
been executed by at least one test"* — enforced in CI through `very_good_coverage` (GitHub
Action, `min_coverage`, glob `exclude`) or
`very_good test --coverage --min-coverage 100 --exclude-coverage "*.g.dart"`.

**Explicit limit:** 100% does not eliminate bugs. A test that generates coverage without a
meaningful `expect`/`verify` *"doesn't really tell any valuable information about what the
widget should do."* Every test must end in at least one `expect` or `verify`. For an existing
project, start from current coverage and raise it progressively.
**[PRACTITIONER (VGV) — secondary; TOOLED for the action]** Confidence: High.

## The six documented test anti-patterns

### 1. Overusing `pumpAndSettle`

**Symptom.** Slow, flaky tests; "pumpAndSettle timed out".

**Cause.** `pumpAndSettle` re-calls `pump` until no frame is scheduled (default timeout
**10 minutes**, signature `timeout = const Duration(minutes: 10)`). api.flutter.dev,
verbatim: *"if there is an infinite animation in progress (for example, if there is an
indeterminate progress indicator spinning), this method will throw."*

**Fix.** *"Figure out exactly why each frame is needed, and then pump exactly as many frames
as necessary"* — use explicit `pump(Duration)`; in integration tests, `pump` without waiting
on the scheduler. Reserve `pumpAndSettle` for draining finite animations. Patrol offers
`pumpAndTrySettle`, which does not throw on timeout.

**Real tracker issues:** #100130 (*"[integration_test] Not able to tap button while infinite
animation is running"* → pumpAndSettle timed out), #84966 (an infinite
`LinearProgressIndicator` means pumpAndSettle never terminates). **[OFFICIAL + tracker]**
Confidence: High.

### 2. Real-time dependencies

**Symptom.** Intermittent flakiness, slow tests. **Cause.** Real `Timer`/`Future.delayed` in
the code under test, with real waiting. **Fix.** `fakeAsync` + `elapse`, or
`tester.pump(Duration)`; for `DateTime.now()`/`Stopwatch`, inject the `clock` package.
**[OFFICIAL]** Confidence: High.

### 3. `HttpClient` → 400 in `TestWidgetsFlutterBinding`

**Symptom.** Warning *"At least one test in this suite creates an HttpClient… all HTTP
requests will return status code 400"*; failing network tests. The mere presence of
`testWidgets` in a file is enough to trigger the interception.

**Cause.** api.flutter.dev, verbatim: *"In non-browser tests, the binding overrides HttpClient
creation with a fake client that always returns a status code of 400. This is to prevent
tests from making network calls, which could introduce flakiness."*

**Fix.** *"A test that actually needs to make a network call should provide its own
HttpClient to the code making the call"* — inject it. For `NetworkImage`/`Image.network`:
`debugNetworkImageHttpClientProvider = () => _FakeHttpClient();` or the
`mocktail_image_network` package.

**Real tracker issues:** #35318, #77245, #129532. **[OFFICIAL + tracker]** Confidence: High.

### 4. Over-mocking

**Symptom.** Tests pass while the real integration is broken; tests rewritten every time a
dependency changes. **Fix.** Prefer **fakes** (lightweight deterministic implementations) to
mocks whenever the object has behaviour; mock only your own boundaries (repositories,
services), never the framework. A well-architected ViewModel or View needs only its
repositories faked. **[OFFICIAL (case study) + PRACTITIONER (VGV)]** Confidence: Medium.

### 5. Tests coupled to the implementation

**Symptom.** Tests break on every refactor that changes no behaviour. **Cause.** Verifying
internal details — the exact order of paint calls through a mock Canvas — instead of
observable behaviour. **Fix.** Assert observable outputs and effects; golden tests document
rendering better than a mock Canvas, which VGV calls *"very fragile to implementation
changes"*. One scenario per test. **[PRACTITIONER (VGV) + OFFICIAL]** Confidence: Medium.

### 6. Missing test-object cleanup

**Statement.** Register disposal with `addTearDown(obj.dispose)` — it runs after the test, in
LIFO order — rather than a shared manual `tearDown`. `addTearDown` can only be called inside a
test (`StateError` otherwise); `testWidgets` itself uses `addTearDown(binding.postTest)`.
Leak tracking (Flutter 3.22+) hooks into it to detect undisposed objects. **[OFFICIAL]**
Confidence: High.

### Bonus: finders queried too early

**Symptom.** An empty `Finder` because the widget has not rendered yet (after an HTTP fetch,
for instance). **Fix.** Pump explicitly until the condition holds; avoid open-ended `while`
wait loops; in integration tests prefer bounded `scrollUntilVisible`/`pump`. Patrol exposes
finders that wait. **[PRACTITIONER (Patrol) + WIDESPREAD]** Confidence: Medium.

## Testability checklist

- Is every `AnimationController`/`*Controller`/`StreamSubscription`/`Timer`/`Sink` released in
  `dispose`/`cancel`/`close`?
- Do tests use `fakeAsync`/`pump(Duration)` rather than real delays?
- Does every test end in a meaningful `expect`/`verify`, not just coverage?
- Are test objects cleaned up through `addTearDown`?
- Do golden tests load a real font and run on Linux in CI?
- Is `pumpAndSettle` avoided on screens with an infinite animation?
- Is plugin code mocked behind an application-level API?
