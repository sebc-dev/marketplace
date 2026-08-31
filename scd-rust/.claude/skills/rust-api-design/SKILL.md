---
name: rust-api-design
description: |
  The Rust signature others call — naming, trait implementations and interop, the choice between
  generics and `dyn` dispatch, type-state, builders, and authoring declarative or procedural macros.
  Use when designing the public signature of a function, method, trait or struct; when naming a
  type, method or trait; when choosing between `impl Trait`, `<T: Trait>` and `dyn Trait`; when
  deciding whether to implement `From`/`TryFrom`/`Display`/`IntoIterator`; when a type has many
  optional fields and a builder is in question; when encoding state in the type system so invalid
  calls do not compile; or when writing a `macro_rules!` macro or a `derive`/attribute proc-macro.
---

# Rust API design

Reference: **edition 2024** (Rust ≥ 1.85) · Rust API Guidelines · exact toolchain — **[VERIFY per toolchain]**.

This skill designs the **interface**. The body behind it is `rust-idioms`; the error *type* the
signature returns is `rust-errors`; an `unsafe impl Send/Sync` is `rust-unsafe`; proving the API is
`rust-project`.

## Rules that decide most signatures

1. **Accept the most general, return the most specific.** `[MS Interoperability]` `[MODEL]` Take
   `&str` not `&String`, `&[T]` not `&Vec<T>`, `impl IntoIterator<Item = T>` not `Vec<T>`,
   `impl AsRef<Path>` for path args. Return a concrete type the caller can name and use — not a trait
   bound they must satisfy again.
2. **Default to static dispatch; reach for `dyn` only when you need it.** `[APOLLO Ch6]` `<T: Trait>`
   or `impl Trait` in argument position monomorphises — fastest, zero indirection. Use `dyn Trait`
   (behind `&`/`Box`/`Arc`) only for a **heterogeneous collection** (`Vec<Box<dyn Draw>>`) or to
   **cut monomorphisation bloat / compile time**. `dyn` requires the trait to be object-safe.
3. **Implement the std trait instead of inventing a method.** `[MS Interoperability]` Conversions are
   `From`/`TryFrom` (and `?` relies on `From` for errors); user-facing text is `Display`; every
   public type derives `Debug`; a sensible zero value is `Default`; iteration is `IntoIterator`. A
   `to_string`/`into_foo` that duplicates a std trait is a smell.
4. **Constructors guard invariants; all-public fields are for plain data.** `[CANONICAL code]` A type
   with an invariant exposes a constructor (`new`/`try_new`/`From`) and keeps fields private; a
   struct that is just a bag of independent values may make them `pub`. **Parse, don't validate**
   `[MODEL]`: prefer a wrapper type (`Port`, `NonEmpty<T>`, `ValidatedEmail`) whose fallible
   constructor (`TryFrom`/`try_new -> Result`) is the *only* way to build one, so it **cannot hold
   invalid data** — validate once at the boundary and delete the defensive re-checks downstream,
   instead of passing a raw `String`/`u32` everywhere and re-checking it at each use.
5. **Builder for many optional fields.** `[CANONICAL naming]` `MyType::builder()` returns
   `MyTypeBuilder`; the terminal `.build()` returns `Result<MyType, _>` when construction can fail,
   `MyType` when it cannot. Do not add a builder to a two-field struct.
6. **Names carry meaning, not type noise.** `[CANONICAL naming]` `[MS UX]` Consistent word order,
   correct terminology, no redundant type in the name (`user` not `user_struct`). Generic type
   parameters are **single letters**; lifetimes derive from the data they name, never bare `'a` by
   default.

## Static vs dynamic dispatch — the decision

`[APOLLO Ch6]`

| Form | Dispatch | Reach for it when | Cost |
|---|---|---|---|
| `fn f(x: impl Trait)` / `fn f<T: Trait>(x: T)` | static, monomorphised | the common case: one concrete type per call site | code bloat, longer compiles |
| `fn f() -> impl Trait` | static, opaque return | returning an iterator/future/closure without naming it | caller can't name the type |
| `fn f(x: &dyn Trait)` / `Box<dyn Trait>` | dynamic, vtable | heterogeneous collection, or trimming monomorphisation | one indirection per call |

`impl Trait` in **argument** position is an anonymous generic; in **return** position it is an opaque
type the caller receives but cannot name. Use `<T: Trait>` explicitly when you must **name** the type
parameter (to relate two arguments, or bound an associated type).

**Object safety** gates `dyn`: no generic methods, no `Self`-by-value receivers, no associated
consts. If a trait is not object-safe you cannot make a `dyn` of it — split the object-safe subset
into its own trait, or stay static.

## Traits and interop

- **`From` over ad-hoc constructors** — implement `From<A> for B` and get `.into()` and `?`-conversion
  for free; never write both `From` and a `from_a` that do the same thing. `[MS Interoperability]`
- **`TryFrom` when conversion can fail**, with a real error type (`rust-errors`), not a panic.
- **Coherence / the orphan rule** `[MODEL]`: you may implement a trait for a type only if you own the
  trait **or** the type. To implement a foreign trait for a foreign type, wrap it in a newtype
  (`struct Wrapper(TheirType)`) — the standard escape hatch.
- **`#[must_use]`** on a type or function whose result must not be dropped (a `Result`, a builder, a
  guard). **`#[non_exhaustive]`** on a public enum/struct so adding a variant/field is not a breaking
  change — it forces downstream `match` to keep a `_` arm. `[MODEL]`
- **Sealed trait** to stop downstream implementations while still allowing downstream *use*: a public
  trait with a supertrait bound on a private module trait. `[MODEL]`

