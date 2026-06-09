// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Logger, Timer } from "./utils";
import { ErrorTimeout } from "./errors";
import type { UserManager } from "./UserManager";
import type { AccessTokenCallback } from "./AccessTokenEvents";

/**
 * @internal
 */
export class SilentRenewService {
    protected _logger = new Logger("SilentRenewService");
    private _isStarted = false;
    private readonly _retryTimer = new Timer("Retry Silent Renew");
    private _timeoutRetryCount = 0;

    public constructor(private _userManager: UserManager) {}

    public async start(): Promise<void> {
        const logger = this._logger.create("start");
        if (!this._isStarted) {
            this._isStarted = true;
            this._userManager.events.addAccessTokenExpiring(this._tokenExpiring);
            this._retryTimer.addHandler(this._tokenExpiring);

            // this will trigger loading of the user so the expiring events can be initialized
            try {
                await this._userManager.getUser();
                // deliberate nop
            }
            catch (err) {
                // catch to suppress errors since we're in a ctor
                logger.error("getUser error", err);
            }
        }
    }

    public stop(): void {
        if (this._isStarted) {
            this._retryTimer.cancel();
            this._retryTimer.removeHandler(this._tokenExpiring);
            this._userManager.events.removeAccessTokenExpiring(this._tokenExpiring);
            this._isStarted = false;
        }
    }

    protected _tokenExpiring: AccessTokenCallback = async () => {
        const logger = this._logger.create("_tokenExpiring");
        try {
            await this._userManager.signinSilent();
            this._timeoutRetryCount = 0;
            logger.debug("silent token renewal successful");
        }
        catch (err) {
            if (err instanceof ErrorTimeout) {
                // Increment timeout retry counter
                this._timeoutRetryCount++;

                // Check if a max timeout retry limit is configured
                const maxRetries = this._userManager.settings.maxSilentRenewTimeoutRetries;
                const hasReachedLimit = maxRetries !== undefined && this._timeoutRetryCount > maxRetries;

                if (hasReachedLimit) {
                    // Limit reached: raise event to notify application and stop retrying
                    logger.error(
                        `Timeout retry limit reached (${this._timeoutRetryCount} > ${maxRetries}), ` +
                        "raising silentRenewError:",
                        err,
                    );
                    this._timeoutRetryCount = 0;
                    await this._userManager.events._raiseSilentRenewError(err as Error);
                    return;
                }

                // No limit configured (undefined) or limit not reached: continue retrying
                // no response from authority server, e.g. IFrame timeout, ...
                logger.warn(
                    `ErrorTimeout from signinSilent (attempt ${this._timeoutRetryCount}), retry in 5s:`,
                    err,
                );
                this._retryTimer.init(5);
                return;
            }

            // Non-timeout error: reset counter and raise event immediately
            logger.error("Error from signinSilent:", err);
            this._timeoutRetryCount = 0;
            await this._userManager.events._raiseSilentRenewError(err as Error);
        }
    };
}
