// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Log, IntervalTimer, g_timer } from "./utils";
import { CheckSessionIFrame } from "./CheckSessionIFrame";
import { UserManager } from "./UserManager";
import { User } from "./User";

export class SessionMonitor {
    private readonly _userManager: UserManager;
    private readonly _timer: IntervalTimer;
    private _sub: any;
    private _sid: any;
    private _checkSessionIFrame?: CheckSessionIFrame;

    public constructor(userManager: UserManager) {
        if (!userManager) {
            Log.error("SessionMonitor.ctor: No user manager passed to SessionMonitor");
            throw new Error("userManager");
        }

        this._userManager = userManager;
        this._timer = g_timer;

        this._userManager.events.addUserLoaded(this._start.bind(this));
        this._userManager.events.addUserUnloaded(this._stop.bind(this));

        Promise.resolve(this._init())
            .catch((err: Error) => {
            // catch to suppress errors since we're in a ctor
                Log.error("SessionMonitor ctor: error:", err.message);
            });
    }

    protected async _init(): Promise<void> {
        const user = await this._userManager.getUser();
        // doing this manually here since calling getUser
        // doesn't trigger load event.
        if (user) {
            void this._start(user);
        }
        else if (this._userManager.settings.monitorAnonymousSession) {
            const session = await this._userManager.querySessionStatus();
            if (session) {
                const tmpUser = {
                    session_state: session.session_state,
                    profile: session.sub && session.sid ? {
                        sub: session.sub,
                        sid: session.sid
                    } : null
                };
                void this._start(tmpUser);
            }
        }
    }

    protected async _start(user: User | {
        session_state: string;
            profile: {
                sub: string;
                sid: string;
            } | null;
    }): Promise<void> {
        const session_state = user.session_state;
        if (!session_state) {
            return;
        }

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

        if (this._checkSessionIFrame) {
            this._checkSessionIFrame.start(session_state);
            return;
        }

        try {
            const url = await this._userManager.metadataService.getCheckSessionIframe();
            if (url) {
                Log.debug("SessionMonitor._start: Initializing check session iframe");

                const client_id = this._userManager.settings.client_id;
                const intervalInSeconds = this._userManager.settings.checkSessionIntervalInSeconds;
                const stopOnError = this._userManager.settings.stopCheckSessionOnError;

                const checkSessionIFrame = new CheckSessionIFrame(this._callback.bind(this), client_id, url, intervalInSeconds, stopOnError);
                await checkSessionIFrame.load();
                this._checkSessionIFrame = checkSessionIFrame;
                checkSessionIFrame.start(session_state);
            }
            else {
                Log.warn("SessionMonitor._start: No check session iframe found in the metadata");
            }
        }
        catch (err) {
            // catch to suppress errors since we're in non-promise callback
            Log.error("SessionMonitor._start: Error from getCheckSessionIframe:", err instanceof Error ? err.message : err);
        }
    }

    protected _stop(): void {
        this._sub = undefined;
        this._sid = undefined;

        if (this._checkSessionIFrame) {
            Log.debug("SessionMonitor._stop");
            this._checkSessionIFrame.stop();
        }

        if (this._userManager.settings.monitorAnonymousSession) {
            // using a timer to delay re-initialization to avoid race conditions during signout
            // TODO rewrite to use promise correctly
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            const timerHandle = this._timer.setInterval(async () => {
                this._timer.clearInterval(timerHandle);

                try {
                    const session: any = await this._userManager.querySessionStatus();
                    const tmpUser = {
                        session_state: session.session_state,
                        profile: session.sub && session.sid ? {
                            sub: session.sub,
                            sid: session.sid
                        } : null
                    };
                    void this._start(tmpUser);
                }
                catch (err) {
                    // catch to suppress errors since we're in a callback
                    Log.error("SessionMonitor: error from querySessionStatus:", err instanceof Error ? err.message : err);
                }
            }, 1000);
        }
    }

    protected async _callback(): Promise<void> {
        try {
            const session: any = await this._userManager.querySessionStatus();
            let raiseEvent = true;

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
        catch (err) {
            if (this._sub) {
                Log.debug("SessionMonitor._callback: Error calling queryCurrentSigninSession; raising signed out event",
                    err instanceof Error ? err.message : err);
                this._userManager.events._raiseUserSignedOut();
            }
        }
    }
}
