// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Logger } from "./utils";
import { SigninState } from "./SigninState";

/**
 * @public
 */
export interface SigninRequestArgs {
    // mandatory
    url: string;
    authority: string;
    client_id: string;
    redirect_uri: string;
    response_type: string;
    scope: string;

    // optional
    prompt?: string;
    display?: string;
    max_age?: number;
    ui_locales?: string;
    id_token_hint?: string;
    login_hint?: string;
    acr_values?: string;
    resource?: string | string[];
    response_mode?: "query" | "fragment" ;
    request?: string;
    request_uri?: string;
    extraQueryParams?: Record<string, string | number | boolean>;
    request_type?: string;
    client_secret?: string;
    extraTokenParams?: Record<string, unknown>;
    skipUserInfo?: boolean;
    nonce?: string;

    /** custom "state", which can be used by a caller to have "data" round tripped */
    state_data?: unknown;
}

/**
 * @public
 */
export class SigninRequest {
    private readonly _logger = new Logger("SigninRequest");

    public readonly url: string;
    public readonly state: SigninState;

    public constructor({
        // mandatory
        url, authority, client_id, redirect_uri, response_type, scope,
        // optional
        state_data, response_mode, request_type, client_secret, nonce,
        resource,
        skipUserInfo,
        extraQueryParams,
        extraTokenParams,
        ...optionalParams
    }: SigninRequestArgs) {
        if (!url) {
            this._logger.error("ctor: No url passed");
            throw new Error("url");
        }
        if (!client_id) {
            this._logger.error("ctor: No client_id passed");
            throw new Error("client_id");
        }
        if (!redirect_uri) {
            this._logger.error("ctor: No redirect_uri passed");
            throw new Error("redirect_uri");
        }
        if (!response_type) {
            this._logger.error("ctor: No response_type passed");
            throw new Error("response_type");
        }
        if (!scope) {
            this._logger.error("ctor: No scope passed");
            throw new Error("scope");
        }
        if (!authority) {
            this._logger.error("ctor: No authority passed");
            throw new Error("authority");
        }

        this.state = new SigninState({
            data: state_data,
            request_type,
            code_verifier: true,
            client_id, authority, redirect_uri,
            response_mode,
            client_secret, scope, extraTokenParams,
            skipUserInfo,
        });

        const parsedUrl = new URL(url);
        parsedUrl.searchParams.append("client_id", client_id);
        parsedUrl.searchParams.append("redirect_uri", redirect_uri);
        parsedUrl.searchParams.append("response_type", response_type);
        parsedUrl.searchParams.append("scope", scope);
        if (nonce) {
            parsedUrl.searchParams.append("nonce", nonce);
        }

        parsedUrl.searchParams.append("state", this.state.id);
        if (this.state.code_challenge) {
            parsedUrl.searchParams.append("code_challenge", this.state.code_challenge);
            parsedUrl.searchParams.append("code_challenge_method", "S256");
        }

        if (resource) {
            // https://datatracker.ietf.org/doc/html/rfc8707
            const resources = Array.isArray(resource) ? resource : [resource];
            resources
                .forEach(r => parsedUrl.searchParams.append("resource", r));
        }

        for (const [key, value] of Object.entries({ response_mode, ...optionalParams, ...extraQueryParams })) {
            if (value != null) {
                parsedUrl.searchParams.append(key, value.toString());
            }
        }

        this.url = parsedUrl.href;
    }
}
