// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import type { AsyncStorage } from "./AsyncStorage";
import { Logger } from "./utils";

/**
 * @public
 */
export class AsyncInMemoryWebStorage implements AsyncStorage {
    private readonly _logger = new Logger("InMemoryWebStorage");
    private _data: Record<string, string> = {};

    public clear(): Promise<void> {
        this._logger.create("clear");
        this._data = {};
        return Promise.resolve();
    }

    public getItem(key: string): Promise<string> {
        this._logger.create(`getItem('${key}')`);
        return Promise.resolve(this._data[key]);
    }

    public setItem(key: string, value: string): Promise<void> {
        this._logger.create(`setItem('${key}')`);
        this._data[key] = value;
        return Promise.resolve();
    }

    public removeItem(key: string): Promise<void> {
        this._logger.create(`removeItem('${key}')`);
        delete this._data[key];
        return Promise.resolve();
    }

    public get length(): Promise<number> {
        return Promise.resolve(Object.getOwnPropertyNames(this._data).length);
    }

    public key(index: number): Promise<string> {
        return Promise.resolve(Object.getOwnPropertyNames(this._data)[index]);
    }
}
