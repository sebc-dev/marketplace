---
name: rust-unsafe
description: |
  Crossing Rust's safety boundary soundly — `unsafe` blocks and functions, the invariants that keep
  safe callers from triggering UB, raw pointers, the C/FFI boundary (`extern "C"`, `#[repr(C)]`,
  ABI, bindgen/cbindgen), and implementing `Send`/`Sync` by hand.
  Use when writing or reviewing an `unsafe` block or `unsafe fn`; when a `// SAFETY:` comment is
  needed or missing; when dereferencing a raw pointer or transmuting; when calling C or exposing
  Rust to C across `extern "C"`; when choosing a `#[repr]` for FFI layout; when a panic might unwind
  across a foreign boundary; or when writing `unsafe impl Send`/`Sync` for a type.
---

# Rust unsafe

Reference: **edition 2024** (Rust ≥ 1.85) · the Rustonomicon · Miri — **[VERIFY per toolchain]**.

`unsafe` does not turn off the borrow checker's guarantees — it **transfers** one obligation to you:
upholding an invariant the compiler cannot check. This skill owns **soundness** and the **FFI
boundary**. Satisfying `Send`/`Sync` bounds in ordinary async is `rust-concurrency`; the safe Rust
signature is `rust-api-design`; the panic-vs-`Result` policy is `rust-errors`.

## Rules that decide most unsafe

1. **Minimise `unsafe` — reach for the safe equivalent first.** `[CANONICAL]` Every `unsafe` you don't
   write is an invariant you don't have to prove. Most "needs unsafe" turns out to be a safe API you
   hadn't found (`split_at_mut`, `MaybeUninit`, `bytemuck`, `slice::from_raw_parts`'s safe cousins).
2. **Minimise scope — the smallest possible `unsafe {}` block, even if it costs lines.** `[CANONICAL]`
   Wrap only the one operation that needs it, so the compiler still checks everything around it. A
   whole `unsafe fn` body running unchecked hides which line carries the obligation.
3. **"Because it's faster" is not a justification.** `[CANONICAL]` Only a **profile** showing a
   globally significant cost overrides safety — and then the `unsafe` is documented with that reason.
   An unmeasured `unsafe` for speed is a soundness risk taken on a guess.
4. **Every `unsafe` block and `unsafe fn` carries a `// SAFETY:` comment.** `[CANONICAL]` For a block,
   it states *why the callee's precondition is met here*; for an `unsafe fn`, it states *what the
   caller must uphold*. A missing `// SAFETY:` is an incomplete proof, and clippy can enforce its
   presence (`undocumented_unsafe_blocks`).
5. **Soundness is the whole game: no safe caller may ever trigger UB through your API.** `[MODEL]` An
   abstraction is *sound* only if every possible safe use is UB-free. If any safe input can reach
   undefined behaviour, the bug is yours, not the caller's — mark the function `unsafe` or fix the
   invariant.
6. **A panic must not unwind across an `extern "C"` boundary.** `[MS FFI]` `[MODEL]` It is undefined
   behaviour. Guard the boundary with `catch_unwind` (or build with `panic = "abort"`).

## `unsafe fn` vs `unsafe {}` — the two directions

`[MODEL]` They point opposite ways, and confusing them is the classic mistake:

| Construct | Meaning | The `// SAFETY:` says |
|---|---|---|
| `unsafe fn foo()` | *I place a precondition on the caller* | what the caller must guarantee before calling |
| `unsafe { … }` | *I assert the callee's precondition holds here* | why, at this site, it is satisfied |

Wrapping an `unsafe {}` call inside a **safe** function is a promise that the function upholds the
callee's precondition for *all* inputs. If it cannot (some inputs would be UB), the function itself
must be `unsafe fn` — pushing the obligation to the caller — not silently safe.

## The sources of undefined behaviour

`[MODEL]` The Rustonomicon's list — what an `unsafe` block must never let happen:

- **Data race** — unsynchronised concurrent access with at least one write (this is why `Send`/`Sync`
  are `unsafe` to implement).
- **Dangling / misaligned pointer deref** — reading freed, out-of-bounds, or unaligned memory.
- **Breaking aliasing** — two live `&mut` to the same place, or `&mut` aliasing a `&`. `&mut` is
  *unique*; violating it is UB even without a write.
- **Invalid value** — a `bool` that isn't 0/1, a `char` out of range, an enum with no such
  discriminant, a reference that is null, or **reading uninitialised memory**. Use `MaybeUninit<T>`
  for not-yet-initialised values; never a plain `let x: T;` you transmute into.
- **Unwinding across an FFI boundary** — see rule 6.

`transmute` is the sharpest edge — it asserts two types share a valid bit pattern *and* layout. Prefer
a typed conversion, `bytemuck`/`zerocopy` for POD, or `#[repr(transparent)]` newtypes over a raw
`transmute`.

## Raw pointers and `Send`/`Sync`

`[APOLLO 9]` `[MODEL]`

