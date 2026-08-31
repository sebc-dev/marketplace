---
name: rust-project
description: |
  Proving and organising a Rust project — tests (unit, integration, doc, snapshot with `insta`),
  clippy and lint discipline, `rustfmt`, profiling with `cargo flamegraph`, cargo workspace and
  module structure, import and item ordering, doc comments, and choosing dependencies. The home
  for the tooling and layout around the code, not the code inside a function body.
  Use when writing or organising a test, or reaching for `#[test]`/`tests/`/doc-tests/`insta`; when
  a static-analysis or lint tool reports findings on the code, or running or configuring `cargo
  clippy`, or tempted by `#[allow]`; when enforcing an automatic, uniform formatting style with
  `rustfmt`; when a hot path needs profiling; when laying out modules, `mod.rs`, a workspace or the
  import blocks, including where binding or low-level code sits in the tree; when ordering items,
  derives or fields; when writing doc comments; or when adding, selecting the enabled features of,
  or auditing a dependency.
---

# Rust project

Reference: **edition 2024** (Rust ≥ 1.85) · clippy · `cargo flamegraph` · `insta` — **[VERIFY per toolchain]**.

This is the broadest of the seven and the home of *everything that proves and organises code you wrote
elsewhere*. Writing the code is `rust-idioms`; its signature is `rust-api-design`; its error type is
`rust-errors`. "How do I test / lint / lay out / profile X" lands here.

## Rules that decide most projects

1. **Run `cargo clippy`, and fix warnings — don't silence them.** `[APOLLO Ch2]` `[CANONICAL]` A
   warning is a defect the compiler found for free. `#[allow(...)]` is a last resort that carries a
   `// reason:` and is scoped as narrowly as possible; a crate-wide `#![allow(clippy::all)]` throws
   the tool away. Configure lints once, in `Cargo.toml`'s `[lints]` table (or `[workspace.lints]`), so
   every crate shares them.
2. **`cargo fmt` is the format — never hand-align.** `[MODEL]` `[CANONICAL cosmetic]` rustfmt is
   canonical; formatting is not a matter of taste and not worth a review comment. Check it in CI with
   `cargo fmt --check`.
3. **A `SHALL`-level test for each behaviour, at the right layer.** `[APOLLO Ch5]` Unit tests live in a
   `#[cfg(test)] mod tests` beside the code; integration tests in `tests/` exercise the public API;
   **doc tests** in `///` examples keep the docs true by compiling and running; snapshot tests
   (`insta`) pin large or evolving output. Tests are living documentation — name them for the
   behaviour they prove.
4. **Comments say *why*; doc comments document the public API.** `[APOLLO Ch8]` `[CANONICAL]` `///`
   documents an item, `//!` a module/crate; a `# Examples` block becomes a doc test. A comment that
   restates the code ("increment i") is clutter — delete it or replace it with a clearer name. A
   `TODO` becomes a tracked issue, not a permanent resident.
5. **Structure is public-first and predictable.** `[CANONICAL structural/ordering]` `mod.rs` files are
   module declarations only; within a file the most public, most important items come first and
   helpers below; `Error`/`Result` live at the crate root (`lib.rs` or `error.rs`). Split into a
   **workspace** when one crate grows several independently useful pieces.
6. **Measure before you optimise.** `[APOLLO 3.1]` Reach for `cargo flamegraph` (or a benchmark) to
   find the real hot path; do not restructure code, add `unsafe`, or hand-tune on a guess. The
   allocation-avoiding *mindset* is `rust-idioms`; the *measurement* that justifies a change is here.

## Test layers

`[APOLLO Ch5]` `[MODEL]`

| Layer | Where | Sees | Use for |
|---|---|---|---|
| Unit | `#[cfg(test)] mod tests` in the same file | private items | logic of one function/type |
| Integration | `tests/*.rs` (each file is its own crate) | only the public API | the crate as a user calls it |
| Doc | `///` fenced code with `# Examples` | the public API | examples that must stay true |
| Snapshot | `insta` (`assert_snapshot!`) | any output | large/evolving output, review-on-change |

```rust
/// Adds two ports, saturating at the maximum.
///
/// # Examples
/// ```
/// # use mycrate::add_ports;
/// assert_eq!(add_ports(65_000, 1_000), u16::MAX);
/// ```
pub fn add_ports(a: u16, b: u16) -> u16 { a.saturating_add(b) }

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn saturates_instead_of_wrapping() { assert_eq!(add_ports(u16::MAX, 1), u16::MAX); }
}
```

`assert_eq!`/`assert!` carry a message for the failure; `insta` records a `.snap` file you review and
`cargo insta accept` when the change is intended. Detail — `insta` workflow, fixtures, `proptest`,
error-path tests, `#[should_panic]` — is in [`references/testing.md`](references/testing.md).

