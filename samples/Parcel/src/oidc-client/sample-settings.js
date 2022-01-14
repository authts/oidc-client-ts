import { Log, OidcClient } from "../../../../src";

Log.setLogger(console);
Log.setLevel(Log.INFO);

const url = window.location.origin + "/oidc-client";

export const settings = {
    authority: "http://localhost:1234/oidc",
    client_id: "js.tokenmanager",
    redirect_uri: url + "/sample.html",
    post_logout_redirect_uri: url + "/sample.html",
    response_type: "code",
    scope: "openid email roles",

    response_mode: "fragment",

    filterProtocolClaims: true
};

export {
    Log,
    OidcClient
};