- A raw pointer (`*const T`/`*mut T`) carries **no** borrow, lifetime or aliasing guarantee — that is
  why creating one is safe but *dereferencing* one is `unsafe`. Keep the region between "make the
  pointer" and "deref it" as small as possible and re-derive from a reference where you can.
- **`Send` / `Sync` are auto-derived** for types built from `Send`/`Sync` parts. You only write
  `unsafe impl Send for T {}` when a field (usually a raw pointer) opted the type out but you can
  *prove* the type is in fact safe to move to / share across threads. That `unsafe impl` is a
  **soundness promise about thread-safety**, backed by a `// SAFETY:` explaining the synchronisation.
- Getting it wrong is a data race the compiler stopped warning you about. Implementing these is here;
  merely *requiring* `T: Send` in an async bound is `rust-concurrency`.

## The FFI boundary

`[MS FFI]` `[MODEL]` — detail in [`references/ffi.md`](references/ffi.md):

- **`extern "C"`** on functions crossing the boundary; **`#[repr(C)]`** on every struct/enum whose
  layout C sees (Rust's default layout is unspecified and may reorder fields).
- **Strings are not compatible** — Rust `&str` is UTF-8 and not nul-terminated; C strings are
  nul-terminated bytes. Convert through `CStr`/`CString`, and never hand C a pointer into a `String`.
- **Own each allocation on exactly one side.** Memory allocated in Rust is freed in Rust; document
  which side owns what and expose paired `_new`/`_free` functions.
- **Guard panics** at the boundary (rule 6). Generate bindings with `bindgen` (C → Rust) or `cbindgen`
  (Rust → C header) rather than hand-writing declarations that can silently disagree on layout.

## Symptom index

| Symptom | Likely cause |
|---|---|
| Works in debug, miscompiles or crashes in release | UB the optimiser exploited — run under **Miri** |
| Segfault dereferencing a pointer | Dangling/misaligned/out-of-bounds raw pointer |
| Heisenbug that moves when you add a print | Aliasing violation (two `&mut`) or a data race |
| `unsafe impl Send` then races under load | The soundness promise was false — no real synchronisation |
| Crash only when a Rust callback panics into C | Unwinding across `extern "C"` — needs `catch_unwind` |
| C reads garbage after a struct field | Missing `#[repr(C)]`, Rust reordered the fields |
| Garbage string across FFI | Passed non-nul-terminated / non-UTF-8 bytes; use `CStr`/`CString` |
| clippy flags an unsafe block | `undocumented_unsafe_blocks` — add the `// SAFETY:` |

## Seams

| Neighbouring subject | Owner | Where the seam falls |
|---|---|---|
| **Satisfying** `Send`/`Sync` bounds in ordinary async code, `Arc<Mutex<T>>` | `rust-concurrency` | *Implementing* `unsafe impl Send/Sync` and its soundness is here; *meeting* the bound with safe types is there |
| The **safe** Rust signature, generics, `dyn`, `From` | `rust-api-design` | The safe API is there; the `extern "C"` / raw-pointer boundary signature is here |
| Panic vs `Result` policy, `thiserror`/`anyhow` | `rust-errors` | Choosing to return an error is there; a panic being **UB across FFI** is here |
| Profiling that would justify an `unsafe` speed-up, `cargo flamegraph` | `rust-project` | The rule "measure before unsafe" is here; the measurement is there |
| Data races as a *concurrency* design problem (channels, structured concurrency) | `rust-concurrency` | The UB definition of a data race is here; avoiding one by design is there |
| A **safe** RAII/`Drop` guard, `Cell`/`RefCell` interior mutability | `rust-ownership-tools` | A `Drop` that frees a **raw** resource and `UnsafeCell` soundness are here; the safe guard and safe interior mutability are there |

## Name the silence

- **The three named sources are thin on FFI mechanics.** Canonical's unsafe discipline is four rules
  about *restraint*; MS has an FFI category but the ABI/layout/`bindgen` specifics below are largely
  `[MODEL]` and the Rustonomicon. Treated as model knowledge, `[VERIFY per toolchain]` for tool
  versions — not attributed to a source that does not carry them.
- **Miri is the tool that actually catches UB**, and it is not in any of the three guides `[MODEL]`.
  It interprets your code and detects aliasing/UB the normal build misses. Named here; its exact flags
  are version-dependent and not restated as settled.

## References

- [`references/ffi.md`](references/ffi.md) — `extern "C"` and calling conventions, `#[repr(C)]` /
  `#[repr(transparent)]` / `#[repr(u8)]`, C string round-trips via `CStr`/`CString`, passing slices
  and ownership across the boundary, `bindgen`/`cbindgen`, callbacks and `catch_unwind` at the edge.
  It does **not** carry the panic-vs-`Result` policy (`rust-errors`).
- [`references/soundness.md`](references/soundness.md) — the soundness contract in depth, `MaybeUninit`
  vs uninitialised reads, `transmute` alternatives (`bytemuck`/`zerocopy`), the aliasing model and
  `UnsafeCell`, writing a `// SAFETY:` that actually proves the invariant, and running Miri. It does
  **not** carry the concurrency design of avoiding data races (`rust-concurrency`).
