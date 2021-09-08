// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Log, Timer } from "./utils";
import { User } from "./User";

export type AccessTokenCallback = (...ev: any[]) => void;

export class AccessTokenEvents {
    private _expiringNotificationTimeInSeconds: number
    private _expiringTimer: Timer
    private _expiredTimer: Timer

    public constructor({ expiringNotificationTimeInSeconds }: { expiringNotificationTimeInSeconds: number }) {
        this._expiringNotificationTimeInSeconds = expiringNotificationTimeInSeconds;
        this._expiringTimer = new Timer("Access token expiring");
        this._expiredTimer = new Timer("Access token expired");
    }

    public load(container: User) {
        // only register events if there's an access token and it has an expiration
        if (container.access_token && container.expires_in !== undefined) {
            const duration = container.expires_in;
            Log.debug("AccessTokenEvents.load: access token present, remaining duration:", duration);

            if (duration > 0) {
                // only register expiring if we still have time
                let expiring = duration - this._expiringNotificationTimeInSeconds;
                if (expiring <= 0) {
                    expiring = 1;
                }

                Log.debug("AccessTokenEvents.load: registering expiring timer in:", expiring);
                this._expiringTimer.init(expiring);
            }
            else {
                Log.debug("AccessTokenEvents.load: canceling existing expiring timer becase we're past expiration.");
                this._expiringTimer.cancel();
            }

            // if it's negative, it will still fire
            const expired = duration + 1;
            Log.debug("AccessTokenEvents.load: registering expired timer in:", expired);
            this._expiredTimer.init(expired);
        }
        else {
            this._expiringTimer.cancel();
            this._expiredTimer.cancel();
        }
    }

    public unload() {
        Log.debug("AccessTokenEvents.unload: canceling existing access token timers");
        this._expiringTimer.cancel();
        this._expiredTimer.cancel();
    }

    public addAccessTokenExpiring(cb: AccessTokenCallback) {
        this._expiringTimer.addHandler(cb);
    }
    public removeAccessTokenExpiring(cb: AccessTokenCallback) {
        this._expiringTimer.removeHandler(cb);
    }

    public addAccessTokenExpired(cb: AccessTokenCallback) {
        this._expiredTimer.addHandler(cb);
    }
    public removeAccessTokenExpired(cb: AccessTokenCallback) {
        this._expiredTimer.removeHandler(cb);
    }
}
