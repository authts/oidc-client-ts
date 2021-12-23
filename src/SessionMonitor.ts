// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Logger } from "./utils";
import { CheckSessionIFrame } from "./CheckSessionIFrame";
import type { UserManager } from "./UserManager";
import type { User } from "./User";

/**
 * @public
 */
export class SessionMonitor {
    private readonly _logger = new Logger("SessionMonitor");

    private _sub: string | undefined;
    private _sid: string | undefined;
    private _checkSessionIFrame?: CheckSessionIFrame;

    public constructor(private readonly _userManager: UserManager) {
        if (!_userManager) {
            this._logger.error("ctor: No user manager passed to SessionMonitor");
            throw new Error("userManager");
        }

        this._userManager.events.addUserLoaded(this._start);
        this._userManager.events.addUserUnloaded(this._stop);

        Promise.resolve(this._init())
            .catch((err: Error) => {
            // catch to suppress errors since we're in a ctor
                this._logger.error("ctor: error:", err.message);
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
                        sid: session.sid,
                    } : null,
                };
                void this._start(tmpUser);
            }
        }
    }

    protected _start = async (
        user: User | {
            session_state: string;
            profile: { sub: string; sid: string } | null;
        },
    ): Promise<void> => {
        const session_state = user.session_state;
        if (!session_state) {
            return;
        }

        if (user.profile) {
            this._sub = user.profile.sub;
            this._sid = user.profile.sid;
            this._logger.debug("_start: session_state:", session_state, ", sub:", this._sub);
        }
        else {
            this._sub = undefined;
            this._sid = undefined;
            this._logger.debug("_start: session_state:", session_state, ", anonymous user");
        }

        if (this._checkSessionIFrame) {
            this._checkSessionIFrame.start(session_state);
            return;
        }

        try {
            const url = await this._userManager.metadataService.getCheckSessionIframe();
            if (url) {
                this._logger.debug("_start: Initializing check session iframe");

                const client_id = this._userManager.settings.client_id;
                const intervalInSeconds = this._userManager.settings.checkSessionIntervalInSeconds;
                const stopOnError = this._userManager.settings.stopCheckSessionOnError;

                const checkSessionIFrame = new CheckSessionIFrame(this._callback, client_id, url, intervalInSeconds, stopOnError);
                await checkSessionIFrame.load();
                this._checkSessionIFrame = checkSessionIFrame;
                checkSessionIFrame.start(session_state);
            }
            else {
                this._logger.warn("_start: No check session iframe found in the metadata");
            }
        }
        catch (err) {
            // catch to suppress errors since we're in non-promise callback
            this._logger.error("_start: Error from getCheckSessionIframe:", err instanceof Error ? err.message : err);
        }
    };

    protected _stop = (): void => {
        this._sub = undefined;
        this._sid = undefined;

        if (this._checkSessionIFrame) {
            this._logger.debug("_stop");
            this._checkSessionIFrame.stop();
        }

        if (this._userManager.settings.monitorAnonymousSession) {
            // using a timer to delay re-initialization to avoid race conditions during signout
            // TODO rewrite to use promise correctly
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            const timerHandle = setInterval(async () => {
                clearInterval(timerHandle);

                try {
                    const session = await this._userManager.querySessionStatus();
                    if (session) {
                        const tmpUser = {
                            session_state: session.session_state,
                            profile: session.sub && session.sid ? {
                                sub: session.sub,
                                sid: session.sid,
                            } : null,
                        };
                        void this._start(tmpUser);
                    }
                }
                catch (err) {
                    // catch to suppress errors since we're in a callback
                    this._logger.error("_stop: error from querySessionStatus:", err instanceof Error ? err.message : err);
                }
            }, 1000);
        }
    };

    protected _callback = async (): Promise<void> => {
        try {
            const session = await this._userManager.querySessionStatus();
            let raiseEvent = true;

            if (session && this._checkSessionIFrame) {
                if (session.sub === this._sub) {
                    raiseEvent = false;
                    this._checkSessionIFrame.start(session.session_state);

                    if (session.sid === this._sid) {
                        this._logger.debug("_callback: Same sub still logged in at OP, restarting check session iframe; session_state:", session.session_state);
                    }
                    else {
                        this._logger.debug("_callback: Same sub still logged in at OP, session state has changed, restarting check session iframe; session_state:", session.session_state);
                        this._userManager.events._raiseUserSessionChanged();
                    }
                }
                else {
                    this._logger.debug("_callback: Different subject signed into OP:", session.sub);
                }
            }
            else {
                this._logger.debug("_callback: Subject no longer signed into OP");
            }

            if (raiseEvent) {
                if (this._sub) {
                    this._logger.debug("_callback: SessionMonitor._callback; raising signed out event");
                    this._userManager.events._raiseUserSignedOut();
                }
                else {
                    this._logger.debug("_callback: SessionMonitor._callback; raising signed in event");
                    this._userManager.events._raiseUserSignedIn();
                }
            }
        }
        catch (err) {
            if (this._sub) {
                this._logger.debug("_callback: Error calling queryCurrentSigninSession; raising signed out event",
                    err instanceof Error ? err.message : err);
                this._userManager.events._raiseUserSignedOut();
            }
        }
    };
}
