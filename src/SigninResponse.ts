// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { UrlUtility } from './utils';

const OidcScope = "openid";

export class SigninResponse {
    public readonly code: string;

    // will be set from ResponseValidator
    public state: string |  undefined;

    // will be set from ResponseValidator
    public error: string |  undefined;
    public error_description: string |  undefined;
    public error_uri: string |  undefined;

    // will be set from ResponseValidator
    public id_token: string |  undefined;
    public session_state: string |  undefined;
    public access_token: string |  undefined;
    public token_type: string |  undefined;
    public scope: string |  undefined;
    public expires_at: number | undefined

    // will be set from ResponseValidator
    public profile: any |  undefined;

    constructor(url?: string, delimiter = "#") {

        var values = UrlUtility.parseUrlFragment(url, delimiter);

        this.error = values.error;
        this.error_description = values.error_description;
        this.error_uri = values.error_uri;

        this.code = values.code;
        this.state = values.state;

        this.id_token = values.id_token;
        this.session_state = values.session_state;
        this.access_token = values.access_token;
        this.token_type = values.token_type;
        this.scope = values.scope;
        this.expires_in = parseInt(values.expires_in);

        this.profile = undefined;
    }

    get expires_in(): number | undefined {
        if (this.expires_at) {
            let now = Math.floor(Date.now() / 1000);
            return this.expires_at - now;
        }
        return undefined;
    }
    set expires_in(value: number | undefined) {
        if (typeof value === 'number' && value > 0) {
            let expires_in = Math.floor(value);
            let now = Math.floor(Date.now() / 1000);
            this.expires_at = now + expires_in;
        }
    }

    get expired() {
        let expires_in = this.expires_in;
        if (expires_in !== undefined) {
            return expires_in <= 0;
        }
        return undefined;
    }

    get scopes() {
        return (this.scope || "").split(" ");
    }

    get isOpenIdConnect() {
        return this.scopes.indexOf(OidcScope) >= 0 || !!this.id_token;
    }
}
