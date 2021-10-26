// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { WebStorageStateStore } from "./WebStorageStateStore";
import type { OidcMetadata } from "./OidcMetadata";
import type { StateStore } from "./StateStore";

const DefaultResponseType = "code";
const DefaultScope = "openid";
const DefaultClientAuthentication = "client_secret_post"; // The default value must be client_secret_basic, as explained in https://openid.net/specs/openid-connect-core-1_0.html#ClientAuthentication
const DefaultStaleStateAgeInSeconds = 60 * 15; // seconds
const DefaultClockSkewInSeconds = 60 * 5;

/**
 * @public
 */
export type SigningKey = Record<string, string | string[]>;

/**
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
    client_authentication?: string;

    prompt?: string;
    display?: string;
    max_age?: number;
    ui_locales?: string;
    acr_values?: string;
    resource?: string;
    response_mode?: "query" | "fragment";

    /** Should OIDC protocol claims be removed from profile (default: true) */
    filterProtocolClaims?: boolean;
    /** Number (in seconds) indicating the age of state entries in storage for authorize requests that are considered abandoned and thus can be cleaned up (default: 300) */
    staleStateAgeInSeconds?: number;
    /** The window of time (in seconds) to allow the current time to deviate when validating token's iat, nbf, and exp values (default: 300) */
    clockSkewInSeconds?: number;
    userInfoJwtIssuer?: "ANY" | "OP" | string;
    mergeClaims?: boolean;

    stateStore?: StateStore;

    /** An object containing additional query string parameters to be including in the authorization request */
    extraQueryParams?: Record<string, string | number | boolean>;
    extraTokenParams?: Record<string, any>;
}

export class OidcClientSettingsStore {
    // metadata
    public readonly authority: string;
    public readonly metadataUrl: string | undefined;
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
    public readonly client_authentication: string | undefined;

    // optional protocol params
    public readonly prompt: string | undefined;
    public readonly display: string | undefined;
    public readonly max_age: number | undefined;
    public readonly ui_locales: string | undefined;
    public readonly acr_values: string | undefined;
    public readonly resource: string | undefined;
    public readonly response_mode: "query" | "fragment" | undefined;

    // behavior flags
    public readonly filterProtocolClaims: boolean | undefined;
    public readonly staleStateAgeInSeconds: number;
    public readonly clockSkewInSeconds: number;
    public readonly userInfoJwtIssuer: "ANY" | "OP" | string | undefined;
    public readonly mergeClaims: boolean | undefined;

    public readonly stateStore: StateStore;

    // extra
    public readonly extraQueryParams: Record<string, string | number | boolean> | undefined;
    public readonly extraTokenParams: Record<string, any> | undefined;

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
        staleStateAgeInSeconds = DefaultStaleStateAgeInSeconds,
        clockSkewInSeconds = DefaultClockSkewInSeconds,
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
        this.staleStateAgeInSeconds = staleStateAgeInSeconds;
        this.clockSkewInSeconds = clockSkewInSeconds;
        this.userInfoJwtIssuer = userInfoJwtIssuer;
        this.mergeClaims = !!mergeClaims;

        this.stateStore = stateStore;

        this.extraQueryParams = extraQueryParams;
        this.extraTokenParams = extraTokenParams;
    }
}
