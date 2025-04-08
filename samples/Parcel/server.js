// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.
var port = 15000;
var url = "http://localhost:" + 1234;

var express = require("express");
var app = express();

var oidc = require("./oidc");
oidc(url, app);

console.log("listening on " + url);
app.listen(port);
