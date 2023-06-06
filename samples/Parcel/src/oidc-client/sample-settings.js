import { Log, OidcClient } from "../../../../src";

Log.setLogger(console)

const url = window.location.origin + "/oidc-client";

export const settings = {
    authority: "https://keycloak.calponia.dev/auth/realms/Calponia",
    client_id: "9db7e91e-0387-11ee-9297-8b8c6edcdfff",
    redirect_uri: url + "/sample.html",
    post_logout_redirect_uri: url + "/sample.html",
    response_type: "code",
    scope: "openid roles",

    response_mode: "fragment",

    filterProtocolClaims: true
};

export {
    Log,
    OidcClient
};
