# Soundness

Loaded from `rust-unsafe` when the question is whether an `unsafe` abstraction is actually sound.
Carries the soundness contract, `MaybeUninit`, `transmute` alternatives, the aliasing model and
`UnsafeCell`, writing a real `// SAFETY:`, and running Miri. It does **not** carry the FFI mechanics
(`references/ffi.md`) or concurrency design (`rust-concurrency`).

- [The soundness contract](#the-soundness-contract)
- [MaybeUninit and uninitialised memory](#maybeuninit-and-uninitialised-memory)
- [Alternatives to transmute](#alternatives-to-transmute)
- [Aliasing and UnsafeCell](#aliasing-and-unsafecell)
- [Writing a SAFETY comment that proves something](#writing-a-safety-comment-that-proves-something)
- [Running Miri](#running-miri)

## The soundness contract

`[MODEL]` An `unsafe` abstraction is **sound** iff *no* safe caller, with *any* input, can reach
undefined behaviour. The test is adversarial: assume the caller is hostile but stays in safe code — if
they can still trigger UB, the abstraction is unsound and the bug is yours.

- If some safe inputs are UB, the function must be `unsafe fn` (the precondition moves to the caller).
- A safe wrapper around `unsafe {}` is a claim that it holds the precondition for **every** input.
  Validate the input in the safe layer, then enter `unsafe` only once the invariant is established.

## MaybeUninit and uninitialised memory

`[MODEL]` Reading uninitialised memory is UB even for integer types. Never `let x: T;` then
`transmute`/`assume_init` a garbage value into it. Use `MaybeUninit<T>`:

```rust
let mut buf: [MaybeUninit<u8>; 64] = [const { MaybeUninit::uninit() }; 64];
// ... write every byte through buf[i].write(v) ...
// SAFETY: all 64 elements were initialised above
let init: [u8; 64] = unsafe { MaybeUninit::array_assume_init(buf) };
```

`assume_init` is a promise that initialisation happened; calling it early is UB. Prefer safe
constructors (`vec![0u8; n]`, `Box::new_zeroed`) when a zeroed/default value suffices.

## Alternatives to transmute

`[MODEL]` `mem::transmute` reinterprets bits with no check on size, layout or validity — the sharpest
tool in the language. Almost always there is a safer route:

| Instead of transmute | Use |
|---|---|
| Reinterpret POD bytes | `bytemuck` / `zerocopy` (checked, safe) |
| Newtype ↔ inner type | `#[repr(transparent)]` + a field access |
| Integer ↔ enum | `TryFrom` / an explicit match |
| Change a pointer's pointee type | `ptr as *const U` cast, then justify the deref |
| Extend a lifetime | **stop** — this is almost always unsound |

If `transmute` is truly unavoidable, assert the layouts (`const` size checks) and document both the
source and target invariants in the `// SAFETY:`.

## Aliasing and UnsafeCell

`[MODEL]` The core aliasing rule: a `&mut T` is **unique** and a `&T` is **shared-immutable**, and the
optimiser relies on it. Producing two `&mut` to the same location, or mutating through a `&T`, is UB
even without an observable wrong value.

**Interior mutability is the one sanctioned exception, and it goes through `UnsafeCell<T>`** — the only
type whose `&` may be mutated. `Cell`, `RefCell`, `Mutex`, `RwLock`, `atomic::*` are all safe wrappers
built on it. Never fabricate a `&mut` from a `&` by casting a raw pointer; reach for the right cell
type instead.

## Writing a SAFETY comment that proves something

`[CANONICAL]` `[MODEL]` A `// SAFETY:` that restates the code (`// SAFETY: this is safe`) proves
nothing. A useful one names the specific invariant and why it holds *here*:

```rust
// SAFETY: `idx < self.len` was checked on the line above, and `self.ptr` points to
// `self.len` initialised, properly aligned `T` for the lifetime of `&self`.
let val = unsafe { &*self.ptr.add(idx) };
```

For an `unsafe fn`, the comment (or `# Safety` doc section) states what the **caller** must uphold —
that becomes the function's documented contract. clippy's `undocumented_unsafe_blocks` and
`missing_safety_doc` enforce that both exist.

## Running Miri

`[MODEL]` `[VERIFY per version]` Miri is an interpreter that detects UB the compiled build silently
exploits — out-of-bounds, use-after-free, aliasing violations, uninitialised reads, data races:

```bash
rustup component add miri
cargo miri test        # run the suite under the UB checker
```

Any `unsafe` code without a Miri run is unverified. Miri is slow and cannot check FFI calls into real
C, but for pure-Rust `unsafe` it is the closest thing to a proof the tooling offers.
