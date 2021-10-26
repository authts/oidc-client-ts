// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Log, Timer } from "./utils";

export interface UserProfile {
    sub?: string;
    sid?: string;
    azp?: string;
    at_hash?: string;
    auth_time?: number;
}

/**
 * @public
 */
export class User {
    public session_state: string | undefined;
    public access_token: string;
    public refresh_token: string | undefined;
    public token_type: string;
    public scope: string | undefined;
    public profile: UserProfile;
    public expires_at: number | undefined;

    public constructor(args: {
        session_state?: string;
        access_token: string; refresh_token?: string;
        token_type: string; scope?: string; profile: UserProfile; expires_at?: number;
    }) {
        this.session_state = args.session_state;
        this.access_token = args.access_token;
        this.refresh_token = args.refresh_token;
        this.token_type = args.token_type;
        this.scope = args.scope;
        this.profile = args.profile;
        this.expires_at = args.expires_at;
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

    public toStorageString(): string {
        Log.debug("User.toStorageString");
        return JSON.stringify({
            session_state: this.session_state,
            access_token: this.access_token,
            refresh_token: this.refresh_token,
            token_type: this.token_type,
            scope: this.scope,
            profile: this.profile,
            expires_at: this.expires_at
        });
    }

    public static fromStorageString(storageString: string): User {
        Log.debug("User.fromStorageString");
        return new User(JSON.parse(storageString));
    }
}
