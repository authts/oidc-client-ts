// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { UserManager, settings } from "./sample-settings";

///////////////////////////////
// UI event handlers
///////////////////////////////
document.getElementById("clearState").addEventListener("click", clearState, false);
document.getElementById("getUser").addEventListener("click", getUser, false);
document.getElementById("removeUser").addEventListener("click", removeUser, false);
document.getElementById("querySessionStatus").addEventListener("click", querySessionStatus, false);
document.getElementById("revokeAccessToken").addEventListener("click", revokeAccessToken, false);

document.getElementById("startSigninMainWindow").addEventListener("click", startSigninMainWindow, false);
document.getElementById("endSigninMainWindow").addEventListener("click", endSigninMainWindow, false);

document.getElementById("popupSignin").addEventListener("click", popupSignin, false);
document.getElementById("iframeSignin").addEventListener("click", iframeSignin, false);

document.getElementById("startSignoutMainWindow").addEventListener("click", startSignoutMainWindow, false);
document.getElementById("endSignoutMainWindow").addEventListener("click", endSignoutMainWindow, false);

document.getElementById("popupSignout").addEventListener("click", popupSignout, false);

///////////////////////////////
// config
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

var mgr = new UserManager(settings);

///////////////////////////////
// events
///////////////////////////////
mgr.events.addAccessTokenExpiring(function () {
    console.log("token expiring");
    log("token expiring");

    // maybe do this code manually if automaticSilentRenew doesn't work for you
    mgr.signinSilent().then(function(user) {
        log("silent renew success", user);
    }).catch(function(e) {
        log("silent renew error", e.message);
    });
});

mgr.events.addAccessTokenExpired(function () {
    console.log("token expired");
    log("token expired");
});

mgr.events.addSilentRenewError(function (e) {
    console.log("silent renew error", e.message);
    log("silent renew error", e.message);
});

mgr.events.addUserLoaded(function (user) {
    console.log("user loaded", user);
    mgr.getUser().then(function() {
        console.log("getUser loaded user after userLoaded event fired");
    });
});

mgr.events.addUserUnloaded(function (e) {
    console.log("user unloaded");
});

mgr.events.addUserSignedIn(function (e) {
    log("user logged in to the token server");
});
mgr.events.addUserSignedOut(function (e) {
    log("user logged out of the token server");
});

///////////////////////////////
// functions for UI elements
///////////////////////////////
function clearState() {
    mgr.clearStaleState().then(function() {
        log("clearStateState success");
    }).catch(function(err) {
        console.error(err);
        log(err);
    });
}

function getUser() {
    mgr.getUser().then(function(user) {
        log("got user", user);
    }).catch(function(err) {
        console.error(err);
        log(err);
    });
}

function removeUser() {
    mgr.removeUser().then(function() {
        log("user removed");
    }).catch(function(err) {
        console.error(err);
        log(err);
    });
}

function querySessionStatus() {
    mgr.querySessionStatus().then(function(status) {
        log("user's session status", status);
    }).catch(function(err) {
        console.error(err);
        log(err);
    });
}

function revokeAccessToken() {
    mgr.revokeAccessToken().then(function() {
        log("access token revoked");
    }).catch(function(err) {
        console.error(err);
        log(err);
    });
}

function startSigninMainWindow() {
    mgr.signinRedirect({ state: { foo: "bar" } /*, useReplaceToNavigate: true*/ }).then(function() {
        log("signinRedirect done");
    }).catch(function(err) {
        console.error(err);
        log(err);
    });
}

function endSigninMainWindow() {
    mgr.signinCallback().then(function(user) {
        log("signed in", user);
        // this is how you get the custom state after the login:
        var customState = user.state;
        console.log("here's our post-login custom state", customState);
    }).catch(function(err) {
        console.error(err);
        log(err);
    });
}

function popupSignin() {
    mgr.signinPopup().then(function(user) {
        log("signed in", user);
    }).catch(function(err) {
        console.error(err);
        log(err);
    });
}

function popupSignout() {
    mgr.signoutPopup().then(function() {
        log("signed out");
    }).catch(function(err) {
        console.error(err);
        log(err);
    });
}

function iframeSignin() {
    mgr.signinSilent().then(function(user) {
        log("signed in silent", user);
    }).catch(function(err) {
        console.error(err);
        log(err);
    });
}

function startSignoutMainWindow() {
    mgr.signoutRedirect().then(function(resp) {
        log("signed out", resp);
    }).catch(function(err) {
        console.error(err);
        log(err);
    });
}

function endSignoutMainWindow() {
    mgr.signoutCallback().then(function(resp) {
        log("signed out", resp);
    }).catch(function(err) {
        console.error(err);
        log(err);
    });
}

export {
    log
};
