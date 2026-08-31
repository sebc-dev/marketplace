# scd-rust

Idiomatic, sound Rust (edition 2024) skills for Claude Code. Seven skills with **disjoint trigger
scopes**, so a question about a function body never loads the FFI boundary, an error-type question
never loads the async runtime, and a macro question never loads the profiler.

## The seven skills

| Skill | Fires when | Leading question it answers |
|---|---|---|
| **`rust-idioms`** | Writing a function body, borrow-vs-clone-vs-move, a `for` loop vs an iterator chain, threading `Option`/`Result`, an allocation that came too early | "Is this idiomatic, cheap Rust?" |
| **`rust-ownership-tools`** | A plain borrow won't do — shared ownership (`Rc`/`Arc`), mutating through `&self` (`Cell`/`RefCell`), init-once (`OnceLock`/`LazyLock`), cleanup on every exit (`Drop`), a stored/returned closure | "Which mechanism beyond a borrow, and is reaching for it a smell?" |
| **`rust-api-design`** | Designing a public signature, naming a type or trait, `impl Trait` vs `<T: Trait>` vs `dyn`, `From`/`TryFrom`, a builder, type-state, authoring a macro | "What should the interface others call look like?" |
| **`rust-errors`** | `Result` vs panic, an `unwrap`/`expect` in question, defining an `Error` type, `thiserror` vs `anyhow`, a `?` conversion, an error message | "How does this fail, and what type carries the failure?" |
| **`rust-unsafe`** | An `unsafe` block or `fn`, a missing `// SAFETY:`, a raw pointer or `transmute`, calling or exposing C, a `#[repr]` for FFI, `unsafe impl Send`/`Sync` | "Is crossing the safety boundary sound?" |
| **`rust-concurrency`** | `async`/`await`, choosing a runtime, a blocking call on an async thread, `Arc<Mutex<_>>`, a channel, spawning or cancelling tasks, a `Send` future error | "How does this run in parallel without starving or racing?" |
| **`rust-project`** | Writing a test, `cargo clippy`/a lint/`#[allow]`, `rustfmt`, profiling a hot path, module/workspace layout, import and item ordering, doc comments, a dependency | "How do I prove, lint, lay out and profile it?" |

Six seams worth knowing, because they are the ones that would otherwise drift:

- **`rust-idioms` writes cheap code, `rust-project` measures the cost.** The mindset of not allocating
  by reflex is in idioms; the `cargo flamegraph` that proves a hot path lives with the tooling.
- **`rust-idioms` is the default borrow, `rust-ownership-tools` is the escape hatch.** Just borrow,
  clone or move is idioms; the moment a plain borrow won't express the design — shared ownership
  (`Rc`/`Arc`), interior mutability (`Cell`/`RefCell`), a `Drop` guard, a closure — it is
  ownership-tools. And the *cross-task* version (`Arc<Mutex<T>>`, `Send`/`Sync`) is `rust-concurrency`.
- **`rust-api-design` designs the signature, `rust-errors` owns the error type it returns.** A
  function declares `-> Result<T, MyError>` on one side of the seam; *what `MyError` is* and *when to
  panic instead* are on the other.
- **`rust-unsafe` implements `unsafe impl Send/Sync`, `rust-concurrency` satisfies the bounds.** The
  soundness promise of a hand-written thread-safety guarantee is in unsafe; meeting a `T: Send` bound
  with ordinary safe types is in concurrency.
- **A panic policy splits by activity.** *Whether* to return an error or panic is `rust-errors`; a
  panic *unwinding across `extern "C"`* being undefined behaviour is `rust-unsafe`.
- **Testing splits the same way.** The *rule* that a `Result`'s `Err` arms must be tested is
  `rust-errors`; *writing and running* the `#[test]` is `rust-project`.

### `rust-idioms`

Borrow over clone (and the clone-to-satisfy-the-borrow-checker smell), passing by value vs reference,
zero-cost iterator chains over index loops, `copied` vs `cloned`, the `Option`/`Result` combinator
flow with `?`, preventing early allocation (`with_capacity`, `Cow`, stack vs heap), tight mutability
scope, exhaustive pattern matching to catch new fields, and the `entry` map idiom. Also the three moves when
the borrow checker won't budge (restructure, store indices not pointers, separate by phase) before
reaching for an escape hatch.

### `rust-ownership-tools`

The mechanisms beyond a plain borrow, and when reaching for one is a smell: shared ownership (`Rc`
single-thread vs `Arc` across threads, and only when ownership is genuinely shared), interior
mutability (`Cell` for `Copy`, `RefCell` for the rest, and the `BorrowMutError` runtime-panic trap),
one-time initialisation (`OnceLock`/`LazyLock` over a mutable global that breaks test isolation),
`Drop`/RAII guards (return-to-pool, rollback-unless-committed, the `Option::take()` idiom, why `Drop`
can't be fallible), the `Box`/`Rc`/`Arc`/`Cow` selection, and closures (`Fn`/`FnMut`/`FnOnce`, capture
and `move`, `impl Fn` vs `Box<dyn Fn>`, `Send + Sync` on stored closures). **Barely touched by the
three source guides** — model knowledge, grounded in the std docs, and says so.

