---
name: rust-errors
description: |
  Failure in Rust — returning `Result` vs panicking, the `unwrap`/`expect` discipline, the error
  *type* (`thiserror` enum for a library vs `anyhow` for a binary), `?` propagation and conversion,
  error-message style, and testing the failure paths.
  Use when choosing between returning an error and panicking; when an `.unwrap()` or `.expect()` is
  in question; when defining a crate's `Error` type or reaching for `thiserror`/`anyhow`; when a
  `?` needs a `From` conversion between error types; when writing or wording an error message,
  including its casing and end-punctuation convention; when deciding where the `Error`/`Result`
  types live; or when a function's `Err` arms need tests.
---

# Rust errors

Reference: **edition 2024** (Rust ≥ 1.85) · `thiserror` 2.x · `anyhow` 1.x — **[VERIFY per toolchain]**.

This skill owns the **failure type and policy**. The signature that returns it is `rust-api-design`;
threading `?` through a happy path is `rust-idioms`; a panic crossing an FFI boundary is
`rust-unsafe`; the test harness that runs the error tests is `rust-project`.

## Rules that decide most failures

1. **Return `Result` for anything a caller or the outside world can cause. Never panic on user
   input.** `[APOLLO 4.1]` `[CANONICAL]` *"A program a user can easily crash is not a good
   program."* Panic is for **unrecoverable programmer error** — a violated invariant you established —
   not for a missing file, bad parse or failed request.
2. **`unwrap`/`expect` only in tests, or in a tiny scope where an `Err` would be your own bug.**
   `[APOLLO 4.2]` `[CANONICAL]` In library and application code, replace `.unwrap()` with `?` or
   `if let`. When you must assert an invariant, use `.expect("invariant: …")` stating *why it holds* —
   a bare `.unwrap()` gives a panic with no explanation.
3. **Library errors are concrete and enumerated; binary errors are type-erased.** `[APOLLO 4.3/4.4]`
   `[CANONICAL]` `[MS]` A **library** defines an `enum Error` with `thiserror` so callers can `match`
   on the failure — *type-erased errors must not be used in library crates*. A **binary/application**
   uses `anyhow` (`anyhow::Result<T>`) and attaches `.context(...)` — the top of the program only
   reports, it does not inspect.
4. **Propagate with `?`; convert foreign errors early.** `[APOLLO 4.5]` `[CANONICAL]` `?` converts via
   `From`, so a `#[from]` variant on your enum lets a foreign error flow with one character. Convert
   an external crate's error into your type *at the earliest reasonable point*, not three layers up.
5. **Test the failure paths.** `[APOLLO 4.6]` A function that returns `Result` has `Err` arms that are
   part of its contract — a suite that only exercises `Ok` proves half the function. (Writing the
   test is `rust-project`; that the errors *must* be tested is here.)
6. **One `Error` type, in a standard place.** `[CANONICAL structural]` Define `Error` and the crate's
   `Result` alias in `lib.rs` (library) or a dedicated `error.rs` (binary) at the crate root, so
   every module refers to the same type.

## Library vs binary — the split

| | Library crate | Binary / application |
|---|---|---|
| Crate | `thiserror` | `anyhow` (or `eyre`) |
| Shape | `enum Error { … }`, one variant per failure mode | opaque `anyhow::Error`, chained context |
| Caller can `match`? | **yes** — that's the point | no — it only reports |
| `?` conversion | `#[from]` on variants | automatic (any `E: Error` into `anyhow::Error`) |
| Adds context via | a variant that wraps `source` | `.context("while doing X")` |

```rust
// library: enumerate, keep source, hide internals   [APOLLO 4.3] [CANONICAL]
#[derive(Debug, thiserror::Error)]
#[non_exhaustive]
pub enum Error {
    #[error("cannot read config at {path}")]
    Read { path: PathBuf, #[source] source: std::io::Error },
    #[error("invalid port {0}")]
    InvalidPort(u16),
    #[error("internal error")]
    Internal(#[from] InternalError),   // conceals implementation-detail deps
}
pub type Result<T> = std::result::Result<T, Error>;
```

```rust
// binary: erase and contextualise   [APOLLO 4.4]
fn main() -> anyhow::Result<()> {
    let cfg = load_config(&path).with_context(|| format!("cannot start with {path:?}"))?;
    run(cfg)?;
    Ok(())
}
```

Use `#[from]` only where the conversion is unambiguous; when two variants could accept the same
foreign error, convert explicitly with `.map_err(...)` so the right variant is chosen.

## The `unwrap`/`expect` ladder

`[CANONICAL]` `[APOLLO 4.2]` — from best to worst:

