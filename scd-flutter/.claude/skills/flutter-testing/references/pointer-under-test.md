# Simulating a pointer under `WidgetTester`

How to make a mouse hover, turn a wheel or press the secondary button inside a widget test.
Read this when a control works under `tester.tap` and the hover, cursor, wheel or right-click
path has no test at all — which is the usual state, because none of it has a one-line helper.

Sources reflect **Flutter 3.44**: the `WidgetController`, `TestGesture` and `TestPointer`
dartdocs on api.flutter.dev, read together with their published implementations `[OFFICIAL]`,
plus two tracker items cited where they carry the point.

The *behaviour* being asserted — what `MouseRegion` promises, how a cursor resolves, why a mouse
drag does not scroll — is `flutter-ui-interaction`'s, in its `pointer-and-desktop.md`. This page
is only the instrument.

## Two objects, and the line between them

They look interchangeable in a test file and are not `[OFFICIAL]`:

| Class | Its own words | What a call does |
|---|---|---|
| `TestPointer` | *"A class for generating coherent artificial pointer events."* | **Builds** an event and returns it. Nothing reaches the framework |
| `TestGesture` | *"A class for performing gestures in tests."* | **Dispatches**. `moveTo`, `down`, `up` go through the binding |

So `pointer.hover(loc)` yields a `PointerHoverEvent` that you must hand to
`tester.sendEventToBinding` yourself, while `gesture.moveTo(loc)` sends one for you. Both idioms
are legitimate; mixing them silently — building an event and never dispatching it — is a test
that asserts nothing and passes.

## There is no `tester.hover`

`WidgetController` publishes fifty-odd methods and none of them hovers. `tap`, `longPress`,
`drag`, `fling`, `timedDrag`, `trackpadFling`, `scrollUntilVisible`, `sendKeyEvent` all exist;
the pointer has `createGesture` and nothing above it.

That is a known gap, not an oversight to route around: flutter/flutter **#102754**,
*"[flutter_test] Simulating hover should be easier"*, opened **2022-04-28**, still **open**, P3,
`c: new feature` `[MAINTAINER]` `[VERIFY per version]`. The issue asks for
`tester.startHover(location: …)` and states the current workaround — which is the block below.

## The five lines that simulate a hover

```dart
final gesture = await tester.createGesture(kind: PointerDeviceKind.mouse);
await gesture.addPointer(location: Offset.zero);
addTearDown(gesture.removePointer);
await gesture.moveTo(tester.getCenter(find.byType(MyButton)));
await tester.pump();
```

None of the five is decoration:

| Line | Why it cannot be dropped |
|---|---|
| `createGesture`, not `startGesture` | *"You can use startGesture instead if your gesture begins with a down event"* `[OFFICIAL]`. `startGesture` sends `down()` at once (or `panZoomStart` for a trackpad), and a pointer that is down can no longer hover |
| `kind: PointerDeviceKind.mouse` | Both factories default to `PointerDeviceKind.touch` `[OFFICIAL]`, and a finger has no hover to simulate |
| `addPointer` | Sends the `PointerAddedEvent` that brings the device into existence before it moves |
| `addTearDown(gesture.removePointer)` | Every gesture must be removed or *"other tests will panic"*; a bare `removePointer` at the end of the body is skipped when the body throws, so the failure lands in an unrelated test — flutter/flutter **#37524**, 2019-08-07 `[MAINTAINER]` |
| `pump` | Enter and exit are dispatched between frames, not by the move call — see below |

## `moveTo` decides for you, and `hover` asserts

`TestGesture.moveTo` branches on the pointer's state, and says so `[OFFICIAL]`:

> *"Send a move event moving the pointer to the given location. If the pointer is down, then a
> move event is dispatched. If the pointer is up, then a hover event is dispatched."*

`TestPointer.hover` refuses the other case outright, with the fix in the assertion text itself
`[OFFICIAL]`:

> *"Hover events can only be generated when the pointer is up. To simulate movement when the
> pointer is down, use move() instead."*

Read the two together and one common test is wrong without failing: `startGesture` followed by
`moveTo` produces `PointerMoveEvent`s, because `startGesture` already pressed the pointer down.
`TestPointer.hover`'s assert never fires — `moveTo` took the other branch — and the widget's
`onHover` is simply never called. The test goes green on an expectation it never exercised.

## Pumping: the move is not the whole story

`MouseTracker` *"dispatches mouse-related pointer events (pointer enter, hover, and exit)"* at
every update `[OFFICIAL]`, and `MouseRegion.onEnter`'s own timing contract names the two routes
in `[OFFICIAL]`: *"always between frames: either during the post-frame callbacks, or during the
callback of a pointer event"*.

Two routes, two test shapes:

| What moved | How to drive it |
|---|---|
| The **mouse** moved | `gesture.moveTo(…)` then one `pump` — the event route, then the frame that shows its effect |
| The **widget** moved under a stationary mouse | There is no pointer event to send. Only the post-frame route recomputes, so the test pumps after whatever rebuilt the layout, and calls no gesture method at all |

