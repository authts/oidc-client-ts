# Demonstrating Proof of Possession (DPoP)

Demonstrating Proof of Possession (DPoP) is defined in [RFC 9449 OAuth2.0 Demonstrating Proof of Possession (DPoP)](https://datatracker.ietf.org/doc/html/rfc9449).

DPoP is described as a mechanism for sender-constraining OAuth 2.0 tokens via a proof-of-possession mechanism on the application level. This mechanism allows for the detection of replay attacks with access and refresh tokens.

Essentially this means that tokens are bound to a particular client device, as long as the private key used to generate
the DPoP proof is not compromised.

## Usage

To use the DPoP feature add the `dpop` configuration option when instantiating either the UserManager or OidcClient classes:

```typescript
import { UserManager } from 'oidc-client-ts';

const settings = {
    authority: 'https://demo.identityserver.io',
    client_id: 'interactive.public',
    redirect_uri: 'http://localhost:8080',
    response_type: 'code',
    scope: 'openid profile email api',
    post_logout_redirect_uri: 'http://localhost:8080',
    userStore: new WebStorageStateStore({ store: window.localStorage }),
    dpop: {
        bind_authorization_code: true,
        store: new IndexedDbDPoPStore()
    }
};

const userManager = new UserManager(settings);
```
## DPoP configuration options

- `bind_authorization_code` - If true, the DPoP proof will be [bound to the authorization code](https://datatracker.ietf.org/doc/html/rfc9449#name-authorization-code-binding-) as well as subsequent token requests. This is optional and defaults to false.
- `store` - The DPoP store to use. This is where the DPoP proof will be stored and must be supplied. We provide a default implementation `IndexedDbDPoPStore` which stores the DPoP proof in IndexedDb.

### IndexedDbDPoPStore

The `IndexedDbDPoPStore` is a default implementation of the `DPoPStore` interface. It stores the DPoP proof in IndexedDb.

IndexedDb is used as storage because it is the only storage mechanism that is available that allows for storing CryptoKeyPair objects
with non-extractable private keys securely. The object itself, when retrieved from storage, is still available to perform signing operations but the key material can
never be extracted directly. Storing CryptoKeyPair objects as plain text in storage mechanisms such as `localStorage` or `sessionStorage`
is not recommended as it exposes the private key material to potential attackers.

## DPoP Proofs and Protected Resources

Once an access token has been issued that is bound to a DPoP public key, [resource servers](https://datatracker.ietf.org/doc/html/rfc9449#name-protected-resource-access) that support DPoP
require that an authenticated request include a DPoP Proof. Additionally, DPoP replaces the Bearer authentication [scheme](https://datatracker.ietf.org/doc/html/rfc9449#section-7.1):

The `UserManager.dpopProof` method is provided which allows easily generating a DPoP proof for a given request. E.g.

```typescript
// settings include the DPoP configuration

const mgr = new UserManager(settings);

// sign the user in and receive an access token

// generate a DPoP proof and make a request to a protected resource
const DPoPProof = await mgr.dpopProof("https://localhost:5005/api", user);
const token = user?.access_token;
const response = await fetch("https://localhost:5005/api", {
    credentials: "include",
    mode: "cors",
    method: "GET",
    headers: {
        Authorization: `DPoP ${token}`,
        DPoP: DPoPProof,
    },
});
```
