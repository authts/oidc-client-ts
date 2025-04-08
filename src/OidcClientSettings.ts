// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { WebStorageStateStore } from "./WebStorageStateStore";
import type { OidcMetadata } from "./OidcMetadata";
import type { StateStore } from "./StateStore";
import { InMemoryWebStorage } from "./InMemoryWebStorage";
import type { DPoPStore } from "./DPoPStore";

const DefaultResponseType = "code";
const DefaultScope = "openid";
const DefaultClientAuthentication = "client_secret_post";
const DefaultStaleStateAgeInSeconds = 60 * 15;

/**
 * @public
 */
export type SigningKey = Record<string, string | string[]>;

/**
 * @public
 */
export type ExtraHeader = string | (() => string);

/**
 * Optional DPoP settings
 * @public
 */
export interface DPoPSettings {
    bind_authorization_code?: boolean;
    store: DPoPStore;
}

/**
 * The settings used to configure the {@link OidcClient}.
 *
 * @public
 */
export interface OidcClientSettings {
    /** The URL of the OIDC/OAuth2 provider */
    authority: string;
    metadataUrl?: string;
    /** Provide metadata when authority server does not allow CORS on the metadata endpoint */
    metadata?: Partial<OidcMetadata>;
    /** Can be used to seed or add additional values to the results of the discovery request */
    metadataSeed?: Partial<OidcMetadata>;
    /** Provide signingKeys when authority server does not allow CORS on the jwks uri */
    signingKeys?: SigningKey[];

    /** Your client application's identifier as registered with the OIDC/OAuth2 */
    client_id: string;
    client_secret?: string;
    /** The type of response desired from the OIDC/OAuth2 provider (default: "code") */
    response_type?: string;
    /** The scope being requested from the OIDC/OAuth2 provider (default: "openid") */
    scope?: string;
    /** The redirect URI of your client application to receive a response from the OIDC/OAuth2 provider */
    redirect_uri: string;
    /** The OIDC/OAuth2 post-logout redirect URI */
    post_logout_redirect_uri?: string;

    /**
     * Client authentication method that is used to authenticate when using the token endpoint (default: "client_secret_post")
     * - "client_secret_basic": using the HTTP Basic authentication scheme
     * - "client_secret_post": including the client credentials in the request body
     *
     * See https://openid.net/specs/openid-connect-core-1_0.html#ClientAuthentication
     */
    client_authentication?: "client_secret_basic" | "client_secret_post";

    /** optional protocol param */
    prompt?: string;
    /** optional protocol param */
    display?: string;
    /** optional protocol param */
    max_age?: number;
    /** optional protocol param */
    ui_locales?: string;
    /** optional protocol param */
    acr_values?: string;
    /** optional protocol param */
    resource?: string | string[];

    /**
     * Optional protocol param
     * The response mode used by the authority server is defined by the response_type unless explicitly specified:
     * - Response mode for the OAuth 2.0 response type "code" is the "query" encoding
     * - Response mode for the OAuth 2.0 response type "token" is the "fragment" encoding
     *
     * @see https://openid.net/specs/oauth-v2-multiple-response-types-1_0.html#ResponseModes
     */
    response_mode?: "query" | "fragment";

    /**
     * Should optional OIDC protocol claims be removed from profile or specify the ones to be removed (default: true)
     * When true, the following claims are removed by default: ["nbf", "jti", "auth_time", "nonce", "acr", "amr", "azp", "at_hash"]
     * When specifying claims, the following claims are not allowed: ["sub", "iss", "aud", "exp", "iat"]
    */
    filterProtocolClaims?: boolean | string[];
    /** Flag to control if additional identity data is loaded from the user info endpoint in order to populate the user's profile (default: false) */
    loadUserInfo?: boolean;
    /** Number (in seconds) indicating the age of state entries in storage for authorize requests that are considered abandoned and thus can be cleaned up (default: 900) */
    staleStateAgeInSeconds?: number;

