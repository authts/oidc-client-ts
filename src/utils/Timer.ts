// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Event } from "./Event";
import { Logger } from "./Logger";

/**
 * @internal
 */
export class Timer extends Event<[void]> {
    protected readonly _logger = new Logger(`Timer('${this._name}')`);
    private _timerHandle: ReturnType<typeof setInterval> | null = null;
    private _expiration = 0;

    // get the time
    public static getEpochTime(): number {
        return Math.floor(Date.now() / 1000);
    }

    public init(durationInSeconds: number): void {
        const logger = this._logger.create("init");
        durationInSeconds = Math.max(Math.floor(durationInSeconds), 1);
        const expiration = Timer.getEpochTime() + durationInSeconds;
        if (this.expiration === expiration && this._timerHandle) {
            // no need to reinitialize to same expiration, so bail out
            logger.debug("skipping since already initialized for expiration at", this.expiration);
            return;
        }

        this.cancel();

        logger.debug("using duration", durationInSeconds);
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
        this._logger.create("cancel");
        if (this._timerHandle) {
            clearInterval(this._timerHandle);
            this._timerHandle = null;
        }
    }

    protected _callback = (): void => {
        const diff = this._expiration - Timer.getEpochTime();
        this._logger.debug("timer completes in", diff);

        if (this._expiration <= Timer.getEpochTime()) {
            this.cancel();
            void super.raise();
        }
    };
}
