# OAuth wiring and token storage

Below the rules in the skill body: the per-platform configuration `flutter_appauth` needs, the
two-call flow and its constraint, and where each piece of a session belongs.

Sources: the `flutter_appauth` and `flutter_secure_storage` READMEs `[MAINTAINER]` and the OAuth
2.0 / PKCE specifications. **Flutter publishes no official authentication guidance** — nothing
here is a Flutter prescription, and the security limits in the skill body are practitioner
findings.

## The one-call flow

`authorizeAndExchangeCode` performs authorization and the token exchange together, and it is the
right default because it manages the PKCE parameters for you:

```dart
final result = await appAuth.authorizeAndExchangeCode(
  AuthorizationTokenRequest(
    clientId,
    redirectUri,
    issuer: 'https://issuer.example.com',
    scopes: ['openid', 'profile', 'offline_access'],
  ),
);
```

`offline_access` (or the provider's equivalent) is what yields a refresh token. Without it the
session dies at the first access-token expiry and no refresh interceptor can save it.

## Splitting authorize and token

If you call `authorize` and then `token` separately — to inspect the code, or to exchange it
server-side — **carry the same `code_verifier` and `nonce` into the exchange** `[MAINTAINER]`:

```dart
final auth = await appAuth.authorize(AuthorizationRequest(clientId, redirectUri, ...));

final token = await appAuth.token(TokenRequest(
  clientId, redirectUri,
  authorizationCode: auth!.authorizationCode,
  codeVerifier: auth.codeVerifier,   // reuse — do not regenerate
  nonce: auth.nonce,                 // reuse — do not regenerate
));
```

Regenerating either fails at exchange time on Android. The failure message points at the token
endpoint rather than at the verifier, which is why this costs more debugging time than it should.

## Redirect URIs

Configured in the **native** projects, not in Dart, and they must match the provider registration
character for character.

| Platform | Where |
|---|---|
| Android | `manifestPlaceholders` in `android/app/build.gradle` — the `appAuthRedirectScheme` |
| iOS / macOS | A `CFBundleURLTypes` entry in `Info.plist` |
| Web | The provider's allow-list; there is no native project to configure |

Custom schemes (`com.example.app:/oauth`) work everywhere; HTTPS app links and universal links
are stronger against scheme hijacking but need domain verification. Pick one and register the
same string in all three places — provider, native config, and the `redirectUri` passed in Dart.

## What to store, and where

| Item | Where | Why |
|---|---|---|
| Refresh token | `flutter_secure_storage` | Long-lived and the highest-value secret in the app |
| Access token | Memory, or secure storage if it must survive a restart | Short-lived by design |
| ID token claims | Memory | Derived data; re-obtainable |
| "Has onboarded", theme, last tab | `SharedPreferencesAsync` | Not secrets |

Nothing about a session belongs in `SharedPreferences`: it is not encrypted, and the key-value
section of the skill body says so for the same reason.

Session state — is the user logged in — is a Repository concern that `flutter-architecture`
already owns. This layer supplies the tokens; it does not decide what the app shows while they
are absent.

## Logout is not just deleting the token

Deleting local tokens ends the session on the device and nowhere else. A complete logout also
revokes the refresh token at the provider's revocation endpoint, so a copy extracted from the
device stops working. Providers vary on whether the end-session endpoint clears the browser
session too — a user who logs out and back in without being asked for credentials is seeing the
system browser's cookie, not a bug in your code.
