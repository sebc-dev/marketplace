# Testing

Loaded from `rust-project` when authoring or organising tests. Carries the four layers, the
`#[cfg(test)]` convention, `tests/` helpers, doc-test attributes, the `insta` workflow,
property testing, error-path tests, and `nextest`. It does **not** carry error-type design
(`rust-errors`) or lint/format/structure (`references/tooling-and-structure.md`).

- [Unit tests and the cfg(test) convention](#unit-tests-and-the-cfgtest-convention)
- [Integration tests and shared helpers](#integration-tests-and-shared-helpers)
- [Doc tests and their attributes](#doc-tests-and-their-attributes)
- [Snapshot testing with insta](#snapshot-testing-with-insta)
- [Property and error-path tests](#property-and-error-path-tests)
- [Running: cargo test and nextest](#running-cargo-test-and-nextest)

## Unit tests and the cfg(test) convention

`[APOLLO Ch5]` `[MODEL]` Unit tests sit in the file they test, gated so they don't ship:

```rust
#[cfg(test)]
mod tests {
    use super::*;                       // pull the module's items into scope
    #[test]
    fn parses_valid_input() { assert_eq!(parse("42").unwrap(), 42); }
}
```

`#[cfg(test)]` compiles the module only under `cargo test`. Unit tests may reach private items — that
is their advantage over integration tests. Name the test for the behaviour proved, not the function
called (`rejects_empty_name`, not `test_parse`).

## Integration tests and shared helpers

`[APOLLO 5.3]` `[MODEL]` Each file in `tests/` is compiled as a **separate crate** that sees only the
public API — the same view a user has. Shared setup goes in a submodule, not a top-level file (which
would itself be run as a test crate):

```
tests/
  api.rs            # a test crate
  cli.rs            # another test crate
  common/mod.rs     # shared helpers — `mod common;` from each test file
```

Put `common` under a subdirectory (`common/mod.rs`) so the harness does not treat it as its own test
crate.

## Doc tests and their attributes

`[APOLLO Ch8]` `[MODEL]` A fenced block in a `///` comment is compiled and run by `cargo test`, which
is what keeps examples honest. Control it with fence annotations:

| Annotation | Effect |
|---|---|
| ```` ```rust ```` (or bare) | compile **and** run (the default) |
| ```` ```no_run ```` | compile only — for examples that would do I/O or network |
| ```` ```ignore ```` | neither compile nor run — last resort, mark why |
| ```` ```compile_fail ```` | assert the example **fails** to compile (proves a bound holds) |
| ```` ```should_panic ```` | assert it panics |

Lines starting with `#` are hidden from the rendered docs but still compiled — use them for imports
and setup so the visible example stays minimal:

```rust
/// ```
/// # use mycrate::Config;
/// let c = Config::builder().port(8080).build()?;
/// # Ok::<(), mycrate::Error>(())
/// ```
```

## Snapshot testing with insta

`[APOLLO 5.5/5.6]` `[MODEL]` `[VERIFY per version]` For output too large or too evolving to assert by
hand — rendered text, serialised structures, error displays:

```rust
insta::assert_snapshot!(render(&doc));          // text
insta::assert_debug_snapshot!(parse(input));    // Debug form
insta::assert_json_snapshot!(&value);           // serde JSON
```

First run writes a `.snap.new`; `cargo insta review` (or `cargo insta accept`) promotes it to the
committed `.snap`. The snapshot is reviewed like code — a diff on an intended change is accepted, an
unexpected diff is a caught regression. **Redact nondeterminism** (timestamps, UUIDs, hashmap order)
with `insta`'s redactions or by sorting before asserting, or the test flaps.

## Property and error-path tests

`[APOLLO 4.6]` `[MODEL]`

- **Error paths** — a `Result` function's `Err` arms are contract; assert on the **variant**, not the
  `Display` string: `assert!(matches!(err, Error::InvalidPort(_)))`. `#[should_panic(expected = "…")]`
  pins a panic to a message substring. (`.unwrap()`/`.unwrap_err()` are fine *in tests* — the panic's
  trace points at the failing line.)
- **Property testing** — `proptest` / `quickcheck` generate many inputs against an invariant
  (`parse(render(x)) == x`), shrinking a failure to a minimal case. Reach for it when the input space
  is large and a few examples cannot cover it.

## Running: cargo test and nextest

`[MODEL]` `[VERIFY per version]` `cargo test` runs unit + integration + doc tests. `cargo nextest run`
is a faster runner with better output and per-test isolation — but it does **not** run doc tests, so
keep `cargo test --doc` in CI alongside it. Run a subset by name substring (`cargo test parse`), and
`-- --nocapture` to see `println!` from passing tests.
