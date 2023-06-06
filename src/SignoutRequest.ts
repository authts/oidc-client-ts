// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Logger } from "./utils";
import { State } from "./State";

/**
 * @public
 * @see https://openid.net/specs/openid-connect-rpinitiated-1_0.html#RPLogout
 */
export interface SignoutRequestArgs {
    // mandatory
    url: string;

    // optional
    id_token_hint?: string;
    client_id?: string;
    post_logout_redirect_uri?: string;
    extraQueryParams?: Record<string, string | number | boolean>;

    // special
    request_type?: string;
    /** custom "state", which can be used by a caller to have "data" round tripped */
    state_data?: unknown;
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
        state_data, id_token_hint, post_logout_redirect_uri, extraQueryParams, request_type, client_id,
    }: SignoutRequestArgs) {
        if (!url) {
            this._logger.error("ctor: No url passed");
            throw new Error("url");
        }

        const parsedUrl = new URL(url);
        if (id_token_hint) {
            parsedUrl.searchParams.append("id_token_hint", id_token_hint);
        }
        if (client_id) {
            parsedUrl.searchParams.append("client_id", client_id);
        }

        if (post_logout_redirect_uri) {
            parsedUrl.searchParams.append("post_logout_redirect_uri", post_logout_redirect_uri);

            if (state_data) {
                this.state = new State({ data: state_data, request_type });

                parsedUrl.searchParams.append("state", this.state.id);
            }
        }

        for (const [key, value] of Object.entries({ ...extraQueryParams })) {
            if (value != null) {
                parsedUrl.searchParams.append(key, value.toString());
            }
        }

        this.url = parsedUrl.href;
    }
}
