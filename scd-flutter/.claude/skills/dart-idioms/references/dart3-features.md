# Dart 3 features, async, and API design

Source levels: **[OFFICIAL]** dart.dev / Effective Dart · **[TOOLED]** enforced by a lint
rule · **[PRACTICE]** widespread but unnormed. Reference SDK Dart 3.12.x.

## Records

Intended for returning several values from a function and grouping temporary data
without naming a class.

```dart
(String, int) userInfo(Map<String, dynamic> json) =>
    (json['name'] as String, json['age'] as int);
final (name, age) = userInfo(data);   // destructuring
```

**Properties.** Immutable. **Value equality**: two records are equal when they share the
same *shape* and equal fields. The order of **named** fields does not affect equality;
the order of **positional** fields does. Positional access via `$1`, `$2`; named access
by field name.

**Common abuse.** Using a record as a durable domain model exposed in a public API. You
lose the type name, the documentation, the invariants, and any ability to add methods or
validation. As soon as a type carries business identity or must live beyond the call,
make it a class. The name written on a positional field (`(int value, String name)`) is
purely documentary and has no effect. **[OFFICIAL]**

## Patterns and destructuring

Match a shape and extract from it in one step.

```dart
if (data case {'user': [String name, int age]}) {
  print('$name is $age');
}
```

Useful pattern kinds:

| Pattern | Use |
|---|---|
| Record pattern | Destructure a multi-value return |
| Map / list pattern | Validate a JSON structure and pull its fields at once |
| Object pattern + `sealed` | Algebraic data types |
| Relational + logical-and | `>= 400 && < 1000` |
| Logical-or (`\|\|`) | Share one body across several cases |
| Wildcard `_` | Ignore a position |

**Abuse.** Deeply nested patterns that stop being readable; a pattern where a plain `is`
or `==` would do. **[OFFICIAL]**

## Class modifiers

| Modifier | Effect outside the library |
|---|---|
| `sealed` | Closed hierarchy **within the same library** → enables switch exhaustiveness checking. Implicitly `abstract`. |
| `final` | No subtyping at all — neither `extends` nor `implements`. Lets you add members without breaking clients. Subsumes `base`. |
| `base` | `extends` allowed, `implements` forbidden. Every subclass must itself be `base`, `final` or `sealed`. Guarantees private members are inherited and `this` calls known implementations. |
| `interface` | `implements` allowed, `extends` forbidden. |

```dart
sealed class Shape {}
class Square implements Shape { final double length; Square(this.length); }
class Circle implements Shape { final double radius; Circle(this.radius); }

double area(Shape s) => switch (s) {
  Square(length: var l) => l * l,
  Circle(radius: var r) => 3.14 * r * r,
};   // exhaustive: adding a subclass breaks compilation
```

Allowed combination order: `(abstract)? (base|interface|final|sealed)? (mixin)? class`.
Incompatible: `abstract` + `sealed` (redundant — `sealed` is already implicitly
abstract); `interface`/`final`/`sealed` + `mixin`.

**Choosing.** `sealed` for a finite set of variants (results, states). Applying `sealed`
to a hierarchy meant for third-party extension is the abuse — use `final` there. With no
modifier a class stays both extensible and implementable, the historical behaviour;
adding a modifier is an explicit API decision. **[OFFICIAL]**

## Switch expressions and exhaustiveness

Prefer the switch **expression** (`=>`) when every branch produces a value, and lean on
`sealed`/`enum` exhaustiveness rather than a catch-all `default`.

```dart
String label(Status s) => switch (s) {
  Status.pending => 'Processing',
  Status.done    => 'Completed',
  Status.failed  => 'Failed',
};
```

