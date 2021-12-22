// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Logger } from "./utils";
import type { UserManager } from "./UserManager";
import type { AccessTokenCallback } from "./AccessTokenEvents";

/**
 * @internal
 */
export class SilentRenewService {
    protected _logger = new Logger("SilentRenewService");
    private _isStarted = false;

    public constructor(private _userManager: UserManager) {}

    public async start(): Promise<void> {
        if (!this._isStarted) {
            this._isStarted = true;
            this._userManager.events.addAccessTokenExpiring(this._tokenExpiring);

            // this will trigger loading of the user so the expiring events can be initialized
            try {
                await this._userManager.getUser();
                // deliberate nop
            }
            catch (err) {
                // catch to suppress errors since we're in a ctor
                this._logger.error("start: Error from getUser:", err instanceof Error ? err.message : err);
            }
        }
    }

    public stop(): void {
        if (this._isStarted) {
            this._userManager.events.removeAccessTokenExpiring(this._tokenExpiring);
            this._isStarted = false;
        }
    }

    protected _tokenExpiring: AccessTokenCallback = () => {
        this._userManager.signinSilent()
            .then(() => {
                this._logger.debug("_tokenExpiring: Silent token renewal successful");
            })
            .catch((err) => {
                const error = err instanceof Error ? err : new Error("Silent renew failed");
                this._logger.error("_tokenExpiring: Error from signinSilent:", error.message);
                this._userManager.events._raiseSilentRenewError(error);
            });
    };
}
