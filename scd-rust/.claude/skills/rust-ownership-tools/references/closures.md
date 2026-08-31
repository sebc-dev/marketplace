# Closures

Loaded on demand from `rust-ownership-tools` when a body writes, stores or returns a closure. Carries
the `Fn` traits, capture, and the `impl Fn` / `Box<dyn Fn>` / `fn`-pointer choice. It does **not**
carry async futures or `Send` bounds on futures (`rust-concurrency`), nor the public-API shape around
a callback (`rust-api-design`).

- [The three Fn traits](#the-three-fn-traits)
- [Capture and move](#capture-and-move)
- [Accepting a closure](#accepting-a-closure)
- [Returning a closure](#returning-a-closure)
- [Storing closures](#storing-closures)
- [Combinators](#combinators)

## The three Fn traits

`[MODEL]` A closure is an anonymous struct holding its captures, plus one `Fn*` impl. The trait it
gets is inferred from **how it uses** its captures, from least to most restrictive:

- **`Fn`** — captures by shared reference; callable through `&self`, any number of times.
- **`FnMut`** — captures by mutable reference; callable through `&mut self`, needs a `mut` binding.
- **`FnOnce`** — captures by value / consumes a capture (moves it out); callable **once**.

`Fn: FnMut: FnOnce` — anything callable many times is callable once, so a bound of `FnOnce` is the
most permissive thing to *accept*, and `Fn` the most permissive thing to *require of yourself*.

## Capture and move

`[MODEL]` By default a closure captures each variable by the weakest borrow that works (`&`, then
`&mut`, then by value). `move` forces **every** capture by value:

```rust
let name = String::from("ada");
let f = move || println!("{name}");   // owns `name`; needed to send/return the closure
```

Reach for `move` when the closure **outlives** the current frame — returned from a function, stored in
a struct, or handed to `thread::spawn`. A non-`move` closure borrows its environment and is bound by
that borrow's lifetime. A closure that captures **nothing** coerces to a plain `fn` pointer, which is
`Copy` and nameable (`fn(i32) -> i32`).

## Accepting a closure

`[MODEL]` Prefer a generic bound — it monomorphises to a direct, inlinable call with no allocation:

```rust
fn apply<F: Fn(i32) -> i32>(xs: &[i32], f: F) -> Vec<i32> { xs.iter().map(|&x| f(x)).collect() }
fn retry<F: FnMut() -> bool>(mut f: F) { while !f() {} }   // FnMut: it may mutate captures
fn once<F: FnOnce() -> String>(f: F) -> String { f() }     // FnOnce: it may consume captures
```

Bound the **least** restrictive trait the body needs: if you only call it once, ask for `FnOnce`; if
you mutate through it, `FnMut`; only require `Fn` when you call it repeatedly without `&mut`.

## Returning a closure

`[MODEL]` A closure has no nameable type, so return it opaquely with `impl Fn`, or boxed when the
return type must be uniform across branches:

```rust
fn adder(n: i32) -> impl Fn(i32) -> i32 { move |x| x + n }         // opaque, zero-cost
fn op(kind: Kind) -> Box<dyn Fn(i32) -> i32> {                     // two different closures, one type
    match kind { Kind::Inc => Box::new(|x| x + 1), Kind::Dbl => Box::new(|x| x * 2) }
}
```

`impl Fn` returns a single concrete (unnameable) type — every path must yield the *same* closure, so a
`match` with different closures per arm needs `Box<dyn Fn>`.

## Storing closures

`[MODEL]` Each closure is its own type, so a field or collection of "some closure" is a trait object:

```rust
struct Button { on_click: Box<dyn Fn()> }                 // one stored callback
let pipeline: Vec<Box<dyn Fn(&str) -> String>> = vec![    // heterogeneous — distinct closure types
    Box::new(|s| s.trim().to_string()),
    Box::new(|s| s.to_uppercase()),
];
let out = pipeline.iter().fold(input, |acc, step| step(&acc));
```

A closure stored in a type that moves between threads must be `Box<dyn Fn(..) + Send + Sync>` (or
`+ Send` alone if only *moved*, not shared) — the same bound the compiler will demand when that type
is later sent to a task. Requiring the bound *is* `rust-ownership-tools`; the async model that forces
it across `.await` is `rust-concurrency`.

## Combinators

`[MODEL]` Closures compose by capturing other closures behind `move`, letting you build small
strategies without a trait per case:

```rust
fn and<F, G>(f: F, g: G) -> impl Fn(&Msg) -> bool
where F: Fn(&Msg) -> bool, G: Fn(&Msg) -> bool {
    move |m| f(m) && g(m)                                  // captures f and g by value
}
let is_urgent_text = and(|m| m.urgent, |m| m.kind == Kind::Text);
```

This is the Rust form of the Strategy pattern: a swappable behaviour is a closure (or a `Box<dyn
Fn>`), not a class hierarchy. Reach for a trait only when the behaviour needs several methods or
associated types; a single-method strategy is a closure.
