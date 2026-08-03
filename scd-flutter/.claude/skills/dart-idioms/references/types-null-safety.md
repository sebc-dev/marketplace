# Types, inference and sound null safety

Source levels: **[OFFICIAL]** dart.dev / Effective Dart · **[TOOLED]** enforced by a lint
rule · **[PRACTICE]** widespread but unnormed. Reference SDK Dart 3.12.x.

## Inference boundaries

**Rule.** Do not annotate the type of an initialized local. Always annotate parameters,
return types, and top-level/field declarations whose type is not obvious.

```dart
var count = 0;                              // inferred int
final names = <String>[];                   // typed literal
int parseCount(String s) => int.parse(s);   // annotated boundary
```

Inference on locals removes noise; annotated public boundaries document the contract and
stop a silent fall-back to `dynamic`.

Lints: `omit_local_variable_types`, `always_declare_return_types`,
`type_annotate_public_apis`. Effective Dart: *"DON'T redundantly type annotate
initialized local variables"*, *"DO annotate return types on function declarations"*.
**[OFFICIAL + TOOLED]**

## `dynamic` versus `Object?`

Use `Object?` for "any value". Reserve `dynamic` for the case where you genuinely want
static checking switched off.

```dart
Object? anyValue;   // must be tested or cast before use — safe
dynamic loose;      // every call compiles, fails at runtime
```

`Object?` keeps static verification: you must prove the type before calling a member.
`dynamic` defers every error to runtime.

Lint `avoid_annotating_with_dynamic`; analyzer mode `strict-raw-types` completes it.
Effective Dart: *"AVOID using dynamic unless you want to disable static checking"*.
**[OFFICIAL]**

## Type promotion

Flow analysis promotes a value to its non-nullable or narrower type after a `!= null` or
`is` test. Structure code to earn promotion rather than multiplying `!` and `?.`.

```dart
int lengthOf(String? text) {
  if (text == null) return 0;
  return text.length;   // 'text' promoted to String
}
```

### What promotes and what does not

| Kind | Promotes? |
|---|---|
| Local variable | Yes |
| Parameter | Yes |
| **Private AND final** field (Dart 3.2+) | Yes |
| Public field | No |
| Non-final field | No |
| Getter (any visibility) | No |
| Any field, in a file whose language version is < 3.2 | No |

Promotion is only sound if the value cannot change between the test and the use. A
mutable field or a getter could return something else on the second read — which is
exactly why they are excluded.

The official page "Fixing type promotion failures" enumerates the exact non-promotion
causes. The usual fix: copy into a local first.

```dart
// Field does not promote — bind it to a local
final cached = _maybeUser;      // local
if (cached != null) use(cached);
```

**[OFFICIAL]** (Understanding null safety; non-promotion-reasons page)

## `late`

Use `late` for lazy initialization or a dependency unavailable at construction time. Do
not use it merely to silence "non-nullable must be initialized".

```dart
late final Database _db;   // initialized once later; lazy if given an initializer
```

Anti-patterns, both from Effective Dart:

- `late` on a variable whose initialization you then need to test — impossible without
  try/catch. *"AVOID late variables if you need to check whether they are initialized."*
- Public `late final` field with no initializer exposed in an API. *"AVOID public late
  final fields without initializers."*

Prefer a constructor initializer list when it suffices: *"DON'T use late when a
constructor initializer list will do."*

`late` converts a compile-time error into a runtime `LateInitializationError` — acceptable
for deferred init, dangerous as an escape hatch. Lint: `unnecessary_late`. **[OFFICIAL]**

## Null assertion `!`

Legitimate only when an invariant outside the analyzer's reach guarantees non-null.

```dart
// Questionable
final user = cache[id]!;         // crashes if absent

// Preferred
final user = cache[id];
if (user == null) throw StateError('missing $id');
```

A cascade (`a!.b!.c!`) is several invisible crash sites in one expression. Lints:
`unnecessary_non_null_assertion`, `null_check_on_nullable_type_parameter`.
**[OFFICIAL + PRACTICE]**

## Generics and variance

Write type arguments on generic invocations when they are not inferred; omit them when
they are; never leave a generic type incomplete (`List` instead of `List<T>`).

```dart
var ids = <int>[];
var m = <String, int>{};
final list = List<int>.filled(3, 0);   // argument required, not inferred
```

**Variance hazard.** Dart treats generics as **covariant** in their type parameter:
`List<Cat>` is a subtype of `List<Animal>`. That is unsound on writes and produces
runtime `TypeError`s — a `List<Animal>` reference pointing at a `List<Cat>` accepts a
`Dog` statically and throws at runtime.

The `unsafe_variance` rule flags risky variance in signatures but is **experimental**
(excluded by `very_good_analysis` for that reason) — do not present it as stable.

Lints: `strict_raw_types` (analyzer mode), `avoid_dynamic_calls`. Effective Dart: *"AVOID
writing incomplete generic types"*.

**Confidence:** High on type arguments **[OFFICIAL]**; Medium on variance — the
documentation is scattered and the addressing lint is experimental.

## Review checklist

- Are locals free of redundant annotations, and are all boundaries annotated?
- Any `dynamic` that should be `Object?`?
- Does every field you rely on promoting carry both `private` and `final`?
- For each `!`: is there a stated invariant the analyzer cannot see? If not, restructure.
- Any `late` used to dodge initialization rather than defer it?
- Any raw generic (`List`, `Map`, `Future`) left without type arguments?