- A switch **expression** must **always** be exhaustive — compile-time error otherwise,
  whatever the type being switched on (dart-lang/language #2474).
- A switch **statement** on a `sealed`/`enum` type is flagged when non-exhaustive; on an
  unsealed type a `default`/`_` is still required.
- A `when` guard adds a boolean condition to a pattern without breaking exhaustiveness;
  when the guard is false, control falls to the next case.

**Anti-pattern.** Adding a pointless `default` to a `sealed`/`enum` switch — it
**disables** the exhaustiveness warning, so adding a variant later compiles silently.

Lints: `exhaustive_cases`, `unnecessary_breaks` (`break` is unnecessary in the new
switch), `no_default_cases` (optional, forces every case to be handled). **[OFFICIAL]**

## Extension types *(Dart 3.3)*

A zero-cost static view over an existing type — no wrapper allocation. Mainly for JS
interop (`dart:js_interop`) and identifier types (wrapping `int` as `UserId`).

```dart
extension type NumberE(int value) {
  NumberE operator +(NumberE other) => NumberE(value + other.value);
}
```

**Critical semantics.** The extension type is **erased at runtime**: `e.runtimeType`
returns the representation type (`int`). It is **not** a real wrapper — no runtime
encapsulation, no implicit validation (you need an explicit constructor to validate).
`implements` exposes the representation type's members.

**Common abuse.** Believing an extension type protects an invariant at runtime or hides
the underlying value. It does neither — a cast reaches it. Never use one as a substitute
for a class when runtime safety matters.

Lint: `annotate_redeclares` (annotate `@redeclare` when a member shadows a
superinterface member; **experimental**). **[OFFICIAL]**

## Async and error handling

### async/await over raw futures

Prefer `async`/`await` to `.then()`/`.catchError()` chaining; type async members with no
value as `Future<void>`. Linear `await` with `try`/`catch` reads better and handles
errors correctly; the raw `Future` API exposes you to registering an error handler too
late.

Effective Dart: *"PREFER async/await over using raw futures"*, *"DO use Future<void> as
the return type of asynchronous members that do not produce values"*, *"DON'T use async
when it has no useful effect"*. Lints: `unnecessary_await_in_return`, `avoid_void_async`.
**[OFFICIAL]**

### Every future awaited or explicitly discarded

```dart
Future<void> asyncValue() async => ...;

void main() async {
  await asyncValue();
  unawaited(asyncValue());   // explicit fire-and-forget
}
```

`unawaited()` suppresses the lint but **not** the failure: if the future fails the error
is still unhandled unless dealt with elsewhere. Reserve it for futures expected to
succeed. `.ignore()` suppresses errors too.

An unhandled future error becomes an "uncaught asynchronous error" that can corrupt state
or crash depending on the environment.

Lints: `unawaited_futures` (unawaited futures inside an `async` body) and
`discarded_futures` (async calls from **synchronous** code). They are complementary —
enable both. **[OFFICIAL + TOOLED]**

### Filter your catches

```dart
try {
  await risky();
} on TimeoutException catch (e) {
  // handle precisely
}
```

A catch-all — "Pokémon exception handling", the term Effective Dart itself uses —
swallows `StackOverflowError`, `OutOfMemoryError`, `AssertionError`, `ArgumentError` and
masks bugs. Effective Dart: *"AVOID catches without on clauses"*, *"DON'T explicitly catch
Error or types that implement it"*, *"DO use rethrow"*.

Lints: `avoid_catches_without_on_clauses`, `avoid_catching_errors`, `only_throw_errors`,
`use_rethrow_when_possible`. **[OFFICIAL]**

### Subscription and sink lifetime

Every `StreamSubscription` must be cancelled and every `StreamController`/`Sink` closed in
the scope that owns it. An uncancelled subscription keeps references alive and keeps
receiving events — memory leak plus side effects.

Lints: `cancel_subscriptions`, `close_sinks`. **Caveat:** `close_sinks` has unresolved
false positives (dart-lang/linter #1381), which is why `very_good_analysis` excludes it.
**Confidence: Medium** on the tooling, High on the rule itself.

**Async context trap.** After an `await`, state captured beforehand may be stale. In pure
Dart this concerns sequencing invariants; in Flutter it is the
`use_build_context_synchronously` rule (see the `flutter-architecture` skill).

### Isolates

For CPU-bound synchronous work, use `Isolate.run(callback)` (available since Dart 2.19 /
Flutter 3.7) rather than wiring `ReceivePort`/`SendPort` by hand.

```dart
final jsonData = await Isolate.run(() async {
  final fileData = await File(filename).readAsString();
  return jsonDecode(fileData) as Map<String, dynamic>;
});
```

- Signature: `static Future<R> run<R>(FutureOr<R> computation(), {String? debugName})`.
- Each isolate has **its own memory**; nothing is shared. Communication is by message
  passing and objects are **copied**.
- `async`/`await` **does not create parallelism** — it yields to the event loop. Real
  parallelism requires an isolate.

**Abuse.** Spawning an isolate for I/O-bound work (pointless — the event loop already
handles it); passing huge or non-serializable objects (copy cost). Note: isolates are
**not available on Flutter web**. **[OFFICIAL]**

## Naming

| Kind | Convention |
|---|---|
| Types, extensions, enums | `UpperCamelCase` |
| Members, variables, **constants** | `lowerCamelCase` — no `SCREAMING_CAPS` |
| Libraries, files, import prefixes | `lowercase_with_underscores` |
| Acronyms beyond two letters | Treated as words: `HttpRequest`, not `HTTPRequest` |

```dart
const pi = 3.14159;            // lowerCamelCase, not PI
class HttpClient {}
import 'dart:math' as math;
```

Meaning conventions: noun phrase for a non-boolean property; non-imperative verb or
`is`/`has` for a boolean; imperative verb for a method with a side effect; `toX()` for a
copy, `asX()` for a view.

Lints: `camel_case_types`, `constant_identifier_names`, `non_constant_identifier_names`,
`file_names`, `library_prefixes`, `camel_case_extensions`. **[OFFICIAL]**

## Constructors

- Make the constructor `const` when the class supports it. Do not write `const`
  redundantly.
- Use initializing formals (`this.x`) instead of assigning in the body, and super
  parameters (`super.x`) to forward to the parent.
- No `new` (long removed). `.new` only for a named tear-off.
- Use `;` rather than `{}` for an empty constructor body.

```dart
class Point {
  final int x, y;
  const Point(this.x, this.y);
  const Point.origin() : this(0, 0);
}
```

Lints: `prefer_const_constructors`, `prefer_const_declarations`,
`prefer_const_constructors_in_immutables`, `unnecessary_const`, `unnecessary_new`,
`use_super_parameters`, `prefer_initializing_formals`, `empty_constructor_bodies`,
`matching_super_parameters`. **[OFFICIAL]**

## Immutability, equality, `copyWith`

Prefer `final` fields and top-level variables. If you override `==`, always override
`hashCode` consistently; respect the laws of equality (reflexive, symmetric, transitive);
**avoid** custom equality on **mutable** classes; do not make the `==` parameter nullable
— it is already `Object`.

```dart
class Point {
  final int x, y;
  const Point(this.x, this.y);
  @override
  bool operator ==(Object other) =>
      other is Point && other.x == x && other.y == y;
  @override
  int get hashCode => Object.hash(x, y);
}
```

**`copyWith`** is a widespread pattern **[PRACTICE]**, not normed by dart.dev. Classic
trap: a naive `copyWith` cannot distinguish "leave unchanged" from "set to null" for a
nullable field — hence sentinel values or code generation (`freezed`, `built_value`).
There is no single official solution.

Lints: `hash_and_equals`, `prefer_final_fields`,
`avoid_equals_and_hash_code_on_mutable_classes`, `prefer_final_locals`.
**Confidence:** High on `==`/`hashCode`/`final`; Medium on `copyWith`.

## Libraries, visibility, documentation

- Make declarations private by default (`_` prefix). Several classes can live in one
  library.
- Import order: `dart:` before `package:` before relative; sections sorted; exports after
  imports.
- Do not import another package's `src/` directory (`implementation_imports`).

Doc comments — Effective Dart:

- **`///` only**, never `/** */` → `slash_for_doc_comments`.
- Write doc comments for public APIs → `public_member_api_docs`.
- Start with a **single-sentence summary**, then a blank line — `dart doc` uses the first
  paragraph as the short description.
- Noun phrase for a non-boolean property; "Whether …" for a boolean.
- `[identifier]` in square brackets to reference something in scope →
  `comment_references`.
- Doc comment goes **before** metadata annotations.

```dart
/// The number of pending items.
///
/// Returns zero when the queue is empty. See [flush] to clear it.
int get pendingCount => _items.length;
```

Lints: `directives_ordering`, `implementation_imports`, `slash_for_doc_comments`,
`public_member_api_docs`, `comment_references`, `dangling_library_doc_comments`,
`unintended_html_in_doc_comment`. **[OFFICIAL]**

## Recurring mistakes flagged by Effective Dart

- **Error handler registered too late** on an already-completed `Future` → unhandled
  error. *"It is crucial that error handlers are installed before a Future completes."*
- **`FutureOr<T>` as a return type** forces the caller to distinguish `T` from
  `Future<T>` → *"AVOID using FutureOr<T> as a return type"*.
- **`Iterable.forEach` with a function literal** → prefer a `for-in` loop.
- **`.length == 0`** → use `isEmpty`/`isNotEmpty` (`prefer_is_empty`,
  `prefer_is_not_empty`).
- **Superfluous `cast()`** → prefer `whereType<T>()` or a cast at the source. *"DON'T use
  cast() when a nearby operation will do."*
