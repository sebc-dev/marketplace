# Pointer, hover and the non-touch idioms

Everything a mouse or a trackpad adds over a finger: hover, cursors, the scroll wheel, the
secondary button, and the focus highlight that follows the input device. Read this when the
target is desktop or web, or when a control behaves correctly under a finger and does nothing
useful under a pointer.

Sources reflect **Flutter 3.44**: `docs.flutter.dev/ui/adaptive-responsive/input` and
`/idioms`, plus the `MouseRegion`, `MouseCursor`, `Listener`, `PointerSignalResolver`,
`ScrollBehavior`, `ContextMenuController`, `BrowserContextMenu` and `FocusManager` dartdocs
`[OFFICIAL]`.

## The discriminant: built-in or custom

The official framing is a single sentence, and it decides how much of this page applies
`[OFFICIAL, High]`:

> *"The mouse and keyboard introduce input types beyond those found on a touch device, like
> scroll wheel, right-click, hover interactions, tab traversal, and keyboard shortcuts. Some of
> these features work by default on Material widgets, but if you've created a custom widget, you
> might need to implement them directly."*

So a `Scrollable`, an `ElevatedButton` or a `TextField` already answer the wheel, the hover
highlight and tab traversal. A `GestureDetector` wrapped around a `Container` answers none of
them — and that is the shape most hand-built controls have. `FocusableActionDetector` bundles
`Actions`, `Shortcuts`, `MouseRegion` and `Focus` in one widget `[OFFICIAL]` precisely so a
custom control does not have to assemble the four by hand.

## Hover

`MouseRegion` carries `onEnter`, `onExit`, `onHover` and `cursor`. `opaque` *"defaults to
true"* and decides *"whether this widget should prevent other MouseRegions visually behind it
from detecting the pointer"* `[OFFICIAL]` — set it to `false` for a decorative overlay that must
not blind the region underneath.

Three behaviours are counter-intuitive and each produces a distinct bug.

**`onHover` does not fire when the widget moves.** *"This callback is not triggered by the
movement of the widget"* `[OFFICIAL, High]`. A row that slides under a stationary mouse — a
reorder, an expanding panel, a list that scrolls by wheel — fires nothing, so hover state
computed in `onHover` goes stale. `onEnter` and `onExit` *are* recomputed: their timing is
*"always between frames: either during the post-frame callbacks, or during the callback of a
pointer event"* `[OFFICIAL]`. Hold hover state on enter/exit, not on hover.

**`onExit` can arrive without a matching `onEnter`, and after the widget is gone.**
*"a `MouseRegion.onExit` might not be matched by a `MouseRegion.onEnter`"* `[OFFICIAL, High]`,
and the callback runs during the post-frame phase *after* unmounting — so a bare
`setState` in an exit handler throws. The documented ways out, in order of preference:

| Fix | When it fits |
|---|---|
| Keep the hover state inside a `MouseRegion` that is rendered unconditionally | The usual case — hoist the region above whatever disappears |
| Fire the exit logic from the event that hides the widget | The disappearance has one identifiable cause |
| Override `State.dispose`, or drop to `RenderMouseRegion` | Neither of the above is possible |

**`Listener` is not the mouse widget.** *"It does not listen to events that are exclusive to
mouse, such as when the mouse enters, exits or hovers a region without pressing any buttons"*
`[OFFICIAL]` — enter and exit belong to `MouseRegion`. Hovering is the exception:
`Listener.onPointerHover` exists and is *"only fired for pointers which report their location
when not down (e.g. mouse pointers, but not most touch pointers)"* `[OFFICIAL]`, and
`MouseRegion.onHover`'s own dartdoc points at it, *"as hover events are similar to other regular
events"*.

**Styling the hover.** A Material component already tracks `WidgetState.hovered` — *"the state
when the user drags their mouse cursor over the given widget"* `[OFFICIAL]` — so hover colours
go through `WidgetStateProperty.resolve` rather than a hand-held boolean. `Tooltip` is the other
free win: long press on touch, hover on a pointer, with `waitDuration` gating the delay. The
platform idiom the official page states is *"hovering for 200-400ms"* `[OFFICIAL]`.

## Cursors

Set `cursor:` on a `MouseRegion`, or the `mouseCursor:` parameter most interactive widgets
expose. Resolution is by depth, not by ownership: `MouseTracker` finds *"the front-most region
associated with the position of each mouse cursor"* `[OFFICIAL]`, falling back to the basic
arrow when no region claims one.

