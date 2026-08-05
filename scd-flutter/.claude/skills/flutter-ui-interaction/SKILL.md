---
name: flutter-ui-interaction
description: |
  Flutter interaction and presentation — the API surface and the final look of a rendered widget:
  animating, responding to a gesture, a key or a pointer, theming, annotating a UI for accessibility.
  Use when building or reviewing an animation, a theme, a form or text field, a Semantics
  annotation or a translation; when a gesture is swallowed by a parent, a shortcut never fires,
  hover, a mouse cursor or a right-click does nothing or focus lands on the wrong widget; when a
  layout breaks at a large text scale or in RTL; or when a Hero transition or drag target does
  nothing.
---

# Flutter interaction and presentation

Reference: **Flutter 3.44.0** (docs updated 2026-05-05) · Dart SDK **3.12.x**.

Scope in one sentence: **everything that touches user interaction and the final presentation of
a widget that is already rendered.** Not what the framework does to render it, not where the code
lives.

**Material 3 is the default.** `ThemeData.useMaterial3` has been `true` by default since
Flutter 3.16 `[OFFICIAL, High]`. Any advice presenting Material 2 as the default — including
advice an agent would produce from memory — is invalidated.

## Animations: which family, and the ticker rule

**The ticker rule is an assertion, so getting it wrong crashes the app in debug.**
`SingleTickerProviderStateMixin` *"only supports vending a single ticker. If you might have
multiple AnimationController objects over the lifetime of the State, use a full
TickerProviderStateMixin instead."* `[OFFICIAL, High]` Creating a second ticker throws a
`FlutterError` reading *"$runtimeType is a SingleTickerProviderStateMixin but multiple tickers
were created"* and *"A SingleTickerProviderStateMixin can only be used as a TickerProvider
once"* (`createTicker`, `ticker_provider.dart`; seen in flutter/flutter #42054 and #179337).

Read "over the lifetime of the `State`", not "at once" — a second controller added later trips it
just the same. **One `AnimationController` in the `State` → `SingleTickerProviderStateMixin`;
anything else → `TickerProviderStateMixin`.** Both still require `dispose` on every controller,
which is `flutter-runtime`'s checklist.

**Choosing the family.** The official split is by *who drives the animation* `[OFFICIAL]`:

| Family | Definition | Reach for it when |
|---|---|---|
| **Implicit** — `AnimatedFoo`, `TweenAnimationBuilder` | *"the easiest animation to implement"*, the framework controls it | A property moves from one value to another and you only care about the destination |
| **Explicit** — `AnimationController` + `Tween` + `CurvedAnimation` | *"where you control the animation, rather than letting the framework control it"* | You need to repeat, reverse, stagger, pause, or drive several properties from one clock |

> **[OFFICIAL, Medium] — the fine criterion is not citable.**
> Beyond that split, the official decision tree on docs.flutter.dev/ui/animations is published
> **only as a PNG image**, detail delegated to a video and a blog post; the two definitions above
> are the whole of the normative prose.
> *What would lift this:* a textual transcription of that decision tree.

## The gesture arena

When several recognisers compete for one pointer, the winner is decided by an **arena**, and the
rule is counter-intuitive in exactly the way that produces dead zones.

**The child wins.** For a parent and a child both defining `onTap`: *"The child GestureDetector
wins in this scenario because it was the first to enter the arena, resolving as first come, first
served"* `[OFFICIAL, High]`.

**`HitTestBehavior` does not arbitrate.** *"Setting GestureDetector.behavior to
HitTestBehavior.opaque or HitTestBehavior.translucent has no impact on parent-child
relationships: both GestureDetectors send a GestureRecognizer into the gesture arena, only one
wins."* `[OFFICIAL, High]` `HitTestBehavior` decides whether a widget is *hit at all* — notably
whether an area with no visible child receives the pointer — never who wins once two recognisers
are both in the arena. Reaching for `opaque` to fix a parent/child conflict is the standard
wrong move.

Resolution: *"If there's only one recognizer left in the arena, that recognizer wins […] a
recognizer can declare itself the winner, causing all of the remaining recognizers to lose."* `[OFFICIAL]`

| Widget | Use it for |
|---|---|
| `GestureDetector` | Semantic gestures — tap, drag, scale. The default |
| `Listener` | Raw pointer events, outside the arena entirely |
| `RawGestureDetector` | A custom recogniser, or custom arena participation |

Diagnosing a swallowed gesture or a dead zone: enable `debugPrintGestureArenaDiagnostics`
`[TOOLED]` and read which recogniser entered and who resolved.

## Focus, keyboard and shortcuts

