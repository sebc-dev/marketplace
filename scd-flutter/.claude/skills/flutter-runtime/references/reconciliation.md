# Element reconciliation and the key family

Why a key is sometimes mandatory, what it costs, and when reaching for `GlobalKey` is a signal
that something else is wrong.

Sources reflect **Flutter 3.44**: `Element.updateChild` and the `Key` subclass dartdocs on
api.flutter.dev, plus *Inside Flutter* (docs.flutter.dev/resources/inside-flutter).

## The matching algorithm

Flutter does **not** run a general tree diff. *Inside Flutter* documents an **O(N) algorithm
per children list**: children that match by position are updated in place, and unmatched
children are placed in a hash table indexed by key so they can be found again elsewhere in the
same list `[OFFICIAL, High]`.

That single design choice explains every key rule that follows. Keys are the entries of that
hash table — without one, an `Element` has nothing to be found by except its slot.

The gate on reuse is `Widget.canUpdate`: **equal `runtimeType` and equal `key` under
`operator==`** `[OFFICIAL, High]`. Fail either and the old `Element` is deactivated and a new
one inflated, taking the `State` with it.

## Choosing

```
Do stateful siblings of the same type get reordered, inserted or removed?
├─ no  → no key
└─ yes → is there a stable value on the data?
         ├─ yes → ValueKey(data.id)
         └─ no  → ObjectKey(data)
```

`UniqueKey()` is not a default. It is never equal to anything, so it forces a brand-new
`Element` — useful to deliberately restart an animation or re-run `initState`, destructive when
it lands in a `build` method by accident.

`PageStorageKey` addresses a different problem: it names a slot in `PageStorage` so scroll
offsets and similar survive the widget being rebuilt. The dartdoc requires its value to **stay
stable across recreations** `[OFFICIAL]` — a `PageStorageKey` derived from an index breaks the
moment the list reorders.

## GlobalKey: cost and legitimate use

A `GlobalKey` is unique across the entire tree, which buys two things: reparenting a subtree
without losing its state, and reaching a `State` from outside its own subtree.

**Reparenting is "relatively expensive"** `[OFFICIAL, High]`. The dartdoc is specific about
what it triggers: `State.deactivate` on the state *and every descendant*, and a forced rebuild
of everything depending on an `InheritedWidget` in that subtree.

**It must be owned, not created.** *"Creating a new GlobalKey on every build will throw away the
state of the subtree."* `[OFFICIAL, High]` Hold it in a `State` field, instantiated in
`initState` — a `final` field on a `StatefulWidget` is not enough, because the widget itself is
rebuilt.

Legitimate uses are the ones that need a *specific framework* `State` from outside:

| Use | Why it is legitimate |
|---|---|
| `GlobalKey<FormState>` to call `validate()`, `save()`, `reset()` | The `FormState` API is only reachable that way |
| `GlobalKey<NavigatorState>` for navigation outside the widget tree | Same |
| `GlobalKey<ScaffoldState>` | Same |

Reading a value out of a child through a `GlobalKey` is the smell. The dartdoc itself points
away from it: *"consider using a Key, ValueKey, ObjectKey, or UniqueKey instead"* when none of
`GlobalKey`'s specific features are required `[OFFICIAL]`. A callback passed down, or a
controller owned by the parent, is the ordinary answer — and it is the one `flutter-architecture`
prescribes.

## Three places keys resurface

Cross-references from `flutter-ui-interaction`, which owns those widgets but not this mechanism:

1. **`AnimatedSwitcher`** detects a child change through `canUpdate` — `runtimeType` *and* `key`.
   Two children of the **same type** therefore need distinct keys, typically a `ValueKey`, or no
   transition fires at all `[OFFICIAL]`. This is the most common "my `AnimatedSwitcher` does
   nothing" cause.
2. **`GlobalKey<FormState>`** — the legitimate case above.
3. **Locale or theme changes** rebuild `MaterialApp`, and subtree state can be lost if identity
   is not carried by keys.

## The use_key_in_widget_constructors lint

`[TOOLED, Medium]` The lint requires every public widget constructor to accept a `Key`. Its
value is genuinely contested rather than settled.

> **[PRACTITIONER, Medium] — not a prescription.**
> A widely shared practitioner position (GDE Alexey Inkin; medium.com/flutter-senior) is to
> disable it in applications, where it dilutes the cases that actually matter, and keep it on in
> **published packages**, where a consumer may legitimately need to pass a key into a widget you
> wrote.
> *What would lift this:* an official position on the lint beyond its presence in a ruleset.

The lint is about *accepting* a key, never about *needing* one — it cannot tell you whether a
given list requires `ValueKey`.
