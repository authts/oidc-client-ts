// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

let offsetInMilliseconds = 0;

/**
 * Clock used for the timestamps the library signs itself, such as the `iat`
 * of DPoP proofs and client assertions. These timestamps are validated by the
 * authorization server against its own clock, so a wrong device clock makes
 * the requests fail. Set an offset (server time minus local time) to correct it.
 *
 * @public
 */
export namespace Clock { // eslint-disable-line @typescript-eslint/no-namespace
    export function reset(): void {
        offsetInMilliseconds = 0;
    }

    export function setOffset(value: number): void {
        if (!Number.isFinite(value)) {
            throw new Error("Invalid clock offset");
        }
        offsetInMilliseconds = value;
    }

    export function getEpochTime(): number {
        return Math.floor((Date.now() + offsetInMilliseconds) / 1000);
    }
}
