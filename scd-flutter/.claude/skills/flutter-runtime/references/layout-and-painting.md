# Layout intrinsics and custom painting

The parts of the layout and paint contract an implementer needs, below the decision ladder in
the skill body.

Sources reflect **Flutter 3.44**: the `IntrinsicWidth`/`IntrinsicHeight`, `RenderBox`,
`RenderObject`, `CustomPaint` and `CustomPainter` dartdocs, plus *Understanding constraints* and
*Common Flutter errors* `[OFFICIAL]`.

## Intrinsic passes and the LayoutBuilder invariant

**Intrinsic passes are quadratic in the worst case.** `IntrinsicWidth`/`IntrinsicHeight`
*"is relatively expensive, because it adds a speculative layout pass before the final layout
phase. Avoid using it where possible. In the worst case, this widget can result in a layout
that is O(N²) in the depth of the tree."* `[OFFICIAL, High]`

```dart
// Wrong: an intrinsic pass per item, inside a scrollable
ListView(children: [ for (final r in rows)
  IntrinsicHeight(child: Row(children: r.cells)) ])
```

**`LayoutBuilder` cannot resolve intrinsic dimensions.** *"LayoutBuilder does not support
returning intrinsic dimensions"* is a framework invariant, and it propagates: any widget
containing a `LayoutBuilder` — `Ink`, or `AutoSizeText` — breaks intrinsic measurement for its
ancestors (flutter/flutter #44472). Putting one inside a `Table` or an `IntrinsicHeight` throws.

## The descent ladder

The official bias is to stay high: *"Most Flutter developers do not author render objects
directly but instead manipulate the render tree using widgets"*, and *"direct interaction with
the rendering layer is awkward at best and bug-prone at worst"* `[OFFICIAL, High]`.

| Signal | Level |
|---|---|
| Composition of existing widgets expresses it | Compose — the default |
| Custom **painting**, standard layout | `CustomPaint` / `CustomPainter` |
| Layout that must **measure then decide** in one pass — measure child A, derive tight constraints for B — impossible without post-frame hacks `[PRACTITIONER, Medium]` | Custom `RenderBox` |
| A non-Cartesian protocol, i.e. a new `Constraints` subclass | `RenderObject` directly `[OFFICIAL]` |

`CustomPainter` buys **drawing**, not layout: *"Because custom paint calls its painters during
paint, you cannot call setState or markNeedsLayout during the callback (the layout for this
frame has already happened)"* `[OFFICIAL]`. And a painter whose `shouldRepaint` returns a hard
`true` repaints every frame — compare the fields that affect the drawing instead.

## NestedScrollView

Two documented constraints, and the first is the one that gets attempted `[OFFICIAL, Medium]`:

- **You cannot give the inner scrollable a `ScrollController`.** `NestedScrollView` supplies its
  own through `PrimaryScrollController`. Passing one breaks the coordination between the outer
  header and the inner body, which is the whole point of the widget.
- **`SliverAppBar.stretch` is not supported inside it.**

> **[PRACTITIONER, Low] — not a prescription.**
> Friction beyond those two points lives in open issues rather than documentation:
> flutter/flutter #101320 (web with `TabBarView`) and #81619 (`TabBarView`). Status in 3.44
> `[VERIFY per version]`.
> *What would lift this:* those issues closing, or the behaviour being documented.

When the coordination is not actually needed, a plain `CustomScrollView` with slivers is simpler
and has none of these constraints.

## Implementing intrinsics on a RenderBox

Override `computeMinIntrinsicWidth`, `computeMaxIntrinsicWidth`, `computeMinIntrinsicHeight` and
`computeMaxIntrinsicHeight` — **never** the four `get*` forms that call them. The dartdoc is
explicit `[OFFICIAL, High]`:

> *"Calling this function is expensive as it can result in O(N^2) behavior. Do not override this
> method. Instead, implement computeMinIntrinsicHeight."*

The `get*` forms carry the framework's caching. Overriding them replaces that caching with your
own code and turns a memoised traversal back into a quadratic one — which is the same cost the
skill body warns about for `IntrinsicHeight`, arriving from the other direction.

An intrinsic is a **speculative** measurement: "how wide would you like to be, ignoring the
constraints you were given?" It runs as an extra pass before real layout, which is why the cost
compounds with depth.

## The shouldRepaint contract

```dart
class GaugePainter extends CustomPainter {
  GaugePainter({required this.color, required this.progress});
  final Color color;
  final double progress;

  @override
  bool shouldRepaint(GaugePainter old) =>
      old.color != color || old.progress != progress;
}
```

Two halves of the contract, and the second is the one that surprises `[OFFICIAL]`:

> *"If the method returns false, then the paint call might be optimized away."*
> *"It's possible that the paint method will get called even if shouldRepaint returns false
> (e.g. if an ancestor or descendant needed to be repainted)."*

So `shouldRepaint` is an optimisation hint, not a guarantee of suppression. A painter whose
`paint` is genuinely expensive needs a `RepaintBoundary` as well — the dartdoc says so directly:
*"If a custom delegate has a particularly expensive paint function such that repaints should be
avoided as much as possible, a RepaintBoundary or RenderRepaintBoundary … might be helpful."*

Returning a hard `true` is the common failure: it repaints on every frame of every ancestor
rebuild, which is exactly what the boundary was supposed to prevent.

## Animating a painter without rebuilding

Passing a `Listenable` to the painter's `repaint` argument drives repaint directly, *"avoiding
both the build and layout phases of the pipeline"* `[OFFICIAL]`:

```dart
class GaugePainter extends CustomPainter {
  GaugePainter({required this.animation}) : super(repaint: animation);
  final Animation<double> animation;
  // paint() reads animation.value
}
```

Compare with wrapping the `CustomPaint` in an `AnimatedBuilder`: that rebuilds and re-lays-out
the subtree on every tick, then paints. The `repaint` argument skips straight to paint.

This is the painting-side equivalent of the `AnimatedBuilder` `child` rule in
`references/perf-patterns.md` — keep the animated work as close to the pixels as possible.

## Choosing the level, in one more sentence each

- **Compose** until composition stops expressing the shape. The official position is that most
  developers should never leave this level.
- **`CustomPaint`** when the *drawing* is custom but the box model is not. It cannot influence
  layout — `setState` and `markNeedsLayout` are illegal from inside `paint`, because layout for
  the frame has already run.
- **`RenderBox`** when layout must measure a child and derive constraints for another in a
  single pass. Post-frame callbacks that measure and then rebuild are the workaround this
  replaces `[PRACTITIONER, Medium]`.
- **`RenderObject`** only for a non-Cartesian protocol — a new `Constraints` subclass. Sliver
  geometry is the canonical example. *"In most cases, subclassing RenderObject itself is
  overkill, and RenderBox would be a better starting point."* `[OFFICIAL]`
