---
sidebar_position: 1
slug: /
---

# oidc-client
oidc-client is a JavaScript library intended to run in browsers (and possibly Cordova style applications). It provides protocol support for OIDC and OAuth2, as well as management functions for user sessions and access tokens management.

If you are unfamiliar with OpenID Connect, then you should learn the [protocol](https://openid.net/specs/openid-connect-core-1_0.html) first. This library is designed as a spec-compliant protocol library.

There are two main classes that you might want to use depend on the level at with you use to use the library:

The `UserManager` class provides a higher level API for signing a user in, signing out, managing the user's claims returned from the OIDC provider, and managing an access token returned from the OIDC/OAuth2 provider. The `UserManager` is the primary feature of the library.

The `OidcClient` class provides the raw OIDC/OAuth2 protocol support for the authorization endpoint and the end session endpoint in the authorization server. It provides a bare-bones protocol implementation and is used by the `UserManager` class. Only use this class if you simply want protocol support without the additional management features of the `UserManager` class.

The remainder of this document will primarily focus on the `UserManager`.

## UserManager

### Configuration

The `UserManager` constructor requires a settings object as a parameter. The settings has these properties:

#### Required Settings
* authority (string): The URL of the OIDC/OAuth2 provider.
* client_id (string): Your client application's identifier as registered with the OIDC/OAuth2 provider.
* redirect_uri (string): The redirect URI of your client application to receive a response from the OIDC/OAuth2 provider.
* response_type (string, default: `'code'`): The type of response desired from the OIDC/OAuth2 provider.
* scope (string, default: `'openid'`): The scope being requested from the OIDC/OAuth2 provider.

#### Provider settings if CORS not supported on OIDC/OAuth2 provider metadata endpoint
The `authority` URL setting is used to make HTTP requests to discover more information about the OIDC/OAuth2 provider and populate a `metadata` property on the settings. If the server does not allow CORS on the metadata endpoint, then these additional settings can be manually configured. These values can be found on the metadata endpoint of the provider:
* metadata property which contains:
   * issuer
   * authorization_endpoint
   * userinfo_endpoint
   * end_session_endpoint
   * jwks_uri
* signingKeys (which is the `keys` property of the `jwks_uri` endpoint)
* metadataSeed can be used to seed or add additional values to the results of the discovery request.

#### Optional Authorization Request Settings
* prompt
* display
* max_age
* ui_locales
* login_hint
* acr_values

#### Other Optional Settings
* clockSkew (number, default: `300`): The window of time (in seconds) to allow the current time to deviate when validating token's `iat`, `nbf`, and `exp` values.
* loadUserInfo (boolean, default: `true`): Flag to control if additional identity data is loaded from the user info endpoint in order to populate the user's `profile`.
* filterProtocolClaims (boolean, default: `true`): Should OIDC protocol claims be removed from `profile`.
* post_logout_redirect_uri (string): The OIDC/OAuth2 post-logout redirect URI.
* popup_redirect_uri (string): The URL for the page containing the call to `signinPopupCallback` to handle the callback from the OIDC/OAuth2
* popupWindowFeatures (string, default: `'location=no,toolbar=no,width=500,height=500,left=100,top=100'`): The `features` parameter to `window.open` for the popup signin window.
* popupWindowTarget (string, default: `'_blank'`): The `target` parameter to `window.open` for the popup signin window.
* silent_redirect_uri (string): The URL for the page containing the code handling the silent renew.
* automaticSilentRenew (boolean, default: `false`): Flag to indicate if there should be an automatic attempt to renew the access token prior to its expiration. The attempt is made as a result of the `accessTokenExpiring` event being raised.
* silentRequestTimeout (number, default: `10000`): Number of milliseconds to wait for the silent renew to return before assuming it has failed or timed out.
* accessTokenExpiringNotificationTime (number, default: `60`): The number of seconds before an access token is to expire to raise the `accessTokenExpiring` event.
* stateStore: (default: local storage): Storage object used to persist interaction state. E.g. `userStore: new WebStorageStateStore({ store: window.localStorage })`
* userStore: (default: session storage): Storage object used to persist `User` for currently authenticated user. E.g. `userStore: new WebStorageStateStore({ store: window.localStorage })`
* monitorSession [1.1.0]: (default: `true`): Will raise events for when user has performed a signout at the OP.
* checkSessionInterval: (default: `2000`): Interval, in ms, to check the user's session.
* revokeAccessTokenOnSignout [1.2.1] (default: `false`): Will invoke the revocation endpoint on signout if there is an access token for the user.
* staleStateAge (default: `300`): Number (in seconds) indicating the age of state entries in storage for authorize requests that are considered abandoned and thus can be cleaned up.
* extraQueryParams: (object): An object containing additional query string parameters to be including in the authorization request. E.g, when using Azure AD to obtain an access token an additional resource parameter is required. extraQueryParams: `{resource:"some_identifier"}`
* mergeClaims [1.11.0] (default: `false`): Indicates if objects returned from the user info endpoint as claims (e.g. `address`) are merged into the claims from the id token as a single object. Otherwise, they are added to an array as distinct objects for the claim type.
* client_authentication [1.11.0] (default: `client_secret_post`): Indicates when sending client secret if sent as a post param or in `Authorization` header using HTTP Basic (use `client_secret_basic`).
* clockService [1.11.0]: Service that can be configured to get the clock time. Used to deal with client machines with incorrect clocks.

### Methods
* getUser: Returns promise to load the `User` object for the currently authenticated user.
* removeUser: Returns promise to remove from any storage the currently authenticated user.
* signinRedirect: Returns promise to trigger a redirect of the current window to the authorization endpoint.
* signinRedirectCallback: Returns promise to process response from the authorization endpoint. The result of the promise is the authenticated `User`.
* signinSilent: Returns promise to trigger a silent request (via an iframe) to the authorization endpoint. The result of the promise is the authenticated `User`.
* signinSilentCallback: Returns promise to notify the parent window of response from the authorization endpoint.
* signinPopup: Returns promise to trigger a request (via a popup window) to the authorization endpoint. The result of the promise is the authenticated `User`.
* signinPopupCallback: Returns promise to notify the opening window of response from the authorization endpoint.
* signoutRedirect: Returns promise to trigger a redirect of the current window to the end session endpoint.
* signoutRedirectCallback: Returns promise to process response from the end session endpoint.
* signoutPopup [1.4.0]: Returns promise to trigger a redirect of a popup window window to the end session endpoint.
* signoutPopupCallback [1.4.0]: Returns promise to process response from the end session endpoint from a popup window.
* querySessionStatus [1.1.0]: Returns promise to query OP for user's current signin status. Returns object with session_state and subject identifier.
* startSilentRenew [1.4.0]: Enables silent renew for the `UserManager`.
* stopSilentRenew [1.4.0]: Disables silent renew for the `UserManager`.
* clearStaleState: Removes stale state entries in storage for incomplete authorize requests.

### Properties
* settings: Returns the settings used to configure the `UserManager`.
* events: Returns an object used to register for events raised by the `UserManager`.
* metadataService: Returns an object used to access the metadata configuration of the OIDC provider.

### Events
The `UserManager` will raise various events about the user's session:

* userLoaded: Raised when a user session has been established (or re-established).
* userUnloaded: Raised when a user session has been terminated.
* accessTokenExpiring: Raised prior to the access token expiring.
* accessTokenExpired: Raised after the access token has expired.
* silentRenewError: Raised when the automatic silent renew has failed.
* userSignedIn [1.9.0]: Raised when the user is signed in.
* userSignedOut [1.1.0]: Raised when the user's sign-in status at the OP has changed.
* userSessionChanged: Raised when the user session changed (when `monitorSession` is set)

To register for the events, there is an `events` property on the `UserManager` with `addXxx` and `removeXxx` APIs to add/remove callbacks for the events. An example:

```
var mgr = new UserManager();
mgr.events.addAccessTokenExpiring(function(){
    console.log("token expiring...");
});
```

## User

The `User` type is returned from the `UserManager`'s `getUser` API. It contains these properties:

* profile: The claims represented by a combination of the `token` and the user info endpoint.
* session_state: The session state value returned from the OIDC provider.
* access_token: The access token returned from the OIDC provider.
* scope: The scope returned from the OIDC provider.
* expires_at: The expires at returned from the OIDC provider.
* expires_in: Calculated number of seconds the access token has remaining.
* expired: Calculated value indicating if the access token is expired.
* scopes: Array representing the parsed values from the `scope`.

## Logging

The oidc-client-js library supports logging. You can set a logger by assigning `Oidc.Log.logger` to anything that supports a `info`, `warn`, and `error` methods that accept a params array. By default, no logger is configured.

The `console` object in the browser supports these, so a common way to easily enable logging in the browser is to simply add this code:

```
Oidc.Log.logger = console;
```

Also, logging has levels so you can control the verbosity by setting the `Oidc.Log.level` to one of `Oidc.Log.NONE`, `Oidc.Log.ERROR`, `Oidc.Log.WARN`, or `Oidc.Log.INFO`. The default is `Oidc.Log.INFO`.

## Samples using oidc-client

* [Angular2](https://github.com/jmurphzyo/Angular2OidcClient)
* [Aurelia](https://github.com/shaunluttin/aurelia-open-id-connect)
* [ReactJS & Redux](https://github.com/maxmantz/redux-oidc)
* [Blog post on Angular](https://www.scottbrady91.com/Angular/SPA-Authentiction-using-OpenID-Connect-Angular-CLI-and-oidc-client)
* [Vue.js](https://github.com/joaojosefilho/vuejsOidcClient)
* [Quasar Framework](https://github.com/patrickmonteiro/quasarOidcClient)
* [Angular2](https://github.com/fileless/ng-oidc-client)
* [Vue/Vuex](https://github.com/perarnborg/vuex-oidc)
* [React Context & React Redux](https://github.com/AxaGuilDEv/react-oidc)
* [Angular and Keycloak](https://robferguson.org/blog/2019/12/29/angular-openid-connect-keycloak/)
* [React Helper Library](https://github.com/bjerkio/oidc-react)

## Training

* [Securing Angular Apps with OpenID and OAuth2](https://noyes.me/ng-openid-oauth2)
