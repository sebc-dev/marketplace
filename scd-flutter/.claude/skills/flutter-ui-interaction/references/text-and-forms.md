# Text rendering, selection and form plumbing

Below the formatter and `autovalidateMode` rules in the skill body: rich text, selection, the
context menu, and where platform IME behaviour is genuinely undocumented.

Sources reflect **Flutter 3.44**: the `TextInputFormatter`, `EditableText`,
`AdaptiveTextSelectionToolbar`, `Form` and `FormField` dartdocs `[OFFICIAL]`.

## Choosing a text widget

| Widget | For |
|---|---|
| `Text` | A single style, the overwhelmingly common case |
| `Text.rich` / `RichText` with `TextSpan` | Mixed styles in one paragraph — a bold word, an inline link |
| `SelectableText` | Text the user can select and copy, without an editing affordance |
| `SelectionArea` | Selection across a whole subtree, including several widgets — usually better than making each one selectable |

Prefer `Text.rich` over bare `RichText`: `RichText` does not inherit `DefaultTextStyle`, so every
span must carry a full style, and a missing one renders with framework defaults rather than the
theme.

Nested `TextSpan`s inherit from their parent span, which is what makes a partially-styled
sentence expressible without splitting it into separate widgets — splitting also breaks line
wrapping across the pieces.

## The selection context menu

`contextMenuBuilder` replaces the toolbar shown on selection, and
`AdaptiveTextSelectionToolbar` renders the platform-correct one `[OFFICIAL]`:

```dart
TextField(
  contextMenuBuilder: (context, editableTextState) {
    return AdaptiveTextSelectionToolbar.buttonItems(
      anchors: editableTextState.contextMenuAnchors,
      buttonItems: [
        ...editableTextState.contextMenuButtonItems,      // keep cut/copy/paste
        ContextMenuButtonItem(onPressed: _translate, label: 'Translate'),
      ],
    );
  },
)
```

Spreading `contextMenuButtonItems` before adding your own is what preserves the standard
entries. Building the list from scratch silently removes cut, copy, paste and select-all — and
on iOS that also removes the system entries users expect.

`anchors` positions the toolbar against the current selection; hard-coding a position puts the
menu in the wrong place on rotation and on split-screen.

## Form plumbing

`Form` establishes a scope; `FormField` (and `TextFormField`, which wraps it) registers with the
nearest one. Three methods on `FormState`, reached through a `GlobalKey<FormState>` or
`Form.of(context)`:

| Method | Effect |
|---|---|
| `validate()` | Runs every field's `validator`, returns whether all passed, and displays errors |
| `save()` | Calls every field's `onSaved` |
| `reset()` | Returns every field to its `initialValue` and clears errors |

A `validator` returns `null` for valid and the error string otherwise — returning an empty
string shows an empty error slot rather than no error, which reads as a layout bug.

`TextEditingController` and `FocusNode` are owned by the `State` and disposed there; a
`TextFormField` given neither creates its own internally, which is fine until you need to read
the value outside `onSaved`.

## Where the IME is undocumented

The formatter prescription in the skill body is solid. The platform behaviour around it is not.

> **[PRACTITIONER, Low] — not a prescription.**
> Composing-region behaviour diverges by platform, and on **web** the composing range is
> frequently wrong or absent, so a formatter that is correct against the documented contract can
> still misbehave there. The cases live in flutter/flutter #78827, #65357 and #107969 — issue
> reports, not normative documentation.
> *What would lift this:* a documented per-platform statement of composing-region guarantees.

The practical consequence is a testing instruction rather than a coding one: a formatter
intended for international input needs manual verification with a real IME on each target
platform, because no rule in the documentation predicts the divergence.
