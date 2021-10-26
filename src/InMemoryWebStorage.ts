// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Logger } from "./utils";

/**
 * @public
 */
export class InMemoryWebStorage implements Storage {
    private readonly _logger: Logger;
    private _data: Record<string, string>;

    public constructor() {
        this._logger = new Logger("InMemoryWebStorage");
        this._data = {};
    }

    public clear(): void {
        this._logger.debug("clear");
        this._data = {};
    }

    public getItem(key: string): string {
        this._logger.debug("getItem", key);
        return this._data[key];
    }

    public setItem(key: string, value: string): void {
        this._logger.debug("setItem", key);
        this._data[key] = value;
    }

    public removeItem(key: string): void {
        this._logger.debug("removeItem", key);
        delete this._data[key];
    }

    public get length(): number {
        return Object.getOwnPropertyNames(this._data).length;
    }

    public key(index: number): string {
        return Object.getOwnPropertyNames(this._data)[index];
    }
}
