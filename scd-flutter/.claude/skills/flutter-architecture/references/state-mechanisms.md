# State mechanisms, dependency injection and canonical patterns

Source levels: **[PRESCRIPTION]** explicit rule of the official guide ·
**[COMPASS]** convention applied in the reference app · **[MAINTAINER]** package
maintainer position · **[PRACTITIONER]** recognised practitioner opinion ·
**[PRACTICE]** widespread but unnormed.

## The guide does not pick a winner

**[PRESCRIPTION, High]** The Recommendations page classes `ChangeNotifier`/`Listenables`
as *Conditional*, not *Strongly recommend*: *"The ChangeNotifier API is part of the
Flutter SDK… There are many options to handle state-management, and ultimately the
decision comes down to personal preference."* The case study says the UI *"leans heavily
on view models and ChangeNotifier, but it could've easily been written with streams, or
with other libraries such as riverpod, flutter_bloc, and signals."* The options page
(data-and-backend/state-mgmt) lists Provider, setState, InheritedWidget, Redux, BLoC/Rx,
GetIt, MobX, GetX, Riverpod without ranking them.

The table below states trade-offs. It does not name a winner.

| Approach | Mental model | Guide-compatible | Maintenance (pub.dev, summer 2026) | Choose when | Avoid when |
|---|---|---|---|---|---|
| **`StatefulWidget`/`setState`** | Ephemeral state local to a widget, rebuilt via `setState` | Yes — recommended for ephemeral state; not a ViewModel replacement | Flutter SDK core | Purely local, disposable state: form field, animation, active tab | State shared across widgets; business logic; state that must survive a configuration change |
| **`ChangeNotifier` + `ListenableBuilder`** | Observable object calling `notifyListeners()`; widgets listen | Yes — Compass's choice, the MVVM base of the guide | Flutter SDK; `provider` (rrousselGit) active | ViewModels and repositories in the official architecture; teams staying close to the SDK | Fine-grained notification (O(N) dispatch, documented by provider's maintainer); very large reactive state graphs |
| **`ValueNotifier`/`ValueListenableBuilder`** | Single-value `ChangeNotifier` | Yes — useful for one atomic field in a ViewModel | Flutter SDK | One observable field (counter, flag) | Composite multi-field state |
| **`InheritedWidget`/`InheritedModel`** | Downward propagation through the tree; the basis of `provider` | Yes — the underlying low-level mechanism | Flutter SDK | Writing a DI/state abstraction; understanding `provider` | Day-to-day direct use — verbose and error-prone; prefer `provider` |
| **`provider`** | Wrapper over InheritedWidget: DI + exposing Listenables | Yes — **the guide's DI recommendation** | Maintained (rrousselGit) | DI in the official architecture; exposing ViewModels/repositories | Very fine-grained reactivity, or state living outside the tree |
| **`riverpod`/`flutter_riverpod`** | Compile-safe global providers, no `BuildContext`, built-in cache/async | Yes — named explicitly as viable | **3.0.0** stable (dash-overflow.net / R. Rousselet), active | Complex app state, async data with loading/error, testability without widgets | Small apps where ChangeNotifier suffices; a team wanting to stay 100% SDK |
| **`flutter_bloc` (BLoC/Cubit)** | Events → states over streams; strict unidirectional flow | Yes — named explicitly as viable | v9.x, **Flutter Favorite**, bloclibrary.dev, active | Enterprise apps, complex event logic, auditable state transitions | Small/CRUD apps — disproportionate boilerplate |

### The three competing positions, stated honestly

- **H1 — "stay close to the SDK"** **[COMPASS, High]**: ChangeNotifier + provider. The
  reference app's choice, minimal learning curve, no heavy dependency. Acknowledged limit,
  from provider's own maintainer: O(N) dispatch.
- **H2 — "compile safety and async first"** **[MAINTAINER/PRACTITIONER, Medium]**:
  Riverpod. Compile-time safety, independence from `BuildContext`, native loading/error
  handling. Limit: a different paradigm from classic MVVM, to be reconciled with
  ViewModels.
- **H3 — "event rigour at scale"** **[MAINTAINER, Medium]**: BLoC. Strict separation,
  testability, unidirectional flow enforced by construction. Limit: boilerplate.

The guide arbitrates between them only through Compass's implementation choice (H1), while
explicitly validating H2 and H3.

### Migration thresholds

Do not impose Riverpod or BLoC on an existing project that works. Switch to **Riverpod**
when you need compile safety, async caching and independence from `BuildContext`. Switch
to **BLoC** when you have complex event logic, audit/traceability requirements, or a large
team.

Very Good Ventures (2026), a practitioner position, not an official one: *"flutter_bloc
remains our pick. It gives you predictable state with the BLoC pattern, a clean split
between UI and business logic, and strong testability."*

## Canonical ViewModel

**[COMPASS, High]** The ViewModel extends `ChangeNotifier`, exposes public getters, and
calls `notifyListeners()` in a `finally` after loading data through a `switch` on the
`Result`.

```dart
class HomeViewModel extends ChangeNotifier {
  HomeViewModel({required BookingRepository bookingRepository})
      : _bookingRepository = bookingRepository {
    load = Command0(_load)..execute();
  }

  final BookingRepository _bookingRepository;
  late final Command0 load;

  List<BookingSummary> _bookings = [];
  List<BookingSummary> get bookings => _bookings;

  Future<Result<void>> _load() async {
    try {
      final result = await _bookingRepository.getBookingsList();
      switch (result) {
        case Ok<List<BookingSummary>>():
          _bookings = result.value;
        case Error<List<BookingSummary>>():
          // surface the error through the command
      }
      return result;
    } finally {
      notifyListeners();
    }
  }
}
```

## `Result` — error handling across the layer boundary

