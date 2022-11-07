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
- [Resource Owner Password Credentials Grant](https://www.rfc-editor.org/rfc/rfc6749#section-1.3.3); however, read the [security concerns](docs/ropc.md) before using this flow
- [Refresh Token Grant](https://oauth.net/2/grant-types/refresh-token/)

## Table of Contents

- [Documentation](https://authts.github.io/oidc-client-ts/)
- [Installation](#installation)
- [Building the Source](#building-the-source)
- [Contributing](#contributing)
- [License](#license)

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

