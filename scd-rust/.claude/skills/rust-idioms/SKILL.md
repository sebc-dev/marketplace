---
name: rust-idioms
description: |
  Idiomatic Rust in the small — ownership, borrowing, iterators and the Option/Result flow that
  make a function body cheap and clear, plus the perf mindset of not allocating by reflex. The
  default home for any everyday choice inside a function body, however small or basic.
  Use when writing or reviewing the body of a function; when deciding to borrow, clone or move a
  value; when a `.clone()` appears only to satisfy the borrow checker; when choosing between a
  `for` loop and an iterator chain; when collecting, filtering, flattening or folding a sequence
  of values; when threading `Option`/`Result` through a computation; when matching on an enum,
  grouping match arms, ignoring a binding or destructuring a tuple; or when a `Vec`/`String`/`Box`
  is allocated earlier or more often than it needs to be.
---

# Rust idioms

Reference: **edition 2024** (Rust ≥ 1.85) · exact toolchain from `rustc --version` / `rust-toolchain.toml` — **[VERIFY per toolchain]**.

This skill writes the **body**. The signature others call is `rust-api-design`; the failure type is
`rust-errors`; *measuring* the cost of what you write here is `rust-project`.

## Rules that decide most bodies

1. **Borrow over clone. A `.clone()` that only exists to satisfy the borrow checker is a
   defect, not a fix.** `[APOLLO 1.1/3.2]` `[CANONICAL code]` — restructure the scope or the
   lifetime first; clone a heap-owning type (`String`, `Vec`, `Box`, `Arc` payload) only when you
   genuinely need a second owned value. The **symptom** is a body speckled with `.clone()` where a
   `&` would type-check after a small reorder. `Arc::clone(&x)` is cheap and intentional; `x.clone()`
   on a `String` is a fresh allocation.
2. **Pass by value only to move ownership or for a `Copy` type.** `[APOLLO 1.2]` Take `&T` to read,
   `&mut T` to mutate in place, `T` to consume. A `fn(v: Vec<T>)` that only reads should be
   `fn(v: &[T])`; a `fn(s: String)` that only reads should be `fn(s: &str)`.
3. **Iterators are zero-cost — reach for the adapter chain, not the index loop.** `[APOLLO 3.4/1.5]`
   `for i in 0..v.len() { v[i] }` is bounds-checked on every access and reads worse than
   `for x in &v`. Prefer `.iter()`/`.map()`/`.filter()`/`.sum()` and let the optimiser flatten it.
   Use `.collect()`, never `FromIterator::from_iter()` `[CANONICAL code]`.
4. **Thread `Option`/`Result` with combinators and `?`, not nested `match`.** `[APOLLO 1.3]`
   `x.map(f).and_then(g).ok_or(e)?` over three levels of `match`. Use `let ... else` to bail early and
   `if let` for a single arm. Reserve `match` for genuinely multi-way branching.
5. **Do not allocate before you must.** `[APOLLO 1.4]` `[CANONICAL code]` `Vec::new()` for an empty
   vector; `Vec::with_capacity(n)` when `n` is known — pushing into a default `Vec` in a sized loop
   reallocates repeatedly. Accept `&str`/`&[T]` at the boundary and let the caller decide to own.
6. **Scope mutability tightly.** `[CANONICAL code]` Prefer an expression `let x = { ... };` over a
   loosely-scoped `let mut x;` filled in later. An unassigned `let` then assignment is a body that
   should have returned a value from a block.

## Borrow vs clone vs move — the decision

| You need | Take / return | Not |
|---|---|---|
| Read a string | `&str` | `String` / `&String` |
| Read a sequence | `&[T]` | `Vec<T>` / `&Vec<T>` |
| Mutate in place | `&mut T` | return a rebuilt `T` |
| Consume / transform | `T` by value | `&T` then `.clone()` inside |
| Share read-only across threads/tasks | `Arc<T>`, cloned | deep `.clone()` per holder |
| A second independent owned value | `.clone()` (say why) | — |

*"Prevent early allocation"* and *"avoid redundant cloning"* are the two levers `[APOLLO 3.2/3.3]`:
prefer stack-sized values, and reach for the heap (`Box`, `Vec`, `String`) only when the size is
dynamic or the value must outlive its frame. `Box` a value to move it to the heap or to erase a type
behind `dyn` — not to "make it lighter".

## When the borrow checker won't budge

`[MODEL]` A *cascade* of borrow errors — each fix spawning the next — is a signal that the
**structure** is wrong, not that you need one more `.clone()`, an `Rc`, or an `unsafe`. Three moves
resolve most of them without any of those:

1. **Restructure the scope or lifetime** before cloning — a `.clone()` that exists only to satisfy the
   checker is the defect (rule 1), not the fix.
2. **Store indices or keys, not pointers or references, into a collection you own and may mutate.** A
   struct cannot own a `Vec` *and* hold a reference into it (self-referential borrows don't compile,
   and would freeze the `Vec` if they did); a `*const T` into a `Vec` dangles the instant it
   reallocates. An integer index survives a re-grow — it is the correct handle.
3. **Separate by phase** when a method holds `&mut self` and needs `&self` data mid-way: finish one
   borrow before starting the next by materialising an intermediate (tokenise → resolve → evaluate),
   rather than reaching for a `RefCell`.

Reaching for shared ownership (`Rc`), interior mutability (`RefCell`) or `unsafe` to end the fight is
`rust-ownership-tools`' territory — and usually the escape hatch, not the answer.

