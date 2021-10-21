// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Log, UrlUtility } from "./utils";
import { State } from "./State";

export interface SignoutRequestArgs {
    // mandatory
    url: string;

    // optional
    state_data?: any;
    post_logout_redirect_uri?: string;
    extraQueryParams?: Record<string, string | number | boolean>;
    request_type?: string;
}

export class SignoutRequest {
    public readonly url: string
    public readonly state?: State

    public constructor({
        url,
        state_data, post_logout_redirect_uri, extraQueryParams, request_type
    }: SignoutRequestArgs) {
        if (!url) {
            Log.error("SignoutRequest.ctor: No url passed");
            throw new Error("url");
        }

        if (post_logout_redirect_uri) {
            url = UrlUtility.addQueryParam(url, "post_logout_redirect_uri", post_logout_redirect_uri);

            if (state_data) {
                this.state = new State({ data: state_data, request_type });

                url = UrlUtility.addQueryParam(url, "state", this.state.id);
            }
        }

        for (const key in extraQueryParams) {
            url = UrlUtility.addQueryParam(url, key, extraQueryParams[key]);
        }

        this.url = url;
    }
}
