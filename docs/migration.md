## oidc-client-ts v2.4.0 &rarr; oidc-client-ts v3.0.0

The API is largely backwards-compatible.

The "crypto-js" software library has been removed; the native crypto/crypto.subtle module built into the browser is instead used. All modern browsers are expected to support it. If you need to support older browsers, stay with v2.4!

The behavior of merging claims has been improved.

### [OidcClientSettings](https://authts.github.io/oidc-client-ts/interfaces/OidcClientSettings.html)

- the following deprecated properties were **removed**:
  - `clockSkewInSeconds`
  - `userInfoJwtIssuer`
  - `refreshTokenCredentials` use `fetchRequestCredentials`
- the `mergeClaims` has been replaced by `mergeClaimsStrategy`
  - if the previous behavior is required, `mergeClaimsStrategy: { array: "merge" }` comes close to it
- default of `response_mode` changed from `query` &rarr; `undefined`


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
  - if necessary, `OidcClient` / `UserManager` classes may be extended to alter
    their behavior
- restricted `response_type` to `code` flow only. As per [OAuth 2.1](https://oauth.net/2.1/): **PKCE is required** for all OAuth clients using the authorization `code` flow
  - as in oidc-client 1.x, OAuth 2.0 hybrid flows are not supported
- the property `signingKeys` is unused, unless the MetaDataService with this feature is used
  outside of this library.

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
- a new property `revokeTokenTypes: ('access_token' | 'refresh_token')[]` was added
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

### [Log](https://authts.github.io/oidc-client-ts/modules/Log.html)

- The getter/setters for `Log.level` and `Log.logger` have been replaced by
  `Log.setLevel()` and `Log.setLogger()`.

### [User](https://authts.github.io/oidc-client-ts/classes/User.html)

- The getter for `User.expired` now returns `true` when `expires_at` is set to `0`. This was `false` in the previous version.
