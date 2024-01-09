// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Logger } from "./Logger";

/**
 * @internal
 */
export type Callback<EventType extends unknown[]> = (...ev: EventType) => (Promise<void> | void);

/**
 * @internal
 */
export class Event<EventType extends unknown[]> {
    protected readonly _logger = new Logger(`Event('${this._name}')`);

    private _callbacks: Array<Callback<EventType>> = [];

    public constructor(protected readonly _name: string) {}

    public addHandler(cb: Callback<EventType>): () => void {
        this._callbacks.push(cb);
        return () => this.removeHandler(cb);
    }

    public removeHandler(cb: Callback<EventType>): void {
        const idx = this._callbacks.lastIndexOf(cb);
        if (idx >= 0) {
            this._callbacks.splice(idx, 1);
        }
    }

    public async raise(...ev: EventType): Promise<void> {
        this._logger.debug("raise:", ...ev);
        for (const cb of this._callbacks) {
            await cb(...ev);
        }
    }
}