Two constants exist for two opposite intents, and they are routinely swapped:

| Constant | Meaning `[OFFICIAL]` |
|---|---|
| `MouseCursor.defer` | *"the region with this cursor defers the choice of cursor to the next region behind it"* |
| `MouseCursor.uncontrolled` | *"doesn't change cursor by itself, but make a region that blocks other regions behind it from changing the cursor"* |

`defer` = I have no opinion, ask below. `uncontrolled` = nobody below gets an opinion either;
it is for a platform view or a native layer that owns the cursor itself.

**A cursor is a request, not a guarantee.** Of the `SystemMouseCursors` constants, *"some of
these objects might map to the same result, or fallback to the basic arrow. This mapping is
defined by the Flutter engine."* `[OFFICIAL]` So `resizeUpLeftDownRight` and `zoomIn` may render
identically on one platform and distinctly on another; never encode meaning in the cursor alone.
`basic` is *"the platform-dependent basic cursor. Typically the shape of an arrow."*

**Disabled controls.** `WidgetStateMouseCursor.clickable` is *"a mouse cursor for clickable
widgets, which resolves differently when the widget is disabled"* — it falls back to
`SystemMouseCursors.basic` under `WidgetState.disabled` `[OFFICIAL]`. A hand-rolled control that
hard-codes `SystemMouseCursors.click` keeps promising a click it will not honour; that is the
whole bug, and the fix is one constant.

## The wheel is a signal, not a gesture

`PointerScrollEvent` — *"The pointer issued a scroll event. Scrolling the scroll wheel on a
mouse is an example of an event that would create a PointerScrollEvent"* `[OFFICIAL]`, carrying
`scrollDelta`, *"the amount to scroll, in logical pixels."*

**It does not go through the arena, and the winner is chosen differently.** The contrast is
stated in the framework's own words `[OFFICIAL, High]`:

> *"Pointer signals (such as PointerScrollEvent) are immediate, so unlike events that
> participate in the gesture arena, pointer signals always resolve at the end of event
> dispatch."*

and the resolution rule is *"these events will only be dispatched to the first registered
handler, which will in turn correspond to the widget that's deepest in the widget hierarchy."*

Put beside the arena rule in the skill body — the *child* wins because it entered first — this
gives two different arbitrations over the same nesting. Two nested scrollables under a wheel:
the innermost handles it, there is no competition to tune and no `HitTestBehavior` to reach for.

Reading the wheel in a custom widget is `Listener.onPointerSignal` plus a type test `[OFFICIAL]`:

```dart
Listener(
  onPointerSignal: (event) {
    if (event is PointerScrollEvent) print(event.scrollDelta.dy);
  },
  child: ListView(),
)
```

A handler that must coexist with others registers instead of acting `[OFFICIAL]`:

```dart
GestureBinding.instance.pointerSignalResolver.register(event, (PointerSignalEvent event) {
  // handle it — runs only if this handler is the deepest registered one
});
```

**Dragging with the mouse does not scroll, and that is a decision, not a gap.**
`ScrollBehavior.dragDevices` defaults to *"PointerDeviceKind.touch, PointerDeviceKind.stylus,
PointerDeviceKind.invertedStylus, and PointerDeviceKind.trackpad"* — mouse is absent, with the
reason stated `[OFFICIAL, High]`: *"Enabling this for PointerDeviceKind.mouse will make it
difficult or impossible to select text in scrollable containers and is not recommended."* So the
web bug report *"I can't drag the list with my mouse"* has an official answer, and adding
`PointerDeviceKind.mouse` to a custom `ScrollBehavior` trades text selection for it. Desktop
users get the scrollbar instead: `MaterialScrollBehavior` states that *"when using the desktop
platform, if the Scrollable widget scrolls in the Axis.vertical, a Scrollbar is applied"*
`[OFFICIAL]`.

Trackpad is a device kind of its own — *"a touch-based pointer device with an indirect surface"*
`[OFFICIAL]` — and it *is* in `dragDevices`, so a trackpad pan scrolls where a mouse drag does
not.

## The secondary button

`GestureDetector` exposes the secondary button as its own callback family — `onSecondaryTap`,
`onSecondaryTapDown`, `onSecondaryTapUp`, `onSecondaryTapCancel` — with a tertiary family beside
it `[OFFICIAL]`. `onSecondaryTapDown` is the one to use for a menu: it carries the position, and
the platform idiom is that a context menu is *"triggered by a right-click, positioned close to
the mouse, and dismissed by clicking anywhere, selecting an option from the menu, or clicking
outside it"* `[OFFICIAL]`.

