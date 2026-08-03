# Lint rulesets, analyzer configuration and Dart 3 migration hazards

Versions verified summer 2026: SDK Dart **3.12.x**, `lints` **6.1.0** (published
2026-01-30, min SDK ≥ 3.8), `flutter_lints` **6.0.0** (min Flutter 3.32 / Dart 3.8),
`very_good_analysis` **10.2.0** (published 2026-02-16, min SDK 3.11; prerelease
10.3.0-rc.1 on 2026-06-02). **Re-verify on every SDK bump** — rules are added and removed
between minor versions.

## The three official sets

They form a superset chain:

- **`package:lints/core.yaml`** — critical problems; *all* code should pass. Drives
  pub.dev scoring (pub points are awarded on passing `core` lints).
- **`package:lints/recommended.yaml`** — superset of `core`; adds anomaly detection and
  idiomatic style. Enabled by default by `dart create`.
- **`package:flutter_lints/flutter.yaml`** — superset of `recommended` plus Flutter rules.

### Verified delta of `flutter_lints` 6.0.0 over `recommended` — 10 rules

`avoid_print`, `avoid_unnecessary_containers`, `avoid_web_libraries_in_flutter`,
`no_logic_in_create_state`, `prefer_const_constructors_in_immutables`,
`sized_box_for_whitespace`, `sort_child_properties_last`,
`use_build_context_synchronously`, `use_full_hex_values_for_flutter_colors`,
`use_key_in_widget_constructors`.

Most are Flutter-specific; only `avoid_print` is meaningful in pure Dart.

## Evolution of `lints`

| Version | Change |
|---|---|
| **5.0.0** (SDK ≥ 3.5) | `recommended` **+** `invalid_runtime_check_with_js_interop_types`, `unnecessary_library_name`; **−** `avoid_null_checks_in_equality_operators` (deprecated) |
| **5.1.0** | `core` **+** `unintended_html_in_doc_comment` |
| **6.0.0** (Dart ≥ 3.8) | `core` **+** `strict_top_level_inference`; `recommended` **+** `unnecessary_underscores` |
| **6.1.0** (min SDK ≥ 3.8) | `recommended` **+** `use_null_aware_elements`, `no_wildcard_variable_uses`; new `dart format` style |

These additions encode Dart 3 practice: `strict_top_level_inference` forces annotation
where top-level inference would silently fail; `unnecessary_underscores` reflects `_`
becoming non-binding.

## `very_good_analysis` 10.2.0

Strict third-party set from Very Good Ventures (verified publisher). Combines Effective
Dart, the pedantic legacy and VGV's internal rules. Notable enablements: strict typing
blocking implicit `dynamic` casts, `prefer_const_constructors`, `prefer_final_fields`,
`sort_constructors_first`, `public_member_api_docs`, `always_use_package_imports`.

### Rules deliberately excluded, with the stated reason