The second row is where a hover test most often reads as flaky. Its behavioural counterpart —
*"this callback is not triggered by the movement of the widget"*, so hover state held in
`onHover` goes stale — is stated in `flutter-ui-interaction`'s `pointer-and-desktop.md`; here it
means an assertion placed straight after the rebuild, with no pump, sees the previous state.

Exit has the same shape and one extra hazard: `onExit` *"might not be matched by a
`MouseRegion.onEnter`"* and runs during the post-frame phase **after** unmounting `[OFFICIAL]`.
A test that removes the widget and asserts on the same line asserts too early.

## The wheel

`TestPointer.scroll` is explicit about which scroll it is `[OFFICIAL]`: *"Create a
PointerScrollEvent (e.g., scroll wheel scroll; not finger-drag scroll) with the given delta."*
Its implementation carries two asserts, and both shape the calling code:

| Assert | Consequence |
|---|---|
| *"Touch pointers can't generate pointer signal events"* | The `TestPointer` must be built with a non-touch `kind` |
| `location != null` | The pointer needs a position first, and only a prior event sets one |

Which is why the canonical block calls `hover` **for its side effect** and throws the event away:

```dart
final pointer = TestPointer(1, PointerDeviceKind.mouse);
pointer.hover(tester.getCenter(find.byType(ListView)));   // sets location; dispatches nothing
await tester.sendEventToBinding(pointer.scroll(const Offset(0, 20)));
await tester.pump();
```

`sendEventToBinding` is the whole dispatch mechanism here — *"Forwards the given pointer event to
the binding"* `[OFFICIAL]`, one line wrapping `binding.handlePointerEvent`. There is no
`TestGesture` equivalent for a signal, because a signal is not a gesture. Asking for one is
flutter/flutter **#68609**, opened 2020-10-20, closed `[MAINTAINER]` `[VERIFY per version]`; no
wheel helper exists on `WidgetController` today.

**`scrollUntilVisible` is not the wheel.** It reads as the obvious wheel test and it is a drag:
its documented job is to repeatedly scroll *"a `Scrollable` by delta in the
`Scrollable.axisDirection` direction until a widget matching finder is visible"*, and it
delegates to `dragUntilVisible` `[OFFICIAL]`. That matters beyond vocabulary, because
`ScrollBehavior.dragDevices` excludes `PointerDeviceKind.mouse` by default — so the drag path a
`scrollUntilVisible` test exercises is one a real mouse user never takes, and a wheel regression
cannot be caught by it. The `dragDevices` default and the official reason for it are in
`pointer-and-desktop.md`.

## The secondary button

`WidgetController.tap` takes the button mask directly `[OFFICIAL]`:

```dart
Future<void> tap(FinderBase<Element> finder, {
  int? pointer, int buttons = kPrimaryButton,
  bool warnIfMissed = true, PointerDeviceKind kind = PointerDeviceKind.touch,
})
```

so a right-click is `await tester.tap(finder, buttons: kSecondaryButton)`. The constant is
`0x02`, and it is deliberately not mouse-specific — *"the bit of `PointerEvent.buttons` that
corresponds to a cross-device behavior of 'secondary operation'"* `[OFFICIAL]`. `buttons` and
`kind` are independent axes: a secondary tap does not require `kind: PointerDeviceKind.mouse`,
though naming it keeps the test's intent legible and becomes mandatory the moment the same
pointer also has to scroll.

`tap` collapses down and up into one call. A menu that must be observed *between* the two — the
usual case, since `onSecondaryTapDown` is what carries the position — needs the gesture held
open:

```dart
final gesture = await tester.createGesture(
  kind: PointerDeviceKind.mouse, buttons: kSecondaryButton,
);
await gesture.down(tester.getCenter(find.byType(MyCanvas)));
await tester.pump();
expect(find.byType(MyContextMenu), findsOneWidget);
await gesture.up();
```

On web, the same test passing tells you nothing about the app until
`BrowserContextMenu.disableContextMenu()` has been called — that prerequisite is app-wide
behaviour and lives in `pointer-and-desktop.md`.

## Name the silence

> **[OFFICIAL, Medium] — not a prescription.**
> No official page demonstrates a hover, a wheel or a right-click under `WidgetTester`. The
> cookbook *Tap, drag, and enter text* covers `tap`, `drag` and `enterText`; every block above is
> reconstructed from dartdocs, published implementations and the framework's own test suite.
> #102754 is the maintainers' own acknowledgement that the hover case is unhelpful boilerplate,
> and it has sat at P3 since 2022.
> *What would lift this:* a cookbook recipe, or the `startHover` helper #102754 asks for.

> **[OFFICIAL, Low] — not a prescription.**
> Nothing states whether `addPointer` is *required* before a hover or merely conventional.
> `TestGesture.moveTo` sets the location by itself, so the argument for `addPointer` is the
> device lifecycle rather than any documented rule — but no dartdoc says the device must exist
> first, and the removal rule (#37524) is stated for the removal only.
> *What would lift this:* `createGesture` documenting the add/remove lifecycle it opens.
