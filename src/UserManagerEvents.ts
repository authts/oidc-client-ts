// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Logger, Event } from "./utils";
import { AccessTokenEvents } from "./AccessTokenEvents";
import type { UserManagerSettingsStore } from "./UserManagerSettings";
import type { User } from "./User";

/**
 * @public
 */
export type UserLoadedCallback = (user: User) => Promise<void> | void;
/**
 * @public
 */
export type UserUnloadedCallback = () => Promise<void> | void;
/**
 * @public
 */
export type SilentRenewErrorCallback = (error: Error) => Promise<void> | void;
/**
 * @public
 */
export type UserSignedInCallback = () => Promise<void> | void;
/**
 * @public
 */
export type UserSignedOutCallback = () => Promise<void> | void;
/**
 * @public
 */
export type UserSessionChangedCallback = () => Promise<void> | void;

/**
 * @public
 */
export class UserManagerEvents extends AccessTokenEvents {
    private _userLoaded: Event<[User]>;
    private _userUnloaded: Event<[void]>;
    private _silentRenewError: Event<[Error]>;
    private _userSignedIn: Event<[void]>;
    private _userSignedOut: Event<[void]>;
    private _userSessionChanged: Event<[void]>;

    public constructor(settings: UserManagerSettingsStore) {
        super({ expiringNotificationTimeInSeconds: settings.accessTokenExpiringNotificationTimeInSeconds });
        this._logger = new Logger("UserManagerEvents");

        this._userLoaded = new Event("User loaded");
        this._userUnloaded = new Event("User unloaded");
        this._silentRenewError = new Event("Silent renew error");
        this._userSignedIn = new Event("User signed in");
        this._userSignedOut = new Event("User signed out");
        this._userSessionChanged = new Event("User session changed");
    }

    public load(user: User, raiseEvent=true): void {
        this._logger.debug("load");
        super.load(user);
        if (raiseEvent) {
            this._userLoaded.raise(user);
        }
    }
    public unload(): void {
        this._logger.debug("unload");
        super.unload();
        this._userUnloaded.raise();
    }

    public addUserLoaded(cb: UserLoadedCallback): void {
        this._userLoaded.addHandler(cb);
    }
    public removeUserLoaded(cb: UserLoadedCallback): void {
        this._userLoaded.removeHandler(cb);
    }

    public addUserUnloaded(cb: UserUnloadedCallback): void {
        this._userUnloaded.addHandler(cb);
    }
    public removeUserUnloaded(cb: UserUnloadedCallback): void {
        this._userUnloaded.removeHandler(cb);
    }

    public addSilentRenewError(cb: SilentRenewErrorCallback): void {
        this._silentRenewError.addHandler(cb);
    }
    public removeSilentRenewError(cb: SilentRenewErrorCallback): void {
        this._silentRenewError.removeHandler(cb);
    }
    public _raiseSilentRenewError(e: Error): void {
        this._logger.debug("_raiseSilentRenewError", e.message);
        this._silentRenewError.raise(e);
    }

    public addUserSignedIn(cb: UserSignedInCallback): void {
        this._userSignedIn.addHandler(cb);
    }
    public removeUserSignedIn(cb: UserSignedInCallback): void {
        this._userSignedIn.removeHandler(cb);
    }
    public _raiseUserSignedIn(): void {
        this._logger.debug("_raiseUserSignedIn");
        this._userSignedIn.raise();
    }

    public addUserSignedOut(cb: UserSignedOutCallback): void {
        this._userSignedOut.addHandler(cb);
    }
    public removeUserSignedOut(cb: UserSignedOutCallback): void {
        this._userSignedOut.removeHandler(cb);
    }
    public _raiseUserSignedOut(): void {
        this._logger.debug("_raiseUserSignedOut");
        this._userSignedOut.raise();
    }

    public addUserSessionChanged(cb: UserSessionChangedCallback): void {
        this._userSessionChanged.addHandler(cb);
    }
    public removeUserSessionChanged(cb: UserSessionChangedCallback): void {
        this._userSessionChanged.removeHandler(cb);
    }
    public _raiseUserSessionChanged(): void {
        this._logger.debug("_raiseUserSessionChanged");
        this._userSessionChanged.raise();
    }
}
