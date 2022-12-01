// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { WebStorageStateStore } from "./WebStorageStateStore";
import type { OidcMetadata } from "./OidcMetadata";
import type { StateStore } from "./StateStore";
import { InMemoryWebStorage } from "./InMemoryWebStorage";

const DefaultResponseType = "code";
const DefaultScope = "openid";
const DefaultClientAuthentication = "client_secret_post";
const DefaultResponseMode = "query";
const DefaultStaleStateAgeInSeconds = 60 * 15;
const DefaultClockSkewInSeconds = 60 * 5;

/**
 * @public
 */
export type SigningKey = Record<string, string | string[]>;

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
    resource?: string;

    /** optional protocol param (default: "query") */
    response_mode?: "query" | "fragment";

    /** Should OIDC protocol claims be removed from profile (default: true) */
    filterProtocolClaims?: boolean;
    /** Flag to control if additional identity data is loaded from the user info endpoint in order to populate the user's profile (default: false) */
    loadUserInfo?: boolean;
    /** Number (in seconds) indicating the age of state entries in storage for authorize requests that are considered abandoned and thus can be cleaned up (default: 900) */
    staleStateAgeInSeconds?: number;

    /** @deprecated Unused */
    clockSkewInSeconds?: number;
    /** @deprecated Unused */
    userInfoJwtIssuer?: "ANY" | "OP" | string;

    /**
     * Indicates if objects returned from the user info endpoint as claims (e.g. `address`) are merged into the claims from the id token as a single object.
     * Otherwise, they are added to an array as distinct objects for the claim type. (default: false)
     */
    mergeClaims?: boolean;

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
     * @deprecated since version 2.1.0. Use fetchRequestCredentials instead.
     */
    refreshTokenCredentials?: "same-origin" | "include" | "omit";

    /**
     * Will check the content type header of the response of the revocation endpoint to match these passed values (default: [])
     */
    revokeTokenAdditionalContentTypes?: string[];

    /**
     * Sets the credentials for fetch requests. (default: "same-origin")
     * Use this if you need to send cookies to the OIDC/OAuth2 provider or if you are using a proxy that requires cookies
     */
    fetchRequestCredentials?: RequestCredentials;
}

/**
 * The settings with defaults applied of the {@link OidcClient}.
 * @see {@link OidcClientSettings}
 *
 * @public
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
    public readonly resource: string | undefined;
    public readonly response_mode: "query" | "fragment";

    // behavior flags
    public readonly filterProtocolClaims: boolean;
    public readonly loadUserInfo: boolean;
    public readonly staleStateAgeInSeconds: number;
    public readonly clockSkewInSeconds: number;
    public readonly userInfoJwtIssuer: "ANY" | "OP" | string;
    public readonly mergeClaims: boolean;

    public readonly stateStore: StateStore;

    // extra
    public readonly extraQueryParams: Record<string, string | number | boolean>;
    public readonly extraTokenParams: Record<string, unknown>;

    public readonly revokeTokenAdditionalContentTypes?: string[];
    public readonly fetchRequestCredentials: RequestCredentials;

    public constructor({
        // metadata related
        authority, metadataUrl, metadata, signingKeys, metadataSeed,
        // client related
        client_id, client_secret, response_type = DefaultResponseType, scope = DefaultScope,
        redirect_uri, post_logout_redirect_uri,
        client_authentication = DefaultClientAuthentication,
        // optional protocol
        prompt, display, max_age, ui_locales, acr_values, resource, response_mode = DefaultResponseMode,
        // behavior flags
        filterProtocolClaims = true,
        loadUserInfo = false,
        staleStateAgeInSeconds = DefaultStaleStateAgeInSeconds,
        clockSkewInSeconds = DefaultClockSkewInSeconds,
        userInfoJwtIssuer = "OP",
        mergeClaims = false,
        // other behavior
        stateStore,
        refreshTokenCredentials,
        revokeTokenAdditionalContentTypes,
        fetchRequestCredentials,
        // extra query params
        extraQueryParams = {},
        extraTokenParams = {},
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

        this.filterProtocolClaims = !!filterProtocolClaims;
        this.loadUserInfo = !!loadUserInfo;
        this.staleStateAgeInSeconds = staleStateAgeInSeconds;
        this.clockSkewInSeconds = clockSkewInSeconds;
        this.userInfoJwtIssuer = userInfoJwtIssuer;
        this.mergeClaims = !!mergeClaims;

        this.revokeTokenAdditionalContentTypes = revokeTokenAdditionalContentTypes;

        if (fetchRequestCredentials && refreshTokenCredentials) {
            console.warn("Both fetchRequestCredentials and refreshTokenCredentials is set. Only fetchRequestCredentials will be used.");
        }
        this.fetchRequestCredentials = fetchRequestCredentials ? fetchRequestCredentials
            : refreshTokenCredentials ? refreshTokenCredentials : "same-origin";

        if (stateStore) {
            this.stateStore = stateStore;
        }
        else {
            const store = typeof window !== "undefined" ? window.localStorage : new InMemoryWebStorage();
            this.stateStore = new WebStorageStateStore({ store });
        }

        this.extraQueryParams = extraQueryParams;
        this.extraTokenParams = extraTokenParams;
    }
}
