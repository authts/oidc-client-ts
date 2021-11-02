import { Log, OidcClient} from "../../../../src";

const url = window.location.origin + "/oidc-client";

export const settings = {
    authority: "http://localhost:1234/oidc",
    client_id: "js.tokenmanager",
    redirect_uri: url + "/sample.html",
    post_logout_redirect_uri: url + "/sample.html",
    response_type: "code",
    scope: "openid email roles",

    filterProtocolClaims: true
};

export {
    Log,
    OidcClient
};