Critical on desktop and web, where an app that cannot be driven from the keyboard is unusable;
still relevant on mobile for external keyboards and accessibility.

Wiring a shortcut is **three layers, deliberately separated** `[OFFICIAL, High]`: a
`Shortcuts` widget maps a key combination to an `Intent`, and an `Actions` widget maps that
`Intent` to an `Action`. The official rationale for not collapsing them:

> *"it is useful to have a separation of concerns between where the key mapping definitions are
> (often at a high level), and where the action definitions are (often at a low level) […] to
> have a single key combination map to an intended operation […] and have it adapt automatically
> to whichever action fulfills that intended operation for the focused context"*

So one `Ctrl+C` binding resolves to whatever "copy" means for whatever currently holds focus.
`CallbackShortcuts` skips the `Intent` layer for a local, one-off binding — appropriate when
nothing else will ever need to fulfil that operation.

`FocusableActionDetector` bundles `Actions`, `Shortcuts`, `MouseRegion` and `Focus` into one
widget `[OFFICIAL]` — the usual starting point for a custom interactive control.

Traversal order and participation: [`references/focus-and-shortcuts.md`](references/focus-and-shortcuts.md).

## Pointer input: hover, cursor, wheel, right-click

A finger has no hover, no cursor and no second button, and the official framing puts the work
exactly where custom code is: *"Some of these features work by default on Material widgets, but
if you've created a custom widget, you might need to implement them directly."* `[OFFICIAL, High]`

**The wheel is not a gesture, and the arena above does not arbitrate it.** A scroll arrives as a
`PointerSignalEvent`: *"pointer signals always resolve at the end of event dispatch"*, and goes to
*"the widget that's deepest in the widget hierarchy"* `[OFFICIAL]`. Nested scrollables under a
wheel need no tuning; the same two under a drag do.

Hover and its two traps (`onHover` does not fire when the *widget* moves; `onExit` can arrive
after the widget is unmounted), cursors and `MouseCursor.defer` vs `uncontrolled`, why a mouse
drag does not scroll a list, right-click menus and the browser menu that hides them on web, and
the focus highlight that follows the last input device:
[`references/pointer-and-desktop.md`](references/pointer-and-desktop.md).

## Text input, formatters and forms

**A `TextInputFormatter` must not touch text under composition.** The prescription is exact
`[OFFICIAL, High]`:

> *"Text modification should only be applied when text is being committed by the IME and not on
> text under composition (i.e., only when TextEditingValue.composing is collapsed)"*

The composing region is the in-progress text an IME shows before the user commits it — the
pinyin a CJK user is typing, the syllables mid-assembly. A formatter that rewrites it restarts
the input method, and the user watches their input disappear as they type. The runtime symptom
is *"Composing region changed by the framework. Restarting the input method."*

```dart
TextEditingValue formatEditUpdate(TextEditingValue old, TextEditingValue next) {
  if (!next.composing.isCollapsed) return next;   // mid-composition: hands off
  return /* your transformation */;
}
```

**Count characters, not code units.** *"always use characters when dealing with user input text
that may contain complex characters […] use string.characters.length"* `[OFFICIAL, High]`.
`String.length` counts UTF-16 code units, so an emoji or a combining sequence counts as two or
more — a length-limiting formatter written on `.length` truncates mid-grapheme and corrupts the
text.

**Forms.** `TextFormField` is `TextField` plus `FormField` integration — validation and saving
through an enclosing `Form`. Use `TextField` when there is no form. `autovalidateMode` takes
three values `[OFFICIAL]`:

| Value | Validates |
|---|---|
| `disabled` | Only when you call `validate()` — the default |
| `onUserInteraction` | After the field has been touched once, then on every change |
| `always` | On every build, including before the user has typed |

`always` shows errors on a pristine form, which is why `onUserInteraction` is the usual choice
for live feedback. The old boolean `autovalidate` is deprecated — code using it predates the
three-mode API.

`GlobalKey<FormState>` is the legitimate `GlobalKey` case for driving `validate()`, `save()` and
`reset()` from outside the subtree; the key mechanism itself is `flutter-runtime`'s.

Rich text, selection and the context menu (`contextMenuBuilder`,
`AdaptiveTextSelectionToolbar`): [`references/text-and-forms.md`](references/text-and-forms.md).

## Theme and design system

Material 3 being the default (above) changes what a correct answer looks like. The M3 route is
a **seed colour**, not a hand-built palette:

```dart
ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: Colors.indigo))
```

`ColorScheme.fromSeed` derives a tonally consistent scheme, and dark mode is the same call with
`brightness: Brightness.dark` — supplied to `MaterialApp.darkTheme`, with the system preference
read from `platformBrightness`. Hard-coding colours per widget discards the scheme and is what
makes an app impossible to re-theme later.

