---
name: rust-concurrency
description: |
  Running Rust in parallel — async/await, choosing and using a runtime (tokio), the blocking-in-async
  trap, sharing state with `Arc`/`Mutex`, channels, structured concurrency and cancellation, and
  satisfying `Send`/`Sync` bounds in async code.
  Use when writing or reviewing `async`/`await` code; when picking or configuring an async runtime;
  when a blocking or CPU-heavy call sits on an async thread; when sharing mutable state across tasks
  or threads with `Arc<Mutex<_>>`; when choosing a channel (`mpsc`/`oneshot`/`broadcast`/`watch`);
  when spawning, joining or cancelling tasks; or when the compiler says a future "cannot be sent
  between threads safely".
---

# Rust concurrency

Reference: **edition 2024** (Rust ≥ 1.85) · tokio 1.x — **[VERIFY per tokio version]**.

⚠️ **None of the three source guides (Microsoft, Canonical, Apollo) covers async or concurrency.**
This skill is model knowledge, marked `[MODEL]` throughout and pinned to the tokio version above.
See *Name the silence* — treat it as a floor to verify, not a citation.

This skill owns **execution in parallel** and **satisfying `Send`/`Sync` bounds** with safe types.
*Implementing* `unsafe impl Send/Sync` and its soundness is `rust-unsafe`; the error *type* a task
returns is `rust-errors`; cloning an `Arc` in ordinary code is `rust-idioms`.

## Rules that decide most async code

1. **Never block the async thread.** `[MODEL]` `async` is cooperative — a task runs until it `.await`s
   and yields. A blocking call (`std::thread::sleep`, `std::fs`, a synchronous DB driver, a tight CPU
   loop) that does not yield **starves the executor**: other tasks on that thread stall. Use the
   runtime's async equivalents, or move the work with `tokio::task::spawn_blocking` (I/O) / `rayon`
   (CPU).
2. **Pick one runtime and stay in it.** `[MODEL]` `tokio` is the de-facto default; `async-std` is
   effectively unmaintained. Do not mix runtimes in one process, and do not call one runtime's
   primitives from inside another — futures are runtime-agnostic but timers, I/O and `spawn` are not.
3. **Don't hold a `!Send` value across `.await` on a multithreaded runtime.** `[MODEL]` A future that
   holds an `Rc`, a `RefCell` borrow, or a `std::sync::MutexGuard` across an `.await` point is
   **`!Send`**, and `tokio::spawn` requires `Send`. The fix is to **drop the guard before the
   `.await`** (scope it), not to reach for a bigger lock.
4. **`std::sync::Mutex` by default; `tokio::sync::Mutex` only to hold a lock across `.await`.**
   `[MODEL]` The async mutex is slower and exists for one reason: keeping a guard alive over a yield
   point. If the critical section has no `.await`, use the std mutex and drop the guard fast.
5. **Prefer message passing to shared state.** `[MODEL]` A channel moves ownership between tasks with
   no lock; reach for `Arc<Mutex<T>>` only when tasks genuinely share one mutable thing. Pick the
   channel by shape (below).
6. **Own your tasks — don't detach and forget.** `[MODEL]` A bare `tokio::spawn` whose `JoinHandle` is
   dropped runs unsupervised and swallows its panic. Use `JoinSet` (or await the handles) so failures
   surface and cancellation propagates.

## The blocking-in-async trap

`[MODEL]` The single most common async bug. Symptoms: latency spikes, a runtime that "hangs" under
load, timers firing late.

```rust
// WRONG: blocks the executor thread — every other task on it stalls
async fn handle() {
    let data = std::fs::read("big").unwrap();          // sync I/O
    std::thread::sleep(Duration::from_secs(1));        // blocks, doesn't yield
    heavy_cpu(&data);                                  // no await = no yield
}

// RIGHT: async I/O, async sleep, offload CPU
async fn handle() {
    let data = tokio::fs::read("big").await.unwrap();
    tokio::time::sleep(Duration::from_secs(1)).await;
    let out = tokio::task::spawn_blocking(move || heavy_cpu(&data)).await.unwrap();
}
```

`spawn_blocking` runs on a dedicated blocking pool so it cannot starve the async workers; `rayon` is
for data-parallel CPU work. Never `block_on` inside an async context — it deadlocks the worker.

## Sharing state and choosing a channel

`[MODEL]`

| Need | Reach for |
|---|---|
| Shared mutable state, short critical section, no `.await` inside | `Arc<std::sync::Mutex<T>>` |
| Shared mutable state, lock held across `.await` | `Arc<tokio::sync::Mutex<T>>` |
| Shared read-mostly state | `Arc<RwLock<T>>` |
| One value, once, task → task | `oneshot` |
| Many producers, one consumer, a stream of work | `mpsc` |
| One value, many readers, latest-only | `watch` |
| Broadcast every message to all receivers | `broadcast` |

