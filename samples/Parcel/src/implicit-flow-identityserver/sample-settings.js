import { Log, UserManager} from "../../../../src";

const url = window.location.origin + "/implicit-flow-identityserver";

export const settings = {
    authority: "https://demo.identityserver.io/",
    client_id: "login",
    redirect_uri: url + "/sample.html",
    post_logout_redirect_uri: url + "/sample.html",
    response_type: "id_token",
    //response_mode:'fragment',
    scope: "openid profile email",

    popup_redirect_uri: url + "/sample-popup-signin.html",
    popup_post_logout_redirect_uri: url + "/sample-popup-signout.html",

    silent_redirect_uri: url + "/sample-silent.html",
    automaticSilentRenew: true,
    //silentRequestTimeout:10000,

    filterProtocolClaims: true,
    loadUserInfo: true
};

export {
    Log,
    UserManager
};
