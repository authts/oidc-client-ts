// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Logger, UrlUtils } from "./utils";
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
    resource?: string;
    response_mode?: string;
    request?: string;
    request_uri?: string;
    extraQueryParams?: Record<string, string | number | boolean>;
    request_type?: string;
    client_secret?: string;
    extraTokenParams?: Record<string, unknown>;
    skipUserInfo?: boolean;

    // custom "state", which can be used by a caller to have "data" round tripped
    state_data?: unknown;
}

/**
 * @public
 */
export class SigninRequest {
    private readonly _logger: Logger;

    public readonly url: string;
    public readonly state: SigninState;

    public constructor({
        // mandatory
        url, authority, client_id, redirect_uri, response_type, scope,
        // optional
        state_data, prompt, display, max_age, ui_locales, id_token_hint, login_hint, acr_values, resource, response_mode,
        request, request_uri, extraQueryParams, request_type, client_secret, extraTokenParams, skipUserInfo
    }: SigninRequestArgs) {
        this._logger = new Logger("SigninRequest");

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

        if (!response_mode) {
            response_mode = "query";
        }

        this.state = new SigninState({
            data: state_data,
            request_type,
            code_verifier: true,
            client_id, authority, redirect_uri,
            response_mode,
            client_secret, scope, extraTokenParams,
            skipUserInfo
        });

        url = UrlUtils.addQueryParam(url, "client_id", client_id);
        url = UrlUtils.addQueryParam(url, "redirect_uri", redirect_uri);
        url = UrlUtils.addQueryParam(url, "response_type", response_type);
        url = UrlUtils.addQueryParam(url, "scope", scope);

        url = UrlUtils.addQueryParam(url, "state", this.state.id);
        if (this.state.code_challenge) {
            url = UrlUtils.addQueryParam(url, "code_challenge", this.state.code_challenge);
            url = UrlUtils.addQueryParam(url, "code_challenge_method", "S256");
        }

        const optional: Record<string, any> = { prompt, display, max_age, ui_locales, id_token_hint, login_hint, acr_values, resource, request, request_uri, response_mode };
        for (const key in optional) {
            if (optional[key]) {
                url = UrlUtils.addQueryParam(url, key, optional[key]);
            }
        }

        for (const key in extraQueryParams) {
            url = UrlUtils.addQueryParam(url, key, extraQueryParams[key]);
        }

        this.url = url;
    }
}
