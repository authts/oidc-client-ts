[oidc-client-ts](https://github.com/authts/oidc-client-ts) is a TypeScript library intended to be used by web applications and run in browsers. It provides protocol support for OIDC and OAuth2, as well as management functions for user sessions and access tokens management.

If you are unfamiliar with OpenID Connect, then you should learn the
[protocol](https://openid.net/specs/openid-connect-core-1_0.html) first. This
library is designed as a spec-compliant protocol library.

There are two main classes that you might want to use depend on the level at
which you use to use the library:

- [UserManager](classes/UserManager.html) provides a higher level API for
  signing a user in, signing out, managing the user's claims
- [OidcClient](classes/OidcClient.html) provides the raw OIDC/OAuth2 protocol
  support

The remainder of this document will primarily focus on the
[UserManager](classes/UserManager.html).


# Principle of function
To understand how to use this library see here:
- [Authorization Code Grant with Proof Key for Code Exchange (PKCE)](https://github.com/authts/oidc-client-ts/blob/main/docs/protocols/authorization-code-grant-with-pkce.md)
- [Authorization Code Grant](https://github.com/authts/oidc-client-ts/blob/main/docs/protocols/authorization-code-grant.md)
- [Resource Owner Password Credentials (ROPC) Grant](https://github.com/authts/oidc-client-ts/blob/main/docs/protocols/resource-owner-password-credentials-grant.md)
- [Refresh Token Grant](https://github.com/authts/oidc-client-ts/blob/main/docs/protocols/refresh-token-grant.md)
- [Silent Refresh Token in iframe Flow](https://github.com/authts/oidc-client-ts/blob/main/docs/protocols/silent-refresh-token-in-iframe-flow.md)

# UserManager

## Configuration
The [UserManager](classes/UserManager.html) constructor requires a settings
object as a parameter:

- [UserManagerSettings](interfaces/UserManagerSettings.html) which extends
- [OidcClientSettings](interfaces/OidcClientSettings.html)

### Required settings
- [authority](interfaces/OidcClientSettings.html#authority): The URL of the
  OIDC/OAuth2 provider.
- [client_id](interfaces/OidcClientSettings.html#client_id): Your client
  application's identifier as registered with the OIDC/OAuth2 provider.
- [redirect_uri](interfaces/OidcClientSettings.html#redirect_uri): The redirect
  URI of your client application to receive a response from the OIDC/OAuth2
  provider.

### Provider settings if CORS not supported on OIDC/OAuth2 provider metadata endpoint
The [authority](interfaces/OidcClientSettings.html#authority) URL setting is
used to make HTTP requests to discover more information about the OIDC/OAuth2
provider and populate a `metadata` property on the settings. If the server does
not allow CORS on the metadata endpoint, then these additional settings can be
manually configured. These values can be found on the metadata endpoint of the
provider:

- metadata property which contains:
  - issuer
  - authorization_endpoint
  - userinfo_endpoint
  - end_session_endpoint
- [metadataSeed](interfaces/UserManagerSettings.html#metadataSeed) can be used
  to seed or add additional values to the results of the discovery request.

## Events
The [UserManager](classes/UserManager.html) will raise various events about the
user's session:

- [UserManagerEvents](classes/UserManagerEvents.html) which extends
- [AccessTokenEvents](classes/AccessTokenEvents.html)

To register for the events, there is an `events` property on the
[UserManager](classes/UserManager.html) with `addXxx` and `removeXxx` APIs to
add/remove callbacks for the events. An example:

```javascript
const mgr = new UserManager();
mgr.events.addAccessTokenExpiring(function() {
    console.log("token expiring...");
});
```

# User
The [User](classes/User.html) type is returned from the [UserManager](classes/UserManager.html)'s [getUser](classes/UserManager.html#getUser) API.


# Logging
The oidc-client-ts library supports logging. You can set a logger by assigning `Oidc.Log.logger` to anything that supports a `info`, `warn`, and `error` methods that accept a params array. By default, no logger is configured.

The `console` object in the browser supports these, so a common way to easily
enable logging in the browser is to simply add this code:

```javascript
Oidc.Log.setLogger(console);
```

Also, logging has levels so you can control the verbosity by calling
`Oidc.Log.setLevel()` with one of `Oidc.Log.NONE`, `Oidc.Log.ERROR`,
`Oidc.Log.WARN`, or `Oidc.Log.INFO`. The default is `Oidc.Log.INFO`.

# Provider specific settings
Additional provider specific settings may be needed for a flawless operation:

**Amazon Cognito**
```javascript
const mgr = new UserManager({
    // ...
    // no revoke of "access token" (https://github.com/authts/oidc-client-ts/issues/262)
    revokeTokenTypes: ["refresh_token"],
    // no silent renew via "prompt=none" (https://github.com/authts/oidc-client-ts/issues/366)
    automaticSilentRenew: false,
});
```


# Custom state in user object
In case you would like to add additional data into the [User](classes/User.html) object, you can do so during the initial sign-in request.

```javascript
const mgr = new UserManager();
const customState = { foo: "bar" };
mgr.signinRedirect({ state: customState });
```

After successful sign-in, the custom state is part of the [User](classes/User.html#state) object as `state`. In case of failure, it is inside [ErrorResponse](classes/ErrorResponse.html#state).

This custom state should not be confused with the URL state parameter. The latter is internally used to match against the authentication state object to finish the authentication process.

# Custom state in request url
If you would like to encode a custom state string in the sign-in request url, you can do so with the `url_state` parameter. You may want to do this in order to pass user state to the authentication server and/or a proxy and return that state as part of the response.

```javascript
const mgr = new UserManager();
mgr.signinRedirect({ url_state: 'custom url state' })
```

The `url_state` will be appended to the opaque, unique value created by the library when sending the request. It should survive the round trip to your authentication server and will be part of the [User](classes/User.html#url_state) object as `url_state`.


# Hash-mode router (SPA)
If your app is using hash-based routing, be aware that many OIDC providers append the query string after the hash instead of inserting it before:  
**Correct:** `https://your.org/?code=ab&state=cd#/oidc-callback`  
**Wrong:** `https://your.org/#/oidc-callback?code=ab&state=cd`

Check out [this issue]([https://github.com/authts/oidc-client-ts/issues/734#issuecomment-1298381823](https://github.com/authts/oidc-client-ts/issues/734)) for details. (There are also workarounds, as long as your provider doesn't fix the issue)

# Projects using oidc-client-ts

- [React context provider](https://github.com/authts/react-oidc-context)
- [Angular sample](https://github.com/authts/sample-angular-oidc-client-ts)
- [Chrome service worker](https://github.com/Alino/OIDC-client-ts-chromium-sample)


# Training

- [Securing Angular Apps with OpenID Connect and OAuth2](https://www.pluralsight.com/courses/openid-and-oauth2-securing-angular-apps)
