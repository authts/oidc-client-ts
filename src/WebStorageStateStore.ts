// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Logger } from "./utils";
import type { StateStore } from "./StateStore";

/**
 * @public
 */
export class WebStorageStateStore implements StateStore {
    private readonly _logger = new Logger("WebStorageStateStore");

    private readonly _store: Storage;
    private readonly _prefix: string;

    public constructor({ prefix = "oidc.", store = localStorage } = {}) {
        this._store = store;
        this._prefix = prefix;
    }

    public set(key: string, value: string): Promise<void> {
        this._logger.debug("set", key);

        key = this._prefix + key;
        this._store.setItem(key, value);
        return Promise.resolve();
    }

    public get(key: string): Promise<string | null> {
        this._logger.debug("get", key);

        key = this._prefix + key;
        const item = this._store.getItem(key);
        return Promise.resolve(item);
    }

    public remove(key: string): Promise<string | null> {
        this._logger.debug("remove", key);

        key = this._prefix + key;
        const item = this._store.getItem(key);
        this._store.removeItem(key);
        return Promise.resolve(item);
    }

    public getAllKeys(): Promise<string[]> {
        this._logger.debug("getAllKeys");

        const keys = [];
        for (let index = 0; index < this._store.length; index++) {
            const key = this._store.key(index);
            if (key && key.indexOf(this._prefix) === 0) {
                keys.push(key.substr(this._prefix.length));
            }
        }
        return Promise.resolve(keys);
    }
}
