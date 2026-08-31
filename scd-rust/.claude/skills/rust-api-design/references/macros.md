# Macros

Loaded from `rust-api-design` when authoring a macro. Carries `macro_rules!` fragment specifiers and
hygiene, `$crate`, the proc-macro crate split, and the three proc-macro kinds. It does **not** carry
async runtime macros (`#[tokio::main]` — `rust-concurrency`) or trait design (parent skill body).

- [Decide: generic, or macro](#decide-generic-or-macro)
- [macro_rules basics](#macro_rules-basics)
- [Hygiene and $crate](#hygiene-and-crate)
- [Proc-macros: the crate split](#proc-macros-the-crate-split)

## Decide: generic, or macro

`[MS Macros]` `[MODEL]` A macro is the right tool only when a function or generic cannot express the
shape:

- **variadic / heterogeneous call shapes** — `vec![a, b, c]`, `println!` format strings;
- **generating code from a type's structure** — `#[derive(Serialize)]` reads the fields;
- **a call-site DSL** — `matches!`, a routing table.

Everything else — "avoid repetition", "one impl for many types" — is a generic or a helper function,
which gives real type errors and IDE support. A macro's diagnostics point *inside* the expansion,
which readers cannot see.

## macro_rules basics

`[MODEL]` Fragment specifiers name what each metavariable captures:

| Specifier | Captures |
|---|---|
| `expr` | an expression |
| `ident` | an identifier (name) |
| `ty` | a type |
| `pat` | a pattern |
| `path` | a path (`a::b::C`) |
| `tt` | a single token tree (most flexible, least checked) |
| `literal` | a literal |
| `block` / `stmt` / `item` | a block / statement / item |

Repetition: `$( $x:expr ),*` matches zero-or-more comma-separated; `$( ... )+` one-or-more; `?`
zero-or-one. Expand with the same `$( ... )*` shape.

```rust
macro_rules! hashmap {
    ( $( $k:expr => $v:expr ),* $(,)? ) => {{
        let mut m = ::std::collections::HashMap::new();
        $( m.insert($k, $v); )*
        m
    }};
}
```

The trailing `$(,)?` accepts an optional trailing comma — include it; a macro that rejects a trailing
comma is a papercut at every call site.

## Hygiene and $crate

`[MODEL]` `macro_rules!` is **hygienic** for local variables: a `let tmp` introduced by the macro
will not collide with a caller's `tmp`. It is **not** hygienic for paths — refer to items through
`$crate` so the macro works from any crate that imports it:

```rust
macro_rules! log_it { ($e:expr) => { $crate::logger::record($e) }; }
```

Without `$crate`, `logger::record` resolves in the *caller's* module and breaks when the macro is
used from another crate. Export with `#[macro_export]` (puts it at the crate root).

## Proc-macros: the crate split

`[MODEL]` A procedural macro must live in its own crate with `proc-macro = true` in `Cargo.toml`; it
cannot share a crate with the code that uses it. The standard toolchain is `syn` (parse the token
stream into an AST) + `quote` (build the output token stream) + `proc-macro2`.

| Kind | Signature shape | Invoked as |
|---|---|---|
| derive | `#[proc_macro_derive(Name)]` | `#[derive(Name)]` on a type |
| attribute | `#[proc_macro_attribute]` | `#[name(args)] item` |
| function-like | `#[proc_macro]` | `name!(tokens)` |

Debug a proc-macro with `cargo expand` (shows the generated source) — the single most useful tool,
since the expansion is otherwise invisible. Proc-macros run at compile time in the compiler's process:
a panic in one is a compile error, and they cannot do I/O you would want to depend on.
