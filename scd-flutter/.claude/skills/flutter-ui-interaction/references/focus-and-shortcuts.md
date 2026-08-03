# Focus, traversal and keyboard shortcuts

The focus tree, who gets to be in it, in what order, and how key combinations reach an action.

Sources reflect **Flutter 3.44**: docs.flutter.dev/ui/interactivity/focus and
/actions-and-shortcuts, plus the `Focus`, `FocusNode`, `FocusTraversalGroup`, `Shortcuts` and
`Actions` dartdocs `[OFFICIAL]`.

## The focus tree

Focus is a tree parallel to the widget tree, and exactly one node holds **primary focus** at a
time. Its ancestors are all *in the focus chain*, which is why a `FocusScope` can restore focus
to whatever child last held it.

| Piece | Role |
|---|---|
| `FocusNode` | The addressable unit. Owned by a `State`, created in `initState`, disposed in `dispose` |
| `Focus` | The widget that attaches a node to the tree, and exposes `onKeyEvent`, `onFocusChange`, `autofocus` |
| `FocusScope` | A grouping that remembers its last-focused child and scopes traversal |
| `FocusTraversalGroup` | Applies a traversal **policy** to a subtree |

A `FocusNode` is a listenable object with a lifetime: it belongs in the `State`, never
constructed inside `build`, and it goes on `flutter-runtime`'s `dispose` checklist alongside
controllers.

## Controlling participation

Three independent flags, and confusing them produces a control that is either unreachable or
reachable but inert `[OFFICIAL]`:

| Flag | Effect |
|---|---|
| `canRequestFocus: false` | The node cannot take focus at all — programmatically or by traversal |
| `skipTraversal: true` | The node **can** hold focus (e.g. by tap or by request) but Tab skips over it |
| `descendantsAreFocusable: false` | The subtree below is removed from focus, while the node itself is unaffected |

`skipTraversal` is the one to reach for when a widget should be clickable and focusable but does
not belong in the Tab order; `canRequestFocus: false` is for a genuinely inert element.

## Traversal order

By default, traversal follows reading order for the ambient directionality. To change it, wrap a
subtree in `FocusTraversalGroup` and give it a policy:

| Policy | Order |
|---|---|
| `ReadingOrderTraversalPolicy` | Reading order — the default, direction-aware |
| `OrderedTraversalPolicy` | An explicit order, each child wrapped in `FocusTraversalOrder` with a `NumericFocusOrder` or `LexicalFocusOrder` |
| `WidgetOrderTraversalPolicy` | Widget-tree order |
| `DirectionalFocusTraversalPolicyMixin` | Arrow-key movement, mixed into a policy |

Groups nest, and that is the point: a toolbar can hold an internal explicit order without
disturbing the reading-order traversal of the page containing it.

## Shortcuts, Intents and Actions

The three-layer split and its rationale are in the skill body. What matters when wiring it:

```dart
Shortcuts(
  shortcuts: const <ShortcutActivator, Intent>{
    SingleActivator(LogicalKeyboardKey.keyN, control: true): CreateNewIntent(),
  },
  child: Actions(
    actions: <Type, Action<Intent>>{
      CreateNewIntent: CallbackAction<CreateNewIntent>(onInvoke: (_) => _create()),
    },
    child: const Focus(autofocus: true, child: Body()),
  ),
)
```

Three things this arrangement implies:

1. **The `Actions` lookup runs up the focus chain**, not the widget tree from the key press. A
   shortcut that "does nothing" is very often a focus problem, not a mapping problem — check
   that something inside the `Actions` subtree actually holds focus.
2. **`Intent` is the extension point.** Defining a `CopyIntent` once and letting each screen
   register its own `Action` for it is the whole reason the layers are separate; mapping the key
   straight to a callback throws that away.
3. **`ShortcutActivator` is the abstraction over key combinations** — `SingleActivator` for one
   key plus modifiers, `LogicalKeySet` for arbitrary sets, `CharacterActivator` for a character
   regardless of layout.

`CallbackShortcuts` collapses the two layers into one map from activator to callback. It is the
right tool for a local binding nothing else will ever fulfil, and the wrong one for anything a
second screen might reuse.

Prefer `LogicalKeyboardKey` (what the key *means* under the user's layout) over
`PhysicalKeyboardKey` (where it sits on the board) for anything a user would describe by its
letter.

## Platform reach

`FocusableActionDetector` combines `Actions`, `Shortcuts`, `MouseRegion` and `Focus`
`[OFFICIAL]`, which makes it the starting point for a custom control that must handle hover,
focus highlight and keyboard activation together — the three that a bare `GestureDetector`
silently omits on desktop and web.

Keyboard reachability is also an accessibility requirement, not only a desktop nicety; the
guideline values and the test harness that checks them live in `flutter-runtime`.
