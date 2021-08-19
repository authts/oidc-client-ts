// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Log, Timer } from "./utils";

export class User {
    public id_token: string;
    public session_state: any;
    public access_token: string;
    public refresh_token: string;
    public token_type: string;
    public scope: string;
    public profile: any;
    public state: any;
    public expires_at: number;

    public constructor({
        id_token, session_state, access_token, refresh_token, token_type, scope, profile, expires_at, state
    }: any) {
        this.id_token = id_token;
        this.session_state = session_state;
        this.access_token = access_token;
        this.refresh_token = refresh_token;
        this.token_type = token_type;
        this.scope = scope;
        this.profile = profile;
        this.state = state;
        this.expires_at = expires_at;
    }

    public get expires_in() {
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

    public get expired() {
        const expires_in = this.expires_in;
        if (expires_in !== undefined) {
            return expires_in <= 0;
        }
        return undefined;
    }

    public get scopes() {
        return (this.scope || "").split(" ");
    }

    public toStorageString() {
        Log.debug("User.toStorageString");
        return JSON.stringify({
            id_token: this.id_token,
            session_state: this.session_state,
            access_token: this.access_token,
            refresh_token: this.refresh_token,
            token_type: this.token_type,
            scope: this.scope,
            profile: this.profile,
            expires_at: this.expires_at
        });
    }

    public static fromStorageString(storageString: string) {
        Log.debug("User.fromStorageString");
        return new User(JSON.parse(storageString));
    }
}
