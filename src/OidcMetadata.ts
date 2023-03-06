/**
 * @public
 */
export interface OidcMetadata {
    /**
     * REQUIRED. URL using the https scheme with no query or fragment component that the OP asserts as its Issuer Identifier. If Issuer discovery is supported (see Section 2), this value MUST be identical to the issuer value returned by WebFinger. This also MUST be identical to the iss Claim value in ID Tokens issued from this Issuer.
     */
    issuer: string;

    /**
     * REQUIRED. URL of the OP's OAuth 2.0 Authorization Endpoint [OpenID.Core].
     */
    authorization_endpoint: string;

    /**
     * URL of the OP's OAuth 2.0 Token Endpoint [OpenID.Core]. This is REQUIRED unless only the Implicit Flow is used.
     */
    token_endpoint: string;

    /**
     * OPTIONAL. JSON array containing a list of Client Authentication methods supported by this Token Endpoint. The options are client_secret_post, client_secret_basic, client_secret_jwt, and private_key_jwt, as described in Section 9 of OpenID Connect Core 1.0 [OpenID.Core]. Other authentication methods MAY be defined by extensions. If omitted, the default is client_secret_basic -- the HTTP Basic Authentication Scheme specified in Section 2.3.1 of OAuth 2.0 [RFC6749].
     */
    token_endpoint_auth_methods_supported: string[];

    /**
     * OPTIONAL. JSON array containing a list of the JWS signing algorithms (alg values) supported by the Token Endpoint for the signature on the JWT [JWT] used to authenticate the Client at the Token Endpoint for the private_key_jwt and client_secret_jwt authentication methods. Servers SHOULD support RS256. The value none MUST NOT be used.
     */
    token_endpoint_auth_signing_alg_values_supported: string[];

    /**
     * RECOMMENDED. URL of the OP's UserInfo Endpoint [OpenID.Core]. This URL MUST use the https scheme and MAY contain port, path, and query parameter components.
     */
    userinfo_endpoint: string;

    /**
     * REQUIRED. URL of an OP iframe that supports cross-origin communications for session state information with the RP Client, using the HTML5 postMessage API. This URL MUST use the https scheme and MAY contain port, path, and query parameter components. The page is loaded from an invisible iframe embedded in an RP page so that it can run in the OP's security context. It accepts postMessage requests from the relevant RP iframe and uses postMessage to post back the login status of the End-User at the OP.
     */
    check_session_iframe: string;

    /**
     * REQUIRED. URL at the OP to which an RP can perform a redirect to request that the End-User be logged out at the OP.
     */
    end_session_endpoint: string;

    /**
     * REQUIRED. URL of the OP's JSON Web Key Set [JWK] document. This contains the signing key(s) the RP uses to validate signatures from the OP. The JWK Set MAY also contain the Server's encryption key(s), which are used by RPs to encrypt requests to the Server. When both signing and encryption keys are made available, a use (Key Use) parameter value is REQUIRED for all keys in the referenced JWK Set to indicate each key's intended usage. Although some algorithms allow the same key to be used for both signatures and encryption, doing so is NOT RECOMMENDED, as it is less secure. The JWK x5c parameter MAY be used to provide X.509 representations of keys provided. When used, the bare key values MUST still be present and MUST match those in the certificate.
     */
    jwks_uri: string;

    /**
     * RECOMMENDED. URL of the OP's Dynamic Client Registration Endpoint [https://openid.net/specs/openid-connect-discovery-1_0.html#OpenID.Registration].
     */
    registration_endpoint: string;

    /**
     * RECOMMENDED. JSON array containing a list of the OAuth 2.0 [RFC6749] scope values that this server supports. The server MUST support the openid scope value. Servers MAY choose not to advertise some supported scope values even when this parameter is used, although those defined in [OpenID.Core] SHOULD be listed, if supported.
     */
    scopes_supported: string[];

    /**
     * REQUIRED. JSON array containing a list of the OAuth 2.0 response_type values that this OP supports. Dynamic OpenID Providers MUST support the code, id_token, and the token id_token Response Type values.
     */
    response_types_supported: string[];

    /**
     * OPTIONAL. JSON array containing a list of the Authentication Context Class References that this OP supports.
     */
    acr_values_supported: string[];

    /**
     * REQUIRED. JSON array containing a list of the Subject Identifier types that this OP supports. Valid types include pairwise and public.
     */
    subject_types_supported: string[];

    /**
     * OPTIONAL. JSON array containing a list of the JWS signing algorithms (alg values) supported by the OP for Request Objects, which are described in Section 6.1 of OpenID Connect Core 1.0 [OpenID.Core]. These algorithms are used both when the Request Object is passed by value (using the request parameter) and when it is passed by reference (using the request_uri parameter). Servers SHOULD support none and RS256.
     */
    request_object_signing_alg_values_supported: string[];

