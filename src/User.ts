// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Logger, Timer } from "./utils";
import type { IdTokenClaims } from "./Claims";

/**
 * Holds claims represented by a combination of the `id_token` and the user info endpoint.
 *
 * @public
 */
export type UserProfile = IdTokenClaims;

/**
 * @public
 */
export class User {
    /**
     * A JSON Web Token (JWT). Only provided if `openid` scope was requested.
     * The application can access the data decoded by using the `profile` property.
     */
    public id_token?: string;

    /** The session state value returned from the OIDC provider. */
    public session_state: string | null;

    /**
     * The requested access token returned from the OIDC provider. The application can use this token to
     * authenticate itself to the secured resource.
     */
    public access_token: string;

    /**
     * An OAuth 2.0 refresh token. The app can use this token to acquire additional access tokens after the
     * current access token expires. Refresh tokens are long-lived and can be used to maintain access to resources
     * for extended periods of time.
     */
    public refresh_token?: string;

    /** Typically "Bearer" */
    public token_type: string;

    /** The scopes that the requested access token is valid for. */
    public scope?: string;

    /** The claims represented by a combination of the `id_token` and the user info endpoint. */
    public profile: UserProfile;

    /** The expires at returned from the OIDC provider. */
    public expires_at?: number;

    /** custom state data set during the initial signin request */
    public readonly state: unknown;
    public readonly url_state?: string;

    public constructor(args: {
        id_token?: string;
        session_state?: string | null;
        access_token: string;
        refresh_token?: string;
        token_type: string;
        scope?: string;
        profile: UserProfile;
        expires_at?: number;
        userState?: unknown;
        url_state?: string;
    }) {
        this.id_token = args.id_token;
        this.session_state = args.session_state ?? null;
        this.access_token = args.access_token;
        this.refresh_token = args.refresh_token;

        this.token_type = args.token_type;
        this.scope = args.scope;
        this.profile = args.profile;
        this.expires_at = args.expires_at;
        this.state = args.userState;
        this.url_state = args.url_state;
    }

    /** Computed number of seconds the access token has remaining. */
    public get expires_in(): number | undefined {
        if (this.expires_at === undefined) {
            return undefined;
        }
        return this.expires_at - Timer.getEpochTime();
    }

    public set expires_in(value: number | undefined) {
        if (value !== undefined) {
            this.expires_at = Math.floor(value) + Timer.getEpochTime();
        }
    }

    /** Computed value indicating if the access token is expired. */
    public get expired(): boolean | undefined {
        const expires_in = this.expires_in;
        if (expires_in === undefined) {
            return undefined;
        }
        return expires_in <= 0;
    }

    /** Array representing the parsed values from the `scope`. */
    public get scopes(): string[] {
        return this.scope?.split(" ") ?? [];
    }

    public toStorageString(): string {
        new Logger("User").create("toStorageString");
        return JSON.stringify({
            id_token: this.id_token,
            session_state: this.session_state,
            access_token: this.access_token,
            refresh_token: this.refresh_token,
            token_type: this.token_type,
            scope: this.scope,
            profile: this.profile,
            expires_at: this.expires_at,
        });
    }

    public static fromStorageString(storageString: string): User {
        Logger.createStatic("User", "fromStorageString");
        return new User(JSON.parse(storageString));
    }
}
