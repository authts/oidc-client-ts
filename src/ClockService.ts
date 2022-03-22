// Copyright (C) AuthTS Contributors
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

/**
 * A clock service (and accompanying server side time API) is required for large scale applications as incorrect user
 * clocks are not uncommon.
 *
 * Examples where clock skew occurs due to an incorrect client side clock, where the clock is still "correct" in terms
 * of wall clock time:
 * - Incorrect DST settings
 * - Incorrect timezone settings
 * - Incorrect 12 hour clock (AM/PM switched by user error)
 *
 * Default implementation is using `Math.floor(Date.now() / 1000)`
 *
 * The clock service can be implemented like:
 * ```jsx
 * class ServerClockService extends ClockService {
 *   private _offset = 0;
 *   public getEpochTime(): number {
 *     return super.getEpochTime() + _offset;
 *   }
 *
 *   public async synchronize(): Promise<void> {
 *     const serverTime = await fetchServerTime();
 *     this._offset = serverTime - super.getEpochTime();
 *   }
 * }
 * ```
 *
 * @public
 */
export class ClockService {
    public getEpochTime(): number {
        return Math.floor(Date.now() / 1000);
    }
}
