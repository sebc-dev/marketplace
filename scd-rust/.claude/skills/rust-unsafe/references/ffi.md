# FFI — the C boundary

Loaded from `rust-unsafe` when crossing to or from C. Carries `extern "C"`, `#[repr]` choices, C
string round-trips, ownership across the boundary, `bindgen`/`cbindgen`, and panic guarding at the
edge. It does **not** carry the panic-vs-`Result` policy (`rust-errors`) or the general soundness
model (`references/soundness.md`).

- [extern and repr](#extern-and-repr)
- [Strings across the boundary](#strings-across-the-boundary)
- [Slices and ownership](#slices-and-ownership)
- [Callbacks and panic guarding](#callbacks-and-panic-guarding)
- [Generating bindings](#generating-bindings)

## extern and repr

`[MS FFI]` `[MODEL]`

```rust
#[repr(C)]
pub struct Point { pub x: f64, pub y: f64 }   // C sees a stable, ordered layout

#[unsafe(no_mangle)]                            // edition-2024 spelling; keep the symbol name
pub extern "C" fn distance(a: Point, b: Point) -> f64 { /* ... */ }
```

- **`#[repr(C)]`** — use for any type C reads. Rust's default `repr(Rust)` may reorder fields and is
  unspecified; a C struct that disagrees reads garbage.
- **`#[repr(transparent)]`** — a newtype with exactly one non-zero-sized field has the field's ABI;
  use it to pass a wrapper where C expects the inner type.
- **`#[repr(u8)]` / `#[repr(i32)]`** on a field-less enum fixes its discriminant type for C.
- **`extern "C"`** selects the C calling convention. `no_mangle` (written `#[unsafe(no_mangle)]` in
  edition 2024) keeps the symbol findable by the linker.

Only FFI-safe types cross the boundary: primitives, `#[repr(C)]` aggregates, raw pointers, and
`extern "C"` fn pointers. A Rust `String`, `Vec`, `&str`, enum-with-data or trait object is **not**
FFI-safe — the compiler warns (`improper_ctypes`); do not silence it.

## Strings across the boundary

`[MODEL]` Rust `str` is UTF-8 and length-prefixed; C strings are nul-terminated bytes:

```rust
use std::ffi::{CStr, CString, c_char};

// C string in → Rust &str
unsafe fn take_c_string(ptr: *const c_char) -> Option<String> {
    if ptr.is_null() { return None; }
    // SAFETY: caller guarantees `ptr` is a valid nul-terminated C string
    let s = unsafe { CStr::from_ptr(ptr) };
    s.to_str().ok().map(str::to_owned)   // to_str validates UTF-8
}

// Rust String out → C: hand out ownership, take it back to free
#[unsafe(no_mangle)]
pub extern "C" fn make_greeting() -> *mut c_char {
    CString::new("hello").unwrap().into_raw()   // C now owns it
}
#[unsafe(no_mangle)]
pub unsafe extern "C" fn free_greeting(ptr: *mut c_char) {
    if ptr.is_null() { return; }
    // SAFETY: ptr came from make_greeting's into_raw and is freed once
    unsafe { drop(CString::from_raw(ptr)); }
}
```

Never hand C a pointer *into* a `String`/`Vec` and let it outlive the owner — the buffer moves or
frees. `into_raw`/`from_raw` transfer ownership explicitly.

## Slices and ownership

`[MODEL]` A slice crosses as a `(pointer, length)` pair:

```rust
#[unsafe(no_mangle)]
pub unsafe extern "C" fn sum(ptr: *const u32, len: usize) -> u64 {
    if ptr.is_null() || len == 0 { return 0; }
    // SAFETY: caller guarantees `ptr` points to `len` initialised u32s, one allocation
    let s = unsafe { std::slice::from_raw_parts(ptr, len) };
    s.iter().map(|&x| x as u64).sum()
}
```

**Own each allocation on one side.** Memory `malloc`ed in C is freed in C; memory from Rust's
allocator is freed in Rust. Mixing allocators is UB. Expose paired `_new`/`_free` for anything Rust
hands out, and document the contract in the header.

## Callbacks and panic guarding

`[MODEL]` A Rust function called *from* C must not let a panic unwind across the boundary — it is UB:

```rust
#[unsafe(no_mangle)]
pub extern "C" fn on_event(code: i32) -> i32 {
    let result = std::panic::catch_unwind(|| handle(code));
    match result { Ok(v) => v, Err(_) => -1 }   // turn a panic into an error code
}
```

Alternatively build with `panic = "abort"` so a panic ends the process instead of unwinding. A C
callback stored and invoked from Rust is an `extern "C"` fn pointer; calling it is `unsafe` (C might
pass anything).

## Generating bindings

`[MODEL]` `[VERIFY per version]` — do not hand-write declarations that can drift from the C header:

- **`bindgen`** — C header → Rust `extern` declarations + `#[repr(C)]` types, run from `build.rs`.
- **`cbindgen`** — Rust `#[repr(C)]` + `extern "C"` → a C/C++ header for consumers.
- `cc` / the `-sys` crate convention compiles and links the native library; keep the raw `-sys`
  bindings in one crate and a safe wrapper crate on top, so callers never touch `unsafe` directly.
