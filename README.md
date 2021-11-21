# oidc-client-ts

[![Stable Release](https://img.shields.io/npm/v/oidc-client-ts.svg)](https://npm.im/oidc-client-ts)
![Pipeline](https://github.com/authts/oidc-client-ts/workflows/Release/badge.svg)
![Codecov](https://img.shields.io/codecov/c/github/authts/oidc-client-ts)

Library to provide OpenID Connect (OIDC) and OAuth2 protocol support for client-side, browser-based JavaScript client
applications. Also included is support for user session and access token management.

This is a forked version of the [oidc-client-js](https://github.com/IdentityModel/oidc-client-js) library, which has
been archived and is no longer maintained. This version has been refactored from JavaScript to TypeScript. Trying to keep the API as compatible as possible. The support for the outdated implicit flow has been removed. When migrating see [here](docs/migration.md).

**Contributions and help is much appreciated!**

Implements the following OAuth 2.0 protocols and supports [OpenID Connect](https://openid.net/specs/openid-connect-core-1_0.html):
- [Authorization Code Grant](https://oauth.net/2/grant-types/authorization-code/) with [PKCE](https://oauth.net/2/pkce/)
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
$ npm install oidc-client-ts
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
$ npm run -w parcel-sample start
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

This project is licensed under the Apache-2.0 license. See the [LICENSE](https://github.com/authts/oidc-client-ts/blob/main/LICENSE) file for more info.
