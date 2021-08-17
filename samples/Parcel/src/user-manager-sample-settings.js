export const settings = {
    authority: "http://localhost:1234/oidc",
    client_id: "js.tokenmanager",
    redirect_uri: "http://localhost:1234/user-manager-sample.html",
    post_logout_redirect_uri: "http://localhost:1234/user-manager-sample.html",
    response_type: "id_token token",
    scope: "openid email roles",

    popup_redirect_uri:"http://localhost:1234/user-manager-sample-popup-signin.html",
    popup_post_logout_redirect_uri:"http://localhost:1234/user-manager-sample-popup-signout.html",

    silent_redirect_uri:"http://localhost:1234/user-manager-sample-silent.html",
    automaticSilentRenew:true,
    //silentRequestTimeout:10000,

    filterProtocolClaims: true,
    loadUserInfo: true
};
