# Rendering patterns and their cost

Format per entry: statement → symptom/metric → fix → reasoning → lint/flag → confidence.
Source levels: **[OFFICIAL]** docs.flutter.dev/api.flutter.dev · **[TOOLED]** enforced by a
tool · **[PRACTITIONER]** recognised maintainer/GDE · **[WIDESPREAD]** common but unnormed.

Read this only after the overlay has told you **which graph is red** — the fix differs
entirely between a UI-red and a raster-red frame.

## UI thread — build cost

### Build granularity

**Statement.** Avoid repeated expensive work in `build()`; split large widgets along what
actually changes.

**Symptom.** UI bar red; excessive rebuilds visible through *Show widget rebuild
information* or `debugPrintRebuildDirtyWidgets`.

**Fix.** Call `setState()` as low in the subtree as possible — every descendant of that
`State` rebuilds. The traversal stops when it re-encounters the same child widget instance as
the previous frame (compared via `operator ==`).

```dart
// Wrong: setState at the top rebuilds the whole subtree
class _PageState extends State<Page> {
  int _count = 0;
  @override
  Widget build(BuildContext context) => Column(children: [
    ExpensiveHeader(),                 // rebuilt for nothing
    Text('$_count'),
    ElevatedButton(onPressed: () => setState(() => _count++), child: const Text('+')),
  ]);
}
// Right: move the counter state into a dedicated child widget.
```

**Reasoning.** `build()` can be invoked very frequently whenever ancestors rebuild.
**[OFFICIAL]** Confidence: High.

### `const` and widgets over functions

**Statement.** Use `const` constructors wherever possible; prefer a `StatelessWidget` to a
helper function for reusable pieces of UI.

**Fix/tooling.** Enable the `flutter_lints` recommended set to be reminded — rule
`prefer_const_constructors`. `const` lets Flutter short-circuit most of a rebuild.

**Reasoning.** Widgets — especially `const` ones — outperform functions because they enable
subtree short-circuiting and instance caching. A function returning a `Widget` gets neither.
**[OFFICIAL]** Confidence: High.

### `AnimatedBuilder` — static subtree as `child`

**Statement.** Do not build, inside an `AnimatedBuilder`'s `builder`, a subtree that does not
depend on the animation. Build it once and pass it as `child`.

**Symptom.** UI bar red during an animation; the subtree rebuilt on every tick.

**Reasoning.** The builder body runs on every animation tick. The same principle applies to
`TransitionBuilder`/`SlideTransition`, which avoid rebuilding their descendants.
**[OFFICIAL]** Confidence: High.

### Allocation pressure inside `build()`

**Statement.** Do not allocate heavy objects — closures, lists, controllers, full-size images
— inside `build()`.

**Reasoning.** `build()` potentially runs every frame; allocating there creates repeated GC
pressure (memory bloat). **[OFFICIAL/WIDESPREAD]** Confidence: Medium.

### Never override `operator ==` on a `Widget`

**Statement.** Do not override `operator ==` on `Widget` objects.

**Reasoning.** In practice it hurts — O(N²) behaviour, and even a single override degrades
things globally because the compiler can no longer assume a static call. The one narrow
exception is a leaf widget rarely reconfigured where comparing costs far less than
rebuilding — and even there, prefer caching the widget. **[OFFICIAL]** Confidence: High.

### String building

**Statement.** Use `StringBuffer` to build a string in pieces, especially in a loop, rather
than the `+` operator.

**Reasoning.** `+` allocates a new `String` on each concatenation; `StringBuffer` concatenates
once, at `toString()`. **[OFFICIAL]** Confidence: High.

## Raster thread — scene complexity

### Opacity

**Statement.** Use the `Opacity` widget only when necessary, and **never in an animation**.

**Fix.** `AnimatedOpacity` or `FadeInImage` (which applies opacity through the GPU fragment
shader). For an image, apply the opacity to the image directly. For simple shapes and text,
draw with a semi-transparent colour — valid only when nothing overlaps.

**Reasoning.** `Opacity` is expensive because it can trigger a `saveLayer` (offscreen
buffer). **[OFFICIAL]** Confidence: High.

### `saveLayer`

**Statement.** Use `saveLayer()` sparingly, and hunt down the indirect calls.

**Symptom/metric.** Raster jank; `saveLayer()` emits an event on the DevTools timeline;
enable `PerformanceOverlayLayer.checkerboardOffscreenLayers` to see them.

