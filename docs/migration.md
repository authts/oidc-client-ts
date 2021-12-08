## oidc-client v1.11.5 &rarr; oidc-client-ts v2.0.0

Ported library from JavaScript to TypeScript. The API is largely
backwards-compatible. The support for the outdated implicit flow has been
removed.

### [OidcClientSettings](https://authts.github.io/oidc-client-ts/interfaces/OidcClientSettings.html)

- the following properties are now **required**: `authority`, `client_id`,
  `redirect_uri`
- renamed `clockSkew` &rarr; `clockSkewInSeconds`
- renamed `staleStateAge` &rarr; `staleStateAgeInSeconds`
- removed `ResponseValidatorCtor` and `MetadataServiceCtor`
  - if necessary `OidcClient` / `UserManager` classes may be extended
- restricted `response_type` to `code` flow only (PKCE remains optional)
  - as in oidc-client 1.x, OAuth 2.0 hybrid flows are not supported
- default of `loadUserInfo` changed from `true` &rarr; `false`

### [UserManagerSettings](https://authts.github.io/oidc-client-ts/interfaces/UserManagerSettings.html)

- renamed `accessTokenExpiringNotificationTime` &rarr;
  `accessTokenExpiringNotificationTimeInSeconds`
- changed `silentRequestTimeout` (milliseconds) &rarr;
  `silentRequestTimeoutInSeconds`
- changed `checkSessionInterval` (milliseconds) &rarr;
  `checkSessionIntervalInSeconds`
- default of `automaticSilentRenew` changed from `false` &rarr; `true`
- default of `validateSubOnSilentRenew` changed from `false` &rarr; `true`
- default of `includeIdTokenInSilentRenew` changed from `true` &rarr; `false`
- default of `monitorSession` changed from `true` &rarr; `false`
- type of `popupWindowFeatures` changed from a string to a dictionary
  - additionally, its defaults are responsive to the opener window's dimensions

### [UserManager](https://authts.github.io/oidc-client-ts/classes/UserManager.html)

- The shorthand for keeping the popup open after the callback with
  `signoutPopupCallback(true)` is no longer supported. Instead use
  `signoutPopupCallback(undefined, true)` or preferably,
  `signoutPopupCallback(location.href, true)`.
