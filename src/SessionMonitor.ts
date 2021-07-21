// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Log, g_timer, IntervalTimer } from './utils';
import { CheckSessionIFrame } from './CheckSessionIFrame';
import { UserManager } from './UserManager';

export class SessionMonitor {
    private _userManager: UserManager;
    private _CheckSessionIFrameCtor: typeof CheckSessionIFrame;
    private _timer: IntervalTimer;
    private _sub: any;
    private _sid: any;
    private _checkSessionIFrame?: CheckSessionIFrame;

    constructor(userManager: UserManager, CheckSessionIFrameCtor = CheckSessionIFrame, timer = g_timer) {
        if (!userManager) {
            Log.error("SessionMonitor.ctor: No user manager passed to SessionMonitor");
            throw new Error("userManager");
        }

        this._userManager = userManager;
        this._CheckSessionIFrameCtor = CheckSessionIFrameCtor;
        this._timer = timer;

        this._userManager.events.addUserLoaded(this._start.bind(this));
        this._userManager.events.addUserUnloaded(this._stop.bind(this));

        Promise.resolve(this._init())
        .catch((err: Error) => {
            // catch to suppress errors since we're in a ctor
            Log.error("SessionMonitor ctor: error:", err.message);
        });
    }

    private async _init() {
        const user = await this._userManager.getUser();
        // doing this manually here since calling getUser
        // doesn't trigger load event.
        if (user) {
            this._start(user);
        }
        else if (this._settings.monitorAnonymousSession) {
            const session = await this._userManager.querySessionStatus();
            if (session) {
                let tmpUser = {
                    session_state: session.session_state,
                    profile: session.sub && session.sid ? {
                        sub: session.sub,
                        sid: session.sid
                    } : null
                };
                this._start(tmpUser);
            }
        }
    }

    get _settings() {
        return this._userManager.settings;
    }
    get _metadataService() {
        return this._userManager.metadataService;
    }
    get _client_id() {
        return this._settings.client_id;
    }
    get _checkSessionInterval() {
        return this._settings.checkSessionInterval;
    }
    get _stopCheckSessionOnError() {
        return this._settings.stopCheckSessionOnError;
    }

    async _start(user: any) {
        let session_state = user.session_state;

        if (session_state) {
            if (user.profile) {
                this._sub = user.profile.sub;
                this._sid = user.profile.sid;
                Log.debug("SessionMonitor._start: session_state:", session_state, ", sub:", this._sub);
            }
            else {
                this._sub = undefined;
                this._sid = undefined;
                Log.debug("SessionMonitor._start: session_state:", session_state, ", anonymous user");
            }

            if (!this._checkSessionIFrame) {
                try {
                    const url = await this._metadataService.getCheckSessionIframe();
                    if (url) {
                        Log.debug("SessionMonitor._start: Initializing check session iframe")

                        let client_id = this._client_id;
                        let interval = this._checkSessionInterval;
                        let stopOnError = this._stopCheckSessionOnError;

                        this._checkSessionIFrame = new this._CheckSessionIFrameCtor(this._callback.bind(this), client_id, url, interval, stopOnError);
                        await this._checkSessionIFrame.load();
                        this._checkSessionIFrame &&
                        this._checkSessionIFrame.start(session_state);
                    }
                    else {
                        Log.warn("SessionMonitor._start: No check session iframe found in the metadata");
                    }
                }
                catch (err) {
                    // catch to suppress errors since we're in non-promise callback
                    Log.error("SessionMonitor._start: Error from getCheckSessionIframe:", err.message);
                }
            }
            else {
                this._checkSessionIFrame.start(session_state);
            }
        }
    }

    _stop() {
        this._sub = undefined;
        this._sid = undefined;

        if (this._checkSessionIFrame) {
            Log.debug("SessionMonitor._stop");
            this._checkSessionIFrame.stop();
        }

        if (this._settings.monitorAnonymousSession) {
            // using a timer to delay re-initialization to avoid race conditions during signout
            let timerHandle = this._timer.setInterval(async () => {
                this._timer.clearInterval(timerHandle);

                try {
                    const session: any = await this._userManager.querySessionStatus();
                    let tmpUser = {
                        session_state: session.session_state,
                        profile: session.sub && session.sid ? {
                            sub: session.sub,
                            sid: session.sid
                        } : null
                    };
                    this._start(tmpUser);
                }
                catch(err) {
                    // catch to suppress errors since we're in a callback
                    Log.error("SessionMonitor: error from querySessionStatus:", err.message);
                }
            }, 1000);
        }
    }

    async _callback() {
        try {
            const session: any = await this._userManager.querySessionStatus();
            var raiseEvent = true;

            if (session && this._checkSessionIFrame) {
                if (session.sub === this._sub) {
                    raiseEvent = false;
                    this._checkSessionIFrame.start(session.session_state);

                    if (session.sid === this._sid) {
                        Log.debug("SessionMonitor._callback: Same sub still logged in at OP, restarting check session iframe; session_state:", session.session_state);
                    }
                    else {
                        Log.debug("SessionMonitor._callback: Same sub still logged in at OP, session state has changed, restarting check session iframe; session_state:", session.session_state);
                        this._userManager.events._raiseUserSessionChanged();
                    }
                }
                else {
                    Log.debug("SessionMonitor._callback: Different subject signed into OP:", session.sub);
                }
            }
            else {
                Log.debug("SessionMonitor._callback: Subject no longer signed into OP");
            }

            if (raiseEvent) {
                if (this._sub) {
                    Log.debug("SessionMonitor._callback: SessionMonitor._callback; raising signed out event");
                    this._userManager.events._raiseUserSignedOut();
                }
                else {
                    Log.debug("SessionMonitor._callback: SessionMonitor._callback; raising signed in event");
                    this._userManager.events._raiseUserSignedIn();
                }
            }
        }
        catch(err) {
            if (this._sub) {
                Log.debug("SessionMonitor._callback: Error calling queryCurrentSigninSession; raising signed out event", err.message);
                this._userManager.events._raiseUserSignedOut();
            }
        }
    }
}