## The iterator body

```rust
// index loop: bounds-checked, noisy, easy to get wrong
let mut total = 0;
for i in 0..items.len() {
    if items[i].active { total += items[i].weight; }
}

// adapter chain: same machine code, one statement, no indices  [APOLLO 3.4]
let total: u32 = items.iter().filter(|it| it.active).map(|it| it.weight).sum();
```

- **`.copied()` for `Copy`, `.cloned()` for the rest** — `.iter().copied()` on `&i32` avoids the
  `.clone()` call entirely; reserve `.cloned()` for owned heap types you actually need copied.
- **Collect once, at the end.** `.collect::<Vec<_>>()` then iterating again allocates a whole vector
  you may not need — keep the chain lazy and `collect` only where an owned collection is the output.
- **Return `impl Iterator`** from a helper to keep it lazy; return `Vec<T>` only when the caller
  needs to own or index the result. Turning a lazy chain into an eager `Vec` is a silent allocation.

## Pattern matching in a body

`[CANONICAL pattern-matching]`, all four with observable payoff:

1. **Match exhaustively on your own structs/enums to make the compiler flag new fields.** A `match`
   with `..` or a catch-all `_` on a type you own goes silently stale when a variant is added —
   name every field so adding one breaks the build where it must.
2. **Don't pattern-match a reference to a `Copy` type** — dereference it: `let x = *pair.0` reads
   better than binding through `&`.
3. **Avoid numeric tuple indexing (`.0`, `.1`) past the trivial** — destructure into named bindings.
4. **Unpack a pattern parameter on the first line of the body, not in the signature** — the signature
   states the type; the body names the parts.

## Symptom index

| Symptom | Likely cause |
|---|---|
| `.clone()` sprinkled to make it compile | Borrow/lifetime confusion — restructure, don't clone `[APOLLO 1.1]` |
| Profiler shows time in `alloc`/`memcpy` on a hot path | Redundant clone or eager `collect` in a loop `[APOLLO 3.2]` |
| `for i in 0..v.len()` with `v[i]` | Index loop where an iterator reads better and drops bounds checks |
| Deeply nested `match` on `Option`/`Result` | Combinators (`map`/`and_then`/`ok_or`) + `?` not used `[APOLLO 1.3]` |
| `Vec` reallocates in a sized loop | `Vec::new()` where `with_capacity(n)` was known `[CANONICAL]` |
| Adding an enum variant compiles but misbehaves | A `_`/`..` arm hid the new case `[CANONICAL pattern-matching]` |
| `.iter().cloned()` on `Copy` elements | Should be `.copied()` — no clone call at all |
| A `*const`/`&` stored in an owned `Vec` dangles after a push | Store an index/key, not a pointer, into a collection you mutate `[MODEL]` |
| `&mut self` method won't compile calling `&self` mid-body (E0502) | Separate into phases; don't reach for `RefCell` `[MODEL]` |

## Seams

When a question sits near a seam, decide which side it falls on before answering.

| Neighbouring subject | Owner | Where the seam falls |
|---|---|---|
| Profiling, `cargo flamegraph`, measuring the actual cost of an allocation or clone | `rust-project` | **This skill writes cheap code; that one measures the cost.** The mindset (don't allocate by reflex) is here; the flamegraph that proves it is there |
| The signature a caller sees — naming, generic-vs-`dyn`, builders, `impl Trait` in return position as an API choice | `rust-api-design` | This skill fills the body; that one designs the interface |
| The error *type* (`thiserror` enum, `?` conversion, panic-vs-`Result`) | `rust-errors` | Using `?` to thread a `Result` through a body is here; defining what flows and when to panic is there |
| `Send`/`Sync`, `Arc<Mutex<T>>`, sharing owned state across tasks | `rust-concurrency` | Cloning an `Arc` in ordinary code is here; the concurrency model that requires it is there |
| Shared ownership (`Rc`/`Arc` **choice**), interior mutability (`Cell`/`RefCell`), `Drop` guards, closures | `rust-ownership-tools` | Plain borrow/clone/move is here; the **escape hatches** when a plain borrow won't express the design are there |
| Import order, item order, module layout, where `Error` lives | `rust-project` | Writing the statements is here; ordering and placing them across the file/crate is there |

## Name the silence

Say what has no prescription, and what would lift it — an unlabelled claim gets obeyed as one.

- **"Avoid `unwrap`/`expect`" is not this skill's rule to state** — it belongs to `rust-errors`, which
  carries the discipline and its exceptions. This skill only threads the happy path.
- **No performance figure is asserted here.** "Iterators are zero-cost" is a compilation guarantee,
  not a benchmark; any *number* about clone-vs-borrow cost must come from a profile (`rust-project`),
  never from this text. `[MODEL]`

## References

- [`references/iterators-and-allocation.md`](references/iterators-and-allocation.md) — the adapter
  cheat-sheet (`map`/`filter`/`fold`/`scan`/`flat_map`/`try_fold`), `copied` vs `cloned`, the
  `collect` targets (`Vec`, `String`, `HashMap`, `Result<Vec<_>, E>`), `entry` over double lookup,
  and the allocation patterns (`with_capacity`, `Cow`, `Box`/`Rc`/`Arc` when to reach for each). It
  does **not** cover error types (`rust-errors`) or profiling (`rust-project`).
