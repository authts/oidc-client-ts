// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Log, UrlUtility } from "./utils";
import { SigninState } from "./SigninState";

export interface SigninRequestArgs {
    // mandatory
    url: string;
    authority: string;
    client_id: string;
    redirect_uri: string;
    response_type: string;
    scope: string;

    // optional
    state_data?: any;
    prompt?: string;
    display?: string;
    max_age?: number;
    ui_locales?: string;
    login_hint?: string;
    acr_values?: string;
    resource?: string;
    response_mode?: string;
    request?: string;
    request_uri?: string;
    extraQueryParams?: Record<string, string | number | boolean>;
    request_type?: string;
    client_secret?: string;
    extraTokenParams?: Record<string, any>;
    skipUserInfo?: boolean;
}

export class SigninRequest {
    public readonly url: string;
    public readonly state: SigninState;

    public constructor({
        // mandatory
        url, authority, client_id, redirect_uri, response_type, scope,
        // optional
        state_data, prompt, display, max_age, ui_locales, login_hint, acr_values, resource, response_mode,
        request, request_uri, extraQueryParams, request_type, client_secret, extraTokenParams, skipUserInfo
    }: SigninRequestArgs) {
        if (!url) {
            Log.error("SigninRequest.ctor: No url passed");
            throw new Error("url");
        }
        if (!client_id) {
            Log.error("SigninRequest.ctor: No client_id passed");
            throw new Error("client_id");
        }
        if (!redirect_uri) {
            Log.error("SigninRequest.ctor: No redirect_uri passed");
            throw new Error("redirect_uri");
        }
        if (!response_type) {
            Log.error("SigninRequest.ctor: No response_type passed");
            throw new Error("response_type");
        }
        if (!scope) {
            Log.error("SigninRequest.ctor: No scope passed");
            throw new Error("scope");
        }
        if (!authority) {
            Log.error("SigninRequest.ctor: No authority passed");
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

        url = UrlUtility.addQueryParam(url, "client_id", client_id);
        url = UrlUtility.addQueryParam(url, "redirect_uri", redirect_uri);
        url = UrlUtility.addQueryParam(url, "response_type", response_type);
        url = UrlUtility.addQueryParam(url, "scope", scope);

        url = UrlUtility.addQueryParam(url, "state", this.state.id);
        if (this.state.code_challenge) {
            url = UrlUtility.addQueryParam(url, "code_challenge", this.state.code_challenge);
            url = UrlUtility.addQueryParam(url, "code_challenge_method", "S256");
        }

        const optional: Record<string, any> = { prompt, display, max_age, ui_locales, login_hint, acr_values, resource, request, request_uri, response_mode };
        for (const key in optional) {
            if (optional[key]) {
                url = UrlUtility.addQueryParam(url, key, optional[key]);
            }
        }

        for (const key in extraQueryParams) {
            url = UrlUtility.addQueryParam(url, key, extraQueryParams[key]);
        }

        this.url = url;
    }
}