## Clippy, fmt and dependencies

`[APOLLO Ch2]` `[MS Project]` `[MODEL]`

- **Lint config in one place** — `Cargo.toml [lints.clippy]` / `[workspace.lints]`, e.g. deny
  `unwrap_used` in libraries, warn on `undocumented_unsafe_blocks`. A scattered `#![deny]` in each
  `lib.rs` drifts between crates.
- **`#[allow]` states a reason and is scoped tight** — on the item, not the crate. An allow with no
  reason is a silenced defect (`rust-errors` and `rust-unsafe` both depend on lints staying on).
- **Audit a dependency before adding it** — prefer `std`; weigh maintenance, transitive weight and
  `unsafe` surface; run `cargo-deny`/`cargo audit` for advisories and licences. A dependency is a
  permanent liability, not a free function.

Structure, imports and ordering — `mod.rs` layout, the three import groups (std / third-party /
local), no glob imports, derive and field ordering — are in
[`references/tooling-and-structure.md`](references/tooling-and-structure.md).

## Symptom index

| Symptom | Likely cause |
|---|---|
| Docs show an example that no longer compiles | Not a doc test — put it in ```` ``` ```` so `cargo test` runs it `[APOLLO Ch8]` |
| clippy findings ignored across the team | No `[lints]` in `Cargo.toml`; each crate configured ad hoc `[APOLLO Ch2]` |
| `#[allow(clippy::all)]` at the crate root | Tool thrown away instead of one lint scoped `[CANONICAL]` |
| Optimised the wrong function | No profile — guessed instead of `cargo flamegraph` `[APOLLO 3.1]` |
| Every diff churns on formatting | rustfmt not enforced (`cargo fmt --check` in CI) |
| Snapshot test fails on every unrelated run | Snapshot captures nondeterministic output (time, hashmap order) — sort/redact it |
| Tests pass alone but fail intermittently when run together | Shared **mutable global state** (`static mut`, a global `Mutex<…>`) — tests run in parallel by default; inject the state instead `[MODEL]` |
| `use foo::*` then a name clash on upgrade | Glob import `[CANONICAL import]` |
| Comments contradict the code | "Living documentation" restating logic — delete/rename `[CANONICAL comment]` |

## Seams

| Neighbouring subject | Owner | Where the seam falls |
|---|---|---|
| Writing cheap code — ownership, iterators, not allocating by reflex | `rust-idioms` | The mindset is there; **the profiler that proves the cost** is here |
| The error **type** and the *rule* that `Err` arms must be tested | `rust-errors` | Defining the error and the policy is there; **writing and running the `#[test]`** is here |
| The public **signature**, `#[must_use]`, semver | `rust-api-design` | Shaping the API is there; documenting, testing and `cargo-semver-checks`-ing it is here |
| `unsafe` and the profile that would justify it | `rust-unsafe` | The soundness proof is there; the flamegraph and Miri run are invoked here |
| tokio-console, async profiling | `rust-concurrency` | The concurrency model is there; running the profiler is here |
| Global mutable state (`OnceLock`/`static`) as a mechanism, dependency injection | `rust-ownership-tools` | The mechanism and the "inject, don't globalise" rule are there; the **parallel-test isolation** it breaks is here |

## Name the silence

- **This plugin has no build/release/CI skill.** Publishing to crates.io, release versioning, and CI
  pipeline authoring are **not** covered by any of the seven skills. `cargo fmt --check` / `clippy` /
  `cargo test` are named as the gates a pipeline runs; wiring the pipeline itself is out of scope and
  said so, not half-answered. `[MODEL]`
- **No coverage threshold is asserted.** Rust has coverage tooling (`cargo llvm-cov`, `-C
  instrument-coverage`) `[MODEL]`; none of the three guides sets a required percentage, and neither
  does this skill. A number presented as a Rust standard is invented.

## References

- [`references/testing.md`](references/testing.md) — the four layers in depth, the `#[cfg(test)]`
  convention, `tests/` and `common/` helpers, doc-test attributes (`no_run`, `ignore`, `compile_fail`,
  hidden `#` lines), the `insta` snapshot workflow and redaction, `proptest`/`quickcheck`,
  error-path and `#[should_panic]` tests, and `cargo nextest`. It does **not** carry the error-type
  design (`rust-errors`).
- [`references/tooling-and-structure.md`](references/tooling-and-structure.md) — `Cargo.toml [lints]`
  and `[workspace.lints]`, clippy lint groups worth denying, `rustfmt`, module/`mod.rs` layout, the
  import blocks and no-glob rule, item/derive/field ordering, workspace layout, `cargo flamegraph`
  and benchmarking, and `cargo-deny`/`cargo audit`. It does **not** carry test authoring
  (`references/testing.md`).
