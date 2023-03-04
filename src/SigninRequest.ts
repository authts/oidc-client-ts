// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Logger, URL_STATE_DELIMITER } from "./utils";
import { SigninState } from "./SigninState";

/**
 * @public
 * @see https://openid.net/specs/openid-connect-core-1_0.html#AuthRequest
 */
export interface SigninRequestCreateArgs {
    // mandatory
    url: string;
    authority: string;
    client_id: string;
    redirect_uri: string;
    response_type: string;
    scope: string;

    // optional
    response_mode?: "query" | "fragment";
    nonce?: string;
    display?: string;
    prompt?: string;
    max_age?: number;
    ui_locales?: string;
    id_token_hint?: string;
    login_hint?: string;
    acr_values?: string;

    // other
    resource?: string | string[];
    request?: string;
    request_uri?: string;
    request_type?: string;
    extraQueryParams?: Record<string, string | number | boolean>;

    // special
    extraTokenParams?: Record<string, unknown>;
    client_secret?: string;
    skipUserInfo?: boolean;
    disablePKCE?: boolean;
    /** custom "state", which can be used by a caller to have "data" round tripped */
    state_data?: unknown;
    url_state?: string;
}

/**
 * @public
 */
export class SigninRequest {
    private static readonly _logger = new Logger("SigninRequest");

    public readonly url: string;
    public readonly state: SigninState;

    private constructor(args: {
        url: string;
        state: SigninState;
    }) {
        this.url = args.url;
        this.state = args.state;
    }

    public static async create({
        // mandatory
        url, authority, client_id, redirect_uri, response_type, scope,
        // optional
        state_data, response_mode, request_type, client_secret, nonce, url_state,
        resource,
        skipUserInfo,
        extraQueryParams,
        extraTokenParams,
        disablePKCE,
        ...optionalParams
    }: SigninRequestCreateArgs): Promise<SigninRequest> {
        if (!url) {
            this._logger.error("create: No url passed");
            throw new Error("url");
        }
        if (!client_id) {
            this._logger.error("create: No client_id passed");
            throw new Error("client_id");
        }
        if (!redirect_uri) {
            this._logger.error("create: No redirect_uri passed");
            throw new Error("redirect_uri");
        }
        if (!response_type) {
            this._logger.error("create: No response_type passed");
            throw new Error("response_type");
        }
        if (!scope) {
            this._logger.error("create: No scope passed");
            throw new Error("scope");
        }
        if (!authority) {
            this._logger.error("create: No authority passed");
            throw new Error("authority");
        }

        const state = await SigninState.create({
            data: state_data,
            request_type,
            url_state,
            code_verifier: !disablePKCE,
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

        let stateParam = state.id;
        if (url_state) {
            stateParam = `${stateParam}${URL_STATE_DELIMITER}${url_state}`;
        }
        parsedUrl.searchParams.append("state", stateParam);
        if (state.code_challenge) {
            parsedUrl.searchParams.append("code_challenge", state.code_challenge);
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

        return new SigninRequest({
            url: parsedUrl.href,
            state,
        });
    }
}
