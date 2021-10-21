# oidc-client-ts

[![Stable Release](https://img.shields.io/npm/v/oidc-client-ts.svg)](https://npm.im/oidc-client-ts)
![Pipeline](https://github.com/authts/oidc-client-ts/workflows/Release/badge.svg)

Library to provide OpenID Connect (OIDC) and OAuth2 protocol support for client-side, browser-based JavaScript client
applications. Also included is support for user session and access token management.

This is a forked version of the [oidc-client-js](https://github.com/IdentityModel/oidc-client-js) library, which has
been archived and is no longer maintained. This version has been refactored from JavaScript to TypeScript. Trying to keep the API as compatible as possible. The support for the outdated implicit flow has been removed.

**Contributions and help is much appreciated!**

## Table of Contents

-   [Documentation](#documentation)
-   [Installation](#installation)
-   [Building the Source](#building-the-source)
-   [Contributing](#contributing)
-   [License](#license)

## Documentation

Some initial docs are [here](https://github.com/IdentityModel/oidc-client-js/wiki).

## Installation

Using [npm](https://npmjs.org/)

```console
$ npm install oidc-client-ts
```

## Building the Source

```console
$ git clone https://github.com/authts/oidc-client-ts.git
$ cd oidc-client-ts
$ npm install
$ npm run build
```

### Running the Sample

**Parcel project**

```console
$ npm run -w parcel-sample start
```

**Angular app**

```console
$ npm run -w angular-sample start
```

and then browse to [http://localhost:1234](http://localhost:1234).

### Running the Tests

```console
$ npm test
```

## Contributing

We appreciate feedback and contribution to this repo!

## License

This project is licensed under the Apache-2.0 license. See the [LICENSE](https://github.com/authts/oidc-client-ts/blob/main/LICENSE) file for more info.
