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
    private readonly _retryTimer: Timer;

    public constructor(private _userManager: UserManager) {
        this._retryTimer = new Timer("Retry Silent Renew", _userManager.settings.clockService);
    }

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
            logger.debug("silent token renewal successful");
        }
        catch (err) {
            if (err instanceof ErrorTimeout) {
                // no response from authority server, e.g. IFrame timeout, ...
                logger.warn("ErrorTimeout from signinSilent:", err, "retry in 5s");
                this._retryTimer.init(5);
                return;
            }

            logger.error("Error from signinSilent:", err);
            this._userManager.events._raiseSilentRenewError(err as Error);
        }
    };
}
