# Serialisation — choosing a generator, and running build_runner

The arbitration between the three generators, and the `build_runner` mechanics. The rule that
decides *whether* to generate at all — macros are cancelled, generation goes through
`build_runner` — stays in the skill body, because it is what stops an agent producing code that
cannot compile.

<choosing>
## Choosing a serialisation generator

All three run through `build_runner`; they differ in what they handle without a fight.

| Generator | Fits |
|---|---|
| `json_serializable` | Plain DTOs. The smallest tool, and enough for most payloads |
| `freezed` + `json_serializable` | Immutable models with unions and `copyWith`. Since **freezed 3.0** the mixed mode requires `sealed class`, which introduced friction with `json_serializable` on **generic** classes (rrousselGit/freezed #1213 — resolution status `[VERIFY per version]`) |
| `dart_mappable` | Polymorphism, generics and inheritance handled natively, which is where the freezed + json_serializable pairing struggles |

**Polymorphic payloads need a discriminator key** in the JSON itself — a `type` field the
generator maps to a subtype. Without one, no generator can decide which class to build, and the
failure lands at runtime on the first payload of the wrong shape.

**Treat an external API's nullability as untrusted.** A field the contract says is non-null will
one day arrive null, and a non-nullable Dart field then throws inside the generated parser,
where the stack trace points at generated code rather than the payload. Parse defensively and
map to the domain type after.
</choosing>

<build_runner>
## build_runner, practically

| Command | Use |
|---|---|
| `dart run build_runner build --delete-conflicting-outputs` | One-off, and in CI |
| `dart run build_runner watch --delete-conflicting-outputs` | While actively editing models |

`--delete-conflicting-outputs` is not optional in practice — omitting it is the recurring
blocking error, raised whenever a previous output no longer matches. Generation also costs real
startup time on a large project, which is the argument for writing `fromJson`/`toJson` by hand
on a handful of small models rather than adopting a generator for them.
</build_runner>
