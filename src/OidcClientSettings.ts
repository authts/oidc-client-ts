// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { ClockService } from "./ClockService";
import { WebStorageStateStore } from "./WebStorageStateStore";
import { OidcMetadata } from "./OidcMetadata";
import { StateStore } from "./StateStore";

const DefaultResponseType = "id_token";
const DefaultScope = "openid";
const DefaultClientAuthentication = "client_secret_post"; // The default value must be client_secret_basic, as explained in https://openid.net/specs/openid-connect-core-1_0.html#ClientAuthentication
const DefaultStaleStateAge = 60 * 15; // seconds
const DefaultClockSkewInSeconds = 60 * 5;

export interface OidcClientSettings {
    /** The URL of the OIDC/OAuth2 provider */
    authority: string;
    metadataUrl?: string;
    /** Provide metadata when authority server does not allow CORS on the metadata endpoint */
    metadata?: Partial<OidcMetadata>;
    /** Can be used to seed or add additional values to the results of the discovery request */
    metadataSeed?: Partial<OidcMetadata>;
    /** Provide signingKeys when authority server does not allow CORS on the jwks uri */
    signingKeys?: any[];

    /** Your client application's identifier as registered with the OIDC/OAuth2 */
    client_id: string;
    client_secret?: string;
    /** The type of response desired from the OIDC/OAuth2 provider (default: 'id_token') */
    response_type?: string;
    /** The scope being requested from the OIDC/OAuth2 provider (default: 'openid') */
    scope?: string;
    /** The redirect URI of your client application to receive a response from the OIDC/OAuth2 provider */
    redirect_uri?: string;
    /** The OIDC/OAuth2 post-logout redirect URI */
    post_logout_redirect_uri?: string;
    client_authentication?: string;

    prompt?: string;
    display?: string;
    max_age?: number;
    ui_locales?: string;
    acr_values?: string;
    resource?: string;
    response_mode?: string;

    /** Should OIDC protocol claims be removed from profile (default: true) */
    filterProtocolClaims?: boolean;
    /** Flag to control if additional identity data is loaded from the user info endpoint in order to populate the user's profile (default: true) */
    loadUserInfo?: boolean;
    /** Number (in seconds) indicating the age of state entries in storage for authorize requests that are considered abandoned and thus can be cleaned up (default: 300) */
    staleStateAge?: number;
    /** The window of time (in seconds) to allow the current time to deviate when validating id_token's iat, nbf, and exp values (default: 300) */
    clockSkew?: number;
    clockService?: ClockService;
    userInfoJwtIssuer?: "ANY" | "OP" | string;
    mergeClaims?: boolean;

    stateStore?: StateStore;

    /** An object containing additional query string parameters to be including in the authorization request */
    extraQueryParams?: Record<string, any>;
    extraTokenParams?: Record<string, any>;
}

export class OidcClientSettingsStore {
    // metadata
    public readonly authority: string;
    public readonly metadataUrl?: string;
    public readonly metadata?: Partial<OidcMetadata>;
    public readonly metadataSeed?: Partial<OidcMetadata>;
    public readonly signingKeys?: any[];

    // client config
    public readonly client_id: string;
    public readonly client_secret?: string;
    public readonly response_type: string;
    public readonly scope: string;
    public readonly redirect_uri?: string;
    public readonly post_logout_redirect_uri?: string;
    public readonly client_authentication?: string;

    // optional protocol params
    public readonly prompt?: string;
    public readonly display?: string;
    public readonly max_age?: number;
    public readonly ui_locales?: string;
    public readonly acr_values?: string;
    public readonly resource?: string;
    public readonly response_mode?: string;

    // behavior flags
    public readonly filterProtocolClaims?: boolean;
    public readonly loadUserInfo?: boolean;
    public readonly staleStateAge: number;
    public readonly clockSkew: number;
    public readonly clockService: ClockService;
    public readonly userInfoJwtIssuer?: "ANY" | "OP" | string;
    public readonly mergeClaims?: boolean;

    public readonly stateStore: StateStore;

    // extra
    public readonly extraQueryParams?: Record<string, any>;
    public readonly extraTokenParams?: Record<string, any>;

    constructor({
        // metadata related
        authority, metadataUrl, metadata, signingKeys, metadataSeed,
        // client related
        client_id, client_secret, response_type = DefaultResponseType, scope = DefaultScope,
        redirect_uri, post_logout_redirect_uri,
        client_authentication = DefaultClientAuthentication,
        // optional protocol
        prompt, display, max_age, ui_locales, acr_values, resource, response_mode,
        // behavior flags
        filterProtocolClaims = true, loadUserInfo = true,
        staleStateAge = DefaultStaleStateAge,
        clockSkew = DefaultClockSkewInSeconds,
        clockService = new ClockService(),
        userInfoJwtIssuer = "OP",
        mergeClaims = false,
        // other behavior
        stateStore = new WebStorageStateStore(),
        // extra query params
        extraQueryParams = {},
        extraTokenParams = {}
    }: OidcClientSettings) {

        this.authority = authority;
        this.metadataUrl = metadataUrl;
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
        this.staleStateAge = staleStateAge;
        this.clockSkew = clockSkew;
        this.clockService = clockService;
        this.userInfoJwtIssuer = userInfoJwtIssuer;
        this.mergeClaims = !!mergeClaims;

        this.stateStore = stateStore;

        this.extraQueryParams = typeof extraQueryParams === "object" ? extraQueryParams : {};
        this.extraTokenParams = typeof extraTokenParams === "object" ? extraTokenParams : {};
    }

    // get the time
    getEpochTime() {
        return this.clockService.getEpochTime();
    }
}