    /**
     * Indicates how objects returned from the user info endpoint as claims (e.g. `address`) are merged into the claims from the
     * id token as a single object.  (default: `{ array: "replace" }`)
     * - array: "replace": natives (string, int, float) and arrays are replaced, objects are merged as distinct objects
     * - array: "merge": natives (string, int, float) are replaced, arrays and objects are merged as distinct objects
     */
    mergeClaimsStrategy?: { array: "replace" | "merge" };

    /**
     * Storage object used to persist interaction state (default: window.localStorage, InMemoryWebStorage iff no window).
     * E.g. `stateStore: new WebStorageStateStore({ store: window.localStorage })`
     */
    stateStore?: StateStore;

    /**
     * An object containing additional query string parameters to be including in the authorization request.
     * E.g, when using Azure AD to obtain an access token an additional resource parameter is required. extraQueryParams: `{resource:"some_identifier"}`
     */
    extraQueryParams?: Record<string, string | number | boolean>;

    extraTokenParams?: Record<string, unknown>;

    /**
     * An object containing additional header to be including in request.
     */
    extraHeaders?: Record<string, ExtraHeader>;

    /**
     * DPoP enabled or disabled
     */
    dpop?: DPoPSettings | undefined;

    /**
     * Will check the content type header of the response of the revocation endpoint to match these passed values (default: [])
     */
    revokeTokenAdditionalContentTypes?: string[];
    /**
     * Will disable PKCE validation, changing to true will not append to sign in request code_challenge and code_challenge_method. (default: false)
     */
    disablePKCE?: boolean;
    /**
     * Sets the credentials for fetch requests. (default: "same-origin")
     * Use this if you need to send cookies to the OIDC/OAuth2 provider or if you are using a proxy that requires cookies
     */
    fetchRequestCredentials?: RequestCredentials;

    /**
     * Only scopes in this list will be passed in the token refresh request.
     */
    refreshTokenAllowedScope?: string | undefined;

    /**
     * Defines request timeouts globally across all requests made to the authorisation server
     */
    requestTimeoutInSeconds?: number | undefined;

    /**
     * https://datatracker.ietf.org/doc/html/rfc6749#section-3.3 describes behavior when omitting scopes from sign in requests
     * If the IDP supports default scopes, this setting will ignore the scopes property passed to the config. (Default: false)
     */
    omitScopeWhenRequesting?: boolean;
}

/**
 * The settings with defaults applied of the {@link OidcClient}.
 *
 * @public
 * @see {@link OidcClientSettings}
 */
export class OidcClientSettingsStore {
    // metadata
    public readonly authority: string;
    public readonly metadataUrl: string;
    public readonly metadata: Partial<OidcMetadata> | undefined;
    public readonly metadataSeed: Partial<OidcMetadata> | undefined;
    public readonly signingKeys: SigningKey[] | undefined;

    // client config
    public readonly client_id: string;
    public readonly client_secret: string | undefined;
    public readonly response_type: string;
    public readonly scope: string;
    public readonly redirect_uri: string;
    public readonly post_logout_redirect_uri: string | undefined;
    public readonly client_authentication: "client_secret_basic" | "client_secret_post";

    // optional protocol params
    public readonly prompt: string | undefined;
    public readonly display: string | undefined;
    public readonly max_age: number | undefined;
    public readonly ui_locales: string | undefined;
    public readonly acr_values: string | undefined;
    public readonly resource: string | string[] | undefined;
    public readonly response_mode: "query" | "fragment" | undefined;

    // behavior flags
    public readonly filterProtocolClaims: boolean | string[];
    public readonly loadUserInfo: boolean;
    public readonly staleStateAgeInSeconds: number;
    public readonly mergeClaimsStrategy: { array: "replace" | "merge" };
    public readonly omitScopeWhenRequesting: boolean;

    public readonly stateStore: StateStore;