    /**
     * OPTIONAL. JSON array containing a list of the display parameter values that the OpenID Provider supports. These values are described in Section 3.1.2.1 of OpenID Connect Core 1.0 [https://openid.net/specs/openid-connect-discovery-1_0.html#OpenID.Core].
     */
    display_values_supported: string[];

    /**
     * OPTIONAL. JSON array containing a list of the Claim Types that the OpenID Provider supports. These Claim Types are described in Section 5.6 of OpenID Connect Core 1.0 [https://openid.net/specs/openid-connect-discovery-1_0.html#OpenID.Core].
     * Values defined by this specification are normal, aggregated, and distributed. If omitted, the implementation supports only normal Claims.
     */
    claim_types_supported: string[];

    /**
     * RECOMMENDED. JSON array containing a list of the Claim Names of the Claims that the OpenID Provider MAY be able to supply values for. Note that for privacy or other reasons, this might not be an exhaustive list.
     */
    claims_supported: string[];

    /**
     * OPTIONAL. Boolean value specifying whether the OP supports use of the claims parameter, with true indicating support. If omitted, the default value is false.
     */
    claims_parameter_supported: boolean;

    /**
     * OPTIONAL. URL of a page containing human-readable information that developers might want or need to know when using the OpenID Provider. In particular, if the OpenID Provider does not support Dynamic Client Registration, then information on how to register Clients needs to be provided in this documentation.
     */
    service_documentation: string;

    /**
     * OPTIONAL. Languages and scripts supported for the user interface, represented as a JSON array of BCP47 [RFC5646 : https://openid.net/specs/openid-connect-discovery-1_0.html#RFC5646] language tag values.
     */
    ui_locales_supported: string[];

    /**
     * The fully qualified URL of the server's revocation endpoint defined by OAuth 2.0 Token Revocation [RFC7009 : https://openid.net/specs/openid-heart-oauth2-2015-12-07.html#RFC7009]
     * https://openid.net/specs/openid-heart-oauth2-2015-12-07.html
     */
    revocation_endpoint: string;

    /**
     * The fully qualified URL of the server's introspection endpoint defined by OAuth Token Introspection [RFC7662 : https://openid.net/specs/openid-heart-oauth2-2015-12-07.html#RFC7662]
     * https://openid.net/specs/openid-heart-oauth2-2015-12-07.html
     */
    introspection_endpoint: string;

    /**
     * OPTIONAL. Boolean value specifying whether the OP supports HTTP-based logout, with true indicating support. If omitted, the default value is false.
     * https://openid.net/specs/openid-connect-frontchannel-1_0.html
     */
    frontchannel_logout_supported: boolean;

    /**
     * OPTIONAL. Boolean value specifying whether the OP can pass iss (issuer) and sid (session ID) query parameters to identify the RP session with the OP when the frontchannel_logout_uri is used. If supported, the sid Claim is also included in ID Tokens issued by the OP. If omitted, the default value is false.
     * https://openid.net/specs/openid-connect-frontchannel-1_0.html
     */
    frontchannel_logout_session_supported: boolean;

    /**
     * OPTIONAL. Boolean value specifying whether the OP supports back-channel logout, with true indicating support. If omitted, the default value is false.
     * https://openid.net/specs/openid-connect-backchannel-1_0.html#toc
     */
    backchannel_logout_supported: boolean;

    /**
     * OPTIONAL. Boolean value specifying whether the OP can pass a sid (session ID) Claim in the Logout Token to identify the RP session with the OP. If supported, the sid Claim is also included in ID Tokens issued by the OP. If omitted, the default value is false.
     * https://openid.net/specs/openid-connect-backchannel-1_0.html#toc
     */
    backchannel_logout_session_supported: boolean;

    /**
     * OPTIONAL. JSON array containing a list of the OAuth 2.0 Grant Type values that this OP supports. Dynamic OpenID Providers MUST support the authorization_code and implicit Grant Type values and MAY support other Grant Types. If omitted, the default value is ["authorization_code", "implicit"].
     */
    grant_types_supported: string[];

    /**
     * OPTIONAL. JSON array containing a list of the OAuth 2.0 response_mode values that this OP supports, as specified in OAuth 2.0 Multiple Response Type Encoding Practices [OAuth.Responses]. If omitted, the default for Dynamic OpenID Providers is ["query", "fragment"].
     */
    response_modes_supported: string[];

    /**
     * Exchange (PKCE) [RFC7636] code challenge methods supported by this
     *       authorization server.  Code challenge method values are used in
     *       the "code_challenge_method" parameter defined in Section 4.3 of
     *       [RFC7636].  The valid code challenge method values are those
     *       registered in the IANA "PKCE Code Challenge Methods" registry
     *       [IANA.OAuth.Parameters].  If omitted, the authorization server
     *       does not support PKCE.
     * https://www.rfc-editor.org/rfc/rfc8414.html
     */
    code_challenge_methods_supported: string[];
}