Deadlock check: two tasks each holding one lock and awaiting the other's is a deadlock the borrow
checker cannot see. Acquire locks in a consistent order, and keep the section between lock and unlock
free of `.await` when you can.

## Structured concurrency and cancellation

`[MODEL]`

- **Cancellation is `drop`.** Dropping a future stops it at its last `.await`; there is no cancel
  signal. A task cancelled mid-operation leaves that operation half-done — this is why **cancellation
  safety** matters.
- **`tokio::select!`** runs several futures and takes the first to finish, **dropping the rest**. Only
  use futures that are cancellation-safe in a `select!` branch, or you lose the partial work (e.g. a
  half-read buffer). The docs mark each API's cancellation safety — check it.
- **`JoinSet`** owns a group of tasks: await them as they finish, and dropping the set aborts the
  rest — structured lifetime instead of detached spawns.
- **Graceful shutdown** uses a `watch`/`CancellationToken` the tasks poll, so they stop at a safe
  point rather than being aborted mid-write.

## Async in traits and `Send` futures

`[MODEL]` `async fn` in traits is stable, but a plain `async fn` in a trait returns a future that is
**not** guaranteed `Send`, which breaks `tokio::spawn` on the result. When callers must spawn it,
return an explicit `Send` future or bound it — and `#[trait_variant::make(Send)]` / the `async-trait`
crate remain the pragmatic tools for object-safe async traits. Detail in
[`references/async-runtime.md`](references/async-runtime.md).

## Symptom index

| Symptom | Likely cause |
|---|---|
| Runtime "hangs" or latency spikes under load | Blocking call on an async thread — `spawn_blocking`/async API |
| "future cannot be sent between threads safely" | `!Send` value (Rc/RefCell/std guard) held across `.await` |
| Two tasks freeze forever | Lock-ordering deadlock, or `block_on` inside async |
| A spawned task fails and nothing happens | `JoinHandle` dropped — panic swallowed; use `JoinSet` |
| Data lost when a timeout fires | A `select!` branch was not cancellation-safe |
| `tokio::sync::Mutex` everywhere, slow | std mutex would do — guard isn't held across `.await` |
| Deadlock with a `std::sync::Mutex` in async | Guard held across `.await`; scope it or use the async mutex |

## Seams

| Neighbouring subject | Owner | Where the seam falls |
|---|---|---|
| `unsafe impl Send/Sync`, the soundness of a hand-written thread-safety promise, data races as UB | `rust-unsafe` | *Satisfying* `Send`/`Sync` with safe types is here; *implementing* the unsafe trait is there |
| The error **type** a task or future returns, `thiserror`/`anyhow` | `rust-errors` | What a panicking task does to the runtime is here; the error type is there |
| `Arc::clone` in ordinary sequential code, borrow-vs-clone | `rust-idioms` | The concurrency model that *requires* the `Arc` is here; the clone mechanics are there |
| Choosing `Rc` vs `Arc`, single-thread interior mutability (`Cell`/`RefCell`), `Drop` guards, closures | `rust-ownership-tools` | Sharing *across tasks* (`Arc<Mutex<T>>`, `Send`/`Sync`, the sync `Mutex`/`RwLock`) is here; the single-thread choice and mechanism are there |
| Whether an API's signature is `async`, returns `impl Future`, or is object-safe | `rust-api-design` | Designing the signature is there; its `Send` bounds and execution are here |
| Measuring contention, tokio-console, async profiling | `rust-project` | The model is here; the measurement is there |

## Name the silence

Say what has no prescription, and what would lift it — an unlabelled claim gets obeyed as one.

- **Standing silence: the three source guides do not cover async or concurrency at all.** Every rule
  above is `[MODEL]`, current for **tokio 1.x** and edition 2024. What would lift it: a sourced
  async/runtime guide of the same authority as the three, distilled in a future campaign. Until then,
  verify runtime-specific claims against the tokio docs for the pinned version rather than trusting
  this text as settled.
- **No throughput or latency numbers are asserted** — runtime performance depends on workload,
  core count and configuration. A figure would need a benchmark (`rust-project`), not this skill.

## References

- [`references/async-runtime.md`](references/async-runtime.md) — the tokio runtime (`#[tokio::main]`,
  worker vs current-thread, `spawn` vs `spawn_blocking`), `select!` and cancellation safety in depth,
  the channel families with back-pressure, `Stream`, timeouts and `tokio::time`, async traits and
  `Send` futures, and `tokio-console` for diagnosis. It does **not** carry `unsafe impl Send/Sync`
  (`rust-unsafe`).
