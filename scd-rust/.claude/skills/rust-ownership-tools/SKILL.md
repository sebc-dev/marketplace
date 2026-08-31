---
name: rust-ownership-tools
description: |
  The Rust ownership toolbox beyond a plain borrow — shared ownership (`Rc`/`Arc`), interior
  mutability (`Cell`/`RefCell`), one-time initialisation (`OnceLock`/`LazyLock`), deterministic
  cleanup with `Drop`/RAII guards, and closures (`Fn`/`FnMut`/`FnOnce`, capture, storing).
  Use when a single owner and plain `&`/`&mut` will not express the design; when reaching for
  `Rc`/`Arc` for shared ownership, or choosing between them; when a value must be mutated through
  `&self` (a cache, a memoised field) and `Cell`/`RefCell` is in question, or a `borrow_mut` panics
  with `BorrowMutError`; when a value is initialised once then read (`OnceLock`/`LazyLock`) or a
  mutable global is tempting; when cleanup should run on scope exit, early return or panic (a `Drop`
  guard: unlock, return-to-pool, rollback-unless-committed); or when writing, storing or returning a
  closure and choosing `impl Fn`, `Box<dyn Fn>` or a `fn` pointer.
---

# Rust ownership tools

Reference: **edition 2024** (Rust ≥ 1.85) · the standard library docs — **[VERIFY per toolchain]**.

⚠️ **The three source guides (Microsoft, Canonical, Apollo) are thin on interior mutability, RAII and
closures.** This skill is model knowledge, marked `[MODEL]` throughout and grounded in the std docs
and the Rust reference. See *Name the silence*.

This skill owns the **mechanisms you reach for when a plain borrow will not do**. The default —
borrow vs clone vs move, not allocating by reflex — is `rust-idioms`; sharing mutable state *across
tasks* (`Arc<Mutex<T>>`, `Send`/`Sync` bounds, channels) is `rust-concurrency`; a `Drop` that frees a
*raw* resource and `UnsafeCell` soundness is `rust-unsafe`; whether to panic or return `Result` is
`rust-errors`.

## Rules that decide most of these choices

1. **These are escape hatches, not defaults — reach for a plain borrow first.** `[MODEL]` A single
   owner plus `&`/`&mut` borrows expresses most designs. `Rc<RefCell<_>>` threaded through a whole
   program is the tell that ownership was never decided — before reaching for shared ownership or
   interior mutability, ask: does the design *actually* share this value, or am I dodging the
   ownership question? Let data flow in one direction and keep one owner where you can.
2. **`Rc` for single-thread shared ownership, `Arc` across threads — and only when ownership is truly
   shared.** `[MODEL]` Reach for them when a value has **no single natural owner** (a node in a graph,
   a shared read-only table). `Rc` is not thread-safe (no atomics); the moment it crosses a thread or
   task the compiler demands `Arc`. Shared ownership is not a substitute for a borrow — a value with
   one owner and several readers wants `&`, not `Rc`.
3. **Interior mutability mutates through `&self` — and moves a borrow error to runtime.** `[MODEL]`
   `Cell<T>` for `Copy` values (`get`/`set`/`replace`, no borrow, cannot panic); `RefCell<T>` for the
   rest (`borrow`/`borrow_mut`, the aliasing rules checked **at runtime** — a second live `borrow_mut`
   **panics** with `BorrowMutError`). Reach for it only when an `&self` method must mutate hidden
   state; if you can take `&mut self`, that is the compile-time answer and it is better.
4. **Put cleanup in `Drop`, not in every caller.** `[MODEL]` A guard whose `Drop` releases a resource
   runs on normal return, early `return`/`?`, **and** panic — the one place cleanup cannot be
   forgotten. The idioms: an `Option<T>` field with `.take()` in `drop`; a `committed: bool` flag for
   rollback-unless-committed. `Drop` cannot be called manually (`drop(x)` moves and drops) and cannot
   return a `Result` — for fallible teardown expose an explicit `close()`, and keep `Drop` as the
   backstop.
