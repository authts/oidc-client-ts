# Silent Refresh Token in iframe Flow

This flow is using the OAuth2.0 [Authorization Code Grant with Proof Key for Code Exchange (PKCE)](https://github.com/authts/oidc-client-ts/blob/main/docs/protocols/authorization-code-grant-with-pkce.md) or [Authorization Code Grant](https://github.com/authts/oidc-client-ts/blob/main/docs/protocols/authorization-code-grant.md) grants.

Difference: To silently refresh the token, the server callback is handled in a hidden iframe and not in the main browsing window.

Running this flow in an iframe succeeds when the user has an authenticated session with the identity provider.
The identity provider is storing a session cookie during the initial authentication. This cookie must be accessible for this flow to work.


## Principle of function
```mermaid
---
title: Silent Refresh Token in iframe Flow
---
sequenceDiagram
  App->>Hidden iframe: Load silent<br/>Authorization Code Grant<br/>in an iframe (1)

  activate Hidden iframe
  Note right of Hidden iframe: PKCE: Generate code_verifier and<br/>code_challenge
  Hidden iframe->>Identity Provider: Authorization code request (1)
  deactivate Hidden iframe
  Note right of Hidden iframe: PKCE: with code_challenge
  Note right of Identity Provider: Validate session cookie

  Identity Provider->>Hidden iframe: Authorization code (2)
  activate Hidden iframe
  Hidden iframe->>App: Notify parent window (3)
  deactivate Hidden iframe

  activate App
  App->>Identity Provider: Authorization code & code verifier or client secret (3)
  Note right of Identity Provider: Validate authorization code &<br/>code verifier or client secret
  Identity Provider->>App: Access token and ID token (3)
  deactivate App

  App->>Your API: Request protected data with refreshed access token (4)
```

1. `signinSilent()` must be used to start the flow.
2. The identity provider knows the user already by using the session cookie and redirects the user back to the application with an authorization code.
3. `signinCallback()` handles this callback by sending this authorization code and code_verifier (PKCE) or client secret to the identity provider and receiving in return the access token and ID token.
4. The access token is now accessible via `getUser()?.access_token` and inserted into the requests to your protected API.
