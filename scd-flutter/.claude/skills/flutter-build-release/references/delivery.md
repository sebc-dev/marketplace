# Delivery — monorepos, publishing to pub.dev, CI/CD

Three branches of `flutter-build-release` that a daily build never reaches: splitting a repo
into several packages, putting a package on pub.dev, and running the build somewhere other
than a laptop. The everyday build path — flavors, constraints, signing, size — stays in the
skill body.

<monorepos>
## Monorepos

**Pub handles monorepos natively since Dart 3.6 / Flutter 3.27** — no third-party tool required
for resolution. *"Pub now supports shared resolution between packages in a monorepo, or
workspace… The pub workspaces feature ensures that packages in a monorepo share a consistent set
of dependencies."* `[OFFICIAL, High]`

Setup is `workspace:` listing the members in the root `pubspec.yaml`, and `resolution: workspace`
in each member. Four traps `[OFFICIAL]`:

| Trap | Consequence |
|---|---|
| A member with an SDK constraint below `^3.6.0` | `workspace and resolution requires at least language version 3.5` |
| Globs in `workspace:` | Require Dart **3.11+** |
| Shared resolution is still single-version | A conflict between two members must be resolved, not isolated per package |
| `dependency_overrides` in a member | Keep it in the **root** `pubspec.yaml` |

melos `[MAINTAINER]` (Invertase) now builds **on top of** Pub workspaces — melos 7.0.0 is the
first stable release doing so — and adds what pub does not: task orchestration across packages
and automated versioning from Conventional Commits. Reach for it when you want that automation,
not to get shared resolution, which pub already gives you.
</monorepos>

<publishing>
## Publishing to pub.dev

**Publishing is irreversible.** *"Keep in mind that publishing is forever. As soon as you publish
your package, users can depend on it… the pub.dev policy disallows unpublishing packages except
for very few cases."* `[OFFICIAL, High]` Run `dart pub publish --dry-run` first; a wrong version
number or a leaked file cannot be withdrawn.

Scoring runs on **`pana`, which you can run locally** before publishing rather than discovering
the score afterwards. It grades file conventions, public API documentation and platform support.
Two current specifics `[OFFICIAL]`:

- *"Flutter plugins that support iOS or macOS will only receive full score if they support Swift
  Package Manager."* The Flutter 3.44 blog reinforces it with extra points for SwiftPM support.
- The **popularity score no longer exists**: since Dart 3.6 it is a **download count**, with a
  weekly sparkline per package. *"The download count replaces the previous 'popularity score' on
  individual package pages."* Advice built on "popularity" is describing a retired metric.

A package declaring `dependency_overrides` is refused — the single-version resolution rule from
the skill body, and its sanction.
</publishing>

<cicd>
## CI/CD

The official deployment guidance exists and is **fastlane-centred**, with worked examples for
GitHub Actions, Cirrus, Travis, GitLab and CircleCI `[OFFICIAL]`. iOS scripts require the
`FLUTTER_ROOT` variable to be set.

> **[OFFICIAL, Medium] — no CI platform is endorsed.**
> Flutter documents *how* to automate and names several platforms without choosing among them.
> Vendor documentation — Codemagic's, for instance — documents **that vendor's product**, not
> Flutter best practice, and must not be quoted as prescription.
> *What would lift this:* an official recommendation, which the docs deliberately avoid making.

What a pipeline has to solve regardless of platform:

| Concern | Approach |
|---|---|
| Signing secrets | Keystore as a base64 secret materialised at build time; App Store Connect API key for iOS upload; `fastlane match` if you want the certificates themselves version-controlled and encrypted |
| Build number | Derive it from a monotonic CI value — run number, commit count — never increment by hand |
| Channels | Separate internal, beta and production tracks, so a build reaches testers before users |

Secrets reach the build through the CI secret store, never through the repository — the same
rule as the keystore, and the reason `key.properties` is gitignored rather than templated.
</cicd>
