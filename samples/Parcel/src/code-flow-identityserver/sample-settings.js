import { Log, UserManager} from "../../../../src";

const url = window.location.origin + "/code-flow-identityserver";

export const settings = {
    authority: "https://demo.identityserver.io",
    client_id: "interactive.public",
    //client_id: 'interactive.public.short',
    redirect_uri: url + "/sample.html",
    post_logout_redirect_uri: url + "/sample.html",
    response_type: "code",
    //response_mode: 'fragment',
    scope: "openid profile api",
    //scope: 'openid profile api offline_access',

    popup_redirect_uri: url + "/sample-popup-signin.html",
    popup_post_logout_redirect_uri: url + "/sample-popup-signout.html",

    silent_redirect_uri: url + "/sample-silent.html",
    automaticSilentRenew:false,
    validateSubOnSilentRenew: true,
    //silentRequestTimeout:10000,

    monitorAnonymousSession : true,

    filterProtocolClaims: true,
    revokeAccessTokenOnSignout : true,

    //metadata: {"issuer":"https://demo.identityserver.io","jwks_uri":"https://demo.identityserver.io/.well-known/openid-configuration/jwks","authorization_endpoint":"https://demo.identityserver.io/connect/authorize","token_endpoint":"https://demo.identityserver.io/connect/token","userinfo_endpoint":"https://demo.identityserver.io/connect/userinfo","end_session_endpoint":"https://demo.identityserver.io/connect/endsession","check_session_iframe":"https://demo.identityserver.io/connect/checksession","revocation_endpoint":"https://demo.identityserver.io/connect/revocation","introspection_endpoint":"https://demo.identityserver.io/connect/introspect","device_authorization_endpoint":"https://demo.identityserver.io/connect/deviceauthorization","frontchannel_logout_supported":true,"frontchannel_logout_session_supported":true,"backchannel_logout_supported":true,"backchannel_logout_session_supported":true,"scopes_supported":["openid","profile","email","api","api.scope1","api.scope2","scope2","policyserver.runtime","policyserver.management","offline_access"],"claims_supported":["sub","name","family_name","given_name","middle_name","nickname","preferred_username","profile","picture","website","gender","birthdate","zoneinfo","locale","updated_at","email","email_verified"],"grant_types_supported":["authorization_code","client_credentials","refresh_token","implicit","password","urn:ietf:params:oauth:grant-type:device_code"],"response_types_supported":["code","token","id_token","id_token token","code id_token","code token","code id_token token"],"response_modes_supported":["form_post","query","fragment"],"token_endpoint_auth_methods_supported":["client_secret_basic","client_secret_post"],"id_token_signing_alg_values_supported":["RS256"],"subject_types_supported":["public"],"code_challenge_methods_supported":["plain","S256"],"request_parameter_supported":true},
    //metadataSeed: {"some_extra_data":"some_value"},
    //signingKeys:[{"kty":"RSA","use":"sig","kid":"5CCAA03EDDE26D53104CC35D0D4B299C","e":"AQAB","n":"3fbgsZuL5Kp7HyliAznS6N0kTTAqApIzYqu0tORUk4T9m2f3uW5lDomNmwwPuZ3QDn0nwN3esx2NvZjL_g5DN407Pgl0ffHhARdtydJvdvNJIpW4CmyYGnI8H4ZdHtuW4wF8GbKadIGgwpI4UqcsHuPiWKARfWZMQfPKBT08SiIPwGncavlRRDgRVX1T94AgZE_fOTJ4Odko9RX9iNXghJIzJ_wEkY9GEkoHz5lQGdHYUplxOS6fcxL8j_N9urSBlnoYjPntBOwUfPsMoNcmIDXPARcq10miWTz8SHzUYRtsiSUMqimRJ9KdCucKcCmttB_p_EAWohJQDnav-Vqi3Q","alg":"RS256"}]
};

export {
    Log,
    UserManager
};