1. **`?`** — propagate. The default.
2. **`if let Ok(x)` / `let Ok(x) = … else`** — handle the one arm you care about.
3. **`.expect("invariant: X holds because Y")`** — assert an invariant you just established, message
   states why it cannot fail.
4. **`.unwrap()`** — only in a test, or a throwaway where a panic *is* the correct trace.

A `.unwrap()` on a `Result` whose `Err` a user can trigger is a crash waiting to happen; the fix is
almost always `?`.

## Error-message style

`[CANONICAL error-and-panic]` — messages users read, so they are engineered:

- **Start with a verb, usually `cannot`** — *"cannot open database at {path}"*, not *"database
  error"*. Consistent phrasing (`cannot foo the bar`) makes failures predictable.
- **Lowercase** except acronyms and proper names (`TCP`, `NixOS`); **concise** — every second reading
  a muddy error is friction.
- **Don't repeat context that bubbles up.** Each layer adds *its* context; restating the inner
  message duplicates it in the final chain.
- **Wrapped cause goes in a `source` field**; an unrecoverable condition captured as text goes in a
  field named `reason: String`. Hide implementation-detail dependencies behind an `Internal` variant
  so they are not part of your public error surface.
- **Panic messages for programmer faults start with `internal error:`** — it signals the fault is in
  the code, not the caller.

## Symptom index

| Symptom | Likely cause |
|---|---|
| A binary panics on a bad file / bad input | `.unwrap()` where `?` + `Result` belonged `[APOLLO 4.1]` |
| Callers of a library can't tell failures apart | Type-erased error (`anyhow`/`Box<dyn Error>`) in a **library** `[APOLLO 4.3]` |
| `?` fails to compile: "the trait `From<X>` is not implemented" | Missing `#[from]` variant or an explicit `.map_err` |
| Error chain repeats the same sentence at each layer | Context restated instead of added `[CANONICAL]` |
| Panic with no explanation | Bare `.unwrap()` where `.expect("invariant: …")` was due |
| Internal dependency types leak into the public API | No `Internal` variant hiding them `[CANONICAL]` |
| Foreign error type spreads through the codebase | Not converted to the crate's `Error` early `[APOLLO 4.5]` |

## Seams

| Neighbouring subject | Owner | Where the seam falls |
|---|---|---|
| The **signature** that returns `Result<T, MyError>`, `#[must_use]`, `TryFrom` | `rust-api-design` | Declaring the return is there; **defining `MyError` and the panic policy** is here |
| Threading `?` through an ordinary happy-path body, `Option` combinators | `rust-idioms` | The mechanics of `?`/`map`/`ok_or` are there; the error *type* and *when to panic* are here |
| A panic **crossing an FFI boundary**, `catch_unwind`, `panic = "abort"` soundness | `rust-unsafe` | Choosing to `Result` vs panic is here; unwinding across `extern "C"` being UB is there |
| Task panics, `JoinError`, cancellation as an error, error propagation across `.await` | `rust-concurrency` | The error *type* is here; what a panicking task does to a runtime is there |
| **Writing** the `#[test]` that exercises an `Err`, `#[should_panic]`, the harness | `rust-project` | That errors must be tested is here; how the test is written and run is there |
| A `RefCell` `borrow_mut` panicking (`BorrowMutError`), interior mutability as a mechanism | `rust-ownership-tools` | The panic-vs-`Result` **policy** is here; the runtime-borrow **mechanism** that turns a compile error into a panic is there |

## Name the silence

- **The three sources agree on the shape (concrete for libraries, erased for binaries) but name
  different crates in passing.** `thiserror`/`anyhow` are the de-facto pair `[MODEL]`; `snafu` and
  `eyre` exist and are not wrong. This skill defaults to `thiserror`/`anyhow` and says so, rather
  than presenting the default as the only option.
- **No prescription on `panic = "abort"` vs unwind for a given project** — it is a build/deployment
  trade-off (smaller binary and no unwinding vs recoverable panics and `catch_unwind`). The choice is
  named in `references/error-types.md`; the decision is the project's, not this skill's.

## References

- [`references/error-types.md`](references/error-types.md) — `thiserror` attributes (`#[error]`,
  `#[from]`, `#[source]`, transparent), `anyhow` context and downcasting, the `Result` alias and
  where `Error` lives, `main` returning `Result`, `#[non_exhaustive]` on error enums, panic strategy
  (unwind vs abort) and `catch_unwind`'s limits, and how to test an `Err` path. It does **not** cover
  the FFI unwinding rule (`rust-unsafe`) or async task failure (`rust-concurrency`).
