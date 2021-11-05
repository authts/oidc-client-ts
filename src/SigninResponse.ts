// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Timer } from "./utils";
import type { UserProfile } from "./User";

const OidcScope = "openid";

/**
 * @public
 */
export class SigninResponse {
    public readonly code: string;
    public readonly state_id: string | undefined;

    // updated by ResponseValidator
    public error: string | undefined;
    public error_description: string | undefined;
    public error_uri: string | undefined;

    // updated by ResponseValidator
    public id_token: string | undefined;
    public session_state: string | undefined;
    public access_token: string;
    public refresh_token: string | undefined;
    public token_type: string;
    public scope: string | undefined;
    public expires_at: number | undefined;

    // set by ResponseValidator
    /** custom "state", which can be used by a caller to have "data" round tripped */
    public state: unknown;

    // set by ResponseValidator
    public profile: UserProfile = {};

    public constructor(params: URLSearchParams) {
        // URLSearchParams returns `null` for missing values, reconstruct it as a map
        const values = new Map(params);
        this.error = values.get("error");
        this.error_description = values.get("error_description");
        this.error_uri = values.get("error_uri");

        // the default values here are for type safety only
        // ResponseValidator should check if these are empty and throw accordingly
        this.code = values.get("code") ?? "";
        this.access_token = values.get("access_token") ?? "";
        this.token_type = values.get("token_type") ?? "";

        this.state_id = values.get("state");
        this.id_token = values.get("id_token");
        this.session_state = values.get("session_state");
        this.refresh_token = values.get("refresh_token");
        this.scope = values.get("scope");
        const expiresIn = values.get("expires_in");
        this.expires_in = expiresIn ? parseInt(expiresIn) : undefined;
    }

    public get expires_in(): number | undefined {
        if (this.expires_at) {
            const now = Timer.getEpochTime();
            return this.expires_at - now;
        }
        return undefined;
    }
    public set expires_in(value: number | undefined) {
        if (value && value > 0) {
            const expires_in = Math.floor(value);
            const now = Timer.getEpochTime();
            this.expires_at = now + expires_in;
        }
    }

    public get expired(): boolean | undefined {
        const expires_in = this.expires_in;
        if (expires_in !== undefined) {
            return expires_in <= 0;
        }
        return undefined;
    }

    public get scopes(): string[] {
        return (this.scope || "").split(" ");
    }

    public get isOpenIdConnect(): boolean {
        return this.scopes.indexOf(OidcScope) >= 0 || !!this.id_token;
    }
}
