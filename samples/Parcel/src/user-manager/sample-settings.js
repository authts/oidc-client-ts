import { Log, UserManager} from "../../../../src";

Log.setLogger(console);
Log.setLevel(Log.INFO);

const url = window.location.origin + "/user-manager";

export const settings = {
    authority: "http://localhost:1234/oidc",
    client_id: "js.tokenmanager",
    redirect_uri: url + "/sample.html",
    post_logout_redirect_uri: url + "/sample.html",
    response_type: "code",
    scope: "openid email roles",

    response_mode: "fragment",

    popup_redirect_uri: url + "/sample-popup-signin.html",
    popup_post_logout_redirect_uri: url + "/sample-popup-signout.html",

    silent_redirect_uri: url + "/sample-silent.html",
    automaticSilentRenew: true,
    //silentRequestTimeout: 10000,

    filterProtocolClaims: true
};

export {
    Log,
    UserManager
};
