// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Logger } from "./utils";

/**
 * @public
 */
export class InMemoryWebStorage implements Storage {
    private readonly _logger = new Logger("InMemoryWebStorage");
    private _data: Record<string, string> = {};

    public clear(): void {
        this._logger.create("clear");
        this._data = {};
    }

    public getItem(key: string): string {
        this._logger.create(`getItem('${key}')`);
        return this._data[key];
    }

    public setItem(key: string, value: string): void {
        this._logger.create(`setItem('${key}')`);
        this._data[key] = value;
    }

    public removeItem(key: string): void {
        this._logger.create(`removeItem('${key}')`);
        delete this._data[key];
    }

    public get length(): number {
        return Object.getOwnPropertyNames(this._data).length;
    }

    public key(index: number): string {
        return Object.getOwnPropertyNames(this._data)[index];
    }
}
