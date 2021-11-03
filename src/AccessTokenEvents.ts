// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Logger, Timer } from "./utils";
import type { User } from "./User";

/**
 * @public
 */
export type AccessTokenCallback = (...ev: any[]) => void;

/**
 * @public
 */
export class AccessTokenEvents {
    protected _logger: Logger;

    private _expiringNotificationTimeInSeconds: number
    private _expiringTimer: Timer
    private _expiredTimer: Timer

    public constructor({ expiringNotificationTimeInSeconds }: { expiringNotificationTimeInSeconds: number }) {
        this._logger = new Logger("AccessTokenEvents");

        this._expiringNotificationTimeInSeconds = expiringNotificationTimeInSeconds;
        this._expiringTimer = new Timer("Access token expiring");
        this._expiredTimer = new Timer("Access token expired");
    }

    public load(container: User): void {
        // only register events if there's an access token and it has an expiration
        if (container.access_token && container.expires_in !== undefined) {
            const duration = container.expires_in;
            this._logger.debug("load: access token present, remaining duration:", duration);

            if (duration > 0) {
                // only register expiring if we still have time
                let expiring = duration - this._expiringNotificationTimeInSeconds;
                if (expiring <= 0) {
                    expiring = 1;
                }

                this._logger.debug("load: registering expiring timer in:", expiring);
                this._expiringTimer.init(expiring);
            }
            else {
                this._logger.debug("load: canceling existing expiring timer because we're past expiration.");
                this._expiringTimer.cancel();
            }

            // if it's negative, it will still fire
            const expired = duration + 1;
            this._logger.debug("load: registering expired timer in:", expired);
            this._expiredTimer.init(expired);
        }
        else {
            this._expiringTimer.cancel();
            this._expiredTimer.cancel();
        }
    }

    public unload(): void {
        this._logger.debug("unload: canceling existing access token timers");
        this._expiringTimer.cancel();
        this._expiredTimer.cancel();
    }

    public addAccessTokenExpiring(cb: AccessTokenCallback): void {
        this._expiringTimer.addHandler(cb);
    }
    public removeAccessTokenExpiring(cb: AccessTokenCallback): void {
        this._expiringTimer.removeHandler(cb);
    }

    public addAccessTokenExpired(cb: AccessTokenCallback): void {
        this._expiredTimer.addHandler(cb);
    }
    public removeAccessTokenExpired(cb: AccessTokenCallback): void {
        this._expiredTimer.removeHandler(cb);
    }
}
