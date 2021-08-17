// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Log, Event } from "./utils";
import { AccessTokenEvents } from "./AccessTokenEvents";
import { UserManagerSettingsStore } from "./UserManagerSettings";
import { User } from "./User";

export type UserLoadedCallback = (user: User) => void;
export type UserUnloadedCallback = () => void;
export type SilentRenewErrorCallback = (error: Error) => void;
export type UserSignedInCallback = () => void;
export type UserSignedOutCallback = () => void;
export type UserSessionChangedCallback = () => void;

export class UserManagerEvents extends AccessTokenEvents {
    private _userLoaded: Event;
    private _userUnloaded: Event;
    private _silentRenewError: Event;
    private _userSignedIn: Event;
    private _userSignedOut: Event;
    private _userSessionChanged: Event;

    constructor(settings: UserManagerSettingsStore) {
        super(settings);
        this._userLoaded = new Event("User loaded");
        this._userUnloaded = new Event("User unloaded");
        this._silentRenewError = new Event("Silent renew error");
        this._userSignedIn = new Event("User signed in");
        this._userSignedOut = new Event("User signed out");
        this._userSessionChanged = new Event("User session changed");
    }

    load(user: User, raiseEvent=true) {
        Log.debug("UserManagerEvents.load");
        super.load(user);
        if (raiseEvent) {
            this._userLoaded.raise(user);
        }
    }
    unload() {
        Log.debug("UserManagerEvents.unload");
        super.unload();
        this._userUnloaded.raise();
    }

    addUserLoaded(cb: UserLoadedCallback) {
        this._userLoaded.addHandler(cb);
    }
    removeUserLoaded(cb: UserLoadedCallback) {
        this._userLoaded.removeHandler(cb);
    }

    addUserUnloaded(cb: UserUnloadedCallback) {
        this._userUnloaded.addHandler(cb);
    }
    removeUserUnloaded(cb: UserUnloadedCallback) {
        this._userUnloaded.removeHandler(cb);
    }

    addSilentRenewError(cb: SilentRenewErrorCallback) {
        this._silentRenewError.addHandler(cb);
    }
    removeSilentRenewError(cb: SilentRenewErrorCallback) {
        this._silentRenewError.removeHandler(cb);
    }
    _raiseSilentRenewError(e: Error) {
        Log.debug("UserManagerEvents._raiseSilentRenewError", e.message);
        this._silentRenewError.raise(e);
    }

    addUserSignedIn(cb: UserSignedInCallback) {
        this._userSignedIn.addHandler(cb);
    }
    removeUserSignedIn(cb: UserSignedInCallback) {
        this._userSignedIn.removeHandler(cb);
    }
    _raiseUserSignedIn() {
        Log.debug("UserManagerEvents._raiseUserSignedIn");
        this._userSignedIn.raise();
    }

    addUserSignedOut(cb: UserSignedOutCallback) {
        this._userSignedOut.addHandler(cb);
    }
    removeUserSignedOut(cb: UserSignedOutCallback) {
        this._userSignedOut.removeHandler(cb);
    }
    _raiseUserSignedOut() {
        Log.debug("UserManagerEvents._raiseUserSignedOut");
        this._userSignedOut.raise();
    }

    addUserSessionChanged(cb: UserSessionChangedCallback) {
        this._userSessionChanged.addHandler(cb);
    }
    removeUserSessionChanged(cb: UserSessionChangedCallback) {
        this._userSessionChanged.removeHandler(cb);
    }
    _raiseUserSessionChanged() {
        Log.debug("UserManagerEvents._raiseUserSessionChanged");
        this._userSessionChanged.raise();
    }
}
