# Traits and dispatch

Loaded from `rust-api-design` when a signature turns on trait bounds, dispatch form, or a conversion
trait. Carries object safety, associated types vs generics, blanket impls and coherence, the newtype
pattern, and the conversion-trait map. It does **not** carry error types (`rust-errors`), the C ABI
(`rust-unsafe`) or async `Send` bounds (`rust-concurrency`).

- [Object safety in detail](#object-safety-in-detail)
- [Associated types vs generic parameters](#associated-types-vs-generic-parameters)
- [Blanket impls and coherence](#blanket-impls-and-coherence)
- [The newtype pattern](#the-newtype-pattern)
- [The conversion-trait map](#the-conversion-trait-map)
- [A supertrait is a bound, not a base class](#a-supertrait-is-a-bound-not-a-base-class)
- [Deref is not inheritance](#deref-is-not-inheritance)

## Object safety in detail

`[MODEL]` A trait is object-safe (usable as `dyn Trait`) only if every method is dispatchable:

- no generic type parameters on methods (`fn f<T>(&self, x: T)` — not object-safe);
- receiver is `&self`/`&mut self`/`Box<self>`/`Arc<self>`, never `self` by value on a `Sized`-only
  path;
- no `where Self: Sized` methods count against it (they are simply excluded from the vtable);
- no associated constants; return/argument types may not mention `Self` in non-receiver position.

**Fix when you need both:** split the object-safe subset into its own trait and keep the generic
methods in an extension trait with `where Self: Sized`, or provide them as free functions.

## Associated types vs generic parameters

`[MODEL]`

- **Associated type** (`trait Iterator { type Item; }`) — **one** implementation per implementing
  type. `Iterator for MyType` fixes `Item` once. Use when the type is a function of `Self`.
- **Generic parameter** (`trait From<T>`) — **many** implementations per type (`From<u8>`,
  `From<u16>`, …). Use when a type converts from/relates to several others.

Getting this wrong shows up as "conflicting implementations" (you wanted an associated type) or "can't
have two `Item`s" (you wanted a generic parameter).

## Blanket impls and coherence

`[MODEL]` A blanket impl covers a whole family: `impl<T: Display> ToString for T`. Powerful, but it
locks the trait — you cannot then also `impl ToString for MySpecificType`, because the blanket
already covers it (overlap). Reserve blanket impls for traits you own and want universally derived.

**The orphan rule**: `impl Trait for Type` is allowed only if `Trait` is local **or** `Type` is
local (roughly — a local type must appear before any type parameter). It exists so two crates cannot
both impl the same foreign trait for the same foreign type and break linking.

## The newtype pattern

`[MODEL]` Wrap a foreign type to (a) implement a foreign trait for it, (b) attach an invariant, or
(c) give a domain name to a primitive:

```rust
struct Meters(f64);                 // domain meaning + can impl Add, Display, ...
struct NonEmpty(Vec<u8>);           // invariant guarded by a private field + constructor
struct WrapVec(Vec<Thing>);         // to impl a foreign trait on Vec<Thing>
```

The cost is forwarding: you may need to re-expose methods (`Deref` is tempting — see below) or
implement the traits you actually want. Only forward what the wrapper's contract needs.

## The conversion-trait map

`[MS Interoperability]` `[MODEL]`

| Trait | Direction | Fails? | Use for |
|---|---|---|---|
| `From<T>` | `T` → `Self` | no | infallible conversion; gives `Into` + `?` for free |
| `Into<U>` | `Self` → `U` | no | usually derived from `From`; take `impl Into<U>` in args |
| `TryFrom<T>` | `T` → `Self` | yes (`Result`) | validated conversion; gives `TryInto` |
| `AsRef<U>` | `&Self` → `&U` | no | cheap reference view (`impl AsRef<str>` args) |
| `Borrow<U>` | `&Self` → `&U` | no | like `AsRef` but with `Eq`/`Hash`/`Ord` coherence (map keys) |
| `FromStr` | `&str` → `Self` | yes | parsing; powers `str::parse::<Self>()` |

**Implement `From`, get `Into` free** — never implement `Into` directly. Take `impl Into<String>` in
a constructor to accept both `&str` (via `String`) and `String` ergonomically.

## A supertrait is a bound, not a base class

`[MODEL]` `trait Ord: Eq` does **not** mean `Ord` "inherits from" `Eq` — it means *any type
implementing `Ord` must also implement `Eq`*. There is no sub-trait/base-trait hierarchy: a supertrait
adds the super's contract as a **requirement**, and lets a default method on the sub-trait *call* the
super's methods. It does **not** fold the super's items into the impl — implementing the sub-trait
still requires implementing (or defaulting) each trait's own methods separately. Modelling a class
tree as a chain of supertraits reproduces the OO shape the language does not have; prefer composition
(a field), an enum of the closed set, or a `Box<dyn Trait>` for an open one.

## Deref is not inheritance

`[MODEL]` Implementing `Deref` to expose an inner type's methods on a newtype is an anti-pattern
unless the wrapper genuinely **is** a smart pointer (`Box`, `Arc`, `MutexGuard`). Using `Deref` for
"inheritance" leaks the entire inner API, breaks the abstraction the newtype was meant to add, and
surprises readers when method resolution jumps types. Forward the specific methods you mean to expose.