For tokens Material does not define — brand spacing, a custom surface, semantic colours —
`ThemeExtension` is the prescribed vehicle, and it requires **both** `copyWith` and `lerp`
`[OFFICIAL]`. `lerp` is not boilerplate: without it a theme change snaps instead of animating,
while every Material token around it transitions. Typography goes through `TextTheme` and its
named roles rather than per-widget `TextStyle`, for the same reason: a role survives a redesign,
a literal does not.

## Accessibility

The semantics tree is what a screen reader consumes, and it is built from widgets — so most of
this is annotation rather than new UI.

| Widget | Use |
|---|---|
| `Semantics` | Attach a label, value, hint or flag to a subtree |
| `MergeSemantics` | Present a composite as **one** node — an icon plus its caption read as a single control |
| `ExcludeSemantics` | Remove purely decorative content from the tree |

**`textScaleFactor` is deprecated — use `TextScaler`** `[OFFICIAL, High]`. *"Use of textScaleFactor
was deprecated in preparation for the upcoming nonlinear text scaling support. This feature was
deprecated after v3.12.0-2.0.pre."* The reason is behavioural, not cosmetic: Android 14 scales
**non-linearly** — *"larger text gets scaled at a lesser rate"* — so a layout computed by
multiplying by a single factor is wrong at large sizes. Scale through `TextScaler.scale`; any
advice built on `textScaleFactor` is invalidated. A layout must therefore survive a large text
scale, and fixed-height containers around text are where this breaks first.

Tap targets have per-platform minimums, and they are **checkable in a test** — the values and the
harness that asserts them live in `flutter-testing`, together, so they cannot drift apart. What
this skill owns is making a target reach its minimum: padding and hit area around a small icon,
not the number it has to clear.

## Internationalisation

Configuration is `l10n.yaml` plus ARB files, and code generation runs through `gen-l10n`
`[OFFICIAL]`. `intl` handles plurals, genders, and date and number formats — a translated string
assembled by concatenation breaks in any language whose word order differs.

**Localised messages are generated into source, not a synthetic package** `[OFFICIAL, High]` —
landed in 3.28.0-0.0.pre, stable in **3.32.0**, and `package:flutter_gen` support is removed.
Any tutorial referencing `.dart_tool/flutter_gen/` or the `synthetic-package` option is
describing a setup that no longer exists.

**RTL is a directional-widget discipline, not a translation task.** `EdgeInsets.only(left:)` does
not mirror; `EdgeInsetsDirectional.only(start:)` does. Use the directional variant systematically
— `EdgeInsetsDirectional`, `AlignmentDirectional`, `BorderDirectional`, `PositionedDirectional`,
`BorderRadiusDirectional` — since padding *"depends on the Directionality to resolve
EdgeInsetsDirectional objects into absolute EdgeInsets objects"* `[OFFICIAL]`. Code written with
absolute sides looks correct until the first RTL locale, then fails everywhere at once.

## Hero transitions and drag & drop

**`Hero` pairs by tag.** *"Define one Hero for the source route and another for the destination
route, and assign each the same tag. Flutter animates pairs of heroes with matching tags."*
`[OFFICIAL, High]` A tag present on only one side animates nothing; a tag duplicated within one
route throws. Deriving the tag from the item's id is what makes a list-to-detail transition work
without hand-maintaining a tag table.

