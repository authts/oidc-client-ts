// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Event } from "./Event";

/**
 * @internal
 */
export class Timer extends Event<[void]> {
    private _timerHandle: ReturnType<typeof setInterval> | null = null;
    private _expiration = 0;

    // get the time
    public static getEpochTime(): number {
        return Math.floor(Date.now() / 1000);
    }

    public init(durationInSeconds: number): void {
        durationInSeconds = Math.max(Math.floor(durationInSeconds), 1);
        const expiration = Timer.getEpochTime() + durationInSeconds;
        if (this.expiration === expiration && this._timerHandle) {
            // no need to reinitialize to same expiration, so bail out
            this._logger.debug("init timer " + this._name + " skipping initialization since already initialized for expiration:", this.expiration);
            return;
        }

        this.cancel();

        this._logger.debug("init timer " + this._name + " for duration:", durationInSeconds);
        this._expiration = expiration;

        // we're using a fairly short timer and then checking the expiration in the
        // callback to handle scenarios where the browser device sleeps, and then
        // the timers end up getting delayed.
        const timerDurationInSeconds = Math.min(durationInSeconds, 5);
        this._timerHandle = setInterval(this._callback, timerDurationInSeconds * 1000);
    }

    public get expiration(): number {
        return this._expiration;
    }

    public cancel(): void {
        if (this._timerHandle) {
            this._logger.debug("cancel: ", this._name);
            clearInterval(this._timerHandle);
            this._timerHandle = null;
        }
    }

    protected _callback = (): void => {
        const diff = this._expiration - Timer.getEpochTime();
        this._logger.debug("_callback: " + this._name + " timer expires in:", diff);

        if (this._expiration <= Timer.getEpochTime()) {
            this.cancel();
            super.raise();
        }
    };
}
