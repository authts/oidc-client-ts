# oidc-client-ts

[![Stable Release](https://img.shields.io/npm/v/oidc-client-ts.svg)](https://npm.im/oidc-client-ts)
[![CI](https://github.com/authts/oidc-client-ts/actions/workflows/ci.yml/badge.svg)](https://github.com/authts/oidc-client-ts/actions/workflows/ci.yml)
[![Codecov](https://img.shields.io/codecov/c/github/authts/oidc-client-ts)](https://app.codecov.io/gh/authts/oidc-client-ts)

Library to provide OpenID Connect (OIDC) and OAuth2 protocol support for
client-side, browser-based JavaScript client applications. Also included is
support for user session and access token management.

This project is a fork of
[IdentityModel/oidc-client-js](https://github.com/IdentityModel/oidc-client-js)
which halted its development in June 2021. It has since been ported to
TypeScript here with a similar API for the initial 2.0 release. Going forward,
this library will focus only on protocols that continue to have support in
[OAuth 2.1](https://oauth.net/2.1/). As such, the implicit grant is not
supported by this client. Additional migration notes from `oidc-client` are
available [here](docs/migration.md).

**Contributions and help are greatly appreciated!**

Implements the following OAuth 2.0 protocols and supports
[OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html):

- [Authorization Code Grant](https://oauth.net/2/grant-types/authorization-code/)
  with [PKCE](https://oauth.net/2/pkce/)
- [Resource Owner Password Credentials Grant](https://www.rfc-editor.org/rfc/rfc6749#section-1.3.3); however, read the security concerns below before using this flow
- [Refresh Token Grant](https://oauth.net/2/grant-types/refresh-token/)

## Table of Contents

- [Documentation](https://authts.github.io/oidc-client-ts/)
- [Installation](#installation)
- [Building the Source](#building-the-source)
- [Contributing](#contributing)
- [License](#license)
- [Security concerns on Resource Owner Password Credentials flow](#security-concerns-on-resource-owner-password-credentials-flow)

## Installation

Using [npm](https://npmjs.org/)

```sh
$ npm install oidc-client-ts --save
```

## Building the Source

```sh
$ git clone https://github.com/authts/oidc-client-ts.git
$ cd oidc-client-ts
$ npm install
$ npm run build
```

### Running the Sample

**Parcel project**

```sh
$ cd samples/Parcel
$ npm install
$ npm run start
```

and then browse to [http://localhost:1234](http://localhost:1234).

**Angular app**

can be found [here](https://github.com/authts/sample-angular-oidc-client-ts).

### Running the Tests

```sh
$ npm test
```

## Contributing

We appreciate feedback and contribution to this repo!

## License

This project is licensed under the Apache-2.0 license. See the
[LICENSE](https://github.com/authts/oidc-client-ts/blob/main/LICENSE) file for
more info.

## Security concerns on Resource Owner Password Credentials flow

This OAuth 2.0 flow implies some security risks, so you should only use it after a security assesment.

To start with, this flow is not part of the [Open ID Connect standard](https://openid.net/specs/openid-connect-core-1_0.html). Furthermore, although it is part of [OAuth 2.0](https://www.rfc-editor.org/rfc/rfc6749#section-4.3), it has been removed in the [OAuth 2.1 draft](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-v2-1-07#section-10), and there are good reasons for this:

* When using this flow, the credentials of the user are exposed to the client application. The RFC mandates that ["the client application MUST discard the credentials once the access token has been obtained"](https://www.rfc-editor.org/rfc/rfc6749#section-4.3.1), but there is no technical way for the Identity Provider / Authorization Server to enforce this point. This flow MUST NOT be allowed unless the Client can be enforced to fulfill this requirement through other means (probably because both are under the same security domain, probably the same organization or similar constraints). This point is covered [several](https://www.rfc-editor.org/rfc/rfc6749#section-1.3.3) [times](https://www.rfc-editor.org/rfc/rfc6749#section-4.3) during the RFC and by some IdP implementations, such as [Auth0](https://auth0.com/docs/get-started/authentication-and-authorization-flow/resource-owner-password-flow) or [Keycloak](https://www.keycloak.org/docs/latest/securing_apps/#_resource_owner_password_credentials_flow), but it is sometimes quickly ignored by some developers.

* Even if the previous point is covered, this flow is increasing the attack surface of the system. For example, if the Client Application is compromised (maybe through an XSS attack, for example), the credentials of the user are exposed, so the attacker have access to other applications accessible by the user. In comparison, for example, in the Authorization Code Flow if the Client Application is equaly compromised only the access token is exposed, usually meaning that only the given application has been compromised. A different way to see this is: usually the IdP/Authorization Server are strongly protected, and the Client Applications are allowed lower levels of security auditing... but when using this flow, if any of them is exposed, the user credentials are exposed; so both of them should be equaly treated regarding security.

Therefor, this flow MUST NOT be used as a replacement for the Authorization Code flow. This flow can only be seen as a replacement of classic form-based user/password authentication directly in the application.

Then, why are we adding this support in `oidc-client-ts`? Well... form-based user/password authentication is actually widely used in the industry, and using a standard IdP as authenticator for this architecture has some benefits (other things, such as password expiration, user management backoffice, etc are provided for free by the IdP). So this flow can be an easy help in this scenario. But you MUST NOT use this flow believing that you are having all the security benefits of OpenId Connect or OAuth; you are not.