**Reasoning.** `saveLayer()` allocates an offscreen buffer and can force a *render target
switch*, which is particularly disruptive on mobile GPUs.

**Widgets that can trigger it:** `ShaderMask`, `ColorFilter`, `Chip` (when
`disabledColorAlpha != 0xff`), `Text` (when `overflowShader` is set). **[OFFICIAL]**
Confidence: High.

### Clipping

**Statement.** Limit clipping; avoid clipping during an animation (pre-clip the image
instead).

**Reasoning.** Clipping does **not** call `saveLayer()` unless `Clip.antiAliasWithSaveLayer`
is used, so it is cheaper than `Opacity` — but still costly. The default is `Clip.none`.

**Fix.** For rounded corners, use the widget classes' own `borderRadius` rather than a
clipping rectangle. **[OFFICIAL]** Confidence: High.

## Layout

### Lazy lists and grids

**Statement.** For any large list or grid, use the lazy builders — `ListView.builder`,
`GridView.builder` — with callbacks.

**Anti-pattern.** Constructors taking a concrete `List` of children (`Column()`,
`ListView(children: […])`) when most children are offscreen: their build cost is paid for
nothing.

**Reasoning.** The builder only constructs the visible portion at startup. **[OFFICIAL]**
Confidence: High.

### Intrinsic passes

**Statement.** Minimise the intrinsic layout passes caused by grids and lists.

**Symptom.** A second layout pass; enable *Track layouts* in DevTools and look for
`$runtimeType intrinsics` events in the stack trace.

**Fix.** Fix a cell size ahead of time, or pick an "anchor" cell and write a custom
`RenderObject`.

**Reasoning.** An intrinsic pass interrogates *every* cell — not only the visible ones — to
compute a uniform size, then revisits them. **[OFFICIAL]** Confidence: High.

### `RepaintBoundary`

**Statement.** Isolate inside a `RepaintBoundary` a static subtree surrounded by frequently
changing UI (or an animated area) — but with intent, not everywhere.

**Symptom.** Wide repaints visible with `debugRepaintRainbowEnabled`.

**Reasoning.** It creates a new layer (`OffsetLayer`) whose rendering can be cached and
reused. But each boundary has a memory cost, and scattering them arbitrarily **reduces**
performance.

**Validity caveat.** The benefit is conditional on the actual repaint pattern — measure it
through the associated render object. **[OFFICIAL for the mechanism and its cost;
PRACTITIONER (gskinner, Wonderous) for the targeted usage]** Confidence: Medium.

### Image decode sizing

**Statement.** Decode network images at their **display** size, not their source size.

**Symptom.** Memory bloat; set `debugInvertOversizedImages = true` to spot oversized images.

**Fix.** `cacheWidth`/`cacheHeight` on `Image`, or wrap the `ImageProvider` in `ResizeImage`.
`CachedNetworkImage` exposes `memCacheWidth`/`memCacheHeight`. **[PRACTITIONER (gskinner) +
OFFICIAL for `ResizeImage`/`cacheWidth`]** Confidence: Medium.

## Review checklist

- Are constructors `const` wherever possible — is `prefer_const_constructors` enabled?
- Is every `setState` as low in the subtree as it can be?
- Is `AnimatedBuilder`'s static subtree passed as `child` rather than built in the `builder`?
- Do large lists and grids use `.builder`?
- Any avoidable `Opacity` or clip, especially inside an animation?
- Are network images decoded at display size (`cacheWidth`/`ResizeImage`)?
- Was the measurement taken **in profile mode on a physical device**?

## Version-dependent divergences

- **Impeller vs Skia.** Impeller has been the default on iOS and Android API 29+ since 3.27
  (2024-12-11). On Android below Vulkan it falls back to the legacy OpenGL renderer; on iOS
  Impeller is the only engine (no switch back to Skia); the web still uses Skia
  (CanvasKit/skwasm). **Any pre-Impeller shader-jank advice is historical.**
- **Performance gain figures.** Values of the "−70% dropped frames" kind circulating in blog
  posts are **not sourced with a published methodology** and **must not** drive an
  optimisation decision. No gain figure is quoted in this document, for that reason.
- **Thread naming.** "GPU thread" was renamed "raster thread"; older docs and overlays still
  say GPU. Sources also describe the top/bottom order of the two overlay graphs
  inconsistently — trust the labels in your current DevTools version rather than a memorised
  order.