### `rust-api-design`

Accept-general-return-specific, static vs dynamic dispatch and object safety, the std conversion
traits (`From`/`TryFrom`/`AsRef`/`Borrow`), the orphan rule and the newtype pattern, `#[must_use]` and
`#[non_exhaustive]`, sealed traits, builders, the type-state pattern for compile-time state machines,
and authoring `macro_rules!` and proc-macros — with the standing preference for a generic over a
macro.

### `rust-errors`

`Result` over panic and never panicking on user input, the `unwrap`/`expect` ladder, the
library-vs-binary split (`thiserror` enum you can `match` vs type-erased `anyhow`), `?` propagation and
`#[from]` conversion, the Canonical error-message style (verb-first, lowercase, `source`/`reason`
fields, an `Internal` variant hiding dependencies), where `Error`/`Result` live, panic strategy
(unwind vs abort) and `catch_unwind`'s limits, and testing the failure paths.

### `rust-unsafe`

The `unsafe fn`-vs-`unsafe {}` direction, minimising unsafe and its scope, the "faster isn't a
justification" rule, the mandatory `// SAFETY:` and what makes one prove anything, the sources of
undefined behaviour (data races, dangling pointers, aliasing, invalid values, FFI unwinding), raw
pointers, `MaybeUninit` and `transmute` alternatives, the C/FFI boundary (`extern "C"`, `#[repr(C)]`,
`CStr`/`CString`, ownership, `bindgen`/`cbindgen`), implementing `Send`/`Sync` by hand, and running
Miri.

### `rust-concurrency`

The blocking-in-async trap and `spawn_blocking`/`rayon`, choosing and configuring tokio, not holding a
`!Send` value across `.await`, `std` vs `tokio` mutex, the channel families (`mpsc`/`oneshot`/
`broadcast`/`watch`) and back-pressure, structured concurrency with `JoinSet`, cancellation as `drop`
and `select!` cancellation safety, timeouts and `Stream`, async traits and `Send` futures, and
`tokio-console`. **Not covered by any of the three source guides** — model knowledge, pinned to
tokio 1.x.

### `rust-project`

The four test layers (unit / integration / doc / snapshot with `insta`), the `#[cfg(test)]`
convention, doc-test attributes, `proptest` and error-path tests, `cargo clippy` with lints
configured once in `Cargo.toml [lints]` and `#[allow]` scoped-with-a-reason, `rustfmt`, module and
`mod.rs` layout, the import blocks and no-glob rule, item/derive/field ordering, workspace layout,
`cargo flamegraph` and `criterion`, and dependency hygiene (`cargo audit`/`cargo-deny`).

## Sourcing discipline

Every claim carries its authority:

- **`[MS]`** — Microsoft, *Pragmatic Rust Guidelines*
  (<https://microsoft.github.io/rust-guidelines/>)
- **`[CANONICAL]`** — Canonical, *Rust Best Practices*
  (<https://github.com/canonical/rust-best-practices>)
- **`[APOLLO]`** — Apollo, *Rust Best Practices* (chapters Ch1–Ch9)
  (<https://github.com/apollographql/rust-best-practices>)
- **`[MODEL]`** — model knowledge, where the three guides are silent; used with `[VERIFY per
  toolchain]` / `[VERIFY per version]` for anything version-dependent.

Two consequences worth knowing:

- **Every skill names its silences.** Where the guides prescribe nothing, the skill says so rather
  than filling the hole by inference. The largest standing silence: **none of the three guides covers
  async or concurrency** — `rust-concurrency` is entirely `[MODEL]`, and says so at the top and in its
  *Name the silence*. The guides are likewise **thin on interior mutability, RAII and closures**, so
  `rust-ownership-tools` is largely `[MODEL]` too, grounded in the std docs. There is also **no
  build/release/CI skill**: publishing to crates.io and pipeline authoring are out of scope and said
  so, not half-answered.
- **No unsourced performance figures.** "Iterators are zero-cost" is a compilation guarantee, not a
  benchmark; any *number* about a cost must come from a profile (`rust-project`), never from prose.

Supporting canonical references pinned across the skills: the Rust API Guidelines
(<https://rust-lang.github.io/api-guidelines/>), the standard library docs
(<https://doc.rust-lang.org/std/>), the Rustonomicon (<https://doc.rust-lang.org/nomicon/>) and the
tokio docs (<https://docs.rs/tokio>).

## Reference versions

**Edition 2024** (Rust ≥ 1.85) · `thiserror` 2.x · `anyhow` 1.x · `tokio` 1.x · `insta`, `clippy`,
`cargo flamegraph` at their current releases. The exact toolchain is read from `rustc --version` /
`rust-toolchain.toml`. Version-dependent claims are marked `[VERIFY per toolchain]` or `[VERIFY per
version]` rather than restated as settled.

## Install

```bash
/plugin install scd-rust@sebc-dev-marketplace
```

## License

MIT
