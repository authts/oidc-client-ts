// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Log } from "./utils";
import { UserManager } from "./UserManager";

export class SilentRenewService {
    private _userManager: UserManager;
    private _callback: any;

    public constructor(userManager: UserManager) {
        this._userManager = userManager;
    }

    public async start() {
        if (!this._callback) {
            this._callback = this._tokenExpiring.bind(this);
            this._userManager.events.addAccessTokenExpiring(this._callback);

            // this will trigger loading of the user so the expiring events can be initialized
            try {
                await this._userManager.getUser();
                // deliberate nop
            }
            catch (err) {
                // catch to suppress errors since we're in a ctor
                Log.error("SilentRenewService.start: Error from getUser:", err.message);
            }
        }
    }

    public stop() {
        if (this._callback) {
            this._userManager.events.removeAccessTokenExpiring(this._callback);
            delete this._callback;
        }
    }

    protected async _tokenExpiring() {
        try {
            await this._userManager.signinSilent();
            Log.debug("SilentRenewService._tokenExpiring: Silent token renewal successful");
        }
        catch (err) {
            Log.error("SilentRenewService._tokenExpiring: Error from signinSilent:", err.message);
            this._userManager.events._raiseSilentRenewError(err);
        }
    }
}
