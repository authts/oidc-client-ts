// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Logger } from "./utils";
import { State } from "./State";

/**
 * @public
 */
export interface SignoutRequestArgs {
    // mandatory
    url: string;

    // optional
    state_data?: unknown;
    id_token_hint?: string;
    post_logout_redirect_uri?: string;
    extraQueryParams?: Record<string, string | number | boolean>;
    extraSignoutQueryParams?: Record<string, string | number | boolean>;
    request_type?: string;
}

/**
 * @public
 */
export class SignoutRequest {
    private readonly _logger = new Logger("SignoutRequest");

    public readonly url: string;
    public readonly state?: State;

    public constructor({
        url,
        state_data, id_token_hint, post_logout_redirect_uri, extraQueryParams, extraSignoutQueryParams, request_type,
    }: SignoutRequestArgs) {
        if (!url) {
            this._logger.error("ctor: No url passed");
            throw new Error("url");
        }

        const parsedUrl = new URL(url);
        if (id_token_hint) {
            parsedUrl.searchParams.append("id_token_hint", id_token_hint);
        }

        if (post_logout_redirect_uri) {
            parsedUrl.searchParams.append("post_logout_redirect_uri", post_logout_redirect_uri);

            if (state_data) {
                this.state = new State({ data: state_data, request_type });

                parsedUrl.searchParams.append("state", this.state.id);
            }
        }

        for (const [key, value] of Object.entries({ ...extraQueryParams, ...extraSignoutQueryParams })) {
            if (value != null) {
                parsedUrl.searchParams.append(key, value.toString());
            }
        }

        this.url = parsedUrl.href;
    }
}