> **[PRACTITIONER, Low] — not a prescription.**
> `Hero` animations are reported not to run between pages nested inside a `go_router`
> `ShellRoute` (flutter/flutter #112095). The routing skill treats `go_router` as recommended;
> this specific interaction is an open issue, not documented behaviour.
> *What would lift this:* that issue closing, or a note in the `go_router` documentation.

**Drag & drop is type-matched.** *"the type of item dropped on DragTarget must match the type of
the item dragged from LongPressDraggable"* `[OFFICIAL, High]` — `Draggable<T>` and `DragTarget<T>`
must agree on `T`, and a mismatch produces a target that simply never accepts, with no error.
Using a domain type rather than `Object` or `Map` is what makes the mismatch a compile error
instead of a silent dead zone. `LongPressDraggable` is the right default inside a scrollable — a
plain `Draggable` competes with the scroll gesture in the arena and the scrollable usually wins,
so the drag never starts — but that default is a touch idiom: a mouse user expects to drag
directly, with no handle and no long press `[OFFICIAL]`.

## Seams

When a question sits near a seam, decide which side it falls on before answering.

| Neighbouring subject | Owner | Why the seam sits there |
|---|---|---|
| The *cost* of what is animated: rebuild granularity, `AnimatedBuilder`'s `child`, `const`, `RepaintBoundary`, `Opacity`/`saveLayer`, image decode sizing | `flutter-runtime` | The cost of rendering is one subject and lives once |
| `Key` and `Element` reconciliation | `flutter-runtime` | Three intersections surface here — `AnimatedSwitcher` needing a distinct `Key` to transition between two widgets of the same type, `GlobalKey<FormState>`, state preservation across a locale or theme change — and each is a **cross-reference**, never a second treatment of the mechanism |
| *Running* the accessibility checks: `ensureSemantics`, `handle.dispose`, `meetsGuideline` and the four guideline values; golden tests | `flutter-testing` | An agent writing a test reaches for the test skill, and splitting the numeric guideline values across two skills would guarantee they diverge. **What** to annotate stays here |
| *Simulating* an interaction in a test: `tester.drag` / `fling` / `dragUntilVisible`, `startGesture`, `sendKeyEvent`, driving a hover, a wheel or a right-click with `createGesture(kind: PointerDeviceKind.mouse)` and `TestPointer.scroll`, and stepping an animation with `pump(Duration)` | `flutter-testing` | **The behaviour is here; the instrument that exercises it is there.** The arena's arbitration rules, hover and cursor semantics, focus traversal and the animation families are this skill's subject; reproducing them under `WidgetTester` is test authoring |
| The state mechanism, `go_router` itself, the adapt-vs-duplicate decision, `.adaptive` constructors, responsive vs adaptive | `flutter-architecture` | Branching on the platform is a targeting decision, and that skill already owns capability-not-platform doctrine. Only the `Hero` × route-transition articulation is here |
| *Whether* to honour a pointer at all, and how far to adapt before duplicating a screen | `flutter-architecture` | **Deciding that desktop and web deserve a different interaction is a targeting decision; how a pointer is then detected, cursored, hovered, wheeled and right-clicked is this skill's API surface.** That skill names the omission — a touch-first UI forgets hover and right-click — and this one closes it |
| The `dispose` checklist for `AnimationController`, `TextEditingController`, `ScrollController` | `flutter-runtime` | Memory and object lifetime live once |
| *Invoking* `gen-l10n` in a build pipeline | `flutter-build-release` | Configuration — `l10n.yaml`, ARB layout, generated-into-source — is here; pipeline invocation is a build concern |

## Name the silence

Say what has no prescription, and what would lift it — an unlabelled claim gets obeyed as one.

Standing silences here: the fine implicit-vs-explicit animation criterion beyond the official
text, whose decision tree is published only as an image; platform IME bugs and the composing
region on web, which live in issues #78827, #65357 and #107969 while the `TextInputFormatter`
prescription itself is solid and is written normally; the `Hero` × `ShellRoute` articulation,
issue #112095; the coordinate space of `MenuController.open`'s `position`, and the absence of any
recommended way to ask whether a mouse is connected — both boxed in `pointer-and-desktop.md`.

Scroll-driven animation has **no dedicated official API** in Flutter 3.44 — no `ScrollTimeline`
equivalent. The official approach composes generic primitives: `ScrollController`/`ScrollPosition`
as a `Listenable` with `AnimatedBuilder`, or `Flow`. Turnkey widgets are third-party.

## References

- [`references/text-and-forms.md`](references/text-and-forms.md) — choosing between `Text.rich`,
  `RichText`, `SelectableText` and `SelectionArea` and why `RichText` loses `DefaultTextStyle`,
  customising the selection toolbar with `contextMenuBuilder` and `AdaptiveTextSelectionToolbar`
  without dropping the standard entries, the three `FormState` methods, and the undocumented
  per-platform composing-region behaviour.
- [`references/pointer-and-desktop.md`](references/pointer-and-desktop.md) — hover with
  `MouseRegion` and its traps, cursor resolution with `defer` and `uncontrolled`, the wheel as a
  pointer signal and why a mouse drag does not scroll, right-click menus and `BrowserContextMenu`
  on web, the focus highlight following the last input device, and `VisualDensity`.
- [`references/focus-and-shortcuts.md`](references/focus-and-shortcuts.md) — the focus tree and
  `FocusNode` lifetime, the three participation flags (`canRequestFocus`, `skipTraversal`,
  `descendantsAreFocusable`) and what each one actually removes, the four traversal policies and
  how groups nest, a worked `Shortcuts`/`Actions`/`Intent` wiring with the three consequences of
  focus-chain lookup, `ShortcutActivator` variants, and `LogicalKeyboardKey` vs
  `PhysicalKeyboardKey`.
