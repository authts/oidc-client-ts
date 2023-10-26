// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Logger } from "./utils";
import type { StateStore } from "./StateStore";

/**
 * @public
 */
export class BrowserStorageStateStore implements StateStore {
    private readonly _logger = new Logger("BrowserStorageStateStore");
    private readonly _store: chrome.storage.StorageArea;
    private readonly _prefix: string;

    public constructor({
        prefix = "oidc.",
        store = chrome.storage.local,
    }: { prefix?: string; store?: chrome.storage.StorageArea } = {}) {
        this._store = store;
        this._prefix = prefix;
    }

    public async set(key: string, value: string): Promise<void> {
        this._logger.create(`set('${key}')`);

        key = this._prefix + key;
        await this._store.set({ [key]: value });
    }

    public async get(key: string): Promise<string | null> {
        this._logger.create(`get('${key}')`);

        key = this._prefix + key;
        const itemQuery = await this._store.get(key);
        const item = String(itemQuery[key]) ?? null;
        return item;
    }

    public async remove(key: string): Promise<string | null> {
        this._logger.create(`remove('${key}')`);

        key = this._prefix + key;
        const itemQuery = await this._store.get(key);
        await this._store.remove(key);
        const item = String(itemQuery[key]) ?? null;
        return item;
    }

    public async getAllKeys(): Promise<string[]> {
        this._logger.create("getAllKeys");

        const itemQuery = await this._store.get();
        const keys = Object.keys(itemQuery).filter((key) => key.indexOf(this._prefix) === 0);
        return keys.map((key) => key.substring(this._prefix.length));
    }
}
