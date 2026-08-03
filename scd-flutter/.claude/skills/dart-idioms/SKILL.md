---
name: dart-idioms
description: |
  Dart 3.x language and standard library — the language layer, valid in any Dart
  project, Flutter or not.
disable-model-invocation: true
---

# Dart 3.x idioms

Reference SDK: Dart **3.12.x**. Ruleset versions: `lints` 6.1.0, `flutter_lints` 6.0.0,
`very_good_analysis` 10.2.0 (verified summer 2026 — re-check on every SDK bump).

## Critical rules

These change what code gets written. Apply before writing any Dart.

1. **Infer inside, annotate at the boundary.** No type on an initialized local
   (`var count = 0`). Always annotate parameters, return types, and fields whose type
   is not obvious. Lints: `omit_local_variable_types`, `always_declare_return_types`,
   `type_annotate_public_apis`.
2. **`Object?` for "any value", `dynamic` only to deliberately switch off static
   checking.** `Object?` keeps the check: you must prove the type before calling a
   member.
3. **Structure for promotion instead of reaching for `!` and `?.`.** Flow analysis
   promotes locals and parameters; since Dart 3.2 it promotes fields only when they are
   **private AND final**. A public field, a non-final field, and any getter never
   promote.
4. **`!` needs an invariant the analyzer cannot see.** Otherwise handle the null
   explicitly. A chain like `a!.b!.c!` is a crash site that reads as ordinary code.
5. **`late` is for genuinely deferred initialization**, not for silencing "non-nullable
   must be initialized". If a constructor initializer list does the job, use it. Never
   `late` on a variable whose initialization you then need to test.
6. **Record for a local multi-value return; class for anything with identity.** The
   moment a type carries business meaning, invariants, or outlives the call, it needs a
   name — see the table below.
7. **`sealed` + switch expression buys exhaustiveness — a `default` throws it away.**
   Adding a variant should break the build; a catch-all `default` on a `sealed`/`enum`
   switch silently suppresses that.
8. **Extension types are erased at runtime.** `runtimeType` returns the representation
   type. No runtime encapsulation, no implicit validation, and a cast reaches the
   underlying value. Never use one for runtime safety.
9. **Never a bare `catch` — always an `on` clause.** Catching everything swallows
   `StackOverflowError`, `OutOfMemoryError`, `AssertionError`, `ArgumentError` and hides
   the bug. Do not catch `Error` or its subtypes; use `rethrow` to re-raise.
10. **Every future is awaited, returned, or explicitly `unawaited()`.** `unawaited()`
    silences the lint, not the failure — reserve it for futures expected to succeed.
    Enable both `unawaited_futures` and `discarded_futures`.
11. **Cancel every `StreamSubscription`, close every `StreamController`/`Sink`** in the
    scope that owns it.
12. **`Isolate.run` for CPU-bound work; `async`/`await` is not parallelism.** `await`
    yields to the event loop — real parallelism needs an isolate. Isolates share no
    memory; messages are copied, so large or non-serializable payloads cost.
13. **Override `==` ⇒ override `hashCode`.** Never put custom equality on a mutable
    class. The `==` parameter is already non-nullable `Object` — no manual null test.
14. **Do not generate primary constructors or private named parameters.** Both are
    documented as experimental/new in the 3.12 cycle. Confirm the experiment flag and
    language version first.

## Record or class

| Situation | Choice |
|---|---|
| Return two values from one function, consumed immediately | Record |
| Group temporary data inside one function/method | Record |
| Key or tuple used locally, compared by value | Record (value equality by shape) |
| The type has a name in the domain vocabulary | Class |
| It has invariants to validate, or methods | Class |
| It is exposed in a public API, or documented | Class |
| It must survive refactoring and gain fields later | Class |

A name written on a positional record field (`(int value, String name)`) is
documentation only — it has no effect. Named-field order does not affect equality;
positional order does.

## Lint ruleset

| Ruleset | Relationship | Pick it when |
|---|---|---|
| `package:lints/core.yaml` | Critical problems; drives pub.dev scoring | Every package should pass this |
| `package:lints/recommended.yaml` | Superset of core; default of `dart create` | **Default starting point** for pure Dart |
| `package:flutter_lints/flutter.yaml` | Superset of recommended + 10 Flutter rules | Any Flutter project |
| `very_good_analysis` | Strict third-party set (Very Good Ventures) | Team wants mandatory API docs and stricter style — then accept its choices wholesale |

Whichever set you pick, turn on the three analyzer **strict** modes. They eliminate
implicit `dynamic`, which lints alone do not:

