// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Timer, URL_STATE_DELIMITER } from "./utils";
import type { UserProfile } from "./User";

const OidcScope = "openid";

/**
 * @public
 * @see https://openid.net/specs/openid-connect-core-1_0.html#AuthResponse
 * @see https://openid.net/specs/openid-connect-core-1_0.html#AuthError
 */
export class SigninResponse {
    // props present in the initial callback response regardless of success
    public readonly state: string | null;
    /** @see {@link User.session_state} */
    public session_state: string | null;

    // error props
    /** @see {@link ErrorResponse.error} */
    public readonly error: string | null;
    /** @see {@link ErrorResponse.error_description} */
    public readonly error_description: string | null;
    /** @see {@link ErrorResponse.error_uri} */
    public readonly error_uri: string | null;

    // success props
    public readonly code: string | null;

    // props set after validation
    /** @see {@link User.id_token} */
    public id_token?: string;
    /** @see {@link User.access_token} */
    public access_token = "";
    /** @see {@link User.token_type} */
    public token_type = "";
    /** @see {@link User.refresh_token} */
    public refresh_token?: string;
    /** @see {@link User.scope} */
    public scope?: string;
    /** @see {@link User.expires_at} */
    public expires_at?: number;

    /** custom state data set during the initial signin request */
    public userState: unknown;
    public url_state?: string;

    /** @see {@link User.profile} */
    public profile: UserProfile = {} as UserProfile;

    public constructor(params: URLSearchParams) {
        this.state = params.get("state");
        this.session_state = params.get("session_state");
        if (this.state) {
            const splitState = decodeURIComponent(this.state).split(URL_STATE_DELIMITER);
            this.state = splitState[0];
            if (splitState.length > 1) {
                this.url_state = splitState.slice(1).join(URL_STATE_DELIMITER);
            }
        }

        this.error = params.get("error");
        this.error_description = params.get("error_description");
        this.error_uri = params.get("error_uri");

        this.code = params.get("code");
    }

    public get expires_in(): number | undefined {
        if (this.expires_at === undefined) {
            return undefined;
        }
        return this.expires_at - Timer.getEpochTime();
    }
    public set expires_in(value: number | undefined) {
        // spec expects a number, but normalize here just in case
        if (typeof value === "string") value = Number(value);
        if (value !== undefined && value >= 0) {
            this.expires_at = Math.floor(value) + Timer.getEpochTime();
        }
    }

    public get isOpenId(): boolean {
        return this.scope?.split(" ").includes(OidcScope) || !!this.id_token;
    }
}
