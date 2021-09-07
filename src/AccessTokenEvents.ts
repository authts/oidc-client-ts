// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Log, Timer } from "./utils";
import { User } from "./User";

export type AccessTokenCallback = (...ev: any[]) => void;

export class AccessTokenEvents {
    private _accessTokenExpiringNotificationTimeInSeconds: number
    private _accessTokenExpiring: Timer
    private _accessTokenExpired: Timer

    public constructor({
        accessTokenExpiringNotificationTimeInSeconds
    }: { accessTokenExpiringNotificationTimeInSeconds: number }) {
        this._accessTokenExpiringNotificationTimeInSeconds = accessTokenExpiringNotificationTimeInSeconds;
        this._accessTokenExpiring = new Timer("Access token expiring");
        this._accessTokenExpired = new Timer("Access token expired");
    }

    public load(container: User) {
        // only register events if there's an access token and it has an expiration
        if (container.access_token && container.expires_in !== undefined) {
            const duration = container.expires_in;
            Log.debug("AccessTokenEvents.load: access token present, remaining duration:", duration);

            if (duration > 0) {
                // only register expiring if we still have time
                let expiring = duration - this._accessTokenExpiringNotificationTimeInSeconds;
                if (expiring <= 0) {
                    expiring = 1;
                }

                Log.debug("AccessTokenEvents.load: registering expiring timer in:", expiring);
                this._accessTokenExpiring.init(expiring);
            }
            else {
                Log.debug("AccessTokenEvents.load: canceling existing expiring timer becase we're past expiration.");
                this._accessTokenExpiring.cancel();
            }

            // if it's negative, it will still fire
            const expired = duration + 1;
            Log.debug("AccessTokenEvents.load: registering expired timer in:", expired);
            this._accessTokenExpired.init(expired);
        }
        else {
            this._accessTokenExpiring.cancel();
            this._accessTokenExpired.cancel();
        }
    }

    public unload() {
        Log.debug("AccessTokenEvents.unload: canceling existing access token timers");
        this._accessTokenExpiring.cancel();
        this._accessTokenExpired.cancel();
    }

    public addAccessTokenExpiring(cb: AccessTokenCallback) {
        this._accessTokenExpiring.addHandler(cb);
    }
    public removeAccessTokenExpiring(cb: AccessTokenCallback) {
        this._accessTokenExpiring.removeHandler(cb);
    }

    public addAccessTokenExpired(cb: AccessTokenCallback) {
        this._accessTokenExpired.addHandler(cb);
    }
    public removeAccessTokenExpired(cb: AccessTokenCallback) {
        this._accessTokenExpired.removeHandler(cb);
    }
}
