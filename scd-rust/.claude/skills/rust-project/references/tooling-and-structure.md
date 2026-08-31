# Tooling and structure

Loaded from `rust-project` when configuring lints/format, laying out modules or a workspace, ordering
items, profiling, or auditing dependencies. It does **not** carry test authoring
(`references/testing.md`) or the error type (`rust-errors`).

- [Lints in Cargo.toml](#lints-in-cargotoml)
- [rustfmt](#rustfmt)
- [Module and mod.rs layout](#module-and-modrs-layout)
- [Import discipline](#import-discipline)
- [Item, derive and field ordering](#item-derive-and-field-ordering)
- [Workspace layout](#workspace-layout)
- [Profiling and benchmarking](#profiling-and-benchmarking)
- [Dependency hygiene](#dependency-hygiene)

## Lints in Cargo.toml

`[APOLLO Ch2]` `[MODEL]` One source of truth, inherited by every crate:

```toml
# workspace root
[workspace.lints.clippy]
unwrap_used = "warn"
undocumented_unsafe_blocks = "deny"
[workspace.lints.rust]
unsafe_op_in_unsafe_fn = "deny"

# each member crate
[lints]
workspace = true
```

**Fix warnings, don't silence them** `[APOLLO 2.4]`. When an `#[allow]` is genuinely right, scope it to
the item and state why:

```rust
#[allow(clippy::too_many_arguments)] // reason: mirrors the C ABI signature exactly
```

Clippy groups worth knowing: `correctness` (deny — likely bugs), `suspicious`, `complexity`,
`perf`, `style`, `pedantic` (opt-in, noisy but instructive), `nursery` (unstable). Deny `correctness`,
consider `pedantic` on a per-lint basis.

## rustfmt

`[MODEL]` `[CANONICAL cosmetic]` `cargo fmt` is canonical; `cargo fmt --check` fails CI on drift. A
`rustfmt.toml` can set `edition`, `max_width`, and (nightly-only) import-grouping options — keep it
small; the default style is the point of a shared formatter.

## Module and mod.rs layout

`[CANONICAL structural]`

- **`mod.rs` holds only module declarations** and re-exports, in public-to-private order, with
  `cfg`-gated items at the end. Logic lives in the sibling files, not `mod.rs`.
- **Prefer the `foo/mod.rs` directory form** over `foo.rs` beside a `foo/` directory — clearer, and
  editors disambiguate it.
- **`Error`/`Result` at the crate root** — `lib.rs` for a library, `error.rs`/`result.rs` for a
  binary — so every module names the same type (the type itself is `rust-errors`).

## Import discipline

`[CANONICAL import]`

- **No glob imports** (`use foo::*`) outside a prelude or a test module — a dependency upgrade can
  introduce a name that silently shadows yours.
- **Three groups**, blank-line separated: `std`/`core`/`alloc`, then third-party crates, then local
  (`crate::`/`super::`/`self::`).
- **Nested form** over one-per-line: `use std::io::{Read, Write, BufReader};`.
- Import child modules through `self::` explicitly to avoid a future dependency-name clash.

## Item, derive and field ordering

`[CANONICAL ordering]`

- Most important items **up**, helpers **below** — top-down reading order.
- `impl MyType` directly **below** the type; trait impls where the trait or type is defined.
- Multiple impl blocks ordered: inherent `impl MyType` first, then `unsafe` trait impls, then safe
  std/custom/third-party traits.
- **One `#[derive(...)]`** with `Copy` first, then std traits alphabetically, then third-party
  alphabetically.
- Struct fields by visibility: `pub`, then `pub(crate)`, then private — consistency over micro-tuning.
- Consecutive declarations: `const`, `static`, `let`, `let mut`, in that order.

## Workspace layout

`[MODEL]` Split into a workspace when a crate holds several independently useful pieces, or when
compile times or a `-sys`/safe-wrapper split call for it:

```toml
[workspace]
members = ["crates/*"]
resolver = "3"                     # edition-2024 default resolver

[workspace.dependencies]           # one version per dep, inherited by members
serde = { version = "1", features = ["derive"] }
```

Members inherit versions with `serde.workspace = true`, so the whole tree agrees on one version — the
main reason to bother with `[workspace.dependencies]`.

## Profiling and benchmarking

`[APOLLO 3.1]` `[MODEL]` `[VERIFY per version]` **Measure before optimising.**

- `cargo flamegraph` (the `flamegraph` cargo subcommand) renders where wall-clock time goes — read the
  wide bars, not the tall stacks. It needs a release build with debug symbols
  (`[profile.release] debug = true`).
- `criterion` for statistically sound microbenchmarks (warm-up, outlier detection); `#[bench]` is
  nightly-only, so `criterion` is the stable choice.
- A change justified by "it's faster" without a before/after number is a guess — and the rule that
  gates `unsafe` for speed (`rust-unsafe`) depends on this measurement existing.

## Dependency hygiene

`[MS Project]` `[MODEL]` `[VERIFY per version]` A dependency is a permanent liability:

- Prefer `std`; weigh maintenance, transitive weight, and `unsafe` surface before adding a crate.
- `cargo audit` (RUSTSEC advisories) and `cargo-deny` (advisories + licences + duplicate versions +
  source allowlist) — run in CI.
- `cargo tree` to see what a new dependency drags in; `cargo update` deliberately, and commit
  `Cargo.lock` for binaries (libraries leave it to the consumer).
