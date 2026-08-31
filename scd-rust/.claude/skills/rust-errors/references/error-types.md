# Error types

Loaded from `rust-errors` when defining a concrete error type, wiring `anyhow`, or deciding panic
strategy. Carries `thiserror`/`anyhow` mechanics, the `Result` alias and placement, `main`-as-Result,
panic strategy, and testing an `Err` path. It does **not** carry the FFI unwinding rule
(`rust-unsafe`) or async failure (`rust-concurrency`).

- [thiserror attributes](#thiserror-attributes)
- [anyhow: context and downcast](#anyhow-context-and-downcast)
- [The Result alias and where Error lives](#the-result-alias-and-where-error-lives)
- [main returning Result](#main-returning-result)
- [Panic strategy: unwind vs abort](#panic-strategy-unwind-vs-abort)
- [Testing an Err path](#testing-an-err-path)

## thiserror attributes

`[MODEL]` `thiserror` derives `std::error::Error` + `Display` from attributes — no hand-written impl:

```rust
#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error("cannot parse header {name}")]          // Display, with field interpolation
    Header { name: String },

    #[error("io failure")]
    Io(#[from] std::io::Error),                      // From<io::Error>, and #[source] implied

    #[error("upstream")]
    Upstream { #[source] source: reqwest::Error },   // keep the cause without From

    #[error(transparent)]                            // forward Display+source of the inner error
    Other(#[from] anyhow::Error),
}
```

- **`#[from]`** generates `From` (so `?` converts) **and** treats the field as the `source`.
- **`#[source]`** marks the cause for the error chain without generating `From` — use it when two
  variants would otherwise both take the same foreign type (ambiguous `From`).
- **`#[error(transparent)]`** delegates `Display` and `source` to a single wrapped error — for a
  passthrough variant.
- Interpolate fields directly in the message string (`{name}`, `{0}` for tuple variants).

## anyhow: context and downcast

`[MODEL]`

```rust
use anyhow::{Context, Result, bail, ensure};

let data = fs::read(&path).with_context(|| format!("cannot read {path:?}"))?;
ensure!(data.len() > HEADER, "file too short: {} bytes", data.len());   // early Err
if data[0] != MAGIC { bail!("bad magic byte {:#x}", data[0]); }         // return Err now
```

- `.context("…")` eager; `.with_context(|| …)` lazy (builds the string only on error) — prefer lazy
  when the message formats anything.
- Recover a concrete type at the boundary with `err.downcast_ref::<MyError>()` — the escape hatch when
  a binary *does* need to branch on one specific cause.

## The Result alias and where Error lives

`[CANONICAL structural]` Define once at the crate root and re-export:

```rust
// lib.rs (library) or error.rs re-exported from lib.rs/main.rs
pub type Result<T, E = Error> = std::result::Result<T, E>;
```

Now modules write `-> Result<T>`. Put `Error` in `lib.rs` for a library, or a dedicated
`error.rs`/`result.rs` at the crate root for a binary — never scattered per-module. Mark public error
enums `#[non_exhaustive]` so adding a variant is not a breaking change (downstream `match` keeps a
`_`).

## main returning Result

`[MODEL]` `main` can return `Result` — the runtime prints the `Debug` of the error and exits non-zero:

```rust
fn main() -> anyhow::Result<()> { real_main() }   // anyhow's Debug prints the full context chain
```

For a library binary without anyhow, `-> Result<(), Box<dyn std::error::Error>>` works but prints only
the top `Display`; anyhow's `Debug` prints the whole chain, which is why it is the better `main` type.

## Panic strategy: unwind vs abort

`[MODEL]` Set in `Cargo.toml` per profile:

```toml
[profile.release]
panic = "abort"   # smaller binary, no unwinding tables, no catch_unwind
```

- **unwind** (default) — panics run destructors up the stack; `std::panic::catch_unwind` can stop one
  at a boundary. Required if any dependency relies on catching panics.
- **abort** — a panic ends the process immediately. Smaller, faster, but `catch_unwind` cannot
  recover, and a panicking thread takes the whole program.

`catch_unwind` is **not** a general try/catch: it only catches unwinding panics, not aborts, and a
caught panic still ran partial work. Its real use is a hard boundary (a thread/task supervisor, or —
`rust-unsafe` — stopping a panic before it crosses `extern "C"`, where unwinding would be UB).

## Testing an Err path

`[APOLLO 4.6]` `[MODEL]` The `Err` arms are part of the contract:

```rust
#[test]
fn rejects_bad_port() {
    let err = parse_config("port = 99999").unwrap_err();   // unwrap_err is fine in tests
    assert!(matches!(err, Error::InvalidPort(_)));
}

#[test]
#[should_panic(expected = "invariant")]
fn panics_when_invariant_violated() { build_from_unchecked(&[]); }
```

Assert on the **variant** with `matches!`, not on the `Display` string (which is user-facing and may
change). `#[should_panic(expected = "…")]` pins a panic path to a substring of its message.