5. **A closure is a value; know which `Fn` trait it is.** `[MODEL]` `Fn` reads its captures, `FnMut`
   mutates them, `FnOnce` consumes them (callable once). `move` forces capture **by value** — required
   to send a closure to another thread or return it from a function. Take a closure by generic
   (`f: impl Fn(..)`) for a zero-cost monomorphised call; **store** one or collect several as
   `Box<dyn Fn(..)>`; a stored closure that crosses threads needs `+ Send + Sync`.
6. **`OnceLock`/`LazyLock` for init-once-then-read — not a mutable global.** `[MODEL]` A value built
   once and then only read (a config, a compiled regex, a lookup table) is `OnceLock<T>`/`LazyLock<T>`
   (thread-safe) or `OnceCell`/`LazyCell` (single-thread). A **mutable** global (`static mut`, a
   `lazy_static!`/`OnceLock<Mutex<…>>` you keep writing to) hides data flow and **breaks test
   isolation** — parallel tests share it and fail nondeterministically. Pass the state in instead.

## Which mechanism, beyond a plain borrow

`[MODEL]`

| You need | Reach for | Not |
|---|---|---|
| A second independent owned value | `.clone()` (say why) — `rust-idioms` | `Rc` to dodge the borrow |
| Shared ownership, one thread | `Rc<T>` | `Arc` (pays atomics you don't need) |
| Shared ownership, across threads/tasks | `Arc<T>` | `Rc` (won't compile — `!Send`) |
| Mutate a `Copy` field through `&self` | `Cell<T>` | `RefCell` (needless runtime borrow) |
| Mutate a non-`Copy` field through `&self` | `RefCell<T>` | faking it with `unsafe` |
| Shared *mutable* state across threads | `Arc<Mutex<T>>` — **`rust-concurrency`** | `Rc<RefCell<T>>` (`!Send`) |
| Init once, then read only | `OnceLock<T>` / `LazyLock<T>` | `static mut` (UB-prone) |
| Run cleanup on every exit path | a `Drop` guard | duplicating it at each `return` |
| Store / return a callback | `Box<dyn Fn>` (store) · `impl Fn` (return) | boxing when a generic fits |

**`Cell` vs `RefCell`:** `Cell` swaps whole values and never hands out a reference, so it cannot
panic; `RefCell` hands out `Ref`/`RefMut` guards and enforces "many readers xor one writer" at
runtime. Keep a `RefCell` borrow's scope tiny — hold it across a call that re-enters and you get
`BorrowMutError`.

## The `Fn` traits

`[MODEL]`

| Trait | Captures | Callable | Take it as |
|---|---|---|---|
| `Fn(A) -> R` | by `&` (reads) | many times | `impl Fn(A) -> R` / `&dyn Fn` / `Box<dyn Fn>` |
| `FnMut(A) -> R` | by `&mut` (mutates) | many times, needs `&mut` | `impl FnMut(..)` / `&mut dyn FnMut` |
| `FnOnce(A) -> R` | by value (consumes) | once | `impl FnOnce(..)` — e.g. `thread::spawn` |

`impl Fn` in argument position monomorphises (fastest); `Box<dyn Fn>` when you must store many in a
field or a `Vec`, or name the type. A closure that captures nothing coerces to a plain `fn` pointer.
Depth — capture inference, returning closures, closure combinators — in
[`references/closures.md`](references/closures.md).

## Symptom index

| Symptom | Likely cause |
|---|---|
| `Rc<RefCell<_>>` threaded through the whole program | Ownership never decided — one owner + `&`, data flows one way `[MODEL]` |
| Panic `already borrowed: BorrowMutError` | A `RefCell` borrow still live when a second `borrow_mut` runs — scope it tighter |
| "`Rc<T>` cannot be sent between threads safely" | Needs `Arc` (and `Mutex`/atomics for mutation) — see `rust-concurrency` |
| Cleanup duplicated at every `return`, or skipped on panic | Move it into a `Drop` guard |
| Flaky parallel tests touching a `Mutex<HashMap>`/`static mut` | Shared mutable global — inject the state (`rust-project` for the test angle) |
| "closure may outlive the current function" / borrowed value | Capture by `move` |
| Can't put two closures in the same `Vec`, "expected closure, found closure" | Each closure is a distinct type — `Box<dyn Fn>` |
| `RefCell`/`Cell` reached for to fake `&mut self` | Take `&mut self`, or split read (`&self`) from write (`&mut self`) methods |

## Seams

| Neighbouring subject | Owner | Where the seam falls |
|---|---|---|
| Borrow vs clone vs move, not allocating by reflex, `.clone()` on a `String` | `rust-idioms` | The **default** (just borrow/clone) is there; the **escape hatch** when a plain borrow won't do is here |
| `Arc<Mutex<T>>` shared across tasks, `Send`/`Sync` bounds, channels, `tokio::sync::Mutex` | `rust-concurrency` | Choosing `Rc` vs `Arc` and single-thread `Cell`/`RefCell` is here; the **cross-task** model and the sync `Mutex`/`RwLock` are there |
| The public signature, generic-vs-`dyn`, taking a callback as an API shape | `rust-api-design` | The closure **mechanism** (`Fn` traits, capture, `impl Fn` vs `Box<dyn Fn>`) is here; **shaping the API** around it is there |
| A `Drop` that frees a **raw** resource, `UnsafeCell`, the aliasing model | `rust-unsafe` | A **safe** RAII guard is here; `unsafe` teardown and `UnsafeCell` soundness are there |
| Whether to panic or return `Result`, `thiserror`/`anyhow` | `rust-errors` | The `BorrowMutError` **mechanism** is here; the panic-vs-`Result` **policy** is there |
| Where the `static`/module lives, and the parallel-test isolation it breaks | `rust-project` | The `OnceLock`/DI **mechanism** is here; **layout and test isolation** are there |

## Name the silence

Say what has no prescription, and what would lift it — an unlabelled claim gets obeyed as one.

- **Standing silence: the three source guides barely touch interior mutability, RAII or closures.**
  Every rule above is `[MODEL]`, grounded in the std docs and the Rust reference for edition 2024.
  What would lift it: a sourced guide of the same authority distilled in a future campaign. Until
  then, verify against the std docs for the pinned toolchain rather than trusting this text as
  settled.
- **`once_cell` (crate) vs `OnceLock`/`LazyLock` (std).** The std types stabilised these (`OnceLock`
  1.70, `LazyLock` 1.80) `[MODEL]`; the `once_cell` crate remains for older MSRV and a few extras.
  This skill defaults to std and names the crate rather than presenting either as the only option —
  **[VERIFY per toolchain]** for the exact stabilisation.
- **No performance figure is asserted.** The atomic cost of `Arc` over `Rc`, or the runtime cost of a
  `RefCell` check, is real but unquantified here — any *number* must come from a profile
  (`rust-project`), never from this text.

## References

- [`references/interior-mutability-and-drop.md`](references/interior-mutability-and-drop.md) —
  `Cell`/`RefCell` APIs and the `BorrowMutError` trap, `OnceCell`/`OnceLock`/`LazyCell`/`LazyLock`,
  the `Box`/`Rc`/`Arc`/`Cow` selection in depth, and the RAII guard patterns (return-to-pool,
  rollback-unless-committed, the `Option::take()` idiom, why `Drop` can't be fallible). It does
  **not** carry cross-task sharing (`rust-concurrency`) or `unsafe` teardown (`rust-unsafe`).
- [`references/closures.md`](references/closures.md) — `Fn`/`FnMut`/`FnOnce` and capture inference,
  `move`, `impl Fn` vs `Box<dyn Fn>` vs `fn` pointer, returning a closure, storing closures with
  `Send + Sync`, and closure combinators. It does **not** carry async futures or `Send` bounds in
  async (`rust-concurrency`).
