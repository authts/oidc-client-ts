oidc-client-ts is a TypeScript library intended to be used by web applications and run in browsers. It provides protocol support for OIDC and OAuth2, as well as management functions for user sessions and access tokens management.

If you are unfamiliar with OpenID Connect, then you should learn the [protocol](https://openid.net/specs/openid-connect-core-1_0.html) first. This library is designed as a spec-compliant protocol library.

There are two main classes that you might want to use depend on the level at with you use to use the library:

- [UserManager](classes/UserManager.html) provides a higher level API for signing a user in, signing out, managing the user's claims
- [OidcClient](classes/OidcClient.html) provides the raw OIDC/OAuth2 protocol support

The remainder of this document will primarily focus on the [UserManager](classes/UserManager.html).


## UserManager

### Configuration

The [UserManager](classes/UserManager.html) constructor requires a settings object as a parameter:

- [UserManagerSettings](interfaces/UserManagerSettings.html) which extends
- [OidcClientSettings](interfaces/OidcClientSettings.html)

#### Required settings
* [authority](interfaces/OidcClientSettings.html#authority): The URL of the OIDC/OAuth2 provider.
* [client_id](interfaces/OidcClientSettings.html#client_id): Your client application's identifier as registered with the OIDC/OAuth2 provider.
* [redirect_uri](interfaces/OidcClientSettings.html#redirect_uri): The redirect URI of your client application to receive a response from the OIDC/OAuth2 provider.

#### Provider settings if CORS not supported on OIDC/OAuth2 provider metadata endpoint
The [authority](interfaces/OidcClientSettings.html#authority) URL setting is used to make HTTP requests to discover more information about the OIDC/OAuth2 provider and populate a `metadata` property on the settings. If the server does not allow CORS on the metadata endpoint, then these additional settings can be manually configured. These values can be found on the metadata endpoint of the provider:
- metadata property which contains:
   - issuer
   - authorization_endpoint
   - userinfo_endpoint
   - end_session_endpoint
   - jwks_uri
- [signingKeys](interfaces/UserManagerSettings.html#signingKeys) (which is the `keys` property of the `jwks_uri` endpoint)
- [metadataSeed](interfaces/UserManagerSettings.html#metadataSeed) can be used to seed or add additional values to the results of the discovery request.

### Events
The [UserManager](classes/UserManager.html) will raise various events about the user's session:

- [UserManagerEvents](classes/UserManagerEvents.html) which extends
- [AccessTokenEvents](classes/AccessTokenEvents.html)

To register for the events, there is an `events` property on the [UserManager](classes/UserManager.html) with `addXxx` and `removeXxx` APIs to add/remove callbacks for the events. An example:

```
var mgr = new UserManager();
mgr.events.addAccessTokenExpiring(function() {
    console.log("token expiring...");
});
```


## User

The [User](classes/User.html) type is returned from the [UserManager](classes/UserManager.html)'s [getUser](classes/UserManager.html#getUser) API.


## Logging

The oidc-client-ts library supports logging. You can set a logger by assigning `Oidc.Log.logger` to anything that supports a `info`, `warn`, and `error` methods that accept a params array. By default, no logger is configured.

The `console` object in the browser supports these, so a common way to easily enable logging in the browser is to simply add this code:

```
Oidc.Log.logger = console;
```

Also, logging has levels so you can control the verbosity by setting the `Oidc.Log.level` to one of `Oidc.Log.NONE`, `Oidc.Log.ERROR`, `Oidc.Log.WARN`, or `Oidc.Log.INFO`. The default is `Oidc.Log.INFO`.


## Samples using oidc-client

- [React Helper Library](https://github.com/authts/react-oidc-context)


## Training

- [Securing Angular Apps with OpenID and OAuth2](https://noyes.me/ng-openid-oauth2)
