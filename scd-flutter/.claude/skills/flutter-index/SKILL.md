---
name: flutter-index
description: |
  Map of the seven scd-flutter skills — which one owns your question, and where the
  boundaries between them fall.
disable-model-invocation: true
---

# Which scd-flutter skill owns this question

The seven skills in this plugin are **user-invoked**: none of them fires on its own, and none
can reach another. This index exists so you have one name to remember instead of seven — read
the answer, then type the command yourself.

```
/scd-flutter:<skill-name>
```

## The seven

| Skill | Owns | Valid outside Flutter |
|---|---|---|
| `dart-idioms` | The language and standard library: null safety, promotion, records, `sealed`, extension types, async error handling, lint rulesets | **Yes** — any Dart project, CLI or server included |
| `flutter-architecture` | Where code belongs and which layer boundaries it may not cross; state mechanism by scope; DI; `Result`/`Command`; platform targeting; **desktop packaging** (MSIX, notarisation, Snap) | No |
| `flutter-runtime` | What the framework rebuilds, reconciles, lays out and replays — **and what it costs**: jank, memory, `Key` and reconciliation, intrinsics, `dispose`, hot reload, isolates, uncaught errors | No |
| `flutter-testing` | Proving an app behaves: test layers, flakiness, goldens, `fakeAsync`, the accessibility harness, coverage | No |
| `flutter-data` | Filling the Repository: HTTP, timeouts and retry, `Result` mapping, tokens and sessions, serialisation, local databases, offline-first | No |
| `flutter-ui-interaction` | The API surface for interaction and final look: animation, gestures, focus and keyboard, text input and forms, theming, `Semantics`, i18n | No |
| `flutter-build-release` | Source tree → signed **Android or iOS** artefact: flavors, `pubspec` constraints, keystores and provisioning, versioning, monorepos, pub.dev, CI/CD, binary size | No |

## Start from the symptom

| What you are seeing | Skill |
|---|---|
| Jank, dropped frames, memory that never settles | `flutter-runtime` |
| State follows the slot after a list reorder | `flutter-runtime` |
| A layout throws on intrinsics | `flutter-runtime` |
| A change does not appear after hot reload | `flutter-runtime` |
| `MissingPluginException`, `pumpAndSettle timed out`, a golden off by pixels | `flutter-testing` |
| Passes locally, fails in CI | `flutter-testing` |
| `LateInitializationError`, "cannot be promoted", a non-exhaustive `switch` | `dart-idioms` |
| A gesture swallowed by a parent, a shortcut that never fires, focus landing wrong | `flutter-ui-interaction` |
| Broken layout in RTL or at large text scale | `flutter-ui-interaction` |
| A request hangs, a token refresh races, `build_runner` conflicts | `flutter-data` |
| `version solving failed`, a rejected upload, an oversized binary | `flutter-build-release` |
| "Where does this file go?", a layer violation, `context` used after an `await` | `flutter-architecture` |

## The five boundaries that actually confuse people

These are not guesses. Each was measured against real developer questions — 126 queries, three
passes each, three rounds — and these five are where routing went wrong often enough to be
worth stating plainly.

**Measure vs prove** — `flutter-runtime` × `flutter-testing`. The verb decides. *Producing a
number* (a frame timing, an app-size view, a benchmark result) is measurement and belongs to
`flutter-runtime`, even when a test harness produces it. *Producing a pass or a fail* belongs
to `flutter-testing`. This is the boundary that misroutes most: a question containing the word
"test" pulls hard toward `flutter-testing` whatever it is really asking.

**The cost of animating vs the animation API** — `flutter-runtime` × `flutter-ui-interaction`.
`AnimatedBuilder`'s `child`, `RepaintBoundary`, `Opacity`/`saveLayer`, the `dispose` checklist:
`flutter-runtime`. Which curve, which family, why the `Hero` does nothing:
`flutter-ui-interaction`.

**Deciding a Repository exists vs filling it** — `flutter-architecture` × `flutter-data`.
"Do I need this layer at all?", "may my ViewModel skip it?", and the `Result`/`Command` types
themselves: `flutter-architecture`. What goes inside — the Dio call, the DTO mapping, the retry
policy: `flutter-data`.

**Where a file sits vs the build that consumes it** — `flutter-architecture` ×
`flutter-build-release`. Where `main_dev.dart` lives in the tree is placement
(`flutter-architecture`); wiring that flavor into Gradle and Xcode is the build
(`flutter-build-release`). Same split for desktop: **packaging and notarising a desktop app is
`flutter-architecture`**, Android and iOS signing is `flutter-build-release`.

**Diagnosing size vs producing the artefact** — `flutter-runtime` × `flutter-build-release`.
The `--analyze-size` flag is `flutter-build-release`; reading the DevTools view it produces is
`flutter-runtime`. Rule of thumb: *that skill produces, this one diagnoses.*

## Accessibility is cut by activity, not by subject

Three skills touch it and none overlaps:

- **What to annotate** — `Semantics`, labels, ordering: `flutter-ui-interaction`
- **The harness and the guideline values** — `meetsGuideline`, tap-target sizes,
  `ensureSemantics`: `flutter-testing`
- **Text scale and RTL breaking a layout**: `flutter-ui-interaction`

## When two look right

Ask which *activity* you are doing, not which *object* you are touching. The same
`AnimationController` belongs to `flutter-ui-interaction` when you are choosing its curve, to
`flutter-runtime` when it leaks, and to `flutter-testing` when you are driving it in a test.
Every skill body opens with a `## Seams` table that re-states its own boundaries — if you land
in the wrong one, it will tell you where to go.