```yaml
include: package:lints/recommended.yaml

analyzer:
  language:
    strict-casts: true       # no implicit cast from dynamic
    strict-inference: true   # flag inference falling back to dynamic
    strict-raw-types: true   # flag raw generics
  exclude:
    - '**.g.dart'
linter:
  rules:
    prefer_final_locals: true
```

## Where authoritative sources disagree

Effective Dart and `very_good_analysis` contradict each other on style. Neither is
wrong; the rule is **intra-project consistency**, so read the project's
`analysis_options.yaml` before choosing.

| Subject | Effective Dart | very_good_analysis |
|---|---|---|
| Imports inside `lib/` | `prefer_relative_imports` | `always_use_package_imports` |
| Local variable types | `omit_local_variable_types` | same (excludes `always_specify_types`) |
| Public API docs | Preferred | `public_member_api_docs` enforced |

## Seams

When a question sits near a seam, decide which side it falls on before answering. This skill is
**language and standard library, any Dart project** — the one skill here still valid outside
Flutter. Everything framework-bound routes out.

| Neighbouring subject | Owner | Where the seam falls |
|---|---|---|
| `pubspec.yaml` constraints, dependency resolution, `dependency_overrides`, Pub workspaces, publishing to pub.dev | `flutter-build-release` | `pubspec.yaml` is neither language nor standard library. Dart 3 breaking changes as **language facts** are here; the tooling strategy that decides *when* to take them is there |
| `BuildContext` and widget lifetime, where a file belongs, the layer contract, DI | `flutter-architecture` | — |
| What rebuilding, reconciling and disposing cost a running app; leaks | `flutter-runtime` | `Isolate.run` as a **language API** is here; moving work off a Flutter UI thread is there |
| Serialisation code generation — `json_serializable`, `freezed`, `dart_mappable`, `build_runner` | `flutter-data` | — |
| Writing or fixing a Flutter test — `WidgetTester`, goldens, flakiness | `flutter-testing` | `test` package idioms and `Future` semantics are here; proving a Flutter app behaves is there |

## Name the silence

Say what has no prescription, and what would lift it — an unlabelled claim gets obeyed as one.

Standing silence here: **nothing arbitrates between Effective Dart and `very_good_analysis`
where they disagree** — relative vs package imports, mandatory public API docs. Both are
published positions; neither is *the* official one, so the rule is intra-project consistency and
nothing beyond it, which is why the table above states the disagreement rather than resolving
it. *What would lift this:* a dart.dev position on the contested rules — a third-party ruleset
asserting one does not count.

Primary constructors and private named parameters being experimental in the 3.12 cycle is a
dated fact, not a recommendation either way.

## References

Load one when the work reaches that depth. Each is self-contained.

- [`references/types-null-safety.md`](references/types-null-safety.md) — inference
  boundaries, `dynamic` vs `Object?`, promotion failures and their exact causes, `late`,
  `!`, generics and Dart's covariance hazard.
- [`references/dart3-features.md`](references/dart3-features.md) — records, patterns and
  destructuring, class modifiers, switch exhaustiveness and guards, extension types,
  async and isolates, error handling, API design and naming, `==`/`hashCode`,
  `copyWith`, doc comments, library organization.
- [`references/lints-tooling.md`](references/lints-tooling.md) — the three official
  rulesets and their deltas, `lints` 5.0→6.1 evolution, `very_good_analysis` exclusions
  with their stated reasons, noisy lints, Dart 3 breaking changes, removed lints,
  experimental features not to rely on.

## Symptom index

| Symptom | Reference |
|---|---|
| "Property cannot be promoted" on a field | [types-null-safety.md](references/types-null-safety.md) |
| `LateInitializationError` at runtime | [types-null-safety.md](references/types-null-safety.md) |
| Null check operator used on a null value | [types-null-safety.md](references/types-null-safety.md) |
| `TypeError` writing into a covariantly-typed list | [types-null-safety.md](references/types-null-safety.md) |
| Switch not flagged when a variant is added | [dart3-features.md](references/dart3-features.md) |
| "Switch expression must be exhaustive" | [dart3-features.md](references/dart3-features.md) |
| Extension type not enforcing its invariant | [dart3-features.md](references/dart3-features.md) |
| Unhandled asynchronous error / silent failure | [dart3-features.md](references/dart3-features.md) |
| `copyWith` cannot set a field back to null | [dart3-features.md](references/dart3-features.md) |
| Class can no longer be used as a mixin | [lints-tooling.md](references/lints-tooling.md) |
| Lint rule not found / removed after SDK bump | [lints-tooling.md](references/lints-tooling.md) |
| Two lint rules fighting each other | [lints-tooling.md](references/lints-tooling.md) |
| `_` no longer readable as a variable | [lints-tooling.md](references/lints-tooling.md) |
