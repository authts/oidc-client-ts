# Authorization Code Grant with Proof Key for Code Exchange (PKCE)

The authorization code protocol is part of OAuth 2.0 (defined in [OAuth 2.0 RFC 7636](https://tools.ietf.org/html/rfc7636)). It involves the exchange of an authorization code for a token. This is the recommended authorization code flow in the [OAuth 2.1 draft](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-v2-1-07#section-10).


## Principle of function
```mermaid
---
title: Authorization Code Grant with Proof Key for Code Exchange (PKCE)
---
sequenceDiagram
  actor User
  User->>App: Click sign-in link (1)

  activate App
  Note right of App: Generate code_verifier and<br/>code_challenge
  App->>Identity Provider: Authorization code request & code_challenge (2)
  deactivate App

  Identity Provider-->>User: Redirect to login/authorization prompt (3)
  User-->>Identity Provider: Authenticate (3)
  Identity Provider->>App: Authorization code (3)

  activate App
  App->>Identity Provider: Authorization code & code verifier (4)
  Note right of Identity Provider: Validate authorization code &<br/>code_verifier
  Identity Provider->>App: Access token and ID token (4)
  deactivate App

  App->>Your API: Request protected data with access token (5)
```

1. The user clicks sign-in within the application.
2. `signinRedirect()` or `signinPopup()` must be used to start the flow.
3. The identity provider authenticates the user and stores the code_challenge and redirects the user back to the application with an authorization code.
4. `signinCallback()` handles this callback by sending this authorization code and code_verifier to the identity provider and receiving in return the access token and ID token.
5. The access token is now accessible via `getUser()?.access_token` and inserted into the requests to your protected API.
