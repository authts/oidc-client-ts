// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Log } from "./utils";

export class InMemoryWebStorage implements Storage {
    private _data: Record<string, any>;

    constructor() {
        this._data = {};
    }

    clear(): void {
        Log.debug("InMemoryWebStorage.clear");
        this._data = {};
    }

    getItem(key: string) {
        Log.debug("InMemoryWebStorage.getItem", key);
        return this._data[key];
    }

    setItem(key: string, value: any) {
        Log.debug("InMemoryWebStorage.setItem", key);
        this._data[key] = value;
    }

    removeItem(key: string) {
        Log.debug("InMemoryWebStorage.removeItem", key);
        delete this._data[key];
    }

    get length() {
        return Object.getOwnPropertyNames(this._data).length;
    }

    key(index: number) {
        return Object.getOwnPropertyNames(this._data)[index];
    }
}