## Type-state — invalid calls do not compile

`[APOLLO Ch7]` Encode the state in a type parameter so a method only exists in the state that permits
it:

```rust
struct Request<S> { url: String, _state: PhantomData<S> }
struct Draft; struct Sealed;

impl Request<Draft> {
    fn header(self, k: &str, v: &str) -> Self { /* ... */ self }
    fn seal(self) -> Request<Sealed> { Request { url: self.url, _state: PhantomData } }
}
impl Request<Sealed> {
    fn send(self) -> Result<Response, SendError> { /* ... */ }   // only exists once sealed
}
```

`send` on a `Draft` is a **compile error**, not a runtime check. Pros/cons and the trade-off (more
types, richer errors from the type checker) are in `[APOLLO 7.5]` — reach for it when a state
machine's illegal transitions are worth making unrepresentable, not for every two-state flag.

For a **runtime** state machine, a method that must change its owner's state should **return the
transition as data** — an `enum Transition { To(State), Stay }` the caller applies — rather than hold
`&mut` to the owner it lives inside. `[MODEL]` Returning the change as a value sidesteps the borrow
conflict of a callee mutating the aggregate that owns it, and keeps the transition table in one
`match`. (The compile-time version of the same intent is type-state, above.)

## Macros — the last resort, not the first

`[MS Macros]` `[MODEL]` Prefer a function or a generic; reach for a macro only when the language cannot
express the thing (variadic call shapes, deriving code from a type, a DSL).

| Kind | Use for | Cost |
|---|---|---|
| `macro_rules!` (declarative) | repetition the type system can't fold; call-site sugar | hygiene edge cases, poor errors |
| `#[derive(MyTrait)]` (proc-macro) | generating a trait impl from a type's shape | separate `proc-macro` crate, `syn`/`quote` |
| attribute proc-macro | rewriting an item (`#[my_attr] fn`) | hardest to debug, opaque at call site |

A macro's diagnostics are worse than a function's — every macro you don't write is errors you don't
have to explain. Details (hygiene, `$crate`, the proc-macro crate split) are in
[`references/macros.md`](references/macros.md).

## Symptom index

| Symptom | Likely cause |
|---|---|
| Callers must `.to_string()` before calling | Signature takes `String`/`&String` instead of `&str` `[MS Interop]` |
| `Box<dyn Trait>` everywhere, slow compile *and* runtime indirection | `dyn` used where static dispatch fit `[APOLLO Ch6]` |
| "the trait cannot be made into an object" | Non-object-safe trait behind `dyn` — split it or stay static |
| Two ways to build the same value (`From` **and** `new_from_x`) | Duplicated conversion — keep `From` only `[MS Interop]` |
| Adding an enum variant breaks every downstream crate | Missing `#[non_exhaustive]` `[MODEL]` |
| A guard/`Result` silently dropped by callers | Missing `#[must_use]` |
| Can't `impl ForeignTrait for ForeignType` | Orphan rule — newtype wrapper `[MODEL]` |

## Seams

| Neighbouring subject | Owner | Where the seam falls |
|---|---|---|
| The **body** behind the signature — ownership, iterators, `Option`/`Result` flow | `rust-idioms` | Designing the interface is here; filling it is there |
| The error **type** a signature returns (`thiserror` enum, `?` conversion, panic policy) | `rust-errors` | The signature says `-> Result<T, MyError>`; **what `MyError` is** and when to panic is there |
| `unsafe impl Send for T` / `Sync`, and its soundness obligation | `rust-unsafe` | Requiring `T: Send` in a bound is here; *implementing* the unsafe trait is there |
| The C ABI / FFI signature (`extern "C"`, `#[repr(C)]`, `cbindgen`) | `rust-unsafe` | A safe Rust signature is here; the foreign-boundary signature is there |
| Using `#[tokio::main]`/`async fn` as an API shape, `Send` bounds on futures | `rust-concurrency` | Authoring a macro is here; *using* an async runtime's macros is there |
| The closure **mechanism** behind a callback arg — `Fn`/`FnMut`/`FnOnce`, capture, `impl Fn` vs `Box<dyn Fn>` | `rust-ownership-tools` | Shaping the API that takes a callback is here; the closure mechanics and storage are there |
| Doc comments on the API, testing it, semver checking | `rust-project` | Shaping the API is here; documenting, proving and versioning it is there |

## Name the silence

- **The Microsoft Guidelines and the Rust API Guidelines overlap and occasionally differ in
  emphasis.** Where both speak, they agree on the casing conventions (RFC 430); where only precedent
  in `std` decides, follow `std`. Neither is cited here for a rule it does not state.
- **API evolution tooling is named, not prescribed.** `cargo-semver-checks` catches breaking changes
  mechanically `[MODEL]` — this skill points at it; whether to gate CI on it is a `rust-project`
  decision, and no version threshold is asserted here.

## References

- [`references/traits-and-dispatch.md`](references/traits-and-dispatch.md) — the full dispatch
  trade-off, object safety in detail, associated types vs generic params, blanket impls and
  coherence, the newtype pattern, `Deref` misuse, and the conversion-trait map
  (`From`/`Into`/`TryFrom`/`AsRef`/`Borrow`). It does **not** cover error types (`rust-errors`).
- [`references/macros.md`](references/macros.md) — `macro_rules!` fragment specifiers and hygiene,
  `$crate`, the proc-macro crate split with `syn`/`quote`, `derive` vs attribute vs function-like,
  and when a generic beats a macro. It does **not** cover async runtime attribute macros
  (`rust-concurrency`).