Two routes to the menu itself:

| Route | What it is |
|---|---|
| `ContextMenuController` | *"Builds and manages a context menu at a given location"* `[OFFICIAL]`. Its own dartdoc sample wires a `GestureDetector` *"to show a context menu anywhere in a widget subtree that receives a right click or long press"* — the general-purpose answer |
| `MenuAnchor` + `MenuController.open({Offset? position})` | The Material menu stack, when the menu should look and behave like the app's other menus |

`ContextMenuController` enforces a global invariant worth knowing: *"There can only ever be one
context menu shown at a given time in the entire app. Calling show on one instance of this class
will hide any other shown instances."* `[OFFICIAL]` No bookkeeping needed to close the previous
one — and no way to show two.

**On web, none of this appears until you disable the browser's own menu.** `BrowserContextMenu`
states it plainly `[OFFICIAL, High]`: *"On web, by default, the browser's context menu is enabled
and Flutter's context menus are hidden. On all non-web platforms, this does nothing."* So
`BrowserContextMenu.disableContextMenu()` is the prerequisite, it is app-wide, and it is the
reason a right-click menu that works on desktop shows the browser menu on web with no error
anywhere.

Text fields are already served: `contextMenuBuilder` and `AdaptiveTextSelectionToolbar` are in
[`text-and-forms.md`](text-and-forms.md), together with `SelectionArea` for making a subtree
selectable at all — which desktop and web users expect of *"most visible text"* `[OFFICIAL]`.

## The focus highlight follows the last input device

`FocusManager.highlightMode` is *"the current interaction mode for focus highlights"*, and
`FocusHighlightStrategy.automatic` — the default — *"switches between the various highlight
modes based on the last kind of input that was received"* `[OFFICIAL]`. The two modes carry
their instruction `[OFFICIAL]`:

| Mode | Contract |
|---|---|
| `touch` | *"widgets should not draw their focus highlight unless they perform text entry"* |
| `traditional` | *"widgets should draw their focus highlight whenever they are focused"* |

The consequence explains a recurring false bug report: the same button shows a focus ring on
desktop and none after a tap on mobile. That is neither a theme difference nor a platform
branch — it is one widget reading a mode that flipped with the last input event. A custom
control that draws its own highlight should read `highlightMode` rather than assume; forcing
either behaviour is `alwaysTraditional` / `alwaysTouch`.

## Hit areas: `VisualDensity`

A pointer is precise, a finger is not, and the official adaptation is a theme value rather than a
per-widget branch `[OFFICIAL]`:

```dart
final densityAmt = touchMode ? 0.0 : -1.0;
MaterialApp(
  theme: ThemeData(visualDensity: VisualDensity(horizontal: densityAmt, vertical: densityAmt)),
  home: MainAppScaffold(),
)
```

One density unit is roughly four logical pixels, and Material components animate the change.
Read it back with `Theme.of(context).visualDensity`. The **minimum** tap-target sizes this must
never fall below, and the test that asserts them, belong to `flutter-testing`.

## Name the silence

> **[OFFICIAL, Low] — not a prescription.**
> `MenuController.open` takes `{Offset? position}`, and neither its own dartdoc nor
> `RawMenuAnchor`'s says which coordinate space that offset is in — `RawMenuAnchor` only states
> that the value *"will be passed to the info argument of the overlayBuilder function"*. Passing
> a `TapDownDetails.globalPosition` straight through is therefore a guess, not a documented
> contract; verify it on the target platform before relying on it.
> *What would lift this:* the `position` parameter naming its coordinate space.

> **[OFFICIAL, Medium] — not a prescription.**
> There is no officially recommended way to ask *"is a mouse connected?"*.
> `FocusManager.highlightMode` is the only signal the documentation describes, and it reports the
> **last input device used**, not what is attached — a touchscreen laptop flips it back and
> forth all session. `MouseTracker.mouseIsConnected` is public and notifies on change, but no
> official page recommends branching on it, and branching on a device rather than a capability
> is what `flutter-architecture` argues against in the first place.
> *What would lift this:* a recommendation on the adaptive-design pages.

The web platform pages carry no prose on mouse input at all: the adaptive input page is written
platform-neutral, and web specifics surface only where an API says so itself — as
`BrowserContextMenu` does. Absence of a documented web difference is not evidence of none.
