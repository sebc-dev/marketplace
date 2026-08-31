# Iterators and allocation

Loaded on demand from `rust-idioms` when a body needs an adapter chain or an allocation decision.
Carries the iterator-adapter cheat-sheet, `copied`/`cloned`, `collect` targets, and when to reach
for each heap container. It does **not** carry error handling (`rust-errors`), profiling
(`rust-project`) or API signatures (`rust-api-design`).

- [Adapter cheat-sheet](#adapter-cheat-sheet)
- [copied vs cloned vs by-ref](#copied-vs-cloned-vs-by-ref)
- [collect targets](#collect-targets)
- [Allocation patterns](#allocation-patterns)
- [The map entry idiom](#the-map-entry-idiom)

## Adapter cheat-sheet

`[APOLLO 3.4]` `[MODEL]` — all lazy until a consuming adapter runs them.

| Need | Adapter |
|---|---|
| Transform each element | `.map(f)` |
| Keep some | `.filter(pred)` / `.filter_map(f)` (map + keep `Some`) |
| Stop early / take a prefix | `.take(n)` / `.take_while(pred)` |
| Skip a prefix | `.skip(n)` / `.skip_while(pred)` |
| Index alongside value | `.enumerate()` |
| Pairs from two iterators | `.zip(other)` |
| Flatten nested iterators | `.flatten()` / `.flat_map(f)` |
| Running accumulator, emit each step | `.scan(init, f)` |
| Fold to one value | `.fold(init, f)` / `.reduce(f)` |
| Fold that can fail | `.try_fold(init, f)` → short-circuits on `Err`/`None` |
| First match | `.find(pred)` / `.position(pred)` |
| All / any | `.all(pred)` / `.any(pred)` |
| Sum / product / count / min / max | `.sum()` / `.product()` / `.count()` / `.min()` / `.max()` |
| Deduplicate adjacent (needs sort first) | `.dedup()` on a `Vec`, not the iterator |
| Group into chunks / windows | slice `.chunks(n)` / `.windows(n)` |

**Consuming vs adapting.** `map`/`filter`/`take` return a new iterator (lazy); `sum`/`collect`/`for`
drive it (eager). A chain that is never consumed does nothing — the compiler warns
(`unused_must_use` on `impl Iterator`), so a dropped chain is a bug the build catches.

## copied vs cloned vs by-ref

- **`.copied()`** — `Iterator<Item = &T>` → `Iterator<Item = T>` when `T: Copy`. No call, no cost.
- **`.cloned()`** — same shape when `T: Clone` but not `Copy`. This *is* a `.clone()` per element:
  use it only when you need owned copies, not to dodge a lifetime.
- **By reference** — often you need neither: `.iter().filter(|x| x.active)` works on `&T` directly;
  add `.copied()`/`.cloned()` only where an owned value is required downstream.

## collect targets

`.collect()` is type-directed — the annotation on the binding chooses the container `[CANONICAL code]`:

```rust
let v: Vec<i32>            = it.collect();
let s: String             = chars.collect();
let m: HashMap<K, V>       = pairs.collect();
let set: HashSet<T>        = it.collect();
// short-circuiting: first Err stops the whole collect
let parsed: Result<Vec<i32>, _> = lines.map(|l| l.parse()).collect();
// partition a Result stream into oks and errs
let (ok, err): (Vec<_>, Vec<_>) = results.partition(Result::is_ok);
```

`Result<Vec<_>, E>` (and `Option<Vec<_>>`) is the idiom for "parse all or fail on the first bad one" —
no manual loop with an early `return`. Reach for `.collect::<Result<_, _>>()?`.

## Allocation patterns

`[APOLLO 1.4/3.3]` `[MODEL]`

| Situation | Reach for | Why |
|---|---|---|
| Empty growable, size unknown | `Vec::new()` / `String::new()` | no allocation until first push |
| Growable, final size known | `Vec::with_capacity(n)` | one allocation, no re-grow |
| Read a param, caller may own or borrow | `&str` / `&[T]` | pushes the ownership choice to the caller |
| Return owned-or-borrowed depending on branch | `Cow<'_, str>` | borrow when unchanged, own only when modified |
| Recursive type / large value moved around | `Box<T>` | fixed-size handle on the heap |
| Shared ownership, single thread | `Rc<T>` | ref-counted, no atomics |
| Shared ownership across threads/tasks | `Arc<T>` | atomic ref count — the concurrency model is `rust-concurrency` |

**`Cow` is the answer to "sometimes I modify the input, usually I don't"** — returning `String`
always allocates even when you only pass the input through; `Cow::Borrowed` pays nothing on the
common path.

The rows above are the quick reference; the **decision between `Box`/`Rc`/`Arc`/`Cow`** (and shared
ownership vs interior mutability) is owned in depth by `rust-ownership-tools`. This skill's rule is
narrower: don't allocate by reflex — `with_capacity` when the size is known, `&str`/`&[T]` at the
boundary.

## The map entry idiom

Double lookup (`if map.contains_key(k) { map.get_mut(k) } else { map.insert(...) }`) hashes twice.
Use `entry`:

```rust
*counts.entry(key).or_insert(0) += 1;
map.entry(key).or_insert_with(Vec::new).push(item);   // allocate the Vec only when the key is new
map.entry(key).or_default();
```

`or_insert_with` defers the default's construction to the miss path — `or_insert(expensive())` builds
the value every call even on a hit.
