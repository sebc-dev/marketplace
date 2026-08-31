# The async runtime

Loaded from `rust-concurrency` when the question is runtime-specific. All `[MODEL]`, current for
**tokio 1.x** — **[VERIFY per tokio version]**. Carries the tokio setup, `select!` and cancellation
safety, channels and back-pressure, `Stream`, timeouts, async traits, and `tokio-console`. It does
**not** carry `unsafe impl Send/Sync` (`rust-unsafe`) or the error type (`rust-errors`).

- [Runtime setup](#runtime-setup)
- [spawn vs spawn_blocking vs block_in_place](#spawn-vs-spawn_blocking-vs-block_in_place)
- [select and cancellation safety](#select-and-cancellation-safety)
- [Channels and back-pressure](#channels-and-back-pressure)
- [Timeouts and Stream](#timeouts-and-stream)
- [Async traits and Send futures](#async-traits-and-send-futures)
- [Diagnosis](#diagnosis)

## Runtime setup

```rust
#[tokio::main]                          // multi-thread runtime, worker-per-core by default
async fn main() { /* ... */ }

#[tokio::main(flavor = "current_thread")]   // single-thread: futures need not be Send
async fn main() { /* ... */ }
```

- **multi-thread** (default) — work-stealing across workers; spawned futures must be `Send`.
- **current_thread** — one thread, no work-stealing; `!Send` futures are fine. Good for a CLI or a
  test.
- Build manually with `tokio::runtime::Builder` when you need to name threads, cap workers, or run a
  runtime inside a sync program.

## spawn vs spawn_blocking vs block_in_place

| Call | For | Runs on |
|---|---|---|
| `tokio::spawn(fut)` | concurrent async work | the async worker pool (future must be `Send + 'static`) |
| `tokio::task::spawn_blocking(f)` | blocking I/O, sync drivers | a dedicated blocking pool (default up to 512 threads) |
| `rayon` / a thread pool | CPU-bound data parallelism | your own pool, off the runtime entirely |
| `task::block_in_place(f)` | a rare blocking span inside a multi-thread task | current worker, tells tokio to compensate |

Never `Handle::block_on` inside async — it deadlocks the worker. `spawn_blocking`'s closure cannot
`.await`; it is for synchronous work only.

## select and cancellation safety

```rust
tokio::select! {
    res = do_request() => handle(res),
    _ = tokio::time::sleep(timeout) => log_timeout(),   // request future is DROPPED here
}
```

`select!` polls all branches and keeps the first ready, **dropping the others at their last await
point**. If `do_request()` was mid-read, that read is lost. A future is *cancellation-safe* if being
dropped and retried loses nothing — tokio documents this per API (`AsyncReadExt::read` is safe,
`read_exact` is not). In a loop, store partial state outside the `select!` so a dropped branch can
resume. Add `biased;` as the first line to poll branches top-to-bottom instead of randomly.

## Channels and back-pressure

| Channel | Senders | Receivers | Semantics |
|---|---|---|---|
| `mpsc` | many | one | bounded queue; `send().await` applies back-pressure when full |
| `oneshot` | one | one | a single value, once (request/response) |
| `broadcast` | many | many | every receiver sees every message; slow receivers lag |
| `watch` | many | many | latest value only; readers see the current state |

Prefer **bounded** `mpsc` — an unbounded channel that fills faster than it drains is an unbounded
memory leak with no back-pressure. `send` returns `Err` when all receivers are gone; treat that as
shutdown, not a panic.

## Timeouts and Stream

```rust
match tokio::time::timeout(Duration::from_secs(5), op()).await {
    Ok(v)  => v?,                      // op finished in time
    Err(_) => bail!("op timed out"),   // elapsed — op future dropped (cancellation safety applies)
}
```

A `Stream` is the async analogue of `Iterator`; consume with `while let Some(x) = stream.next().await`
(via `tokio_stream`/`futures::StreamExt`). `ReceiverStream` adapts an `mpsc` receiver into a `Stream`.

## Async traits and Send futures

`async fn` in traits is stable since Rust 1.75, but the returned future is not guaranteed `Send`,
which blocks `tokio::spawn` on a `dyn` of the trait:

- **spawning not needed** (single-thread, or awaited in place) — plain `async fn` in the trait works.
- **must be `Send`/object-safe** — return `-> impl Future<Output = T> + Send`, use
  `#[trait_variant::make(Send)]`, or the `async-trait` crate (boxes the future: one allocation per
  call, but object-safe and `Send`).

## Diagnosis

`[VERIFY per version]` `tokio-console` attaches to a running runtime (via the `console-subscriber`)
and shows per-task poll times, wakers, and tasks stuck not yielding — the direct way to *see* the
blocking-in-async trap rather than infer it from latency. Building with `--cfg tokio_unstable` is
required for the task instrumentation.
