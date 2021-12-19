// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

var jsrsasign = require("jsrsasign");
var rsaKey = jsrsasign.KEYUTIL.generateKeypair("RSA", 1024);
var e = jsrsasign.hextob64u(rsaKey.pubKeyObj.e.toString(16));
var n = jsrsasign.hextob64u(rsaKey.pubKeyObj.n.toString(16));

var path = "/oidc";
var metadataPath = path + "/.well-known/openid-configuration";
var signingKeysPath = path + "/.well-known/jwks";
var authorizationPath = path + "/connect/authorize";
var userInfoPath = path + "/connect/userinfo";
var endSessionPath = path + "/connect/endsession";
var tokenPath = path + "/connect/token";

var metadata = {
    issuer: path,
    jwks_uri: signingKeysPath,
    authorization_endpoint: authorizationPath,
    userinfo_endpoint: userInfoPath,
    end_session_endpoint: endSessionPath,
    token_endpoint: tokenPath,
};

function prependBaseUrlToMetadata(baseUrl) {
    for (var name in metadata) {
        metadata[name] = baseUrl + metadata[name];
    }
}

function encodeBase64Url(str) {
    return Buffer.from(str).toString('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
}

var keys = {
    keys: [
        {
            kty: "RSA",
            use: "sig",
            kid: "1",
            e: e,
            n: n
        }
    ]
};

var claims = {
    "sub": "818727",
    "email": "AliceSmith@email.com",
    "email_verified": true,
    "role": ["Admin", "Geek"]
};

module.exports = function(baseUrl, app) {
    prependBaseUrlToMetadata(baseUrl);

    app.get(metadataPath, function(req, res) {
        //res.send("<h1>not json...</h1>"); return;
        res.json(metadata);
    });

    app.get(signingKeysPath, function(req, res) {
        res.json(keys);
    });

    app.get(authorizationPath, function(req, res) {
        var url = new URL(req.query.redirect_uri);
        const paramsKey = req.query.response_mode === "fragment" ? "hash" : "search";
        const params = new URLSearchParams(url[paramsKey].slice(1));
        var state = req.query.state;
        if (state) {
            params.append('state', state);
            if (req.query.code_challenge) {
                params.append("code", "foo");
            }
        }
        //params.append("error", "bad_stuff");
        url[paramsKey] = params.toString();

        if (req.query.display === 'popup') {
            res.status(200);
            res.type('text/html')
            res.send(`<!DOCTYPE html>
<html>
    <head>
        <meta http-equiv="refresh" content="3;url=${url.href}" />
    </head>
    <body>
        <h1>Redirecting in 3 seconds...</h1>
    </body>
</html>`)
        } else {
            res.redirect(url.href);
        }

    });

    app.get(userInfoPath, function(req, res) {
        res.json(claims);
    });

    app.get(endSessionPath, function(req, res) {
        var url = req.query.post_logout_redirect_uri;
        if (url) {
            var state = req.query.state;
            if (state) {
                url += "?state=" + state;
            }
            res.redirect(url);
        }
        else {
            res.send("logged out");
        }
    });

    app.post(tokenPath, function(req, res) {
        res.json({
            access_token: 'foobar',
            token_type: 'Bearer',
            id_token: [{ alg: 'none' }, claims]
                .map(obj => JSON.stringify(obj))
                .map(encodeBase64Url).join('.') + '.',
        });
    });

};