| Excluded rule | Reason given |
|---|---|
| `always_specify_types` | Incompatible with `omit_local_variable_types` |
| `prefer_double_quotes` | Incompatible with `prefer_single_quotes` |
| `prefer_relative_imports` | Incompatible with `always_use_package_imports` |
| `prefer_final_parameters` | Incompatible with `avoid_final_parameters` |
| `unnecessary_final` | Incompatible with `prefer_final_locals` |
| `avoid_null_checks_in_equality_operators` | Deprecated, removal planned (dart-lang/sdk #59514) |
| `library_names`, `package_prefixed_library_names` | Superseded by `unnecessary_library_name` (dart-lang/lints #172) |
| `close_sinks` | False positives (dart-lang/linter #1381) |
| `use_decorated_box` | Malfunctions (#3286) |
| `prefer_void_to_null` | False positives (#4758) |
| `omit_obvious_property_types` | Incompatible with `type_annotate_public_apis` (#60642) |
| `avoid_implementing_value_types` | VGV needs to implement value types for test mocks/fakes |
| `annotate_redeclares`, `avoid_futureor_void`, `unsafe_variance`, `unnecessary_async`, `omit_obvious_local_variable_types`, `specify_nonobvious_local_variable_types` | Marked **experimental** |

The takeaway is broader than the table: dart.dev states it plainly — *"Linter rules can
have false positives, and they don't all agree with each other."* Choosing a set is a
team decision. What matters is **intra-project consistency** plus the three `strict-*`
analyzer modes, whichever set you pick.

## Minimal `analysis_options.yaml`

```yaml
include: package:lints/recommended.yaml   # or very_good_analysis/analysis_options.yaml

analyzer:
  language:
    strict-casts: true       # forbid implicit casts from dynamic
    strict-inference: true   # flag inference falling back to dynamic
    strict-raw-types: true   # flag raw generics
  exclude:
    - '**.g.dart'            # generated code
linter:
  rules:
    prefer_final_locals: true
    # public_member_api_docs: false   # targeted opt-out
```

The three `strict-*` modes sit at the **analyzer** level, not the lint level. They are
the principal lever for eliminating implicit `dynamic`, and lints alone will not do it.
**[OFFICIAL]**

## Dart 3.0 language breaking changes

- Classes can **no longer be used as a mixin** by default — the `mixin class` (or
  `mixin`) modifier is required. Inherited anti-pattern: mixing in an ordinary class.
- `switch` `case`s are now interpreted as **patterns**, not constant expressions → rule
  `invalid_case_patterns` detects ambiguous code. A `continue` may only target a
  loop/switch label.
- `:` as the separator for a named parameter's default value is an **error** — use `=`.

**[OFFICIAL]** (dart.dev/changelog, dart-3-migration)

## `_` is non-binding since Dart 3.7

Variables and parameters named `_` are **non-binding**: they can no longer be read or
referenced. This is intentional — it aligns with pattern wildcards. Inherited
anti-pattern: depending on a parameter named `_`. Lint `unnecessary_underscores`
(recommended 6.0) accompanies the change. **[OFFICIAL]**

## Lints removed or replaced in Dart 3.x

- `iterable_contains_unrelated_type` and `list_remove_unrelated_type` **removed** →
  replaced by the broader `collection_methods_unrelated_type`.
- `avoid_null_checks_in_equality_operators` **deprecated** (removal planned). Corollary:
  stop writing a manual null test inside `operator ==` — the parameter is non-nullable
  `Object`.
- Removed at the Dart 3 migration, all obsolete under sound null safety: `avoid_as`,
  `enable_null_safety`, `invariant_booleans`, `prefer_bool_in_asserts`, `super_goes_last`,
  `always_require_non_null_named_parameters`, `avoid_returning_null`,
  `avoid_returning_null_for_future`.

**[OFFICIAL]** (changelog + dart-lang issues)

## Fine-grained deprecation *(Dart 3.10)*

`@Deprecated.extend()`, `@Deprecated.implement()` and `@Deprecated.subclass()` deprecate a
**specific use** (extension / implementation / subclassing) without deprecating the whole
class. A `remove_deprecations_in_breaking_versions` lint accompanies them. An emerging
good practice for library API evolution.

**Confidence: Medium** — recent feature, documented in the "Announcing Dart 3.10" blog
post. Treat as *recent*, not as long-settled practice.

## Features that must not be presented as stable

- **Primary constructors** — documented as an **experimental** language feature
  (dart.dev/language/primary-constructors; the 3.12 "What's new" page calls them
  "experimental primary constructors"). Do not generate code relying on them without an
  experiment flag.
- **Private named parameters** — documented as a new feature in the 3.12 cycle. Check the
  minimum language version before use.
- Experimental lints: `unsafe_variance`, `avoid_futureor_void`, `unnecessary_async`,
  `annotate_redeclares`.

**Confidence: Medium** — these are in flux. Marked `[EXPERIMENTAL]`.

## Dated sources to discount

The RydMike linting comparison (December 2023) remains useful for its **methodology** of
comparing rulesets (supersets, coverage percentages) but predates several major versions
(`lints` 5.x/6.x, `very_good_analysis` 6→10). Do not reuse its rule counts or version
numbers as current.
