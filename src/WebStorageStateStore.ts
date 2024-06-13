// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Logger } from "./utils";
import type { StateStore } from "./StateStore";
import type { AsyncStorage } from "./AsyncStorage";

/**
 * @public
 */
export class WebStorageStateStore implements StateStore {
    private readonly _logger = new Logger("WebStorageStateStore");

    private readonly _store: AsyncStorage | Storage;
    private readonly _prefix: string;

    public constructor({
        prefix = "oidc.",
        store = localStorage,
    }: { prefix?: string; store?: AsyncStorage | Storage } = {}) {
        this._store = store;
        this._prefix = prefix;
    }

    public async set(key: string, value: string): Promise<void> {
        this._logger.create(`set('${key}')`);

        key = this._prefix + key;
        await this._store.setItem(key, value);
    }

    public async get(key: string): Promise<string | null> {
        this._logger.create(`get('${key}')`);

        key = this._prefix + key;
        const item = await this._store.getItem(key);
        return item;
    }

    public async remove(key: string): Promise<string | null> {
        this._logger.create(`remove('${key}')`);

        key = this._prefix + key;
        const item = await this._store.getItem(key);
        await this._store.removeItem(key);
        return item;
    }

    public async getAllKeys(): Promise<string[]> {
        this._logger.create("getAllKeys");
        const len = await this._store.length;

        const keys = [];
        for (let index = 0; index < len; index++) {
            const key = await this._store.key(index);
            if (key && key.indexOf(this._prefix) === 0) {
                keys.push(key.substr(this._prefix.length));
            }
        }
        return keys;
    }
}
