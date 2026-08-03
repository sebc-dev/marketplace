# Key-value storage and generated API clients

Two branches that sit beside the Repository rather than inside it: where small unstructured
values go, and whether the Service below the Repository is hand-written or generated.

Reference: **Flutter 3.44.0** · Dart SDK **3.12.x**. Package claims verified 2026-08-03.

## Key-value storage

**The classic `SharedPreferences` API is legacy.** The plugin's own documentation, since 2.3.0,
says it *"is a legacy API that will be deprecated in the future"* and *"highly encourage any new
users… to use the newer SharedPreferencesAsync or SharedPreferencesWithCache APIs instead"*
`[MAINTAINER, High]`.

| API | Behaviour |
|---|---|
| `SharedPreferencesAsync` | No local cache — every read hits the platform store, so it is always current |
| `SharedPreferencesWithCache` | Cached reads, refreshed explicitly. Closer to the legacy ergonomics |
| `SharedPreferences` (legacy) | Cached, synchronous reads after an async load |

**Do not mix legacy and new in one app.** A call through `SharedPreferencesAsync` can overwrite
values written by the legacy API — including keys it was not asked about (reported in
supabase-flutter #1276). Migrate wholesale rather than per-call-site. On Android the new APIs
default to DataStore Preferences rather than the old SharedPreferences backend.

None of this is a place for tokens: key-value preferences are not encrypted.

## Typed API client generators

`retrofit` (over `dio`) and `chopper` (over `http`) generate a typed client from an annotated
interface, replacing hand-written request plumbing.

The trade is narrow: they remove repetitive request code and add a `build_runner` dependency to
your network layer. Since `flutter-architecture` already prescribes a hand-written Repository
exposing domain types, a generated client sits *below* it as the Service — it does not remove
the Repository, and adopting one changes little about how the app is structured. Worth it on a
large surface of similar endpoints; not worth the generation step for a handful.

Whichever way that goes, the seam typing rule from the skill body still applies: the Service is
typed against `http.Client` (or `dio` with `native_dio_adapter`), so a platform HTTP client can
be injected without rewriting the generated layer.
