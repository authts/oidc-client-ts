// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Log } from './Log';

export class Event {
    protected _name: string;
    private _callbacks: ((...ev: any[]) => void)[];

    constructor(name: string) {
        this._name = name;
        this._callbacks = [];
    }

    addHandler(cb: (...ev: any[]) => void) {
        this._callbacks.push(cb);
    }

    removeHandler(cb: (...ev: any[]) => void) {
        var idx = this._callbacks.findIndex(item => item === cb);
        if (idx >= 0) {
            this._callbacks.splice(idx, 1);
        }
    }

    raise(...params: any[]) {
        Log.debug("Event: Raising event: " + this._name);
        for (let i = 0; i < this._callbacks.length; i++) {
            this._callbacks[i](...params);
        }
    }
}
