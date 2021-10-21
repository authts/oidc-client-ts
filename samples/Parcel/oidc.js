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

function addFragment(url, name, value) {
    if (url.indexOf("#") < 0) {
        url += "#";
    }

    if (url[url.length - 1] !== "#") {
        url += "&";
    }

    url += encodeURIComponent(name);
    url += "=";
    url += encodeURIComponent(value);

    return url;
}

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
        //res.send("<h1>waiting...</h1>"); return;

        var url = req.query.redirect_uri;
        var state = req.query.state;
        if (state) {
            url = addFragment(url, "state", state);
            if (req.url.indexOf("code_challenge") !== -1) {
                url = addFragment(url, "code", "foo");
            }
        }

        //url = addFragment(url, "error", "bad_stuff"); res.redirect(url); return;

        res.redirect(url);
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
        res.json({});
    });

};
