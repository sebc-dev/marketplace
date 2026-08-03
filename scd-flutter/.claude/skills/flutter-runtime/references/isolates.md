# Isolates as an application mechanism

The persistent worker, calling plugins from a background isolate, moving large buffers without
copying, and what none of this does on web.

The Dart-language view — isolates not sharing memory, messages being copied, `Isolate.run`
itself — belongs to `dart-idioms`. This file is the Flutter-application layer above it:
docs.flutter.dev/perf/isolates and dart.dev/language/isolates `[OFFICIAL]`.

## One-shot versus persistent

`Isolate.run` (and `compute()`, its Flutter-flavoured predecessor) spawns an isolate, runs one
function, returns the result and tears the isolate down. The setup cost is paid **per call**.

That is the right trade for occasional heavy work. It is the wrong trade for a stream of jobs —
decoding every frame off a socket, running a parser per user keystroke — where the same cost
recurs indefinitely. There, spawn once and keep the isolate alive.

```dart
class ParserWorker {
  late final SendPort _commands;
  final ReceivePort _responses = ReceivePort();
  final Map<int, Completer<Object?>> _pending = {};
  int _nextId = 0;

  static Future<ParserWorker> spawn() async {
    final worker = ParserWorker._();
    final initPort = ReceivePort();
    await Isolate.spawn(_entry, initPort.sendPort);
    worker._commands = await initPort.first as SendPort;
    worker._responses.listen(worker._onResponse);
    return worker;
  }

  Future<Object?> parse(String payload) {
    final id = _nextId++;
    final completer = Completer<Object?>();
    _pending[id] = completer;
    _commands.send((id, payload, _responses.sendPort));
    return completer.future;
  }

  void dispose() {
    _commands.send(null);          // let the worker shut itself down
    _responses.close();
  }
}
```

The shape that matters: **an id on every message**, so replies can be matched to requests, and a
`Completer` per in-flight job. Without the id, a worker handling concurrent requests can only
answer in order.

A persistent worker is a resource with a lifetime — it belongs on the `dispose` checklist beside
controllers and subscriptions.

## Calling plugins from an isolate

A background isolate has no binary messenger, so any plugin call from it throws. Since **Flutter
3.7** the fix is to initialise one, using a token that can only be obtained on the root isolate
`[OFFICIAL]`:

```dart
final token = RootIsolateToken.instance!;      // captured on the root isolate

await Isolate.run(() {
  BackgroundIsolateBinaryMessenger.ensureInitialized(token);   // first thing, inside
  // plugin calls are legal from here on
});
```

`RootIsolateToken.instance` is null off the root isolate, which is why the token is captured
outside and closed over rather than fetched inside.

## Large buffers without a copy

Message passing copies. For a multi-megabyte `ByteBuffer` that copy is the dominant cost, and
`TransferableTypedData` removes it by transferring **ownership** in constant time
`[OFFICIAL, High]`:

```dart
final transferable = TransferableTypedData.fromList([bytes]);
port.send(transferable);              // sender must not touch `bytes` afterwards
// receiving side:
final Uint8List received = transferable.materialize().asUint8List();
```

Ownership transfer means exactly that: after `send`, the sending isolate no longer owns the
buffer. `materialize()` can only be called once.

## Web has none of this

Web is not a degraded isolate platform — it has no isolates.

| Construct | On web |
|---|---|
| `compute()` / `Isolate.run` | Runs on the **main thread**. Compiles and works, but provides no concurrency and still blocks the UI |
| `Isolate.spawn` | Unavailable |
| `BackgroundIsolateBinaryMessenger.ensureInitialized` | **Does not compile** — a build error, not a runtime one (flutter/flutter #136886) |

The last row is the one that surprises: web breakage surfaces at build time, so a `kIsWeb`
runtime check inside a function that *references* the symbol is not enough. Keep the call behind
a conditional import, or behind a `kIsWeb` guard in code the web build never compiles.

Web workers exist as a platform capability but are not an isolate drop-in; whether an app needs
one is a targeting decision, and `flutter-architecture` owns capability-not-platform branching.

For heavy work on web the practical fallbacks are to chunk the job and yield to the event loop
between chunks, or to move it server-side.