    // extra
    public readonly extraQueryParams: Record<string, string | number | boolean>;
    public readonly extraTokenParams: Record<string, unknown>;
    public readonly dpop: DPoPSettings | undefined;
    public readonly extraHeaders: Record<string, ExtraHeader>;

    public readonly revokeTokenAdditionalContentTypes?: string[];
    public readonly fetchRequestCredentials: RequestCredentials;
    public readonly refreshTokenAllowedScope: string | undefined;
    public readonly disablePKCE: boolean;
    public readonly requestTimeoutInSeconds: number | undefined;

    public constructor({
        // metadata related
        authority, metadataUrl, metadata, signingKeys, metadataSeed,
        // client related
        client_id, client_secret, response_type = DefaultResponseType, scope = DefaultScope,
        redirect_uri, post_logout_redirect_uri,
        client_authentication = DefaultClientAuthentication,
        // optional protocol
        prompt, display, max_age, ui_locales, acr_values, resource, response_mode,
        // behavior flags
        filterProtocolClaims = true,
        loadUserInfo = false,
        requestTimeoutInSeconds,
        staleStateAgeInSeconds = DefaultStaleStateAgeInSeconds,
        mergeClaimsStrategy = { array: "replace" },
        disablePKCE = false,
        // other behavior
        stateStore,
        revokeTokenAdditionalContentTypes,
        fetchRequestCredentials,
        refreshTokenAllowedScope,
        // extra
        extraQueryParams = {},
        extraTokenParams = {},
        extraHeaders = {},
        dpop,
        omitScopeWhenRequesting = false,
    }: OidcClientSettings) {

        this.authority = authority;

        if (metadataUrl) {
            this.metadataUrl = metadataUrl;
        } else {
            this.metadataUrl = authority;
            if (authority) {
                if (!this.metadataUrl.endsWith("/")) {
                    this.metadataUrl += "/";
                }
                this.metadataUrl += ".well-known/openid-configuration";
            }
        }

        this.metadata = metadata;
        this.metadataSeed = metadataSeed;
        this.signingKeys = signingKeys;

        this.client_id = client_id;
        this.client_secret = client_secret;
        this.response_type = response_type;
        this.scope = scope;
        this.redirect_uri = redirect_uri;
        this.post_logout_redirect_uri = post_logout_redirect_uri;
        this.client_authentication = client_authentication;

        this.prompt = prompt;
        this.display = display;
        this.max_age = max_age;
        this.ui_locales = ui_locales;
        this.acr_values = acr_values;
        this.resource = resource;
        this.response_mode = response_mode;

        this.filterProtocolClaims = filterProtocolClaims ?? true;
        this.loadUserInfo = !!loadUserInfo;
        this.staleStateAgeInSeconds = staleStateAgeInSeconds;
        this.mergeClaimsStrategy = mergeClaimsStrategy;
        this.omitScopeWhenRequesting = omitScopeWhenRequesting;
        this.disablePKCE = !!disablePKCE;
        this.revokeTokenAdditionalContentTypes = revokeTokenAdditionalContentTypes;

        this.fetchRequestCredentials = fetchRequestCredentials ? fetchRequestCredentials : "same-origin";
        this.requestTimeoutInSeconds = requestTimeoutInSeconds;

        if (stateStore) {
            this.stateStore = stateStore;
        }
        else {
            const store = typeof window !== "undefined" ? window.localStorage : new InMemoryWebStorage();
            this.stateStore = new WebStorageStateStore({ store });
        }

        this.refreshTokenAllowedScope = refreshTokenAllowedScope;

        this.extraQueryParams = extraQueryParams;
        this.extraTokenParams = extraTokenParams;
        this.extraHeaders = extraHeaders;

        this.dpop = dpop;
        if (this.dpop && !this.dpop?.store) {
            throw new Error("A DPoPStore is required when dpop is enabled");
        }
    }
}
