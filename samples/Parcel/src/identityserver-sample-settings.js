export const settings = {
    authority: "https://demo.identityserver.io/",
    client_id: "login",
    redirect_uri: "http://localhost:1234/identityserver-sample.html",
    post_logout_redirect_uri: "http://localhost:1234/identityserver-sample.html",
    response_type: "id_token",
    //response_mode:'fragment',
    scope: "openid profile email",

    popup_redirect_uri: "http://localhost:1234/identityserver-sample-popup-signin.html",
    popup_post_logout_redirect_uri: "http://localhost:1234/identityserver-sample-popup-signout.html",

    silent_redirect_uri: "http://localhost:1234/identityserver-sample-silent.html",
    automaticSilentRenew: true,
    //silentRequestTimeout:10000,

    filterProtocolClaims: true,
    loadUserInfo: true
};
