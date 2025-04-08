// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Log, OidcClient, settings } from "./sample-settings";

///////////////////////////////
// UI event handlers
///////////////////////////////
document.getElementById("signin").addEventListener("click", signin, false);
document.getElementById("processSignin").addEventListener("click", processSigninResponse, false);
document.getElementById("signout").addEventListener("click", signout, false);
document.getElementById("processSignout").addEventListener("click", processSignoutResponse, false);
document.getElementById("links").addEventListener("change", toggleLinks, false);

///////////////////////////////
// OidcClient config
///////////////////////////////

function log() {
    document.getElementById("out").innerText = "";

    Array.prototype.forEach.call(arguments, function(msg) {
        if (msg instanceof Error) {
            msg = "Error: " + msg.message;
        }
        else if (typeof msg !== "string") {
            msg = JSON.stringify(msg, null, 2);
        }
        document.getElementById("out").innerHTML += msg + "\r\n";
    });
}

var client = new OidcClient(settings);

///////////////////////////////
// functions for UI elements
///////////////////////////////
function signin() {
    var optionalArgs = { 
        state: { bar: 15 } // state is data that you want to roundtrip, it is not used by the protocol
    };
    client.createSigninRequest(optionalArgs).then(function(req) {
        log("signin request", req, "<a href='" + req.url + "'>go signin</a>");
        if (followLinks()) {
            window.location = req.url;
        }
    }).catch(function(err) {
        console.error(err);
        log(err);
    });
}

var signinResponse;
function processSigninResponse() {
    client.processSigninResponse(window.location.href).then(function(response) {
        signinResponse = response;
        log("signin response", signinResponse);
    }).catch(function(err) {
        console.error(err);
        log(err);
    });
}

function signout() {
    var optionalArgs = { 
        state: { bar: 15 }, 
        client_id: settings.client_id 
    };

    client.createSignoutRequest(optionalArgs).then(function(req) {
        log("signout request", req, "<a href='" + req.url + "'>go signout</a>");
        if (followLinks()) {
            window.location = req.url;
        }
    });
}

function processSignoutResponse() {
    client.processSignoutResponse(window.location.href).then(function(response) {
        signinResponse = null;
        log("signout response", response);
    }).catch(function(err) {
        console.error(err);
        log(err);
    });
}

function toggleLinks() {
    var val = document.getElementById("links").checked;
    localStorage.setItem("follow", val);

    var display = val ? "none" : "";

    document.getElementById("processSignin").style.display = display;
    document.getElementById("processSignout").style.display = display;
}

function followLinks() {
    return localStorage.getItem("follow") === "true";
}

var follow = followLinks();
var display = follow ? "none" : "";
document.getElementById("links").checked = follow;
document.getElementById("processSignin").style.display = display;
document.getElementById("processSignout").style.display = display;

if (followLinks()) {
    if (window.location.href.indexOf("#") >= 0) {
        processSigninResponse();
    }
    else if (window.location.href.indexOf("?") >= 0) {
        processSignoutResponse();
    }
}

export {
    log
};