**[PRESCRIPTION design-patterns/result, High]** A repository returns `Future<Result<T>>`;
it catches exceptions rather than letting them cross the boundary.

```dart
sealed class Result<T> {
  const Result();
  const factory Result.ok(T value) = Ok._;
  const factory Result.error(Exception error) = Error._;
}
final class Ok<T> extends Result<T> {
  const Ok._(this.value);
  final T value;
}
final class Error<T> extends Result<T> {
  const Error._(this.error);
  final Exception error;
}
```

```dart
Future<Result<void>> delete(int id) async {
  try {
    return _apiClient.deleteBooking(id);
  } on Exception catch (e) {
    return Result.error(e);
  }
}
```

Because `Result` is `sealed`, the ViewModel's `switch` is exhaustive — adding a variant
breaks the build rather than silently falling through. See the `dart-idioms` skill for the
exhaustiveness rules.

## `Command` — loading state without ad-hoc booleans

**[PRESCRIPTION design-patterns/command, High]** A `Command` wraps a method and exposes
`running`, `completed`, `error`. `Command0` takes no argument, `Command1` takes one. The
ViewModel exposes commands; the View listens to their state.

```dart
ListenableBuilder(
  listenable: widget.viewModel.load,
  builder: (context, child) {
    if (widget.viewModel.load.running) {
      return const Center(child: CircularProgressIndicator());
    }
    // …render the data
  },
)
```

Classed *Recommend*, not *Strongly recommend* — the pattern is endorsed, not mandatory.

## Dependency injection

**[PRESCRIPTION, High]** *"Dependency injection prevents your app from having globally
accessible objects, which makes your code less error prone. We recommend you use the
provider package to handle dependency injection."*

```dart
runApp(
  MultiProvider(
    providers: [
      Provider(create: (context) => AuthApiClient()),
      Provider(create: (context) => ApiClient()),
      Provider(create: (context) => SharedPreferencesService()),
      ChangeNotifierProvider(
        create: (context) => AuthRepositoryRemote(
          authApiClient: context.read(),
          apiClient: context.read(),
          sharedPreferencesService: context.read(),
        ) as AuthRepository,
      ),
      Provider(create: (context) => DestinationRepositoryRemote(
        apiClient: context.read(),
      ) as DestinationRepository),
    ],
    child: const MainApp(),
  ),
);
```

Conventions visible in that snippet **[COMPASS, High]**:

- Repositories are cast to their **abstract interface** (`as AuthRepository`) — this is
  what lets development, staging and production implementations be swapped.
- A repository holding session state is exposed via `ChangeNotifierProvider`; stateless
  ones via plain `Provider`.
- Dependencies are resolved with `context.read()`.
- Services and repositories live at the **top** of the tree, so their lifetime is the app.
  ViewModels are typically instantiated at feature/route level.

**Alternative** **[MAINTAINER, High]**: `get_it` (escamoteur/flutter_it) — O(1) access
without `BuildContext`, nested scopes. Compatible with the official architecture but not
the guide's default, which prefers injection through the tree.

**`BuildContext` coupling trap** **[PRESCRIPTION/PRACTICE, High]**: never store or leak a
`BuildContext` into the Data or Domain layers — those layers must not know Flutter exists.
`context.read()` belongs only at the wiring point (provider creation or `build`).
Documented anti-pattern: instantiating a ViewModel inside `build()`
(`final vm = MyViewModel()`), which recreates it on every rebuild.

## Widget composition and the presentation boundary

- **Widgets, not `_buildXxx()` methods** **[PRACTITIONER, Medium]**: extract a widget
  *class* rather than a method returning a `Widget`, to get rebuild boundaries and `const`.
  The guide asks for *"reusable, lean widgets that hold as little logic as possible."*
- **`StatefulWidget` is for ephemeral state only** **[PRESCRIPTION, High]**: animation
  controllers, pre-render loading kick-off. Feature state goes to an externalised ViewModel.
- **The boundary runs through the ViewModel** **[PRESCRIPTION, High]**: the View presents
  and delegates; the ViewModel holds presentation logic (data → UI state); pure business
  logic lives in Repositories (and use-cases if a Domain layer exists).

## Routing

**[PRESCRIPTION, High]** `go_router` is *Recommend*: *"Go_router is the preferred way to
write 90% of Flutter applications. There are some specific use-cases that go_router
doesn't solve…"* The package is **feature-complete** — verbatim from pub.dev: *"This
package is considered feature-complete. The Flutter team's primary focus will be on
addressing bug fixes and ensuring stability."* Route configuration lives in a dedicated
`routing/` folder. Simple routing logic is tolerated in a View; routing is a cross-cutting
concern, never a Data-layer responsibility.

## Positioning secondary sources

**Code With Andrea** (Andrea Bizzotto, GDE) **[PRACTITIONER, Medium]**: the Riverpod
architecture series and the *feature-first vs layer-first* debate date from **2022–2023**,
therefore **predate** the official MVVM guide. Divergences to flag: (1) a 4-layer
reference architecture (data, domain, application, presentation) with *controller* rather
than *ViewModel*; (2) Riverpod promoted as the foundation, where Compass uses
ChangeNotifier + provider. Convergences: Repository pattern, layer separation,
immutability, dependency injection. Cross-reference it with the guide; do not merge it in.

**`GetX`** is flagged by 2026 practitioner sources as risky (single maintainer, technical
debt) — **[PRACTITIONER, Low]**, not confirmed by the official guide.

## What would change these recommendations

- The official guide promoting `ChangeNotifier` from *Conditional* to *Strongly
  recommend*, or naming a default state package.
- Compass migrating its own state mechanism.
- A maintenance change on `provider` or `go_router` — re-check pub.dev status
  periodically. Minor version numbers are deliberately not pinned here.
