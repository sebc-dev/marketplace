# Interior mutability, shared ownership and RAII

Loaded on demand from `rust-ownership-tools` when a body needs to mutate through `&self`, share
ownership, defer a one-time init, or run cleanup on scope exit. It does **not** carry cross-task
sharing (`Arc<Mutex<T>>`, channels — `rust-concurrency`), `unsafe` teardown or `UnsafeCell` soundness
(`rust-unsafe`), or the closure mechanics ([`closures.md`](closures.md)).

- [Cell vs RefCell](#cell-vs-refcell)
- [The BorrowMutError trap](#the-borrowmuterror-trap)
- [One-time init: OnceCell / OnceLock / LazyLock](#one-time-init-oncecell--oncelock--lazylock)
- [Box / Rc / Arc / Cow selection](#box--rc--arc--cow-selection)
- [RAII guards](#raii-guards)

## Cell vs RefCell

`[MODEL]` Both give shared mutability through `&self`; they differ in how they enforce aliasing.

| | `Cell<T>` | `RefCell<T>` |
|---|---|---|
| Access | `get` (needs `T: Copy`), `set`, `replace`, `take` | `borrow() -> Ref`, `borrow_mut() -> RefMut` |
| Hands out a reference? | never — swaps whole values | yes — `Ref`/`RefMut` guards |
| Checks aliasing | nothing to check (no references escape) | at **runtime**; violation **panics** |
| Panics? | no | yes, on overlapping borrows |
| Use for | a `Copy` flag/counter mutated through `&self` | a non-`Copy` field (a cache `Vec`, a memoised `Option`) |

```rust
struct Counter { n: Cell<u32> }
impl Counter {
    fn bump(&self) { self.n.set(self.n.get() + 1); }   // mutate through &self, cannot panic
}

struct Memo { cached: RefCell<Option<u64>> }
impl Memo {
    fn value(&self) -> u64 {
        if let Some(v) = *self.cached.borrow() { return v; }   // borrow ends at the ;
        let v = expensive();
        *self.cached.borrow_mut() = Some(v);                   // fresh borrow, no overlap
        v
    }
}
```

Neither is `Sync`: a `Cell`/`RefCell` shared across threads does not compile. The cross-thread
equivalents are `Mutex`/`RwLock`/atomics — `rust-concurrency`.

## The BorrowMutError trap

`[MODEL]` `RefCell` turns a borrow-checker *compile* error into a *runtime panic*. The classic cause
is holding a `Ref`/`RefMut` alive while asking for another:

```rust
// WRONG: the borrow() guard lives to the end of the match, so borrow_mut() inside panics
match *cache.borrow() {
    Some(v) => v,
    None => { *cache.borrow_mut() = Some(compute()); compute() }   // BorrowMutError
}

// RIGHT: end the read borrow before taking the write borrow
let hit = *cache.borrow();
match hit { Some(v) => v, None => { let v = compute(); *cache.borrow_mut() = Some(v); v } }
```

Guards drop at the end of their enclosing statement/scope, not at last use — bind and scope
deliberately. If two borrows genuinely overlap, the design wanted `&mut self`, not a `RefCell`: split
the type's read methods (`&self`) from its write methods (`&mut self`) and let the compiler check it.

## One-time init: OnceCell / OnceLock / LazyLock

`[MODEL]` For a value computed once and then only read.

| Type | Thread-safe | Init | Use for |
|---|---|---|---|
| `OnceCell<T>` | no | `get_or_init(f)` | single-thread lazy field |
| `OnceLock<T>` | yes | `get_or_init(f)` | a global set once at first use |
| `LazyCell<T>` | no | closure at declaration, run on first deref | single-thread lazy static/local |
| `LazyLock<T>` | yes | closure at declaration | the idiomatic lazy `static` (regex, table, config) |

```rust
static CONFIG: LazyLock<Config> = LazyLock::new(|| Config::from_env());
// first read runs the closure once; every later read is a plain load
fn port() -> u16 { CONFIG.port }
```

These replace the `lazy_static!`/`once_cell` crate for current toolchains (**[VERIFY per toolchain]**
for stabilisation: `OnceLock` 1.70, `LazyLock` 1.80). A `OnceLock<Mutex<T>>` you keep *writing* to is
no longer init-once — it is a mutable global, with the test-isolation and hidden-data-flow costs the
SKILL warns about; prefer passing the state in.

## Box / Rc / Arc / Cow selection

`[MODEL]` This is the authority for choosing a heap container; `rust-idioms` points here. `rust-idioms`
still owns *not allocating by reflex* (`with_capacity`, `&str`/`&[T]` at the boundary).

| Situation | Reach for | Why |
|---|---|---|
| Recursive type, or a large value moved around | `Box<T>` | one fixed-size handle on the heap; a struct that directly contains itself has infinite size |
| Type-erase behind a trait | `Box<dyn Trait>` | one owned handle to any implementor |
| Shared ownership, single thread | `Rc<T>` | ref-counted, no atomics; `Rc::clone` is a counter bump, not a deep copy |
| Shared ownership across threads/tasks | `Arc<T>` | atomic ref count — the sharing *model* is `rust-concurrency` |
| Shared *and* mutable, single thread | `Rc<RefCell<T>>` | last resort — see rule 1; usually a redesign is better |
| Borrow usually, own only when modified | `Cow<'_, T>` | `Cow::Borrowed` pays nothing on the common path, `to_mut()` clones once on write |

`Box<T>` to move a value to the heap or erase a type — **not** "to make it lighter". `Rc::clone(&x)` /
`Arc::clone(&x)` (associated form) reads as an intentional refcount bump, distinct from a deep
`x.clone()`.

## RAII guards

`[MODEL]` A guard runs cleanup in `Drop`, so it happens on every exit path — normal, `?`/early return,
and panic (during unwind).

```rust
// return-to-pool: the connection goes back when the guard drops
struct PooledConn { conn: Option<Connection>, pool: Arc<Pool> }
impl Drop for PooledConn {
    fn drop(&mut self) {
        if let Some(conn) = self.conn.take() { self.pool.put_back(conn); }   // take() out of &mut self
    }
}

// rollback-unless-committed: absent an explicit commit, undo on drop
struct Tx<'a> { db: &'a mut Db, committed: bool }
impl<'a> Tx<'a> {
    fn commit(mut self) { self.db.commit(); self.committed = true; }   // consumes self
}
impl Drop for Tx<'_> {
    fn drop(&mut self) { if !self.committed { self.db.rollback(); } }
}
```

Two constraints shape every guard: **`Drop` takes `&mut self`**, so owned fields you must move out are
wrapped in `Option` and `.take()`n; and **`Drop` returns `()`** — it cannot signal failure. When
teardown can fail meaningfully, expose a `close(self) -> Result<..>` that consumes the guard and does
the fallible work, leaving `Drop` as the best-effort backstop for the paths that skipped `close`. To
end a scope early, `drop(guard)` (or a `{ }` block); a guard bound to `_` drops **immediately**, a
guard bound to `_name` lives to end of scope — a real bug source.
