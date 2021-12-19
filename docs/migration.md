## oidc-client v1.11.5 &rarr; oidc-client-ts v2.0.0

Ported library from JavaScript to TypeScript. The API is largely
backwards-compatible. The support for the deprecated implicit flow has been
removed.

### [OidcClientSettings](https://authts.github.io/oidc-client-ts/interfaces/OidcClientSettings.html)

- the following properties are now **required**: `authority`, `client_id`,
  `redirect_uri`
- the following properties were **renamed**:
  - `clockSkew` &rarr; `clockSkewInSeconds`
  - `staleStateAge` &rarr; `staleStateAgeInSeconds`
- default of `loadUserInfo` changed from `true` &rarr; `false`
- removed `ResponseValidatorCtor` and `MetadataServiceCtor`
  - if necessary `OidcClient` / `UserManager` classes may be extended to alter
    their behavior
- restricted `response_type` to `code` flow only (PKCE remains optional)
  - as in oidc-client 1.x, OAuth 2.0 hybrid flows are not supported

### [UserManagerSettings](https://authts.github.io/oidc-client-ts/interfaces/UserManagerSettings.html)

- the following properties were **renamed**:
  - `accessTokenExpiringNotificationTime` &rarr;
    `accessTokenExpiringNotificationTimeInSeconds`
  - `silentRequestTimeout` (milliseconds) &rarr; `silentRequestTimeoutInSeconds`
  - `checkSessionInterval` (milliseconds) &rarr; `checkSessionIntervalInSeconds`
  - `revokeAccessTokenOnSignout` &rarr; `revokeTokensOnSignout`
- the following properties have new **default values**:
  - `automaticSilentRenew` changed from `false` &rarr; `true`
  - `validateSubOnSilentRenew` changed from `false` &rarr; `true`
  - `includeIdTokenInSilentRenew` changed from `true` &rarr; `false`
  - `monitorSession` changed from `true` &rarr; `false`
- type of `popupWindowFeatures` changed from a string to a dictionary
  - additionally, its default dimensions are now responsive to the opener
    window's
- a new property `revokeTokenTypes: ('access_token' | 'refresh_token')[]` was
  added
  - by default, `UserManager` will attempt revoking both token types when
    `revokeTokensOnSignout` is `true`. Compared to 1.x, sign out will now fail
    if revocations fail.

### [UserManager](https://authts.github.io/oidc-client-ts/classes/UserManager.html)

- The shorthand for keeping the popup open after the callback with
  `signoutPopupCallback(true)` is no longer supported. Instead use
  `signoutPopupCallback(undefined, true)` or preferably,
  `signoutPopupCallback(location.href, true)`.
- renamed `revokeAccessToken()` &rarr; `revokeTokens(types?)`
  - Compared to 1.x, this function will now throw if _any_ revocation of the
    types specified fail. Uses the `revokeTokenTypes` setting when no `types`
    are passed.
